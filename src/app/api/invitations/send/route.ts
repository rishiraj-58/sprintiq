import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { invitations, workspaces } from '@/db/schema';
import { ensureCoreSchema } from '@/db/maintenance';
import { sendInvitationEmail } from '@/lib/email';
import { eq } from 'drizzle-orm';
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

interface Invite {
  email: string;
  role: 'manager' | 'member' | 'viewer';
  projectId?: string; // optional project-level invite
}

export async function POST(req: Request) {
  console.log('=== INVITATION API CALLED ===');
  
  try {
    await ensureCoreSchema();
    console.log('1. Authenticating user...');
    const profile = await requireAuth();
    console.log('2. User authenticated:', profile.id);
    
    console.log('3. Parsing request body...');
    const { workspaceId, invites } = (await req.json()) as { workspaceId: string; invites: Invite[] };
    console.log('4. Request data:', { workspaceId, invites });

    if (!workspaceId || !invites || invites.length === 0) {
      console.log('5. Validation failed - missing required data');
      return new NextResponse('Workspace ID and at least one invite are required', { status: 400 });
    }

    console.log('6. Fetching workspace...');
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
    console.log('7. Workspace found:', workspace?.name);

    // You would add a permission check here in a real app
    // For now, we assume the user is authorized

    console.log('8. Creating invitation records...');
    const invitationRecords = invites.map(invite => ({
      workspaceId,
      email: invite.email,
      role: invite.role,
      invitedById: profile.id,
      projectId: invite.projectId || null,
    }));
    console.log('9. Invitation records:', invitationRecords);

    // Insert all invitations into the database
    console.log('10. Inserting invitations into database...');
    const newInvitations = await db.insert(invitations).values(invitationRecords).returning();
    console.log('11. Invitations created in DB:', newInvitations.length);

    // Check environment variables
    console.log('12. Environment check:', {
      EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
      EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER ? 'SET' : 'NOT SET',
      EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      EMAIL_FROM: process.env.EMAIL_FROM
    });

    // Send an email for each new invitation
    // for (const invite of newInvitations) {
    //   const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/join?token=${invite.token}`;
      
    //   await resend.emails.send({
    //     from: 'onboarding@resend.dev', // Must be a verified domain in Resend
    //     to: invite.email,
    //     subject: `You're invited to join a workspace on SprintIQ`,
    //     html: `<p>You have been invited to join a workspace. Click <a href="${inviteLink}">here</a> to accept.</p>`,
    //   });
    // }

    // Nodemailer utility to send emails
    console.log('13. Starting email sending loop...');
    const emailResults = [];
    
    for (const invite of newInvitations) {
        try {
            console.log(`14. Processing invitation for: ${invite.email}`);
            
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${invite.token}`;
            console.log('15. Generated invite link:', inviteLink);
            
            console.log('16. Calling sendInvitationEmail...');
            const result = await sendInvitationEmail({
              email: invite.email,
              workspaceName: workspace.name,
              inviterName: profile.firstName || 'A team member',
              invitationLink: inviteLink,
            });
            
            console.log(`17. Email sent successfully to ${invite.email}:`, result.messageId);
            emailResults.push({ email: invite.email, success: true, messageId: result.messageId });
            
        } catch (emailError) {
            console.error(`18. Failed to send email to ${invite.email}:`, emailError);
            emailResults.push({ email: invite.email, success: false, error: emailError instanceof Error ? emailError.message : String(emailError) });
        }
    }

    console.log('19. Email sending results:', emailResults);
    console.log('20. Returning success response');

    return NextResponse.json({ 
      success: true, 
      message: 'Invitations sent successfully.',
      emailResults 
    });

  } catch (error) {
    console.error("=== API ERROR ===", error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}