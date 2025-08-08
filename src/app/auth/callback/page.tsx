import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';
import { workspaceService } from '@/services/workspace';

export default async function AuthCallbackPage() {
  const profile = await getCurrentUserProfile();

  // If a profile exists and onboarding is complete, go to their workspace dashboard
  if (profile?.onboardingCompleted) {
    const userWorkspaces = await workspaceService.fetchUserWorkspaces(profile.id);
    if (userWorkspaces && userWorkspaces.length > 0) {
      redirect(`/dashboard/workspace/${userWorkspaces[0].id}`);
    }
    redirect('/onboarding');
  }
  
  // If a profile exists but onboarding is not complete, go to onboarding.
  if (profile && !profile.onboardingCompleted) {
    redirect('/onboarding');
  }

  // This is a fallback case for new users where the profile might be created
  // just after this check. The redirect from the sign-up page will handle it,
  // but we redirect to onboarding as a safe default.
  redirect('/onboarding');

  // You can optionally return a loading spinner for a better UX,
  // though the redirect is usually instantaneous.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}