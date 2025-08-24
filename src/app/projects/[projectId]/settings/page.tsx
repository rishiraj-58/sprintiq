'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Save,
  AlertTriangle,
  Archive,
  Trash2,
  Plus,
  X,
  Edit,
  Move,
  Workflow,
  Info,
  Shield,
  Users,
  Calendar,
  Tag,
  GitBranch,
  CheckCircle2,
  Circle,
  ExternalLink,
  AlertCircle,
  Search
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Default project settings structure
const defaultProjectSettings = {
  general: {
    name: '',
    key: '',
    description: '',
    visibility: 'private',
    category: '',
    startDate: '',
    targetEndDate: '',
    budget: 0,
    currency: 'USD',
    workspaceId: ''
  },
  
  workflow: {
    statuses: [
      { id: '1', name: 'Backlog', color: '#6B7280', order: 1, category: 'todo' },
      { id: '2', name: 'To Do', color: '#3B82F6', order: 2, category: 'todo' },
      { id: '3', name: 'In Progress', color: '#F59E0B', order: 3, category: 'in_progress' },
      { id: '4', name: 'In Review', color: '#8B5CF6', order: 4, category: 'in_review' },
      { id: '5', name: 'Testing', color: '#EC4899', order: 5, category: 'in_review' },
      { id: '6', name: 'Done', color: '#10B981', order: 6, category: 'done' },
      { id: '7', name: 'Blocked', color: '#EF4444', order: 7, category: 'blocked' }
    ],
    
    taskTypes: [
      { id: '1', name: 'Story', icon: '📋', color: '#3B82F6' },
      { id: '2', name: 'Bug', icon: '🐛', color: '#EF4444' },
      { id: '3', name: 'Task', icon: '✅', color: '#10B981' },
      { id: '4', name: 'Epic', icon: '🚀', color: '#8B5CF6' },
      { id: '5', name: 'Spike', icon: '🔍', color: '#F59E0B' }
    ],
    
    priorities: [
      { id: '1', name: 'Lowest', color: '#6B7280' },
      { id: '2', name: 'Low', color: '#10B981' },
      { id: '3', name: 'Medium', color: '#F59E0B' },
      { id: '4', name: 'High', color: '#EF4444' },
      { id: '5', name: 'Highest', color: '#DC2626' }
    ]
  },

  notifications: {
    emailNotifications: true,
    slackIntegration: true,
    taskAssignments: true,
    statusChanges: true,
    comments: false,
    dueDates: true,
    sprintUpdates: true
  },

  permissions: {
    allowGuestAccess: false,
    requireApprovalForTasks: false,
    restrictTimeTracking: false,
    enableFileUploads: true,
    maxFileSize: 10, // MB
    allowedFileTypes: ['jpg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
  }
};

interface SettingsPageProps {
  params: {
    projectId: string;
  };
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(defaultProjectSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3B82F6');
  const [selectedCategory, setSelectedCategory] = useState('todo');
  const { user } = useUser();
  const [workspaceRole, setWorkspaceRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskStatuses, setTaskStatuses] = useState<any[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<'active' | 'planning' | 'completed' | 'archived'>('active');
  
  // GitHub integration state
  const [githubIntegration, setGithubIntegration] = useState<any>(null);
  const [availableRepositories, setAvailableRepositories] = useState<any[]>([]);
  const [linkedRepositories, setLinkedRepositories] = useState<any[]>([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [repositoriesError, setRepositoriesError] = useState<string | null>(null);
  const [showAllReposDialog, setShowAllReposDialog] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState('');

  // GitHub Issues Triage state
  const [unlinkedIssues, setUnlinkedIssues] = useState<any[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [importingTask, setImportingTask] = useState(false);
  const [lastIssuesFetch, setLastIssuesFetch] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setIsLoading(true);
        
        // Load project data
        const projectRes = await fetch(`/api/projects/${params.projectId}`);
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setSettings(prev => ({
            ...prev,
            general: {
              name: projectData.name || '',
              key: projectData.key || '',
              description: projectData.description || '',
              visibility: projectData.visibility || 'private',
              category: projectData.category || '',
              startDate: projectData.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : '',
              targetEndDate: projectData.targetEndDate ? new Date(projectData.targetEndDate).toISOString().split('T')[0] : '',
              budget: projectData.budget || 0,
              currency: projectData.currency || 'USD',
              workspaceId: projectData.workspaceId || ''
            }
          }));
          setProjectStatus((projectData.status || 'active') as any);
        }

        // Load task statuses
        const statusesRes = await fetch(`/api/projects/${params.projectId}/task-statuses`);
        if (statusesRes.ok) {
          const statusesData = await statusesRes.json();
          setTaskStatuses(statusesData.statuses || []);
        }

        // Load workspace role
        const membersRes = await fetch(`/api/projects/${params.projectId}/members`, { headers: { 'Cache-Control': 'no-cache' } });
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          const my = (membersData.workspaceMembers || []).find((m: any) => m.id === user?.id);
          setWorkspaceRole(my?.role ?? null);
        }
      } catch (e) {
        console.error('Failed to load project data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id && params.projectId) {
      loadProjectData();
    }
  }, [user?.id, params.projectId]);

  // Load GitHub integration data
  const loadGithubIntegrationData = async () => {
    try {
      setRepositoriesLoading(true);
      
      // Get project data to find workspace ID
      const projectRes = await fetch(`/api/projects/${params.projectId}`);
      if (!projectRes.ok) return;
      
      const projectData = await projectRes.json();
      const workspaceId = projectData.workspaceId;
      
      // Check GitHub integration status
      const integrationRes = await fetch(`/api/github/status?workspace_id=${workspaceId}`);
      if (integrationRes.ok) {
        const integrationData = await integrationRes.json();
        setGithubIntegration(integrationData.integration);
        
        if (integrationData.integration) {
          console.log('Loading repositories for workspace:', workspaceId);
          setRepositoriesLoading(true);
          setRepositoriesError(null);

          // Load available repositories
          const reposRes = await fetch(`/api/github/repositories?workspace_id=${workspaceId}`);
          console.log('Repositories response status:', reposRes.status);
          if (reposRes.ok) {
            const reposData = await reposRes.json();
            console.log('Repositories data:', reposData);
            setAvailableRepositories(reposData.repositories || []);
          } else {
            const errorText = await reposRes.text();
            console.error('Failed to fetch repositories:', errorText);
            setRepositoriesError(`Failed to load repositories: ${errorText}`);
          }
          
          // Load linked repositories for this project
          const linkedRes = await fetch(`/api/projects/${params.projectId}/repositories`);
          if (linkedRes.ok) {
            const linkedData = await linkedRes.json();
            setLinkedRepositories(linkedData.repositories || []);
          } else {
            console.error('Failed to fetch linked repositories:', await linkedRes.text());
          }
        }
      }
    } catch (error) {
      console.error('Error loading GitHub integration data:', error);
      setRepositoriesError('Failed to load GitHub integration data');
    } finally {
      setRepositoriesLoading(false);
    }
  };

  useEffect(() => {
    if (params.projectId) {
      loadGithubIntegrationData();
    }
  }, [params.projectId]);

  // Auto-load GitHub issues when GitHub Triage tab is opened
  useEffect(() => {
    if (activeTab === 'github-triage' && githubIntegration && linkedRepositories.length > 0) {
      loadUnlinkedIssues();
    }
  }, [activeTab, githubIntegration, linkedRepositories]);

  const linkRepository = async (repository: any) => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}/repositories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubIntegrationId: githubIntegration.id,
          repositoryName: repository.name,
          repositoryFullName: repository.fullName,
          githubRepoId: repository.id,
          defaultBranch: repository.defaultBranch,
        }),
      });

      if (response.ok) {
        // Refresh linked repositories
        await loadGithubIntegrationData();
        setSaveMessage('Repository linked successfully');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error('Failed to link repository');
      }
    } catch (error) {
      console.error('Error linking repository:', error);
      setSaveMessage('Failed to link repository');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const unlinkRepository = async (repositoryId: string) => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}/repositories/${repositoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh linked repositories
        await loadGithubIntegrationData();
        setSaveMessage('Repository unlinked successfully');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error('Failed to unlink repository');
      }
    } catch (error) {
      console.error('Error unlinking repository:', error);
      setSaveMessage('Failed to unlink repository');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Load unlinked GitHub issues
  const loadUnlinkedIssues = async (forceRefresh = false) => {
    try {
      setIssuesLoading(true);
      setIssuesError(null);

      // Check if we have cached issues and it's been less than 5 minutes since last fetch
      const now = Date.now();
      const cacheDuration = 5 * 60 * 1000; // 5 minutes

      if (!forceRefresh && lastIssuesFetch && (now - lastIssuesFetch) < cacheDuration && unlinkedIssues.length > 0) {
        console.log('Using cached issues, last fetch was', Math.round((now - lastIssuesFetch) / 1000), 'seconds ago');
        setIssuesLoading(false);
        return;
      }

      const response = await fetch(`/api/github/issues/unlinked?projectId=${params.projectId}`);

      if (response.ok) {
        const data = await response.json();
        setUnlinkedIssues(data.issues || []);
        setLastIssuesFetch(now);
        console.log(`Loaded ${data.issues?.length || 0} unlinked GitHub issues`);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch unlinked issues:', errorText);
        setIssuesError(`Failed to load issues: ${errorText}`);
      }
    } catch (error) {
      console.error('Error loading unlinked issues:', error);
      setIssuesError('Failed to load GitHub issues');
    } finally {
      setIssuesLoading(false);
    }
  };

  // Import GitHub issue as SprintIQ task
  const importIssueAsTask = async (issue: any) => {
    try {
      setImportingTask(true);

      // Create the task
      const taskData = {
        title: issue.title,
        description: issue.body || `Imported from GitHub issue #${issue.number}`,
        projectId: params.projectId,
        status: 'pending',
        priority: 'medium',
        taskType: 'bug', // Default to bug since it's coming from GitHub issues
        externalUrl: issue.htmlUrl,
        externalSource: 'github_issue',
        externalId: issue.id.toString(),
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const newTask = await response.json();

        // Create external task link to track the GitHub issue connection
        await fetch(`/api/tasks/${newTask.id}/external-links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkType: 'github_issue',
            externalUrl: issue.htmlUrl,
            title: `GitHub Issue #${issue.number}`,
            description: issue.title,
            externalId: issue.id.toString(),
            metadata: {
              issueNumber: issue.number,
              repository: issue.repository.fullName,
              author: issue.author,
              labels: issue.labels,
              createdAt: issue.createdAt,
            },
          }),
        });

        // Refresh issues list
        await loadUnlinkedIssues();
        setSaveMessage('Issue imported as task successfully');
        setTimeout(() => setSaveMessage(null), 3000);
        setShowImportDialog(false);
        setSelectedIssue(null);
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error importing issue as task:', error);
      setSaveMessage('Failed to import issue as task');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setImportingTask(false);
    }
  };

  const refreshProjectStatus = async () => {
    try {
      const projectRes = await fetch(`/api/projects/${params.projectId}`, { headers: { 'Cache-Control': 'no-cache' } });
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProjectStatus((projectData.status || 'active') as any);
      }
    } catch {}
  };

  const handleSaveGeneral = async () => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: settings.general.name,
          description: settings.general.description,
          visibility: settings.general.visibility,
          category: settings.general.category,
          currency: settings.general.currency,
          startDate: settings.general.startDate ? new Date(settings.general.startDate).toISOString() : null,
          targetEndDate: settings.general.targetEndDate ? new Date(settings.general.targetEndDate).toISOString() : null,
          budget: settings.general.budget || null,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
        console.log('Settings saved successfully');
      } else {
        setSaveMessage('Failed to save settings');
        setTimeout(() => setSaveMessage(null), 3000);
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    
    try {
      const response = await fetch(`/api/projects/${params.projectId}/task-statuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newStatusName,
          color: newStatusColor,
          order: taskStatuses.length + 1,
        }),
      });

      if (response.ok) {
        const newStatus = await response.json();
        setTaskStatuses(prev => [...prev, newStatus.status]);
        setNewStatusName('');
        setNewStatusColor('#3B82F6');
        setSelectedCategory('todo');
      } else {
        console.error('Failed to add status');
      }
    } catch (error) {
      console.error('Error adding status:', error);
    }
  };

  const handleRemoveStatus = async (statusId: string) => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}/task-statuses/${statusId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTaskStatuses(prev => prev.filter(s => s.id !== statusId));
      } else {
        console.error('Failed to remove status');
      }
    } catch (error) {
      console.error('Error removing status:', error);
    }
  };

  const handleArchiveProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      if (res.ok) {
        setSaveMessage('Project archived successfully');
        setTimeout(() => setSaveMessage(null), 3000);
        setProjectStatus('archived');
        refreshProjectStatus();
      } else {
        setSaveMessage('Failed to archive project');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (e) {
      setSaveMessage('Failed to archive project');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleUnarchiveProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (res.ok) {
        setSaveMessage('Project unarchived successfully');
        setTimeout(() => setSaveMessage(null), 3000);
        setProjectStatus('active');
        refreshProjectStatus();
      } else {
        setSaveMessage('Failed to unarchive project');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (e) {
      setSaveMessage('Failed to unarchive project');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}`, { method: 'DELETE' });
      if (res.ok) {
        // Redirect to projects listing after deletion
        router.push('/projects');
      } else {
        setSaveMessage('Failed to delete project');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (e) {
      setSaveMessage('Failed to delete project');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleNotificationChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handlePermissionChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Settings</h1>
          <p className="text-muted-foreground">
            Configure project details, workflows, and permissions
          </p>
        </div>
        <div className="flex items-center gap-4">
          {saveMessage && (
            <div className={`px-3 py-2 rounded-md text-sm ${
              saveMessage.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {saveMessage}
            </div>
          )}
          <Button onClick={handleSaveGeneral} disabled={!isEditing} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="github-triage">GitHub Triage</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={settings.general.name}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, name: e.target.value }
                      }));
                      setIsEditing(true);
                    }}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="key">Project Key</Label>
                  <Input
                    id="key"
                    value={settings.general.key}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, key: e.target.value.toUpperCase() }
                      }));
                      setIsEditing(true);
                    }}
                    placeholder="PROJECT_KEY"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for task IDs (e.g., {settings.general.key}-123)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.general.description}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, description: e.target.value }
                    }));
                    setIsEditing(true);
                  }}
                  placeholder="Describe your project..."
                  rows={3}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={settings.general.visibility}
                    onValueChange={(value) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, visibility: value }
                      }));
                      setIsEditing(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workspace">Workspace Members</SelectItem>
                      <SelectItem value="team">Team Members Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={settings.general.category}
                    onValueChange={(value) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, category: value }
                      }));
                      setIsEditing(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, currency: value }
                      }));
                      setIsEditing(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={settings.general.startDate}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, startDate: e.target.value }
                      }));
                      setIsEditing(true);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Target End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={settings.general.targetEndDate}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, targetEndDate: e.target.value }
                      }));
                      setIsEditing(true);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={settings.general.budget}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, budget: parseInt(e.target.value) }
                      }));
                      setIsEditing(true);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Settings */}
        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Task Statuses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {taskStatuses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No task statuses configured yet</p>
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/projects/${params.projectId}/task-statuses/seed`, {
                          method: 'POST',
                        });
                        if (response.ok) {
                          const data = await response.json();
                          setTaskStatuses(data.statuses);
                        }
                      } catch (error) {
                        console.error('Error seeding statuses:', error);
                      }
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Default Statuses
                  </Button>
                </div>
              )}
              
              {taskStatuses.length > 0 && (
                <div className="grid gap-4">
                  {taskStatuses.map((status) => (
                    <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="font-medium">{status.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          Order: {status.order}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveStatus(status.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Status name"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <Button onClick={handleAddStatus} disabled={!newStatusName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Task Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settings.workflow.taskTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type.icon}</span>
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: type.color }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Priority Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settings.workflow.priorities.map((priority) => (
                  <div key={priority.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{priority.name}</span>
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: priority.color }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                GitHub Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!githubIntegration ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <GitBranch className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">GitHub Not Connected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your workspace to GitHub to link repositories to this project.
                  </p>
                  <Button onClick={() => router.push(`/dashboard/workspace/${settings.general.workspaceId}?tab=integrations`)}>
                    Connect GitHub
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Integration Status */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-900">GitHub Connected</h4>
                        <p className="text-sm text-green-700">
                          Organization: {githubIntegration.githubOrgName}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/workspace/${settings.general.workspaceId}?tab=integrations`)}
                    >
                      Manage
                    </Button>
                  </div>

                  {/* Repository Linking */}
                  <div>
                    <h4 className="font-medium mb-4">Linked Repositories</h4>

                    {repositoriesLoading ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Loading repositories...</p>
                      </div>
                    ) : repositoriesError ? (
                      <div className="text-center py-6 bg-destructive/10 rounded-lg border border-destructive/20">
                        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                        <p className="text-sm text-destructive mb-2">Failed to load repositories</p>
                        <p className="text-xs text-muted-foreground">{repositoriesError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={loadGithubIntegrationData}
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {linkedRepositories.length === 0 ? (
                          <div className="text-center py-6 bg-muted/50 rounded-lg">
                            <Circle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-4">
                              No repositories linked to this project yet.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {linkedRepositories.map((repo: any) => (
                              <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <h5 className="font-medium">{repo.repositoryName}</h5>
                                    <p className="text-sm text-muted-foreground">{repo.repositoryFullName}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`https://github.com/${repo.repositoryFullName}`, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => unlinkRepository(repo.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Available Repositories */}
                        {availableRepositories.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-sm">Available Repositories</h5>
                              {availableRepositories.length > 3 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowAllReposDialog(true)}
                                  className="text-xs"
                                >
                                  See All ({availableRepositories.length})
                                </Button>
                              )}
                            </div>
                            <div className="grid gap-2">
                              {availableRepositories
                                .filter(repo => !linkedRepositories.some(linked => linked.githubRepoId === repo.id))
                                .slice(0, 3)
                                .map((repo: any) => (
                                <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/25">
                                  <div className="flex items-center gap-3">
                                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                      <h6 className="font-medium text-sm truncate">{repo.name}</h6>
                                      <p className="text-xs text-muted-foreground truncate">{repo.fullName}</p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => linkRepository(repo)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GitHub Triage */}
        <TabsContent value="github-triage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                GitHub Issues Triage
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Import GitHub issues that aren't yet linked to SprintIQ tasks
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!githubIntegration ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <GitBranch className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">GitHub Not Connected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your workspace to GitHub to access issues triage.
                  </p>
                  <Button onClick={() => router.push(`/dashboard/workspace/${settings.general.workspaceId}?tab=integrations`)}>
                    Connect GitHub
                  </Button>
                </div>
              ) : linkedRepositories.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">No Linked Repositories</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Link at least one GitHub repository to access issues triage.
                  </p>
                  <Button onClick={() => {
                    const tabElement = document.querySelector('[value="integrations"]') as HTMLElement;
                    if (tabElement) tabElement.click();
                  }}>
                    Link Repository
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Unlinked GitHub Issues</h4>
                      <p className="text-sm text-muted-foreground">
                        Issues from linked repositories that aren't yet SprintIQ tasks
                      </p>
                    </div>
                    <Button
                      onClick={() => loadUnlinkedIssues(true)}
                      disabled={issuesLoading}
                      variant="outline"
                      size="sm"
                    >
                      {issuesLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>

                  {issuesError && (
                    <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                      <AlertCircle className="h-4 w-4 text-destructive mb-2" />
                      <p className="text-sm text-destructive">{issuesError}</p>
                    </div>
                  )}

                  {unlinkedIssues.length === 0 && !issuesLoading && !issuesError && (
                    <div className="text-center py-8 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        All GitHub issues are already linked to SprintIQ tasks!
                      </p>
                    </div>
                  )}

                  {unlinkedIssues.length > 0 && (
                    <div className="space-y-3">
                      {unlinkedIssues.map((issue) => (
                        <div key={issue.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium text-sm truncate">{issue.title}</h5>
                              <Badge variant="outline" className="text-xs">
                                #{issue.number}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {issue.repository.name}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {issue.body || 'No description provided'}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>Created {new Date(issue.createdAt).toLocaleDateString()}</span>
                              {issue.author && (
                                <span>by {issue.author}</span>
                              )}
                              {issue.labels.length > 0 && (
                                <div className="flex gap-1">
                                  {issue.labels.slice(0, 3).map((label: any) => (
                                    <Badge
                                      key={label.name}
                                      variant="outline"
                                      className="text-xs px-1 py-0"
                                      style={{
                                        borderColor: `#${label.color}`,
                                        color: `#${label.color}`
                                      }}
                                    >
                                      {label.name}
                                    </Badge>
                                  ))}
                                  {issue.labels.length > 3 && (
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      +{issue.labels.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(issue.htmlUrl, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedIssue(issue);
                                setShowImportDialog(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Import
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Issue Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import GitHub Issue as Task</DialogTitle>
              <DialogDescription>
                Create a new SprintIQ task from this GitHub issue
              </DialogDescription>
            </DialogHeader>

            {selectedIssue && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">{selectedIssue.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    #{selectedIssue.number} • {selectedIssue.repository.fullName}
                  </p>
                  <p className="text-sm line-clamp-3">
                    {selectedIssue.body || 'No description provided'}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  This will create a new SprintIQ task with the GitHub issue details and link them together.
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setSelectedIssue(null);
                }}
                disabled={importingTask}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedIssue && importIssueAsTask(selectedIssue)}
                disabled={importingTask}
              >
                {importingTask ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Import as Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive project updates via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Send updates to connected Slack channels
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.slackIntegration}
                    onCheckedChange={(checked) => handleNotificationChange('slackIntegration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Assignments</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when tasks are assigned or reassigned
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.taskAssignments}
                    onCheckedChange={(checked) => handleNotificationChange('taskAssignments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status Changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when task statuses are updated
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.statusChanges}
                    onCheckedChange={(checked) => handleNotificationChange('statusChanges', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about new comments on tasks
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.comments}
                    onCheckedChange={(checked) => handleNotificationChange('comments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Due Dates</Label>
                    <p className="text-sm text-muted-foreground">
                      Remind about upcoming and overdue tasks
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.dueDates}
                    onCheckedChange={(checked) => handleNotificationChange('dueDates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sprint Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about sprint start, completion, and changes
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.sprintUpdates}
                    onCheckedChange={(checked) => handleNotificationChange('sprintUpdates', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Project Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Guest Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow non-workspace members to view this project
                    </p>
                  </div>
                  <Switch
                    checked={settings.permissions.allowGuestAccess}
                    onCheckedChange={(checked) => handlePermissionChange('allowGuestAccess', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Approval for Tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      New tasks must be approved before being added
                    </p>
                  </div>
                  <Switch
                    checked={settings.permissions.requireApprovalForTasks}
                    onCheckedChange={(checked) => handlePermissionChange('requireApprovalForTasks', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Restrict Time Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Only managers can view and edit time logs
                    </p>
                  </div>
                  <Switch
                    checked={settings.permissions.restrictTimeTracking}
                    onCheckedChange={(checked) => handlePermissionChange('restrictTimeTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable File Uploads</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow team members to upload files to tasks
                    </p>
                  </div>
                  <Switch
                    checked={settings.permissions.enableFileUploads}
                    onCheckedChange={(checked) => handlePermissionChange('enableFileUploads', checked)}
                  />
                </div>

                {settings.permissions.enableFileUploads && (
                  <div className="ml-6 space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        value={settings.permissions.maxFileSize}
                        onChange={(e) => handlePermissionChange('maxFileSize', parseInt(e.target.value))}
                        className="w-32"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Allowed File Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {settings.permissions.allowedFileTypes.map((type) => (
                          <Badge key={type} variant="secondary">
                            .{type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-orange-900">{projectStatus === 'archived' ? 'Unarchive Project' : 'Archive Project'}</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        {projectStatus === 'archived' ? 'Restore this project to active lists.' : 'Archive this project to hide it from active lists. Archived projects can be restored later.'}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                          <Archive className="h-4 w-4 mr-2" />
                          {projectStatus === 'archived' ? 'Unarchive' : 'Archive'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{projectStatus === 'archived' ? 'Unarchive Project' : 'Archive Project'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {projectStatus === 'archived'
                              ? `Are you sure you want to unarchive "${settings.general.name}"? It will appear back in active lists.`
                              : `Are you sure you want to archive "${settings.general.name}"? This will hide the project from active lists, but all data will be preserved and the project can be restored later.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={projectStatus === 'archived' ? handleUnarchiveProject : handleArchiveProject} className="bg-orange-600 hover:bg-orange-700">
                            {projectStatus === 'archived' ? 'Unarchive Project' : 'Archive Project'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-900">Delete Project</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete this project and all associated data. 
                        This action cannot be undone.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        {workspaceRole === 'manager' ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex" tabIndex={0} aria-disabled>
                                  <Button variant="destructive" disabled>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Only a workspace Owner can permanently delete a project.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        )}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete "{settings.general.name}"? 
                            This will remove all tasks, files, comments, and project history. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground">
                            Delete Project
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Need Help?</p>
                    <p className="text-sm text-muted-foreground">
                      If you're having issues with this project or need to transfer ownership, 
                      please contact your workspace administrator or reach out to support.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* All Repositories Dialog */}
      <Dialog open={showAllReposDialog} onOpenChange={setShowAllReposDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              All Available Repositories
            </DialogTitle>
            <DialogDescription>
              Search and link GitHub repositories to this project
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={repoSearchQuery}
                onChange={(e) => setRepoSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Repository List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableRepositories
              .filter(repo =>
                !linkedRepositories.some(linked => linked.githubRepoId === repo.id) &&
                (repo.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
                 repo.fullName.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
                 (repo.description && repo.description.toLowerCase().includes(repoSearchQuery.toLowerCase())))
              )
              .map((repo: any) => (
              <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h6 className="font-medium text-sm truncate">{repo.name}</h6>
                    <p className="text-xs text-muted-foreground truncate">{repo.fullName}</p>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{repo.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(repo.htmlUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      linkRepository(repo);
                      setShowAllReposDialog(false);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
              </div>
            ))}

            {availableRepositories.filter(repo =>
              !linkedRepositories.some(linked => linked.githubRepoId === repo.id) &&
              (repo.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
               repo.fullName.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
               (repo.description && repo.description.toLowerCase().includes(repoSearchQuery.toLowerCase())))
            ).length === 0 && (
              <div className="text-center py-8">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {repoSearchQuery ? 'No repositories match your search' : 'No repositories available'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllReposDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
