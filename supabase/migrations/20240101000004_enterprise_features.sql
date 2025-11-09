-- Enhanced audit log fields and functions

-- Create enum for audit event types
CREATE TYPE audit_event_type AS ENUM (
  'package_created',
  'package_updated',
  'package_deleted',
  'version_published',
  'version_unpublished',
  'file_uploaded',
  'file_deleted',
  'user_invited',
  'user_removed',
  'role_changed',
  'settings_updated',
  'api_key_created',
  'api_key_revoked',
  'database_provisioned',
  'database_terminated'
);

-- Enhanced audit logs table
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type audit_event_type NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT,
  resource_id UUID,
  resource_name TEXT,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX audit_events_created_at_idx ON audit_events(created_at DESC);
CREATE INDEX audit_events_actor_id_idx ON audit_events(actor_id);
CREATE INDEX audit_events_organization_id_idx ON audit_events(organization_id);
CREATE INDEX audit_events_event_type_idx ON audit_events(event_type);
CREATE INDEX audit_events_resource_idx ON audit_events(resource_type, resource_id);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type audit_event_type,
  p_actor_id UUID,
  p_organization_id UUID DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_resource_name TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
  actor_email TEXT;
BEGIN
  -- Get actor email
  SELECT email INTO actor_email FROM profiles WHERE id = p_actor_id;

  INSERT INTO audit_events (
    event_type,
    actor_id,
    actor_email,
    organization_id,
    resource_type,
    resource_id,
    resource_name,
    changes,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_event_type,
    p_actor_id,
    actor_email,
    p_organization_id,
    p_resource_type,
    p_resource_id,
    p_resource_name,
    p_changes,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;

-- Team roles and permissions
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Update organization_members table to use enum
-- First drop the default to avoid casting issues
ALTER TABLE organization_members
  ALTER COLUMN role DROP DEFAULT;

-- Then change the column type
ALTER TABLE organization_members
  ALTER COLUMN role TYPE organization_role
  USING role::organization_role;

-- Finally set the new default with proper enum type
ALTER TABLE organization_members
  ALTER COLUMN role SET DEFAULT 'member'::organization_role;

-- Team invitations
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES profiles(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Indexes for invitations
CREATE INDEX organization_invitations_token_idx ON organization_invitations(token);
CREATE INDEX organization_invitations_email_idx ON organization_invitations(email);

-- Dedicated database configuration
ALTER TABLE dedicated_databases ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'us-east-1';
ALTER TABLE dedicated_databases ADD COLUMN IF NOT EXISTS instance_type TEXT NOT NULL DEFAULT 'small';
ALTER TABLE dedicated_databases ADD COLUMN IF NOT EXISTS storage_gb INTEGER NOT NULL DEFAULT 50;
ALTER TABLE dedicated_databases ADD COLUMN IF NOT EXISTS backup_enabled BOOLEAN NOT NULL DEFAULT true;

-- Region enum
CREATE TYPE database_region AS ENUM (
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1'
);

-- Instance size enum
CREATE TYPE database_instance_type AS ENUM ('small', 'medium', 'large', 'xlarge');

-- Update dedicated_databases columns to use enums
ALTER TABLE dedicated_databases
  ALTER COLUMN region TYPE database_region USING region::database_region;

ALTER TABLE dedicated_databases
  ALTER COLUMN instance_type TYPE database_instance_type USING instance_type::database_instance_type;

-- SSO configuration
CREATE TABLE sso_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- saml, oidc
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, provider)
);

-- RLS policies for new tables
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_connections ENABLE ROW LEVEL SECURITY;

-- Audit events policies
CREATE POLICY "Organization owners and admins can view audit events"
  ON audit_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Invitations policies
CREATE POLICY "Organization owners and admins can manage invitations"
  ON organization_invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- SSO policies
CREATE POLICY "Organization owners can manage SSO"
  ON sso_connections FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Update trigger for sso_connections
CREATE TRIGGER update_sso_connections_updated_at BEFORE UPDATE ON sso_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
