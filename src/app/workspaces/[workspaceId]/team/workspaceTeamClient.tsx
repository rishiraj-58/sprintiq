'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { usePermissions } from '@/hooks/usePermissions';

interface Member {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
}

export function WorkspaceTeamClient({ workspaceId }: { workspaceId: string }) {
  const { setCurrentWorkspace } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'member' | 'viewer'>('member');
  const perms = usePermissions('workspace', workspaceId);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        const data = await res.json();
        setMembers(data.members || []);
      } finally {
        setLoading(false);
      }
    })();
    // Set selected workspace into store for navbar context
    setCurrentWorkspace({ id: workspaceId, name: '', description: null } as any);
    localStorage.setItem('siq:lastWorkspaceId', workspaceId);
  }, [workspaceId, setCurrentWorkspace]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Workspace Team</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>
                    <div className="font-medium">{m.firstName || ''} {m.lastName || ''}</div>
                    <div className="text-muted-foreground">{m.email}</div>
                  </div>
                  <div className="rounded bg-accent px-2 py-1 text-xs capitalize">{m.role}</div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="text-sm text-muted-foreground">No members yet.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {perms.canManageMembers && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="user@example.com"
                className="w-72"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <select
                className="rounded border bg-background px-2 py-1 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
              >
                <option value="manager">manager</option>
                <option value="member">member</option>
                <option value="viewer">viewer</option>
              </select>
              <Button
                onClick={async () => {
                  if (!inviteEmail) return;
                  await fetch('/api/invitations/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ workspaceId, invites: [{ email: inviteEmail, role: inviteRole }] }),
                  });
                  setInviteEmail('');
                }}
              >
                Send Invite
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Invite adds user to the workspace. Project access is separate.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


