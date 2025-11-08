import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Package, Download, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function MarketplacePage() {
  const supabase = await createClient()

  // Get all public packages
  const { data: packages } = await supabase
    .from('packages')
    .select(
      `
      *,
      profiles!packages_owner_id_fkey(full_name, email),
      package_versions(id, version, is_published, file_count)
    `
    )
    .eq('visibility', 'public')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  // Filter to only show packages with published versions
  const publishedPackages = packages?.filter((pkg: any) => {
    const versions = pkg.package_versions || []
    return versions.some((v: any) => v.is_published)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Kontecst Marketplace</h1>
            <p className="mt-4 text-xl text-gray-600">
              Discover and share curated context packages for AI agents
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-2xl">
              <input
                type="search"
                placeholder="Search packages..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b bg-white py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {publishedPackages?.length || 0}
              </p>
              <p className="mt-1 text-sm text-gray-600">Public Packages</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-gray-600">Total Downloads</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-gray-600">Contributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="container mx-auto px-6 py-12">
        {publishedPackages && publishedPackages.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publishedPackages.map((pkg: any) => {
              const latestVersion = pkg.package_versions?.find(
                (v: any) => v.is_published
              ) || pkg.package_versions?.[0]

              return (
                <div
                  key={pkg.id}
                  className="group rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <Package className="h-10 w-10 text-primary" />
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Public
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary">
                    {pkg.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {pkg.description || 'No description provided'}
                  </p>

                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Download className="h-4 w-4" />
                      <span>0</span>
                    </div>
                    {latestVersion && (
                      <div className="flex items-center space-x-1">
                        <span className="font-mono">v{latestVersion.version}</span>
                      </div>
                    )}
                    {latestVersion?.file_count > 0 && (
                      <div className="flex items-center space-x-1">
                        <span>{latestVersion.file_count} files</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs text-gray-500">
                      By {pkg.profiles?.full_name || pkg.profiles?.email || 'Anonymous'}
                    </p>
                  </div>

                  <div className="mt-4">
                    <Link href={`/marketplace/${pkg.slug}`}>
                      <Button className="w-full" size="sm">
                        View Package
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No public packages yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Be the first to publish a package to the marketplace!
            </p>
            <div className="mt-6">
              <Link href="/dashboard/packages/new">
                <Button>Create Package</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Categories (placeholder for future) */}
      <div className="border-t bg-white py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {['Documentation', 'API Reference', 'Tutorials', 'Guides'].map(
              (category) => (
                <button
                  key={category}
                  className="rounded-lg border bg-white p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <p className="font-medium text-gray-900">{category}</p>
                  <p className="mt-1 text-sm text-gray-500">0 packages</p>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
