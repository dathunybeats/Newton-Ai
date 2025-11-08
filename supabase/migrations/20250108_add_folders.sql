-- Add folders functionality to Newton AI
-- This migration creates a folders table and adds folder support to notes

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#d1d5db',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT folders_name_not_empty CHECK (char_length(name) > 0)
);

-- Add folder_id to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);

-- Add updated_at trigger for folders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE folders IS 'User-created folders for organizing notes';
COMMENT ON COLUMN folders.name IS 'Folder display name';
COMMENT ON COLUMN folders.color IS 'Folder color (hex code)';
COMMENT ON COLUMN folders.icon IS 'Folder icon identifier';
COMMENT ON COLUMN notes.folder_id IS 'Optional folder assignment for organization';
