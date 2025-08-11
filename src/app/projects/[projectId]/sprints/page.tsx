'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
// ProjectSidebar now handled by SidebarLayout

type Sprint = { id: string; name: string; description: string | null; status: string; startDate: string | null; endDate: string | null };

export default function ProjectSprintsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { toast } = useToast();

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = async () => {
    const res = await fetch(`/api/projects/${projectId}/sprints`);
    if (res.ok) {
      setSprints(await res.json());
    }
  };

  useEffect(() => { if (projectId) load(); }, [projectId]);

  const createSprint = async () => {
    const res = await fetch(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, status, startDate, endDate })
    });
    if (res.ok) {
      toast({ title: 'Sprint created' });
      setOpen(false);
      setName(''); setDescription(''); setStatus('planning'); setStartDate(''); setEndDate('');
      load();
    } else {
      toast({ title: 'Failed to create sprint', variant: 'destructive' });
    }
  };

  const byStatus = (st: string) => sprints.filter(s => s.status === st);

  return (
    <div className="space-y-6">
      {/* Main content - Sidebar handled by SidebarLayout */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Sprints</h1>
            <Button onClick={() => setOpen(true)}>New Sprint</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle>Active</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {byStatus('active').map(s => (
                  <div key={s.id} className="p-3 border rounded">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'} → {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</div>
                  </div>
                ))}
                {byStatus('active').length === 0 && <div className="text-sm text-muted-foreground">No active sprints</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {byStatus('planning').map(s => (
                  <div key={s.id} className="p-3 border rounded">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'} → {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</div>
                  </div>
                ))}
                {byStatus('planning').length === 0 && <div className="text-sm text-muted-foreground">No upcoming sprints</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Completed</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {byStatus('completed').map(s => (
                  <div key={s.id} className="p-3 border rounded">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'} → {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</div>
                  </div>
                ))}
                {byStatus('completed').length === 0 && <div className="text-sm text-muted-foreground">No completed sprints</div>}
              </CardContent>
            </Card>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Sprint</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="desc">Description (optional)</Label>
                  <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createSprint} disabled={!name.trim()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    </div>
  );
}


