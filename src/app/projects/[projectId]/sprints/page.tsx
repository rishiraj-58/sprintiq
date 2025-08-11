"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { Play, Pause, Target, Calendar, Plus, MoreHorizontal } from 'lucide-react';
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, useDraggable, DragOverlay, type DragEndEvent, type DragStartEvent, closestCorners } from '@dnd-kit/core';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  description?: string;
  status: 'planning' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  completedPoints?: number;
  totalPoints?: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  storyPoints?: number;
}

// Static data for demo
const mockActiveSprint: Sprint = {
  id: 'sprint-1',
  name: 'January 2024 Sprint',
  goal: 'Complete user authentication system and improve dashboard performance',
  status: 'active',
  startDate: '2024-01-08',
  endDate: '2024-01-22',
  completedPoints: 18,
  totalPoints: 34
};

const mockPlannedSprints: Sprint[] = [
  {
    id: 'sprint-2',
    name: 'February 2024 Sprint',
    goal: 'Implement notification system and mobile responsiveness',
    status: 'planning',
    startDate: '2024-01-23',
    endDate: '2024-02-06',
    totalPoints: 28
  },
  {
    id: 'sprint-3',
    name: 'March 2024 Sprint',
    goal: 'Add reporting features and admin dashboard',
    status: 'planning',
    startDate: '2024-02-07',
    endDate: '2024-02-21',
    totalPoints: 32
  }
];

const mockCompletedSprints: Sprint[] = [
  {
    id: 'sprint-0',
    name: 'December 2023 Sprint',
    goal: 'Project setup and initial foundation',
    status: 'completed',
    startDate: '2023-12-11',
    endDate: '2023-12-22',
    completedPoints: 22,
    totalPoints: 25
  }
];

const mockKanbanTasks: Task[] = [
  {
    id: 'TASK-001',
    title: 'Implement user authentication flow',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Sarah Chen',
    storyPoints: 8
  },
  {
    id: 'TASK-002',
    title: 'Design dashboard mockups',
    status: 'done',
    priority: 'medium',
    assignee: 'Mike Johnson',
    storyPoints: 5
  },
  {
    id: 'TASK-003',
    title: 'Update API documentation',
    status: 'in-progress',
    priority: 'low',
    assignee: 'Alex Rivera',
    storyPoints: 2
  },
  {
    id: 'TASK-004',
    title: 'Implement password reset flow',
    status: 'to-do',
    priority: 'medium',
    assignee: 'Sarah Chen',
    storyPoints: 5
  },
  {
    id: 'TASK-005',
    title: 'Database performance optimization',
    status: 'to-do',
    priority: 'high',
    assignee: 'David Park',
    storyPoints: 8
  }
];

const mockBacklogTasks: Task[] = [
  {
    id: 'TASK-006',
    title: 'Implement notification preferences',
    status: 'backlog',
    priority: 'medium',
    assignee: 'Unassigned',
    storyPoints: 5
  },
  {
    id: 'TASK-007',
    title: 'Add mobile responsive design',
    status: 'backlog',
    priority: 'high',
    assignee: 'Unassigned',
    storyPoints: 13
  },
  {
    id: 'TASK-008',
    title: 'Create user profile page',
    status: 'backlog',
    priority: 'medium',
    assignee: 'Unassigned',
    storyPoints: 8
  },
  {
    id: 'TASK-009',
    title: 'Implement search functionality',
    status: 'backlog',
    priority: 'low',
    assignee: 'Unassigned',
    storyPoints: 3
  }
];

export default function ProjectSprintsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const p = usePermissions('project', projectId);
  const isMember = (p.canCreate || p.canEdit) && !(p.canManageMembers || p.canManageSettings);
  
  const [isCompleteSprintDialogOpen, setIsCompleteSprintDialogOpen] = useState(false);
  const [isCreateSprintDialogOpen, setIsCreateSprintDialogOpen] = useState(false);
  const [isStartSprintDialogOpen, setIsStartSprintDialogOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [plannedSprints, setPlannedSprints] = useState<Sprint[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>(mockBacklogTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loadingPlanned, setLoadingPlanned] = useState(false);
  
  // Form state for new sprint
  const formatDateForInput = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const today = new Date();
  const twoWeeks = new Date(today);
  twoWeeks.setDate(today.getDate() + 14);

  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStartDate, setNewSprintStartDate] = useState(formatDateForInput(today));
  const [newSprintEndDate, setNewSprintEndDate] = useState(formatDateForInput(twoWeeks));

  const handleCompleteSprint = () => {
    console.log('Completing sprint:', mockActiveSprint.id);
    setIsCompleteSprintDialogOpen(false);
    // In real app, this would call an API
  };

  const handleStartSprint = (sprint: Sprint) => {
    console.log('Starting sprint:', sprint.id);
    setIsStartSprintDialogOpen(false);
    setSelectedSprint(null);
    // In real app, this would call an API
  };

  const handleCreateSprint = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSprintName.trim(),
          goal: newSprintGoal.trim() || undefined,
          startDate: newSprintStartDate,
          endDate: newSprintEndDate,
        }),
      });
      if (!res.ok) throw new Error('Create sprint failed');
      // Optionally: refresh data or revalidate
      await loadPlannedSprints();
      setIsCreateSprintDialogOpen(false);
      setNewSprintName('');
      setNewSprintGoal('');
      setNewSprintStartDate('');
      setNewSprintEndDate('');
    } catch (e) {
      console.error(e);
    }
  };

  const loadPlannedSprints = async () => {
    try {
      setLoadingPlanned(true);
      const res = await fetch(`/api/projects/${projectId}/sprints`);
      if (!res.ok) throw new Error('Failed to load sprints');
      const all: any[] = await res.json();
      const planned = all
        .filter(s => s.status === 'planning')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 2);
      setPlannedSprints(planned);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlanned(false);
    }
  };

  useEffect(() => {
    if (projectId) loadPlannedSprints();
  }, [projectId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const task = backlogTasks.find(t => t.id === id) || null;
    setActiveTask(task);
    // Debug: console.log('drag start', { id });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const overId = over.id as string;
    if (!overId.startsWith('sprint-')) return;
    const sprintId = overId.replace('sprint-', '');
    const taskId = active.id as string;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sprintId }) });
      if (!res.ok) throw new Error('Failed to move task');
      // Optimistically remove from backlog list
      setBacklogTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      console.error(e);
    }
  };

  // Simple draggable/droppable wrappers
  function DraggableTask({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef } = useDraggable({ id: task.id, data: { taskId: task.id } });
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="p-3 border rounded-lg hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="text-sm font-medium">{task.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {task.priority}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {task.storyPoints} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function DroppableSprint({ sprintId, children }: { sprintId: string; children: React.ReactNode }) {
    const { setNodeRef, isOver, active, over } = useDroppable({ id: `sprint-${sprintId}`, data: { sprintId } });
    return (
      <div
        ref={setNodeRef}
        className={isOver ? 'ring-2 ring-primary rounded-md transition-colors' : ''}
        onPointerUp={(e) => {
          // Fallback: ensure drop triggers when pointer released over droppable
          if (active && over && over.id === `sprint-${sprintId}`) {
            const taskId = String((active as any).id || '');
            if (taskId) {
              handleDragEnd({ active: { id: taskId } as any, over: { id: `sprint-${sprintId}` } as any } as DragEndEvent);
            }
          }
        }}
      >
        {children}
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Member view: single-page active sprint board (no tabs, no admin buttons)
  if (isMember) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Sprint Management</h1>
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">{mockActiveSprint.name}</CardTitle>
                <Badge variant="secondary" className="bg-green-50 text-green-700">Active</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(mockActiveSprint.startDate)} - {formatDate(mockActiveSprint.endDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span>{mockActiveSprint.completedPoints} / {mockActiveSprint.totalPoints} points</span>
                </div>
              </div>
              {mockActiveSprint.goal && (
                <p className="text-sm text-muted-foreground max-w-2xl">
                  <strong>Goal:</strong> {mockActiveSprint.goal}
                </p>
              )}
            </div>
          </CardHeader>
        </Card>
        <KanbanBoard projectId={projectId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sprint Management</h1>
          <p className="text-muted-foreground">Plan, execute, and review sprints for your project</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsCreateSprintDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Sprint
          </Button>
          {mockPlannedSprints.length > 0 && (
            <Button 
              onClick={() => {
                setSelectedSprint(mockPlannedSprints[0]);
                setIsStartSprintDialogOpen(true);
              }}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Start Next Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            <Play className="h-4 w-4" />
            Active Sprint
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2">
            <Target className="h-4 w-4" />
            Plan Sprints
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <Pause className="h-4 w-4" />
            Completed Sprints
          </TabsTrigger>
        </TabsList>

        {/* Active Sprint Tab */}
        <TabsContent value="active" className="space-y-6">
          {mockActiveSprint ? (
            <>
              {/* Sprint Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{mockActiveSprint.name}</CardTitle>
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(mockActiveSprint.startDate)} - {formatDate(mockActiveSprint.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>{mockActiveSprint.completedPoints} / {mockActiveSprint.totalPoints} points</span>
                        </div>
                      </div>
                      {mockActiveSprint.goal && (
                        <p className="text-sm text-muted-foreground max-w-2xl">
                          <strong>Goal:</strong> {mockActiveSprint.goal}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => setIsCompleteSprintDialogOpen(true)} className="gap-2">
                      <Pause className="h-4 w-4" />
                      Complete Sprint
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Kanban Board */}
              <KanbanBoard projectId={projectId} />
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Sprint</h3>
                <p className="text-muted-foreground mb-4">Start a sprint to begin tracking work</p>
                {mockPlannedSprints.length > 0 && (
                  <Button 
                    onClick={() => {
                      setSelectedSprint(mockPlannedSprints[0]);
                      setIsStartSprintDialogOpen(true);
                    }}
                  >
                    Start {mockPlannedSprints[0].name}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Plan Sprints Tab */}
        <TabsContent value="plan" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Backlog Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Backlog</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag tasks to planned sprints or create new tasks
                </p>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {mockBacklogTasks.map((task) => (
                  <DraggableTask key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>

            {/* Future Sprints Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Planned Sprints</h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsCreateSprintDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Sprint
                </Button>
              </div>
              
              <div className="space-y-4">
                {(loadingPlanned ? [] : plannedSprints).map((sprint) => (
                  <DroppableSprint key={sprint.id} sprintId={sprint.id}>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{sprint.name}</CardTitle>
                          {sprint.startDate && sprint.endDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedSprint(sprint);
                                setIsStartSprintDialogOpen(true);
                              }}
                            >
                              Start Sprint
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit Sprint</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete Sprint
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {sprint.description && (
                        <p className="text-xs text-muted-foreground">{sprint.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground">
                        Planning
                      </div>
                      {/* Placeholder for sprint tasks - would be drag targets */}
                      <div className="mt-2 p-3 border-2 border-dashed border-muted rounded-lg text-center text-xs text-muted-foreground">
                        Drag tasks here to add to sprint
                      </div>
                    </CardContent>
                  </Card>
                  </DroppableSprint>
                ))}
                {!loadingPlanned && plannedSprints.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">No planned sprints</CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Completed Sprints Tab */}
        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sprint History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review past sprint performance and outcomes
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sprint Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCompletedSprints.map((sprint) => (
                    <TableRow key={sprint.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{sprint.name}</div>
                          {sprint.goal && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {sprint.goal}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {Math.round(((sprint.completedPoints || 0) / (sprint.totalPoints || 1)) * 100)}%
                          </div>
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            Completed
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {sprint.completedPoints} / {sprint.totalPoints}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DragOverlay>
        {activeTask ? (
          <div className="p-3 border rounded-lg bg-background shadow-lg">
            <h4 className="text-sm font-medium">{activeTask.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{activeTask.priority}</Badge>
              {activeTask.storyPoints ? (
                <span className="text-xs text-muted-foreground">{activeTask.storyPoints} pts</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>

      {/* Complete Sprint Dialog */}
      <AlertDialog open={isCompleteSprintDialogOpen} onOpenChange={setIsCompleteSprintDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the sprint as completed and move any unfinished tasks back to the backlog. 
              You'll be able to review the sprint performance and start planning your next sprint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteSprint}>
              Complete Sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Sprint Dialog */}
      <AlertDialog open={isStartSprintDialogOpen} onOpenChange={setIsStartSprintDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Sprint: {selectedSprint?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate the sprint and begin tracking progress. Make sure you've added all necessary tasks to the sprint before starting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedSprint && handleStartSprint(selectedSprint)}>
              Start Sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Sprint Dialog */}
      <Dialog open={isCreateSprintDialogOpen} onOpenChange={setIsCreateSprintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Sprint Name</Label>
              <Input
                id="sprint-name"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                placeholder="e.g., February 2024 Sprint"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-goal">Sprint Goal</Label>
              <Textarea
                id="sprint-goal"
                value={newSprintGoal}
                onChange={(e) => setNewSprintGoal(e.target.value)}
                placeholder="What do you want to accomplish in this sprint?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newSprintStartDate}
                  onChange={(e) => setNewSprintStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newSprintEndDate}
                  onChange={(e) => setNewSprintEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateSprintDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSprint}
              disabled={!newSprintName.trim() || !newSprintStartDate || !newSprintEndDate}
            >
              Create Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


