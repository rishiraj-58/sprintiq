import nodemailer from 'nodemailer';

type InvitationEmailProps = {
  email: string;
  workspaceName: string;
  inviterName: string;
  invitationLink: string;
};

type EmailResult = {
  messageId: string;
  testAccount?: boolean;
  previewUrl?: string;
};

// Define transport config type for Gmail
type TransportConfig = {
  host?: string;
  port?: number;
  secure?: boolean;
  service?: string;
  auth: {
    user: string | undefined;
    pass: string | undefined;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
};

export async function sendInvitationEmail({
  email,
  workspaceName,
  inviterName,
  invitationLink,
}: InvitationEmailProps): Promise<EmailResult> {
  console.log('=== SEND INVITATION EMAIL STARTED ===');
  console.log('Email params:', { email, workspaceName, inviterName, invitationLink });
  
  try {
    console.log('1. Checking email credentials...');
    console.log('Attempting to send invitation email to:', email);
    
    let testAccount;
    let isTestAccount = false;
    
    // Create a test account if no email credentials are provided
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      console.log('2. No email credentials found, creating Ethereal test account...');
      testAccount = await nodemailer.createTestAccount();
      isTestAccount = true;
    } else {
      console.log('2. Email credentials found:', {
        user: process.env.EMAIL_SERVER_USER,
        password: process.env.EMAIL_SERVER_PASSWORD ? 'SET' : 'NOT SET'
      });
    }

    const isGmail = process.env.EMAIL_SERVER_HOST?.includes('gmail');
    console.log('3. Is Gmail:', isGmail);

    let transportConfig: TransportConfig;

    if (isGmail) {
      console.log('4. Using Gmail-specific configuration');
      transportConfig = {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD, // This should be your App Password
        },
      };
    } else {
        console.log(`4. Using custom SMTP configuration for: ${process.env.EMAIL_SERVER_HOST || 'Ethereal'}`);
        transportConfig = {
            host: process.env.EMAIL_SERVER_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
            secure: process.env.EMAIL_SERVER_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_SERVER_USER || testAccount?.user,
                pass: process.env.EMAIL_SERVER_PASSWORD || testAccount?.pass,
            },
            tls: {
                // Do not fail on invalid certificates
                rejectUnauthorized: false
            }
        };
    }

    console.log('5. Transport config created:', {
      service: transportConfig.service,
      host: transportConfig.host,
      port: transportConfig.port,
      secure: transportConfig.secure,
      authUser: transportConfig.auth.user ? 'SET' : 'NOT SET',
      authPass: transportConfig.auth.pass ? 'SET' : 'NOT SET'
    });

    const transporter = nodemailer.createTransport(transportConfig);

    // Verify SMTP connection
    console.log('6. Verifying SMTP connection...');
    await transporter.verify();
    console.log('7. SMTP connection verified successfully.');

    const mailOptions = {
      from: `"SprintIQ" <${process.env.EMAIL_FROM || 'noreply@sprintiq.app'}>`,
      to: email,
      subject: `You've been invited to join ${workspaceName} on SprintIQ`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join ${workspaceName}</h2>
          <p>${inviterName} has invited you to collaborate on SprintIQ.</p>
          <div style="margin: 30px 0;">
            <a href="${invitationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>This invitation will expire in 7 days.</p>
          <hr style="border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="color: #666; font-size: 14px;">The SprintIQ Team</p>
        </div>
      `,
    };

    console.log('8. Mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    console.log('9. Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('10. Email sent successfully:', info.messageId);
    
    const result: EmailResult = { messageId: info.messageId };
    
    if (isTestAccount && info) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('11. Preview URL: %s', previewUrl);
      result.testAccount = true;
      result.previewUrl = previewUrl as string;
    }
    
    console.log('=== SEND INVITATION EMAIL COMPLETED ===');
    return result;

  } catch (error) {
    console.error('=== SEND INVITATION EMAIL FAILED ===');
    console.error('Failed to send invitation email:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      command: (error as any)?.command
    });
    throw new Error('Failed to send email.');
  }
}