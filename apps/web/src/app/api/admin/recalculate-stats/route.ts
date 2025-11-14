import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * Admin endpoint to recalculate file counts and sizes for all package versions
 * This helps fix any discrepancies in version stats
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all package versions for the current user
    const { data: packages } = await supabase
      .from('packages')
      .select('id')
      .eq('owner_id', user.id)

    if (!packages || packages.length === 0) {
      return NextResponse.json({
        message: 'No packages found for user',
        updated: 0,
      })
    }

    const packageIds = packages.map((p) => p.id)

    // Get all versions for user's packages
    const { data: versions } = await supabase
      .from('package_versions')
      .select('id')
      .in('package_id', packageIds)

    if (!versions || versions.length === 0) {
      return NextResponse.json({
        message: 'No versions found',
        updated: 0,
      })
    }

    // Recalculate stats for each version
    let updatedCount = 0
    const errors: string[] = []

    for (const version of versions) {
      const { error } = await supabase.rpc('recalculate_version_stats', {
        version_id: version.id,
      })

      if (error) {
        errors.push(`Failed to update version ${version.id}: ${error.message}`)
      } else {
        updatedCount++
      }
    }

    return NextResponse.json({
      message: 'Stats recalculation complete',
      total: versions.length,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Recalculate stats error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
