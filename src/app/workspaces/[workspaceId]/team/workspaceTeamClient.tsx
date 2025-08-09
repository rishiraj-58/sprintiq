'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { usePermissions } from '@/hooks/usePermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUser } from '@clerk/nextjs';

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
  const [search, setSearch] = useState('');
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

  const { user } = useUser();
  const currentEmail = user?.primaryEmailAddress?.emailAddress || '';
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = members.filter((m) => {
      const full = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
      return !q || full.includes(q) || (m.email || '').toLowerCase().includes(q);
    });
    return list.sort((a, b) => (a.email === currentEmail ? -1 : b.email === currentEmail ? 1 : 0));
  }, [members, search, currentEmail]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Team</h2>
        {perms.canManageMembers && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Invite Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm text-muted-foreground">Role</label>
                  <select
                    className="flex-1 rounded border bg-background px-2 py-1 text-sm"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                  >
                    <option value="manager">manager</option>
                    <option value="member">member</option>
                    <option value="viewer">viewer</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm text-muted-foreground">Email</label>
                  <Input
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={async () => {
                      if (!inviteEmail) return;
                      await fetch('/api/invitations/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ workspaceId, invites: [{ email: inviteEmail, role: inviteRole }] }),
                      });
                      setInviteEmail('');
                      alert('Invitation sent');
                    }}
                  >
                    Send Invite
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Members</CardTitle>
          <div className="text-sm text-muted-foreground">{members.length} members</div>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Input placeholder="Search teammates" className="w-72" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>
                    <div className="font-medium">
                      {m.firstName || ''} {m.lastName || ''} {m.email === currentEmail ? '(you)' : ''}
                    </div>
                    <div className="text-muted-foreground">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded bg-accent px-2 py-1 text-xs capitalize">{m.role}</div>
                    {perms.canManageMembers && m.role !== 'owner' && (
                      <>
                        <Button variant="outline" size="sm">Manage Access</Button>
                        <button
                          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                          onClick={async () => {
                            const ok = confirm('Remove this member from workspace?');
                            if (!ok) return;
                            await fetch(`/api/workspaces/${workspaceId}/members?profileId=${m.id}`, { method: 'DELETE' });
                            const res = await fetch(`/api/workspaces/${workspaceId}/members`);
                            const data = await res.json();
                            setMembers(data.members || []);
                          }}
                        >
                          •••
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground">No members found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


