"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';
import { useRouter } from 'next/navigation';

type Notification = {
  id: string;
  recipientId: string;
  actorId: string | null;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  projectId?: string | null;
  taskId?: string | null;
};

function groupByDate(items: Notification[]) {
  const groups: Record<string, Notification[]> = {};
  for (const n of items) {
    const d = new Date(n.createdAt);
    const key = d.toDateString();
    groups[key] = groups[key] || [];
    groups[key].push(n);
  }
  return Object.entries(groups)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [status, setStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilters, setTypeFilters] = useState<{ [k: string]: boolean }>({
    mention: true,
    task_assigned: true,
    comment_added: true,
    status_update: true,
    system_alert: true,
  });
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  const load = async () => {
    const params = new URLSearchParams();
    params.set('status', status);
    if (projectId) params.set('projectId', projectId);
    const selectedTypes = Object.keys(typeFilters).filter((k) => typeFilters[k]);
    // If a single type, filter; otherwise load all
    if (selectedTypes.length === 1) params.set('type', selectedTypes[0]);
    const res = await fetch(`/api/notifications?${params.toString()}`, { cache: 'no-store' });
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, projectId, JSON.stringify(typeFilters)]);

  useEffect(() => {
    // Load projects for filter (from store API if needed)
    const wsId = (typeof window !== 'undefined' && localStorage.getItem('siq:lastWorkspaceId')) || '';
    if (!wsId) return;
    fetch(`/api/workspaces/${wsId}/projects`).then(async (r) => {
      if (!r.ok) return;
      const arr = await r.json();
      setProjects(arr.map((p: any) => ({ id: p.id, name: p.name })));
    });
  }, []);

  const groups = useMemo(() => groupByDate(items), [items]);

  const toggleType = (k: string) => setTypeFilters((s) => ({ ...s, [k]: !s[k] }));

  const goToSource = async (n: Notification) => {
    // Mark as read
    await fetch(`/api/notifications/${n.id}/mark-read`, { method: 'PATCH' });
    // Navigate to task or project if available
    if (n.taskId) window.location.href = `/tasks/${n.taskId}`;
    else if (n.projectId) window.location.href = `/projects/${n.projectId}`;
  };

  // Realtime: listen for socket events and refresh list when a new notification arrives
  const { user } = useUser();
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      try {
        // ts-expect-error dynamic import may lack type declarations in this env
        const mod = await import('socket.io-client');
        const url = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001').replace(/\/$/, '');
        const socket = mod.io(url, { transports: ['websocket'], query: { userId: user.id } });
        const handler = () => {
          if (!active) return;
          // Re-fetch with current filters
          load();
        };
        socket.on('new_notification', handler);
        return () => {
          active = false;
          socket.off('new_notification', handler);
          socket.close();
        };
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, status, projectId, JSON.stringify(typeFilters)]);

  return (
    <div className="min-h-screen">
      {/* Local navbar for Notifications */}
      <nav className="sticky top-0 z-[60] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="font-semibold">SprintIQ</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Notifications</span>
          </div>
          <div className="flex items-center gap-3">
            <SignedIn>
              <NotificationIcon />
              <UserButton afterSignOutUrl="/" signInUrl="/auth/sign-in" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Back button under navbar */}
      <div className="container mx-auto px-4 pt-3">
        <BackToPrev />
      </div>

      <div className="container mx-auto p-4 space-y-6">

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {groups.map(([day, list]) => (
                <div key={day} className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">{day}</div>
                  <div className="space-y-2">
                    {list.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => goToSource(n)}
                        className="w-full rounded border p-3 text-left hover:bg-accent/40"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1 h-2 w-2 rounded-full ${n.isRead ? 'bg-gray-300' : 'bg-blue-500'}`} />
                          <div className="flex-1">
                            <div className="text-sm">{n.content}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleTimeString()}</div>
                          </div>
                          {n.projectId && (
                            <Badge variant="secondary">Project</Badge>
                          )}
                          {n.taskId && (
                            <Badge variant="outline">Task</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {groups.length === 0 && (
                <div className="text-sm text-muted-foreground">No notifications found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Project</Label>
              <Select value={projectId ?? 'all'} onValueChange={(v) => setProjectId(v === 'all' ? undefined : v)}>
                <SelectTrigger className="h-8 mt-1">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Type</Label>
              <div className="mt-2 space-y-2">
                {Object.keys(typeFilters).map((k) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={typeFilters[k]} onCheckedChange={() => toggleType(k)} />
                    <span className="capitalize">{k.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Status</Label>
              <RadioGroup value={status} onValueChange={(v: any) => setStatus(v)} className="mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="all" id="status-all" />
                  <span>All</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="unread" id="status-unread" />
                  <span>Unread</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="read" id="status-read" />
                  <span>Read</span>
                </label>
              </RadioGroup>
            </div>

            <Button variant="outline" onClick={() => setProjectId(undefined)}>Clear filters</Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

function BackToPrev() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="rounded px-2 py-1 hover:bg-accent"
      aria-label="Back to previous page"
    >
      ← Back
    </button>
  );
}


