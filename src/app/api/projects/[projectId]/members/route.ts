import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projectMembers, profiles, projects, workspaceMembers } from '@/db/schema';
import { ensureCoreSchema } from '@/db/maintenance';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    await ensureCoreSchema();
    const user = await requireAuth();
    const { projectId } = params;

    // Must have view in project context
    const caps = await PermissionManager.getUserCapabilities(user.id, projectId, 'project');
    if (!caps.includes('view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await db
      .select({
        id: profiles.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        email: profiles.email,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .innerJoin(profiles, eq(projectMembers.profileId, profiles.id))
      .where(eq(projectMembers.projectId, projectId));

    // Also fetch workspace members for convenience in UI (to add to project)
    const [proj] = await db.select({ workspaceId: projects.workspaceId }).from(projects).where(eq(projects.id, projectId));
    let workspaceMembersList: Array<{ id: string; firstName: string | null; lastName: string | null; email: string | null; role: string }>= [];
    if (proj) {
      workspaceMembersList = await db
        .select({
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          email: profiles.email,
          role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .innerJoin(profiles, eq(workspaceMembers.profileId, profiles.id))
        .where(eq(workspaceMembers.workspaceId, proj.workspaceId));
    }

    return NextResponse.json({ members, workspaceMembers: workspaceMembersList });
  } catch (e) {
    console.error('GET project members error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    await ensureCoreSchema();
    const user = await requireAuth();
    const { projectId } = params;
    const body = await req.json();
    const { profileId, email, role } = body as { profileId?: string; email?: string; role: 'owner' | 'manager' | 'member' | 'viewer' };

    if ((!profileId && !email) || !role) {
      return NextResponse.json({ error: 'profileId or email and role required' }, { status: 400 });
    }

    const caps = await PermissionManager.getUserCapabilities(user.id, projectId, 'project');
    if (!caps.includes('manage_members')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Resolve profileId from email if needed
    let resolvedProfileId = profileId;
    if (!resolvedProfileId && email) {
      const [p] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, email));
      if (!p) {
        // Auto-create invitation that includes projectId when user not found
        const { invitations } = await import('@/db/schema');
        const inviterCaps = await PermissionManager.getUserCapabilities(user.id, projectId, 'project');
        if (!inviterCaps.includes('manage_members')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const [proj] = await db.select({ workspaceId: projects.workspaceId }).from(projects).where(eq(projects.id, projectId));
        if (!proj) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        await db.insert(invitations).values({ workspaceId: proj.workspaceId, email, role: 'member', invitedById: user.id, projectId });
        return NextResponse.json({ invited: true });
      }
      resolvedProfileId = p.id;
    }

    // Upsert membership
    const [existing] = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.profileId, resolvedProfileId!)));

    const capabilities =
      role === 'owner'
        ? '["view", "create", "edit", "delete", "manage_members", "manage_settings"]'
        : role === 'manager'
        ? '["view", "create", "edit", "manage_members"]'
        : role === 'viewer'
        ? '["view"]'
        : '["view", "create", "edit"]';

    if (existing) {
      const [updated] = await db
        .update(projectMembers)
        .set({ role, capabilities })
        .where(eq(projectMembers.id, existing.id))
        .returning();
      return NextResponse.json({ member: updated });
    } else {
      const [created] = await db
        .insert(projectMembers)
        .values({ projectId, profileId: resolvedProfileId!, role, capabilities })
        .returning();
      return NextResponse.json({ member: created });
    }
  } catch (e) {
    console.error('POST project members error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    await ensureCoreSchema();
    const user = await requireAuth();
    const { projectId } = params;
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    const caps = await PermissionManager.getUserCapabilities(user.id, projectId, 'project');
    if (!caps.includes('manage_members')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.profileId, profileId)));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE project member error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


