import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const packageVersionId = formData.get('packageVersionId') as string
    const path = formData.get('path') as string

    if (!file || !packageVersionId || !path) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.match(/\.(md|markdown)$/i)) {
      return NextResponse.json(
        { error: 'Only Markdown files (.md, .markdown) are allowed' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      )
    }

    // Get package version info
    const { data: version } = await supabase
      .from('package_versions')
      .select('package_id, version, is_locked, packages(owner_id, slug)')
      .eq('id', packageVersionId)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Package version not found' }, { status: 404 })
    }

    // Check if version is locked
    if (version.is_locked) {
      return NextResponse.json(
        { error: 'Cannot upload files to a locked version' },
        { status: 403 }
      )
    }

    // Check if user owns the package
    const packageData = version.packages as any
    if (packageData.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Read file content and calculate hash
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const content = buffer.toString('utf-8')
    const contentHash = createHash('sha256').update(buffer).digest('hex')

    // Upload to file proxy service
    const proxyFormData = new FormData()
    proxyFormData.append('file', file)
    proxyFormData.append('packageId', version.package_id)
    proxyFormData.append('version', version.version)
    proxyFormData.append('filename', file.name)

    const fileProxyUrl = process.env.NEXT_PUBLIC_FILE_PROXY_URL || 'http://localhost:3001'

    // For now, we'll store files locally in the proxy
    // In production, you'd get an auth token and upload to the proxy service
    const storagePath = `${packageData.slug}/${version.version}/${path}`

    // Store file metadata and content in database
    const { data, error } = await supabase
      .from('files')
      .insert({
        package_version_id: packageVersionId,
        filename: file.name,
        path: path,
        content: content,
        content_hash: contentHash,
        size_bytes: file.size,
        mime_type: file.type || 'text/markdown',
        storage_path: storagePath,
      })
      .select()
      .single()

    if (error) throw error

    // Update package version file count and size
    const { error: statsError } = await supabase.rpc('increment_version_stats', {
      version_id: packageVersionId,
      file_count: 1,
      size_bytes: file.size,
    })

    if (statsError) {
      console.error('Failed to update version stats:', statsError)
      // Note: With the new trigger-based system, this RPC call is redundant
      // but kept for backward compatibility
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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
    const packageVersionId = searchParams.get('packageVersionId')

    if (!packageVersionId) {
      return NextResponse.json(
        { error: 'packageVersionId is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('package_version_id', packageVersionId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ files: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
