import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
          <FileQuestion className="h-8 w-8 text-neutral-400" />
        </div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-neutral-700 mb-2">
          Page not found
        </h2>
        <p className="text-neutral-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>
        <div className="flex gap-2 justify-center">
          <Link href="/">
            <Button variant="primary">Go home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
