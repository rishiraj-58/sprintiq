'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InvitationData {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  status: string;
  workspaceName: string;
  inviterName: string;
}

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [isEmailMismatch, setIsEmailMismatch] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }

    if (isLoaded) {
      validateInvitation();
    }
  }, [token, isLoaded]);

  const validateInvitation = async () => {
    try {
      console.log('Validating invitation with token:', token);
      const response = await fetch(`/api/invitations/validate?token=${token}`);
      const data = await response.json();

      console.log('Validation response:', data);

      if (response.ok) {
        setInvitation(data.invitation);
        setIsNewUser(data.isNewUser);
        
        console.log('Invitation validated:', data.invitation);
        console.log('Is new user:', data.isNewUser);
        console.log('Is signed in:', isSignedIn);
        
        // If user is not signed in and is a new user, redirect to sign up
        if (!isSignedIn && data.isNewUser) {
          console.log('Redirecting new user to sign up...');
          // Store invitation data in sessionStorage for after signup
          sessionStorage.setItem('pendingInvitation', JSON.stringify({
            token,
            firstName: '',
            lastName: '',
          }));
          router.push(`/auth/sign-up?redirect_url=${encodeURIComponent('/join?token=' + token)}`);
          return;
        }
        
        // If user is not signed in and is existing user, redirect to sign in
        if (!isSignedIn && !data.isNewUser) {
          console.log('Redirecting existing user to sign in...');
          router.push(`/auth/sign-in?redirect_url=${encodeURIComponent('/join?token=' + token)}`);
          return;
        }
      } else {
        console.error('Validation failed:', data);
        
        // Handle email mismatch error specifically
        if (response.status === 403 && data.emailMismatch) {
          setError(`This invitation is for ${data.invitationEmail}, but you're signed in with ${data.userEmail}. Please sign in with the correct email address.`);
          setIsEmailMismatch(true);
        } else {
          setError(data.message || 'Invalid or expired invitation');
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !isSignedIn) return;

    try {
      setCreatingAccount(true);
      
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: isNewUser ? firstName : undefined,
          lastName: isNewUser ? lastName : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear any pending invitation data
        sessionStorage.removeItem('pendingInvitation');
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to accept invitation');
      }
    } catch (error) {
      setError('Failed to accept invitation');
    } finally {
      setCreatingAccount(false);
    }
  };

  // Check for pending invitation data after signup
  useEffect(() => {
    if (isSignedIn && isNewUser) {
      const pendingInvitation = sessionStorage.getItem('pendingInvitation');
      if (pendingInvitation) {
        const data = JSON.parse(pendingInvitation);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
      }
    }
  }, [isSignedIn, isNewUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Spinner size="lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {isEmailMismatch ? 'Email Mismatch' : 'Invalid Invitation'}
            </CardTitle>
            <CardDescription>
              {isEmailMismatch 
                ? 'You need to sign in with the correct email address to accept this invitation.'
                : 'This invitation link is invalid or has expired.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="space-y-2 mt-4">
              {isEmailMismatch ? (
                <>
                  <Button 
                    onClick={() => signOut(() => router.push('/auth/sign-in'))} 
                    className="w-full"
                  >
                    Sign Out & Sign In with Correct Email
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/dashboard')} 
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => router.push('/auth/sign-in')} 
                  className="w-full"
                >
                  Go to Sign In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation || !isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            {invitation.inviterName} has invited you to join {invitation.workspaceName} on SprintIQ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={invitation.email} disabled className="bg-muted" />
          </div>
          
          <div className="space-y-2">
            <Label>Workspace</Label>
            <Input value={invitation.workspaceName} disabled className="bg-muted" />
          </div>
          
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={invitation.role} disabled className="bg-muted" />
          </div>

          {isNewUser && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleAcceptInvitation}
            disabled={creatingAccount || (isNewUser && (!firstName || !lastName))}
            className="w-full"
          >
            {creatingAccount ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {isNewUser ? 'Creating Account...' : 'Accepting Invitation...'}
              </>
            ) : (
              isNewUser ? 'Create Account & Accept' : 'Accept Invitation'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 