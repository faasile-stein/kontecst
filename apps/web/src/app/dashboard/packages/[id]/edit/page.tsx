'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Trash2 } from 'lucide-react'
import { MarkdownEditorLazy as MarkdownEditor } from '@/components/editor/markdown-editor-lazy'
import type { MarkdownEditor } from '@/components/editor/markdown-editor'
import { Button } from '@/components/ui/button'

interface FileItem {
  id: string
  filename: string
  path: string
  content?: string
}

export default function EditPackagePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [packageData, setPackageData] = useState<any>(null)
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPackageData()
  }, [params.id])

  useEffect(() => {
    if (selectedVersion) {
      fetchFiles()
    }
  }, [selectedVersion])

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

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/files?packageVersionId=${selectedVersion}`)
      if (!response.ok) throw new Error('Failed to fetch files')

      const data = await response.json()
      setFiles(data.files || [])

      // Select first file if available
      if (data.files && data.files.length > 0 && !selectedFile) {
        handleFileSelect(data.files[0])
      }
    } catch (err: any) {
      console.error('Error fetching files:', err)
    }
  }

  const handleFileSelect = async (file: FileItem) => {
    setSelectedFile({ ...file, content: '' })
    try {
      const response = await fetch(`/api/files/${file.id}`)
      if (!response.ok) throw new Error('Failed to fetch file content')

      const data = await response.json()
      setSelectedFile({
        ...file,
        content: data.content || `# ${file.filename}\n\nEdit your markdown content here...`,
      })
    } catch (err: any) {
      console.error('Error fetching file content:', err)
      setSelectedFile({
        ...file,
        content: `# ${file.filename}\n\nEdit your markdown content here...`,
      })
    }
  }

  const handleSaveFile = async (content: string) => {
    if (!selectedFile) return

    try {
      // For new files (not yet saved to database)
      if (selectedFile.id.startsWith('new-')) {
        // Create new file via upload API
        const blob = new Blob([content], { type: 'text/markdown' })
        const file = new File([blob], selectedFile.filename, { type: 'text/markdown' })

        const formData = new FormData()
        formData.append('file', file)
        formData.append('packageVersionId', selectedVersion)
        formData.append('path', selectedFile.path)

        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Failed to create file')

        const newFile = await response.json()

        // Update the file in the list with the real ID
        setFiles(files.map(f => f.id === selectedFile.id ? { ...f, id: newFile.id } : f))
        setSelectedFile({ ...selectedFile, id: newFile.id, content })
      } else {
        // Update existing file
        const response = await fetch(`/api/files/${selectedFile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) throw new Error('Failed to save file')
      }
    } catch (err: any) {
      console.error('Error saving file:', err)
      throw err
    }
  }

  const handleNewFile = () => {
    const newFileName = prompt('Enter file name (e.g., introduction.md):')
    if (!newFileName) return

    const newFile: FileItem = {
      id: `new-${Date.now()}`,
      filename: newFileName,
      path: newFileName,
      content: `# ${newFileName.replace(/\.md$/, '')}\n\n`,
    }

    setFiles([...files, newFile])
    setSelectedFile(newFile)
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (error || !packageData) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error || 'Package not found'}</p>
        </div>
      </div>
    )
  }

  const versions = packageData.package_versions || []

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/dashboard/packages/${params.id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {packageData.name}
              </h1>
              <p className="text-sm text-gray-500">Edit package files</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {versions.map((version: any) => (
                <option key={version.id} value={version.id}>
                  v{version.version}
                  {version.is_published ? ' (Published)' : ' (Draft)'}
                </option>
              ))}
            </select>

            <Button size="sm" onClick={handleNewFile}>
              <Plus className="mr-2 h-4 w-4" />
              New File
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File list sidebar */}
        <div className="w-64 border-r bg-gray-50">
          <div className="border-b bg-white px-4 py-3">
            <p className="text-sm font-medium text-gray-700">Files</p>
          </div>
          <div className="overflow-auto">
            {files.length > 0 ? (
              files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleFileSelect(file)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                    selectedFile?.id === file.id
                      ? 'bg-white text-primary'
                      : 'hover:bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{file.filename}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No files yet</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={handleNewFile}
                >
                  Create first file
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {selectedFile ? (
            <MarkdownEditor
              key={selectedFile.id}
              initialContent={selectedFile.content || ''}
              onSave={handleSaveFile}
              fileName={selectedFile.filename}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4">Select a file to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
