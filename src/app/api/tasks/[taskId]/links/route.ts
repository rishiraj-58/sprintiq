import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, taskLinks, projects, workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;

    const [task] = await db
      .select({ workspaceId: projects.workspaceId })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId));
    if (!task) return new NextResponse('Task not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, task.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const capabilities = await PermissionManager.getUserCapabilities(profile.id, task.workspaceId);
    if (!capabilities.includes('view')) return new NextResponse('Forbidden', { status: 403 });

    const linked = alias(tasks, 'linked');
    const links = await db
      .select({ 
        id: taskLinks.id, 
        linkedTaskId: taskLinks.linkedTaskId, 
        relation: taskLinks.relation,
        linkedTask: {
          id: linked.id,
          title: linked.title,
          status: linked.status,
        }
      })
      .from(taskLinks)
      .leftJoin(linked, eq(taskLinks.linkedTaskId, linked.id))
      .where(eq(taskLinks.taskId, taskId));
    return NextResponse.json(links);
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;
    const { linkedTaskId, relation } = await request.json();
    if (!linkedTaskId || !relation) return new NextResponse('Invalid', { status: 400 });

    const [task] = await db
      .select({ workspaceId: projects.workspaceId })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId));
    if (!task) return new NextResponse('Task not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, task.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const capabilities = await PermissionManager.getUserCapabilities(profile.id, task.workspaceId);
    if (!capabilities.includes('edit')) return new NextResponse('Forbidden', { status: 403 });

    const [created] = await db
      .insert(taskLinks)
      .values({ taskId, linkedTaskId, relation })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


