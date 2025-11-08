-- Function to search embeddings using vector similarity
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_package_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_id uuid,
  package_version_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.file_id,
    e.package_version_id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.metadata
  FROM embeddings e
  WHERE
    (filter_package_id IS NULL OR e.package_version_id IN (
      SELECT id FROM package_versions WHERE package_id = filter_package_id
    ))
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get package statistics
CREATE OR REPLACE FUNCTION get_package_stats(package_uuid uuid)
RETURNS TABLE (
  total_versions int,
  total_files int,
  total_size_bytes bigint,
  latest_version text,
  last_published_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT pv.id)::int AS total_versions,
    SUM(pv.file_count)::int AS total_files,
    SUM(pv.total_size_bytes)::bigint AS total_size_bytes,
    (
      SELECT version FROM package_versions
      WHERE package_id = package_uuid AND is_published = true
      ORDER BY published_at DESC
      LIMIT 1
    ) AS latest_version,
    (
      SELECT published_at FROM package_versions
      WHERE package_id = package_uuid AND is_published = true
      ORDER BY published_at DESC
      LIMIT 1
    ) AS last_published_at
  FROM package_versions pv
  WHERE pv.package_id = package_uuid;
END;
$$;

-- Function to check user's package access
CREATE OR REPLACE FUNCTION check_package_access(
  user_uuid uuid,
  package_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access boolean;
BEGIN
  -- Check if package is public
  SELECT EXISTS (
    SELECT 1 FROM packages
    WHERE id = package_uuid AND visibility = 'public'
  ) INTO has_access;

  IF has_access THEN
    RETURN true;
  END IF;

  -- Check if user is the owner
  SELECT EXISTS (
    SELECT 1 FROM packages
    WHERE id = package_uuid AND owner_id = user_uuid
  ) INTO has_access;

  IF has_access THEN
    RETURN true;
  END IF;

  -- Check explicit access grants
  SELECT EXISTS (
    SELECT 1 FROM package_access
    WHERE package_id = package_uuid
      AND user_id = user_uuid
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO has_access;

  IF has_access THEN
    RETURN true;
  END IF;

  -- Check organization access
  SELECT EXISTS (
    SELECT 1 FROM packages p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = package_uuid AND om.user_id = user_uuid
  ) INTO has_access;

  RETURN has_access;
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
