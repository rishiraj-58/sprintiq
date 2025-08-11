'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface LinkedTask {
  id: string;
  linkedTaskId: string;
  relation: 'blocks' | 'is_blocked_by' | 'related';
  linkedTask?: {
    id: string;
    title: string;
    status: string;
  };
}

interface LinkedTasksProps {
  taskId: string;
  projectId: string;
  workspaceId: string;
}

export function LinkedTasks({ taskId, projectId, workspaceId }: LinkedTasksProps) {
  const [links, setLinks] = useState<LinkedTask[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [relation, setRelation] = useState<LinkedTask['relation']>('related');
  const { canEdit } = usePermissions('workspace', workspaceId);
  const { toast } = useToast();

  const fetchLinks = async () => {
    const res = await fetch(`/api/tasks/${taskId}/links`);
    if (res.ok) setLinks(await res.json());
  };

  useEffect(() => {
    fetchLinks();
  }, [taskId]);

  const searchTasks = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setResults([]); return; }
    const params = new URLSearchParams({ projectId, q });
    const res = await fetch(`/api/tasks/search?${params.toString()}`);
    if (res.ok) setResults(await res.json());
  };

  const addLink = async (linkedTaskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedTaskId, relation }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchLinks();
      setOpen(false);
      setSearch('');
      setResults([]);
    } catch (e) {
      toast({ title: 'Error', description: 'Could not link task', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Linked Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No linked tasks</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <Link key={l.id} href={`/tasks/${l.linkedTaskId}`}>
                <Badge variant="outline">
                  {l.relation.replace('_', ' ')}: {l.linkedTask?.title || l.linkedTaskId}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Link</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link another task</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Select value={relation} onValueChange={(v: any) => setRelation(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocks">blocks</SelectItem>
                    <SelectItem value="is_blocked_by">is blocked by</SelectItem>
                    <SelectItem value="related">related to</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Search tasks" value={search} onChange={(e) => searchTasks(e.target.value)} />
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {results.map((r) => (
                    <Button key={r.id} variant="ghost" className="w-full justify-start" onClick={() => addLink(r.id)}>
                      {r.title}
                    </Button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}


