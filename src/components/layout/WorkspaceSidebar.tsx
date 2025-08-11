'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSidebarItems, UserRole } from '@/config/sidebarConfig';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkspaceSidebarProps {
  role: UserRole;
  workspaceId: string;
  currentPath: string;
  onNavigate?: () => void;
}

export function WorkspaceSidebar({ 
  role, 
  workspaceId, 
  currentPath, 
  onNavigate 
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const sidebarItems = getSidebarItems(role, 'workspace', workspaceId);

  const isActive = (itemPath: string) => {
    // Strict match: only highlight the exact page
    const cleanCurrentPath = currentPath.split('?')[0];
    const cleanItemPath = itemPath.split('?')[0];
    return cleanCurrentPath === cleanItemPath;
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    onNavigate?.();
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'Workspace Owner';
      case 'manager': return 'Workspace Manager';
      case 'member': return 'Team Member';
      case 'viewer': return 'Viewer';
      default: return 'User';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header with role badge and collapse toggle */}
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="font-semibold text-sm text-muted-foreground">Workspace</h2>
              <div className={cn(
                "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border mt-1",
                getRoleBadgeColor(role)
              )}>
                {getRoleDisplayName(role)}
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-accent hidden md:block"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1 p-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            const content = (
              <button
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  active 
                    ? "bg-accent text-accent-foreground shadow-sm" 
                    : "text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.title} delayDuration={300}>
                  <TooltipTrigger asChild>
                    {content}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <div key={item.title}>
                {content}
              </div>
            );
          })}
        </nav>

        {/* Footer with workspace info */}
        {!isCollapsed && (
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Workspace Navigation</span>
                <span className="font-medium">{sidebarItems.length} items</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
