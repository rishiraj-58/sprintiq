'use client';

import { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Calendar,
  Clock,
  Plus,
  Filter,
  MoreHorizontal,
  Flag,
  Target,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Milestone,
  Rocket
} from 'lucide-react';

// Static timeline data
const timelineData = {
  sprints: [
    {
      id: 'sprint-1',
      name: 'Sprint 1 - Foundation',
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      status: 'completed',
      tasks: 12,
      completedTasks: 12,
      storyPoints: 34,
      completedPoints: 34
    },
    {
      id: 'sprint-2',
      name: 'Sprint 2 - Core Features',
      startDate: '2024-01-15',
      endDate: '2024-01-28',
      status: 'completed',
      tasks: 15,
      completedTasks: 14,
      storyPoints: 42,
      completedPoints: 38
    },
    {
      id: 'sprint-3',
      name: 'Sprint 3 - UI/UX Enhancement',
      startDate: '2024-01-29',
      endDate: '2024-02-11',
      status: 'active',
      tasks: 18,
      completedTasks: 8,
      storyPoints: 48,
      completedPoints: 22
    },
    {
      id: 'sprint-4',
      name: 'Sprint 4 - Integration & Testing',
      startDate: '2024-02-12',
      endDate: '2024-02-25',
      status: 'planned',
      tasks: 14,
      completedTasks: 0,
      storyPoints: 36,
      completedPoints: 0
    }
  ],

  milestones: [
    {
      id: 'milestone-1',
      name: 'MVP Release',
      description: 'Basic functionality ready for internal testing',
      date: '2024-02-15',
      status: 'completed',
      tasks: [
        { id: 'TASK-001', title: 'User Authentication', status: 'done' },
        { id: 'TASK-002', title: 'Basic Navigation', status: 'done' },
        { id: 'TASK-003', title: 'Core Dashboard', status: 'done' }
      ]
    },
    {
      id: 'milestone-2',
      name: 'Beta Release',
      description: 'Feature-complete version ready for beta testing',
      date: '2024-03-01',
      status: 'in_progress',
      tasks: [
        { id: 'TASK-004', title: 'Advanced Features', status: 'in_progress' },
        { id: 'TASK-005', title: 'Performance Optimization', status: 'todo' },
        { id: 'TASK-006', title: 'Bug Fixes', status: 'todo' }
      ]
    },
    {
      id: 'milestone-3',
      name: 'Production Release',
      description: 'Production-ready application with full features',
      date: '2024-03-31',
      status: 'planned',
      tasks: [
        { id: 'TASK-007', title: 'Final Testing', status: 'todo' },
        { id: 'TASK-008', title: 'Documentation', status: 'todo' },
        { id: 'TASK-009', title: 'Deployment Setup', status: 'todo' }
      ]
    }
  ],

  tasks: [
    {
      id: 'TASK-001',
      title: 'User Authentication System',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      assignee: { name: 'Sarah Chen', avatar: null },
      status: 'done',
      dependencies: []
    },
    {
      id: 'TASK-002',
      title: 'Database Schema Design',
      startDate: '2024-01-03',
      endDate: '2024-01-08',
      assignee: { name: 'Mike Rodriguez', avatar: null },
      status: 'done',
      dependencies: []
    },
    {
      id: 'TASK-003',
      title: 'API Endpoints Development',
      startDate: '2024-01-06',
      endDate: '2024-01-15',
      assignee: { name: 'Alex Thompson', avatar: null },
      status: 'done',
      dependencies: ['TASK-001', 'TASK-002']
    },
    {
      id: 'TASK-004',
      title: 'Frontend UI Components',
      startDate: '2024-01-16',
      endDate: '2024-01-25',
      assignee: { name: 'Emma Davis', avatar: null },
      status: 'in_progress',
      dependencies: ['TASK-003']
    },
    {
      id: 'TASK-005',
      title: 'Integration Testing',
      startDate: '2024-01-26',
      endDate: '2024-02-05',
      assignee: { name: 'David Kim', avatar: null },
      status: 'todo',
      dependencies: ['TASK-004']
    }
  ]
};

interface TimelinePageProps {
  params: {
    projectId: string;
  };
}

export default function TimelinePage({ params }: TimelinePageProps) {
  const [viewType, setViewType] = useState<'gantt' | 'milestones' | 'releases'>('gantt');
  const [timeRange, setTimeRange] = useState('3_months');
  const [currentDate, setCurrentDate] = useState(new Date());
  const projectId = params.projectId;
  const projectPerms = usePermissions('project', projectId);
  const canEditTimeline = projectPerms.canManageMembers || projectPerms.canManageSettings; // treat member as read-only
  const [milestonesData, setMilestonesData] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState<'planned' | 'in_progress' | 'completed'>('planned');

  const loadMilestones = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`);
      if (!res.ok) return;
      setMilestonesData(await res.json());
    } catch {}
  };

  useEffect(() => {
    loadMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const openEdit = (m: any) => {
    setEditId(m.id);
    setEditName(m.name || '');
    setEditDesc(m.description || '');
    const d = m.date || m.dueDate;
    setEditDate(d ? new Date(d).toISOString().slice(0, 10) : '');
    setEditStatus((m.status as any) || 'planned');
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const res = await fetch(`/api/projects/${projectId}/milestones/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim(), date: editDate, status: editStatus }),
    });
    if (res.ok) {
      setIsEditOpen(false);
      setEditId(null);
      await loadMilestones();
    }
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm('Delete this milestone?')) return;
    const res = await fetch(`/api/projects/${projectId}/milestones/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadMilestones();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return 'bg-green-500';
      case 'active':
      case 'in_progress':
        return 'bg-blue-500';
      case 'planned':
      case 'todo':
        return 'bg-gray-400';
      case 'at_risk':
        return 'bg-yellow-500';
      case 'delayed':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned':
      case 'todo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (item: any) => {
    if (item.completedTasks !== undefined) {
      return (item.completedTasks / item.tasks) * 100;
    }
    if (item.completedPoints !== undefined) {
      return (item.completedPoints / item.storyPoints) * 100;
    }
    return 0;
  };

  const getDaysFromStart = (date: string) => {
    const startDate = new Date('2024-01-01');
    const targetDate = new Date(date);
    return Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysBetween = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Timeline</h1>
          <p className="text-muted-foreground">
            Track project progress, milestones, and dependencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {timeRange === '3_months' ? '3 Months' : timeRange === '6_months' ? '6 Months' : '1 Year'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Time Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTimeRange('3_months')}>
                3 Months
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('6_months')}>
                6 Months
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('1_year')}>
                1 Year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!canEditTimeline}>
                <Plus className="h-4 w-4" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Milestone</DialogTitle>
                <DialogDescription>
                  Add a new project milestone with target date
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-3">
                <div>
                  <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Milestone name" value={newMilestoneName} onChange={(e) => setNewMilestoneName(e.target.value)} />
                </div>
                <div>
                  <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="Description" rows={3} value={newMilestoneDesc} onChange={(e) => setNewMilestoneDesc(e.target.value)} />
                </div>
                <div>
                  <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={newMilestoneDate} onChange={(e) => setNewMilestoneDate(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    const res = await fetch(`/api/projects/${projectId}/milestones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newMilestoneName.trim(), description: newMilestoneDesc.trim(), date: newMilestoneDate }) });
                    if (res.ok) {
                      setIsCreateOpen(false);
                      setNewMilestoneName('');
                      setNewMilestoneDesc('');
                      setNewMilestoneDate('');
                      loadMilestones();
                    }
                  }} disabled={!newMilestoneName.trim() || !newMilestoneDate}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Active Sprint</span>
              </div>
              <div className="text-2xl font-bold">Sprint 3</div>
              <div className="text-xs text-muted-foreground">
                8 of 18 tasks completed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Milestones</span>
              </div>
              <div className="text-2xl font-bold">
                {timelineData.milestones.filter(m => m.status === 'completed').length}/
                {timelineData.milestones.length}
              </div>
              <div className="text-xs text-muted-foreground">
                1 completed, 2 upcoming
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Time Remaining</span>
              </div>
              <div className="text-2xl font-bold">58 days</div>
              <div className="text-xs text-muted-foreground">
                Until production release
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Overall Progress</span>
              </div>
              <div className="text-2xl font-bold">42%</div>
              <Progress value={42} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Views */}
      <Tabs value={viewType} onValueChange={(value) => setViewType(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
        </TabsList>

        {/* Gantt Chart View */}
        <TabsContent value="gantt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Task Timeline</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" disabled={!canEditTimeline}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button variant="ghost" size="sm" disabled={!canEditTimeline}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline Header */}
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground border-b pb-2">
                  <div className="col-span-3">Task</div>
                  <div className="col-span-9 grid grid-cols-12">
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={i} className="text-center">
                        Week {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sprint Rows */}
                {timelineData.sprints.map((sprint) => (
                  <div key={sprint.id} className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{sprint.name}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusBadgeColor(sprint.status)}>
                              {sprint.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {sprint.completedTasks}/{sprint.tasks} tasks
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-9 relative h-8">
                        <div 
                          className={`absolute h-6 rounded ${getStatusColor(sprint.status)} opacity-80`}
                          style={{
                            left: `${(getDaysFromStart(sprint.startDate) / 90) * 100}%`,
                            width: `${(getDaysBetween(sprint.startDate, sprint.endDate) / 90) * 100}%`
                          }}
                        >
                          <div className="h-full bg-white bg-opacity-20 rounded overflow-hidden">
                            <div 
                              className="h-full bg-white bg-opacity-40 transition-all duration-300"
                              style={{ width: `${getProgressPercentage(sprint)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tasks within Sprint */}
                    <div className="ml-4 space-y-1">
                      {timelineData.tasks
                        .filter(task => {
                          const taskStart = new Date(task.startDate);
                          const sprintStart = new Date(sprint.startDate);
                          const sprintEnd = new Date(sprint.endDate);
                          return taskStart >= sprintStart && taskStart <= sprintEnd;
                        })
                        .map((task) => (
                          <div key={task.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3">
                              <div className="flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                                <span className="truncate">{task.title}</span>
                                {task.assignee && (
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={task.assignee.avatar || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {task.assignee.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            </div>
                            <div className="col-span-9 relative h-4">
                              <div 
                                className={`absolute h-3 rounded-sm ${getStatusColor(task.status)} opacity-60`}
                                style={{
                                  left: `${(getDaysFromStart(task.startDate) / 90) * 100}%`,
                                  width: `${(getDaysBetween(task.startDate, task.endDate) / 90) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones View */}
        <TabsContent value="milestones" className="space-y-4">
          <div className="grid gap-6">
            {(milestonesData.length ? milestonesData : timelineData.milestones).map((milestone: any, index: number) => (
              <Card key={milestone.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${getStatusColor(milestone.status)} flex items-center justify-center`}>
                        {milestone.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                          <Target className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{milestone.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(milestone.date || milestone.dueDate).toLocaleDateString()}
                        </div>
                        <Badge variant="outline" className={getStatusBadgeColor(milestone.status)}>
                          {milestone.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {canEditTimeline && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="h-8 rounded-md px-2 hover:bg-accent" aria-label="Milestone actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-[200]">
                            <DropdownMenuItem onClick={() => openEdit(milestone)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMilestone(milestone.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {Array.isArray(milestone.tasks) && milestone.tasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Associated Tasks:</div>
                      <div className="grid gap-2">
                        {milestone.tasks.map((task: { id: string; title: string; status: string }) => (
                          <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                              <span className="text-sm">{task.id}</span>
                              <span className="text-sm">{task.title}</span>
                            </div>
                            <Badge variant="outline" className={getStatusBadgeColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Releases View */}
        <TabsContent value="releases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Release Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  
                  {timelineData.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="relative flex items-start space-x-4 pb-8">
                      <div className={`w-8 h-8 rounded-full ${getStatusColor(milestone.status)} flex items-center justify-center z-10`}>
                        {milestone.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : milestone.status === 'in_progress' ? (
                          <Clock className="h-4 w-4 text-white" />
                        ) : (
                          <Target className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{milestone.name}</h3>
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {new Date(milestone.date).toLocaleDateString()}
                            </div>
                            <Badge variant="outline" className={getStatusBadgeColor(milestone.status)}>
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress 
                            value={milestone.tasks.filter((t: { status: string }) => t.status === 'done').length / milestone.tasks.length * 100} 
                            className="h-2" 
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>
                              {milestone.tasks.filter((t: { status: string }) => t.status === 'done').length} of {milestone.tasks.length} tasks completed
                            </span>
                            <span>
                              {Math.round(milestone.tasks.filter(t => t.status === 'done').length / milestone.tasks.length * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Milestone Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>Update milestone details</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div>
              <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Milestone name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="Description" rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div>
              <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div>
              <select className="w-full border rounded px-2 py-1 text-sm" value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={!editName.trim() || !editDate}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
