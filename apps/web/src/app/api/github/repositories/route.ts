import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateRepositorySchema = z.object({
  githubConnectionId: z.string().uuid(),
  packageId: z.string().uuid().optional(),
  repoId: z.number(),
  repoName: z.string(),
  repoFullName: z.string(),
  repoOwner: z.string(),
  defaultBranch: z.string().default('main'),
  isPrivate: z.boolean().default(false),
  syncPath: z.string().default('/'),
  syncBranch: z.string().optional(),
  autoPublish: z.boolean().default(false),
})

const UpdateRepositorySchema = z.object({
  syncEnabled: z.boolean().optional(),
  syncPath: z.string().optional(),
  syncBranch: z.string().optional(),
  autoPublish: z.boolean().optional(),
  packageId: z.string().uuid().optional(),
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
    const connectionId = searchParams.get('connectionId')

    let query = supabase
      .from('github_repositories')
      .select(
        `
        *,
        github_connections!inner(user_id),
        packages(id, name, slug)
      `
      )
      .eq('github_connections.user_id', user.id)

    if (connectionId) {
      query = query.eq('github_connection_id', connectionId)
    }

    const { data: repositories, error } = await query.order('created_at', {
      ascending: false,
    })

    if (error) {
      console.error('Error fetching GitHub repositories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(repositories)
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
    const validated = CreateRepositorySchema.parse(body)

    // Verify connection ownership
    const { data: connection, error: connError } = await supabase
      .from('github_connections')
      .select('*')
      .eq('id', validated.githubConnectionId)
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'GitHub connection not found' },
        { status: 404 }
      )
    }

    const { data: repository, error } = await supabase
      .from('github_repositories')
      .insert({
        github_connection_id: validated.githubConnectionId,
        package_id: validated.packageId,
        repo_id: validated.repoId,
        repo_name: validated.repoName,
        repo_full_name: validated.repoFullName,
        repo_owner: validated.repoOwner,
        default_branch: validated.defaultBranch,
        is_private: validated.isPrivate,
        sync_path: validated.syncPath,
        sync_branch: validated.syncBranch,
        auto_publish: validated.autoPublish,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating GitHub repository:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(repository, { status: 201 })
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
