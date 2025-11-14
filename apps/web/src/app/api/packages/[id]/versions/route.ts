import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateVersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be valid semver (e.g., 1.0.0)'),
  description: z.string().optional(),
  changelog: z.string().optional(),
  copyFromVersion: z.string().optional(), // Version number to copy files from
})

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

    const { data, error } = await supabase
      .from('package_versions')
      .select('*')
      .eq('package_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ versions: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
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

    // Check if user owns the package
    const { data: pkg } = await supabase
      .from('packages')
      .select('owner_id')
      .eq('id', params.id)
      .single()

    if (!pkg || pkg.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validated = CreateVersionSchema.parse(body)

    // Check if version already exists
    const { data: existing } = await supabase
      .from('package_versions')
      .select('id')
      .eq('package_id', params.id)
      .eq('version', validated.version)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This version already exists' },
        { status: 409 }
      )
    }

    // Create the version
    const { data, error } = await supabase
      .from('package_versions')
      .insert({
        package_id: params.id,
        version: validated.version,
        description: validated.description,
        changelog: validated.changelog,
      })
      .select()
      .single()

    if (error) throw error

    // Copy files from previous version if requested
    if (validated.copyFromVersion && data) {
      const { data: previousVersion } = await supabase
        .from('package_versions')
        .select('id')
        .eq('package_id', params.id)
        .eq('version', validated.copyFromVersion)
        .single()

      if (previousVersion) {
        // Get all files from the previous version
        const { data: filesToCopy } = await supabase
          .from('files')
          .select('filename, path, content, content_hash, size_bytes, mime_type, storage_path')
          .eq('package_version_id', previousVersion.id)

        if (filesToCopy && filesToCopy.length > 0) {
          // Copy files to the new version
          const newFiles = filesToCopy.map((file) => ({
            ...file,
            package_version_id: data.id,
          }))

          const { error: copyError } = await supabase
            .from('files')
            .insert(newFiles)

          if (copyError) {
            console.error('Error copying files:', copyError)
          } else {
            // Update version stats
            const totalSize = filesToCopy.reduce((sum, f) => sum + f.size_bytes, 0)
            await supabase.rpc('increment_version_stats', {
              version_id: data.id,
              file_count: filesToCopy.length,
              size_bytes: totalSize,
            })
          }
        }
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
