import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { invitations, profiles, workspaceMembers, projects as projectsTable, projectMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { ensureCoreSchema } from '@/db/maintenance';

export async function POST(req: Request) {
  try {
    const profile = await requireAuth();
    await ensureCoreSchema();

    const { token, firstName, lastName } = (await req.json()) as {
      token: string;
      firstName?: string;
      lastName?: string;
    };

    if (!token) {
      return NextResponse.json({ message: 'Invitation code is required' }, { status: 400 });
    }

    // Fetch invitation
    const [invite] = await db
      .select({
        id: invitations.id,
        workspaceId: invitations.workspaceId,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        createdAt: invitations.createdAt,
        projectId: invitations.projectId,
      })
      .from(invitations)
      .where(eq(invitations.token, token));

    if (!invite) {
      return NextResponse.json({ message: 'Invalid invitation code' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ message: 'Invitation is not valid anymore' }, { status: 409 });
    }

    // Expiry: 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (invite.createdAt && invite.createdAt < sevenDaysAgo) {
      return NextResponse.json({ message: 'Invitation has expired' }, { status: 410 });
    }

    // Update profile names if provided
    if ((firstName && firstName.trim().length > 0) || (lastName && lastName.trim().length > 0)) {
      await db
        .update(profiles)
        .set({
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
          onboardingCompleted: true,
        })
        .where(eq(profiles.id, profile.id));
    } else {
      // At least mark onboarding complete
      await db.update(profiles).set({ onboardingCompleted: true }).where(eq(profiles.id, profile.id));
    }

    // Ensure email matches invitation
    const [current] = await db.select({ email: profiles.email }).from(profiles).where(eq(profiles.id, profile.id));
    if (current?.email && invite.email && current.email !== invite.email) {
      return NextResponse.json({ message: 'This invitation belongs to a different email' }, { status: 403 });
    }

    // Add to workspace (if not already)
    const [existingWsMember] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, invite.workspaceId), eq(workspaceMembers.profileId, profile.id)));

    if (!existingWsMember) {
      const capabilities =
        invite.role === 'manager'
          ? '["view","create","edit","delete","manage_members"]'
          : invite.role === 'viewer'
          ? '["view"]'
          : invite.role === 'owner'
          ? '["view","create","edit","delete","manage_members","manage_settings"]'
          : '["view","create","edit"]';

      await db.insert(workspaceMembers).values({
        workspaceId: invite.workspaceId,
        profileId: profile.id,
        role: invite.role,
        capabilities,
      });
    }

    // If invitation is project-level, add to project
    if (invite.projectId) {
      const [existingProjMember] = await db
        .select({ id: projectMembers.id })
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, invite.projectId), eq(projectMembers.profileId, profile.id)));

      if (!existingProjMember) {
        await db.insert(projectMembers).values({
          projectId: invite.projectId,
          profileId: profile.id,
          role: 'member',
          capabilities: '["view","create","edit"]',
        });
      }
    }

    // Mark invitation accepted
    await db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invite.id));

    return NextResponse.json({ success: true, workspaceId: invite.workspaceId, projectId: invite.projectId ?? null });
  } catch (error) {
    console.error('=== ONBOARDING JOIN ERROR ===', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


