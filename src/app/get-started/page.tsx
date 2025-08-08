import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { workspaceService } from '@/services/workspace';

export default async function GetStartedPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');

  const workspaces = await workspaceService.fetchUserWorkspaces(profile.id);
  if (!workspaces || workspaces.length === 0) {
    redirect('/onboarding');
  }
  redirect(`/dashboard/workspace/${workspaces[0].id}`);
}


