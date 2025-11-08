'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Shield,
  Plus,
  Settings,
  Trash2,
  Check,
  X,
  AlertCircle,
  Key,
} from 'lucide-react'

interface SSOConnection {
  id: string
  organization_id: string
  provider: string
  display_name: string
  domain?: string
  metadata_url?: string
  entity_id?: string
  sso_url?: string
  attribute_mappings: Record<string, string>
  auto_provision: boolean
  default_role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Organization {
  id: string
  name: string
  slug: string
}

export default function SSOPage() {
  const [connections, setConnections] = useState<SSOConnection[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('')

  // Form state
  const [provider, setProvider] = useState<'saml' | 'oidc' | 'oauth'>('saml')
  const [displayName, setDisplayName] = useState('')
  const [domain, setDomain] = useState('')
  const [metadataUrl, setMetadataUrl] = useState('')
  const [metadataXml, setMetadataXml] = useState('')
  const [entityId, setEntityId] = useState('')
  const [ssoUrl, setSsoUrl] = useState('')
  const [certificate, setCertificate] = useState('')
  const [autoProvision, setAutoProvision] = useState(true)
  const [defaultRole, setDefaultRole] = useState<
    'owner' | 'admin' | 'member' | 'viewer'
  >('member')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch organizations
      const orgsResponse = await fetch('/api/organizations')
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        setOrganizations(orgsData)
        if (orgsData.length > 0 && !selectedOrg) {
          setSelectedOrg(orgsData[0].id)
        }
      }

      // Fetch SSO connections
      await fetchConnections()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/sso/connections')
      if (!response.ok) throw new Error('Failed to fetch SSO connections')

      const data = await response.json()
      setConnections(data)
    } catch (error) {
      console.error('Error fetching SSO connections:', error)
    }
  }

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/sso/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          provider,
          displayName,
          domain: domain || undefined,
          metadataUrl: metadataUrl || undefined,
          metadataXml: metadataXml || undefined,
          entityId: entityId || undefined,
          ssoUrl: ssoUrl || undefined,
          certificate: certificate || undefined,
          autoProvision,
          defaultRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create SSO connection')
      }

      // Reset form
      setShowModal(false)
      setDisplayName('')
      setDomain('')
      setMetadataUrl('')
      setMetadataXml('')
      setEntityId('')
      setSsoUrl('')
      setCertificate('')
      setAutoProvision(true)
      setDefaultRole('member')

      // Refresh connections
      await fetchConnections()
    } catch (error: any) {
      console.error('Error creating SSO connection:', error)
      alert(`Failed to create SSO connection: ${error.message}`)
    }
  }

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/sso/connections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentValue }),
      })

      if (!response.ok) throw new Error('Failed to toggle SSO connection')

      await fetchConnections()
    } catch (error) {
      console.error('Error toggling SSO connection:', error)
      alert('Failed to toggle SSO connection')
    }
  }

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SSO connection?'))
      return

    try {
      const response = await fetch(`/api/sso/connections/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete SSO connection')

      await fetchConnections()
    } catch (error) {
      console.error('Error deleting SSO connection:', error)
      alert('Failed to delete SSO connection')
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Shield className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            SSO / SAML Configuration
          </h1>
          <p className="mt-2 text-gray-600">
            Configure Single Sign-On for your organization
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          <Plus className="h-4 w-4" />
          Add SSO Connection
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">
              Enterprise SSO Feature
            </h3>
            <p className="mt-1 text-sm text-blue-800">
              Single Sign-On allows your team members to authenticate using your
              organization's identity provider (SAML, OIDC, OAuth). This feature
              requires Enterprise plan.
            </p>
          </div>
        </div>
      </div>

      {/* Connections list */}
      {connections.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No SSO connections</h3>
          <p className="mt-2 text-gray-600">
            Add your first SSO connection to enable Single Sign-On
          </p>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-4 w-4" />
            Add SSO Connection
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold">
                      {connection.display_name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        connection.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {connection.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium uppercase text-blue-800">
                      {connection.provider}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-gray-600">
                    {connection.domain && (
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span>Domain: {connection.domain}</span>
                      </div>
                    )}
                    {connection.entity_id && (
                      <div>Entity ID: {connection.entity_id}</div>
                    )}
                    {connection.sso_url && (
                      <div>SSO URL: {connection.sso_url}</div>
                    )}
                    <div>
                      Auto-provision:{' '}
                      {connection.auto_provision ? 'Enabled' : 'Disabled'}
                    </div>
                    <div>Default role: {connection.default_role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className={`rounded-lg p-2 ${
                      connection.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() =>
                      handleToggleActive(connection.id, connection.is_active)
                    }
                    title={connection.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {connection.is_active ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <button
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteConnection(connection.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create SSO Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Add SSO Connection</h2>

            <form onSubmit={handleCreateConnection} className="mt-6 space-y-4">
              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization *
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  required
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Provider *
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={provider}
                  onChange={(e) =>
                    setProvider(e.target.value as 'saml' | 'oidc' | 'oauth')
                  }
                  required
                >
                  <option value="saml">SAML 2.0</option>
                  <option value="oidc">OpenID Connect</option>
                  <option value="oauth">OAuth 2.0</option>
                </select>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Display Name *
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Okta SSO, Google Workspace"
                  required
                />
              </div>

              {/* Domain */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Domain (optional)
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="company.com"
                />
              </div>

              {/* SAML-specific fields */}
              {provider === 'saml' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Metadata URL
                    </label>
                    <input
                      type="url"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={metadataUrl}
                      onChange={(e) => setMetadataUrl(e.target.value)}
                      placeholder="https://idp.example.com/metadata"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Metadata XML (alternative to URL)
                    </label>
                    <textarea
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
                      rows={4}
                      value={metadataXml}
                      onChange={(e) => setMetadataXml(e.target.value)}
                      placeholder="Paste SAML metadata XML here..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Entity ID
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={entityId}
                      onChange={(e) => setEntityId(e.target.value)}
                      placeholder="urn:example:idp"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SSO URL
                    </label>
                    <input
                      type="url"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={ssoUrl}
                      onChange={(e) => setSsoUrl(e.target.value)}
                      placeholder="https://idp.example.com/sso"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Certificate (X.509)
                    </label>
                    <textarea
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
                      rows={3}
                      value={certificate}
                      onChange={(e) => setCertificate(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    />
                  </div>
                </>
              )}

              {/* Auto-provision */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoProvision"
                  checked={autoProvision}
                  onChange={(e) => setAutoProvision(e.target.checked)}
                />
                <label htmlFor="autoProvision" className="text-sm text-gray-700">
                  Automatically provision new users
                </label>
              </div>

              {/* Default Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Default Role for New Users
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={defaultRole}
                  onChange={(e) =>
                    setDefaultRole(
                      e.target.value as 'owner' | 'admin' | 'member' | 'viewer'
                    )
                  }
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Create Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
