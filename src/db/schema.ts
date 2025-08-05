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

// Tasks
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('todo'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  assigneeId: varchar('assignee_id', { length: 255 }).references(() => profiles.id),
  creatorId: varchar('creator_id', { length: 255 }).notNull().references(() => profiles.id),
  sprintId: uuid('sprint_id').references(() => sprints.id),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at')
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