import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, FileText, Search, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch user's packages
  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, description, created_at, visibility')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recent files
  const { data: recentFiles } = await supabase
    .from('files')
    .select('id, filename, created_at, package_versions(package_id, version)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your Kontecst packages and files
          </p>
        </div>
        <Link href="/dashboard/packages/new">
          <Button>
            <Package className="mr-2 h-4 w-4" />
            New Package
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Packages</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {packages?.length || 0}
              </p>
            </div>
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {recentFiles?.length || 0}
              </p>
            </div>
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Searches</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
            </div>
            <Search className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">API Calls</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
            </div>
            <TrendingUp className="h-12 w-12 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Recent Packages */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Packages</h2>
        </div>
        <div className="divide-y">
          {packages && packages.length > 0 ? (
            packages.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/dashboard/packages/${pkg.id}`}
                className="block px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{pkg.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      pkg.visibility === 'public'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {pkg.visibility}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No packages</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new package
              </p>
              <div className="mt-6">
                <Link href="/dashboard/packages/new">
                  <Button>
                    <Package className="mr-2 h-4 w-4" />
                    New Package
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Files */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Files</h2>
        </div>
        <div className="divide-y">
          {recentFiles && recentFiles.length > 0 ? (
            recentFiles.map((file) => (
              <div key={file.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{file.filename}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
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
                Upload files to your packages to see them here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
