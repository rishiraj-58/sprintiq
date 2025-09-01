'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRStatusBadges } from '@/components/github/PRStatusBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Calendar, Clock, User, ArrowLeft, Edit, Save, X, Plus, GitBranch, ExternalLink, CheckCircle2, AlertCircle, Loader2, Search } from 'lucide-react';
import { useTask } from '@/stores/hooks/useTask';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/ui/use-toast';
import { CommentSection } from '@/components/tasks/CommentSection';
import { TaskAttachmentUploader } from '@/components/tasks/TaskAttachmentUploader';
import { SubTasks } from '@/components/tasks/SubTasks';
import { LinkedTasks } from '@/components/tasks/LinkedTasks';
import { History } from '@/components/tasks/History';
// Import the ActivityFeed component for displaying task activities
import { ActivityFeed } from '../../../components/tasks/ActivityFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  assignee?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
  creator?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
}

interface TaskDetailClientPageProps {
  task: TaskDetailData;
  authError?: Error | null;
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

export function TaskDetailClientPage({ task, authError }: TaskDetailClientPageProps) {
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
  const [existingBranches, setExistingBranches] = useState<any[]>([]);
  const [showBranchLinkDialog, setShowBranchLinkDialog] = useState(false);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [searchedBranches, setSearchedBranches] = useState<any[]>([]);
  const [isSearchingBranches, setIsSearchingBranches] = useState(false);

  // Generate human-readable task ID
  const humanTaskId = `${task.project.key}-${task.projectTaskId}`;

  // Search for branches in linked repositories
  const searchBranches = async (query: string = '') => {
    if (!linkedRepositories.length) return;

    setIsSearchingBranches(true);
    try {
      const searchParams = new URLSearchParams({
        projectId: task.projectId,
        q: query
      });

      const response = await fetch(`/api/github/branches?${searchParams}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Branch search results:', data.branches);
        setSearchedBranches(data.branches || []);
      } else {
        console.error('Failed to search branches:', await response.text());
        setSearchedBranches([]);
      }
    } catch (error) {
      console.error('Error searching branches:', error);
      setSearchedBranches([]);
    } finally {
      setIsSearchingBranches(false);
    }
  };

  // Handle branch search input change
  const handleBranchSearch = (query: string) => {
    setBranchSearchQuery(query);
    // Debounce the search
    setTimeout(() => {
      searchBranches(query);
    }, 300);
  };

  // Link existing branch to task
  const linkBranchToTask = async (branch: any) => {
    try {
      // Create a githubBranches record linking this branch to the task
      const response = await fetch('/api/github/link-branch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          projectRepositoryId: branch.projectRepositoryId,
          branchName: branch.name,
          githubBranchRef: `refs/heads/${branch.name}`,
        }),
      });

      if (response.ok || response.status === 409) {
        // Refresh activities to show the linked branch
        const activitiesRes = await fetch(`/api/tasks/${task.id}/github/activities`);
        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          setGithubActivities(activitiesData.activities || []);
        }

        setShowBranchLinkDialog(false);
        setBranchSearchQuery('');
        setSearchedBranches([]);

        // Show success message
        if (response.status === 409) {
          console.log(`Branch ${branch.name} is already linked to task ${humanTaskId}`);
        } else {
          console.log(`Successfully linked branch ${branch.name} to task ${humanTaskId}`);
        }

        // Refresh the GitHub data to show the linked branch
        console.log('Refreshing GitHub data after branch linking...');

        // Also refresh pull requests and activities to show the linked branch
        try {
          const prRes = await fetch(`/api/tasks/${task.id}/github/pull-requests`);
          if (prRes.ok) {
            const prData = await prRes.json();
            setPullRequests(prData.pullRequests || []);
          }

          const activitiesRes = await fetch(`/api/tasks/${task.id}/github/activities`);
          if (activitiesRes.ok) {
            const activitiesData = await activitiesRes.json();
            setGithubActivities(activitiesData.activities || []);
            console.log('Updated activities after branch linking:', activitiesData.activities?.length || 0);
          }
        } catch (error) {
          console.error('Error refreshing PRs and activities:', error);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to link branch:', errorText);

        // Show user-friendly error message
        if (errorText.includes('already linked')) {
          console.log(`Branch ${branch.name} is already linked to this task`);
        } else {
          console.error(`Error linking branch: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error linking branch:', error);
    }
  };

  // Fetch workspace members when component mounts
  useEffect(() => {
    if (task.workspaceId && workspaceMembers.length === 0) {
      fetchWorkspaceMembers(task.workspaceId);
    }
  }, [task.workspaceId, workspaceMembers.length, fetchWorkspaceMembers]);

  // Load GitHub integration data
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    let timeoutId: NodeJS.Timeout;

    const loadGithubData = async () => {
      if (githubLoading) return; // Prevent multiple simultaneous calls

      try {
        setGithubLoading(true);

        // Load linked repositories for this project
        const reposRes = await fetch(`/api/projects/${task.projectId}/repositories`);
        if (!isMounted) return; // Check if component is still mounted

        let loadedRepositories: LinkedRepository[] = [];
        if (reposRes.ok) {
          const reposData = await reposRes.json();
          loadedRepositories = reposData.repositories || [];
          setLinkedRepositories(loadedRepositories);
        } else {
          console.error(`Failed to load repositories: ${reposRes.status}`);
          setLinkedRepositories([]); // Set empty array on error
        }

        // Check for existing branches for this task
        if (loadedRepositories.length > 0) {
          try {
            // First check if there are any linked branches in the githubBranches table
            const linkedBranches: any[] = [];

            for (const repo of loadedRepositories) {
              try {
                console.log(`Checking branches for task ${task.id} in repo ${repo.repositoryName} (${repo.id})`);
                // Query githubBranches table directly to see if any branches are linked to this task
                const branchCheckRes = await fetch(`/api/github/branches/check?taskId=${task.id}&repositoryId=${repo.id}`);
                console.log(`Branch check response status: ${branchCheckRes.status}`);
                if (branchCheckRes.ok) {
                  const branchData = await branchCheckRes.json();
                  console.log(`Branch check response data:`, branchData);
                  if (branchData.branches && branchData.branches.length > 0) {
                    console.log(`Found ${branchData.branches.length} linked branches for repo ${repo.repositoryName}`);
                    linkedBranches.push(...branchData.branches.map((branch: any) => ({
                      ...branch,
                      repositoryName: repo.repositoryName,
                      activityType: 'branch_linked',
                      title: `Branch linked: ${branch.branchName}`,
                      description: `Branch ${branch.branchName} is linked to task ${humanTaskId}`,
                      taskId: task.id,
                      repositoryFullName: repo.repositoryFullName,
                      githubUrl: `https://github.com/${repo.repositoryFullName}/tree/${branch.branchName}`,
                      githubUrl_debug: {
                        repoFullName: repo.repositoryFullName,
                        branchName: branch.branchName,
                        constructedUrl: `https://github.com/${repo.repositoryFullName}/tree/${branch.branchName}`
                      }
                    })));
                  } else {
                    console.log(`No linked branches found for repo ${repo.repositoryName}`);
                  }
                } else {
                  const errorText = await branchCheckRes.text();
                  console.error(`Branch check failed for repo ${repo.repositoryName}: ${branchCheckRes.status} - ${errorText}`);
                }
              } catch (branchError) {
                console.error(`Error checking branches for repo ${repo.repositoryName}:`, branchError);
              }
            }

            // Also check activities for any branch-related activities
            const activitiesRes = await fetch(`/api/tasks/${task.id}/github/activities`);
            if (activitiesRes.ok) {
              const activitiesData = await activitiesRes.json();
              console.log('GitHub activities response:', activitiesData);
              console.log('Total activities found:', activitiesData.activities?.length || 0);

              if (activitiesData.activities && activitiesData.activities.length > 0) {
                console.log('Sample activity:', activitiesData.activities[0]);
              }

              // Look for any activities that might indicate branch creation or linking
              // This could be 'branch_created', 'branch_linked', 'create', 'push', or other activity types
              const branchActivities = activitiesData.activities?.filter((activity: any) => {
                const activityType = activity.activityType?.toLowerCase() || '';
                const title = activity.title?.toLowerCase() || '';
                const description = activity.description?.toLowerCase() || '';

                console.log(`Checking activity: ${activityType} - ${title} - TaskId: ${activity.taskId}`);

                // Check if this activity is related to branch creation or linking
                const isBranchRelated = activityType.includes('branch') ||
                                      activityType.includes('create') ||
                                      title.includes('branch') ||
                                      title.includes('created') ||
                                      title.includes('linked');

                const containsTaskId = title.includes(humanTaskId.toLowerCase()) ||
                                     description.includes(humanTaskId.toLowerCase()) ||
                                     activity.taskId === task.id;

                console.log(`  - Branch related: ${isBranchRelated}, Contains task ID: ${containsTaskId}`);
                console.log(`  - Activity taskId: ${activity.taskId}, Current taskId: ${task.id}`);
                console.log(`  - Human task ID: ${humanTaskId}, Title: ${title}, Description: ${description}`);

                return isBranchRelated && containsTaskId;
              }) || [];

              console.log('Branch activities found:', branchActivities);

              // Combine linked branches from database with activities
              const allBranches = [...linkedBranches, ...branchActivities];
              console.log('All branches found (from DB + activities):', allBranches);
              console.log('Linked branches from DB:', linkedBranches.length);
              console.log('Branch activities from API:', branchActivities.length);
              console.log('Setting existingBranches to:', allBranches.length, 'branches');

              if (allBranches.length > 0) {
                console.log('First branch details:', {
                  title: allBranches[0].title,
                  githubUrl: allBranches[0].githubUrl,
                  repositoryFullName: allBranches[0].repositoryFullName,
                  debug: allBranches[0].githubUrl_debug
                });
              }

              setExistingBranches(allBranches);
            } else {
              console.error('Failed to fetch activities:', activitiesRes.status, await activitiesRes.text());
              // Still set the linked branches we found
              setExistingBranches(linkedBranches);
            }
          } catch (error) {
            console.error('Error checking branches:', error);
            setExistingBranches([]);
          }
        }

        // Load pull requests for this task
        const prsRes = await fetch(`/api/tasks/${task.id}/github/pull-requests`);
        if (prsRes.ok) {
          const prsData = await prsRes.json();
          setPullRequests(prsData.pullRequests || []);
        }

        // Load GitHub activities for this task (for unified feed)
        const activitiesRes = await fetch(`/api/tasks/${task.id}/github/activities`);
        if (!isMounted) return; // Check if component is still mounted

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          setGithubActivities(activitiesData.activities || []);
        } else {
          console.error(`Failed to load activities: ${activitiesRes.status}`);
          setGithubActivities([]); // Set empty array on error
        }
      } catch (error) {
        console.error('Error loading GitHub data:', error);
        if (isMounted) {
          setLinkedRepositories([]); // Reset on error
          setGithubActivities([]);
        }
      } finally {
        if (isMounted) {
          setGithubLoading(false);
        }
      }
    };

    // Debounce the loading to prevent rapid calls
    timeoutId = setTimeout(() => {
      if (isMounted) {
        loadGithubData();
      }
    }, 100);

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [task.id, task.projectId, githubLoading]); // Added githubLoading to dependencies

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
        return <Clock className="h-4 w-4 text-yellow-600" />;
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
      {/* Authentication Error Banner */}
      {authError && (
        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-amber-600">⚠️</div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">Connection Issue</h3>
              <p className="text-sm text-amber-700 mt-1">
                We're having trouble connecting to the database. Some features may be limited. Please try refreshing the page.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

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
          <ActivityFeed taskId={task.id} workspaceId={task.workspaceId} />

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
                {/* Branch Management */}
                <div className="space-y-3">
                  {existingBranches.length > 0 ? (
                    // Branch already exists
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium mb-1">Branch Created</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <GitBranch className="h-3 w-3" />
                          <span>{existingBranches[0].title}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (existingBranches[0].githubUrl) {
                              console.log('Opening GitHub URL:', existingBranches[0].githubUrl);
                              window.open(existingBranches[0].githubUrl, '_blank');
                            } else {
                              console.error('No GitHub URL available for branch');
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Branch
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // No branch exists - show create options
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium mb-1">Create Branch</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Suggested: {getBranchName(title)}
                        </p>
                      </div>

                      {linkedRepositories.length === 1 ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => createBranch(linkedRepositories[0].id, linkedRepositories[0].repositoryName)}
                            disabled={isCreatingBranch}
                            size="sm"
                            className="flex-1"
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBranchLinkDialog(true)}
                          >
                            <Plus className="h-3 w-3" />
                            Link Existing
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBranchLinkDialog(true)}
                            className="w-full"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Link Existing Branch
                          </Button>
                        </div>
                      )}
                    </div>
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
                          
                          {/* Live Status Badges */}
                          <PRStatusBadges pullRequest={{
                            state: pr.state as 'open' | 'closed' | 'merged',
                            reviewStatus: pr.reviewStatus as 'pending' | 'approved' | 'changes_requested',
                            checksStatus: pr.checksStatus as 'pending' | 'success' | 'failure',
                            isDraft: pr.isDraft || false
                          }} />
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

      {/* Link Existing Branch Dialog */}
      <Dialog open={showBranchLinkDialog} onOpenChange={setShowBranchLinkDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Link Existing Branch
            </DialogTitle>
            <DialogDescription>
              Link an existing branch to this task. The branch name should contain the task ID ({humanTaskId.toLowerCase()}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="branch-search">Search Branches</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="branch-search"
                  placeholder={`Search branches... (try "${humanTaskId.toLowerCase()}")`}
                  value={branchSearchQuery}
                  onChange={(e) => handleBranchSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="space-y-2">
              <Label>Available Branches</Label>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {linkedRepositories.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <GitBranch className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No repositories linked</p>
                    <p className="text-xs">Link a repository in project settings to see available branches</p>
                  </div>
                ) : isSearchingBranches ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm">Searching branches...</p>
                  </div>
                ) : searchedBranches.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <GitBranch className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No branches found</p>
                    <p className="text-xs">
                      {branchSearchQuery
                        ? `No branches match "${branchSearchQuery}"`
                        : `Try searching for branches containing "${humanTaskId.toLowerCase()}"`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {searchedBranches.map((branch, index) => (
                      <div key={index} className="p-3 hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{branch.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {branch.repositoryFullName} • {branch.protected ? 'Protected' : 'Unprotected'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => linkBranchToTask(branch)}
                            className="ml-2"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Link
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Helper Text */}
            {linkedRepositories.length > 0 && !isSearchingBranches && searchedBranches.length === 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Try searching for branches that contain your task ID (
                  <code className="bg-muted px-2 py-1 rounded text-xs">{humanTaskId.toLowerCase()}</code>
                  ) to find relevant branches.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBranchLinkDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
