import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, workspaceMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const profile = await requireAuth();
    const { workspaceId } = params;

    // Must be a member of the workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.profileId, profile.id)));

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));

    const items = rows.map((p) => ({
      id: p.id,
      name: p.name,
      shortName: p.name.length <= 8 ? p.name : p.name.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase(),
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('compact projects error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


