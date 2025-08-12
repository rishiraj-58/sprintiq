CREATE TABLE IF NOT EXISTS "blockers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"note" text,
	"started_at" timestamp DEFAULT now(),
	"cleared_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"date" timestamp NOT NULL,
	"kind" varchar(30) DEFAULT 'meeting' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capacity_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"kind" varchar(30) DEFAULT 'holiday' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"due_date" timestamp,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"kind" varchar(30) DEFAULT 'code_freeze' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"profile_id" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"capabilities" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"action" varchar(64) NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"field" varchar(64) NOT NULL,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"label" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"linked_task_id" uuid NOT NULL,
	"relation" varchar(30) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"assignee_id" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "visibility" varchar(20) DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "currency" varchar(10) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "target_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "budget" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "type" varchar(30) DEFAULT 'feature' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "story_points" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blockers" ADD CONSTRAINT "blockers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blockers" ADD CONSTRAINT "blockers_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capacity_windows" ADD CONSTRAINT "capacity_windows_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "policies" ADD CONSTRAINT "policies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_members" ADD CONSTRAINT "project_members_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "releases" ADD CONSTRAINT "releases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_audit_logs" ADD CONSTRAINT "task_audit_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_audit_logs" ADD CONSTRAINT "task_audit_logs_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_history" ADD CONSTRAINT "task_history_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_history" ADD CONSTRAINT "task_history_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_links" ADD CONSTRAINT "task_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_links" ADD CONSTRAINT "task_links_linked_task_id_tasks_id_fk" FOREIGN KEY ("linked_task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_statuses" ADD CONSTRAINT "task_statuses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_assignee_id_profiles_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
