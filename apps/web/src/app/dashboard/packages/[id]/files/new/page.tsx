'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { NewMarkdownEditorLazy as MarkdownEditor } from '@/components/editor/new-markdown-editor-lazy'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function NewFilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [packageData, setPackageData] = useState<any>(null)
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [filePath, setFilePath] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPackageData()
  }, [params.id])

  const fetchPackageData = async () => {
    try {
      const response = await fetch(`/api/packages/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch package')

      const data = await response.json()
      setPackageData(data)

      // Select the first version by default
      if (data.package_versions && data.package_versions.length > 0) {
        setSelectedVersion(data.package_versions[0].id)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (content: string) => {
    if (!fileName || !filePath || !selectedVersion) {
      toast.error('Please provide a file name and path')
      return
    }

    setSaving(true)
    try {
      // Create a file from the content
      const blob = new Blob([content], { type: 'text/markdown' })
      const file = new File([blob], fileName, { type: 'text/markdown' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('packageVersionId', selectedVersion)
      formData.append('path', filePath)

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create file')
      }

      toast.success('File created successfully')
      // Redirect to package page on success
      router.push(`/dashboard/packages/${params.id}`)
    } catch (error: any) {
      toast.error(`Error creating file: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  if (!packageData) {
    return <div>Package not found</div>
  }

  const versions = packageData.package_versions || []

  if (versions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/dashboard/packages/${params.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to package
          </Link>
        </div>
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            You need to create a version first before creating files.
          </p>
          <Link href={`/dashboard/packages/${params.id}/versions/new`}>
            <Button className="mt-3" size="sm">
              Create Version
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/dashboard/packages/${params.id}`}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to package
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <FileText className="h-5 w-5 text-gray-400" />
            <h1 className="text-xl font-semibold text-gray-900">Create New File</h1>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="version"
              className="block text-sm font-medium text-gray-700"
            >
              Version
            </label>
            <select
              id="version"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            >
              {versions.map((version: any) => (
                <option key={version.id} value={version.id}>
                  v{version.version}
                  {version.is_published ? ' (Published)' : ' (Draft)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="fileName"
              className="block text-sm font-medium text-gray-700"
            >
              File Name
            </label>
            <input
              type="text"
              id="fileName"
              value={fileName}
              onChange={(e) => {
                const name = e.target.value
                setFileName(name)
                // Auto-set path if empty
                if (!filePath && name) {
                  setFilePath(name.endsWith('.md') ? name : `${name}.md`)
                }
              }}
              placeholder="introduction.md"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="filePath"
              className="block text-sm font-medium text-gray-700"
            >
              Path in Package
            </label>
            <input
              type="text"
              id="filePath"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="docs/introduction.md"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor
          initialContent="# Welcome\n\nStart writing your markdown content here..."
          onSave={handleSave}
          fileName={fileName || 'Untitled'}
        />
      </div>
    </div>
  )
}
