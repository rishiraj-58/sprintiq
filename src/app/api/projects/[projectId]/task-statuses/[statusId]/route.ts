import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { taskStatuses } from '@/db/schema';
import { ensureCoreSchema } from '@/db/maintenance';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

// PATCH - Update a specific task status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; statusId: string } }
) {
  try {
    await ensureCoreSchema();
    const profile = await requireAuth();
    const { projectId, statusId } = params;
    const body = await request.json();
    const { name, color, order } = body;

    if (!projectId || !statusId) {
      return NextResponse.json({ error: 'Project ID and Status ID are required' }, { status: 400 });
    }

    // Check if user has manage_settings permission in project context
    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('manage_settings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the task status
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;
    updateData.updatedAt = new Date();

    const [updatedStatus] = await db
      .update(taskStatuses)
      .set(updateData)
      .where(
        and(
          eq(taskStatuses.id, statusId),
          eq(taskStatuses.projectId, projectId)
        )
      )
      .returning();

    if (!updatedStatus) {
      return NextResponse.json({ error: 'Task status not found' }, { status: 404 });
    }

    return NextResponse.json({ status: updatedStatus });

  } catch (error) {
    console.error('PATCH task status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Delete a specific task status
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; statusId: string } }
) {
  try {
    await ensureCoreSchema();
    const profile = await requireAuth();
    const { projectId, statusId } = params;

    if (!projectId || !statusId) {
      return NextResponse.json({ error: 'Project ID and Status ID are required' }, { status: 400 });
    }

    // Check if user has manage_settings permission in project context
    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('manage_settings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the task status
    const [deletedStatus] = await db
      .delete(taskStatuses)
      .where(
        and(
          eq(taskStatuses.id, statusId),
          eq(taskStatuses.projectId, projectId)
        )
      )
      .returning();

    if (!deletedStatus) {
      return NextResponse.json({ error: 'Task status not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedStatus });

  } catch (error) {
    console.error('DELETE task status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
