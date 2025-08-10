'use client';

import Link from 'next/link';
import { FileText, CheckSquare, Clock, Flag, User, Settings } from 'lucide-react';

type ProjectSidebarItemKey = 'overview' | 'tasks' | 'timeline' | 'sprints' | 'team' | 'settings';

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
  const items: Array<{ key: ProjectSidebarItemKey; label: string; href: string; Icon: any }> = [
    { key: 'overview', label: 'Overview', href: `/projects/${projectId}?tab=overview`, Icon: FileText },
    { key: 'tasks', label: 'Tasks', href: `/projects/${projectId}?tab=tasks`, Icon: CheckSquare },
    { key: 'timeline', label: 'Timeline', href: `/projects/${projectId}?tab=timeline`, Icon: Clock },
    { key: 'sprints', label: 'Sprints', href: `/projects/${projectId}/sprints`, Icon: Flag },
    { key: 'team', label: 'Team', href: `/projects/${projectId}?tab=team`, Icon: User },
    { key: 'settings', label: 'Settings', href: `/projects/${projectId}?tab=settings`, Icon: Settings },
  ];

  return (
    <div className="grid gap-1">
      {items.map(({ key, label, href, Icon }) => {
        const isActive = key === active;
        if (mode === 'tabs' && onSelect) {
          if (key === 'sprints') {
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


