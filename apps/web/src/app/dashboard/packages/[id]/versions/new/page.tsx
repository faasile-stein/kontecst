'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewVersionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packageData, setPackageData] = useState<any>(null)
  const [formData, setFormData] = useState({
    version: '',
    description: '',
    changelog: '',
  })

  useEffect(() => {
    fetchPackageData()
  }, [params.id])

  const fetchPackageData = async () => {
    try {
      const response = await fetch(`/api/packages/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch package')

      const data = await response.json()
      setPackageData(data)

      // Suggest next version number based on latest version
      if (data.package_versions && data.package_versions.length > 0) {
        const latestVersion = data.package_versions[0].version
        const [major, minor, patch] = latestVersion.split('.').map(Number)
        setFormData({ ...formData, version: `${major}.${minor}.${patch + 1}` })
      } else {
        setFormData({ ...formData, version: '1.0.0' })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/packages/${params.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create version')
      }

      router.push(`/dashboard/packages/${params.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!packageData) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">Package not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/packages/${params.id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {packageData.name}
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Create New Version</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new version of {packageData.name}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-700">
              Version Number *
            </label>
            <input
              type="text"
              id="version"
              required
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              pattern="[0-9]+\.[0-9]+\.[0-9]+"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="1.0.0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Semantic version number (e.g., 1.0.0, 2.1.3)
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="A brief description of this version"
            />
          </div>

          <div>
            <label
              htmlFor="changelog"
              className="block text-sm font-medium text-gray-700"
            >
              Changelog
            </label>
            <textarea
              id="changelog"
              rows={5}
              value={formData.changelog}
              onChange={(e) =>
                setFormData({ ...formData, changelog: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="What's new in this version?"
            />
            <p className="mt-1 text-xs text-gray-500">
              List of changes, improvements, or bug fixes in this version
            </p>
          </div>

          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              After creating this version, you can upload files or use the markdown editor to add content.
            </p>
          </div>

          <div className="flex justify-end space-x-3 border-t pt-6">
            <Link href={`/dashboard/packages/${params.id}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Version'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
