import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, Download, Star, GitBranch, FileText, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default async function MarketplacePackagePage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()

  // Get package by slug
  const { data: pkg } = await supabase
    .from('packages')
    .select(
      `
      *,
      profiles!packages_owner_id_fkey(full_name, email, avatar_url),
      package_versions(
        id,
        version,
        description,
        changelog,
        is_published,
        published_at,
        file_count,
        total_size_bytes
      )
    `
    )
    .eq('slug', params.slug)
    .eq('visibility', 'public')
    .single()

  if (!pkg) {
    notFound()
  }

  const publishedVersions = (pkg.package_versions as any[])?.filter(
    (v) => v.is_published
  ) || []
  const latestVersion = publishedVersions[0]

  // Get README file if exists
  const readmeFile = latestVersion
    ? await supabase
        .from('files')
        .select('content_hash, path')
        .eq('package_version_id', latestVersion.id)
        .or('filename.eq.README.md,filename.eq.readme.md')
        .single()
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <div className="flex items-start space-x-4">
                <Package className="h-12 w-12 text-primary" />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{pkg.name}</h1>
                  <p className="mt-2 text-gray-600">{pkg.description}</p>

                  <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>0 downloads</span>
                    </div>
                    {latestVersion && (
                      <div className="flex items-center space-x-2">
                        <GitBranch className="h-4 w-4" />
                        <span className="font-mono">v{latestVersion.version}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{latestVersion?.file_count || 0} files</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* README */}
              <div className="mt-8 border-t pt-8">
                <h2 className="text-xl font-semibold text-gray-900">README</h2>
                <div className="prose prose-sm mt-4 max-w-none">
                  {readmeFile ? (
                    <p className="text-gray-500">
                      README content would be displayed here
                    </p>
                  ) : (
                    <p className="text-gray-500">No README file found</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Install */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Install</h3>
              <div className="mt-4">
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Package
                </Button>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-700">Or use the API:</p>
                <pre className="mt-2 rounded bg-gray-100 p-3 text-xs">
                  <code>
                    curl https://api.kontecst.com/packages/{pkg.slug}
                  </code>
                </pre>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Statistics</h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Downloads</span>
                  <span className="font-medium text-gray-900">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stars</span>
                  <span className="font-medium text-gray-900">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Versions</span>
                  <span className="font-medium text-gray-900">
                    {publishedVersions.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size</span>
                  <span className="font-medium text-gray-900">
                    {latestVersion?.total_size_bytes
                      ? `${(latestVersion.total_size_bytes / 1024).toFixed(1)} KB`
                      : '0 KB'}
                  </span>
                </div>
              </div>
            </div>

            {/* Author */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Author</h3>
              <div className="mt-4 flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    {pkg.profiles?.full_name?.charAt(0) ||
                      pkg.profiles?.email?.charAt(0) ||
                      'A'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {pkg.profiles?.full_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-gray-500">{pkg.profiles?.email}</p>
                </div>
              </div>
            </div>

            {/* Versions */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Versions</h3>
              <div className="mt-4 space-y-2">
                {publishedVersions.slice(0, 5).map((version: any) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-mono text-gray-900">v{version.version}</span>
                    <span className="text-gray-500">
                      {new Date(version.published_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {publishedVersions.length > 5 && (
                  <p className="text-xs text-gray-500">
                    +{publishedVersions.length - 5} more versions
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
