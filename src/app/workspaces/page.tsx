import { getCurrentUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { workspaceService } from '@/services/workspace';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default async function WorkspacesPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');

  const userWorkspaces = await workspaceService.fetchUserWorkspaces(profile.id);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Workspaces</h2>
        <p className="text-muted-foreground">
          Manage your workspaces and team collaboration.
        </p>
      </div>

      <div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Create Workspace
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userWorkspaces.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
            <h3 className="font-semibold">No workspaces yet</h3>
            <p className="text-sm text-muted-foreground">
              Create your first workspace to get started.
            </p>
          </div>
        ) : (
          userWorkspaces.map((ws) => (
            <Link href={`/dashboard/workspace/${ws.id}`} key={ws.id}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <CardTitle>{ws.name}</CardTitle>
                  <CardDescription>{ws.description || 'No description'}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}