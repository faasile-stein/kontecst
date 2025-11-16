'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cpu, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface LLMProvider {
  id: string
  name: string
  type: 'openai' | 'openai_compatible' | 'anthropic' | 'local'
  api_endpoint: string
  api_key: string | null
  model_name: string
  is_default: boolean
  is_enabled: boolean
  max_tokens: number
  temperature: number
  metadata: any
  created_at: string
  updated_at: string
}

const providerTypeLabels: Record<string, string> = {
  openai: 'OpenAI',
  openai_compatible: 'OpenAI Compatible',
  anthropic: 'Anthropic',
  local: 'Local',
}

export default function AdminLLMPage() {
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'openai_compatible' as LLMProvider['type'],
    apiEndpoint: '',
    apiKey: '',
    modelName: '',
    isDefault: false,
    isEnabled: true,
    maxTokens: 4096,
    temperature: 0.3,
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/llm-providers')
      if (!response.ok) throw new Error('Failed to fetch providers')

      const data = await response.json()
      setProviders(data.providers || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'openai_compatible',
      apiEndpoint: '',
      apiKey: '',
      modelName: '',
      isDefault: false,
      isEnabled: true,
      maxTokens: 4096,
      temperature: 0.3,
    })
    setEditingProvider(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (provider: LLMProvider) => {
    setFormData({
      name: provider.name,
      type: provider.type,
      apiEndpoint: provider.api_endpoint,
      apiKey: provider.api_key || '',
      modelName: provider.model_name,
      isDefault: provider.is_default,
      isEnabled: provider.is_enabled,
      maxTokens: provider.max_tokens,
      temperature: provider.temperature,
    })
    setEditingProvider(provider)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editingProvider
        ? `/api/admin/llm-providers/${editingProvider.id}`
        : '/api/admin/llm-providers'

      const method = editingProvider ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save provider')
      }

      toast.success(editingProvider ? 'Provider updated successfully' : 'Provider created successfully')
      setShowModal(false)
      resetForm()
      await fetchProviders()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return

    try {
      const response = await fetch(`/api/admin/llm-providers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete provider')
      }

      toast.success('Provider deleted successfully')
      await fetchProviders()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleToggleEnabled = async (provider: LLMProvider) => {
    try {
      const response = await fetch(`/api/admin/llm-providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !provider.is_enabled }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update provider')
      }

      toast.success(`Provider ${provider.is_enabled ? 'disabled' : 'enabled'}`)
      await fetchProviders()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleSetDefault = async (provider: LLMProvider) => {
    try {
      const response = await fetch(`/api/admin/llm-providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to set default provider')
      }

      toast.success('Default provider updated')
      await fetchProviders()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">LLM Provider Configuration</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure LLM providers that users can connect to for AI features
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {/* Providers List */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">LLM Providers</h2>
        </div>

        {providers.length > 0 ? (
          <div className="divide-y">
            {providers.map((provider) => (
              <div key={provider.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Cpu className="mt-1 h-8 w-8 text-primary" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{provider.name}</h3>
                        {provider.is_default && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Default
                          </span>
                        )}
                        {provider.is_enabled ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Enabled
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Type:</span> {providerTypeLabels[provider.type]}
                        </p>
                        <p>
                          <span className="font-medium">Endpoint:</span>{' '}
                          <code className="rounded bg-gray-100 px-1 font-mono text-xs">
                            {provider.api_endpoint}
                          </code>
                        </p>
                        <p>
                          <span className="font-medium">Model:</span> {provider.model_name}
                        </p>
                        <p>
                          <span className="font-medium">Max Tokens:</span> {provider.max_tokens}
                        </p>
                        <p>
                          <span className="font-medium">Temperature:</span> {provider.temperature}
                        </p>
                        {provider.api_key && (
                          <p>
                            <span className="font-medium">API Key:</span> ••••••••
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!provider.is_default && provider.is_enabled && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetDefault(provider)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleEnabled(provider)}
                    >
                      {provider.is_enabled ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(provider)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(provider.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Cpu className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No LLM providers</h3>
            <p className="mt-2 text-sm text-gray-500">
              Add an LLM provider to enable AI features for users
            </p>
            <div className="mt-6">
              <Button onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingProvider ? 'Edit LLM Provider' : 'Add LLM Provider'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Configure an LLM provider for users to connect to
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="name">Provider Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Local LLM"
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as LLMProvider['type'] })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="openai_compatible">OpenAI Compatible</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="local">Local</option>
                </select>
              </div>

              <div>
                <Label htmlFor="apiEndpoint">API Endpoint</Label>
                <Input
                  id="apiEndpoint"
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                  placeholder="e.g., http://localhost:8080/v1/chat/completions"
                />
              </div>

              <div>
                <Label htmlFor="apiKey">
                  API Key <span className="text-gray-500">(optional for local providers)</span>
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </div>

              <div>
                <Label htmlFor="modelName">Model Name</Label>
                <Input
                  id="modelName"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  placeholder="e.g., local-model or gpt-4o"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) =>
                      setFormData({ ...formData, maxTokens: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Set as default provider</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Enabled</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingProvider ? 'Update Provider' : 'Add Provider'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
