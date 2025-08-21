import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Calendar, 
  CreditCard, 
  Activity, 
  FileText, 
  Puzzle, 
  Settings, 
  CheckSquare, 
  Clock, 
  Flag, 
  User,
  FolderOpen,
  ListTodo,
  Eye,
  Bug,
  Sparkles
} from 'lucide-react';

export type UserRole = 'owner' | 'manager' | 'member' | 'viewer';
export type SidebarContext = 'workspace' | 'project';

export interface SidebarItem {
  title: string;
  icon: any;
  path: string;
  description?: string;
  badge?: string;
  requiredPermissions?: string[];
}

export interface SidebarConfig {
  [key: string]: {
    workspace: SidebarItem[];
    project: SidebarItem[];
  };
}

export const sidebarConfig: SidebarConfig = {
  owner: {
    workspace: [
      {
        title: 'Projects',
        icon: LayoutDashboard,
        path: '/dashboard/workspace/:workspaceId',
        description: 'Manage all workspace projects'
      },
      {
        title: 'Team',
        icon: Users,
        path: '/workspaces/:workspaceId/team',
        description: 'Manage workspace members and roles'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        path: '/dashboard/workspace/:workspaceId/reports',
        description: 'Cross-project analytics and insights'
      },
      {
        title: 'Billing',
        icon: CreditCard,
        path: '/dashboard/workspace/:workspaceId/billing',
        description: 'Subscription and payment management'
      },
      {
        title: 'Usage',
        icon: Activity,
        path: '/dashboard/workspace/:workspaceId/usage',
        description: 'Resource usage and analytics'
      },
      {
        title: 'Audit Logs',
        icon: FileText,
        path: '/dashboard/workspace/:workspaceId/audit-logs',
        description: 'Workspace activity logs'
      },
      {
        title: 'Integrations',
        icon: Puzzle,
        path: '/dashboard/workspace/:workspaceId/integrations',
        description: 'Third-party app integrations'
      },
      {
        title: 'AI Hub',
        icon: Sparkles,
        path: '/ai-hub',
        description: 'AI-powered document generation and analysis'
      },
      {
        title: 'Organization Settings',
        icon: Settings,
        path: '/workspaces/:workspaceId/settings',
        description: 'Workspace-level settings'
      }
    ],
    project: [
      {
        title: 'Overview',
        icon: LayoutDashboard,
        path: '/projects/:projectId',
        description: 'Project dashboard with health, metrics, and activity'
      },
      {
        title: 'Tasks',
        icon: CheckSquare,
        path: '/projects/:projectId/tasks',
        description: 'Complete project backlog and task management'
      },
      {
        title: 'Sprints',
        icon: Flag,
        path: '/projects/:projectId/sprints',
        description: 'Sprint planning, active boards, and management'
      },
      {
        title: 'Bugs',
        icon: Bug,
        path: '/projects/:projectId/bugs',
        description: 'Bug tracking, reporting, and resolution'
      },
      {
        title: 'Timeline',
        icon: Clock,
        path: '/projects/:projectId/timeline',
        description: 'Gantt charts, milestones, and project roadmap'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        path: '/projects/:projectId/reports',
        description: 'Performance analytics and insights'
      },
      {
        title: 'Team',
        icon: User,
        path: '/projects/:projectId/team',
        description: 'Project-specific team and role management'
      },
      {
        title: 'Settings',
        icon: Settings,
        path: '/projects/:projectId/settings',
        description: 'Project configuration and management'
      }
    ]
  },
  manager: {
    workspace: [
      {
        title: 'Projects',
        icon: LayoutDashboard,
        path: '/dashboard/workspace/:workspaceId',
        description: 'Manage workspace projects'
      },
      {
        title: 'Team',
        icon: Users,
        path: '/workspaces/:workspaceId/team',
        description: 'Manage team members with limited permissions'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        path: '/dashboard/workspace/:workspaceId/reports',
        description: 'Project analytics and insights'
      },
      {
        title: 'Sprint Planner',
        icon: Calendar,
        path: '/dashboard/manager/sprint-planner',
        description: 'Plan and manage sprints'
      },
      {
        title: 'Integrations',
        icon: Puzzle,
        path: '/dashboard/workspace/:workspaceId/integrations',
        description: 'Manage integrations'
      },
      {
        title: 'AI Hub',
        icon: Sparkles,
        path: '/ai-hub',
        description: 'AI-powered tools and document generation'
      }
    ],
    project: [
      {
        title: 'Overview',
        icon: LayoutDashboard,
        path: '/projects/:projectId',
        description: 'Project dashboard with manager insights'
      },
      {
        title: 'Tasks',
        icon: CheckSquare,
        path: '/projects/:projectId/tasks',
        description: 'Full project backlog management'
      },
      {
        title: 'Sprints',
        icon: Flag,
        path: '/projects/:projectId/sprints',
        description: 'Interactive sprint management'
      },
      {
        title: 'Bugs',
        icon: Bug,
        path: '/projects/:projectId/bugs',
        description: 'Bug tracking and management'
      },
      {
        title: 'Timeline',
        icon: Clock,
        path: '/projects/:projectId/timeline',
        description: 'Project timeline and planning'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        path: '/projects/:projectId/reports',
        description: 'Project performance reports'
      },
      {
        title: 'Team',
        icon: User,
        path: '/projects/:projectId/team',
        description: 'Project team management'
      },
      {
        title: 'Settings',
        icon: Settings,
        path: '/projects/:projectId/settings',
        description: 'Project configuration'
      }
    ]
  },
  member: {
    workspace: [
      {
        title: 'My Projects',
        icon: FolderOpen,
        path: '/dashboard/workspace/:workspaceId',
        description: 'Projects you are assigned to'
      },
      {
        title: 'My Tasks',
        icon: ListTodo,
        path: '/dashboard/workspace/:workspaceId/tasks',
        description: 'All your assigned tasks'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        path: '/dashboard/workspace/:workspaceId/reports',
        description: 'Personal performance dashboard'
      },
      {
        title: 'AI Hub',
        icon: Sparkles,
        path: '/ai-hub',
        description: 'AI-powered assistance and document generation'
      }
    ],
    project: [
      {
        title: 'Overview',
        icon: LayoutDashboard,
        path: '/projects/:projectId',
        description: 'Project overview'
      },
      {
        title: 'Tasks',
        icon: CheckSquare,
        path: '/projects/:projectId/tasks',
        description: 'Project tasks with focus on your assignments'
      },
      {
        title: 'Sprints',
        icon: Flag,
        path: '/projects/:projectId/sprints',
        description: 'Sprint board interaction'
      },
      {
        title: 'Bugs',
        icon: Bug,
        path: '/projects/:projectId/bugs',
        description: 'View and report bugs'
      },
      {
        title: 'Timeline',
        icon: Clock,
        path: '/projects/:projectId/timeline',
        description: 'Read-only project timeline'
      },
      {
        title: 'Team',
        icon: User,
        path: '/projects/:projectId/team',
        description: 'View project team'
      }
    ]
  },
  viewer: {
    workspace: [
      {
        title: 'Projects',
        icon: Eye,
        path: '/dashboard/workspace/:workspaceId',
        description: 'View projects you have access to'
      },
      {
        title: 'AI Hub',
        icon: Sparkles,
        path: '/ai-hub',
        description: 'AI-powered insights and documentation'
      }
    ],
    project: [
      {
        title: 'Overview',
        icon: LayoutDashboard,
        path: '/projects/:projectId',
        description: 'Read-only project dashboard'
      },
      {
        title: 'Timeline',
        icon: Clock,
        path: '/projects/:projectId/timeline',
        description: 'Read-only timeline view'
      },
      {
        title: 'Sprints',
        icon: Flag,
        path: '/projects/:projectId/sprints',
        description: 'Read-only sprint boards'
      },
      {
        title: 'Bugs',
        icon: Bug,
        path: '/projects/:projectId/bugs',
        description: 'Read-only bug reports'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        path: '/projects/:projectId/reports',
        description: 'High-level project reports'
      }
    ]
  }
};

// Helper function to get sidebar items for a specific role and context
export const getSidebarItems = (
  role: UserRole, 
  context: SidebarContext,
  workspaceId?: string,
  projectId?: string
): SidebarItem[] => {
  const items = sidebarConfig[role]?.[context] || [];
  
  return items.map(item => ({
    ...item,
    path: item.path
      .replace(':workspaceId', workspaceId || '')
      .replace(':projectId', projectId || '')
  }));
};

// Helper function to determine user role from capabilities
export const determineUserRole = (capabilities: string[]): UserRole => {
  const has = (cap: string) => capabilities.includes(cap);
  
  if (has('manage_settings') && has('delete')) return 'owner';
  if (has('manage_members')) return 'manager';
  if (has('create') || has('edit')) return 'member';
  return 'viewer';
};

