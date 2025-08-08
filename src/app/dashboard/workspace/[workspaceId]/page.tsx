import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { workspaceService } from '@/services/workspace';
import { db } from '@/db';
import { workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { WorkspaceDashboardClient } from '../workspaceClient';

interface PageProps {
  params: { workspaceId: string };
}

export default async function WorkspaceDashboardPage({ params }: PageProps) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');

  const { workspaceId } = params;

  // Ensure the user belongs to this workspace
  const [membership] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, workspaceId)));

  if (!membership) {
    redirect('/workspaces');
  }

  const all = await workspaceService.fetchUserWorkspaces(profile.id);
  const workspace = all.find((w) => w.id === workspaceId) || null;

  return <WorkspaceDashboardClient workspace={workspace} />;
}


