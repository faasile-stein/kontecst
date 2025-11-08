'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/analytics/stat-card'
import { Package, FileText, Search, Activity, TrendingUp, Clock } from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalPackages: number
    publicPackages: number
    privatePackages: number
    totalFiles: number
    totalRequests: number
    totalSearches: number
    avgResponseTime: number
  }
  trends: {
    requestsByDay: { date: string; requests: number }[]
  }
  topPackages: { packageId: string; requests: number }[]
  period: string
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading analytics...</div>
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">No analytics data available</p>
        </div>
      </div>
    )
  }

  const maxRequests = Math.max(...data.trends.requestsByDay.map((d) => d.requests), 1)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor your package usage and performance
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Packages"
          value={data.overview.totalPackages}
          icon={Package}
          description={`${data.overview.publicPackages} public, ${data.overview.privatePackages} private`}
        />
        <StatCard
          title="Total Files"
          value={data.overview.totalFiles}
          icon={FileText}
        />
        <StatCard
          title="API Requests"
          value={data.overview.totalRequests}
          icon={Activity}
        />
        <StatCard
          title="Searches"
          value={data.overview.totalSearches}
          icon={Search}
        />
      </div>

      {/* Performance */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.overview.avgResponseTime}ms
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Request Trend</p>
              <p className="text-2xl font-bold text-green-600">Steady</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Trends Chart */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Request Trends</h2>
        <div className="mt-6">
          <div className="flex items-end space-x-2" style={{ height: '200px' }}>
            {data.trends.requestsByDay.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center">
                <div className="w-full flex-1">
                  <div className="flex h-full items-end">
                    <div
                      className="w-full rounded-t bg-primary"
                      style={{
                        height: `${(day.requests / maxRequests) * 100}%`,
                        minHeight: day.requests > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs font-medium text-gray-900">{day.requests}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Packages */}
      {data.topPackages.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Accessed Packages</h2>
          </div>
          <div className="divide-y">
            {data.topPackages.map((pkg, index) => (
              <div key={pkg.packageId} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Package {pkg.packageId}</p>
                    <p className="text-sm text-gray-500">{pkg.requests} requests</p>
                  </div>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(pkg.requests / data.topPackages[0].requests) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
