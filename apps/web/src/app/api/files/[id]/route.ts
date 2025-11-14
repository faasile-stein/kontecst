import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { encode } from 'gpt-3-encoder'

// Calculate token count from text content
function calculateTokenCount(text: string): number {
  try {
    const tokens = encode(text)
    return tokens.length
  } catch (error) {
    // Fallback to character-based estimation if encoding fails
    console.warn('Token encoding failed, using character estimation:', error)
    return Math.max(1, Math.floor(text.length / 4))
  }
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

    // Get file metadata
    const { data: file, error } = await supabase
      .from('files')
      .select(`
        *,
        package_versions(
          package_id,
          version,
          packages(owner_id, slug)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if user owns the package
    const version = file.package_versions as any
    const packageData = version.packages as any
    if (packageData.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // For now, we'll use the file content from storage
    // In production, you would fetch from the file proxy service
    // For this implementation, we'll store content directly in a new field
    return NextResponse.json({
      ...file,
      content: file.content || `# ${file.filename}\n\nEdit your markdown content here...`,
    })
  } catch (error: any) {
    console.error('File fetch error:', error)
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

    const body = await request.json()
    const { content } = body

    if (content === undefined) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get file metadata
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select(`
        *,
        package_versions(
          package_id,
          version,
          is_locked,
          packages(owner_id, slug)
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if version is locked
    const version = file.package_versions as any
    if (version.is_locked) {
      return NextResponse.json(
        { error: 'Cannot edit files in a locked version' },
        { status: 403 }
      )
    }

    // Check if user owns the package
    const packageData = version.packages as any
    if (packageData.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate new content hash, size, and token count
    const contentHash = createHash('sha256').update(content).digest('hex')
    const sizeBytes = Buffer.byteLength(content, 'utf8')
    const tokenCount = calculateTokenCount(content)

    // Update file metadata and content
    const { data, error } = await supabase
      .from('files')
      .update({
        content: content,
        content_hash: contentHash,
        size_bytes: sizeBytes,
        token_count: tokenCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('File update error:', error)
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

    // Get file metadata
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select(`
        *,
        package_versions(
          package_id,
          version,
          is_locked,
          packages(owner_id, slug)
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if version is locked
    const version = file.package_versions as any
    if (version.is_locked) {
      return NextResponse.json(
        { error: 'Cannot delete files from a locked version' },
        { status: 403 }
      )
    }

    // Check if user owns the package
    const packageData = version.packages as any
    if (packageData.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete file
    const { error } = await supabase.from('files').delete().eq('id', params.id)

    if (error) throw error

    // Update package version stats
    await supabase.rpc('increment_version_stats', {
      version_id: file.package_version_id,
      file_count: -1,
      size_bytes: -file.size_bytes,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('File delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
