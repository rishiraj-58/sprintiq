import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PermissionManager } from '@/lib/permissions';
import { db } from '@/db';
import { and, desc, eq, gte, inArray, lte, or, gt, isNull } from 'drizzle-orm';
import { projects, workspaceMembers, sprints, tasks, taskHistory, profiles } from '@/db/schema';

type NormalizedStatus = 'todo' | 'in_progress' | 'done';

function normalizeStatus(value: string | null | undefined): NormalizedStatus | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/[-\s]/g, '_');
  if (v.includes('done') || v === 'closed' || v === 'resolved') return 'done';
  if (v.includes('in_progress') || v.includes('inprogress') || v.includes('in_review') || v.includes('review')) return 'in_progress';
  if (v.includes('todo') || v.includes('to_do') || v.includes('backlog') || v.includes('to-do')) return 'todo';
  // Fallback: treat unknown non-done statuses as todo
  return 'todo';
}

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function endOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(23, 59, 59, 999);
  return n;
}

function eachDayInclusive(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;

    const url = new URL(request.url);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');

    const endDate = endOfDay(parseDateParam(endParam) ?? new Date());
    const defaultStart = new Date(endDate);
    defaultStart.setDate(defaultStart.getDate() - 29);
    const startDate = startOfDay(parseDateParam(startParam) ?? defaultStart);

    // AuthZ: must belong to workspace and have view on project
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, project.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('view')) return new NextResponse('Forbidden', { status: 403 });

    // ---- Velocity and Delivery Efficiency (per sprint) ----
    const sprintRows = await db
      .select()
      .from(sprints)
      .where(eq(sprints.projectId, projectId))
      .orderBy(desc(sprints.startDate));

    const lastThreeSprints = sprintRows.slice(0, 3);

    // Fetch per-sprint task points
    const sprintIds = lastThreeSprints.map((s) => s.id);
    let sprintVelocity: Array<{ sprintId: string; sprintName: string; completedPoints: number; totalPoints: number; startDate: string | null; endDate: string | null }>= [];

    if (sprintIds.length > 0) {
      // Get tasks in these sprints
      const sprintTasks = await db
        .select({ id: tasks.id, sprintId: tasks.sprintId, storyPoints: tasks.storyPoints, completedAt: tasks.completedAt })
        .from(tasks)
        .where(and(eq(tasks.projectId, projectId), inArray(tasks.sprintId, sprintIds)));

      for (const s of lastThreeSprints) {
        const tasksInSprint = sprintTasks.filter((t) => t.sprintId === s.id);
        const totalPoints = tasksInSprint.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
        const completedPoints = tasksInSprint
          .filter((t) => (t.completedAt ? true : false))
          .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
        sprintVelocity.push({
          sprintId: s.id,
          sprintName: s.name,
          completedPoints,
          totalPoints,
          startDate: s.startDate ? new Date(s.startDate as unknown as string).toISOString() : null,
          endDate: s.endDate ? new Date(s.endDate as unknown as string).toISOString() : null,
        });
      }
    }

    const averageVelocity = (sprintVelocity.reduce((sum, s) => sum + s.completedPoints, 0)) / 3; // spec: divide by 3

    const mostRecentSprint = sprintRows[0] ?? null;
    let deliveryEfficiencyPercent = 0;
    if (mostRecentSprint) {
      const recentSprintTasks = await db
        .select({ storyPoints: tasks.storyPoints, completedAt: tasks.completedAt })
        .from(tasks)
        .where(and(eq(tasks.projectId, projectId), eq(tasks.sprintId, mostRecentSprint.id)));
      const totalPlanned = recentSprintTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
      const totalCompleted = recentSprintTasks.filter((t) => !!t.completedAt).reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
      deliveryEfficiencyPercent = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;
    }

    // ---- Total Points Delivered (date range) ----
    const completedInRange = await db
      .select({ storyPoints: tasks.storyPoints })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), gte(tasks.completedAt, startDate), lte(tasks.completedAt, endDate)));
    const totalPointsDelivered = completedInRange.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

    // ---- Average Cycle Time (date range) ----
    // Find tasks completed in range along with createdAt
    const completedTasks = await db
      .select({ id: tasks.id, createdAt: tasks.createdAt, completedAt: tasks.completedAt })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), gte(tasks.completedAt, startDate), lte(tasks.completedAt, endDate)));

    let avgCycleTimeDays = 0;
    if (completedTasks.length > 0) {
      const taskIds = completedTasks.map((t) => t.id);
      const inProgressEvents = await db
        .select({ taskId: taskHistory.taskId, newValue: taskHistory.newValue, createdAt: taskHistory.createdAt })
        .from(taskHistory)
        .where(and(inArray(taskHistory.taskId, taskIds), eq(taskHistory.field, 'status')));

      const inProgressByTask: Record<string, Date | null> = {};
      for (const ev of inProgressEvents) {
        const normalized = normalizeStatus(ev.newValue ?? null);
        if (normalized === 'in_progress') {
          const ts = new Date(ev.createdAt as unknown as string);
          const existing = inProgressByTask[ev.taskId];
          if (!existing || ts < existing) {
            inProgressByTask[ev.taskId] = ts;
          }
        }
      }

      const totalDays = completedTasks.reduce((sum, t) => {
        const startTs = inProgressByTask[t.id] ?? new Date(t.createdAt as unknown as string);
        const endTs = new Date(t.completedAt as unknown as string);
        const days = Math.max(0, (endTs.getTime() - startTs.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgCycleTimeDays = totalDays / completedTasks.length;
    }

    // ---- Cumulative Flow Diagram (daily snapshot) ----
    // Pull tasks and status change history up to endDate
    const projectTasks = await db
      .select({ id: tasks.id, status: tasks.status, createdAt: tasks.createdAt, completedAt: tasks.completedAt, sprintId: tasks.sprintId })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    const allTaskIds = projectTasks.map((t) => t.id);
    let statusEvents: Array<{ taskId: string; createdAt: Date; newValue: string | null; oldValue: string | null }> = [];
    if (allTaskIds.length > 0) {
      const raw = await db
        .select({ taskId: taskHistory.taskId, createdAt: taskHistory.createdAt, newValue: taskHistory.newValue, oldValue: taskHistory.oldValue })
        .from(taskHistory)
        .where(and(inArray(taskHistory.taskId, allTaskIds), eq(taskHistory.field, 'status')));
      statusEvents = raw.map((r) => ({ taskId: r.taskId, createdAt: new Date(r.createdAt as unknown as string), newValue: r.newValue, oldValue: r.oldValue }));
    }

    // Build per-task ordered events
    const eventsByTask: Record<string, Array<{ at: Date; status: NormalizedStatus }>> = {};
    for (const t of projectTasks) {
      eventsByTask[t.id] = [];
    }
    for (const ev of statusEvents) {
      const norm = normalizeStatus(ev.newValue);
      if (!norm) continue;
      eventsByTask[ev.taskId]?.push({ at: ev.createdAt, status: norm });
    }
    for (const tid of Object.keys(eventsByTask)) {
      eventsByTask[tid].sort((a, b) => a.at.getTime() - b.at.getTime());
    }

    // Determine initial status per task (best-effort): earliest history oldValue, else current status, else 'todo'
    const initialStatusByTask: Record<string, NormalizedStatus> = {};
    for (const t of projectTasks) {
      const histories = statusEvents.filter((e) => e.taskId === t.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      let initial: NormalizedStatus | null = null;
      if (histories.length > 0) {
        initial = normalizeStatus(histories[0].oldValue);
      }
      if (!initial) initial = normalizeStatus((t.status as unknown as string) ?? null) ?? 'todo';
      initialStatusByTask[t.id] = initial;
    }

    const days = eachDayInclusive(startDate, endDate);
    const cumulativeFlow = days.map((d) => {
      let todo = 0;
      let inProgress = 0;
      let done = 0;
      let backlog = 0;
      for (const t of projectTasks) {
        // Skip tasks created after this day
        const createdAt = new Date(t.createdAt as unknown as string);
        if (createdAt > d) continue;

        // Determine status at day d
        const events = eventsByTask[t.id];
        let status: NormalizedStatus = initialStatusByTask[t.id];
        if (events && events.length > 0) {
          for (const ev of events) {
            if (ev.at <= endOfDay(d)) status = ev.status; else break;
          }
        }
        if (status === 'done') done += 1;
        else if (status === 'in_progress') inProgress += 1;
        else todo += 1;

        // Backlog heuristic: no sprint assigned and not done by day d
        if (!t.sprintId && status !== 'done') backlog += 1;
      }
      return { date: d.toISOString().slice(0, 10), backlog, todo, inProgress, done };
    });

    // ---- Workload Distribution (completed in date range + active snapshot) ----
    const completedWithAssignee = await db
      .select({ assigneeId: tasks.assigneeId, storyPoints: tasks.storyPoints })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), gte(tasks.completedAt, startDate), lte(tasks.completedAt, endDate)));

    const activeNow = await db
      .select({ assigneeId: tasks.assigneeId, storyPoints: tasks.storyPoints, status: tasks.status })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), or(isNull(tasks.completedAt), gt(tasks.completedAt, endDate))));

    const memberMap = new Map<string, { completedTasks: number; completedPoints: number; activeTasks: number; activePoints: number }>();
    for (const row of completedWithAssignee) {
      if (!row.assigneeId) continue;
      const prev = memberMap.get(row.assigneeId) ?? { completedTasks: 0, completedPoints: 0, activeTasks: 0, activePoints: 0 };
      prev.completedTasks += 1;
      prev.completedPoints += row.storyPoints ?? 0;
      memberMap.set(row.assigneeId, prev);
    }
    for (const row of activeNow) {
      if (!row.assigneeId) continue;
      const norm = normalizeStatus(row.status as unknown as string);
      if (norm === 'done') continue;
      const prev = memberMap.get(row.assigneeId) ?? { completedTasks: 0, completedPoints: 0, activeTasks: 0, activePoints: 0 };
      prev.activeTasks += 1;
      prev.activePoints += row.storyPoints ?? 0;
      memberMap.set(row.assigneeId, prev);
    }

    // Enrich with names
    const memberIds = Array.from(memberMap.keys());
    let memberProfiles: Array<{ id: string; firstName: string | null; lastName: string | null }>= [];
    if (memberIds.length > 0) {
      memberProfiles = await db
        .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName })
        .from(profiles)
        .where(inArray(profiles.id, memberIds));
    }
    const workload = memberIds.map((id) => {
      const stats = memberMap.get(id)!;
      const p = memberProfiles.find((x) => x.id === id);
      const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ') || id;
      return { id, name, completedTasks: stats.completedTasks, completedPoints: stats.completedPoints, activeTasks: stats.activeTasks, activePoints: stats.activePoints };
    });

    return NextResponse.json({
      metrics: {
        averageVelocity: Number.isFinite(averageVelocity) ? averageVelocity : 0,
        averageCycleTimeDays: Number.isFinite(avgCycleTimeDays) ? avgCycleTimeDays : 0,
        totalPointsDelivered,
        deliveryEfficiencyPercent,
      },
      velocity: sprintVelocity,
      cumulativeFlow,
      workload,
      range: { start: startDate.toISOString(), end: endDate.toISOString() },
    });
  } catch (e) {
    console.error('GET project reports error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


