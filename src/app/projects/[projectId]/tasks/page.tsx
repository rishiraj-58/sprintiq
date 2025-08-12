"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpDown,
  List,
  LayoutGrid,
  Eye,
  Edit,
  Trash2,
  Circle
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import MemberTasksPage from './MemberTasksPage';
import { useTask } from '@/stores/hooks/useTask';
import { useProject } from '@/stores/hooks/useProject';

// real data fetched via store

interface TasksPageProps {
  params: {
    projectId: string;
  };
}

export default function TasksPage({ params }: TasksPageProps) {
  // If user is a member (create/edit but no manage perms), render the member-only page
  const p = usePermissions('project', params.projectId);
  const { currentProject } = useProject();
  const w = usePermissions('workspace', currentProject?.workspaceId);
  const isMember = (p.canCreate || p.canEdit || w.canCreate || w.canEdit) && !(p.canManageMembers || p.canManageSettings || w.canManageMembers || w.canManageSettings);
  // Do not early-return before hooks below; keep hook order stable across renders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [sortBy, setSortBy] = useState('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { tasks, fetchTasks, isLoading, error } = useTask();
  useEffect(() => { fetchTasks(params.projectId); }, [params.projectId, fetchTasks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <Circle className="h-4 w-4 text-gray-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_review':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || 
      (assigneeFilter === 'unassigned' && !task.assignee) ||
      (task.assignee && task.assignee.id === assigneeFilter);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'priority':
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        break;
      case 'assignee':
        aValue = a.assignee ? `${a.assignee.firstName || ''} ${a.assignee.lastName || ''}`.trim() : 'Unassigned';
        bValue = b.assignee ? `${b.assignee.firstName || ''} ${b.assignee.lastName || ''}`.trim() : 'Unassigned';
        break;
      case 'updated':
      default:
        aValue = a.updatedAt ? new Date(a.updatedAt as any).getTime() : 0;
        bValue = b.updatedAt ? new Date(b.updatedAt as any).getTime() : 0;
        break;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    in_review: tasks.filter(t => t.status === 'in_review'),
    done: tasks.filter(t => t.status === 'done'),
    blocked: tasks.filter(t => t.status === 'blocked')
  };

  const uniqueAssignees = Array.from(
    new Set(tasks.filter(t => t.assignee).map(t => t.assignee!.id))
  ).map(id => tasks.find(t => t.assignee?.id === id)!.assignee!);

  if (isMember) {
    return <MemberTasksPage projectId={params.projectId} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all project tasks and backlog items
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to the project backlog
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                CreateTaskForm component would be integrated here
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Tasks</span>
              </div>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <Progress value={tasks.length ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {tasks.filter(t => t.status === 'done').length} completed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
              <div className="text-2xl font-bold">{tasksByStatus.in_progress.length}</div>
              <div className="text-xs text-muted-foreground">
                {tasksByStatus.in_review.length} in review
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Blocked</span>
              </div>
              <div className="text-2xl font-bold">{tasksByStatus.blocked.length}</div>
              <div className="text-xs text-muted-foreground">
                Need attention
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Story Points</span>
              </div>
              <div className="text-2xl font-bold">{tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)}</div>
              <div className="text-xs text-muted-foreground">
                Total estimated points
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search tasks by title, ID, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Status: {statusFilter === 'all' ? 'All' : statusFilter.replace('_', ' ')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('todo')}>
                    To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('in_review')}>
                    In Review
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('done')}>
                    Done
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('blocked')}>
                    Blocked
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Flag className="h-4 w-4" />
                    Priority: {priorityFilter === 'all' ? 'All' : priorityFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
                    All Priorities
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('high')}>
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('low')}>
                    Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <User className="h-4 w-4" />
                    Assignee
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Assignee</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setAssigneeFilter('all')}>
                    All Assignees
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAssigneeFilter('unassigned')}>
                    Unassigned
                  </DropdownMenuItem>
                  {uniqueAssignees.map((assignee) => (
                    <DropdownMenuItem 
                      key={assignee.id} 
                      onClick={() => setAssigneeFilter(assignee.id)}
                    >
                      {`${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || 'Unknown'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex border rounded-md">
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'board' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('board')}
                  className="rounded-l-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <Tabs value={view} onValueChange={(value) => setView(value as 'list' | 'board')}>
        <TabsContent value="list" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSortBy('id');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}>
                      ID <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSortBy('title');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}>
                      Title <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSortBy('status');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}>
                      Status <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSortBy('priority');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}>
                      Priority <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSortBy('assignee');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}>
                      Assignee <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Sprint</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-mono text-sm">{task.id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                          {task.title}
                        </Link>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                        <div className="flex gap-1">
                           {/* labels omitted; not present on TaskWithAssignee */}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeColor(task.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          {task.status.replace('_', ' ')}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityBadgeColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                           <Avatar className="h-6 w-6">
                             <AvatarImage src={task.assignee.avatarUrl || undefined} />
                             <AvatarFallback className="text-xs">
                               {`${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim().split(' ').map((n: string) => n[0]).join('')}
                             </AvatarFallback>
                           </Avatar>
                           <span className="text-sm">{`${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim()}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                         {task.sprintId ? task.sprintId : 'Backlog'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {task.storyPoints}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       {task.dueDate ? (
                        <div className="text-sm">
                           {new Date(task.dueDate as any).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" asChild>
                            <Link href={`/tasks/${task.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="board" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <Card key={status} className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      {status.replace('_', ' ').toUpperCase()}
                    </span>
                    <Badge variant="secondary">{statusTasks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusTasks.map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`} className="block">
                      <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="space-y-2">
                          <div className="font-medium text-sm">{task.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={getPriorityBadgeColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {task.storyPoints}
                              </Badge>
                             {task.assignee && (
                                <Avatar className="h-5 w-5">
                                 <AvatarImage src={task.assignee.avatarUrl || undefined} />
                                 <AvatarFallback className="text-xs">
                                   {`${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim().split(' ').map((n: string) => n[0]).join('')}
                                 </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                          {/* labels omitted; not available on TaskWithAssignee */}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredTasks.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">No tasks found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search criteria or filters
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
