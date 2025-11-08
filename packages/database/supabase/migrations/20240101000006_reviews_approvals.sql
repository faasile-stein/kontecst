-- Reviews and Approvals Workflow
-- This migration adds support for reviewing and approving package versions before publishing

-- Review status
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'changes_requested');

-- Review decision
CREATE TYPE review_decision AS ENUM ('approve', 'reject', 'request_changes');

-- Package version reviews table
CREATE TABLE package_version_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_version_id UUID NOT NULL REFERENCES package_versions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Review details
  decision review_decision NOT NULL,
  comment TEXT,

  -- Reviewed files (optional - specific files reviewed)
  files_reviewed TEXT[],

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(package_version_id, reviewer_id)
);

-- Package version approval requirements
CREATE TABLE package_approval_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,

  -- Approval requirements
  required_approvals INTEGER NOT NULL DEFAULT 1,
  allow_self_approval BOOLEAN NOT NULL DEFAULT false,
  require_all_files_reviewed BOOLEAN NOT NULL DEFAULT false,

  -- Auto-approval rules
  auto_approve_patch BOOLEAN NOT NULL DEFAULT false, -- Auto-approve patch versions (x.x.X)
  auto_approve_owner BOOLEAN NOT NULL DEFAULT true, -- Owner can auto-approve

  -- Required reviewers
  required_reviewer_ids UUID[],

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(package_id)
);

-- Review requests table (tracks when a version is submitted for review)
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_version_id UUID NOT NULL REFERENCES package_versions(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Request details
  status review_status NOT NULL DEFAULT 'pending',
  message TEXT,

  -- Assignment
  assigned_reviewers UUID[],

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_comment TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(package_version_id)
);

-- Indexes
CREATE INDEX idx_version_reviews_version ON package_version_reviews(package_version_id);
CREATE INDEX idx_version_reviews_reviewer ON package_version_reviews(reviewer_id);
CREATE INDEX idx_version_reviews_decision ON package_version_reviews(decision);

CREATE INDEX idx_approval_settings_package ON package_approval_settings(package_id);

CREATE INDEX idx_review_requests_version ON review_requests(package_version_id);
CREATE INDEX idx_review_requests_requester ON review_requests(requester_id);
CREATE INDEX idx_review_requests_status ON review_requests(status);

-- Row Level Security (RLS)
ALTER TABLE package_version_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_approval_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

-- Policies for package_version_reviews
CREATE POLICY "Users can view reviews for packages they have access to"
  ON package_version_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE pv.id = package_version_reviews.package_version_id
      AND (
        p.owner_id = auth.uid()
        OR p.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = p.organization_id
          AND om.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert reviews for packages they have access to"
  ON package_version_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE pv.id = package_version_reviews.package_version_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = p.organization_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin', 'member')
        )
      )
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON package_version_reviews FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
  ON package_version_reviews FOR DELETE
  TO authenticated
  USING (reviewer_id = auth.uid());

-- Policies for package_approval_settings
CREATE POLICY "Users can view approval settings for their packages"
  ON package_approval_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM packages p
      WHERE p.id = package_approval_settings.package_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = p.organization_id
          AND om.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Package owners can manage approval settings"
  ON package_approval_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM packages p
      WHERE p.id = package_approval_settings.package_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = p.organization_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Policies for review_requests
CREATE POLICY "Users can view review requests for packages they have access to"
  ON review_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE pv.id = review_requests.package_version_id
      AND (
        p.owner_id = auth.uid()
        OR p.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = p.organization_id
          AND om.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create review requests for their packages"
  ON review_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE pv.id = review_requests.package_version_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = p.organization_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin', 'member')
        )
      )
    )
  );

CREATE POLICY "Users can update review requests they created or are assigned to"
  ON review_requests FOR UPDATE
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR auth.uid() = ANY(assigned_reviewers)
    OR EXISTS (
      SELECT 1 FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE pv.id = review_requests.package_version_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = p.organization_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Function to check if version can be published based on approvals
CREATE OR REPLACE FUNCTION can_publish_version(
  p_version_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_package_id UUID;
  v_required_approvals INTEGER;
  v_approval_count INTEGER;
  v_rejection_count INTEGER;
  v_has_settings BOOLEAN;
BEGIN
  -- Get package ID
  SELECT package_id INTO v_package_id
  FROM package_versions
  WHERE id = p_version_id;

  -- Check if package has approval settings
  SELECT EXISTS (
    SELECT 1 FROM package_approval_settings
    WHERE package_id = v_package_id
  ) INTO v_has_settings;

  -- If no approval settings, allow publishing
  IF NOT v_has_settings THEN
    RETURN TRUE;
  END IF;

  -- Get required approvals
  SELECT required_approvals INTO v_required_approvals
  FROM package_approval_settings
  WHERE package_id = v_package_id;

  -- Count approvals and rejections
  SELECT
    COUNT(*) FILTER (WHERE decision = 'approve'),
    COUNT(*) FILTER (WHERE decision = 'reject')
  INTO v_approval_count, v_rejection_count
  FROM package_version_reviews
  WHERE package_version_id = p_version_id;

  -- If any rejections, cannot publish
  IF v_rejection_count > 0 THEN
    RETURN FALSE;
  END IF;

  -- Check if enough approvals
  RETURN v_approval_count >= v_required_approvals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update review request status based on reviews
CREATE OR REPLACE FUNCTION update_review_request_status()
RETURNS TRIGGER AS $$
DECLARE
  v_approval_count INTEGER;
  v_rejection_count INTEGER;
  v_changes_requested_count INTEGER;
  v_required_approvals INTEGER;
BEGIN
  -- Count review decisions
  SELECT
    COUNT(*) FILTER (WHERE decision = 'approve'),
    COUNT(*) FILTER (WHERE decision = 'reject'),
    COUNT(*) FILTER (WHERE decision = 'request_changes')
  INTO v_approval_count, v_rejection_count, v_changes_requested_count
  FROM package_version_reviews
  WHERE package_version_id = NEW.package_version_id;

  -- Get required approvals
  SELECT pas.required_approvals INTO v_required_approvals
  FROM package_versions pv
  JOIN package_approval_settings pas ON pas.package_id = pv.package_id
  WHERE pv.id = NEW.package_version_id;

  -- Update review request status
  IF v_rejection_count > 0 THEN
    UPDATE review_requests
    SET status = 'rejected',
        resolved_at = NOW(),
        resolved_by = NEW.reviewer_id
    WHERE package_version_id = NEW.package_version_id;
  ELSIF v_changes_requested_count > 0 THEN
    UPDATE review_requests
    SET status = 'changes_requested'
    WHERE package_version_id = NEW.package_version_id;
  ELSIF v_approval_count >= COALESCE(v_required_approvals, 1) THEN
    UPDATE review_requests
    SET status = 'approved',
        resolved_at = NOW(),
        resolved_by = NEW.reviewer_id
    WHERE package_version_id = NEW.package_version_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update review request status
CREATE TRIGGER update_review_request_status_trigger
  AFTER INSERT OR UPDATE ON package_version_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_request_status();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER package_version_reviews_updated_at
  BEFORE UPDATE ON package_version_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

CREATE TRIGGER package_approval_settings_updated_at
  BEFORE UPDATE ON package_approval_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

CREATE TRIGGER review_requests_updated_at
  BEFORE UPDATE ON review_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON package_version_reviews TO authenticated;
GRANT ALL ON package_approval_settings TO authenticated;
GRANT ALL ON review_requests TO authenticated;
GRANT EXECUTE ON FUNCTION can_publish_version TO authenticated;
