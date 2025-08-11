'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Project } from '@/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Settings, FileText, CheckSquare, Plus, Trash2, Flag } from 'lucide-react';
// ProjectSidebar now handled by SidebarLayout
import { usePermissions } from '@/hooks/usePermissions';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { AIChatFloating } from '@/components/ai/AIChatFloating';
import { Timeline } from './Timeline';
import { SettingsPanel } from './SettingsPanel';
import { useProject } from '@/stores/hooks/useProject';
// duplicate import removed

interface ProjectDetailClientPageProps {
  project: Project;
}

export function ProjectDetailClientPage({ project }: ProjectDetailClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const initialTab = (() => {
    const t = searchParams?.get('tab');
    const allowed = new Set(['overview','tasks','timeline','team','settings']);
    return t && allowed.has(t) ? t : 'overview';
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const { setCurrentProject } = useProject();

  const projectPerms = usePermissions('project', project.id);
  const workspacePerms = usePermissions('workspace', project.workspaceId);
  const canCreate = projectPerms.canCreate || workspacePerms.canCreate;
  const canEdit = projectPerms.canEdit || workspacePerms.canEdit;
  const canDelete = projectPerms.canDelete || workspacePerms.canDelete;
  const canManageMembers = projectPerms.canManageMembers || workspacePerms.canManageMembers;
  const isOwnerLike = projectPerms.canManageSettings || workspacePerms.canManageSettings;
  const isPermissionsLoading = projectPerms.isLoading || workspacePerms.isLoading;

  const [team, setTeam] = useState<Array<{ id: string; firstName: string | null; lastName: string | null; email: string | null; role: string }>>([]);
  const [workspaceMembersList, setWorkspaceMembersList] = useState<Array<{ id: string; firstName: string | null; lastName: string | null; email: string | null; role: string }>>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteProfileId, setInviteProfileId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'manager' | 'member' | 'viewer'>('member');

  useEffect(() => {
    // ensure navbar shows current project
    setCurrentProject(project as any);
    if (typeof window !== 'undefined') {
      localStorage.setItem('siq:lastProjectId', project.id);
    }
    const loadMembers = async () => {
      try {
        setTeamLoading(true);
        const res = await fetch(`/api/projects/${project.id}/members`);
        if (res.ok) {
          const data = await res.json();
          setTeam(data.members || []);
          setWorkspaceMembersList(data.workspaceMembers || []);
        }
      } finally {
        setTeamLoading(false);
      }
    };
    loadMembers();
  }, [project.id]);

  // Keep tab in sync if query param changes (e.g., from sidebar links)
  useEffect(() => {
    const t = searchParams?.get('tab');
    const allowed = new Set(['overview','tasks','timeline','team','settings']);
    if (t && allowed.has(t) && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams, activeTab]);

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
      {/* Navbar is provided by projects layout */}
      {/* Project header moved into Overview tab */}

      {/* Main Content - Sidebar handled by SidebarLayout */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-4">
          {/* Project Header (Overview only) */}
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

          {/* Manager widgets (static data) - managers only */}
          {(canManageMembers && !isOwnerLike) && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Burndown (static)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-48 rounded border bg-gradient-to-b from-blue-200/50 to-transparent" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Workload Heatmap (static)</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div key={i} className={`h-6 rounded ${i % 5 === 0 ? 'bg-red-500/40' : i % 3 === 0 ? 'bg-yellow-500/30' : 'bg-green-500/30'}`} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Static Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Velocity (last 6 sprints)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 rounded border bg-gradient-to-b from-primary/10 to-transparent flex items-end gap-2 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-primary/40" style={{ height: `${30 + i * 10}%` }} />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Issue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mx-auto h-48 w-48">
                  <div className="absolute inset-0 rounded-full border-[14px] border-primary/50" />
                  <div className="absolute inset-0 rounded-full border-[14px] border-t-transparent border-l-transparent" />
                  <div className="absolute inset-0 rounded-full border-[14px] border-secondary/60 rotate-45" />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>Features: 40%</div>
                  <div>Bugs: 35%</div>
                  <div>Chores: 25%</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend line */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks Completed Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 overflow-hidden rounded border">
                <svg viewBox="0 0 400 120" className="w-full h-full">
                  <polyline
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    points="0,90 50,80 100,70 150,60 200,65 250,55 300,40 350,35 400,30"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>

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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
            {canCreate && (
              <CreateTaskForm projectId={project.id}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </CreateTaskForm>
            )}
          </div>
          <TaskFilters 
            projectId={project.id} 
            workspaceId={project.workspaceId}
          />
          <KanbanBoard projectId={project.id} />
        </TabsContent>

        {/* Timeline Tab Content */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>Tasks and sprints with dates</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline projectId={project.id} />
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
              {canManageMembers && (
                <div className="mb-6 space-y-2">
                  <div className="text-sm font-medium">Add existing workspace member to this project</div>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {workspaceMembersList
                      .filter((wm) => `${wm.firstName ?? ''} ${wm.lastName ?? ''} ${wm.email ?? ''}`.toLowerCase().includes(memberSearch.toLowerCase()))
                      .filter((wm) => !team.some((tm) => tm.id === wm.id))
                      .map((wm) => (
                        <div key={wm.id} className="flex items-center justify-between rounded border p-2 text-sm">
                          <div>
                            <div className="font-medium">{[wm.firstName, wm.lastName].filter(Boolean).join(' ') || wm.email || 'Member'}</div>
                            <div className="text-muted-foreground">{wm.email}</div>
                          </div>
                          <Button
                            size="sm"
                            onClick={async () => {
                              const res = await fetch(`/api/projects/${project.id}/members`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ profileId: wm.id, role: 'member' }),
                              });
                              if (res.ok) {
                                setTeam((prev) => [...prev, { ...wm, role: 'member' }]);
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    {workspaceMembersList.filter((wm) => !team.some((tm) => tm.id === wm.id)).length === 0 && (
                      <div className="text-sm text-muted-foreground">All workspace members are already on this project.</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <input
                      className="w-full rounded border bg-background px-2 py-1 text-sm"
                      placeholder="Search workspace people by name or email"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                  </div>
                </div>
              )}

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
                      <div className="flex items-center gap-2">
                        <div className="rounded bg-accent px-2 py-1 text-xs capitalize">{m.role}</div>
                        {canManageMembers && (
                          <>
                            <select
                              className="rounded border bg-background px-2 py-1 text-xs"
                              value={m.role}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                await fetch(`/api/projects/${project.id}/members`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ profileId: m.id, role: newRole }),
                                });
                                setTeam((prev) => prev.map((x) => (x.id === m.id ? { ...x, role: newRole } : x)));
                              }}
                            >
                              <option value="owner">owner</option>
                              <option value="manager">manager</option>
                              <option value="member">member</option>
                              <option value="viewer">viewer</option>
                            </select>
                            <Button
                              variant="outline"
                              size="sm" asChild
                            >
                              <span
                                onClick={async () => {
                                  await fetch(`/api/projects/${project.id}/members?profileId=${m.id}`, { method: 'DELETE' });
                                  setTeam((prev) => prev.filter((x) => x.id !== m.id));
                                }}
                              >Remove</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {canManageMembers && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Invite to project</div>
                  <div className="flex gap-2">
                    <input
                      className="w-72 rounded border bg-background px-2 py-1 text-sm"
                      placeholder="profile_123"
                      value={inviteProfileId}
                      onChange={(e) => setInviteProfileId(e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground self-center">or</span>
                    <input
                      className="w-72 rounded border bg-background px-2 py-1 text-sm"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
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
                        if (!inviteProfileId && !inviteEmail) return;
                        // If email provided and not existing, send a workspace+project invite
                        const res = await fetch(`/api/projects/${project.id}/members`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ profileId: inviteProfileId || undefined, email: inviteEmail || undefined, role: inviteRole }),
                        });
                        if (res.ok) {
                          setTeam((prev) => {
                            const exists = prev.some((m) => m.id === inviteProfileId);
                            if (exists) {
                              return prev.map((m) => (m.id === inviteProfileId ? { ...m, role: inviteRole } : m));
                            }
                            // Only add immediately if profileId path; for email invites, wait until accepted
                            return inviteProfileId
                              ? [...prev, { id: inviteProfileId, firstName: null, lastName: null, email: inviteEmail || null, role: inviteRole }]
                              : prev;
                          });
                          setInviteProfileId('');
                          setInviteEmail('');
                        } else if (inviteEmail) {
                          // Fallback to sending a combined invite with projectId
                          await fetch('/api/invitations/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              workspaceId: project.workspaceId,
                              invites: [{ email: inviteEmail, role: 'member', projectId: project.id }],
                            }),
                          });
                          setInviteEmail('');
                        }
                      }}
                    >
                      Invite
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">Tip: Use profile ID or email.</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab Content */}
        <TabsContent value="settings" className="space-y-4">
          <SettingsPanel
            project={project}
            canEdit={canEdit}
            canDelete={canDelete}
            onDeleted={() => router.push('/projects')}
          />
        </TabsContent>
        </Tabs>
      </div>

      {/* Floating AI Assistant */}
      <AIChatFloating projectId={project.id} />
    </div>
  );
}