-- Add INSERT policy for files table
-- Users can insert files into package versions that belong to packages they own
CREATE POLICY "Package owners can create files in their versions"
  ON files FOR INSERT
  WITH CHECK (
    package_version_id IN (
      SELECT pv.id FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Add UPDATE policy for files table
-- Users can update files in package versions that belong to packages they own
CREATE POLICY "Package owners can update files in their versions"
  ON files FOR UPDATE
  USING (
    package_version_id IN (
      SELECT pv.id FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Add DELETE policy for files table
-- Users can delete files in package versions that belong to packages they own
CREATE POLICY "Package owners can delete files in their versions"
  ON files FOR DELETE
  USING (
    package_version_id IN (
      SELECT pv.id FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.owner_id = auth.uid()
    )
  );
