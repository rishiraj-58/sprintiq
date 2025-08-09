import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceMembers, profiles } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const profile = await requireAuth();
    const { workspaceId } = params;

    // Verify the user is a member of this workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        eq(workspaceMembers.profileId, profile.id) &&
        eq(workspaceMembers.workspaceId, workspaceId)
      );

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    // Fetch all workspace members with their profile details
    const members = await db
      .select({
        id: profiles.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(profiles, eq(workspaceMembers.profileId, profiles.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace members' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const profile = await requireAuth();
    const { workspaceId } = params;
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');
    if (!profileId) return new NextResponse('profileId required', { status: 400 });

    // ensure requester is manager/owner of workspace
    const [mem] = await db
      .select({ id: workspaceMembers.id, role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, workspaceId)));
    if (!mem || (mem.role !== 'owner' && mem.role !== 'manager')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await db
      .delete(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.profileId, profileId)));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing workspace member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
