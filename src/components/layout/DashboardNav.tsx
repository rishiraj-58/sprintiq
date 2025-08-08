'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspace } from '@/stores/hooks/useWorkspace';

function useWorkspaceScopedNav(workspaceId?: string) {
  const base = workspaceId ? `/dashboard/workspace/${workspaceId}` : '/dashboard';
  return [
    { title: 'Dashboard', href: `${base}`, icon: 'LayoutDashboard' },
    { title: 'Tasks', href: `${base}/tasks`, icon: 'CheckSquare' },
    { title: 'Team', href: `/workspaces/${workspaceId}/team`, icon: 'Users' },
  ];
}

export function DashboardNav() {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const { canManageMembers, canManageSettings } = usePermissions('workspace', currentWorkspace?.id);
  const navItems = useWorkspaceScopedNav(currentWorkspace?.id);

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname === item.href ? "bg-accent" : "transparent"
          )}
        >
          <span>{item.title}</span>
        </Link>
      ))}
      {canManageMembers && (
        <Link
          href="/dashboard/manager/sprint-planner"
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname === '/dashboard/manager/sprint-planner' ? 'bg-accent' : 'transparent'
          )}
        >
          <span>Manager: Sprint Planner</span>
        </Link>
      )}
      {canManageSettings && (
        <Link
          href="/dashboard/reports"
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname === '/dashboard/reports' ? 'bg-accent' : 'transparent'
          )}
        >
          <span>Reports</span>
        </Link>
      )}
    </nav>
  );
} 