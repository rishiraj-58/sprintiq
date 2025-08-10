import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { sprints, milestones, releases, calendarEvents, projectPhases, capacityWindows, policies, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    await requireAuth();
    const { projectId } = params;
    const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!p) return new NextResponse('Project not found', { status: 404 });

    const today = new Date();
    const addDays = (d: number) => new Date(today.getTime() + d * 86400000);

    // Sprints
    await db.insert(sprints).values([
      { projectId, name: 'Sprint 1', status: 'active', startDate: addDays(-14), endDate: addDays(0) },
      { projectId, name: 'Sprint 2', status: 'planning', startDate: addDays(1), endDate: addDays(14) },
    ]);

    // Milestones
    await db.insert(milestones).values([
      { projectId, name: 'Alpha', status: 'planned', dueDate: addDays(7) },
      { projectId, name: 'Beta', status: 'planned', dueDate: addDays(21) },
      { projectId, name: 'GA', status: 'planned', dueDate: addDays(35) },
    ]);

    // Releases
    await db.insert(releases).values([
      { projectId, name: 'v1.0.0', date: addDays(22), notes: 'Initial public release' },
      { projectId, name: 'v1.1.0', date: addDays(40), notes: 'Minor improvements' },
    ]);

    // Calendar events
    await db.insert(calendarEvents).values([
      { projectId, name: 'Design Review', date: addDays(3), kind: 'meeting' },
      { projectId, name: 'External Security Audit', date: addDays(18), kind: 'external' },
      { projectId, name: 'Compliance Signoff', date: addDays(28), kind: 'compliance' },
    ]);

    // Phases
    await db.insert(projectPhases).values([
      { projectId, name: 'Discovery', startDate: addDays(-7), endDate: addDays(0), sortOrder: 1 },
      { projectId, name: 'Build', startDate: addDays(1), endDate: addDays(21), sortOrder: 2 },
      { projectId, name: 'Stabilization', startDate: addDays(22), endDate: addDays(35), sortOrder: 3 },
      { projectId, name: 'Launch', startDate: addDays(36), endDate: addDays(40), sortOrder: 4 },
    ]);

    // Capacity windows
    await db.insert(capacityWindows).values([
      { projectId, name: 'Team Leave', startDate: addDays(10), endDate: addDays(12), kind: 'leave' },
      { projectId, name: 'Holiday', startDate: addDays(25), endDate: addDays(25), kind: 'holiday' },
    ]);

    // Policies
    await db.insert(policies).values([
      { projectId, name: 'Code Freeze', startDate: addDays(20), endDate: addDays(22), kind: 'code_freeze' },
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('seed timeline failed', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


