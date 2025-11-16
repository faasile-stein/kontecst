'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'
import { FileViewerModal } from './file-viewer-modal'
import { CopyLinkButton } from '@/components/ui/copy-link-button'

interface File {
  id: string
  filename: string
  path: string
  size_bytes: number
  token_count?: number
  content?: string
  uploader?: {
    id: string
    full_name: string | null
    email: string
  }
}

interface VersionFilesSectionProps {
  files: File[]
  packageId?: string
  packageSlug?: string
  versionId?: string
  isPublic?: boolean
  isPublished?: boolean
  baseUrl?: string
}

export function VersionFilesSection({
  files,
  packageId,
  packageSlug,
  versionId,
  isPublic = false,
  isPublished = false,
  baseUrl = '',
}: VersionFilesSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleViewFile = (file: File) => {
    setSelectedFile(file)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedFile(null)
  }

  const handleDownloadIndex = async () => {
    if (!packageId || !versionId) return

    setIsDownloading(true)
    try {
      const response = await fetch(
        `/api/packages/${packageId}/versions/${versionId}/index`
      )
      if (!response.ok) throw new Error('Failed to generate index')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${packageSlug}-index.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading index:', error)
      alert('Failed to download index file')
    } finally {
      setIsDownloading(false)
    }
  }

  const showPublicActions = isPublic && isPublished

  return (
    <>
      <div className="mt-8 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Files</h2>
            {showPublicActions && files.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadIndex}
                disabled={isDownloading}
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Generating...' : 'Download Index.md'}
              </Button>
            )}
          </div>
        </div>

        <div className="divide-y">
          {files && files.length > 0 ? (
            files.map((file) => (
              <div key={file.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{file.filename}</p>
                      <p className="text-sm text-gray-500">{file.path}</p>
                      {file.uploader && (
                        <p className="text-xs text-gray-400">
                          Uploaded by {file.uploader.full_name || file.uploader.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex flex-col items-end">
                      <span>{(file.size_bytes / 1024).toFixed(1)} KB</span>
                      {file.token_count && (
                        <span className="text-xs text-gray-400">
                          ~{file.token_count.toLocaleString()} tokens
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {showPublicActions && (
                        <CopyLinkButton
                          url={`${baseUrl}#${file.path}`}
                          label="Copy Link"
                          variant="ghost"
                          size="sm"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFile(file)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
              <p className="mt-1 text-sm text-gray-500">
                This version doesn&apos;t have any files yet
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedFile && (
        <FileViewerModal
          fileId={selectedFile.id}
          filename={selectedFile.filename}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
