import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ProvisionDatabaseSchema = z.object({
  organizationId: z.string().uuid(),
  region: z.enum([
    'us-east-1',
    'us-west-2',
    'eu-west-1',
    'eu-central-1',
    'ap-southeast-1',
    'ap-northeast-1',
  ]),
  instanceType: z.enum(['small', 'medium', 'large', 'xlarge']),
  storageGb: z.number().int().min(10).max(1000).default(50),
  backupEnabled: z.boolean().default(true),
})

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    let query = supabase
      .from('dedicated_databases')
      .select(
        `
        *,
        organizations (name, slug)
      `
      )
      .order('created_at', { ascending: false })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ databases: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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
    const validated = ProvisionDatabaseSchema.parse(body)

    // Check if user is org owner
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', validated.organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if org already has a dedicated database
    const { data: existing } = await supabase
      .from('dedicated_databases')
      .select('id')
      .eq('organization_id', validated.organizationId)
      .in('status', ['provisioning', 'active'])
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Organization already has an active database' },
        { status: 409 }
      )
    }

    // Generate connection string (placeholder - in production, this would trigger actual provisioning)
    const containerId = `db-${validated.organizationId.substring(0, 8)}-${Date.now()}`
    const connectionString = `postgresql://kontecst:${generatePassword()}@${containerId}.db.kontecst.internal:5432/kontecst`

    // Create database record
    const { data, error } = await supabase
      .from('dedicated_databases')
      .insert({
        organization_id: validated.organizationId,
        connection_string: connectionString,
        region: validated.region,
        instance_type: validated.instanceType,
        storage_gb: validated.storageGb,
        backup_enabled: validated.backupEnabled,
        status: 'provisioning',
        container_id: containerId,
      })
      .select()
      .single()

    if (error) throw error

    // TODO: In production, trigger actual Docker container provisioning
    // await provisionDockerDatabase(data.id, validated)

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generatePassword(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}
