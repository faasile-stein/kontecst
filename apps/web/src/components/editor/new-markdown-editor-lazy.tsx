'use client'

import dynamic from 'next/dynamic'

// Lazy load the markdown editor with a loading skeleton
export const NewMarkdownEditorLazy = dynamic(
  () => import('./new-markdown-editor').then((mod) => ({ default: mod.NewMarkdownEditor })),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading editor...</p>
        </div>
      </div>
    ),
    ssr: false, // Disable SSR for the editor component
  }
)
