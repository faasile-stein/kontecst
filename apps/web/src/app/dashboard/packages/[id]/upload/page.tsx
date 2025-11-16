'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FilePlus } from 'lucide-react'
import { FileUpload } from '@/components/upload/file-upload'
import { PdfUpload } from '@/components/upload/pdf-upload'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function UploadPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [packageData, setPackageData] = useState<any>(null)
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleUploadComplete = () => {
    // Refresh the page or redirect
    router.push(`/dashboard/packages/${params.id}`)
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

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Files</h1>
            <p className="mt-2 text-sm text-gray-600">
              Upload Markdown or PDF files to {packageData.name}
            </p>
          </div>
          <Link href={`/dashboard/packages/${params.id}/files/new`}>
            <Button variant="secondary">
              <FilePlus className="mr-2 h-4 w-4" />
              Create New File
            </Button>
          </Link>
        </div>

        <div className="mt-6 space-y-6">
          {versions.length === 0 ? (
            <div className="rounded-md bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                You need to create a version first before uploading files.
              </p>
              <Link href={`/dashboard/packages/${params.id}/versions/new`}>
                <Button className="mt-3" size="sm">
                  Create Version
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="version"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select Version
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

              {selectedVersion && (
                <Tabs defaultValue="markdown" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="markdown">Markdown Files</TabsTrigger>
                    <TabsTrigger value="pdf">PDF Upload (AI-Powered)</TabsTrigger>
                  </TabsList>
                  <TabsContent value="markdown" className="mt-4">
                    <FileUpload
                      packageVersionId={selectedVersion}
                      onUploadComplete={handleUploadComplete}
                    />
                  </TabsContent>
                  <TabsContent value="pdf" className="mt-4">
                    <div className="rounded-md bg-blue-50 p-4 mb-4">
                      <p className="text-sm text-blue-800">
                        Upload a PDF and our AI will extract the text using OCR (if needed) and
                        convert it to a structured Markdown document based on your specified
                        purpose. Perfect for documentation, research papers, or any PDF content
                        you want to add to your package.
                      </p>
                    </div>
                    <PdfUpload
                      packageVersionId={selectedVersion}
                      onUploadComplete={handleUploadComplete}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
