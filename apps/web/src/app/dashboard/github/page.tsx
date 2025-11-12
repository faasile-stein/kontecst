'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import {
  GitBranch,
  Github,
  RefreshCw,
  Settings,
  Trash2,
  Plus,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

interface GitHubConnection {
  id: string
  installation_id: number
  installation_type: string
  account_login: string
  account_id: number
  account_avatar_url?: string
  repository_selection: string
  created_at: string
}

interface GitHubRepository {
  id: string
  github_connection_id: string
  repo_id: number
  repo_name: string
  repo_full_name: string
  repo_owner: string
  default_branch: string
  is_private: boolean
  sync_enabled: boolean
  sync_path: string
  sync_branch?: string
  auto_publish: boolean
  last_sync_status?: string
  last_sync_at?: string
  last_sync_error?: string
  packages?: {
    id: string
    name: string
    slug: string
  }
}

export default function GitHubIntegrationPage() {
  const [connections, setConnections] = useState<GitHubConnection[]>([])
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const [selectedConnection, setSelectedConnection] = useState<string | null>(
    null
  )

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchConnections()
  }, [])

  useEffect(() => {
    if (selectedConnection) {
      fetchRepositories(selectedConnection)
    }
  }, [selectedConnection])

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/github/connections')
      if (!response.ok) throw new Error('Failed to fetch connections')

      const data = await response.json()
      setConnections(data)

      if (data.length > 0 && !selectedConnection) {
        setSelectedConnection(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRepositories = async (connectionId: string) => {
    try {
      const response = await fetch(
        `/api/github/repositories?connectionId=${connectionId}`
      )
      if (!response.ok) throw new Error('Failed to fetch repositories')

      const data = await response.json()
      setRepositories(data)
    } catch (error) {
      console.error('Error fetching repositories:', error)
    }
  }

  const handleSync = async (repositoryId: string) => {
    setSyncing((prev) => ({ ...prev, [repositoryId]: true }))

    try {
      const response = await fetch(
        `/api/github/repositories/${repositoryId}/sync`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Sync failed')
      }

      // Refresh repositories after a delay to see updated status
      setTimeout(() => {
        if (selectedConnection) {
          fetchRepositories(selectedConnection)
        }
      }, 2000)
    } catch (error: any) {
      console.error('Error syncing repository:', error)
      toast.error(`Sync failed: ${error.message}`)
    } finally {
      setSyncing((prev) => ({ ...prev, [repositoryId]: false }))
    }
  }

  const handleToggleSync = async (
    repositoryId: string,
    currentValue: boolean
  ) => {
    try {
      const response = await fetch(`/api/github/repositories/${repositoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncEnabled: !currentValue }),
      })

      if (!response.ok) throw new Error('Failed to toggle sync')

      // Refresh repositories
      if (selectedConnection) {
        fetchRepositories(selectedConnection)
      }
    } catch (error) {
      console.error('Error toggling sync:', error)
    }
  }

  const handleDeleteRepository = async (repositoryId: string) => {
    if (!confirm('Are you sure you want to remove this repository connection?'))
      return

    try {
      const response = await fetch(`/api/github/repositories/${repositoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete repository')

      // Refresh repositories
      if (selectedConnection) {
        fetchRepositories(selectedConnection)
      }
    } catch (error) {
      console.error('Error deleting repository:', error)
    }
  }

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            GitHub Integration
          </h1>
          <p className="mt-2 text-gray-600">
            Sync Markdown files from your GitHub repositories
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          onClick={() => {
            // TODO: Open GitHub App installation flow
            toast.info(
              'GitHub App installation flow not yet implemented. This would open the GitHub OAuth flow.'
            )
          }}
        >
          <Github className="h-4 w-4" />
          Connect GitHub
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Github className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No GitHub connections</h3>
          <p className="mt-2 text-gray-600">
            Connect your GitHub account to sync repositories
          </p>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            onClick={() => {
              // TODO: Open GitHub App installation flow
              toast.info(
                'GitHub App installation flow not yet implemented. This would open the GitHub OAuth flow.'
              )
            }}
          >
            <Github className="h-4 w-4" />
            Connect GitHub Account
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Connections sidebar */}
          <div className="space-y-4 lg:col-span-1">
            <h2 className="font-semibold">Connected Accounts</h2>
            {connections.map((connection) => (
              <button
                key={connection.id}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                  selectedConnection === connection.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedConnection(connection.id)}
              >
                {connection.account_avatar_url && (
                  <img
                    src={connection.account_avatar_url}
                    alt={connection.account_login}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">
                    {connection.account_login}
                  </p>
                  <p className="text-xs text-gray-500">
                    {connection.installation_type}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Repositories list */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Repositories</h2>
              <button
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                onClick={() => {
                  // TODO: Add repository modal
                  toast.info(
                    'Add repository flow not yet implemented. This would fetch available repos from GitHub.'
                  )
                }}
              >
                <Plus className="h-4 w-4" />
                Add Repository
              </button>
            </div>

            {repositories.length === 0 ? (
              <div className="rounded-lg border border-gray-200 p-8 text-center">
                <GitBranch className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  No repositories configured
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://github.com/${repo.repo_full_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-medium hover:text-blue-600"
                          >
                            {repo.repo_full_name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {repo.is_private && (
                            <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                              Private
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-4 w-4" />
                            {repo.sync_branch || repo.default_branch}
                          </span>
                          <span>Path: {repo.sync_path}</span>
                          {repo.packages && (
                            <span>→ {repo.packages.name}</span>
                          )}
                        </div>

                        {repo.last_sync_at && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            {getSyncStatusIcon(repo.last_sync_status)}
                            <span className="text-gray-600">
                              Last synced{' '}
                              {new Date(repo.last_sync_at).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {repo.last_sync_error && (
                          <div className="mt-2 flex items-center gap-2 rounded bg-red-50 p-2 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            {repo.last_sync_error}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                          onClick={() => handleSync(repo.id)}
                          disabled={syncing[repo.id]}
                          title="Sync now"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${
                              syncing[repo.id] ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                        <button
                          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                          onClick={() =>
                            handleToggleSync(repo.id, repo.sync_enabled)
                          }
                          title={
                            repo.sync_enabled ? 'Disable sync' : 'Enable sync'
                          }
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteRepository(repo.id)}
                          title="Remove repository"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900">
          How GitHub sync works
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• Connect your GitHub account via the GitHub App</li>
          <li>• Select repositories to sync (or sync all repositories)</li>
          <li>
            • Configure which path and branch to sync from each repository
          </li>
          <li>• Markdown files are automatically synced to Kontecst packages</li>
          <li>
            • Enable auto-publish to automatically create new versions on sync
          </li>
        </ul>
      </div>
    </div>
  )
}
