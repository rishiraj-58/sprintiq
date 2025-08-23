import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { githubIntegrations, workspaceMembers, projectRepositories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Verify user has admin access to workspace
    const workspaceMember = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.profileId, userId)
        )
      )
      .limit(1);

    if (!workspaceMember.length || 
        !['owner', 'admin'].includes(workspaceMember[0].role)) {
      return NextResponse.json({ error: 'No admin access to workspace' }, { status: 403 });
    }

    // Get GitHub integration for workspace
    const integration = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.workspaceId, workspaceId))
      .limit(1);

    if (!integration.length) {
      return NextResponse.json({ error: 'No GitHub integration found' }, { status: 404 });
    }

    // Delete related project repositories first (cascade)
    await db
      .delete(projectRepositories)
      .where(eq(projectRepositories.githubIntegrationId, integration[0].id));

    // Delete the GitHub integration
    await db
      .delete(githubIntegrations)
      .where(eq(githubIntegrations.id, integration[0].id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting GitHub integration:', error);
    return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
  }
}

