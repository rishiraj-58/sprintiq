import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { 
  projectRepositories, 
  projectMembers, 
  githubBranches,
  githubPullRequests,
  githubActivities 
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; repositoryId: string } }
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

    // Verify the repository belongs to this project
    const repository = await db
      .select()
      .from(projectRepositories)
      .where(
        and(
          eq(projectRepositories.id, params.repositoryId),
          eq(projectRepositories.projectId, params.projectId)
        )
      )
      .limit(1);

    if (!repository.length) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Delete related data (cascading deletes)
    await Promise.all([
      // Delete GitHub branches
      db.delete(githubBranches)
        .where(eq(githubBranches.projectRepositoryId, params.repositoryId)),
      
      // Delete GitHub pull requests
      db.delete(githubPullRequests)
        .where(eq(githubPullRequests.projectRepositoryId, params.repositoryId)),
      
      // Delete GitHub activities
      db.delete(githubActivities)
        .where(eq(githubActivities.projectRepositoryId, params.repositoryId)),
    ]);

    // Delete the repository link
    await db
      .delete(projectRepositories)
      .where(eq(projectRepositories.id, params.repositoryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking repository:', error);
    return NextResponse.json({ error: 'Failed to unlink repository' }, { status: 500 });
  }
}

