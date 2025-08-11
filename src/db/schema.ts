import { pgTable, varchar, timestamp, text, boolean, integer, uuid } from 'drizzle-orm/pg-core';

// Users/Profiles table (integrated with Clerk)
export const profiles = pgTable('profiles', {
  id: varchar('id', { length: 255 }).primaryKey(), // Clerk user ID
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  avatarUrl: text('avatar_url'),
  systemRole: varchar('system_role', { length: 50 }).notNull().default('member'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false), // <-- ADD THIS LINE
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastActiveAt: timestamp('last_active_at')
});

// Export type for the profiles table
export type Profile = typeof profiles.$inferSelect;

// Workspaces
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdById: varchar('created_by_id', { length: 255 }).notNull().references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type Workspace = typeof workspaces.$inferSelect;

// Workspace Members
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  profileId: varchar('profile_id', { length: 255 }).notNull().references(() => profiles.id),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  capabilities: text('capabilities').notNull().default('["view", "create"]'), // JSON array of capabilities
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Invitations
export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  token: uuid('token').defaultRandom().notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'accepted', 'expired'
  invitedById: varchar('invited_by_id', { length: 255 }).notNull().references(() => profiles.id),
  projectId: uuid('project_id').references(() => projects.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Projects
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  ownerId: varchar('owner_id', { length: 255 }).notNull().references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  startDate: timestamp('start_date'),
  dueDate: timestamp('due_date')
});

export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type TaskSubtask = typeof taskSubtasks.$inferSelect;
export type TaskLink = typeof taskLinks.$inferSelect;
export type TaskLabel = typeof taskLabels.$inferSelect;
export type TaskAuditLog = typeof taskAuditLogs.$inferSelect;
export type TaskHistory = typeof taskHistory.$inferSelect;

// Tasks
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 30 }).notNull().default('feature'),
  status: varchar('status', { length: 20 }).notNull().default('todo'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  assigneeId: varchar('assignee_id', { length: 255 }).references(() => profiles.id),
  creatorId: varchar('creator_id', { length: 255 }).notNull().references(() => profiles.id),
  sprintId: uuid('sprint_id').references(() => sprints.id),
  storyPoints: integer('story_points'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at')
});

// Project Members (project-level RBAC)
export const projectMembers = pgTable('project_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  profileId: varchar('profile_id', { length: 255 }).notNull().references(() => profiles.id),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  capabilities: text('capabilities').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Sprints
export const sprints = pgTable('sprints', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  status: varchar('status', { length: 20 }).notNull().default('planning'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Milestones
export const milestones = pgTable('milestones', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date'),
  status: varchar('status', { length: 20 }).notNull().default('planned'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Releases
export const releases = pgTable('releases', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  name: varchar('name', { length: 120 }).notNull(),
  date: timestamp('date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Blockers/Flags
export const blockers = pgTable('blockers', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  taskId: uuid('task_id').references(() => tasks.id),
  note: text('note'),
  startedAt: timestamp('started_at').defaultNow(),
  clearedAt: timestamp('cleared_at'),
});

// Calendar Events (meetings, external deadlines, compliance)
export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  name: varchar('name', { length: 200 }).notNull(),
  date: timestamp('date').notNull(),
  kind: varchar('kind', { length: 30 }).notNull().default('meeting'), // meeting | external | compliance
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project Phases overlay
export const projectPhases = pgTable('project_phases', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  name: varchar('name', { length: 120 }).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  sortOrder: integer('sort_order').default(0),
});

// Capacity windows overlay (holidays, team leave, blackout)
export const capacityWindows = pgTable('capacity_windows', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  name: varchar('name', { length: 120 }).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  kind: varchar('kind', { length: 30 }).notNull().default('holiday'), // holiday | leave | blackout
});

// Policy windows overlay (e.g., code freeze)
export const policies = pgTable('policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  name: varchar('name', { length: 120 }).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  kind: varchar('kind', { length: 30 }).notNull().default('code_freeze'),
});

// Comments
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  authorId: varchar('author_id', { length: 255 }).notNull().references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Bugs
export const bugs = pgTable('bugs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  severity: varchar('severity', { length: 20 }).notNull().default('medium'),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  reporterId: varchar('reporter_id', { length: 255 }).notNull().references(() => profiles.id),
  assigneeId: varchar('assignee_id', { length: 255 }).references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  resolvedAt: timestamp('resolved_at')
});

// Documents
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  uploaderId: varchar('uploader_id', { length: 255 }).notNull().references(() => profiles.id),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  version: integer('version').notNull().default(1)
});

// Task Attachments
export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  uploaderId: varchar('uploader_id', { length: 255 }).notNull().references(() => profiles.id),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  s3Key: text('s3_key').notNull(), // S3 object key for deletion
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}); 

// Task Subtasks
export const taskSubtasks = pgTable('task_subtasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  assigneeId: varchar('assignee_id', { length: 255 }).references(() => profiles.id),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Task Links
export const taskLinks = pgTable('task_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  linkedTaskId: uuid('linked_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  relation: varchar('relation', { length: 30 }).notNull(), // blocks | is_blocked_by | related
  createdAt: timestamp('created_at').defaultNow(),
});

// Task Labels (simple free-form labels)
export const taskLabels = pgTable('task_labels', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Task Audit Logs
export const taskAuditLogs = pgTable('task_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  actorId: varchar('actor_id', { length: 255 }).notNull().references(() => profiles.id),
  action: varchar('action', { length: 64 }).notNull(),
  details: text('details'), // optional JSON string describing change
  createdAt: timestamp('created_at').defaultNow(),
});

// Task History (per-field change logs)
export const taskHistory = pgTable('task_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => profiles.id),
  field: varchar('field', { length: 64 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow(),
});