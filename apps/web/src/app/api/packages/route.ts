import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreatePackageSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private', 'internal']).default('private'),
  organization_id: z.string().uuid().optional(),
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
    const visibility = searchParams.get('visibility')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('packages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (visibility) {
      query = query.eq('visibility', visibility)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      packages: data,
      total: count,
      limit,
      offset,
    })
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
    const validated = CreatePackageSchema.parse(body)

    // Check if slug already exists for this user
    const { data: existing } = await supabase
      .from('packages')
      .select('id')
      .eq('owner_id', user.id)
      .eq('slug', validated.slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A package with this slug already exists' },
        { status: 409 }
      )
    }

    // Create the package
    const { data, error } = await supabase
      .from('packages')
      .insert({
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        visibility: validated.visibility,
        owner_id: user.id,
        organization_id: validated.organization_id || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
