import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { ProjectOverviewPage } from './ProjectOverviewPage';

interface ProjectDetailPageProps {
  params: {
    projectId: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;

    if (!projectId) {
      notFound();
    }

    // Fetch the project
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      notFound();
    }

    // Check if the user is a member of the workspace that the project belongs to
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, project.workspaceId)
        )
      );

    if (!membership) {
      notFound();
    }

    return <ProjectOverviewPage project={project} />;

  } catch (error) {
    console.error('Error fetching project:', error);
    notFound();
  }
} 