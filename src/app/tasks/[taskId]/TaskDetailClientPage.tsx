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
import { Calendar, Clock, User, ArrowLeft, Edit, Save, X, Plus, GitBranch, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
  projectTaskId: number;
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
    key: string;
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

interface GitHubPullRequest {
  id: string;
  githubPrNumber: number;
  title: string;
  state: string;
  isDraft: boolean;
  headBranch: string;
  baseBranch: string;
  authorLogin: string;
  githubCreatedAt: Date;
  checksStatus: string;
  reviewStatus: string;
  repositoryFullName: string;
}

interface GitHubActivity {
  id: string;
  activityType: string;
  actorLogin: string;
  title: string;
  description: string | null;
  githubUrl: string | null;
  githubCreatedAt: Date;
  repositoryFullName: string;
}

interface LinkedRepository {
  id: string;
  repositoryName: string;
  repositoryFullName: string;
  defaultBranch: string;
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

  // GitHub integration state
  const [linkedRepositories, setLinkedRepositories] = useState<LinkedRepository[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [githubActivities, setGithubActivities] = useState<GitHubActivity[]>([]);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [githubLoading, setGithubLoading] = useState(true);

  // Generate human-readable task ID
  const humanTaskId = `${task.project.key}-${task.projectTaskId}`;

  // Fetch workspace members when component mounts
  useEffect(() => {
    if (task.workspaceId && workspaceMembers.length === 0) {
      fetchWorkspaceMembers(task.workspaceId);
    }
  }, [task.workspaceId, workspaceMembers.length, fetchWorkspaceMembers]);

  // Load GitHub integration data
  useEffect(() => {
    const loadGithubData = async () => {
      try {
        setGithubLoading(true);

        // Load linked repositories for this project
        const reposRes = await fetch(`/api/projects/${task.projectId}/repositories`);
        if (reposRes.ok) {
          const reposData = await reposRes.json();
          setLinkedRepositories(reposData.repositories || []);
        }

        // Load pull requests for this task
        const prsRes = await fetch(`/api/tasks/${task.id}/github/pull-requests`);
        if (prsRes.ok) {
          const prsData = await prsRes.json();
          setPullRequests(prsData.pullRequests || []);
        }

        // Load GitHub activities for this task
        const activitiesRes = await fetch(`/api/tasks/${task.id}/github/activities`);
        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          setGithubActivities(activitiesData.activities || []);
        }
      } catch (error) {
        console.error('Error loading GitHub data:', error);
      } finally {
        setGithubLoading(false);
      }
    };

    loadGithubData();
  }, [task.id, task.projectId]);

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

  const createBranch = async (repositoryId: string, repositoryName: string) => {
    if (!linkedRepositories.find(repo => repo.id === repositoryId)) {
      toast({
        title: 'Error',
        description: 'Repository not found',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingBranch(true);
    try {
      const response = await fetch('/api/github/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          repositoryId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Branch Created',
          description: `Successfully created branch ${data.branch.name}`,
        });
        
        // Open the new branch in GitHub
        if (data.branch.url) {
          window.open(data.branch.url, '_blank');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create branch');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create branch',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const getBranchName = (title: string) => {
    return `feature/${humanTaskId.toLowerCase()}-${title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
      .replace(/-+$/, '')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failure':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />;
    }
  };

  const getReviewStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'changes_requested':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
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
              <span className="font-mono text-sm font-bold">{humanTaskId}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: main content (60%) */}
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

          {/* Unified Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {githubLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading activity...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {githubActivities.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No development activity yet. Create a branch to get started!
                      </p>
                    ) : (
                      githubActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <GitBranch className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.title}</p>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{activity.actorLogin}</span>
                              <span>•</span>
                              <span>{new Date(activity.githubCreatedAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{activity.repositoryFullName}</span>
                            </div>
                          </div>
                          {activity.githubUrl && (
                            <Button variant="ghost" size="sm" onClick={() => window.open(activity.githubUrl!, '_blank')}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subtasks */}
          <SubTasks taskId={task.id} workspaceId={task.workspaceId} />

          {/* Linked Tasks */}
          <LinkedTasks taskId={task.id} projectId={task.project.id} workspaceId={task.workspaceId} />
        </div>

        {/* Development Panel (20%) */}
        <div className="space-y-6">
          {linkedRepositories.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Development
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create Branch */}
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium mb-1">Create Branch</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Suggested: {getBranchName(title)}
                    </p>
                  </div>
                  
                  {linkedRepositories.length === 1 ? (
                    <Button
                      onClick={() => createBranch(linkedRepositories[0].id, linkedRepositories[0].repositoryName)}
                      disabled={isCreatingBranch}
                      size="sm"
                      className="w-full"
                    >
                      {isCreatingBranch ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <GitBranch className="h-3 w-3 mr-2" />
                          Create Branch
                        </>
                      )}
                    </Button>
                  ) : (
                    <Select onValueChange={(repoId) => {
                      const repo = linkedRepositories.find(r => r.id === repoId);
                      if (repo) createBranch(repo.id, repo.repositoryName);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose repository" />
                      </SelectTrigger>
                      <SelectContent>
                        {linkedRepositories.map((repo) => (
                          <SelectItem key={repo.id} value={repo.id}>
                            {repo.repositoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Separator />

                {/* Pull Requests */}
                <div className="space-y-3">
                  <p className="font-medium text-sm">Pull Requests</p>
                  {pullRequests.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No pull requests yet</p>
                  ) : (
                    <div className="space-y-2">
                      {pullRequests.map((pr) => (
                        <div key={pr.id} className="p-2 border rounded-md space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{pr.title}</p>
                              <p className="text-xs text-muted-foreground">#{pr.githubPrNumber} • {pr.authorLogin}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://github.com/${pr.repositoryFullName}/pull/${pr.githubPrNumber}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(pr.checksStatus)}
                              <span className="text-xs capitalize">{pr.checksStatus}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getReviewStatusIcon(pr.reviewStatus)}
                              <span className="text-xs capitalize">{pr.reviewStatus.replace('_', ' ')}</span>
                            </div>
                          </div>
                          
                          <Badge 
                            variant={pr.state === 'open' ? 'default' : pr.state === 'merged' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {pr.isDraft ? 'Draft' : pr.state}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">No GitHub repositories linked</p>
                  <Link href={`/projects/${task.projectId}/settings?tab=integrations`}>
                    <Button variant="outline" size="sm">
                      Link Repository
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details Panel (20%) */}
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: additional content tabs full width */}
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
