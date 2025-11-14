import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    // Check if user owns the package
    const { data: pkg } = await supabase
      .from('packages')
      .select('owner_id')
      .eq('id', params.id)
      .single()

    if (!pkg || pkg.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Recalculate stats
    const { error } = await supabase.rpc('recalculate_version_stats', {
      version_id: params.versionId,
    })

    if (error) throw error

    // Get updated version
    const { data: version } = await supabase
      .from('package_versions')
      .select('*')
      .eq('id', params.versionId)
      .single()

    return NextResponse.json(version)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
