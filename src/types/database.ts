export type SystemRole = 'admin' | 'manager' | 'member' | 'guest'

export type RoleCapability = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'manage_members'
  | 'manage_settings'

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  system_role: SystemRole
  job_title: string | null
  department: string | null
  preferences: Record<string, any>
  last_active_at: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  description: string | null
  slug: string
  industry: string | null
  company_size: string | null
  business_goals: any[]
  settings: Record<string, any>
  ai_settings: Record<string, any>
  branding: Record<string, any>
  created_by: string
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface WorkspaceMembership {
  workspace_id: string
  user_id: string
  is_owner: boolean
  capabilities: RoleCapability[]
  custom_permissions: Record<string, any>
  status: string
  invited_by: string | null
  invited_at: string | null
  joined_at: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  slug: string
  tech_stack: any[]
  project_type: string | null
  methodology: string
  start_date: string | null
  target_end_date: string | null
  actual_end_date: string | null
  estimated_budget: number | null
  actual_budget: number | null
  status: string
  health_score: number | null
  risk_level: string
  created_by: string
  project_manager_id: string | null
  settings: Record<string, any>
  ai_settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProjectMembership {
  project_id: string
  user_id: string
  is_owner: boolean
  capabilities: RoleCapability[]
  custom_permissions: Record<string, any>
  allocation_percentage: number
  status: string
  assigned_by: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  task_number: number
  title: string
  description: string | null
  type: string
  category: string | null
  labels: any[]
  priority: string
  story_points: number | null
  estimated_hours: number | null
  actual_hours: number | null
  complexity_score: number | null
  status: string
  resolution: string | null
  assignee_id: string | null
  reporter_id: string | null
  parent_task_id: string | null
  depends_on: string[] | null
  blocks: string[] | null
  due_date: string | null
  start_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface UserContext {
  id: string
  user_id: string
  workspace_id: string | null
  project_id: string | null
  context_data: Record<string, any>
  session_duration: number | null
  last_accessed: string
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      workspaces: {
        Row: Workspace
        Insert: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Workspace, 'id' | 'created_at' | 'updated_at'>>
      }
      workspace_memberships: {
        Row: WorkspaceMembership
        Insert: Omit<WorkspaceMembership, 'created_at' | 'updated_at'>
        Update: Partial<Omit<WorkspaceMembership, 'workspace_id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      project_memberships: {
        Row: ProjectMembership
        Insert: Omit<ProjectMembership, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProjectMembership, 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>
      }
      user_contexts: {
        Row: UserContext
        Insert: Omit<UserContext, 'id' | 'last_accessed'>
        Update: Partial<Omit<UserContext, 'id' | 'last_accessed'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      system_role_enum: SystemRole
      role_capability_enum: RoleCapability
    }
  }
} 