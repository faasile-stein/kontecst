import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateRepositorySchema = z.object({
  syncEnabled: z.boolean().optional(),
  syncPath: z.string().optional(),
  syncBranch: z.string().optional(),
  autoPublish: z.boolean().optional(),
  packageId: z.string().uuid().optional(),
})

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
    const validated = UpdateRepositorySchema.parse(body)

    // Verify ownership through connection
    const { data: repo, error: fetchError } = await supabase
      .from('github_repositories')
      .select('*, github_connections!inner(user_id)')
      .eq('id', params.id)
      .single()

    if (fetchError || !repo || repo.github_connections.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    const { data: updated, error } = await supabase
      .from('github_repositories')
      .update({
        sync_enabled: validated.syncEnabled,
        sync_path: validated.syncPath,
        sync_branch: validated.syncBranch,
        auto_publish: validated.autoPublish,
        package_id: validated.packageId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating GitHub repository:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updated)
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

    // Verify ownership through connection
    const { data: repo, error: fetchError } = await supabase
      .from('github_repositories')
      .select('*, github_connections!inner(user_id)')
      .eq('id', params.id)
      .single()

    if (fetchError || !repo || repo.github_connections.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('github_repositories')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting GitHub repository:', error)
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
