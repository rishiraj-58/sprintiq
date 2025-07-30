CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID PRIMARY KEY,
  "first_name" VARCHAR(100),
  "last_name" VARCHAR(100),
  "email" VARCHAR(255),
  "avatar_url" TEXT,
  "system_role" VARCHAR(50) NOT NULL DEFAULT 'member',
  "job_title" VARCHAR(100),
  "department" VARCHAR(100),
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  "last_active_at" TIMESTAMP
); 