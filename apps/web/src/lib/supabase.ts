import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables!\n\n' +
    'Please ensure the following environment variables are set:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_ANON_KEY\n\n' +
    'Create a .env.local file in apps/web/ with these variables.\n' +
    'See apps/web/.env.example for reference.\n\n' +
    'Find these values at: https://supabase.com/dashboard/project/_/settings/api'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type-safe client for server-side
export type SupabaseClient = typeof supabase
