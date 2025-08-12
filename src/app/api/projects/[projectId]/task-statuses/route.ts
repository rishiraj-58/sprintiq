import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { taskStatuses, projects } from '@/db/schema';
import { ensureCoreSchema } from '@/db/maintenance';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

// GET - Fetch all task statuses for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await ensureCoreSchema();
    const profile = await requireAuth();
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if user has view permission in project context
    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all task statuses for the project, ordered by their order field
    const statuses = await db
      .select()
      .from(taskStatuses)
      .where(eq(taskStatuses.projectId, projectId))
      .orderBy(taskStatuses.order);

    return NextResponse.json({ statuses });

  } catch (error) {
    console.error('GET task statuses error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Create a new task status
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await ensureCoreSchema();
    const profile = await requireAuth();
    const { projectId } = params;
    const body = await request.json();
    const { name, color, order } = body;

    if (!projectId || !name) {
      return NextResponse.json({ error: 'Project ID and name are required' }, { status: 400 });
    }

    // Check if user has manage_settings permission in project context
    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('manage_settings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create the new task status
    const [newStatus] = await db
      .insert(taskStatuses)
      .values({
        name,
        color: color || '#3B82F6',
        order: order || 0,
        projectId,
      })
      .returning();

    return NextResponse.json({ status: newStatus });

  } catch (error) {
    console.error('POST task status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
