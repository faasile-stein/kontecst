import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, GitCompare, Lock } from 'lucide-react'
import { DownloadButton } from '@/components/version/download-button'
import { VersionFilesSection } from '@/components/version/version-files-section'
import { LockVersionButton } from '@/components/version/lock-version-button'
import { CopyLinkButton } from '@/components/ui/copy-link-button'
import { headers } from 'next/headers'

export default async function VersionDetailPage({
  params,
}: {
  params: { id: string; version: string }
}) {
  const supabase = await createClient()

  // Get package info
  const { data: pkg } = await supabase
    .from('packages')
    .select('id, name, slug, visibility')
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
    .select('id, filename, path, content, size_bytes, token_count')
    .eq('package_version_id', version.id)
    .order('path', { ascending: true })

  // Construct public URL if package is public
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const publicUrl = pkg.visibility === 'public'
    ? `${protocol}://${host}/marketplace/${pkg.slug}`
    : null

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
              {version.is_locked && (
                <span className="flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                  <Lock className="mr-1 h-3 w-3" />
                  Locked
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{pkg.name}</p>
            {version.description && (
              <p className="mt-2 text-gray-700">{version.description}</p>
            )}
          </div>

          <div className="flex space-x-2">
            {publicUrl && (
              <CopyLinkButton
                url={publicUrl}
                label="Share"
                size="sm"
              />
            )}
            <LockVersionButton
              packageId={params.id}
              versionId={version.id}
              isLocked={version.is_locked}
              lockedAt={version.locked_at}
            />
            <DownloadButton
              packageName={pkg.slug}
              version={version.version}
              files={files || []}
            />
            <Link href={`/dashboard/packages/${params.id}/versions/compare`}>
              <Button variant="outline" size="sm">
                <GitCompare className="mr-2 h-4 w-4" />
                Compare
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-4">
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
            <p className="text-sm text-gray-600">Tokens</p>
            <p className="text-2xl font-semibold text-gray-900">
              {version.total_token_count
                ? `~${version.total_token_count.toLocaleString()}`
                : '~0'}
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

      <VersionFilesSection
        files={files || []}
        packageId={pkg.id}
        packageSlug={pkg.slug}
        versionId={version.id}
        isPublic={pkg.visibility === 'public'}
        isPublished={version.is_published}
        baseUrl={publicUrl || ''}
      />
    </div>
  )
}
