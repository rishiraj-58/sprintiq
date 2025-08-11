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
  Eye
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
        title: 'Sprint Planner',
        icon: Calendar,
        path: '/dashboard/manager/sprint-planner',
        description: 'Plan sprints across workspace'
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
        path: '/projects/:projectId?tab=overview',
        description: 'Project dashboard and metrics'
      },
      {
        title: 'Tasks',
        icon: CheckSquare,
        path: '/projects/:projectId?tab=tasks',
        description: 'Project backlog and task management'
      },
      {
        title: 'Sprints',
        icon: Flag,
        path: '/projects/:projectId/sprints',
        description: 'Sprint board and management'
      },
      {
        title: 'Timeline',
        icon: Clock,
        path: '/projects/:projectId?tab=timeline',
        description: 'Gantt chart and project roadmap'
      },
      {
        title: 'Team',
        icon: User,
        path: '/projects/:projectId?tab=team',
        description: 'Project team management'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        path: '/projects/:projectId/reports',
        description: 'Project-specific reports'
      },
      {
        title: 'Settings',
        icon: Settings,
        path: '/projects/:projectId?tab=settings',
        description: 'Project settings and configuration'
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
      }
    ],
    project: [
      {
        title: 'Overview',
        icon: LayoutDashboard,
        path: '/projects/:projectId?tab=overview',
        description: 'Project dashboard with manager insights'
      },
      {
        title: 'Tasks',
        icon: CheckSquare,
        path: '/projects/:projectId?tab=tasks',
        description: 'Full project backlog management'
      },
      {
        title: 'Sprints',
        icon: Flag,
        path: '/projects/:projectId/sprints',
        description: 'Interactive sprint management'
      },
      {
        title: 'Timeline',
        icon: Clock,
        path: '/projects/:projectId?tab=timeline',
        description: 'Project timeline and planning'
      },
      {
        title: 'Team',
        icon: User,
        path: '/projects/:projectId?tab=team',
        description: 'Project team management'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        path: '/projects/:projectId/reports',
        description: 'Project performance reports'
      },
      {
        title: 'Settings',
        icon: Settings,
        path: '/projects/:projectId?tab=settings',
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
      }
    ],
    project: [
      {
        title: 'Overview',
        icon: LayoutDashboard,
        path: '/projects/:projectId?tab=overview',
        description: 'Project overview'
      },
      {
        title: 'Tasks',
        icon: CheckSquare,
        path: '/projects/:projectId?tab=tasks',
        description: 'Project tasks with focus on your assignments'
      },
      {
        title: 'Sprints',
        icon: Flag,
        path: '/projects/:projectId/sprints',
        description: 'Sprint board interaction'
      },
      {
        title: 'Timeline',
        icon: Clock,
        path: '/projects/:projectId?tab=timeline',
        description: 'Read-only project timeline'
      },
      {
        title: 'Team',
        icon: User,
        path: '/projects/:projectId?tab=team',
        description: 'Project team members'
      },
      {
        title: 'Reports',
        icon: BarChart3,
        path: '/projects/:projectId/reports',
        description: 'Your contributions to the project'
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
      }
    ],
    project: [
      {
        title: 'Overview',
        icon: LayoutDashboard,
        path: '/projects/:projectId?tab=overview',
        description: 'Read-only project dashboard'
      },
      {
        title: 'Timeline',
        icon: Clock,
        path: '/projects/:projectId?tab=timeline',
        description: 'Read-only timeline view'
      },
      {
        title: 'Sprints',
        icon: Flag,
        path: '/projects/:projectId/sprints',
        description: 'Read-only sprint boards'
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

