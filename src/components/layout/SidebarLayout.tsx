'use client';

import { usePathname } from 'next/navigation';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useProject } from '@/stores/hooks/useProject';
import { usePermissions } from '@/hooks/usePermissions';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { ProjectSidebar } from './ProjectSidebar';
import { determineUserRole } from '@/config/sidebarConfig';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const { currentProject } = useProject();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine context based on current path
  const isProjectContext = pathname.includes('/projects/') && currentProject;
  const isWorkspaceContext = !isProjectContext && currentWorkspace;

  // Get user permissions for role determination
  const contextId = isProjectContext ? currentProject?.id : currentWorkspace?.id;
  const contextType = isProjectContext ? 'project' : 'workspace';
  const permissions = usePermissions(contextType, contextId);

  // Determine user role from capabilities
  const capabilities: string[] = [];
  if (permissions.canView) capabilities.push('view');
  if (permissions.canCreate) capabilities.push('create');
  if (permissions.canEdit) capabilities.push('edit');
  if (permissions.canDelete) capabilities.push('delete');
  if (permissions.canManageMembers) capabilities.push('manage_members');
  if (permissions.canManageSettings) capabilities.push('manage_settings');

  const userRole = determineUserRole(capabilities);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const renderSidebar = () => {
    if (isProjectContext && currentProject) {
      return (
        <ProjectSidebar
          role={userRole}
          projectId={currentProject.id}
          workspaceId={currentProject.workspaceId}
          currentPath={pathname}
          onNavigate={() => setIsMobileMenuOpen(false)}
        />
      );
    }

    if (isWorkspaceContext && currentWorkspace) {
      return (
        <WorkspaceSidebar
          role={userRole}
          workspaceId={currentWorkspace.id}
          currentPath={pathname}
          onNavigate={() => setIsMobileMenuOpen(false)}
        />
      );
    }

    return null;
  };

  // Don't render sidebar on auth pages or landing page
  if (pathname.startsWith('/auth') || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-background border shadow-sm md:hidden"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out bg-background border-r",
            "md:relative md:translate-x-0 md:block",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-4 pt-16 md:pt-4">
              {renderSidebar()}
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 md:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}

