CREATE TABLE IF NOT EXISTS "invitations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) NOT NULL DEFAULT 'member',
  "token" UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "invited_by_id" VARCHAR(255) NOT NULL REFERENCES "profiles"("id"),
  "created_at" TIMESTAMP DEFAULT NOW()
); 