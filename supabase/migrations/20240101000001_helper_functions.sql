-- Helper function to get user's organization IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_organization_ids(user_uuid uuid)
RETURNS TABLE (organization_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = user_uuid;
END;
$$;

-- Helper function to get user's owned organization IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_owned_organization_ids(user_uuid uuid)
RETURNS TABLE (organization_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = user_uuid AND om.role = 'owner';
END;
$$;

-- Helper function to increment package version stats
CREATE OR REPLACE FUNCTION increment_version_stats(
  version_id uuid,
  file_count int,
  size_bytes bigint
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE package_versions
  SET
    file_count = package_versions.file_count + increment_version_stats.file_count,
    total_size_bytes = package_versions.total_size_bytes + increment_version_stats.size_bytes
  WHERE id = version_id;
END;
$$;

-- Helper function to decrement package version stats
CREATE OR REPLACE FUNCTION decrement_version_stats(
  version_id uuid,
  file_count int,
  size_bytes bigint
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE package_versions
  SET
    file_count = GREATEST(0, package_versions.file_count - decrement_version_stats.file_count),
    total_size_bytes = GREATEST(0, package_versions.total_size_bytes - decrement_version_stats.size_bytes)
  WHERE id = version_id;
END;
$$;

-- Function to publish a package version
CREATE OR REPLACE FUNCTION publish_version(
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

  -- Update version
  UPDATE package_versions
  SET
    is_published = true,
    published_at = NOW(),
    published_by = user_id
  WHERE id = version_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Function to unpublish a package version
CREATE OR REPLACE FUNCTION unpublish_version(
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

  -- Update version
  UPDATE package_versions
  SET
    is_published = false,
    published_at = NULL,
    published_by = NULL
  WHERE id = version_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;
