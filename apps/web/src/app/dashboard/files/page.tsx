import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { FileText, Package } from 'lucide-react'

export default async function FilesPage() {
  const supabase = await createClient()

  // Get all files from user's packages
  const { data: files } = await supabase
    .from('files')
    .select(`
      *,
      package_versions(
        id,
        version,
        package_id,
        packages(
          id,
          name,
          slug
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Files</h1>
          <p className="mt-2 text-sm text-gray-600">
            All markdown files across your packages
          </p>
        </div>
      </div>

      <div className="mt-8">
        {files && files.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {files.map((file) => {
                  const version = file.package_versions as any
                  const pkg = version?.packages as any

                  return (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="mr-3 h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {file.filename}
                            </div>
                            <div className="text-sm text-gray-500">{file.path}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {pkg ? (
                          <Link
                            href={`/dashboard/packages/${pkg.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {pkg.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">Unknown</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm text-gray-900">
                          v{version?.version || 'Unknown'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {(file.size_bytes / 1024).toFixed(1)} KB
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(file.updated_at || file.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No files yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload or create markdown files in your packages to see them here
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/packages"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <Package className="mr-2 h-4 w-4" />
                Go to Packages
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
