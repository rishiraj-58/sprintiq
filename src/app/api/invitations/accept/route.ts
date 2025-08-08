import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { invitations, profiles, workspaceMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    const body = await request.json();
    const { token, firstName, lastName } = body;

    console.log('=== ACCEPT INVITATION API CALLED ===');
    console.log('Token:', token);
    console.log('User ID:', userId);
    console.log('First Name:', firstName);
    console.log('Last Name:', lastName);

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Retry logic for database operations
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} of ${maxRetries}...`);

        // Find the invitation by token
        console.log('1. Looking up invitation by token...');
         const [invitation] = await db
          .select({
            id: invitations.id,
            workspaceId: invitations.workspaceId,
            email: invitations.email,
            role: invitations.role,
            status: invitations.status,
             projectId: invitations.projectId,
            invitedById: invitations.invitedById,
          })
          .from(invitations)
          .where(eq(invitations.token, token));

        if (!invitation) {
          console.log('2. Invitation not found');
          return NextResponse.json(
            { message: 'Invalid invitation token' },
            { status: 404 }
          );
        }

        console.log('3. Invitation found:', invitation);

        // Check if invitation is already accepted
        if (invitation.status === 'accepted') {
          console.log('4. Invitation already accepted');
          return NextResponse.json(
            { message: 'Invitation has already been accepted' },
            { status: 409 }
          );
        }

        // Check if the invitation email already belongs to a different user
        console.log('5. Checking if invitation email belongs to a different user...');
        const [existingUserWithEmail] = await db
          .select({
            id: profiles.id,
            email: profiles.email,
          })
          .from(profiles)
          .where(eq(profiles.email, invitation.email));

        if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
          console.log('6. Email already belongs to a different user:', existingUserWithEmail.id);
          return NextResponse.json(
            { message: 'This email address is already associated with another account' },
            { status: 409 }
          );
        }

        // Check if current user already has a profile
        console.log('7. Checking if current user has a profile...');
        const [existingProfile] = await db
          .select({
            id: profiles.id,
            email: profiles.email,
            firstName: profiles.firstName,
            lastName: profiles.lastName,
            onboardingCompleted: profiles.onboardingCompleted,
          })
          .from(profiles)
          .where(eq(profiles.id, userId!));

        let profileId: string;

        if (existingProfile) {
          // User already has a profile
          console.log('8. User profile exists:', existingProfile);
          console.log('8a. Onboarding completed status:', existingProfile.onboardingCompleted);
          
          if (existingProfile.email === invitation.email) {
            // Email matches - use existing profile
            console.log('9. Email matches existing profile');
            profileId = existingProfile.id;
            
            // Ensure onboarding is marked as completed for invitation acceptance
            if (!existingProfile.onboardingCompleted) {
              console.log('9a. Marking onboarding as completed for existing user...');
              await db
                .update(profiles)
                .set({ onboardingCompleted: true })
                .where(eq(profiles.id, userId!));
              console.log('9b. Onboarding marked as completed');
            } else {
              console.log('9a. Onboarding already completed for existing user');
            }
          } else {
            // Email doesn't match - user cannot accept invitation for different email
            console.log('9. Email mismatch - user cannot accept invitation for different email');
            return NextResponse.json(
              { message: 'You can only accept invitations for your registered email address' },
              { status: 403 }
            );
          }
        } else {
          // New user - create profile
          console.log('8. Creating new user profile...');

          if (!firstName || !lastName) {
            console.log('9. Missing first name or last name for new user');
            return NextResponse.json(
              { message: 'First name and last name are required for new users' },
              { status: 400 }
            );
          }

          // Create new profile
          const [newProfile] = await db
            .insert(profiles)
            .values({
              id: userId,
              email: invitation.email,
              firstName,
              lastName,
              systemRole: 'member',
              onboardingCompleted: true,
            })
            .returning();

          profileId = newProfile.id;
          console.log('9. New profile created:', profileId);
          console.log('9a. New profile onboarding status:', newProfile.onboardingCompleted);
        }

        // Check if user is already a member of this workspace
        console.log('10. Checking if user is already a workspace member...');
        const [existingMember] = await db
          .select()
          .from(workspaceMembers)
          .where(
            eq(workspaceMembers.workspaceId, invitation.workspaceId) &&
            eq(workspaceMembers.profileId, profileId)
          );

        if (existingMember) {
          console.log('11. User is already a workspace member');
          return NextResponse.json(
            { message: 'You are already a member of this workspace' },
            { status: 409 }
          );
        }

        // Add user to workspace
        console.log('12. Adding user to workspace...');
        await db
          .insert(workspaceMembers)
          .values({
            workspaceId: invitation.workspaceId,
            profileId: profileId,
            role: invitation.role,
            capabilities:
              invitation.role === 'manager'
                ? '["view", "create", "edit", "delete", "manage_members"]'
                : invitation.role === 'viewer'
                ? '["view"]'
                : '["view", "create", "edit"]',
          });

        // If invite includes projectId, add minimal project membership
        if (invitation.projectId) {
          // Insert project member
          const { projectMembers } = await import('@/db/schema');
          await db
            .insert(projectMembers)
            .values({
              projectId: invitation.projectId,
              profileId: profileId,
              role: 'member',
              capabilities: '["view", "create", "edit"]',
            })
            .returning();
        }

        // Update invitation status to accepted
        console.log('13. Updating invitation status...');
        await db
          .update(invitations)
          .set({ status: 'accepted' })
          .where(eq(invitations.id, invitation.id));

        // Final verification - ensure profile has onboarding completed
        console.log('14. Verifying profile onboarding status...');
        const [finalProfile] = await db
          .select({ onboardingCompleted: profiles.onboardingCompleted })
          .from(profiles)
          .where(eq(profiles.id, profileId));
        
        console.log('14a. Final profile onboarding status:', finalProfile?.onboardingCompleted);

        console.log('15. Invitation accepted successfully');

        return NextResponse.json({
          success: true,
          message: 'Invitation accepted successfully',
          workspaceId: invitation.workspaceId,
        });

      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        // If it's a connection timeout and we have more retries, wait and try again
        if (attempt < maxRetries && (error.code === 'CONNECT_TIMEOUT' || error.code === 'ECONNRESET')) {
          console.log(`Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        // If it's not a connection issue or we're out of retries, throw the error
        throw error;
      }
    }

    // If we get here, all retries failed
    throw lastError;

  } catch (error) {
    console.error('=== ACCEPT INVITATION API ERROR ===', error);
    
    // Provide more specific error messages
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'CONNECT_TIMEOUT') {
        return NextResponse.json(
          { message: 'Database connection timeout. Please try again.' },
          { status: 503 }
        );
      }
      if (error.code === 'ECONNRESET') {
        return NextResponse.json(
          { message: 'Database connection lost. Please try again.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 