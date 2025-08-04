import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { workspaceMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  const members = await db.select().from(workspaceMembers).where(eq(workspaceMembers.profileId, profile.id));
  const isExplorer = members.length === 1 && profile.systemRole === 'member';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {profile.firstName || 'User'}!
        </p>
      </div>

      {isExplorer && (
        <div className="rounded-lg border bg-accent/50 p-6 text-center">
            <h3 className="font-semibold">Ready to collaborate?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Invite your team to start working on projects together.
            </p>
            <Button>Invite Team</Button>
        </div>
      )}

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