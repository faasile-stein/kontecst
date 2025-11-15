-- Add uploaded_by field to files table to track who uploaded each file
ALTER TABLE files
ADD COLUMN uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);

-- Add comment for documentation
COMMENT ON COLUMN files.uploaded_by IS 'User who uploaded this file';

-- Update RLS policies to include uploader information in queries
-- Users can view files in packages they have access to (existing policy covers this)
