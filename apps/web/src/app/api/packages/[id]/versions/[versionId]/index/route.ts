import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const supabase = await createClient()

    // Get package information
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('id, name, slug, visibility')
      .eq('id', params.id)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Get version information
    const { data: version, error: versionError } = await supabase
      .from('package_versions')
      .select('id, version, description, is_published')
      .eq('id', params.versionId)
      .eq('package_id', params.id)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Get files for this version
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, filename, path, size_bytes, token_count')
      .eq('package_version_id', params.versionId)
      .order('path', { ascending: true })

    if (filesError) {
      console.error('Error fetching files:', filesError)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    // Construct base URL
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

    // Determine the base URL based on visibility
    const baseUrl = pkg.visibility === 'public'
      ? `${protocol}://${host}/marketplace/${pkg.slug}`
      : `${protocol}://${host}/dashboard/packages/${pkg.id}/versions/${version.version}`

    // Generate index.md content
    const indexContent = generateIndexMarkdown(
      pkg,
      version,
      files || [],
      baseUrl
    )

    // Return as downloadable markdown file
    return new NextResponse(indexContent, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${pkg.slug}-v${version.version}-index.md"`,
      },
    })
  } catch (error) {
    console.error('Error generating index:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateIndexMarkdown(
  pkg: { name: string; slug: string; visibility: string },
  version: { version: string; description?: string },
  files: Array<{
    filename: string
    path: string
    size_bytes: number
    token_count?: number
  }>,
  baseUrl: string
): string {
  const lines: string[] = []

  // Header
  lines.push(`# ${pkg.name} - v${version.version}`)
  lines.push('')

  if (version.description) {
    lines.push(version.description)
    lines.push('')
  }

  // Package info
  lines.push(`**Package:** ${pkg.slug}`)
  lines.push(`**Version:** ${version.version}`)
  lines.push(`**Visibility:** ${pkg.visibility}`)
  lines.push(`**Total Files:** ${files.length}`)
  lines.push('')

  // Public package link
  if (pkg.visibility === 'public') {
    lines.push(`**Public Link:** [${baseUrl}](${baseUrl})`)
    lines.push('')
  }

  // Files section
  lines.push('## Files')
  lines.push('')

  if (files.length === 0) {
    lines.push('*No files in this version*')
  } else {
    // Group files by directory
    const filesByDir = new Map<string, typeof files>()

    files.forEach((file) => {
      const dir = file.path.includes('/')
        ? file.path.substring(0, file.path.lastIndexOf('/'))
        : '.'

      if (!filesByDir.has(dir)) {
        filesByDir.set(dir, [])
      }
      filesByDir.get(dir)!.push(file)
    })

    // Sort directories
    const sortedDirs = Array.from(filesByDir.keys()).sort()

    sortedDirs.forEach((dir) => {
      const dirFiles = filesByDir.get(dir)!

      lines.push(`### ${dir === '.' ? 'Root' : dir}`)
      lines.push('')

      dirFiles.forEach((file) => {
        const fileLink = `${baseUrl}#${encodeURIComponent(file.path)}`
        const sizeKB = (file.size_bytes / 1024).toFixed(1)
        const tokens = file.token_count ? ` (~${file.token_count.toLocaleString()} tokens)` : ''

        lines.push(`- **[${file.filename}](${fileLink})**`)
        lines.push(`  - Path: \`${file.path}\``)
        lines.push(`  - Size: ${sizeKB} KB${tokens}`)
      })

      lines.push('')
    })
  }

  // Footer
  lines.push('---')
  lines.push('')
  lines.push(`*Generated on ${new Date().toISOString()}*`)
  lines.push('')

  return lines.join('\n')
}
