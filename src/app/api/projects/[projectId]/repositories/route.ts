import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { 
  projectRepositories, 
  projectMembers, 
  githubIntegrations,
  projects 
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to project
    const projectMember = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, params.projectId),
          eq(projectMembers.profileId, userId)
        )
      )
      .limit(1);

    if (!projectMember.length) {
      return NextResponse.json({ error: 'No access to project' }, { status: 403 });
    }

    // Get linked repositories for this project
    const repositories = await db
      .select({
        id: projectRepositories.id,
        repositoryName: projectRepositories.repositoryName,
        repositoryFullName: projectRepositories.repositoryFullName,
        githubRepoId: projectRepositories.githubRepoId,
        defaultBranch: projectRepositories.defaultBranch,
        isActive: projectRepositories.isActive,
        createdAt: projectRepositories.createdAt,
      })
      .from(projectRepositories)
      .where(eq(projectRepositories.projectId, params.projectId));

    return NextResponse.json({ repositories });
  } catch (error) {
    console.error('Error fetching project repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has manager/owner access to project
    const projectMember = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, params.projectId),
          eq(projectMembers.profileId, userId)
        )
      )
      .limit(1);

    if (!projectMember.length || 
        !['owner', 'manager'].includes(projectMember[0].role)) {
      return NextResponse.json({ error: 'No admin access to project' }, { status: 403 });
    }

    const body = await request.json();
    const {
      githubIntegrationId,
      repositoryName,
      repositoryFullName,
      githubRepoId,
      defaultBranch,
    } = body;

    if (!githubIntegrationId || !repositoryName || !repositoryFullName || !githubRepoId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Verify the GitHub integration exists and belongs to the project's workspace
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, params.projectId))
      .limit(1);

    if (!project.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const integration = await db
      .select()
      .from(githubIntegrations)
      .where(
        and(
          eq(githubIntegrations.id, githubIntegrationId),
          eq(githubIntegrations.workspaceId, project[0].workspaceId)
        )
      )
      .limit(1);

    if (!integration.length) {
      return NextResponse.json({ error: 'GitHub integration not found' }, { status: 404 });
    }

    // Check if repository is already linked to this project
    const existingLink = await db
      .select()
      .from(projectRepositories)
      .where(
        and(
          eq(projectRepositories.projectId, params.projectId),
          eq(projectRepositories.githubRepoId, githubRepoId)
        )
      )
      .limit(1);

    if (existingLink.length > 0) {
      return NextResponse.json({ error: 'Repository already linked' }, { status: 409 });
    }

    // Create the repository link
    const [repository] = await db
      .insert(projectRepositories)
      .values({
        projectId: params.projectId,
        githubIntegrationId,
        repositoryName,
        repositoryFullName,
        githubRepoId,
        defaultBranch: defaultBranch || 'main',
        linkedById: userId,
      })
      .returning();

    return NextResponse.json({ repository });
  } catch (error) {
    console.error('Error linking repository:', error);
    return NextResponse.json({ error: 'Failed to link repository' }, { status: 500 });
  }
}

