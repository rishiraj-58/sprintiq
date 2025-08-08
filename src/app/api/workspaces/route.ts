import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { workspaces, workspaceMembers } from '@/db/schema';
import { workspaceService } from '@/services/workspace';

export async function GET(req: Request) {
  try {
    const profile = await requireAuth();
    const userWorkspaces = await workspaceService.fetchUserWorkspaces(profile.id);
    return NextResponse.json(userWorkspaces);
  } catch (error) {
    console.error("API Error fetching workspaces:", error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
      const profile = await requireAuth();
      const { name, description } = await req.json();
  
      if (!name) {
        return new NextResponse('Workspace name is required', { status: 400 });
      }
  
      // Enforce permission to create workspaces (system-level)
      // Allow if systemRole is admin or manager; owners implicitly have it via context, but here new context doesn't exist yet
      if (!['admin', 'manager'].includes(profile.systemRole)) {
        return new NextResponse('Forbidden: insufficient permission to create workspace', { status: 403 });
      }

      // Create the new workspace
      const [newWorkspace] = await db
        .insert(workspaces)
        .values({
          name,
          description,
          createdById: profile.id,
        })
        .returning();
  
      // Make the creator the owner of the new workspace
      await db.insert(workspaceMembers).values({
        workspaceId: newWorkspace.id,
        profileId: profile.id,
        role: 'owner',
        capabilities: '["view", "create", "edit", "delete", "manage_members", "manage_settings"]',
      });
  
      return NextResponse.json(newWorkspace);
  
    } catch (error) {
      console.error("API Error creating workspace:", error);
      if (error instanceof Error && error.message.includes('Not authenticated')) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }