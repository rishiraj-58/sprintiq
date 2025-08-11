import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardProvider } from '@/app/dashboard/DashboardProvider';
import { Navbar } from '@/components/layout/Navbar';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  if (!profile.onboardingCompleted) {
    redirect('/onboarding');
  }

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