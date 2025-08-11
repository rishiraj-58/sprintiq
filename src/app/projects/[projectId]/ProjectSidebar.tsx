'use client';

import Link from 'next/link';
import { FileText, CheckSquare, Clock, Flag, User, Settings, BarChart2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

type ProjectSidebarItemKey = 'overview' | 'tasks' | 'timeline' | 'reports' | 'sprints' | 'team' | 'settings';

export function ProjectSidebar({
  projectId,
  active,
  mode = 'links',
  onSelect,
}: {
  projectId: string;
  active: ProjectSidebarItemKey;
  mode?: 'links' | 'tabs';
  onSelect?: (key: ProjectSidebarItemKey) => void;
}) {
  const perms = usePermissions('project', projectId);
  const caps: string[] = [];
  if (perms.canCreate) caps.push('create');
  if (perms.canEdit) caps.push('edit');
  if (perms.canDelete) caps.push('delete');
  if (perms.canManageMembers) caps.push('manage_members');
  if (perms.canManageSettings) caps.push('manage_settings');
  const resolveRole = (c: string[]): 'owner' | 'manager' | 'member' | 'viewer' => {
    const has = (x: string) => c.includes(x);
    if (has('manage_settings') && has('delete')) return 'owner';
    if (has('manage_members')) return 'manager';
    if (has('create') || has('edit')) return 'member';
    return 'viewer';
  };
  const role = resolveRole(caps);
  const items: Array<{ key: ProjectSidebarItemKey; label: string; href: string; Icon: any }> = [
    { key: 'overview', label: 'Overview', href: `/projects/${projectId}?tab=overview`, Icon: FileText },
    { key: 'tasks', label: 'Tasks', href: `/projects/${projectId}?tab=tasks`, Icon: CheckSquare },
    { key: 'timeline', label: 'Timeline', href: `/projects/${projectId}?tab=timeline`, Icon: Clock },
    // Only managers see project Reports
    ...(role === 'manager' ? [{ key: 'reports', label: 'Reports', href: `/projects/${projectId}/reports`, Icon: BarChart2 } as const] : []),
    { key: 'sprints', label: 'Sprints', href: `/projects/${projectId}/sprints`, Icon: Flag },
    { key: 'team', label: 'Team', href: `/projects/${projectId}?tab=team`, Icon: User },
    { key: 'settings', label: 'Settings', href: `/projects/${projectId}?tab=settings`, Icon: Settings },
  ];

  return (
    <div className="grid gap-1">
      {items.map(({ key, label, href, Icon }) => {
        const isActive = key === active;
        if (mode === 'tabs' && onSelect) {
          if (key === 'sprints' || key === 'reports') {
            return (
              <Link
                key={key}
                href={href}
                className={`rounded px-3 py-2 text-sm flex items-center gap-2 ${isActive ? 'bg-accent' : 'hover:bg-accent'}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          }
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`text-left rounded px-3 py-2 text-sm flex items-center gap-2 ${isActive ? 'bg-accent' : 'hover:bg-accent'}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          );
        }
        return (
          <Link
            key={key}
            href={href}
            className={`rounded px-3 py-2 text-sm flex items-center gap-2 ${isActive ? 'bg-accent' : 'hover:bg-accent'}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </div>
  );
}


