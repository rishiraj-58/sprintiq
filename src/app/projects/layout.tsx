import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardProvider } from '@/app/dashboard/DashboardProvider';
import { DashboardNav } from '@/components/layout/DashboardNav';

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
      <div className="min-h-screen flex">
        {/* Sidebar Navigation */}
        <DashboardNav />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </DashboardProvider>
  );
}