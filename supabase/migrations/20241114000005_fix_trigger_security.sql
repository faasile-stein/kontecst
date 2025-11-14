-- Fix: Add SECURITY DEFINER to trigger functions so they bypass RLS
-- This allows the triggers to update package_versions stats regardless of RLS policies

-- Function to recalculate version stats from existing files
CREATE OR REPLACE FUNCTION recalculate_version_stats(version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
    )
  WHERE id = version_id;
END;
$$;

-- Function to automatically update version stats when files are inserted
CREATE OR REPLACE FUNCTION update_version_stats_on_file_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE package_versions
  SET
    file_count = file_count + 1,
    total_size_bytes = total_size_bytes + NEW.size_bytes
  WHERE id = NEW.package_version_id;
  RETURN NEW;
END;
$$;

-- Function to automatically update version stats when files are deleted
CREATE OR REPLACE FUNCTION update_version_stats_on_file_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE package_versions
  SET
    file_count = GREATEST(0, file_count - 1),
    total_size_bytes = GREATEST(0, total_size_bytes - OLD.size_bytes)
  WHERE id = OLD.package_version_id;
  RETURN OLD;
END;
$$;

-- Function to automatically update version stats when files are updated
CREATE OR REPLACE FUNCTION update_version_stats_on_file_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the file was moved to a different version, update both versions
  IF OLD.package_version_id != NEW.package_version_id THEN
    -- Remove from old version
    UPDATE package_versions
    SET
      file_count = GREATEST(0, file_count - 1),
      total_size_bytes = GREATEST(0, total_size_bytes - OLD.size_bytes)
    WHERE id = OLD.package_version_id;

    -- Add to new version
    UPDATE package_versions
    SET
      file_count = file_count + 1,
      total_size_bytes = total_size_bytes + NEW.size_bytes
    WHERE id = NEW.package_version_id;
  -- If just the size changed
  ELSIF OLD.size_bytes != NEW.size_bytes THEN
    UPDATE package_versions
    SET
      total_size_bytes = total_size_bytes - OLD.size_bytes + NEW.size_bytes
    WHERE id = NEW.package_version_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recalculate stats for all existing versions to fix any inconsistencies
DO $$
DECLARE
  v_id uuid;
BEGIN
  FOR v_id IN SELECT id FROM package_versions LOOP
    PERFORM recalculate_version_stats(v_id);
  END LOOP;
END;
$$;
