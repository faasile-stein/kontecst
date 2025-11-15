import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - List all LLM providers (admin only)
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an organization owner (admin)
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .limit(1)

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch all LLM providers
    const { data: providers, error } = await supabase
      .from('llm_providers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ providers })
  } catch (error: any) {
    console.error('Error fetching LLM providers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new LLM provider (admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an organization owner (admin)
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .limit(1)

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, apiEndpoint, apiKey, modelName, isDefault, isEnabled, maxTokens, temperature, metadata } = body

    if (!name || !type || !apiEndpoint || !modelName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, apiEndpoint, modelName' },
        { status: 400 }
      )
    }

    // If setting as default, unset all other defaults first
    if (isDefault) {
      await supabase
        .from('llm_providers')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all
    }

    // Insert new provider
    const { data, error } = await supabase
      .from('llm_providers')
      .insert({
        name,
        type,
        api_endpoint: apiEndpoint,
        api_key: apiKey || null,
        model_name: modelName,
        is_default: isDefault || false,
        is_enabled: isEnabled !== false, // Default to true
        max_tokens: maxTokens || 4096,
        temperature: temperature !== undefined ? temperature : 0.3,
        metadata: metadata || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ provider: data }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating LLM provider:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
