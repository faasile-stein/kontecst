import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, Plus } from 'lucide-react'

export default async function PackagesPage() {
  const supabase = await createClient()

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your Kontecst packages and versions
          </p>
        </div>
        <Link href="/dashboard/packages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Package
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        {packages && packages.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/dashboard/packages/${pkg.id}`}
                className="group rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <Package className="h-8 w-8 text-gray-400 group-hover:text-primary" />
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      pkg.visibility === 'public'
                        ? 'bg-green-100 text-green-800'
                        : pkg.visibility === 'internal'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {pkg.visibility}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{pkg.name}</h3>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  {pkg.description || 'No description'}
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Created {new Date(pkg.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No packages yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first package
            </p>
            <div className="mt-6">
              <Link href="/dashboard/packages/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Package
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
