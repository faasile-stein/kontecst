-- Add token_count column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS token_count INTEGER;

-- Add total_token_count column to package_versions table
ALTER TABLE package_versions ADD COLUMN IF NOT EXISTS total_token_count BIGINT DEFAULT 0;

-- Create function to estimate token count from text
-- Uses a simple approximation: ~4 characters per token
-- This can be replaced with actual tokenizer results when called from the API
CREATE OR REPLACE FUNCTION estimate_token_count(text_content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Simple estimation: divide character count by 4
  -- This is approximate and will be overridden by actual tokenizer
  RETURN GREATEST(1, LENGTH(text_content) / 4);
END;
$$;

-- Update existing files to have estimated token counts
UPDATE files
SET token_count = estimate_token_count(COALESCE(content, ''))
WHERE token_count IS NULL AND content IS NOT NULL;

-- Update existing package versions to have total token counts
UPDATE package_versions pv
SET total_token_count = COALESCE((
  SELECT SUM(token_count)
  FROM files
  WHERE package_version_id = pv.id
), 0)
WHERE total_token_count = 0;

-- Create trigger to auto-update total_token_count when files are inserted/updated/deleted
CREATE OR REPLACE FUNCTION update_version_token_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Decrement token count on delete
    UPDATE package_versions
    SET total_token_count = GREATEST(0, total_token_count - COALESCE(OLD.token_count, 0))
    WHERE id = OLD.package_version_id;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    -- Increment token count on insert
    UPDATE package_versions
    SET total_token_count = total_token_count + COALESCE(NEW.token_count, 0)
    WHERE id = NEW.package_version_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Adjust token count on update
    UPDATE package_versions
    SET total_token_count = total_token_count - COALESCE(OLD.token_count, 0) + COALESCE(NEW.token_count, 0)
    WHERE id = NEW.package_version_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for files table
DROP TRIGGER IF EXISTS trigger_update_version_token_stats ON files;
CREATE TRIGGER trigger_update_version_token_stats
  AFTER INSERT OR UPDATE OR DELETE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_version_token_stats();

-- Update the recalculate_version_stats function to include tokens
CREATE OR REPLACE FUNCTION recalculate_version_stats(version_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE package_versions
  SET
    file_count = (
      SELECT COUNT(*)
      FROM files
      WHERE package_version_id = version_id
    ),
    total_size_bytes = (
      SELECT COALESCE(SUM(size_bytes), 0)
      FROM files
      WHERE package_version_id = version_id
    ),
    total_token_count = (
      SELECT COALESCE(SUM(token_count), 0)
      FROM files
      WHERE package_version_id = version_id
    )
  WHERE id = version_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION estimate_token_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_version_stats(uuid) TO authenticated;
