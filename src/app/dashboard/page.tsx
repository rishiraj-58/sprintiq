import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { workspaceService } from '@/services/workspace';

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  // Redirect to the selected/first workspace dashboard (workspace-scoped by default)
  const userWorkspaces = await workspaceService.fetchUserWorkspaces(profile.id);
  if (!userWorkspaces || userWorkspaces.length === 0) {
    redirect('/onboarding');
  }
  // Pick first; client provider will sync last-used later
  redirect(`/dashboard/workspace/${userWorkspaces[0].id}`);
}