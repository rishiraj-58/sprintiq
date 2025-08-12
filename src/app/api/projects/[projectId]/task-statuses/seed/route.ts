import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { taskStatuses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

// POST - Seed default task statuses for a project
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if user has manage_settings permission in project context
    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('manage_settings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if project already has task statuses
    const existingStatuses = await db
      .select({ id: taskStatuses.id })
      .from(taskStatuses)
      .where(eq(taskStatuses.projectId, projectId))
      .limit(1);

    if (existingStatuses.length > 0) {
      return NextResponse.json({ error: 'Project already has task statuses' }, { status: 400 });
    }

    // Default task statuses
    const defaultStatuses = [
      { name: 'Backlog', color: '#6B7280', order: 1 },
      { name: 'To Do', color: '#3B82F6', order: 2 },
      { name: 'In Progress', color: '#F59E0B', order: 3 },
      { name: 'In Review', color: '#8B5CF6', order: 4 },
      { name: 'Testing', color: '#EC4899', order: 5 },
      { name: 'Done', color: '#10B981', order: 6 },
      { name: 'Blocked', color: '#EF4444', order: 7 }
    ];

    // Insert default statuses
    const insertedStatuses = await db
      .insert(taskStatuses)
      .values(
        defaultStatuses.map(status => ({
          ...status,
          projectId,
        }))
      )
      .returning();

    return NextResponse.json({ 
      message: 'Default task statuses created successfully',
      statuses: insertedStatuses 
    });

  } catch (error) {
    console.error('Seed task statuses error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
