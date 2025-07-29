import { pgTable, pgEnum, uuid, varchar, text, timestamp, boolean, integer, decimal, jsonb, date, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const systemRoleEnum = pgEnum('system_role_enum', ['admin', 'manager', 'member', 'guest'])
export const roleCapabilityEnum = pgEnum('role_capability_enum', ['view', 'create', 'edit', 'delete', 'manage_members', 'manage_settings'])

// Auth users table (for reference)
export const authUsers = pgTable('auth.users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
})

// Create auth reference for profiles
const auth = { users: authUsers }

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => auth.users.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  systemRole: systemRoleEnum('system_role').notNull().default('member'),
  jobTitle: varchar('job_title', { length: 100 }),
  department: varchar('department', { length: 100 }),
  preferences: jsonb('preferences').default('{}'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Workspaces table
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  industry: varchar('industry', { length: 100 }),
  companySize: varchar('company_size', { length: 50 }),
  businessGoals: jsonb('business_goals').default('[]'),
  settings: jsonb('settings').default('{}'),
  aiSettings: jsonb('ai_settings').default('{}'),
  branding: jsonb('branding').default('{}'),
  createdBy: uuid('created_by').references(() => profiles.id),
  isActive: boolean('is_active').default(true),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Workspace memberships table
export const workspaceMemberships = pgTable('workspace_memberships', {
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  isOwner: boolean('is_owner').default(false),
  capabilities: roleCapabilityEnum('capabilities').array().default(['view']),
  customPermissions: jsonb('custom_permissions').default('{}'),
  status: varchar('status', { length: 50 }).default('active'),
  invitedBy: uuid('invited_by').references(() => profiles.id),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
}))

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull(),
  techStack: jsonb('tech_stack').default('[]'),
  projectType: varchar('project_type', { length: 50 }),
  methodology: varchar('methodology', { length: 50 }).default('agile'),
  startDate: date('start_date'),
  targetEndDate: date('target_end_date'),
  actualEndDate: date('actual_end_date'),
  estimatedBudget: decimal('estimated_budget', { precision: 12, scale: 2 }),
  actualBudget: decimal('actual_budget', { precision: 12, scale: 2 }),
  status: varchar('status', { length: 50 }).default('planning'),
  healthScore: integer('health_score'),
  riskLevel: varchar('risk_level', { length: 50 }).default('low'),
  createdBy: uuid('created_by').references(() => profiles.id),
  projectManagerId: uuid('project_manager_id').references(() => profiles.id),
  settings: jsonb('settings').default('{}'),
  aiSettings: jsonb('ai_settings').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Project memberships table
export const projectMemberships = pgTable('project_memberships', {
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  isOwner: boolean('is_owner').default(false),
  capabilities: roleCapabilityEnum('capabilities').array().default(['view']),
  customPermissions: jsonb('custom_permissions').default('{}'),
  allocationPercentage: integer('allocation_percentage').default(100),
  status: varchar('status', { length: 50 }).default('active'),
  assignedBy: uuid('assigned_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.projectId, table.userId] }),
}))

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  taskNumber: integer('task_number').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('task'),
  category: varchar('category', { length: 100 }),
  labels: jsonb('labels').default('[]'),
  priority: varchar('priority', { length: 50 }).default('medium'),
  storyPoints: integer('story_points'),
  estimatedHours: decimal('estimated_hours', { precision: 6, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 6, scale: 2 }),
  complexityScore: integer('complexity_score'),
  status: varchar('status', { length: 50 }).default('todo'),
  resolution: varchar('resolution', { length: 50 }),
  assigneeId: uuid('assignee_id').references(() => profiles.id),
  reporterId: uuid('reporter_id').references(() => profiles.id),
  parentTaskId: uuid('parent_task_id'),
  dependsOn: uuid('depends_on').array(),
  blocks: uuid('blocks').array(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  startDate: timestamp('start_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// User contexts table
export const userContexts = pgTable('user_contexts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  contextData: jsonb('context_data').default('{}'),
  sessionDuration: integer('session_duration'),
  lastAccessed: timestamp('last_accessed', { withTimezone: true }).defaultNow(),
})

// Relations
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  workspaces: many(workspaces),
  workspaceMemberships: many(workspaceMemberships),
  projectMemberships: many(projectMemberships),
  createdTasks: many(tasks, { relationName: 'taskCreator' }),
  assignedTasks: many(tasks, { relationName: 'taskAssignee' }),
  reportedTasks: many(tasks, { relationName: 'taskReporter' }),
  userContexts: many(userContexts),
}))

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  createdBy: one(profiles, {
    fields: [workspaces.createdBy],
    references: [profiles.id],
  }),
  projects: many(projects),
  workspaceMemberships: many(workspaceMemberships),
  userContexts: many(userContexts),
}))

export const workspaceMembershipsRelations = relations(workspaceMemberships, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMemberships.workspaceId],
    references: [workspaces.id],
  }),
  user: one(profiles, {
    fields: [workspaceMemberships.userId],
    references: [profiles.id],
  }),
  invitedBy: one(profiles, {
    fields: [workspaceMemberships.invitedBy],
    references: [profiles.id],
  }),
}))

export const projectsRelations = relations(projects, ({ many, one }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(profiles, {
    fields: [projects.createdBy],
    references: [profiles.id],
  }),
  projectManager: one(profiles, {
    fields: [projects.projectManagerId],
    references: [profiles.id],
  }),
  tasks: many(tasks),
  projectMemberships: many(projectMemberships),
  userContexts: many(userContexts),
}))

export const projectMembershipsRelations = relations(projectMemberships, ({ one }) => ({
  project: one(projects, {
    fields: [projectMemberships.projectId],
    references: [projects.id],
  }),
  user: one(profiles, {
    fields: [projectMemberships.userId],
    references: [profiles.id],
  }),
  assignedBy: one(profiles, {
    fields: [projectMemberships.assignedBy],
    references: [profiles.id],
  }),
}))

export const tasksRelations = relations(tasks, ({ many, one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(profiles, {
    fields: [tasks.assigneeId],
    references: [profiles.id],
    relationName: 'taskAssignee',
  }),
  reporter: one(profiles, {
    fields: [tasks.reporterId],
    references: [profiles.id],
    relationName: 'taskReporter',
  }),
  creator: one(profiles, {
    fields: [tasks.reporterId],
    references: [profiles.id],
    relationName: 'taskCreator',
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
  }),
  subtasks: many(tasks),
}))

export const userContextsRelations = relations(userContexts, ({ one }) => ({
  user: one(profiles, {
    fields: [userContexts.userId],
    references: [profiles.id],
  }),
  workspace: one(workspaces, {
    fields: [userContexts.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [userContexts.projectId],
    references: [projects.id],
  }),
})) 