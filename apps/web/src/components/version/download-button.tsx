'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface DownloadButtonProps {
  packageName: string
  version: string
  files: Array<{
    id: string
    filename: string
    path: string
    content: string
  }>
}

export function DownloadButton({ packageName, version, files }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (files.length === 0) {
      alert('No files to download')
      return
    }

    setIsDownloading(true)

    try {
      const zip = new JSZip()

      // Add each file to the zip
      for (const file of files) {
        const filePath = file.path || file.filename
        zip.file(filePath, file.content)
      }

      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' })

      // Download the file
      const filename = `${packageName}-v${version}.zip`
      saveAs(content, filename)
    } catch (error) {
      console.error('Error creating download:', error)
      alert('Failed to create download. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? 'Downloading...' : 'Download'}
    </Button>
  )
}
