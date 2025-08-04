import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  // Pass the profile to the client component
  return (
    <div className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center">
      <OnboardingForm profile={profile} />
    </div>
  );
}