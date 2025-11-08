import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { syncGitHubRepository } from '@/lib/services/github-sync'

export async function POST(
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
      .select(
        `
        *,
        github_connections!inner(
          user_id,
          access_token_encrypted,
          installation_id
        )
      `
      )
      .eq('id', params.id)
      .single()

    if (fetchError || !repo || repo.github_connections.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Check if already syncing
    if (repo.last_sync_status === 'syncing') {
      return NextResponse.json(
        { error: 'Sync already in progress' },
        { status: 409 }
      )
    }

    // Trigger sync (returns sync history ID)
    const { data: syncId, error: triggerError } = await supabase.rpc(
      'trigger_github_sync',
      {
        p_repository_id: params.id,
      }
    )

    if (triggerError) {
      console.error('Error triggering sync:', triggerError)
      return NextResponse.json(
        { error: triggerError.message },
        { status: 500 }
      )
    }

    // Start async sync process
    // In production, this should be a background job/queue
    syncGitHubRepository(params.id, syncId).catch((error) => {
      console.error('Background sync error:', error)
    })

    return NextResponse.json({
      syncId,
      status: 'syncing',
      message: 'Sync started successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
