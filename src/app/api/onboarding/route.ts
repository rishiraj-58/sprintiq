import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { profiles, workspaces, workspaceMembers, invitations } from '@/db/schema';
import { sendInvitationEmail } from '@/lib/email';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const profile = await requireAuth();
    const body = await req.json();
    const { firstName, lastName, intent, workspaceName, invites } = body;

    console.log('=== ONBOARDING API CALLED ===');
    console.log('Request data:', { firstName, lastName, intent, workspaceName, invites });

    let systemRole: 'manager' | 'member' = 'member'; // Default to member
    let newWorkspaceId: string | null = null;

    // 1. Update the user's profile with their name and determine system role
    if (intent === 'create') {
      systemRole = 'manager'; // A workspace creator is a manager
    }

    console.log('1. Updating user profile...');
    await db
      .update(profiles)
      .set({ 
        firstName, 
        lastName,
        systemRole: systemRole,
      })
      .where(eq(profiles.id, profile.id));
    console.log('2. Profile updated successfully');

    // 2. If the intent is to create a workspace
    if ((intent === 'create' || intent === 'explore') && workspaceName) {
        console.log('3. Creating workspace...');
        // Create the workspace
        const [newWorkspace] = await db
          .insert(workspaces)
          .values({
            name: workspaceName,
            createdById: profile.id,
          })
          .returning();
        
        newWorkspaceId = newWorkspace.id;
        console.log('4. Workspace created:', newWorkspaceId);
  
        // Make the user the owner of the new workspace
        console.log('5. Adding user as workspace owner...');
        await db
          .insert(workspaceMembers)
          .values({
            workspaceId: newWorkspace.id,
            profileId: profile.id,
            role: 'owner', // In their own workspace, they are always the owner
            // Owners get all capabilities
            capabilities: '["view", "create", "edit", "delete", "manage_members", "manage_settings"]', 
          });
        console.log('6. User added as workspace owner');
      }

    // 3. Create invitation records and send emails if provided
    if (invites && invites.length > 0 && newWorkspaceId) {
      console.log('7. Processing email invitations...');
      
      // Create invitation records in the database
      const invitationRecords = invites.map((invite: any) => ({
        workspaceId: newWorkspaceId,
        email: invite.email,
        role: invite.role,
        invitedById: profile.id,
      }));

      console.log('8. Creating invitation records in database...');
      const newInvitations = await db.insert(invitations).values(invitationRecords).returning();
      console.log('9. Invitation records created:', newInvitations.length);
      
      // Send email invitations
      for (const invite of newInvitations) {
        try {
          console.log(`10. Sending invitation to: ${invite.email}`);
          
          const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${invite.token}`;
          
          await sendInvitationEmail({
            email: invite.email,
            workspaceName: workspaceName,
            inviterName: `${firstName} ${lastName}`,
            invitationLink: inviteLink,
          });
          
          console.log(`11. Invitation sent successfully to ${invite.email}`);
        } catch (emailError) {
          console.error(`Failed to send invitation to ${invite.email}:`, emailError);
          // Continue with other invitations even if one fails
        }
      }
    }

    // 4. Mark onboarding as complete
    console.log('12. Marking onboarding as complete...');
    await db
      .update(profiles)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(profiles.id, profile.id));
    
    console.log('13. Onboarding completed successfully');
      
    return NextResponse.json({ 
      success: true, 
      message: "Onboarding complete",
      workspaceId: newWorkspaceId 
    });

  } catch (error) {
    console.error("=== ONBOARDING API ERROR ===", error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}