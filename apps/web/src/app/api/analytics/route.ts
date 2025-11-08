import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d

    const now = new Date()
    const daysAgo = period === '30d' ? 30 : period === '90d' ? 90 : 7
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    // Get package stats
    const { data: packageStats } = await supabase
      .from('packages')
      .select('id, visibility, created_at')
      .eq('owner_id', user.id)

    const totalPackages = packageStats?.length || 0
    const publicPackages =
      packageStats?.filter((p) => p.visibility === 'public').length || 0
    const privatePackages =
      packageStats?.filter((p) => p.visibility === 'private').length || 0

    // Get file stats
    const { count: totalFiles } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .in(
        'package_version_id',
        packageStats?.map((p) => p.id) || []
      )

    // Get access logs for the period
    const { data: accessLogs, count: totalRequests } = await supabase
      .from('access_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    // Calculate request trends (group by day)
    const requestsByDay: { [key: string]: number } = {}
    accessLogs?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      requestsByDay[date] = (requestsByDay[date] || 0) + 1
    })

    // Get search stats
    const searchLogs = accessLogs?.filter((log) => log.path.includes('/search')) || []
    const totalSearches = searchLogs.length

    // Calculate average response time
    const avgResponseTime =
      accessLogs && accessLogs.length > 0
        ? accessLogs.reduce((sum, log) => sum + log.duration_ms, 0) / accessLogs.length
        : 0

    // Get top accessed packages
    const packageAccess: { [key: string]: number } = {}
    accessLogs?.forEach((log) => {
      const match = log.path.match(/\/packages\/([^/]+)/)
      if (match) {
        const packageId = match[1]
        packageAccess[packageId] = (packageAccess[packageId] || 0) + 1
      }
    })

    const topPackages = Object.entries(packageAccess)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([packageId, count]) => ({
        packageId,
        requests: count,
      }))

    return NextResponse.json({
      overview: {
        totalPackages,
        publicPackages,
        privatePackages,
        totalFiles: totalFiles || 0,
        totalRequests: totalRequests || 0,
        totalSearches,
        avgResponseTime: Math.round(avgResponseTime),
      },
      trends: {
        requestsByDay: Object.entries(requestsByDay).map(([date, count]) => ({
          date,
          requests: count,
        })),
      },
      topPackages,
      period,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
