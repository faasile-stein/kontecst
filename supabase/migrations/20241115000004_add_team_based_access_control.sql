-- Add team-based access control policies
-- This allows organization members to manage packages that belong to their organization

-- Allow organization members to update packages in their organization
CREATE POLICY "Organization members can update organization packages"
  ON packages FOR UPDATE
  USING (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  );

-- Allow organization members to delete packages in their organization
CREATE POLICY "Organization members can delete organization packages"
  ON packages FOR DELETE
  USING (
    organization_id IN (SELECT get_user_organization_ids(auth.uid()))
  );

-- Allow package owners to delete their own packages
CREATE POLICY "Package owners can delete their packages"
  ON packages FOR DELETE
  USING (owner_id = auth.uid());

-- Allow organization members to create versions for organization packages
CREATE POLICY "Organization members can create versions for organization packages"
  ON package_versions FOR INSERT
  WITH CHECK (
    package_id IN (
      SELECT id FROM packages
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

-- Allow organization members to update versions for organization packages
CREATE POLICY "Organization members can update versions for organization packages"
  ON package_versions FOR UPDATE
  USING (
    package_id IN (
      SELECT id FROM packages
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

-- Allow organization members to delete versions for organization packages
CREATE POLICY "Organization members can delete versions for organization packages"
  ON package_versions FOR DELETE
  USING (
    package_id IN (
      SELECT id FROM packages
      WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

-- Allow organization members to insert files into organization package versions
CREATE POLICY "Organization members can create files in organization versions"
  ON files FOR INSERT
  WITH CHECK (
    package_version_id IN (
      SELECT pv.id FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

-- Allow organization members to update files in organization package versions
CREATE POLICY "Organization members can update files in organization versions"
  ON files FOR UPDATE
  USING (
    package_version_id IN (
      SELECT pv.id FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

-- Allow organization members to delete files in organization package versions
CREATE POLICY "Organization members can delete files in organization versions"
  ON files FOR DELETE
  USING (
    package_version_id IN (
      SELECT pv.id FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Organization members can update organization packages" ON packages IS
  'Allows team members to manage packages that belong to their organization';
