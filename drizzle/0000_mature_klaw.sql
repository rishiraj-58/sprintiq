CREATE TYPE "public"."role_capability_enum" AS ENUM('view', 'create', 'edit', 'delete', 'manage_members', 'manage_settings');--> statement-breakpoint
CREATE TYPE "public"."system_role_enum" AS ENUM('admin', 'manager', 'member', 'guest');--> statement-breakpoint
CREATE TABLE "auth.users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"email_verified" timestamp with time zone,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar_url" text,
	"system_role" "system_role_enum" DEFAULT 'member' NOT NULL,
	"job_title" varchar(100),
	"department" varchar(100),
	"preferences" jsonb DEFAULT '{}',
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_memberships" (
	"project_id" uuid,
	"user_id" uuid,
	"is_owner" boolean DEFAULT false,
	"capabilities" "role_capability_enum"[] DEFAULT '{"view"}',
	"custom_permissions" jsonb DEFAULT '{}',
	"allocation_percentage" integer DEFAULT 100,
	"status" varchar(50) DEFAULT 'active',
	"assigned_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "project_memberships_project_id_user_id_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"tech_stack" jsonb DEFAULT '[]',
	"project_type" varchar(50),
	"methodology" varchar(50) DEFAULT 'agile',
	"start_date" date,
	"target_end_date" date,
	"actual_end_date" date,
	"estimated_budget" numeric(12, 2),
	"actual_budget" numeric(12, 2),
	"status" varchar(50) DEFAULT 'planning',
	"health_score" integer,
	"risk_level" varchar(50) DEFAULT 'low',
	"created_by" uuid,
	"project_manager_id" uuid,
	"settings" jsonb DEFAULT '{}',
	"ai_settings" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"task_number" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"type" varchar(50) DEFAULT 'task',
	"category" varchar(100),
	"labels" jsonb DEFAULT '[]',
	"priority" varchar(50) DEFAULT 'medium',
	"story_points" integer,
	"estimated_hours" numeric(6, 2),
	"actual_hours" numeric(6, 2),
	"complexity_score" integer,
	"status" varchar(50) DEFAULT 'todo',
	"resolution" varchar(50),
	"assignee_id" uuid,
	"reporter_id" uuid,
	"parent_task_id" uuid,
	"depends_on" uuid[],
	"blocks" uuid[],
	"due_date" timestamp with time zone,
	"start_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"workspace_id" uuid,
	"project_id" uuid,
	"context_data" jsonb DEFAULT '{}',
	"session_duration" integer,
	"last_accessed" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_memberships" (
	"workspace_id" uuid,
	"user_id" uuid,
	"is_owner" boolean DEFAULT false,
	"capabilities" "role_capability_enum"[] DEFAULT '{"view"}',
	"custom_permissions" jsonb DEFAULT '{}',
	"status" varchar(50) DEFAULT 'active',
	"invited_by" uuid,
	"invited_at" timestamp with time zone,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "workspace_memberships_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"industry" varchar(100),
	"company_size" varchar(50),
	"business_goals" jsonb DEFAULT '[]',
	"settings" jsonb DEFAULT '{}',
	"ai_settings" jsonb DEFAULT '{}',
	"branding" jsonb DEFAULT '{}',
	"created_by" uuid,
	"is_active" boolean DEFAULT true,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_auth.users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."auth.users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_assigned_by_profiles_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_profiles_id_fk" FOREIGN KEY ("project_manager_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_profiles_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reporter_id_profiles_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_contexts" ADD CONSTRAINT "user_contexts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_contexts" ADD CONSTRAINT "user_contexts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_contexts" ADD CONSTRAINT "user_contexts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;