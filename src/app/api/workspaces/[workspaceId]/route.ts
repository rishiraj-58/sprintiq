import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { workspaces, workspaceMembers, projects } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const profile = await requireAuth();
    const { workspaceId } = params;

    // Only workspace owner can delete
    const [mem] = await db
      .select({ id: workspaceMembers.id, role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, workspaceId)));
    if (!mem || mem.role !== 'owner') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Prevent delete if projects exist (to avoid FK errors); extend later with full cascade
    const existingProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));
    if (existingProjects.length > 0) {
      return NextResponse.json(
        { error: 'Workspace has projects. Delete or move projects first.' },
        { status: 400 }
      );
    }

    // Remove memberships first, then workspace
    await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('Delete workspace failed', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


