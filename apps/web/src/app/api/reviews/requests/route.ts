import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateReviewRequestSchema = z.object({
  packageVersionId: z.string().uuid(),
  message: z.string().optional(),
  assignedReviewers: z.array(z.string().uuid()).optional(),
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
    const status = searchParams.get('status')
    const packageId = searchParams.get('packageId')

    let query = supabase
      .from('review_requests')
      .select(
        `
        *,
        package_versions!inner(
          id,
          version,
          packages!inner(id, name, slug)
        ),
        profiles!review_requests_requester_id_fkey(id, full_name, email)
      `
      )
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (packageId) {
      query = query.eq('package_versions.packages.id', packageId)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching review requests:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(requests)
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
    const validated = CreateReviewRequestSchema.parse(body)

    // Verify user has access to the package version
    const { data: version, error: versionError } = await supabase
      .from('package_versions')
      .select('*, packages!inner(*)')
      .eq('id', validated.packageVersionId)
      .single()

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Package version not found' },
        { status: 404 }
      )
    }

    // Check if already has a review request
    const { data: existing } = await supabase
      .from('review_requests')
      .select('id')
      .eq('package_version_id', validated.packageVersionId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Review request already exists for this version' },
        { status: 409 }
      )
    }

    const { data: reviewRequest, error } = await supabase
      .from('review_requests')
      .insert({
        package_version_id: validated.packageVersionId,
        requester_id: user.id,
        message: validated.message,
        assigned_reviewers: validated.assignedReviewers || [],
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating review request:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(reviewRequest, { status: 201 })
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
