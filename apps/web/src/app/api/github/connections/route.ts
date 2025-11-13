import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { encrypt } from '@/lib/crypto'

const CreateConnectionSchema = z.object({
  installationId: z.number(),
  installationType: z.enum(['user', 'organization']),
  accountLogin: z.string(),
  accountId: z.number(),
  accountAvatarUrl: z.string().optional(),
  accessToken: z.string(),
  permissions: z.record(z.any()).optional(),
  repositorySelection: z.string().optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connections, error } = await supabase
      .from('github_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching GitHub connections:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(connections)
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
    const validated = CreateConnectionSchema.parse(body)

    // Encrypt access token before storing using AES-256-GCM
    const accessTokenEncrypted = encrypt(validated.accessToken)

    const { data: connection, error } = await supabase
      .from('github_connections')
      .insert({
        user_id: user.id,
        installation_id: validated.installationId,
        installation_type: validated.installationType,
        account_login: validated.accountLogin,
        account_id: validated.accountId,
        account_avatar_url: validated.accountAvatarUrl,
        access_token_encrypted: accessTokenEncrypted,
        permissions: validated.permissions || {},
        repository_selection: validated.repositorySelection || 'all',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating GitHub connection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(connection, { status: 201 })
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
