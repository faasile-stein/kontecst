import { SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="container-dashboard">
      <div className="mb-8">
        <SkeletonText lines={1} className="w-1/3 mb-2" />
        <SkeletonText lines={1} className="w-1/2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Recent Packages */}
      <div className="mb-8">
        <SkeletonText lines={1} className="w-1/4 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
