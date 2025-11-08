'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Database, Server, Globe, Shield, Plus, Activity } from 'lucide-react'

interface DedicatedDatabase {
  id: string
  organization_id: string
  connection_string: string
  region: string
  status: string
  instance_type: string
  storage_gb: number
  backup_enabled: boolean
  container_id: string | null
  created_at: string
  organizations: {
    name: string
    slug: string
  }
}

const regionNames: Record<string, string> = {
  'us-east-1': 'US East (N. Virginia)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'EU West (Ireland)',
  'eu-central-1': 'EU Central (Frankfurt)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
}

const instanceSizes: Record<string, { cpu: string; memory: string; price: string }> = {
  small: { cpu: '2 vCPU', memory: '4 GB', price: '$99/mo' },
  medium: { cpu: '4 vCPU', memory: '8 GB', price: '$199/mo' },
  large: { cpu: '8 vCPU', memory: '16 GB', price: '$399/mo' },
  xlarge: { cpu: '16 vCPU', memory: '32 GB', price: '$799/mo' },
}

export default function AdminPage() {
  const [databases, setDatabases] = useState<DedicatedDatabase[]>([])
  const [loading, setLoading] = useState(true)
  const [showProvisionModal, setShowProvisionModal] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string>('us-east-1')
  const [selectedInstanceType, setSelectedInstanceType] = useState<string>('small')
  const [storageGb, setStorageGb] = useState<number>(50)
  const [organizationId, setOrganizationId] = useState<string>('')

  useEffect(() => {
    fetchDatabases()
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (!response.ok) throw new Error('Failed to fetch organizations')

      const data = await response.json()
      if (data.organizations && data.organizations.length > 0) {
        setOrganizationId(data.organizations[0].organizations.id)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchDatabases = async () => {
    try {
      const response = await fetch('/api/dedicated-databases')
      if (!response.ok) throw new Error('Failed to fetch databases')

      const data = await response.json()
      setDatabases(data.databases || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProvision = async () => {
    if (!organizationId) {
      alert('Please create an organization first')
      return
    }

    try {
      const response = await fetch('/api/dedicated-databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          region: selectedRegion,
          instanceType: selectedInstanceType,
          storageGb,
          backupEnabled: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to provision database')
      }

      setShowProvisionModal(false)
      await fetchDatabases()
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Admin</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage dedicated databases and enterprise features
          </p>
        </div>
        <Button onClick={() => setShowProvisionModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Provision Database
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Databases</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {databases.filter((db) => db.status === 'active').length}
              </p>
            </div>
            <Database className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Storage</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {databases.reduce((sum, db) => sum + db.storage_gb, 0)} GB
              </p>
            </div>
            <Server className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Regions</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {new Set(databases.map((db) => db.region)).size}
              </p>
            </div>
            <Globe className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Backups Enabled</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {databases.filter((db) => db.backup_enabled).length}
              </p>
            </div>
            <Shield className="h-12 w-12 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Databases List */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Dedicated Databases</h2>
        </div>

        {databases.length > 0 ? (
          <div className="divide-y">
            {databases.map((db) => (
              <div key={db.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Database className="mt-1 h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {db.organizations.name}
                      </h3>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Region:</span>{' '}
                          {regionNames[db.region] || db.region}
                        </p>
                        <p>
                          <span className="font-medium">Instance:</span>{' '}
                          {instanceSizes[db.instance_type].cpu} •{' '}
                          {instanceSizes[db.instance_type].memory}
                        </p>
                        <p>
                          <span className="font-medium">Storage:</span> {db.storage_gb} GB
                        </p>
                        <p>
                          <span className="font-medium">Container ID:</span>{' '}
                          <code className="rounded bg-gray-100 px-1 font-mono text-xs">
                            {db.container_id}
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        db.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : db.status === 'provisioning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {db.status}
                    </span>
                    <Button variant="outline" size="sm">
                      <Activity className="mr-2 h-4 w-4" />
                      Monitor
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No dedicated databases
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Provision a dedicated database for enhanced performance and isolation
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowProvisionModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Provision Database
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Provision Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              Provision Dedicated Database
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Configure your dedicated PostgreSQL instance
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {Object.entries(regionNames).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instance Type
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {Object.entries(instanceSizes).map(([key, specs]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedInstanceType(key)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        selectedInstanceType === key
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <p className="font-medium text-gray-900">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {specs.cpu} • {specs.memory}
                      </p>
                      <p className="mt-1 text-sm font-medium text-primary">
                        {specs.price}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="storage" className="block text-sm font-medium text-gray-700">
                  Storage (GB)
                </label>
                <input
                  type="number"
                  id="storage"
                  min="10"
                  max="1000"
                  value={storageGb}
                  onChange={(e) => setStorageGb(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Min: 10 GB, Max: 1000 GB
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowProvisionModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleProvision}>Provision Database</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
