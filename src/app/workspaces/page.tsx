import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { workspaceService } from '@/services/workspace';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import WorkspaceSearchAndList from './WorkspaceSearchAndList';
import { WorkspaceNavbar } from '@/components/layout/WorkspaceNavbar';

export default async function WorkspacesPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');

  const userWorkspaces = await workspaceService.fetchUserWorkspaces(profile.id);

  return (
    <div className="min-h-screen bg-background">
      <WorkspaceNavbar />
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <WorkspaceSearchAndList initialItems={userWorkspaces} />
      </div>
    </div>
  );
}