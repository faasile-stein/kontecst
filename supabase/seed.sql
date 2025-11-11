-- Seed data for local development
-- This file creates test users and organizations for local testing

-- Test user credentials:
-- User: test@kontecst.dev / password: testuser123
-- Admin: admin@kontecst.dev / password: adminuser123

-- Create test users in auth.users
-- Note: Supabase auth manages these, but we can insert them directly for local dev
-- Password hashes are for 'testuser123' and 'adminuser123' respectively
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  phone_change_token,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'test@kontecst.dev',
    '$2a$10$TKh8H1.PfQx37YgCzwiKb.KjNyLngTA7ub1sDmY5YvPZu8wKJC0bq', -- testuser123
    NOW(),
    '',
    '',
    '',
    '',
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User"}',
    false,
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'admin@kontecst.dev',
    '$2a$10$TKh8H1.PfQx37YgCzwiKb.KjNyLngTA7ub1sDmY5YvPZu8wKJC0bq', -- adminuser123
    NOW(),
    '',
    '',
    '',
    '',
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',
    false,
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- Create identities for the test users
-- Skip if identities already exist
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"test@kontecst.dev"}'::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities WHERE user_id = '00000000-0000-0000-0000-000000000001' AND provider = 'email'
);

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  '{"sub":"00000000-0000-0000-0000-000000000002","email":"admin@kontecst.dev"}'::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities WHERE user_id = '00000000-0000-0000-0000-000000000002' AND provider = 'email'
);

-- Update profiles for test users (created automatically by trigger, just update organization field)
UPDATE profiles SET organization = 'Test Organization' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE profiles SET organization = 'Admin Organization' WHERE id = '00000000-0000-0000-0000-000000000002';

-- Create test organizations
INSERT INTO organizations (id, name, slug) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Test Organization',
    'test-org'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Admin Organization',
    'admin-org'
  )
ON CONFLICT (id) DO NOTHING;

-- Add organization memberships
INSERT INTO organization_members (organization_id, user_id, role) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'owner'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'owner'
  )
ON CONFLICT (organization_id, user_id) DO NOTHING;
