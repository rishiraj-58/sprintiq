import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';
import { db } from '@/db';
import { workspaces, workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import SettingsClient from './client';

interface PageProps {
  params: { workspaceId: string };
}

export default async function WorkspaceSettingsPage({ params }: PageProps) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/auth/sign-in');
  const { workspaceId } = params;

  const [membership] = await db
    .select({ id: workspaceMembers.id, role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, workspaceId)));
  if (!membership) redirect('/workspaces');

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
  if (!ws) redirect('/workspaces');

  return <SettingsClient workspace={ws} />;
}


