'use client'

import { useEffect, useState } from 'react'
import { Shield, Clock, User, Package, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuditEvent {
  id: string
  event_type: string
  actor_email: string
  resource_type?: string
  resource_name?: string
  changes?: any
  metadata?: any
  ip_address?: string
  created_at: string
}

const eventIcons: Record<string, any> = {
  package_created: Package,
  package_updated: Package,
  package_deleted: Package,
  user_invited: User,
  user_removed: User,
  role_changed: Shield,
  settings_updated: AlertCircle,
}

const eventColors: Record<string, string> = {
  package_created: 'text-green-600 bg-green-50',
  package_updated: 'text-blue-600 bg-blue-50',
  package_deleted: 'text-red-600 bg-red-50',
  user_invited: 'text-purple-600 bg-purple-50',
  user_removed: 'text-red-600 bg-red-50',
  role_changed: 'text-orange-600 bg-orange-50',
  settings_updated: 'text-gray-600 bg-gray-50',
}

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('7d')

  useEffect(() => {
    fetchAuditLogs()
  }, [filter, dateRange])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('eventType', filter)

      const response = await fetch(`/api/audit?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch audit logs')

      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEventType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track all actions and changes in your organization
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm"
          >
            <option value="all">All Events</option>
            <option value="package_created">Package Created</option>
            <option value="package_updated">Package Updated</option>
            <option value="package_deleted">Package Deleted</option>
            <option value="user_invited">User Invited</option>
            <option value="user_removed">User Removed</option>
            <option value="role_changed">Role Changed</option>
            <option value="settings_updated">Settings Updated</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <Button variant="secondary" onClick={fetchAuditLogs}>
          Refresh
        </Button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-gray-500">Loading audit events...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="divide-y">
            {events.map((event) => {
              const Icon = eventIcons[event.event_type] || Clock
              const colorClass = eventColors[event.event_type] || 'text-gray-600 bg-gray-50'

              return (
                <div key={event.id} className="px-6 py-4">
                  <div className="flex items-start space-x-4">
                    <div className={`rounded-lg p-2 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {formatEventType(event.event_type)}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">{event.actor_email}</span>
                          {event.resource_name && (
                            <>
                              {' '}
                              {event.event_type.includes('created')
                                ? 'created'
                                : event.event_type.includes('updated')
                                ? 'updated'
                                : event.event_type.includes('deleted')
                                ? 'deleted'
                                : 'modified'}{' '}
                              <span className="font-medium">{event.resource_name}</span>
                            </>
                          )}
                        </p>
                        {event.ip_address && (
                          <p className="text-xs text-gray-500">
                            IP: {event.ip_address}
                          </p>
                        )}
                        {event.changes && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                              View changes
                            </summary>
                            <pre className="mt-2 rounded bg-gray-50 p-2 text-xs">
                              {JSON.stringify(event.changes, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No audit events</h3>
          <p className="mt-2 text-sm text-gray-500">
            Audit events will appear here as actions are performed
          </p>
        </div>
      )}
    </div>
  )
}
