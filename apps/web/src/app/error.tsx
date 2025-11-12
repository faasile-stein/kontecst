'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/10 mb-4">
            <AlertCircle className="h-8 w-8 text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-neutral-600">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        <Alert variant="danger" className="mb-4">
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription className="mt-2 font-mono text-xs">
            {error.message || 'An unexpected error occurred'}
            {error.digest && (
              <span className="block mt-2 text-neutral-500">
                Error ID: {error.digest}
              </span>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="primary">
            Try again
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="secondary">
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
