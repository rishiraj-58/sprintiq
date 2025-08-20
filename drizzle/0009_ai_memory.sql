-- Create ai_memory table for long-term AI context
CREATE TABLE IF NOT EXISTS ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Helpful composite index for lookups
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_key_project
  ON ai_memory (user_id, key, project_id);



