'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Cpu, Check } from 'lucide-react'
import { toast } from 'sonner'

interface LLMProvider {
  id: string
  name: string
  type: string
  model_name: string
  is_default: boolean
  metadata: any
}

export function LLMProviderSettings() {
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/llm-providers')
      if (!response.ok) throw new Error('Failed to fetch providers')

      const data = await response.json()
      setProviders(data.providers || [])
      setSelectedProviderId(data.selectedProviderId)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProvider = async (providerId: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/llm-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to set preference')
      }

      setSelectedProviderId(providerId)
      toast.success('LLM provider preference updated')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUseDefault = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/llm-preference', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset preference')
      }

      setSelectedProviderId(null)
      toast.success('Using default LLM provider')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Loading LLM providers...</div>
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          No LLM providers are currently available. Contact your administrator to configure LLM providers.
        </p>
      </div>
    )
  }

  // Find the default provider
  const defaultProvider = providers.find((p) => p.is_default)
  const currentlyUsedProvider =
    selectedProviderId
      ? providers.find((p) => p.id === selectedProviderId)
      : defaultProvider

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-blue-50 p-4">
        <div className="flex items-start space-x-3">
          <Cpu className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900">Current LLM Provider</h4>
            <p className="mt-1 text-sm text-blue-800">
              {currentlyUsedProvider ? (
                <>
                  Using <span className="font-semibold">{currentlyUsedProvider.name}</span> (
                  {currentlyUsedProvider.model_name})
                  {!selectedProviderId && ' (Default)'}
                </>
              ) : (
                'No provider configured'
              )}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Available LLM Providers</h4>
        <div className="space-y-2">
          {providers.map((provider) => {
            const isSelected = selectedProviderId === provider.id
            const isDefault = provider.is_default && !selectedProviderId

            return (
              <button
                key={provider.id}
                onClick={() => handleSelectProvider(provider.id)}
                disabled={saving || isSelected}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  isSelected || isDefault
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Cpu className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{provider.name}</p>
                        {provider.is_default && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Model: {provider.model_name}
                      </p>
                      {provider.metadata?.description && (
                        <p className="mt-1 text-xs text-gray-500">
                          {provider.metadata.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {(isSelected || isDefault) && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selectedProviderId && (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleUseDefault} disabled={saving}>
            Use Default Provider
          </Button>
        </div>
      )}
    </div>
  )
}
