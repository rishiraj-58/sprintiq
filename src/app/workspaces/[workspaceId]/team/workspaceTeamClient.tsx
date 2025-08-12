'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { usePermissions } from '@/hooks/usePermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Member {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  lastActiveAt?: string | null;
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
  const [manageOpen, setManageOpen] = useState(false);
  const [manageMember, setManageMember] = useState<Member | null>(null);
  const [manageRole, setManageRole] = useState<'owner' | 'manager' | 'member' | 'viewer'>('member');
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = members.filter((m) => {
      const full = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
      return !q || full.includes(q) || (m.email || '').toLowerCase().includes(q);
    });
    return list.sort((a, b) => (a.email === currentEmail ? -1 : b.email === currentEmail ? 1 : 0));
  }, [members, search, currentEmail]);

  const activity = (last?: string | null) => {
    if (!last) return { text: 'Inactive', dot: 'bg-gray-400' };
    const d = new Date(last);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffH < 24) return { text: 'Active today', dot: 'bg-green-500' };
    if (diffH < 48) return { text: '1 day ago', dot: 'bg-yellow-500' };
    return { text: `${Math.floor(diffH / 24)} days ago`, dot: 'bg-gray-400' };
  };

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
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" /> {members.length} members
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Input placeholder="Search teammates" className="w-72" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-[240px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const a = activity(m.lastActiveAt);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={m.avatarUrl || undefined} />
                              <AvatarFallback>
                                {(m.firstName || 'U')[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {m.firstName || ''} {m.lastName || ''} {m.email === currentEmail ? '(you)' : ''}
                              </div>
                              <div className="text-xs text-muted-foreground">{m.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{m.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={`h-2 w-2 rounded-full ${a.dot}`} />
                            {a.text}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {perms.canManageMembers && m.role !== 'owner' ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setManageMember(m);
                                  setManageRole((m.role as any) || 'member');
                                  setManageOpen(true);
                                }}
                              >
                                Manage Access
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const ok = confirm('Remove this member from workspace?');
                                  if (!ok) return;
                                  const resp = await fetch(`/api/workspaces/${workspaceId}/members?profileId=${m.id}`, { method: 'DELETE' });
                                  if (resp.ok || resp.status === 204) {
                                    const res = await fetch(`/api/workspaces/${workspaceId}/members`);
                                    const data = await res.json();
                                    setMembers(data.members || []);
                                  } else {
                                    alert('Failed to remove member');
                                  }
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground mt-3">No members found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Access Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Access</DialogTitle>
          </DialogHeader>
          {manageMember && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Update role for <span className="font-medium text-foreground">{manageMember.firstName || ''} {manageMember.lastName || ''}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm">Role</label>
                <Select value={manageRole} onValueChange={(v) => setManageRole(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setManageOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!manageMember) return;
                    const resp = await fetch(`/api/workspaces/${workspaceId}/members`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ profileId: manageMember.id, role: manageRole })
                    });
                    if (resp.ok || resp.status === 204) {
                      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
                      const data = await res.json();
                      setMembers(data.members || []);
                      setManageOpen(false);
                    } else {
                      alert('Failed to update role');
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


