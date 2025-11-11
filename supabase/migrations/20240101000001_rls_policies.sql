-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dedicated_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Users can view organizations they are members of"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT get_user_organization_ids(auth.uid()))
  );

CREATE POLICY "Organization owners can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (SELECT get_user_owned_organization_ids(auth.uid()))
  );

-- Organization members policies
CREATE POLICY "Users can view members of their organizations"
  ON organization_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  );

-- Packages policies
CREATE POLICY "Public packages are viewable by everyone"
  ON packages FOR SELECT
  USING (visibility = 'public' AND NOT is_archived);

CREATE POLICY "Users can view their own packages"
  ON packages FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view packages they have access to"
  ON packages FOR SELECT
  USING (
    id IN (
      SELECT package_id FROM package_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view packages in their organization"
  ON packages FOR SELECT
  USING (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  );

CREATE POLICY "Users can create packages"
  ON packages FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Package owners can update their packages"
  ON packages FOR UPDATE
  USING (owner_id = auth.uid());

-- Package versions policies
CREATE POLICY "Users can view versions of accessible packages"
  ON package_versions FOR SELECT
  USING (
    package_id IN (SELECT id FROM packages) -- Uses packages RLS
  );

CREATE POLICY "Package owners can create versions"
  ON package_versions FOR INSERT
  WITH CHECK (
    package_id IN (SELECT id FROM packages WHERE owner_id = auth.uid())
  );

-- Files policies
CREATE POLICY "Users can view files in accessible package versions"
  ON files FOR SELECT
  USING (
    package_version_id IN (SELECT id FROM package_versions) -- Uses package_versions RLS
  );

-- Embeddings policies
CREATE POLICY "Users can search embeddings in accessible packages"
  ON embeddings FOR SELECT
  USING (
    package_version_id IN (SELECT id FROM package_versions) -- Uses package_versions RLS
  );

-- Feeds policies
CREATE POLICY "Public feeds are viewable by everyone"
  ON feeds FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own feeds"
  ON feeds FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create feeds"
  ON feeds FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Feed packages policies
CREATE POLICY "Users can view packages in accessible feeds"
  ON feed_packages FOR SELECT
  USING (
    feed_id IN (SELECT id FROM feeds) -- Uses feeds RLS
  );

-- Access logs policies (admin only)
CREATE POLICY "Users can view their own access logs"
  ON access_logs FOR SELECT
  USING (user_id = auth.uid());

-- API keys policies
CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can revoke their own API keys"
  ON api_keys FOR UPDATE
  USING (user_id = auth.uid());
