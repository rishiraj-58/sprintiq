'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard'
  },
  {
    title: 'Workspaces',
    href: '/workspaces',
    icon: 'Briefcase'
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: 'FolderKanban'
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: 'CheckSquare'
  },
  {
    title: 'Team',
    href: '/team',
    icon: 'Users'
  }
];

export function DashboardNav() {
  const pathname = usePathname();

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
    </nav>
  );
} 