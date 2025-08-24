CREATE TABLE IF NOT EXISTS "external_task_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"link_type" varchar(30) NOT NULL,
	"external_url" text NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"external_id" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_task_links" ADD CONSTRAINT "external_task_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
