-- Add optional project reference to invitations
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);


