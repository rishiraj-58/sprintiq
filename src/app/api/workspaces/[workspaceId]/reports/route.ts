import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PermissionManager } from '@/lib/permissions';
import { db } from '@/db';
import {
  projects,
  workspaceMembers,
  sprints,
  tasks,
  taskHistory,
  profiles,
} from '@/db/schema';
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lte,
  or,
  gt,
  isNull,
} from 'drizzle-orm';

type NormalizedStatus = 'todo' | 'in_progress' | 'done';

function normalizeStatus(value: string | null | undefined): NormalizedStatus | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/[-\s]/g, '_');
  if (v.includes('done') || v === 'closed' || v === 'resolved') return 'done';
  if (
    v.includes('in_progress') ||
    v.includes('inprogress') ||
    v.includes('in_review') ||
    v.includes('review')
  )
    return 'in_progress';
  if (
    v.includes('todo') ||
    v.includes('to_do') ||
    v.includes('backlog') ||
    v.includes('to-do')
  )
    return 'todo';
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
  { params }: { params: { workspaceId: string } }
) {
  try {
    const profile = await requireAuth();
    const { workspaceId } = params;

    const url = new URL(request.url);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');

    const endDate = endOfDay(parseDateParam(endParam) ?? new Date());
    const defaultStart = new Date(endDate);
    defaultStart.setDate(defaultStart.getDate() - 29);
    const startDate = startOfDay(parseDateParam(startParam) ?? defaultStart);

    // Must belong to workspace and have view rights
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, workspaceId)
        )
      );
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const caps = await PermissionManager.getUserCapabilities(
      profile.id,
      workspaceId,
      'workspace'
    );
    if (!caps.includes('view')) return new NextResponse('Forbidden', { status: 403 });

    // Fetch projects in workspace
    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));

    const activeProjectsCount = projectRows.filter((p) => (p.status as unknown as string)?.toLowerCase() === 'active').length;
    const projectIds = projectRows.map((p) => p.id);

    // Short-circuit if no projects
    if (projectIds.length === 0) {
      return NextResponse.json({
        metrics: {
          activeProjects: 0,
          teamVelocityAverage: 0,
          totalPointsDelivered: 0,
          onTimeDeliveryPercent: 0,
          workspaceCycleTimeDays: 0,
        },
        burndown: [],
        heatmap: { users: [], projects: [] },
        projectHealth: { onTrack: 0, atRisk: 0, delayed: 0 },
        range: { start: startDate.toISOString(), end: endDate.toISOString() },
      });
    }

    // ---------------- Team Velocity (avg per project of last 3 sprints) ----------------
    const sprintRows = await db
      .select()
      .from(sprints)
      .where(inArray(sprints.projectId, projectIds))
      .orderBy(desc(sprints.startDate));

    const sprintsByProject = new Map<string, typeof sprintRows>();
    for (const s of sprintRows) {
      const list = (sprintsByProject.get(s.projectId) || []) as typeof sprintRows;
      list.push(s);
      sprintsByProject.set(s.projectId, list);
    }

    const lastThreeSprintIds: string[] = [];
    const perProjectLastThree: Record<string, Array<{ id: string; name: string; startDate: string | null; endDate: string | null }>> = {};
    for (const pid of projectIds) {
      const list = (sprintsByProject.get(pid) || []).slice(0, 3);
      perProjectLastThree[pid] = list.map((s) => ({
        id: s.id,
        name: s.name,
        startDate: s.startDate ? (s.startDate as unknown as string) : null,
        endDate: s.endDate ? (s.endDate as unknown as string) : null,
      }));
      for (const s of list) lastThreeSprintIds.push(s.id);
    }

    let tasksInLastThree: Array<{ id: string; sprintId: string | null; storyPoints: number | null; completedAt: Date | null }> = [];
    if (lastThreeSprintIds.length > 0) {
      tasksInLastThree = await db
        .select({ id: tasks.id, sprintId: tasks.sprintId, storyPoints: tasks.storyPoints, completedAt: tasks.completedAt })
        .from(tasks)
        .where(inArray(tasks.sprintId, lastThreeSprintIds));
    }

    const projectAvgVelocities: number[] = [];
    const velocityDetails: Array<{ projectId: string; sprintId: string; sprintName: string; completedPoints: number; totalPoints: number; startDate: string | null; endDate: string | null }> = [];
    for (const pid of projectIds) {
      const sList = perProjectLastThree[pid] || [];
      let sumCompletedAcrossThree = 0;
      for (const s of sList) {
        const tInSprint = tasksInLastThree.filter((t) => t.sprintId === s.id);
        const totalPoints = tInSprint.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
        const completedPoints = tInSprint.filter((t) => t.completedAt).reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
        sumCompletedAcrossThree += completedPoints;
        velocityDetails.push({
          projectId: pid,
          sprintId: s.id,
          sprintName: s.name,
          completedPoints,
          totalPoints,
          startDate: s.startDate,
          endDate: s.endDate,
        });
      }
      const avg = sumCompletedAcrossThree / 3;
      if (Number.isFinite(avg)) projectAvgVelocities.push(avg);
    }
    const teamVelocityAverage = projectAvgVelocities.length > 0 ? projectAvgVelocities.reduce((a, b) => a + b, 0) / projectAvgVelocities.length : 0;

    // ---------------- Total Points Delivered (workspace, date range) ----------------
    const completedInRange = await db
      .select({ storyPoints: tasks.storyPoints })
      .from(tasks)
      .where(
        and(
          inArray(tasks.projectId, projectIds),
          gte(tasks.completedAt, startDate),
          lte(tasks.completedAt, endDate)
        )
      );
    const totalPointsDelivered = completedInRange.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

    // ---------------- On-Time Delivery % (workspace, date range) ----------------
    const completedWithDue = await db
      .select({ dueDate: tasks.dueDate, completedAt: tasks.completedAt })
      .from(tasks)
      .where(
        and(
          inArray(tasks.projectId, projectIds),
          gte(tasks.completedAt, startDate),
          lte(tasks.completedAt, endDate),
          // only consider tasks with a due date
          // drizzle lacks not-null predicate helper; filter after fetch
          )
      );
    const filteredCompletedWithDue = completedWithDue.filter((t) => !!t.dueDate && !!t.completedAt);
    const onTimeCount = filteredCompletedWithDue.filter((t) => new Date(t.completedAt as unknown as string) <= new Date(t.dueDate as unknown as string)).length;
    const onTimeDeliveryPercent = filteredCompletedWithDue.length > 0 ? (onTimeCount / filteredCompletedWithDue.length) * 100 : 0;

    // ---------------- Workspace Cycle Time (date range) ----------------
    const completedTasks = await db
      .select({ id: tasks.id, createdAt: tasks.createdAt, completedAt: tasks.completedAt })
      .from(tasks)
      .where(
        and(
          inArray(tasks.projectId, projectIds),
          gte(tasks.completedAt, startDate),
          lte(tasks.completedAt, endDate)
        )
      );
    let workspaceCycleTimeDays = 0;
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
      workspaceCycleTimeDays = totalDays / completedTasks.length;
    }

    // ---------------- Cross-Project Burndown (aggregate across overlapping sprints) ----------------
    // Consider sprints that overlap the requested range
    const overlappingSprints = sprintRows.filter((s) => {
      const start = s.startDate ? new Date(s.startDate as unknown as string) : null;
      const end = s.endDate ? new Date(s.endDate as unknown as string) : null;
      if (!start || !end) return false;
      return start <= endDate && end >= startDate; // overlap
    });
    const overlappingSprintIds = overlappingSprints.map((s) => s.id);

    let tasksInOverlapping: Array<{ sprintId: string | null; storyPoints: number | null; completedAt: Date | null }> = [];
    if (overlappingSprintIds.length > 0) {
      tasksInOverlapping = await db
        .select({ sprintId: tasks.sprintId, storyPoints: tasks.storyPoints, completedAt: tasks.completedAt })
        .from(tasks)
        .where(inArray(tasks.sprintId, overlappingSprintIds));
    }

    const plannedPointsBySprint = new Map<string, number>();
    for (const sid of overlappingSprintIds) {
      const t = tasksInOverlapping.filter((x) => x.sprintId === sid);
      plannedPointsBySprint.set(
        sid,
        t.reduce((sum, r) => sum + (r.storyPoints ?? 0), 0)
      );
    }

    const days = eachDayInclusive(startDate, endDate);
    const burndown = days.map((d) => {
      const plannedPoints = Array.from(plannedPointsBySprint.values()).reduce((a, b) => a + b, 0);
      let remainingPoints = 0;
      for (const sid of overlappingSprintIds) {
        const sprintTasks = tasksInOverlapping.filter((t) => t.sprintId === sid);
        const rem = sprintTasks
          .filter((t) => !t.completedAt || new Date(t.completedAt as unknown as string) > endOfDay(d))
          .reduce((sum, r) => sum + (r.storyPoints ?? 0), 0);
        remainingPoints += rem;
      }
      return { date: d.toISOString().slice(0, 10), plannedPoints, remainingPoints };
    });

    // ---------------- Resource Allocation Heatmap ----------------
    const completedWithAssignee = await db
      .select({ assigneeId: tasks.assigneeId, storyPoints: tasks.storyPoints, projectId: tasks.projectId })
      .from(tasks)
      .where(
        and(
          inArray(tasks.projectId, projectIds),
          gte(tasks.completedAt, startDate),
          lte(tasks.completedAt, endDate)
        )
      );

    const activeNow = await db
      .select({ assigneeId: tasks.assigneeId, storyPoints: tasks.storyPoints, status: tasks.status, projectId: tasks.projectId, completedAt: tasks.completedAt })
      .from(tasks)
      .where(
        and(
          inArray(tasks.projectId, projectIds),
          or(isNull(tasks.completedAt), gt(tasks.completedAt, endDate))
        )
      );

    type ProjectStats = { activeTasks: number; activePoints: number; completedTasks: number; completedPoints: number };
    const userToProjectStats = new Map<string, Map<string, ProjectStats>>();

    for (const row of completedWithAssignee) {
      if (!row.assigneeId) continue;
      const perProject = userToProjectStats.get(row.assigneeId) || new Map<string, ProjectStats>();
      const prev = perProject.get(row.projectId) || { activeTasks: 0, activePoints: 0, completedTasks: 0, completedPoints: 0 };
      prev.completedTasks += 1;
      prev.completedPoints += row.storyPoints ?? 0;
      perProject.set(row.projectId, prev);
      userToProjectStats.set(row.assigneeId, perProject);
    }
    for (const row of activeNow) {
      if (!row.assigneeId) continue;
      const norm = normalizeStatus(row.status as unknown as string);
      if (norm === 'done') continue;
      const perProject = userToProjectStats.get(row.assigneeId) || new Map<string, ProjectStats>();
      const prev = perProject.get(row.projectId) || { activeTasks: 0, activePoints: 0, completedTasks: 0, completedPoints: 0 };
      prev.activeTasks += 1;
      prev.activePoints += row.storyPoints ?? 0;
      perProject.set(row.projectId, prev);
      userToProjectStats.set(row.assigneeId, perProject);
    }

    const userIds = Array.from(userToProjectStats.keys());
    let memberProfiles: Array<{ id: string; firstName: string | null; lastName: string | null }>= [];
    if (userIds.length > 0) {
      memberProfiles = await db
        .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName })
        .from(profiles)
        .where(inArray(profiles.id, userIds));
    }

    const projectIdToName = new Map(projectRows.map((p) => [p.id, p.name] as const));
    const heatmapUsers = userIds.map((uid) => {
      const perProject = userToProjectStats.get(uid)!;
      const p = memberProfiles.find((x) => x.id === uid);
      const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ') || uid;
      const perProjectList = Array.from(perProject.entries()).map(([projectId, stats]) => ({
        projectId,
        projectName: projectIdToName.get(projectId) || projectId,
        ...stats,
      }));
      const totals = perProjectList.reduce(
        (acc, s) => ({
          activeTasks: acc.activeTasks + s.activeTasks,
          activePoints: acc.activePoints + s.activePoints,
          completedTasks: acc.completedTasks + s.completedTasks,
          completedPoints: acc.completedPoints + s.completedPoints,
        }),
        { activeTasks: 0, activePoints: 0, completedTasks: 0, completedPoints: 0 }
      );
      return { id: uid, name, totals, perProject: perProjectList };
    });

    // ---------------- Project Health Summary ----------------
    // Determine health per project using similar rules as workspace projects endpoint
    // progress = completed/total in the workspace timeframe-agnostic snapshot
    const tasksForProgress = await db
      .select({ projectId: tasks.projectId, status: tasks.status })
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds));
    const progressByProject = new Map<string, { total: number; completed: number }>();
    for (const t of tasksForProgress) {
      const key = t.projectId;
      const rec = progressByProject.get(key) || { total: 0, completed: 0 };
      rec.total += 1;
      const norm = normalizeStatus(t.status as unknown as string);
      if (norm === 'done') rec.completed += 1;
      progressByProject.set(key, rec);
    }
    let onTrack = 0;
    let atRisk = 0;
    let delayed = 0;
    let ahead = 0;
    const now = new Date();
    for (const p of projectRows) {
      const prog = progressByProject.get(p.id) || { total: 0, completed: 0 };
      const progressPct = prog.total > 0 ? (prog.completed / prog.total) * 100 : 0;
      const target = p.targetEndDate as unknown as Date | null;
      let health: 'ahead' | 'on-track' | 'at-risk' | 'delayed' = 'on-track';
      const daysToTarget = target ? (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : null;

      if (target && target < now && progressPct < 100) {
        health = 'delayed';
      } else if (target && daysToTarget !== null && daysToTarget <= 7 && progressPct < 80) {
        health = 'at-risk';
      } else if (target && daysToTarget !== null && ((progressPct >= 100 && daysToTarget > 0) || (daysToTarget > 14 && progressPct >= 80))) {
        // Consider "ahead" if finished early or significantly ahead of schedule with ample time remaining
        health = 'ahead';
      } else {
        health = 'on-track';
      }

      if (health === 'ahead') ahead += 1;
      else if (health === 'on-track') onTrack += 1;
      else if (health === 'at-risk') atRisk += 1;
      else delayed += 1;
    }

    return NextResponse.json({
      metrics: {
        activeProjects: activeProjectsCount,
        teamVelocityAverage: Number.isFinite(teamVelocityAverage) ? teamVelocityAverage : 0,
        totalPointsDelivered,
        onTimeDeliveryPercent,
        workspaceCycleTimeDays: Number.isFinite(workspaceCycleTimeDays) ? workspaceCycleTimeDays : 0,
      },
      burndown,
      heatmap: {
        users: heatmapUsers,
        projects: projectRows.map((p) => ({ id: p.id, name: p.name })),
      },
      projectHealth: { onTrack, atRisk, delayed, ahead },
      range: { start: startDate.toISOString(), end: endDate.toISOString() },
    });
  } catch (e) {
    console.error('GET workspace reports error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


