-- Task history table for per-field changes
CREATE TABLE IF NOT EXISTS task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id varchar(255) NOT NULL REFERENCES profiles(id),
  field varchar(64) NOT NULL,
  old_value text,
  new_value text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);

