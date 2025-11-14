-- Function to automatically update version stats when files are inserted
CREATE OR REPLACE FUNCTION update_version_stats_on_file_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE package_versions
  SET
    file_count = file_count + 1,
    total_size_bytes = total_size_bytes + NEW.size_bytes
  WHERE id = NEW.package_version_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update version stats when files are deleted
CREATE OR REPLACE FUNCTION update_version_stats_on_file_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE package_versions
  SET
    file_count = GREATEST(0, file_count - 1),
    total_size_bytes = GREATEST(0, total_size_bytes - OLD.size_bytes)
  WHERE id = OLD.package_version_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update version stats when files are updated
CREATE OR REPLACE FUNCTION update_version_stats_on_file_update()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_version_stats_on_file_insert ON files;
DROP TRIGGER IF EXISTS trigger_update_version_stats_on_file_delete ON files;
DROP TRIGGER IF EXISTS trigger_update_version_stats_on_file_update ON files;

-- Create triggers
CREATE TRIGGER trigger_update_version_stats_on_file_insert
  AFTER INSERT ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_version_stats_on_file_insert();

CREATE TRIGGER trigger_update_version_stats_on_file_delete
  AFTER DELETE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_version_stats_on_file_delete();

CREATE TRIGGER trigger_update_version_stats_on_file_update
  AFTER UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_version_stats_on_file_update();

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
