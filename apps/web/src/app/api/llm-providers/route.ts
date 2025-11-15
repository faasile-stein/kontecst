import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - List available LLM providers for users
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch enabled providers (RLS policy will handle this)
    const { data: providers, error } = await supabase
      .from('llm_providers')
      .select('id, name, type, model_name, is_default, metadata')
      .eq('is_enabled', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) throw error

    // Get user's current preference
    const { data: preference } = await supabase
      .from('user_llm_preferences')
      .select('llm_provider_id')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      providers,
      selectedProviderId: preference?.llm_provider_id || null,
    })
  } catch (error: any) {
    console.error('Error fetching LLM providers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
