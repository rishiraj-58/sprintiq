'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { List, LayoutGrid, ArrowUpDown } from 'lucide-react';
import { useProject } from '@/stores/hooks/useProject';
import { useTask } from '@/stores/hooks/useTask';

interface Props {
  projectId: string;
}

// real data will be fetched via useTask store

export default function MemberTasksPage({ projectId }: Props) {
  const { currentProject } = useProject();
  const workspaceId = currentProject?.workspaceId || (typeof window !== 'undefined' ? localStorage.getItem('siq:lastWorkspaceId') || '' : '');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'assignee' | 'status' | 'priority' | 'dueDate'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    return map[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      todo: 'bg-gray-100 text-gray-800 border-gray-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      in_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blocked: 'bg-red-100 text-red-800 border-red-200',
      done: 'bg-green-100 text-green-800 border-green-200',
    };
    return map[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const { tasks, fetchTasks } = useTask();

  useEffect(() => {
    if (projectId) fetchTasks(projectId);
  }, [projectId, fetchTasks]);

  const sorted = useMemo(() => {
    const arr = [...tasks];
    const toKey = (t: any) => {
      switch (sortBy) {
        case 'title': return t.title.toLowerCase();
        case 'assignee': return (t.assignee ? `${t.assignee.firstName || ''} ${t.assignee.lastName || ''}`.trim().toLowerCase() : '');
        case 'status': return t.status;
        case 'priority': return t.priority;
        case 'dueDate': return t.dueDate || '';
        case 'id':
        default: return t.id;
      }
    };
    arr.sort((a, b) => {
      const av = toKey(a);
      const bv = toKey(b);
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [sortBy, sortOrder]);

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CreateTaskForm projectId={projectId}>
          <Button className="gap-2">Create Task</Button>
        </CreateTaskForm>
        <div className="flex border rounded-md overflow-hidden">
          <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')} className="rounded-r-none">
            <List className="h-4 w-4" />
          </Button>
          <Button variant={view === 'board' ? 'default' : 'ghost'} size="sm" onClick={() => setView('board')} className="rounded-l-none">
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {header}
      <TaskFilters projectId={projectId} workspaceId={workspaceId} />

      {view === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>Backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">
                    <Button variant="ghost" size="sm" onClick={() => { setSortBy('id'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                      ID <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => { setSortBy('title'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                      Title <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => { setSortBy('assignee'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                      Assignee <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => { setSortBy('status'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                      Status <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => { setSortBy('priority'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                      Priority <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => { setSortBy('dueDate'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                      Due Date <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">{t.id}</TableCell>
                    <TableCell>
                      <Link href={`/tasks/${t.id}`} className="hover:underline">{t.title}</Link>
                    </TableCell>
                    <TableCell>
                      {t.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={t.assignee.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">{`${t.assignee.firstName || ''} ${t.assignee.lastName || ''}`.trim().split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{`${t.assignee.firstName || ''} ${t.assignee.lastName || ''}`.trim() || 'Unknown'}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge(t.status)}>{t.status.replace('_',' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityBadge(t.priority)}>{t.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {t.dueDate ? new Date(t.dueDate as any).toLocaleDateString() : <span className="text-sm text-muted-foreground">No due date</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        // Provide Kanban with columns via dummy data implicitly
        <KanbanBoard projectId={projectId} />
      )}
    </div>
  );
}


