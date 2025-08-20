import { db } from '@/db';
import { bugs, projects, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BugManagementClient } from './BugManagementClient';

export default async function ProjectBugsPage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId;
  
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  
  const bugsWithDetails = await db
    .select({
      id: bugs.id,
      title: bugs.title,
      description: bugs.description,
      status: bugs.status,
      severity: bugs.severity,
      projectId: bugs.projectId,
      reporterId: bugs.reporterId,
      assigneeId: bugs.assigneeId,
      createdAt: bugs.createdAt,
      updatedAt: bugs.updatedAt,
      resolvedAt: bugs.resolvedAt,
      reporter: {
        id: profiles.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
      }
    })
    .from(bugs)
    .leftJoin(profiles, eq(bugs.reporterId, profiles.id))
    .where(eq(bugs.projectId, projectId))
    .orderBy(bugs.updatedAt)
    .then(bugs => bugs.map(bug => ({
      ...bug,
      createdAt: bug.createdAt || new Date(),
      updatedAt: bug.updatedAt || new Date(),
    })));

  return (
    <BugManagementClient 
      projectId={projectId}
      projectName={project?.name || ''}
      initialBugs={bugsWithDetails}
    />
  );
}


