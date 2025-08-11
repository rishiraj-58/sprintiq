import { pgTable, foreignKey, pgEnum, uuid, varchar, text, timestamp, integer, unique, boolean } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const roleCapabilityEnum = pgEnum("role_capability_enum", ['manage_settings', 'manage_members', 'delete', 'edit', 'create', 'view'])
export const systemRoleEnum = pgEnum("system_role_enum", ['guest', 'member', 'manager', 'admin'])


export const workspaceMembers = pgTable("workspace_members", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
	profileId: varchar("profile_id", { length: 255 }).notNull().references(() => profiles.id),
	role: varchar("role", { length: 50 }).default('member').notNull(),
	capabilities: text("capabilities").default('["view", "create"]').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const documents = pgTable("documents", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 200 }).notNull(),
	description: text("description"),
	projectId: uuid("project_id").notNull().references(() => projects.id),
	uploaderId: varchar("uploader_id", { length: 255 }).notNull().references(() => profiles.id),
	fileUrl: text("file_url").notNull(),
	fileType: varchar("file_type", { length: 50 }).notNull(),
	fileSize: integer("file_size").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	version: integer("version").default(1).notNull(),
});

export const taskAttachments = pgTable("task_attachments", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 200 }).notNull(),
	taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" } ),
	uploaderId: varchar("uploader_id", { length: 255 }).notNull().references(() => profiles.id),
	fileUrl: text("file_url").notNull(),
	fileType: varchar("file_type", { length: 50 }).notNull(),
	fileSize: integer("file_size").notNull(),
	s3Key: text("s3_key").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const comments = pgTable("comments", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	content: text("content").notNull(),
	taskId: uuid("task_id").notNull().references(() => tasks.id),
	authorId: varchar("author_id", { length: 255 }).notNull().references(() => profiles.id),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const sprints = pgTable("sprints", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	projectId: uuid("project_id").notNull().references(() => projects.id),
	status: varchar("status", { length: 20 }).default('planning').notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const bugs = pgTable("bugs", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	title: varchar("title", { length: 200 }).notNull(),
	description: text("description"),
	status: varchar("status", { length: 20 }).default('open').notNull(),
	severity: varchar("severity", { length: 20 }).default('medium').notNull(),
	projectId: uuid("project_id").notNull().references(() => projects.id),
	reporterId: varchar("reporter_id", { length: 255 }).notNull().references(() => profiles.id),
	assigneeId: varchar("assignee_id", { length: 255 }).references(() => profiles.id),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
});

export const invitations = pgTable("invitations", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" } ),
	email: varchar("email", { length: 255 }).notNull(),
	role: varchar("role", { length: 50 }).default('member').notNull(),
	token: uuid("token").defaultRandom().notNull(),
	status: varchar("status", { length: 20 }).default('pending').notNull(),
	invitedById: varchar("invited_by_id", { length: 255 }).notNull().references(() => profiles.id),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		invitationsTokenUnique: unique("invitations_token_unique").on(table.token),
	}
});

export const profiles = pgTable("profiles", {
	id: varchar("id", { length: 255 }).primaryKey().notNull(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	avatarUrl: text("avatar_url"),
	systemRole: varchar("system_role", { length: 50 }).default('member').notNull(),
	onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	email: varchar("email", { length: 255 }),
});

export const workspaces = pgTable("workspaces", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	createdById: varchar("created_by_id", { length: 255 }).notNull().references(() => profiles.id),
});

export const projects = pgTable("projects", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	startDate: timestamp("start_date", { mode: 'string' }),
	status: varchar("status", { length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	ownerId: varchar("owner_id", { length: 255 }).notNull().references(() => profiles.id),
	dueDate: timestamp("due_date", { mode: 'string' }),
});

export const tasks = pgTable("tasks", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id").notNull().references(() => projects.id),
	title: varchar("title", { length: 200 }).notNull(),
	description: text("description"),
	priority: varchar("priority", { length: 20 }).default('medium').notNull(),
	status: varchar("status", { length: 20 }).default('todo').notNull(),
	assigneeId: varchar("assignee_id", { length: 255 }).references(() => profiles.id),
	dueDate: timestamp("due_date", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	creatorId: varchar("creator_id", { length: 255 }).notNull().references(() => profiles.id),
	sprintId: uuid("sprint_id").references(() => sprints.id),
});