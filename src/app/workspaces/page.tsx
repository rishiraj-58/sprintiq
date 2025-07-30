import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function WorkspacesPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Workspaces</h2>
        <p className="text-muted-foreground">
          Manage your workspaces and team collaboration.
        </p>
      </div>

      {/* Create Workspace Button */}
      <div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Create Workspace
        </button>
      </div>

      {/* Workspaces Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Empty State */}
        <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
          <h3 className="font-semibold">No workspaces yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first workspace to get started.
          </p>
        </div>
      </div>
    </div>
  );
} 