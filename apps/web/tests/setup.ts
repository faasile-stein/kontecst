import { beforeAll, afterAll } from 'vitest'

beforeAll(() => {
  // Set up test environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
})

afterAll(() => {
  // Clean up after tests
})
