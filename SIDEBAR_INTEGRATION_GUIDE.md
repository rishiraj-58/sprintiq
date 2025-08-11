# Role-Based Sidebar Integration Guide

## Overview

The Sprint IQ application now includes a comprehensive role-based sidebar system that automatically adapts navigation based on user roles (Owner, Manager, Member, Viewer) and current context (Workspace or Project).

## Components

### 1. SidebarLayout Component
**Location:** `src/components/layout/SidebarLayout.tsx`

Main layout wrapper that:
- Automatically detects context (workspace vs project)
- Determines user role from permissions
- Renders appropriate sidebar component
- Includes responsive design with mobile hamburger menu

### 2. WorkspaceSidebar Component
**Location:** `src/components/layout/WorkspaceSidebar.tsx`

Features:
- Role-based navigation items for workspace-level operations
- Collapsible design with tooltips
- Role badge display
- Active state highlighting

### 3. ProjectSidebar Component
**Location:** `src/components/layout/ProjectSidebar.tsx`

Features:
- Project-specific navigation with role filtering
- Backward compatibility with existing tab system
- Enhanced tooltips and accessibility
- Dynamic item visibility based on permissions

### 4. Configuration System
**Location:** `src/config/sidebarConfig.ts`

Centralized configuration for:
- Navigation items per role
- Icons and descriptions
- Path templates
- Permission requirements

## Integration

### Option 1: Full Layout Integration
Replace your main layout with SidebarLayout:

```tsx
import { SidebarLayout } from '@/components/layout/SidebarLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
}
```

### Option 2: Selective Integration
Use individual sidebar components:

```tsx
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar';
import { usePermissions } from '@/hooks/usePermissions';
import { determineUserRole } from '@/config/sidebarConfig';

function MyLayout() {
  const permissions = usePermissions('workspace', workspaceId);
  const role = determineUserRole([...permissions]);
  
  return (
    <div className="flex">
      <WorkspaceSidebar
        role={role}
        workspaceId={workspaceId}
        currentPath={pathname}
      />
      <main>{children}</main>
    </div>
  );
}
```

## Role Capabilities

### Owner
- Complete workspace access
- Billing and usage management
- Audit logs and security settings
- User role management
- All project permissions

### Manager
- Team member management
- Sprint planning tools
- Project reports and analytics
- Workload management
- Integration management

### Member
- Personal task management
- Project collaboration
- Sprint participation
- Personal reports and analytics
- Timeline viewing

### Viewer
- Read-only project access
- Basic reports and overviews
- Timeline viewing
- Limited navigation options

## Customization

### Adding New Navigation Items

1. Update `src/config/sidebarConfig.ts`:
```tsx
owner: {
  workspace: [
    // ... existing items
    {
      title: 'New Feature',
      icon: NewIcon,
      path: '/new-feature',
      description: 'Access new functionality'
    }
  ]
}
```

2. Create the corresponding page/route
3. Add any required permissions logic

### Modifying Role Permissions

Update the `determineUserRole` function in `sidebarConfig.ts`:

```tsx
export const determineUserRole = (capabilities: string[]): UserRole => {
  const has = (cap: string) => capabilities.includes(cap);
  
  // Add custom role determination logic
  if (has('custom_permission')) return 'custom_role';
  // ... existing logic
};
```

### Styling Customization

The sidebar components use Tailwind CSS classes and can be customized by:

1. Modifying the component class names
2. Updating the badge colors in `getRoleBadgeColor`
3. Adjusting responsive breakpoints
4. Customizing tooltip styles

## Demo

Visit `/sidebar-demo` to see an interactive demonstration of all roles and contexts.

## Mobile Responsiveness

The sidebar automatically:
- Collapses to hamburger menu on mobile
- Provides smooth transitions
- Maintains accessibility standards
- Shows tooltips when collapsed

## Accessibility Features

- ARIA labels and navigation landmarks
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast support

## Migration from Existing Sidebar

The new ProjectSidebar maintains backward compatibility with the existing tab system:

```tsx
// Old usage still works
<ProjectSidebar
  projectId={projectId}
  active="overview"
  mode="tabs"
  onSelect={handleTabSelect}
/>

// New enhanced usage
<ProjectSidebar
  role={userRole}
  projectId={projectId}
  workspaceId={workspaceId}
  currentPath={pathname}
  onNavigate={handleNavigation}
/>
```

## Performance Considerations

- Sidebar items are computed once per role/context change
- Permissions are cached at the hook level
- Icons are imported statically for better tree-shaking
- Responsive design uses CSS transforms for smooth animations

## Testing

The implementation includes:
- Role-based rendering tests
- Permission integration tests
- Responsive design validation
- Accessibility compliance checks

For questions or customization needs, refer to the component source code or create an issue in the project repository.

