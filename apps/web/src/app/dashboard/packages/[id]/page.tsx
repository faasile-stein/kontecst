import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Upload, Plus, FilePlus } from 'lucide-react'

export default async function PackageDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: pkg } = await supabase
    .from('packages')
    .select(
      `
      *,
      owner:profiles!packages_owner_id_fkey(id, full_name, email),
      package_versions (
        id,
        version,
        is_published,
        published_at,
        file_count,
        total_size_bytes,
        created_at
      )
    `
    )
    .eq('id', params.id)
    .single()

  if (!pkg) {
    notFound()
  }

  const versions = (pkg.package_versions as any[]) || []

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/packages"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to packages
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pkg.name}</h1>
            <p className="mt-2 text-sm text-gray-600">{pkg.description}</p>
            <div className="mt-4 flex items-center space-x-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  pkg.visibility === 'public'
                    ? 'bg-green-100 text-green-800'
                    : pkg.visibility === 'internal'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {pkg.visibility}
              </span>
              <span className="text-sm text-gray-500">
                Created by {(pkg.owner as any)?.full_name || 'Unknown'}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(pkg.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/dashboard/packages/${pkg.id}/files/new`}>
              <Button>
                <FilePlus className="mr-2 h-4 w-4" />
                Create File
              </Button>
            </Link>
            <Link href={`/dashboard/packages/${pkg.id}/upload`}>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </Link>
            <Link href={`/dashboard/packages/${pkg.id}/settings`}>
              <Button variant="outline">Settings</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Versions</h2>
            <Link href={`/dashboard/packages/${pkg.id}/versions/new`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Version
              </Button>
            </Link>
          </div>
        </div>

        <div className="divide-y">
          {versions.length > 0 ? (
            versions.map((version: any) => (
              <div key={version.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="font-mono text-sm font-semibold text-gray-900">
                        v{version.version}
                      </h3>
                      {version.is_published && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Published
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{version.file_count} files</span>
                      <span>
                        {version.total_size_bytes
                          ? `${(version.total_size_bytes / 1024).toFixed(1)} KB`
                          : '0 KB'}
                      </span>
                      <span>
                        {version.published_at
                          ? `Published ${new Date(version.published_at).toLocaleDateString()}`
                          : `Created ${new Date(version.created_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                  <Link href={`/dashboard/packages/${pkg.id}/versions/${version.version}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No versions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first version to get started
              </p>
              <div className="mt-6">
                <Link href={`/dashboard/packages/${pkg.id}/versions/new`}>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Version
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
