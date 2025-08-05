'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TestInvitationFormProps {
  workspaceId: string;
  workspaceName: string;
}

export function TestInvitationForm({ workspaceId, workspaceName }: TestInvitationFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('Sending test invitation to:', email);
      
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          invites: [
            {
              email,
              role,
            },
          ],
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Invitation sent successfully:', result);
        setMessage(`✅ Success! Test invitation sent to ${email}. Check the console for detailed logs.`);
        setEmail('');
      } else {
        console.error('Failed to send invitation:', result);
        setMessage(`❌ Error: ${result.message || 'Failed to send invitation'}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setMessage('❌ Error: Failed to send invitation. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Test Email Invitation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <Input
              id="workspace"
              value={workspaceName}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Test Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'manager' | 'member') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Sending...' : 'Send Test Invitation'}
          </Button>
        </form>
        
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Check your browser console and terminal for detailed logs about the email sending process.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 