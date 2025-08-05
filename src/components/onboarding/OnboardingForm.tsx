'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Profile } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface OnboardingFormProps {
  profile: Profile;
}

export function OnboardingForm({ profile }: OnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [intent, setIntent] = useState<'create' | 'join' | 'explore'>('create');
  const [workspaceName, setWorkspaceName] = useState('');
  const [invites, setInvites] = useState('');

  const handleNextStep = () => setStep(step + 1);
  const handlePrevStep = () => setStep(step - 1);

  const handleFinishOnboarding = async () => {
    setIsLoading(true);

    try {
      console.log('Starting onboarding process...');
      
      // Parse invites if provided
      let parsedInvites: Array<{ email: string; role: string }> = [];
      if (invites.trim() !== '') {
        parsedInvites = invites.split(',').map(email => ({ 
          email: email.trim(), 
          role: 'member' 
        }));
      }

      console.log('Parsed invites:', parsedInvites);

      // Send all onboarding data including invites to the server
      const onboardingResponse = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          intent,
          workspaceName,
          invites: parsedInvites,
        }),
      });

      if (!onboardingResponse.ok) {
        console.error('Onboarding failed');
        setIsLoading(false);
        return;
      }

      const result = await onboardingResponse.json();
      console.log('Onboarding completed:', result);

      // Redirect to the dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      {step === 1 && (
        <>
          <CardHeader>
            <CardTitle>Welcome to SprintIQ</CardTitle>
            <CardDescription>Let's start by completing your profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleNextStep} disabled={!firstName || !lastName} className="ml-auto">
              Next
            </Button>
          </CardFooter>
        </>
      )}

      {step === 2 && (
        <>
          <CardHeader>
            <CardTitle>How will you use SprintIQ?</CardTitle>
            <CardDescription>This will help us tailor your experience.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={intent} onValueChange={(value: 'create' | 'join' | 'explore') => setIntent(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create" id="create" />
                <Label htmlFor="create">I'm creating a new workspace for my team.</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="join" id="join" />
                <Label htmlFor="join">I'm joining an existing workspace.</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="explore" id="explore" />
                <Label htmlFor="explore">I'm just exploring and want a personal workspace.</Label>
              </div>
            </RadioGroup>
            {intent === 'join' && (
                <Alert>
                    <AlertTitle>Check your Email!</AlertTitle>
                    <AlertDescription>
                        To join an existing workspace, please use the invitation link sent to your email. If you don't have one, ask your workspace manager to invite you.
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={handlePrevStep}>Back</Button>
            <Button onClick={handleNextStep} disabled={intent === 'join'}>
              Next
            </Button>
          </CardFooter>
        </>
      )}

      {step === 3 && (intent === 'create' || intent === 'explore') && (
        <>
        <CardHeader>
            <CardTitle>Create your Workspace</CardTitle>
            <CardDescription>
              {intent === 'create' 
                ? "Give your new workspace a name. You can change this later." 
                : "We'll create a personal workspace for you. What would you like to name it?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace Name</Label>
              <Input 
                id="workspaceName" 
                value={workspaceName} 
                onChange={(e) => setWorkspaceName(e.target.value)} 
                placeholder={intent === 'create' ? "e.g., Acme Inc." : "e.g., John's Workspace"} 
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={handlePrevStep}>Back</Button>
            <Button onClick={handleNextStep} disabled={!workspaceName}>
              Next
            </Button>
          </CardFooter>
      </>
      )}

{step === 4 && (intent === 'create' || intent === 'explore') && (
        <>
          <CardHeader>
            <CardTitle>Invite Your Team (Optional)</CardTitle>
            <CardDescription>Enter your team members' email addresses, separated by commas. They will be invited as members.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="invites">Emails</Label>
              <Textarea 
                id="invites" 
                value={invites} 
                onChange={(e) => setInvites(e.target.value)} 
                placeholder="e.g., colleague@example.com, friend@work.com" 
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={handlePrevStep}>Back</Button>
            <Button onClick={handleFinishOnboarding} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : 'Finish & Go to Dashboard'}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}