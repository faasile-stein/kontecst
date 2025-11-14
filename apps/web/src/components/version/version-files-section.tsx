'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { FileViewerModal } from './file-viewer-modal'

interface File {
  id: string
  filename: string
  path: string
  size_bytes: number
}

interface VersionFilesSectionProps {
  files: File[]
}

export function VersionFilesSection({ files }: VersionFilesSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewFile = (file: File) => {
    setSelectedFile(file)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedFile(null)
  }

  return (
    <>
      <div className="mt-8 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Files</h2>
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{(file.size_bytes / 1024).toFixed(1)} KB</span>
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
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
              <p className="mt-1 text-sm text-gray-500">
                This version doesn't have any files yet
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
