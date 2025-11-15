import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdatePackageSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private', 'internal']).optional(),
  is_archived: z.boolean().optional(),
})

// Helper function to check if user can manage a package
async function canManagePackage(
  supabase: any,
  userId: string,
  pkg: { owner_id: string; organization_id: string | null }
): Promise<boolean> {
  // Owner can always manage
  if (pkg.owner_id === userId) {
    return true
  }

  // If package has no organization, only owner can manage
  if (!pkg.organization_id) {
    return false
  }

  // Check if user is a member of the package's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', pkg.organization_id)
    .eq('user_id', userId)
    .single()

  return !!membership
}

export async function GET(
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

    const { data, error } = await supabase
      .from('packages')
      .select(
        `
        *,
        package_versions (
          id,
          version,
          is_published,
          published_at,
          file_count,
          total_size_bytes,
          created_at
        )
      `
      )
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can manage the package
    const { data: pkg } = await supabase
      .from('packages')
      .select('owner_id, name, organization_id')
      .eq('id', params.id)
      .single()

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const canManage = await canManagePackage(supabase, user.id, pkg)
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validated = UpdatePackageSchema.parse(body)

    const { data, error } = await supabase
      .from('packages')
      .update(validated)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // Log audit event
    try {
      await supabase.rpc('log_audit_event', {
        p_event_type: 'package_updated',
        p_actor_id: user.id,
        p_organization_id: pkg.organization_id || null,
        p_resource_type: 'package',
        p_resource_id: params.id,
        p_resource_name: pkg.name,
        p_changes: { updates: validated },
        p_metadata: null,
        p_ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') || null,
        p_user_agent: request.headers.get('user-agent') || null,
      })
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can manage the package
    const { data: pkg } = await supabase
      .from('packages')
      .select('owner_id, name, organization_id')
      .eq('id', params.id)
      .single()

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const canManage = await canManagePackage(supabase, user.id, pkg)
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase.from('packages').delete().eq('id', params.id)

    if (error) throw error

    // Log audit event
    try {
      await supabase.rpc('log_audit_event', {
        p_event_type: 'package_deleted',
        p_actor_id: user.id,
        p_organization_id: pkg.organization_id || null,
        p_resource_type: 'package',
        p_resource_id: params.id,
        p_resource_name: pkg.name,
        p_changes: null,
        p_metadata: null,
        p_ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') || null,
        p_user_agent: request.headers.get('user-agent') || null,
      })
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError)
    }

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
