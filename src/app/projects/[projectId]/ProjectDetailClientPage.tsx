'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type Project } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Settings, FileText, CheckSquare, Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { AIChatFloating } from '@/components/ai/AIChatFloating';

interface ProjectDetailClientPageProps {
  project: Project;
}

export function ProjectDetailClientPage({ project }: ProjectDetailClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');

  const { canEdit, canDelete, canCreate, canManageMembers, isLoading: isPermissionsLoading } = usePermissions('project', project.id);

  const [team, setTeam] = useState<Array<{ id: string; firstName: string | null; lastName: string | null; email: string | null; role: string }>>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteProfileId, setInviteProfileId] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'manager' | 'member' | 'viewer'>('member');

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setTeamLoading(true);
        const res = await fetch(`/api/projects/${project.id}/members`);
        if (res.ok) {
          const data = await res.json();
          setTeam(data.members || []);
        }
      } finally {
        setTeamLoading(false);
      }
    };
    loadMembers();
  }, [project.id]);

  // Debug logging
  console.log('ProjectDetailClientPage Debug:', {
    projectId: project.id,
    workspaceId: project.workspaceId,
    canCreate,
    canEdit,
    canDelete,
    isPermissionsLoading,
    activeTab
  });

  console.log('ProjectDetailClientPage: Calling usePermissions with:', {
    contextType: 'project',
    contextId: project.id,
    clerkUserId: user?.id,
    clerkUserLoaded: !!user
  });

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });

      router.push('/projects');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.description || 'No description provided'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProject}
            >
              Delete Project
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Project Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Create Task Button - Only show in Tasks tab */}
          {activeTab === 'tasks' && canCreate && (
            <div className="flex items-center gap-2">
              <CreateTaskForm projectId={project.id}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </CreateTaskForm>
            </div>
          )}
        </div>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{project.status}</div>
                <p className="text-xs text-muted-foreground">
                  Current project status
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Created</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Project creation date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Start Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Planned start date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Project deadline
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {project.description || 'No description provided for this project.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab Content */}
        <TabsContent value="tasks" className="space-y-4">
          <TaskFilters 
            projectId={project.id} 
            workspaceId={project.workspaceId}
          />
          <KanbanBoard projectId={project.id} />
        </TabsContent>

        {/* Timeline Tab Content (placeholder) */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>
                Track project milestones and important dates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Timeline functionality coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab Content */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Team</CardTitle>
              <CardDescription>
                Manage team members and their roles in this project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="text-sm text-muted-foreground">Loading members…</div>
              ) : team.length === 0 ? (
                <div className="text-sm text-muted-foreground">No members yet.</div>
              ) : (
                <div className="space-y-2">
                  {team.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <div>
                        <div className="font-medium">{m.firstName || ''} {m.lastName || ''}</div>
                        <div className="text-muted-foreground">{m.email}</div>
                      </div>
                      <div className="rounded bg-accent px-2 py-1 text-xs capitalize">{m.role}</div>
                    </div>
                  ))}
                </div>
              )}

              {canManageMembers && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Add member by Profile ID</div>
                  <div className="flex gap-2">
                    <input
                      className="w-72 rounded border bg-background px-2 py-1 text-sm"
                      placeholder="profile_123"
                      value={inviteProfileId}
                      onChange={(e) => setInviteProfileId(e.target.value)}
                    />
                    <select
                      className="rounded border bg-background px-2 py-1 text-sm"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                    >
                      <option value="owner">owner</option>
                      <option value="manager">manager</option>
                      <option value="member">member</option>
                      <option value="viewer">viewer</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!inviteProfileId) return;
                        const res = await fetch(`/api/projects/${project.id}/members`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ profileId: inviteProfileId, role: inviteRole }),
                        });
                        if (res.ok) {
                          setTeam((prev) => {
                            const exists = prev.some((m) => m.id === inviteProfileId);
                            if (exists) {
                              return prev.map((m) => (m.id === inviteProfileId ? { ...m, role: inviteRole } : m));
                            }
                            return [...prev, { id: inviteProfileId, firstName: null, lastName: null, email: null, role: inviteRole }];
                          });
                          setInviteProfileId('');
                        }
                      }}
                    >
                      Add Member
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">Note: For now, enter the exact `profiles.id`.</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab Content (placeholder) */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>
                Configure project preferences and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Project settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating AI Assistant */}
      <AIChatFloating projectId={project.id} />
    </div>
  );
}