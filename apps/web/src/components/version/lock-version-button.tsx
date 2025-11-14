'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Lock, LockOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LockVersionButtonProps {
  packageId: string
  versionId: string
  isLocked: boolean
  lockedAt?: string | null
}

export function LockVersionButton({
  packageId,
  versionId,
  isLocked,
  lockedAt,
}: LockVersionButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggleLock = async () => {
    setLoading(true)
    setError(null)

    try {
      const method = isLocked ? 'DELETE' : 'POST'
      const response = await fetch(
        `/api/packages/${packageId}/versions/${versionId}/lock`,
        { method }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update lock status')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant={isLocked ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggleLock}
        disabled={loading}
      >
        {loading ? (
          <>
            {isLocked ? 'Unlocking...' : 'Generating changelog...'}
          </>
        ) : isLocked ? (
          <>
            <LockOpen className="mr-2 h-4 w-4" />
            Unlock
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Lock Version
          </>
        )}
      </Button>

      {error && (
        <div className="mt-2 rounded-md bg-red-50 p-2">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {isLocked && lockedAt && (
        <p className="mt-1 text-xs text-gray-500">
          Locked on {new Date(lockedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
