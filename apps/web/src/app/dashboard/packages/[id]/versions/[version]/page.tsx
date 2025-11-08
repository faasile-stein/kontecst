import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Download, GitCompare } from 'lucide-react'

export default async function VersionDetailPage({
  params,
}: {
  params: { id: string; version: string }
}) {
  const supabase = await createClient()

  // Get package info
  const { data: pkg } = await supabase
    .from('packages')
    .select('id, name, slug')
    .eq('id', params.id)
    .single()

  if (!pkg) {
    notFound()
  }

  // Get version info
  const { data: version } = await supabase
    .from('package_versions')
    .select('*')
    .eq('package_id', params.id)
    .eq('version', params.version)
    .single()

  if (!version) {
    notFound()
  }

  // Get files for this version
  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('package_version_id', version.id)
    .order('path', { ascending: true })

  return (
    <div>
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
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">
                v{version.version}
              </h1>
              {version.is_published && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  Published
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{pkg.name}</p>
            {version.description && (
              <p className="mt-2 text-gray-700">{version.description}</p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Link href={`/dashboard/packages/${params.id}/versions/compare`}>
              <Button variant="outline" size="sm">
                <GitCompare className="mr-2 h-4 w-4" />
                Compare
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
          <div>
            <p className="text-sm text-gray-600">Files</p>
            <p className="text-2xl font-semibold text-gray-900">
              {version.file_count}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Size</p>
            <p className="text-2xl font-semibold text-gray-900">
              {version.total_size_bytes
                ? `${(version.total_size_bytes / 1024).toFixed(1)} KB`
                : '0 KB'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {version.is_published ? 'Published' : 'Created'}
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {new Date(
                version.published_at || version.created_at
              ).toLocaleDateString()}
            </p>
          </div>
        </div>

        {version.changelog && (
          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold text-gray-900">Changelog</h3>
            <div className="prose prose-sm mt-2 max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {version.changelog}
              </pre>
            </div>
          </div>
        )}
      </div>

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
                    <Button variant="ghost" size="sm">
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
    </div>
  )
}
