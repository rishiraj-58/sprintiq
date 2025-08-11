'use client';

import { Badge } from '@/components/ui/badge';
import { CurrentSprintBurndownChart } from '@/components/charts/CurrentSprintBurndownChart';
import { KeyMetrics } from '@/components/widgets/KeyMetrics';
import { SprintGoalWidget } from '@/components/widgets/SprintGoalWidget';
import { RecentActivityFeed } from '@/components/widgets/RecentActivityFeed';
import { MyAssignedTasks } from '@/components/widgets/MyAssignedTasks';
import { usePermissions } from '@/hooks/usePermissions';
import { MyProjectTasksWidget } from '@/components/widgets/MyProjectTasksWidget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  workspaceId: string;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
}

interface ProjectOverviewPageProps {
  project: Project;
}

// Static data for demo
const mockActiveSprint = {
  id: 'sprint-1',
  name: 'January 2024 Sprint',
  startDate: '2024-01-08',
  endDate: '2024-01-22',
  goal: 'Complete user authentication system and improve dashboard performance. Focus on delivering high-quality, well-tested features.',
  status: 'active'
};

const mockTasks = [
  {
    id: 'TASK-001',
    title: 'Implement user authentication flow',
    status: 'in-progress',
    storyPoints: 8,
    createdAt: '2024-01-10T10:00:00Z',
    type: 'feature'
  },
  {
    id: 'TASK-002',
    title: 'Design dashboard mockups',
    status: 'done',
    storyPoints: 5,
    createdAt: '2024-01-09T14:30:00Z',
    type: 'design',
    completedDate: '2024-01-12T16:20:00Z'
  },
  {
    id: 'TASK-003',
    title: 'Fix login validation bug',
    status: 'done',
    storyPoints: 3,
    createdAt: '2024-01-11T09:15:00Z',
    type: 'bug',
    completedDate: '2024-01-13T11:45:00Z'
  },
  {
    id: 'TASK-004',
    title: 'Update API documentation',
    status: 'in-progress',
    storyPoints: 2,
    createdAt: '2024-01-12T13:20:00Z',
    type: 'documentation'
  },
  {
    id: 'TASK-005',
    title: 'Implement password reset flow',
    status: 'to-do',
    storyPoints: 5,
    createdAt: '2024-01-13T08:45:00Z',
    type: 'feature'
  },
  {
    id: 'TASK-006',
    title: 'Database performance optimization',
    status: 'to-do',
    storyPoints: 8,
    createdAt: '2024-01-14T15:10:00Z',
    type: 'improvement'
  },
  {
    id: 'BUG-001',
    title: 'Fix mobile responsive issues',
    status: 'to-do',
    storyPoints: 3,
    createdAt: '2024-01-15T12:30:00Z',
    type: 'bug'
  }
];

const getProjectHealthStatus = (project: Project) => {
  // Simple logic for demo - in real app this would be calculated from various metrics
  const statuses = ['on-track', 'at-risk', 'off-track'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const statusConfig = {
    'on-track': { 
      label: 'On Track', 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '🟢'
    },
    'at-risk': { 
      label: 'At Risk', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '🟡'
    },
    'off-track': { 
      label: 'Off Track', 
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '🔴'
    }
  };
  
  return statusConfig['on-track']; // Default to on-track for demo
};

export function ProjectOverviewPage({ project }: ProjectOverviewPageProps) {
  const healthStatus = getProjectHealthStatus(project);
  const workspacePerms = usePermissions('workspace', project.workspaceId);
  const projectPerms = usePermissions('project', project.id);
  const isMemberRole = (() => {
    const caps: string[] = [];
    if (workspacePerms.canCreate || projectPerms.canCreate) caps.push('create');
    if (workspacePerms.canEdit || projectPerms.canEdit) caps.push('edit');
    if (workspacePerms.canManageMembers || projectPerms.canManageMembers) caps.push('manage_members');
    if (workspacePerms.canManageSettings || projectPerms.canManageSettings) caps.push('manage_settings');
    // Member: can create/edit but not manage members/settings
    return caps.includes('create') || caps.includes('edit') ? !(caps.includes('manage_members') || caps.includes('manage_settings')) : false;
  })();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-lg text-muted-foreground max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
          <Badge className={`${healthStatus.color} text-sm px-3 py-1`}>
            <span className="mr-2">{healthStatus.icon}</span>
            {healthStatus.label}
          </Badge>
        </div>
      </div>

      {/* Member daily stand-up dashboard layout */}
      {isMemberRole ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left (wider) column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Sprint Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <blockquote className="border-l-4 pl-4 text-lg text-muted-foreground">
                  {mockActiveSprint.goal}
                </blockquote>
              </CardContent>
            </Card>

            <CurrentSprintBurndownChart
              sprintName={mockActiveSprint.name}
              startDate={mockActiveSprint.startDate}
              endDate={mockActiveSprint.endDate}
              tasks={mockTasks}
            />
          </div>

          {/* Right (narrow) column */}
          <div className="space-y-6">
            <MyProjectTasksWidget projectId={project.id} />
          </div>
        </div>
      ) : (
        // Managers/Owners unchanged existing dashboard
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <CurrentSprintBurndownChart
              sprintName={mockActiveSprint.name}
              startDate={mockActiveSprint.startDate}
              endDate={mockActiveSprint.endDate}
              tasks={mockTasks}
            />
            <RecentActivityFeed activities={[]} />
          </div>
          <div className="space-y-6">
            <SprintGoalWidget activeSprint={mockActiveSprint} />
            <KeyMetrics activeSprint={mockActiveSprint} tasks={mockTasks} />
            <MyAssignedTasks 
              tasks={mockTasks.map(task => ({
                ...task,
                priority: 'medium' as const,
                projectId: project.id,
                dueDate: task.status === 'to-do' ? '2024-01-20' : undefined
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
