-- GitHub Sync Integration
-- This migration adds support for syncing packages from GitHub repositories

-- GitHub installation types
CREATE TYPE github_installation_type AS ENUM ('user', 'organization');

-- GitHub sync status
CREATE TYPE github_sync_status AS ENUM ('idle', 'syncing', 'success', 'error');

-- GitHub connections table
CREATE TABLE github_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- GitHub App installation data
  installation_id BIGINT NOT NULL,
  installation_type github_installation_type NOT NULL,
  account_login TEXT NOT NULL,
  account_id BIGINT NOT NULL,
  account_avatar_url TEXT,

  -- Access token (encrypted)
  access_token_encrypted TEXT NOT NULL,
  access_token_expires_at TIMESTAMPTZ,

  -- Metadata
  permissions JSONB,
  repository_selection TEXT, -- 'all' or 'selected'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(installation_id)
);

-- GitHub repository mappings
CREATE TABLE github_repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_connection_id UUID NOT NULL REFERENCES github_connections(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,

  -- GitHub repository data
  repo_id BIGINT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_full_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  is_private BOOLEAN NOT NULL DEFAULT false,

  -- Sync configuration
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_path TEXT DEFAULT '/', -- Path within repo to sync (e.g., '/docs')
  sync_branch TEXT, -- Branch to sync from (null = default branch)
  auto_publish BOOLEAN NOT NULL DEFAULT false, -- Auto-publish on sync

  -- Sync status
  last_sync_status github_sync_status DEFAULT 'idle',
  last_sync_at TIMESTAMPTZ,
  last_sync_commit_sha TEXT,
  last_sync_error TEXT,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(github_connection_id, repo_id)
);

-- Sync history for audit trail
CREATE TABLE github_sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_repository_id UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
  package_version_id UUID REFERENCES package_versions(id) ON DELETE SET NULL,

  -- Sync details
  sync_status github_sync_status NOT NULL,
  commit_sha TEXT NOT NULL,
  commit_message TEXT,
  commit_author TEXT,
  commit_date TIMESTAMPTZ,

  -- Files synced
  files_added INTEGER DEFAULT 0,
  files_updated INTEGER DEFAULT 0,
  files_deleted INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Performance
  duration_ms INTEGER
);

-- Indexes
CREATE INDEX idx_github_connections_user ON github_connections(user_id);
CREATE INDEX idx_github_connections_org ON github_connections(organization_id);
CREATE INDEX idx_github_connections_installation ON github_connections(installation_id);

CREATE INDEX idx_github_repositories_connection ON github_repositories(github_connection_id);
CREATE INDEX idx_github_repositories_package ON github_repositories(package_id);
CREATE INDEX idx_github_repositories_sync_enabled ON github_repositories(sync_enabled) WHERE sync_enabled = true;

CREATE INDEX idx_github_sync_history_repo ON github_sync_history(github_repository_id);
CREATE INDEX idx_github_sync_history_version ON github_sync_history(package_version_id);
CREATE INDEX idx_github_sync_history_status ON github_sync_history(sync_status);
CREATE INDEX idx_github_sync_history_started ON github_sync_history(started_at DESC);

-- Row Level Security (RLS)
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_sync_history ENABLE ROW LEVEL SECURITY;

-- Policies for github_connections
CREATE POLICY "Users can view their own GitHub connections"
  ON github_connections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own GitHub connections"
  ON github_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own GitHub connections"
  ON github_connections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own GitHub connections"
  ON github_connections FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for github_repositories
CREATE POLICY "Users can view GitHub repositories they have access to"
  ON github_repositories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM github_connections gc
      WHERE gc.id = github_repositories.github_connection_id
      AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert GitHub repositories for their connections"
  ON github_repositories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM github_connections gc
      WHERE gc.id = github_repositories.github_connection_id
      AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update GitHub repositories they have access to"
  ON github_repositories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM github_connections gc
      WHERE gc.id = github_repositories.github_connection_id
      AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete GitHub repositories they have access to"
  ON github_repositories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM github_connections gc
      WHERE gc.id = github_repositories.github_connection_id
      AND gc.user_id = auth.uid()
    )
  );

-- Policies for github_sync_history
CREATE POLICY "Users can view sync history for their repositories"
  ON github_sync_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM github_repositories gr
      JOIN github_connections gc ON gc.id = gr.github_connection_id
      WHERE gr.id = github_sync_history.github_repository_id
      AND gc.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_github_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER github_connections_updated_at
  BEFORE UPDATE ON github_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_github_updated_at();

CREATE TRIGGER github_repositories_updated_at
  BEFORE UPDATE ON github_repositories
  FOR EACH ROW
  EXECUTE FUNCTION update_github_updated_at();

-- Function to trigger sync for a repository
CREATE OR REPLACE FUNCTION trigger_github_sync(
  p_repository_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_sync_id UUID;
BEGIN
  -- Create sync history entry
  INSERT INTO github_sync_history (
    github_repository_id,
    sync_status,
    commit_sha,
    started_at
  )
  VALUES (
    p_repository_id,
    'syncing',
    'pending',
    NOW()
  )
  RETURNING id INTO v_sync_id;

  -- Update repository sync status
  UPDATE github_repositories
  SET
    last_sync_status = 'syncing',
    updated_at = NOW()
  WHERE id = p_repository_id;

  RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete sync
CREATE OR REPLACE FUNCTION complete_github_sync(
  p_sync_id UUID,
  p_status github_sync_status,
  p_commit_sha TEXT,
  p_commit_message TEXT DEFAULT NULL,
  p_commit_author TEXT DEFAULT NULL,
  p_commit_date TIMESTAMPTZ DEFAULT NULL,
  p_files_added INTEGER DEFAULT 0,
  p_files_updated INTEGER DEFAULT 0,
  p_files_deleted INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL,
  p_package_version_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_repo_id UUID;
  v_started_at TIMESTAMPTZ;
BEGIN
  -- Get repository ID and start time
  SELECT github_repository_id, started_at
  INTO v_repo_id, v_started_at
  FROM github_sync_history
  WHERE id = p_sync_id;

  -- Update sync history
  UPDATE github_sync_history
  SET
    sync_status = p_status,
    commit_sha = p_commit_sha,
    commit_message = p_commit_message,
    commit_author = p_commit_author,
    commit_date = p_commit_date,
    files_added = p_files_added,
    files_updated = p_files_updated,
    files_deleted = p_files_deleted,
    error_message = p_error_message,
    error_details = p_error_details,
    package_version_id = p_package_version_id,
    completed_at = NOW(),
    duration_ms = EXTRACT(EPOCH FROM (NOW() - v_started_at)) * 1000
  WHERE id = p_sync_id;

  -- Update repository
  UPDATE github_repositories
  SET
    last_sync_status = p_status,
    last_sync_at = NOW(),
    last_sync_commit_sha = CASE WHEN p_status = 'success' THEN p_commit_sha ELSE last_sync_commit_sha END,
    last_sync_error = CASE WHEN p_status = 'error' THEN p_error_message ELSE NULL END,
    updated_at = NOW()
  WHERE id = v_repo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON github_connections TO authenticated;
GRANT ALL ON github_repositories TO authenticated;
GRANT SELECT ON github_sync_history TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_github_sync TO authenticated;
GRANT EXECUTE ON FUNCTION complete_github_sync TO authenticated;
