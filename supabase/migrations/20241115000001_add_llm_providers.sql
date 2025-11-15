-- Create LLM provider configuration table
CREATE TYPE llm_provider_type AS ENUM ('openai', 'openai_compatible', 'anthropic', 'local');

CREATE TABLE llm_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type llm_provider_type NOT NULL,
  api_endpoint TEXT NOT NULL,
  api_key TEXT, -- NULL for local providers without auth
  model_name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  temperature REAL NOT NULL DEFAULT 0.3,
  metadata JSONB, -- For provider-specific settings
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER update_llm_providers_updated_at BEFORE UPDATE ON llm_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for enabled providers
CREATE INDEX llm_providers_is_enabled_idx ON llm_providers(is_enabled) WHERE is_enabled = true;

-- Create index for default provider
CREATE INDEX llm_providers_is_default_idx ON llm_providers(is_default) WHERE is_default = true;

-- Add user preferences for LLM selection
CREATE TABLE user_llm_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  llm_provider_id UUID NOT NULL REFERENCES llm_providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add updated_at trigger for user preferences
CREATE TRIGGER update_user_llm_preferences_updated_at BEFORE UPDATE ON user_llm_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE llm_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_llm_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for llm_providers
-- All authenticated users can view enabled providers
CREATE POLICY "Users can view enabled LLM providers"
  ON llm_providers FOR SELECT
  USING (is_enabled = true);

-- Only system admins can manage providers (we'll use a special admin check)
-- For now, we'll use organization owners as admins
CREATE POLICY "Organization owners can manage LLM providers"
  ON llm_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- RLS Policies for user_llm_preferences
-- Users can view their own preferences
CREATE POLICY "Users can view their own LLM preferences"
  ON user_llm_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can manage their own LLM preferences"
  ON user_llm_preferences FOR ALL
  USING (user_id = auth.uid());

-- Insert default local LLM provider
INSERT INTO llm_providers (
  name,
  type,
  api_endpoint,
  api_key,
  model_name,
  is_default,
  is_enabled,
  max_tokens,
  temperature,
  metadata
) VALUES (
  'Local LLM',
  'openai_compatible',
  'http://localhost:8080/v1/chat/completions',
  NULL,
  'local-model',
  true,
  true,
  4096,
  0.3,
  '{"description": "Local OpenAI-compatible LLM running on localhost:8080", "requires_auth": false}'::jsonb
);

-- Insert OpenAI provider as an option (disabled by default, admin can enable and configure)
INSERT INTO llm_providers (
  name,
  type,
  api_endpoint,
  api_key,
  model_name,
  is_default,
  is_enabled,
  max_tokens,
  temperature,
  metadata
) VALUES (
  'OpenAI GPT-4o',
  'openai',
  'https://api.openai.com/v1/chat/completions',
  NULL, -- Admin needs to configure API key
  'gpt-4o',
  false,
  false, -- Disabled until admin configures API key
  4096,
  0.3,
  '{"description": "OpenAI GPT-4o - Requires API key configuration", "requires_auth": true}'::jsonb
);

-- Function to get user's selected LLM provider or default
CREATE OR REPLACE FUNCTION get_user_llm_provider(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type llm_provider_type,
  api_endpoint TEXT,
  api_key TEXT,
  model_name TEXT,
  max_tokens INTEGER,
  temperature REAL,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First check if user has a preference
  RETURN QUERY
  SELECT
    lp.id,
    lp.name,
    lp.type,
    lp.api_endpoint,
    lp.api_key,
    lp.model_name,
    lp.max_tokens,
    lp.temperature,
    lp.metadata
  FROM llm_providers lp
  INNER JOIN user_llm_preferences ulp ON ulp.llm_provider_id = lp.id
  WHERE ulp.user_id = p_user_id
    AND lp.is_enabled = true
  LIMIT 1;

  -- If no preference, return default provider
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      lp.id,
      lp.name,
      lp.type,
      lp.api_endpoint,
      lp.api_key,
      lp.model_name,
      lp.max_tokens,
      lp.temperature,
      lp.metadata
    FROM llm_providers lp
    WHERE lp.is_default = true
      AND lp.is_enabled = true
    ORDER BY lp.created_at ASC
    LIMIT 1;
  END IF;
END;
$$;
