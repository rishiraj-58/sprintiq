import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { db } from '@/db';
import { workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { WorkspaceTasksClient } from './tasksClient';

interface PageProps {
  params: { workspaceId: string };
}

export default async function WorkspaceTasksPage({ params }: PageProps) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');
  const { workspaceId } = params;

  const [m] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, workspaceId)));
  if (!m) redirect('/workspaces');

  return <WorkspaceTasksClient workspaceId={workspaceId} />;
}


