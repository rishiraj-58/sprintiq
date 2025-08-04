import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Navbar } from '@/components/layout/Navbar';
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
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden w-64 border-r bg-muted/40 md:block">
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-4 p-8">
                <DashboardNav />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}