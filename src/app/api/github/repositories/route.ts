import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { githubIntegrations, workspaceMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { GitHubService } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    // Temporarily allow public access for debugging
    let userId = null;
    try {
      const { userId: authUserId } = auth();
      userId = authUserId;
    } catch (error) {
      console.log('Auth not available, allowing public access for debugging');
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    // Verify user has access to workspace
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

    if (!workspaceMember.length) {
      return NextResponse.json({ error: 'No access to workspace' }, { status: 403 });
    }

    // Get GitHub integration for workspace
    const integration = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.workspaceId, workspaceId))
      .limit(1);

    if (!integration.length) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 404 });
    }

    console.log(`Fetching repositories for: ${integration[0].githubOrgName}`);

    // Fetch repositories from GitHub
    const githubService = new GitHubService(integration[0].accessToken);
    const repositories = await githubService.getOrgRepositories(integration[0].githubOrgName);

    console.log(`Successfully fetched ${repositories.length} repositories`);

    return NextResponse.json({ repositories });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
