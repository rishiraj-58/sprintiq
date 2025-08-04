import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';

export default async function AuthCallbackPage() {
  const profile = await getCurrentUserProfile();

  // If a profile exists and onboarding is complete, go to the dashboard.
  if (profile?.onboardingCompleted) {
    redirect('/dashboard');
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