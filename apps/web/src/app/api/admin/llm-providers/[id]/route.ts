import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// PATCH - Update LLM provider (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Build update object only with provided fields
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (type !== undefined) updates.type = type
    if (apiEndpoint !== undefined) updates.api_endpoint = apiEndpoint
    if (apiKey !== undefined) updates.api_key = apiKey || null
    if (modelName !== undefined) updates.model_name = modelName
    if (isDefault !== undefined) updates.is_default = isDefault
    if (isEnabled !== undefined) updates.is_enabled = isEnabled
    if (maxTokens !== undefined) updates.max_tokens = maxTokens
    if (temperature !== undefined) updates.temperature = temperature
    if (metadata !== undefined) updates.metadata = metadata

    // If setting as default, unset all other defaults first
    if (isDefault) {
      await supabase
        .from('llm_providers')
        .update({ is_default: false })
        .neq('id', params.id)
    }

    // Update the provider
    const { data, error } = await supabase
      .from('llm_providers')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ provider: data })
  } catch (error: any) {
    console.error('Error updating LLM provider:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete LLM provider (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if this is the default provider
    const { data: provider } = await supabase
      .from('llm_providers')
      .select('is_default')
      .eq('id', params.id)
      .single()

    if (provider?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default LLM provider. Set another provider as default first.' },
        { status: 400 }
      )
    }

    // Delete the provider
    const { error } = await supabase
      .from('llm_providers')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting LLM provider:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
