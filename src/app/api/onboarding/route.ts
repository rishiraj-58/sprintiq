import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { profiles, workspaces, workspaceMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const profile = await requireAuth();
    const body = await req.json();
    const { firstName, lastName, intent, workspaceName } = body;

    let systemRole: 'manager' | 'member' = 'member'; // Default to member

    // 1. Update the user's profile with their name and determine system role
    if (intent === 'create') {
      systemRole = 'manager'; // A workspace creator is a manager
    }

    await db
      .update(profiles)
      .set({ 
        firstName, 
        lastName,
        systemRole: systemRole,
      })
      .where(eq(profiles.id, profile.id));

    // 2. If the intent is to create a workspace
    if ((intent === 'create' || intent === 'explore') && workspaceName) {
        // Create the workspace
        const [newWorkspace] = await db
          .insert(workspaces)
          .values({
            name: workspaceName,
            createdById: profile.id,
          })
          .returning();
  
        // Make the user the owner of the new workspace
        await db
          .insert(workspaceMembers)
          .values({
            workspaceId: newWorkspace.id,
            profileId: profile.id,
            role: 'owner', // In their own workspace, they are always the owner
            // Owners get all capabilities
            capabilities: '["view", "create", "edit", "delete", "manage_members", "manage_settings"]', 
          });
      }

    // 3. Mark onboarding as complete
    await db
      .update(profiles)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(profiles.id, profile.id));
      
    return NextResponse.json({ success: true, message: "Onboarding complete" });

  } catch (error) {
    console.error("Onboarding API Error:", error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}