-- Add content column to files table for storing markdown content
ALTER TABLE files ADD COLUMN IF NOT EXISTS content TEXT;

-- Add updated_at column to track file modifications
ALTER TABLE files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create trigger to update updated_at automatically
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster file content queries
CREATE INDEX IF NOT EXISTS files_package_version_id_idx ON files(package_version_id);
