'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Calendar, Clock, User, ArrowLeft, Edit, Save, X, Plus } from 'lucide-react';
import { useTask } from '@/stores/hooks/useTask';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/ui/use-toast';
import { CommentSection } from '@/components/tasks/CommentSection';
import { TaskAttachmentUploader } from '@/components/tasks/TaskAttachmentUploader';
import { SubTasks } from '@/components/tasks/SubTasks';
import { LinkedTasks } from '@/components/tasks/LinkedTasks';
import { History } from '@/components/tasks/History';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import dynamic from 'next/dynamic';

interface TaskDetailData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type?: string;
  storyPoints?: number | null;
  projectId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  dueDate: Date | null;
  workspaceId: string;
  project: {
    id: string;
    name: string;
    description: string | null;
  };
  assignee: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
  creator: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
}

interface TaskDetailClientPageProps {
  task: TaskDetailData;
}

export function TaskDetailClientPage({ task }: TaskDetailClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { updateTask } = useTask();
  const { workspaceMembers, fetchWorkspaceMembers, isMembersLoading } = useWorkspace();
  const ws = usePermissions('workspace', task.workspaceId);
  const proj = usePermissions('project', task.project.id);
  const canEdit = ws.canEdit || proj.canEdit;
  const canDelete = ws.canDelete || proj.canDelete;
  const isPermissionsLoading = ws.isLoading || proj.isLoading;

  // Inline edit state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [type, setType] = useState(task.type || 'feature');
  const [storyPoints, setStoryPoints] = useState<string>(task.storyPoints ? String(task.storyPoints) : '');
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id || 'unassigned');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch workspace members when component mounts
  useEffect(() => {
    if (task.workspaceId && workspaceMembers.length === 0) {
      fetchWorkspaceMembers(task.workspaceId);
    }
  }, [task.workspaceId, workspaceMembers.length, fetchWorkspaceMembers]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'done':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Task title is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        type,
        storyPoints: storyPoints ? Number(storyPoints) : undefined,
        assigneeId: assigneeId === 'unassigned' ? undefined : assigneeId,
      });

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInlineBlur = () => {
    // Auto-save title/description edits on blur
    handleSave();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Project: <Link href={`/projects/${task.project.id}`} className="hover:underline text-primary">{task.project.name}</Link>
              <span className="mx-2">•</span>
              <span className="font-mono text-xs">{task.id.slice(0, 8).toUpperCase()}</span>
            </p>
            <input
              className="w-full bg-transparent text-3xl font-bold outline-none focus:ring-0"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleInlineBlur}
              disabled={!canEdit || isSaving}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? <Spinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      {/* Top two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main content (70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleInlineBlur}
                placeholder="Add a rich description..."
                className="min-h-[140px]"
                disabled={!canEdit || isSaving}
              />
            </CardContent>
          </Card>

          {/* Subtasks */}
          <SubTasks taskId={task.id} workspaceId={task.workspaceId} />

          {/* Linked Tasks */}
          <LinkedTasks taskId={task.id} projectId={task.project.id} workspaceId={task.workspaceId} />
        </div>

        {/* Right: metadata panel (30%) */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={status} onValueChange={setStatus} disabled={!canEdit || isSaving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority} disabled={!canEdit || isSaving}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignees */}
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId} disabled={!canEdit || isSaving || isMembersLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={isMembersLoading ? 'Loading...' : 'Select assignee'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {workspaceMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={member.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.firstName} {member.lastName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Story Points */}
              <div className="space-y-2">
                <Label>Story Points</Label>
                <Input
                  type="number"
                  min={0}
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  onBlur={handleInlineBlur}
                  disabled={!canEdit || isSaving}
                />
              </div>

              {/* Labels */}
              <div className="space-y-2">
                <Label>Labels</Label>
                <Input placeholder="Add labels (comma separated)" disabled />
                <p className="text-xs text-muted-foreground">Labels UI coming next.</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
              {task.updatedAt && task.updatedAt !== task.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" disabled />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: activity tabs full width */}
      <div className="mt-8">
        <Tabs defaultValue="comments">
          <TabsList>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>
          <TabsContent value="comments" className="mt-4">
            <CommentSection taskId={task.id} workspaceId={task.workspaceId} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <History taskId={task.id} />
          </TabsContent>
          <TabsContent value="attachments" className="mt-4">
            <TaskAttachmentUploader taskId={task.id} workspaceId={task.workspaceId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
