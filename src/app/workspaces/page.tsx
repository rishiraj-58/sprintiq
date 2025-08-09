import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { workspaceService } from '@/services/workspace';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import WorkspaceSearchAndList from './WorkspaceSearchAndList';

export default async function WorkspacesPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');

  const userWorkspaces = await workspaceService.fetchUserWorkspaces(profile.id);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold">SprintIQ <span className="text-muted-foreground">/</span> Workspaces</h1>
        <Link href="/workspaces/new">
          <Button>Create Workspace</Button>
        </Link>
      </div>

      <WorkspaceSearchAndList initialItems={userWorkspaces} />
    </div>
  );
}