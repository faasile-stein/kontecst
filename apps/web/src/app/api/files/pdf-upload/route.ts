import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { processPdfToMarkdown } from '@/lib/services/pdf-processor'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB for PDFs

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
    const purpose = formData.get('purpose') as string

    if (!file || !packageVersionId || !path || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: file, packageVersionId, path, and purpose are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.match(/\.pdf$/i)) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
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
      .select('package_id, version, packages(owner_id, slug)')
      .eq('id', packageVersionId)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Package version not found' }, { status: 404 })
    }

    // Check if user owns the package
    const packageData = version.packages as any
    if (packageData.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Process PDF: extract text, OCR if needed, and digest to markdown
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log(`Processing PDF: ${file.name} (${file.size} bytes)`)
    const { markdown, metadata } = await processPdfToMarkdown(buffer, purpose, user.id)
    console.log(`Generated markdown: ${markdown.length} characters`)

    // Ensure path ends with .md
    const mdPath = path.endsWith('.md') ? path : `${path}.md`

    // Create markdown content with metadata
    const markdownWithMetadata = `---
source: ${file.name}
purpose: ${purpose}
generated: ${new Date().toISOString()}
${metadata.title ? `title: ${metadata.title}` : ''}
${metadata.author ? `author: ${metadata.author}` : ''}
---

${markdown}`

    // Calculate hash
    const contentHash = createHash('sha256').update(markdownWithMetadata).digest('hex')

    // Storage path
    const storagePath = `${packageData.slug}/${version.version}/${mdPath}`

    // Store file metadata and content in database
    const { data, error } = await supabase
      .from('files')
      .insert({
        package_version_id: packageVersionId,
        filename: mdPath.split('/').pop() || mdPath,
        path: mdPath,
        content: markdownWithMetadata,
        content_hash: contentHash,
        size_bytes: Buffer.from(markdownWithMetadata).length,
        mime_type: 'text/markdown',
        storage_path: storagePath,
      })
      .select()
      .single()

    if (error) throw error

    // Update package version file count and size
    await supabase.rpc('increment_version_stats', {
      version_id: packageVersionId,
      file_count: 1,
      size_bytes: Buffer.from(markdownWithMetadata).length,
    })

    return NextResponse.json(
      {
        ...data,
        message: 'PDF processed successfully',
        originalFileName: file.name,
        markdownLength: markdown.length,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('PDF upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process PDF' },
      { status: 500 }
    )
  }
}
