-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Full schema will be managed by Supabase migrations
-- This file is just for local development setup

-- Verify extensions
SELECT * FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp');
