-- Add is_locked column to package_versions
ALTER TABLE package_versions
ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN locked_at TIMESTAMPTZ,
ADD COLUMN locked_by UUID REFERENCES profiles(id);

-- Function to lock a package version
CREATE OR REPLACE FUNCTION lock_version(
  version_id uuid,
  user_id uuid
)
RETURNS package_versions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result package_versions;
BEGIN
  -- Check if version exists and user has permission
  IF NOT EXISTS (
    SELECT 1 FROM package_versions pv
    JOIN packages p ON p.id = pv.package_id
    WHERE pv.id = version_id AND p.owner_id = user_id
  ) THEN
    RAISE EXCEPTION 'Version not found or access denied';
  END IF;

  -- Check if version is already locked
  IF EXISTS (
    SELECT 1 FROM package_versions
    WHERE id = version_id AND is_locked = true
  ) THEN
    RAISE EXCEPTION 'Version is already locked';
  END IF;

  -- Lock the version
  UPDATE package_versions
  SET
    is_locked = true,
    locked_at = NOW(),
    locked_by = user_id
  WHERE id = version_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Function to unlock a package version
CREATE OR REPLACE FUNCTION unlock_version(
  version_id uuid,
  user_id uuid
)
RETURNS package_versions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result package_versions;
BEGIN
  -- Check if version exists and user has permission
  IF NOT EXISTS (
    SELECT 1 FROM package_versions pv
    JOIN packages p ON p.id = pv.package_id
    WHERE pv.id = version_id AND p.owner_id = user_id
  ) THEN
    RAISE EXCEPTION 'Version not found or access denied';
  END IF;

  -- Unlock the version
  UPDATE package_versions
  SET
    is_locked = false,
    locked_at = NULL,
    locked_by = NULL
  WHERE id = version_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;
