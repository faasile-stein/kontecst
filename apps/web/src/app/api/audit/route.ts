import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const AuditQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  actorId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
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
    const params = {
      organizationId: searchParams.get('organizationId') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      actorId: searchParams.get('actorId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const validated = AuditQuerySchema.parse(params)

    // Build query
    let query = supabase
      .from('audit_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(validated.offset, validated.offset + validated.limit - 1)

    if (validated.organizationId) {
      query = query.eq('organization_id', validated.organizationId)
    }

    if (validated.eventType) {
      query = query.eq('event_type', validated.eventType)
    }

    if (validated.actorId) {
      query = query.eq('actor_id', validated.actorId)
    }

    if (validated.startDate) {
      query = query.gte('created_at', validated.startDate)
    }

    if (validated.endDate) {
      query = query.lte('created_at', validated.endDate)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      events: data,
      total: count,
      limit: validated.limit,
      offset: validated.offset,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Audit log error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Log a new audit event
const LogEventSchema = z.object({
  eventType: z.string(),
  organizationId: z.string().uuid().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  resourceName: z.string().optional(),
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

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
    const validated = LogEventSchema.parse(body)

    // Get IP and user agent from request
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip') ||
                null
    const userAgent = request.headers.get('user-agent') || null

    // Call the log_audit_event function
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_event_type: validated.eventType,
      p_actor_id: user.id,
      p_organization_id: validated.organizationId || null,
      p_resource_type: validated.resourceType || null,
      p_resource_id: validated.resourceId || null,
      p_resource_name: validated.resourceName || null,
      p_changes: validated.changes || null,
      p_metadata: validated.metadata || null,
      p_ip_address: ip,
      p_user_agent: userAgent,
    })

    if (error) throw error

    return NextResponse.json({ id: data }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Audit event error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
