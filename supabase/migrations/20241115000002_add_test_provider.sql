-- Add 'test' provider type to the enum
ALTER TYPE llm_provider_type ADD VALUE 'test';

-- Insert a test provider for testing purposes
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
  'Test Provider',
  'test',
  'http://localhost:9999/test',
  'test-api-key',
  'test-model',
  false,
  true,
  1024,
  0.5,
  '{"description": "Test provider for testing LLM provider functionality", "requires_auth": true, "test_mode": true}'::jsonb
);
