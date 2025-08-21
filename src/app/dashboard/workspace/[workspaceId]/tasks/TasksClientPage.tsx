'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { taskService, type AssignedTaskRow } from '@/services/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusChanger } from './StatusChanger';
import { AIWorkspaceSuggestions } from '@/components/ai/AIWorkspaceSuggestions';
import Link from 'next/link';

interface Props {
  workspaceId: string;
}

export default function TasksClientPage({ workspaceId }: Props) {
  const { user } = useUser();
  const [rows, setRows] = useState<AssignedTaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await taskService.getAssignedTasksForUser(user.id);
        setRows(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.id]);

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    return map[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const statusOptions = useMemo(() => [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'done', label: 'Done' },
  ], []);

  return (
    <div className="space-y-6">
      {/* AI Workspace Suggestions */}
      <AIWorkspaceSuggestions workspaceId={workspaceId} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">All tasks assigned to you across projects</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No assigned tasks.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/tasks/${t.id}`} className="hover:underline">{t.title}</Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/projects/${t.projectId}`} className="hover:underline">{t.projectName}</Link>
                    </TableCell>
                    <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : <span className="text-muted-foreground">No due date</span>}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityBadge(t.priority)}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusChanger
                        value={t.status}
                        onChange={async (value) => {
                          try {
                            await taskService.updateTaskStatus(t.id, value);
                            setRows((prev) => prev.map((r) => (r.id === t.id ? { ...r, status: value } : r)));
                          } catch {}
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


