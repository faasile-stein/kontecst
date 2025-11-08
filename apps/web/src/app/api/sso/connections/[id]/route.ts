import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateSSOConnectionSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  domain: z.string().optional(),
  metadataUrl: z.string().url().optional(),
  metadataXml: z.string().optional(),
  entityId: z.string().optional(),
  ssoUrl: z.string().url().optional(),
  certificate: z.string().optional(),
  attributeMappings: z.record(z.string()).optional(),
  autoProvision: z.boolean().optional(),
  defaultRole: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connection, error } = await supabase
      .from('sso_connections')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !connection) {
      return NextResponse.json(
        { error: 'SSO connection not found' },
        { status: 404 }
      )
    }

    // Verify user has access to the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', connection.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Remove sensitive data unless user is admin/owner
    const sanitized = ['owner', 'admin'].includes(membership.role)
      ? connection
      : {
          ...connection,
          metadata_xml: undefined,
          certificate: undefined,
        }

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = UpdateSSOConnectionSchema.parse(body)

    // Verify ownership
    const { data: connection, error: fetchError } = await supabase
      .from('sso_connections')
      .select('organization_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'SSO connection not found' },
        { status: 404 }
      )
    }

    // Verify user is admin/owner
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', connection.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { data: updated, error } = await supabase
      .from('sso_connections')
      .update({
        display_name: validated.displayName,
        domain: validated.domain,
        metadata_url: validated.metadataUrl,
        metadata_xml: validated.metadataXml,
        entity_id: validated.entityId,
        sso_url: validated.ssoUrl,
        certificate: validated.certificate,
        attribute_mappings: validated.attributeMappings,
        auto_provision: validated.autoProvision,
        default_role: validated.defaultRole,
        is_active: validated.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating SSO connection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Remove sensitive data from response
    const sanitized = {
      ...updated,
      metadata_xml: undefined,
      certificate: undefined,
    }

    return NextResponse.json(sanitized)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: connection, error: fetchError } = await supabase
      .from('sso_connections')
      .select('organization_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'SSO connection not found' },
        { status: 404 }
      )
    }

    // Verify user is admin/owner
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', connection.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('sso_connections')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting SSO connection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
