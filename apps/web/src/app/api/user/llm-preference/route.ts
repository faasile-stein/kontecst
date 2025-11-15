import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST - Set user's LLM provider preference
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { providerId } = body

    if (!providerId) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    // Verify provider exists and is enabled
    const { data: provider, error: providerError } = await supabase
      .from('llm_providers')
      .select('id')
      .eq('id', providerId)
      .eq('is_enabled', true)
      .single()

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Invalid or disabled provider' }, { status: 400 })
    }

    // Upsert user preference
    const { data, error } = await supabase
      .from('user_llm_preferences')
      .upsert(
        {
          user_id: user.id,
          llm_provider_id: providerId,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ preference: data })
  } catch (error: any) {
    console.error('Error setting LLM preference:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove user's LLM provider preference (revert to default)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user preference
    const { error } = await supabase
      .from('user_llm_preferences')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting LLM preference:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
