import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { slug: string; versionId: string } }
) {
  try {
    const supabase = await createClient()

    // Verify package is public
    const { data: pkg } = await supabase
      .from('packages')
      .select('id')
      .eq('slug', params.slug)
      .eq('visibility', 'public')
      .single()

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Verify version belongs to this package and is published
    const { data: version } = await supabase
      .from('package_versions')
      .select('id')
      .eq('id', params.versionId)
      .eq('package_id', pkg.id)
      .eq('is_published', true)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Get files for this version
    const { data: files, error } = await supabase
      .from('files')
      .select('id, filename, path, content, size_bytes')
      .eq('package_version_id', params.versionId)
      .order('path', { ascending: true })

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    return NextResponse.json(files || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
