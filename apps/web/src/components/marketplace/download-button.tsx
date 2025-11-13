'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface MarketplaceDownloadButtonProps {
  packageSlug: string
  versionId: string
  version: string
}

export function MarketplaceDownloadButton({
  packageSlug,
  versionId,
  version,
}: MarketplaceDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      // Fetch files for this version
      const response = await fetch(`/api/marketplace/${packageSlug}/versions/${versionId}/files`)

      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }

      const files = await response.json()

      if (files.length === 0) {
        alert('No files available to download')
        return
      }

      const zip = new JSZip()

      // Add each file to the zip
      for (const file of files) {
        const filePath = file.path || file.filename
        zip.file(filePath, file.content)
      }

      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' })

      // Download the file
      const filename = `${packageSlug}-v${version}.zip`
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
      className="w-full"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? 'Downloading...' : 'Download Package'}
    </Button>
  )
}
