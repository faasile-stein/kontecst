import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateReviewSchema = z.object({
  packageVersionId: z.string().uuid(),
  decision: z.enum(['approve', 'reject', 'request_changes']),
  comment: z.string().optional(),
  filesReviewed: z.array(z.string()).optional(),
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
    const versionId = searchParams.get('versionId')

    let query = supabase
      .from('package_version_reviews')
      .select(
        `
        *,
        profiles!package_version_reviews_reviewer_id_fkey(id, full_name, email)
      `
      )
      .order('created_at', { ascending: false })

    if (versionId) {
      query = query.eq('package_version_id', versionId)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(reviews)
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
    const validated = CreateReviewSchema.parse(body)

    // Verify user has access to review this version
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

    // Check approval settings
    const { data: settings } = await supabase
      .from('package_approval_settings')
      .select('*')
      .eq('package_id', version.package_id)
      .single()

    // Check if self-approval is allowed
    if (
      settings &&
      !settings.allow_self_approval &&
      version.packages.owner_id === user.id
    ) {
      return NextResponse.json(
        { error: 'Self-approval is not allowed for this package' },
        { status: 403 }
      )
    }

    // Upsert review (update if exists, insert if not)
    const { data: review, error } = await supabase
      .from('package_version_reviews')
      .upsert(
        {
          package_version_id: validated.packageVersionId,
          reviewer_id: user.id,
          decision: validated.decision,
          comment: validated.comment,
          files_reviewed: validated.filesReviewed || [],
        },
        {
          onConflict: 'package_version_id,reviewer_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(review, { status: 201 })
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
