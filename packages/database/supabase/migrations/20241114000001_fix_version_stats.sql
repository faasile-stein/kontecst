-- Function to recalculate version stats from existing files
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
    )
  WHERE id = version_id;
END;
$$;

-- Recalculate stats for all existing versions
DO $$
DECLARE
  v_id uuid;
BEGIN
  FOR v_id IN SELECT id FROM package_versions LOOP
    PERFORM recalculate_version_stats(v_id);
  END LOOP;
END;
$$;
