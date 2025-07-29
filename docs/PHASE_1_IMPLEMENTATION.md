# SprintIQ - Phase 1 Implementation Guide

## Table of Contents
1. [Phase Overview](#phase-overview)
2. [Core Features](#core-features)
3. [Technical Implementation](#technical-implementation)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Component Structure](#component-structure)
7. [State Management](#state-management)
8. [API Routes](#api-routes)
9. [Implementation Steps](#implementation-steps)

## 1. Phase Overview

Phase 1 focuses on building the core foundation of SprintIQ, implementing essential project management features while establishing a robust and scalable architecture. This phase will set up the basic infrastructure and implement fundamental user workflows.

### Goals
- Set up project infrastructure with Next.js 14
- Implement Supabase authentication and role-based system
- Create comprehensive workspace and project management
- Establish core task management features
- Set up state management with Zustand
- Implement basic UI components and layouts

### Timeline
- Estimated Duration: 4-6 weeks
- Key Milestones:
  - Week 1: Project setup and authentication
  - Week 2: Workspace and project management
  - Week 3: Task management implementation
  - Week 4: UI/UX refinement and testing

## 2. Core Features

### Authentication & User Management
- Sign up with email/password
- Sign in with email/password
- Social authentication (Google)
- Password reset flow
- User profile management
- Role-based access control
- User context management

### Workspace Management
- Create workspace with business context
- Invite team members with roles
- Workspace settings and configuration
- Member role management (Owner, Admin, Member)
- Workspace analytics and health metrics
- Cross-project visibility

### Project Management
- Create/Edit/Delete projects
- Project dashboard with health metrics
- Project settings and configuration
- Team member assignment
- Project-specific roles
- Technical stack tracking
- Budget and timeline management

### Task Management
- Create/Edit/Delete tasks
- Task status management
- Task assignment with validation
- Task categorization and labeling
- Priority and complexity tracking
- Dependency management
- Time tracking

## 3. Technical Implementation

### Project Structure
```
sprintiq/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── workspace/
│   │   │   │   ├── [workspaceId]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── settings/
│   │   │   │   │   └── members/
│   │   │   │   └── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── [projectId]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── tasks/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   ├── workspace/
│   │   │   ├── CreateWorkspaceModal.tsx
│   │   │   ├── WorkspaceCard.tsx
│   │   │   └── InviteMemberForm.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── CreateProjectModal.tsx
│   │   │   └── ProjectList.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── CreateTaskForm.tsx
│   │   └── ui/
│   │       └── [shadcn-ui components]
│   ├── stores/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── workspaceSlice.ts
│   │   │   ├── projectSlice.ts
│   │   │   └── taskSlice.ts
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useWorkspace.ts
│   │       └── useProject.ts
│   └── lib/
│       ├── supabase.ts
│       ├── utils.ts
│       └── types.ts
```

### Key Technologies Used in Phase 1
- Next.js 14 (App Router)
- Supabase (Auth & Database)
- Zustand (State Management)
- Tailwind CSS
- shadcn/ui
- TypeScript
- React Hook Form + Zod

## 4. Database Schema

```sql
-- System Roles (User's primary role in the organization)
CREATE TYPE system_role_enum AS ENUM (
  'admin',           -- System administrator
  'manager',         -- Can manage multiple workspaces
  'member',          -- Regular team member
  'guest'           -- External collaborator
);

-- Role Capabilities (Used in both workspaces and projects)
CREATE TYPE role_capability_enum AS ENUM (
  'view',           -- Can view content
  'create',         -- Can create content
  'edit',           -- Can edit content
  'delete',         -- Can delete content
  'manage_members', -- Can manage team members
  'manage_settings' -- Can manage settings
);

-- Enhanced Users table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  system_role system_role_enum NOT NULL DEFAULT 'member',
  job_title VARCHAR(100),
  department VARCHAR(100),
  preferences JSONB DEFAULT '{}',
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User context tracking
CREATE TABLE public.user_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  context_data JSONB DEFAULT '{}',
  session_duration INTEGER,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  industry VARCHAR(100),
  company_size VARCHAR(50),
  business_goals JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  ai_settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace memberships with role-based permissions
CREATE TABLE public.workspace_memberships (
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_owner BOOLEAN DEFAULT false,
  capabilities role_capability_enum[] DEFAULT '{"view"}',
  custom_permissions JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  invited_by UUID REFERENCES public.profiles(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(100) NOT NULL,
  tech_stack JSONB DEFAULT '[]',
  project_type VARCHAR(50),
  methodology VARCHAR(50) DEFAULT 'agile',
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  estimated_budget DECIMAL(12,2),
  actual_budget DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'planning',
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  risk_level VARCHAR(50) DEFAULT 'low',
  created_by UUID REFERENCES public.profiles(id),
  project_manager_id UUID REFERENCES public.profiles(id),
  settings JSONB DEFAULT '{}',
  ai_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

-- Project memberships with role-based permissions
CREATE TABLE public.project_memberships (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_owner BOOLEAN DEFAULT false,
  capabilities role_capability_enum[] DEFAULT '{"view"}',
  custom_permissions JSONB DEFAULT '{}',
  allocation_percentage INTEGER DEFAULT 100,
  status VARCHAR(50) DEFAULT 'active',
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'task',
  category VARCHAR(100),
  labels JSONB DEFAULT '[]',
  priority VARCHAR(50) DEFAULT 'medium',
  story_points INTEGER,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
  status VARCHAR(50) DEFAULT 'todo',
  resolution VARCHAR(50),
  assignee_id UUID REFERENCES public.profiles(id),
  reporter_id UUID REFERENCES public.profiles(id),
  parent_task_id UUID REFERENCES public.tasks(id),
  depends_on UUID[],
  blocks UUID[],
  due_date TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 5. Permission System

### Role-Based Access Control

```typescript
// types/permissions.ts
export type SystemRole = 'admin' | 'manager' | 'member' | 'guest';

export type RoleCapability = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'manage_members'
  | 'manage_settings';

// Default capability sets
export const DEFAULT_CAPABILITY_SETS = {
  OWNER: [
    'view',
    'create',
    'edit',
    'delete',
    'manage_members',
    'manage_settings'
  ] as RoleCapability[],
  
  MANAGER: [
    'view',
    'create',
    'edit',
    'manage_members'
  ] as RoleCapability[],
  
  MEMBER: [
    'view',
    'create',
    'edit'
  ] as RoleCapability[],
  
  VIEWER: [
    'view'
  ] as RoleCapability[]
};

// lib/permissions.ts
export class PermissionManager {
  static async getUserCapabilities(
    userId: string,
    contextType: 'workspace' | 'project',
    contextId: string
  ): Promise<RoleCapability[]> {
    const { data: membership } = await supabase
      .from(`${contextType}_memberships`)
      .select('capabilities, is_owner, custom_permissions')
      .match({ user_id: userId, [`${contextType}_id`]: contextId })
      .single();

    if (!membership) return [];
    
    if (membership.is_owner) {
      return DEFAULT_CAPABILITY_SETS.OWNER;
    }

    return membership.capabilities;
  }

  static hasCapability(
    userCapabilities: RoleCapability[],
    requiredCapability: RoleCapability
  ): boolean {
    return userCapabilities.includes(requiredCapability);
  }
}

// hooks/usePermissions.ts
export const usePermissions = (contextType: 'workspace' | 'project', contextId: string) => {
  const { user } = useAuth();
  const [capabilities, setCapabilities] = useState<RoleCapability[]>([]);

  useEffect(() => {
    if (user && contextId) {
      PermissionManager.getUserCapabilities(user.id, contextType, contextId)
        .then(setCapabilities);
    }
  }, [user, contextType, contextId]);

  return {
    canView: capabilities.includes('view'),
    canCreate: capabilities.includes('create'),
    canEdit: capabilities.includes('edit'),
    canDelete: capabilities.includes('delete'),
    canManageMembers: capabilities.includes('manage_members'),
    canManageSettings: capabilities.includes('manage_settings'),
    isOwner: capabilities.length === DEFAULT_CAPABILITY_SETS.OWNER.length
  };
};

// Components using permissions
export const ProtectedButton = ({ 
  requiredCapability,
  contextType,
  contextId,
  children,
  ...props
}: ProtectedButtonProps) => {
  const permissions = usePermissions(contextType, contextId);
  
  if (!permissions[`can${capitalize(requiredCapability)}`]) {
    return null;
  }

  return <Button {...props}>{children}</Button>;
};

// Example usage in components
export function WorkspaceSettings({ workspaceId }: { workspaceId: string }) {
  const permissions = usePermissions('workspace', workspaceId);
  
  if (!permissions.canManageSettings) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h1>Workspace Settings</h1>
      {permissions.canManageMembers && (
        <MemberManagement workspaceId={workspaceId} />
      )}
      {permissions.isOwner && (
        <DangerZone workspaceId={workspaceId} />
      )}
    </div>
  );
}
```

### Permission Examples

1. **Workspace Level**
```typescript
// A user who creates a workspace
{
  is_owner: true,
  capabilities: DEFAULT_CAPABILITY_SETS.OWNER
}

// A team lead added to workspace
{
  is_owner: false,
  capabilities: [
    'view',
    'create',
    'edit',
    'manage_members'
  ]
}

// A regular team member
{
  is_owner: false,
  capabilities: [
    'view',
    'create',
    'edit'
  ]
}

// An external stakeholder
{
  is_owner: false,
  capabilities: ['view']
}
```

2. **Project Level**
```typescript
// Project owner
{
  is_owner: true,
  capabilities: DEFAULT_CAPABILITY_SETS.OWNER
}

// Project manager
{
  is_owner: false,
  capabilities: [
    'view',
    'create',
    'edit',
    'manage_members'
  ]
}

// Developer
{
  is_owner: false,
  capabilities: [
    'view',
    'create',
    'edit'
  ]
}

// External viewer (client)
{
  is_owner: false,
  capabilities: ['view']
}
```

## 6. Component Structure

### Key Components Implementation

1. **Workspace Components**
```typescript
// components/workspace/WorkspaceCard.tsx
export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const { user, currentWorkspace } = useAuth();
  const { permissions } = useWorkspacePermissions(workspace.id);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{workspace.name}</CardTitle>
        <CardDescription>{workspace.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>Industry: {workspace.industry}</p>
          <p>Members: {workspace.memberCount}</p>
          <p>Active Projects: {workspace.activeProjectCount}</p>
        </div>
      </CardContent>
      <CardFooter>
        {permissions.canManage && (
          <Button onClick={() => handleSettings()}>Manage</Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

2. **Project Components**
```typescript
// components/projects/ProjectList.tsx
export function ProjectList({ workspaceId }: { workspaceId: string }) {
  const { projects, isLoading } = useProjects(workspaceId);
  const { permissions } = useWorkspacePermissions(workspaceId);
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="space-y-4">
      {permissions.canCreateProject && (
        <CreateProjectButton workspaceId={workspaceId} />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
```

## 7. State Management

### Zustand Store Structure

```typescript
// stores/index.ts
import { create } from 'zustand';
import { createAuthSlice } from './slices/authSlice';
import { createWorkspaceSlice } from './slices/workspaceSlice';
import { createProjectSlice } from './slices/projectSlice';
import { createTaskSlice } from './slices/taskSlice';
import { createUISlice } from './slices/uiSlice';

export const useStore = create<
  AuthSlice & WorkspaceSlice & ProjectSlice & TaskSlice & UISlice
>()((...args) => ({
  ...createAuthSlice(...args),
  ...createWorkspaceSlice(...args),
  ...createProjectSlice(...args),
  ...createTaskSlice(...args),
  ...createUISlice(...args),
}));

// stores/slices/workspaceSlice.ts
interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (data: WorkspaceCreate) => Promise<Workspace>;
  updateWorkspace: (id: string, data: WorkspaceUpdate) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
}

export const createWorkspaceSlice: StateCreator<WorkspaceState> = (set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  fetchWorkspaces: async () => {
    set({ isLoading: true });
    const { data } = await supabase.from('workspaces').select('*');
    set({ workspaces: data || [], isLoading: false });
  },
  // ... other methods
});
```

## 8. API Routes

### Core API Endpoints

```typescript
// app/api/workspaces/route.ts
export async function GET() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_memberships!inner(user_id),
      projects(count)
    `)
    .eq('workspace_memberships.user_id', session.user.id);

  if (error) return new Response(error.message, { status: 400 });
  return Response.json(data);
}

export async function POST(req: Request) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const { name, description, industry, company_size } = body;

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      name,
      description,
      industry,
      company_size,
      created_by: session.user.id,
      slug: generateSlug(name)
    })
    .select()
    .single();

  if (error) return new Response(error.message, { status: 400 });

  // Create workspace membership for creator
  await supabase
    .from('workspace_memberships')
    .insert({
      workspace_id: data.id,
      user_id: session.user.id,
      role: 'owner'
    });

  return Response.json(data);
}
```

## 9. Implementation Steps

### Week 1: Project Setup and Authentication
1. Initialize Next.js project with TypeScript
2. Set up Tailwind CSS and shadcn/ui
3. Configure Supabase and create database tables
4. Implement authentication flows
5. Create basic layouts and navigation
6. Set up Zustand store structure

### Week 2: Workspace Management
1. Implement workspace creation
2. Build workspace dashboard
3. Create member invitation system
4. Implement workspace settings
5. Add role-based access control
6. Set up workspace context management

### Week 3: Project and Task Management
1. Create project CRUD operations
2. Implement task management features
3. Build task assignment system
4. Add task comments functionality
5. Implement basic task filtering
6. Set up project context management

### Week 4: UI/UX and Testing
1. Refine component styling
2. Implement responsive design
3. Add loading states and error handling
4. Write unit tests for core functionality
5. Perform end-to-end testing
6. Implement proper error boundaries

### Getting Started
```bash
# Clone the repository
git clone <repository-url>
cd sprintiq

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

This Phase 1 implementation guide provides a detailed roadmap for building the core features of SprintIQ. It focuses on establishing a solid foundation with proper authentication, role-based access control, and state management while maintaining scalability for future phases. 