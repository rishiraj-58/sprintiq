import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { projectService } from '@/services/project';
import { db } from '@/db';
import { workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm'; 

// Handler to get projects for a specific workspace
export async function GET(req: Request) {
  try {
    const profile = await requireAuth();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return new NextResponse('Workspace ID is required', { status: 400 });
    }

    // Check if the user is a member of the requested workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, workspaceId)
        )
      );

    // If no membership is found, the user is not authorized
    if (!membership) {
      return new NextResponse("Forbidden: You are not a member of this workspace", { status: 403 });
    }
    
    const projects = await projectService.fetchProjects(workspaceId);
    return NextResponse.json(projects);

  } catch (error) {
    console.error("API Error fetching projects:", error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler to create a new project
export async function POST(req: Request) {
  try {
    const profile = await requireAuth();
    const body = await req.json();
    const { name, description, workspaceId } = body;

    if (!name || !workspaceId) {
      return new NextResponse('Name and Workspace ID are required', { status: 400 });
    }
    
    // Require create capability at workspace level for creating projects
    // (Owner/Manager/Member with create rights should be allowed)
    const [membership] = await db
      .select({ role: workspaceMembers.role, capabilities: workspaceMembers.capabilities })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.profileId, profile.id)));

    if (!membership) {
      return new NextResponse('Forbidden: not a member of this workspace', { status: 403 });
    }

    const caps = membership.role === 'owner' ? ['view','create','edit','delete','manage_members','manage_settings'] : JSON.parse(membership.capabilities || '[]');
    if (!caps.includes('create')) {
      return new NextResponse('Forbidden: insufficient permission to create project', { status: 403 });
    }

    const newProject = await projectService.createProject({
      name,
      description,
      workspaceId,
      ownerId: profile.id,
    });

    return NextResponse.json(newProject, { status: 201 });

  } catch (error) {
    console.error("API Error creating project:", error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}