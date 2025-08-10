import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { db } from '@/db';
import { workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export default async function UsagePage({ params }: { params: { workspaceId: string } }) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');

  const { workspaceId } = params;
  const [membership] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, workspaceId)));
  if (!membership) redirect('/workspaces');
  if (membership.role !== 'owner') redirect(`/dashboard/workspace/${workspaceId}`);

  return (
    <div>
      <h1 className="text-xl font-semibold">Usage</h1>
      <p className="text-sm text-muted-foreground mt-2">Track seats, API calls, storage, and project counts.</p>
    </div>
  );
}


