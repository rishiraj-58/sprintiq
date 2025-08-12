import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceMembers, profiles } from '@/db/schema';
import { logAuditEvent } from '@/lib/audit';
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
        and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, workspaceId))
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

export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const profile = await requireAuth();
    const { workspaceId } = params;
    const { profileId, role } = await req.json();
    if (!profileId || !role) return new NextResponse('profileId and role required', { status: 400 });

    const [mem] = await db
      .select({ id: workspaceMembers.id, role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, workspaceId)));
    if (!mem || (mem.role !== 'owner' && mem.role !== 'manager')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const [existing] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.profileId, profileId)));

    if (existing) {
      await db.update(workspaceMembers).set({ role }).where(eq(workspaceMembers.id, existing.id));
      await logAuditEvent({
        workspaceId,
        actorId: profile.id,
        action: 'user.role.change',
        severity: 'medium',
        ipAddress: (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''),
        details: { targetProfileId: profileId, newRole: role },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('update workspace member role error', e);
    return new NextResponse('Internal Server Error', { status: 500 });
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
    await logAuditEvent({
      workspaceId,
      actorId: profile.id,
      action: 'user.remove',
      severity: 'high',
      ipAddress: (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''),
      details: { targetProfileId: profileId },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing workspace member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
