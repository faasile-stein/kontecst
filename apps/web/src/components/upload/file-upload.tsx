'use client'

import { useState, useCallback } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  packageVersionId: string
  onUploadComplete?: () => void
}

interface FileWithPath {
  file: File
  path: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function FileUpload({ packageVersionId, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPath[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.name.match(/\.(md|markdown)$/i)
    )

    const filesWithPath: FileWithPath[] = droppedFiles.map((file) => ({
      file,
      path: file.name,
      status: 'pending',
    }))

    setFiles((prev) => [...prev, ...filesWithPath])
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const filesWithPath: FileWithPath[] = Array.from(selectedFiles)
      .filter((file) => file.name.match(/\.(md|markdown)$/i))
      .map((file) => ({
        file,
        path: file.name,
        status: 'pending',
      }))

    setFiles((prev) => [...prev, ...filesWithPath])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateFilePath = useCallback((index: number, newPath: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, path: newPath } : f))
    )
  }, [])

  const uploadFiles = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
      )

      try {
        const formData = new FormData()
        formData.append('file', files[i].file)
        formData.append('packageVersionId', packageVersionId)
        formData.append('path', files[i].path)

        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        // Update status to success
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'success' } : f))
        )
      } catch (error: any) {
        // Update status to error
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', error: error.message } : f
          )
        )
      }
    }

    // Call onUploadComplete if all uploads are done
    if (files.every((f) => f.status === 'success' || f.status === 'error')) {
      onUploadComplete?.()
    }
  }

  const hasFiles = files.length > 0
  const pendingCount = files.filter((f) => f.status === 'pending').length
  const successCount = files.filter((f) => f.status === 'success').length
  const errorCount = files.filter((f) => f.status === 'error').length

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          accept=".md,.markdown"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">
          Drop Markdown files here or{' '}
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-primary hover:underline"
          >
            browse
          </label>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          .md or .markdown files only, up to 10 MB each
        </p>
      </div>

      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            {pendingCount > 0 && (
              <Button onClick={uploadFiles} size="sm">
                Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
              </Button>
            )}
          </div>

          {(successCount > 0 || errorCount > 0) && (
            <div className="rounded-md bg-gray-50 p-3 text-sm">
              {successCount > 0 && (
                <p className="text-green-700">{successCount} uploaded successfully</p>
              )}
              {errorCount > 0 && (
                <p className="text-red-700">{errorCount} failed</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            {files.map((fileWithPath, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 rounded-md border bg-white p-3"
              >
                <File className="h-5 w-5 flex-shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {fileWithPath.file.name}
                  </p>
                  <input
                    type="text"
                    value={fileWithPath.path}
                    onChange={(e) => updateFilePath(index, e.target.value)}
                    disabled={fileWithPath.status !== 'pending'}
                    className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-xs disabled:bg-gray-100"
                    placeholder="Path in package (e.g., docs/introduction.md)"
                  />
                  {fileWithPath.error && (
                    <p className="mt-1 text-xs text-red-600">{fileWithPath.error}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {fileWithPath.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {fileWithPath.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  {fileWithPath.status === 'uploading' && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                  )}
                  {fileWithPath.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
