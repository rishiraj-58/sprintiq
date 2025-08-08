import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RoleBasedDashboardClient } from './RoleBasedDashboardClient';

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  return <RoleBasedDashboardClient />;
}