import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { getCurrentUserProfile } from '@/lib/auth';
import { DashboardProvider } from './DashboardProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  // If there's no profile, redirect to sign-in
  if (!profile) {
    redirect('/auth/sign-in');
  }

  // If the user has not completed onboarding, redirect them
  if (!profile.onboardingCompleted) {
    redirect('/onboarding');
  }

  // The server-side logic remains, ensuring security.
  // The client provider is wrapped around the content.
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </div>
    </DashboardProvider>
  );
}