import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { projectService } from '@/services/project';

// Handler to get projects for a specific workspace
export async function GET(req: Request) {
  try {
    const profile = await requireAuth();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return new NextResponse('Workspace ID is required', { status: 400 });
    }

    // You might want to add a check here to ensure the user is a member of this workspace
    
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