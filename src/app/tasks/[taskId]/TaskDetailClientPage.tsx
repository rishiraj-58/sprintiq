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
import { Calendar, Clock, User, ArrowLeft, Edit, Save, X } from 'lucide-react';
import { useTask } from '@/stores/hooks/useTask';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/ui/use-toast';
import { CommentSection } from '@/components/tasks/CommentSection';
import { TaskAttachmentUploader } from '@/components/tasks/TaskAttachmentUploader';

interface TaskDetailData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
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
  const { canEdit, canDelete, isLoading: isPermissionsLoading } = usePermissions('workspace', task.workspaceId);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editStatus, setEditStatus] = useState(task.status);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editAssigneeId, setEditAssigneeId] = useState(task.assignee?.id || 'unassigned');
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
    if (!editTitle.trim()) {
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
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        status: editStatus,
        priority: editPriority,
        assigneeId: editAssigneeId === 'unassigned' ? undefined : editAssigneeId,
      });

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });

      setIsEditing(false);
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

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssigneeId(task.assignee?.id || 'unassigned');
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? 'Edit Task' : 'Task Details'}</h1>
            <p className="text-muted-foreground">
              Project: <Link href={`/projects/${task.project.id}`} className="hover:underline text-primary">
                {task.project.name}
              </Link>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || !editTitle.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              onClick={() => setIsEditing(true)} 
              disabled={isPermissionsLoading || !canEdit}
            >
              {isPermissionsLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                {isEditing ? (
                  <Input
                    id="title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-lg font-medium">{task.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={isSaving}
                    rows={4}
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {task.description || 'No description provided.'}
                  </p>
                )}
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  {isEditing ? (
                    <Select value={editStatus} onValueChange={setEditStatus} disabled={isSaving}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  {isEditing ? (
                    <Select value={editPriority} onValueChange={setEditPriority} disabled={isSaving}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Assignee */}
              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                {isEditing ? (
                  <Select value={editAssigneeId} onValueChange={setEditAssigneeId} disabled={isSaving || isMembersLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={isMembersLoading ? "Loading members..." : "Select assignee (optional)"} />
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
                ) : task.assignee ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={task.assignee.avatarUrl || undefined} />
                      <AvatarFallback>
                        {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{task.assignee.firstName} {task.assignee.lastName}</p>
                      <p className="text-sm text-muted-foreground">{task.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Unassigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Created By</CardTitle>
            </CardHeader>
            <CardContent>
              {task.creator ? (
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={task.creator.avatarUrl || undefined} />
                    <AvatarFallback>
                      {task.creator.firstName?.[0]}{task.creator.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{task.creator.firstName} {task.creator.lastName}</p>
                    <p className="text-sm text-muted-foreground">{task.creator.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Unknown</p>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
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

              {task.dueDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Due:</span>
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="mt-8">
        <TaskAttachmentUploader 
          taskId={task.id} 
          workspaceId={task.workspaceId}
        />
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <CommentSection 
          taskId={task.id} 
          workspaceId={task.workspaceId}
        />
      </div>
    </div>
  );
}
