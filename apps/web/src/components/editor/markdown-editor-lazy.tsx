'use client'

import dynamic from 'next/dynamic'
import { Spinner } from '@/components/ui/spinner'

// Lazy load the markdown editor with a loading skeleton
export const MarkdownEditorLazy = dynamic(
  () => import('./markdown-editor').then((mod) => ({ default: mod.MarkdownEditor })),
  {
    loading: () => (
      <div className="flex h-[600px] items-center justify-center border rounded-lg bg-white">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-neutral-600">Loading editor...</p>
        </div>
      </div>
    ),
    ssr: false, // Disable SSR for the editor component
  }
)
