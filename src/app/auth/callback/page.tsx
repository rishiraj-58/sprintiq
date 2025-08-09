import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';

export default async function AuthCallbackPage() {
  const profile = await getCurrentUserProfile();

  if (profile) {
    redirect('/workspaces');
  }

  redirect('/auth/sign-in');

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}