import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { workspaceService } from '@/services/workspace';

export default async function WorkspaceFallbackPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');

  const userWorkspaces = await workspaceService.fetchUserWorkspaces(profile.id);
  if (!userWorkspaces || userWorkspaces.length === 0) {
    redirect('/onboarding');
  }
  redirect(`/dashboard/workspace/${userWorkspaces[0].id}`);
}







