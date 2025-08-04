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

  const handleNextStep = () => setStep(step + 1);
  const handlePrevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    
    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        intent,
        workspaceName,
      }),
    });

    if (response.ok) {
      router.push('/dashboard');
    } else {
      // Handle error (e.g., show a toast notification)
      console.error('Onboarding failed');
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
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={handlePrevStep}>Back</Button>
            <Button onClick={intent === 'create' || intent === 'explore' ? handleNextStep : handleSubmit}>
              {intent === 'create' || intent === 'explore' ? 'Next' : 'Finish'}
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
            <Button onClick={handleSubmit} disabled={isLoading || !workspaceName}>
              {isLoading ? <Spinner size="sm" /> : 'Finish Setup'}
            </Button>
          </CardFooter>
      </>
      )}
    </Card>
  );
}