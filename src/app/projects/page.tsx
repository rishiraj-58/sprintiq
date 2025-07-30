import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <p className="text-muted-foreground">
          Manage and track all your projects.
        </p>
      </div>

      {/* Create Project Button */}
      <div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Create Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Empty State */}
        <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
          <h3 className="font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
        </div>
      </div>
    </div>
  );
} 