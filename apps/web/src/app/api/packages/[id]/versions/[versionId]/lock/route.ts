import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { compareVersionFiles, generateChangelog } from '@/lib/services/changelog-generator'

export async function POST(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current version info
    const { data: currentVersion } = await supabase
      .from('package_versions')
      .select('version, package_id')
      .eq('id', params.versionId)
      .single()

    if (!currentVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Get previous version
    const { data: previousVersions } = await supabase
      .from('package_versions')
      .select('id, version')
      .eq('package_id', currentVersion.package_id)
      .lt('version', currentVersion.version)
      .order('version', { ascending: false })
      .limit(1)

    const previousVersionId = previousVersions?.[0]?.id || null

    // Compare files and generate changelog
    let generatedChangelog = ''
    try {
      const changes = await compareVersionFiles(
        params.versionId,
        previousVersionId,
        supabase
      )
      generatedChangelog = await generateChangelog(changes)
    } catch (changelogError) {
      console.error('Error generating changelog:', changelogError)
      // Continue with locking even if changelog generation fails
      generatedChangelog = 'Changelog generation failed. Please update manually.'
    }

    // Update the changelog before locking
    await supabase
      .from('package_versions')
      .update({ changelog: generatedChangelog })
      .eq('id', params.versionId)

    // Lock the version
    const { data, error } = await supabase.rpc('lock_version', {
      version_id: params.versionId,
      user_id: user.id,
    })

    if (error) {
      if (error.message.includes('already locked')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Unlock the version
    const { data, error } = await supabase.rpc('unlock_version', {
      version_id: params.versionId,
      user_id: user.id,
    })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
