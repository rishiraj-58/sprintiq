import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {profile.firstName || 'User'}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">My Tasks</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Active Projects</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Team Members</h3>
          <p className="text-3xl font-bold">1</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border">
        <div className="p-6">
          <h3 className="font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">
            No recent activity to show.
          </p>
        </div>
      </div>
    </div>
  );
}