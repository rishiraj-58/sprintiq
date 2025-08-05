import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { invitations, workspaces, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // Make authentication optional for validation
    let userId: string | null = null;
    try {
      const authResult = auth();
      userId = authResult.userId;
    } catch (error) {
      // User is not authenticated, which is fine for validation
      console.log('User not authenticated for validation');
    }

    console.log('=== VALIDATE INVITATION API CALLED ===');
    console.log('Token:', token);
    console.log('User ID:', userId);

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
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
            createdAt: invitations.createdAt,
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

        // Check if invitation is expired (7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (invitation.createdAt && invitation.createdAt < sevenDaysAgo) {
          console.log('4. Invitation expired');
          return NextResponse.json(
            { message: 'Invitation has expired' },
            { status: 410 }
          );
        }

        // Check if invitation is already accepted
        if (invitation.status === 'accepted') {
          console.log('5. Invitation already accepted');
          return NextResponse.json(
            { message: 'Invitation has already been accepted' },
            { status: 409 }
          );
        }

        // Get workspace information
        console.log('6. Fetching workspace information...');
        const [workspace] = await db
          .select({
            id: workspaces.id,
            name: workspaces.name,
            createdById: workspaces.createdById,
          })
          .from(workspaces)
          .where(eq(workspaces.id, invitation.workspaceId));

        if (!workspace) {
          console.log('7. Workspace not found');
          return NextResponse.json(
            { message: 'Workspace not found' },
            { status: 404 }
          );
        }

        // Get inviter information
        console.log('8. Fetching inviter information...');
        const [inviter] = await db
          .select({
            firstName: profiles.firstName,
            lastName: profiles.lastName,
          })
          .from(profiles)
          .where(eq(profiles.id, workspace.createdById));

        // Check if user with this email already exists
        console.log('9. Checking if user exists...');
        const [existingUser] = await db
          .select({
            id: profiles.id,
            firstName: profiles.firstName,
            lastName: profiles.lastName,
          })
          .from(profiles)
          .where(eq(profiles.email, invitation.email));

        // If user is authenticated, check if their email matches the invitation
        if (userId) {
          console.log('10. Checking authenticated user email match...');
          const [authenticatedUser] = await db
            .select({
              id: profiles.id,
              email: profiles.email,
            })
            .from(profiles)
            .where(eq(profiles.id, userId));

          if (authenticatedUser && authenticatedUser.email !== invitation.email) {
            console.log('11. Email mismatch for authenticated user');
            return NextResponse.json(
              { 
                message: 'You can only accept invitations for your registered email address',
                emailMismatch: true,
                userEmail: authenticatedUser.email,
                invitationEmail: invitation.email
              },
              { status: 403 }
            );
          }
        }

        const isNewUser = !existingUser;
        console.log('12. Is new user:', isNewUser);

        console.log('13. Validation completed successfully');

        return NextResponse.json({
          invitation: {
            id: invitation.id,
            workspaceId: invitation.workspaceId,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            workspaceName: workspace.name,
            inviterName: inviter ? `${inviter.firstName} ${inviter.lastName}` : 'A team member',
          },
          isNewUser,
          existingUser: existingUser ? {
            id: existingUser.id,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
          } : null,
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
    console.error('=== VALIDATE INVITATION API ERROR ===', error);
    
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