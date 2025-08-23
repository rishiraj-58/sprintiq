CREATE TABLE IF NOT EXISTS "ai_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"project_id" uuid,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"action" varchar(128) NOT NULL,
	"severity" varchar(16) DEFAULT 'low' NOT NULL,
	"ip_address" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"project_repository_id" uuid NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"actor_login" varchar(100) NOT NULL,
	"actor_avatar_url" text,
	"title" varchar(300) NOT NULL,
	"description" text,
	"github_url" text,
	"metadata" jsonb,
	"github_created_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"project_repository_id" uuid NOT NULL,
	"branch_name" varchar(300) NOT NULL,
	"github_branch_ref" text NOT NULL,
	"created_by_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"github_installation_id" varchar(50) NOT NULL,
	"github_org_name" varchar(100) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"connected_by_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_pull_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"project_repository_id" uuid NOT NULL,
	"github_pr_number" integer NOT NULL,
	"title" varchar(300) NOT NULL,
	"body" text,
	"state" varchar(20) DEFAULT 'open' NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"head_branch" varchar(300) NOT NULL,
	"base_branch" varchar(300) NOT NULL,
	"author_login" varchar(100) NOT NULL,
	"github_created_at" timestamp NOT NULL,
	"github_updated_at" timestamp NOT NULL,
	"github_merged_at" timestamp,
	"checks_status" varchar(20) DEFAULT 'pending',
	"review_status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" varchar(255) NOT NULL,
	"actor_id" varchar(255),
	"type" varchar(32) NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"project_id" uuid,
	"task_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"github_integration_id" uuid NOT NULL,
	"repository_name" varchar(200) NOT NULL,
	"repository_full_name" varchar(300) NOT NULL,
	"github_repo_id" varchar(50) NOT NULL,
	"default_branch" varchar(100) DEFAULT 'main' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"linked_by_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"mention" boolean DEFAULT true NOT NULL,
	"task_assigned" boolean DEFAULT true NOT NULL,
	"status_update" boolean DEFAULT false NOT NULL,
	"comment_added" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bugs" ADD COLUMN "project_bug_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "key" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "project_task_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_memory" ADD CONSTRAINT "ai_memory_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_activities" ADD CONSTRAINT "github_activities_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_activities" ADD CONSTRAINT "github_activities_project_repository_id_project_repositories_id_fk" FOREIGN KEY ("project_repository_id") REFERENCES "project_repositories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_branches" ADD CONSTRAINT "github_branches_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_branches" ADD CONSTRAINT "github_branches_project_repository_id_project_repositories_id_fk" FOREIGN KEY ("project_repository_id") REFERENCES "project_repositories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_branches" ADD CONSTRAINT "github_branches_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_connected_by_id_profiles_id_fk" FOREIGN KEY ("connected_by_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_pull_requests" ADD CONSTRAINT "github_pull_requests_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_pull_requests" ADD CONSTRAINT "github_pull_requests_project_repository_id_project_repositories_id_fk" FOREIGN KEY ("project_repository_id") REFERENCES "project_repositories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_profiles_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_repositories" ADD CONSTRAINT "project_repositories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_repositories" ADD CONSTRAINT "project_repositories_github_integration_id_github_integrations_id_fk" FOREIGN KEY ("github_integration_id") REFERENCES "github_integrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_repositories" ADD CONSTRAINT "project_repositories_linked_by_id_profiles_id_fk" FOREIGN KEY ("linked_by_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_key_unique" UNIQUE("key");