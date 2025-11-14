-- Fix audit events RLS policy to allow users to see their own events
-- even if they're not part of an organization

-- Drop the existing policy
DROP POLICY IF EXISTS "Organization owners and admins can view audit events" ON audit_events;

-- Create a new policy that allows:
-- 1. Users to see events they triggered (actor_id = auth.uid())
-- 2. Organization members to see events for their organization
CREATE POLICY "Users can view their own audit events and organization events"
  ON audit_events FOR SELECT
  USING (
    actor_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
