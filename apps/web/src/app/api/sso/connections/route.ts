import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateSSOConnectionSchema = z.object({
  organizationId: z.string().uuid(),
  provider: z.enum(['saml', 'oidc', 'oauth']),
  displayName: z.string().min(1).max(255),
  domain: z.string().optional(),
  metadataUrl: z.string().url().optional(),
  metadataXml: z.string().optional(),
  entityId: z.string().optional(),
  ssoUrl: z.string().url().optional(),
  certificate: z.string().optional(),
  attributeMappings: z.record(z.string()).optional(),
  autoProvision: z.boolean().default(true),
  defaultRole: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
})

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    let query = supabase
      .from('sso_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: connections, error } = await query

    if (error) {
      console.error('Error fetching SSO connections:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Remove sensitive data from response
    const sanitized = connections.map((conn) => ({
      ...conn,
      metadata_xml: undefined,
      certificate: undefined,
    }))

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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
    const validated = CreateSSOConnectionSchema.parse(body)

    // Verify user is admin/owner of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', validated.organizationId)
      .eq('user_id', user.id)
      .single()

    if (
      memberError ||
      !membership ||
      !['owner', 'admin'].includes(membership.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { data: connection, error } = await supabase
      .from('sso_connections')
      .insert({
        organization_id: validated.organizationId,
        provider: validated.provider,
        display_name: validated.displayName,
        domain: validated.domain,
        metadata_url: validated.metadataUrl,
        metadata_xml: validated.metadataXml,
        entity_id: validated.entityId,
        sso_url: validated.ssoUrl,
        certificate: validated.certificate,
        attribute_mappings: validated.attributeMappings || {},
        auto_provision: validated.autoProvision,
        default_role: validated.defaultRole,
        is_active: false, // Start inactive, require explicit activation
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating SSO connection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Remove sensitive data from response
    const sanitized = {
      ...connection,
      metadata_xml: undefined,
      certificate: undefined,
    }

    return NextResponse.json(sanitized, { status: 201 })
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
