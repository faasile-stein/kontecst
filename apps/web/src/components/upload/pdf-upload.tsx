'use client'

import { useState, useCallback } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface PdfUploadProps {
  packageVersionId: string
  onUploadComplete?: () => void
}

interface PdfFile {
  file: File
  path: string
  purpose: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  markdownLength?: number
}

export function PdfUpload({ packageVersionId, onUploadComplete }: PdfUploadProps) {
  const [pdfFile, setPdfFile] = useState<PdfFile | null>(null)
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
      file.name.match(/\.pdf$/i)
    )

    if (droppedFiles.length > 0) {
      const file = droppedFiles[0]
      setPdfFile({
        file,
        path: file.name.replace(/\.pdf$/i, '.md'),
        purpose: '',
        status: 'pending',
      })
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const file = selectedFiles[0]
    if (file.name.match(/\.pdf$/i)) {
      setPdfFile({
        file,
        path: file.name.replace(/\.pdf$/i, '.md'),
        purpose: '',
        status: 'pending',
      })
    }
  }, [])

  const removeFile = useCallback(() => {
    setPdfFile(null)
  }, [])

  const updatePath = useCallback((newPath: string) => {
    setPdfFile((prev) => (prev ? { ...prev, path: newPath } : null))
  }, [])

  const updatePurpose = useCallback((newPurpose: string) => {
    setPdfFile((prev) => (prev ? { ...prev, purpose: newPurpose } : null))
  }, [])

  const uploadPdf = async () => {
    if (!pdfFile || !pdfFile.purpose.trim()) {
      return
    }

    // Update status to uploading
    setPdfFile((prev) => (prev ? { ...prev, status: 'uploading' } : null))

    try {
      const formData = new FormData()
      formData.append('file', pdfFile.file)
      formData.append('packageVersionId', packageVersionId)
      formData.append('path', pdfFile.path)
      formData.append('purpose', pdfFile.purpose)

      const response = await fetch('/api/files/pdf-upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'Upload failed'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json()
            errorMessage = error.error || errorMessage
          } else {
            const text = await response.text()
            errorMessage = text || `Upload failed with status ${response.status}`
          }
        } catch (parseError) {
          errorMessage = `Upload failed with status ${response.status}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      // Update status to success
      setPdfFile((prev) =>
        prev
          ? {
              ...prev,
              status: 'success',
              markdownLength: result.markdownLength,
            }
          : null
      )

      // Call onUploadComplete after a short delay
      setTimeout(() => {
        onUploadComplete?.()
      }, 2000)
    } catch (error: any) {
      // Update status to error
      setPdfFile((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              error: error.message,
            }
          : null
      )
    }
  }

  const isPending = pdfFile?.status === 'pending'
  const isUploading = pdfFile?.status === 'uploading'
  const isSuccess = pdfFile?.status === 'success'
  const isError = pdfFile?.status === 'error'

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
          id="pdf-upload"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={!!pdfFile}
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">
          Drop PDF file here or{' '}
          <label
            htmlFor="pdf-upload"
            className={`cursor-pointer text-primary hover:underline ${
              pdfFile ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            browse
          </label>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF files only, up to 50 MB. Will be converted to Markdown using OCR and AI.
        </p>
      </div>

      {pdfFile && (
        <div className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 flex-shrink-0 text-gray-400 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {pdfFile.file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(pdfFile.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isSuccess && <CheckCircle className="h-5 w-5 text-green-600" />}
              {isError && <AlertCircle className="h-5 w-5 text-red-600" />}
              {isUploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {isPending && (
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {isPending && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="output-path" className="text-sm font-medium text-gray-700">
                  Output Markdown Path
                </Label>
                <Input
                  id="output-path"
                  type="text"
                  value={pdfFile.path}
                  onChange={(e) => updatePath(e.target.value)}
                  placeholder="e.g., docs/documentation.md"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The path where the generated markdown file will be saved
                </p>
              </div>

              <div>
                <Label htmlFor="purpose" className="text-sm font-medium text-gray-700">
                  Document Purpose <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="purpose"
                  value={pdfFile.purpose}
                  onChange={(e) => updatePurpose(e.target.value)}
                  placeholder="e.g., Extract API documentation and create a structured guide with examples"
                  className="mt-1"
                  rows={3}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Describe what you want the AI to focus on when converting the PDF to markdown.
                  Be specific about the structure, content, or format you need.
                </p>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                Processing PDF... This may take a minute. The AI is extracting text, performing
                OCR if needed, and generating structured markdown based on your purpose.
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-sm text-green-800">
                PDF processed successfully! Generated {pdfFile.markdownLength} characters of
                markdown. Redirecting...
              </p>
            </div>
          )}

          {isError && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{pdfFile.error}</p>
            </div>
          )}

          {isPending && (
            <Button
              onClick={uploadPdf}
              disabled={!pdfFile.purpose.trim()}
              className="w-full"
            >
              Process PDF & Upload
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
