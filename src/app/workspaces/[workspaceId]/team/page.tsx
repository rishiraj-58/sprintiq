import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { db } from '@/db';
import { workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { WorkspaceTeamClient } from './workspaceTeamClient';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Navbar } from '@/components/layout/Navbar';

interface PageProps {
  params: { workspaceId: string };
}

export default async function WorkspaceTeamPage({ params }: PageProps) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');

  const { workspaceId } = params;
  const [membership] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, workspaceId)));

  if (!membership) redirect('/workspaces');

  return (
    <>
      <Navbar />
      <SidebarLayout>
        <WorkspaceTeamClient workspaceId={workspaceId} />
      </SidebarLayout>
    </>
  );
}


