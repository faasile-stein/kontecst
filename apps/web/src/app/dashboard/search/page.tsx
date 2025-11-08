'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Search, Package, FileText, Sparkles } from 'lucide-react'

interface SearchResult {
  id: string
  content: string
  similarity?: number
  file: {
    filename: string
    path: string
  }
  package: {
    name: string
    slug: string
    version: string
  }
  metadata?: any
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<'semantic' | 'keyword'>('semantic')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setError(null)
    setLoading(true)

    try {
      let response

      if (searchType === 'semantic') {
        // Semantic search using vector embeddings
        response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query.trim(),
            limit: 20,
            threshold: 0.7,
          }),
        })
      } else {
        // Keyword search
        response = await fetch(
          `/api/search?query=${encodeURIComponent(query.trim())}&limit=20`
        )
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search</h1>
        <p className="mt-2 text-sm text-gray-600">
          Search across all your packages using semantic or keyword search
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your documentation..."
              className="block w-full rounded-md border border-gray-300 py-3 pl-10 pr-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Search type:</span>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="semantic"
              checked={searchType === 'semantic'}
              onChange={(e) => setSearchType(e.target.value as 'semantic')}
              className="mr-2"
            />
            <Sparkles className="mr-1 h-4 w-4 text-primary" />
            <span className="text-sm">Semantic (AI-powered)</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="keyword"
              checked={searchType === 'keyword'}
              onChange={(e) => setSearchType(e.target.value as 'keyword')}
              className="mr-2"
            />
            <span className="text-sm">Keyword</span>
          </label>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-600">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{result.package.name}</span>
                      <span>·</span>
                      <span className="font-mono">v{result.package.version}</span>
                      <span>·</span>
                      <FileText className="h-4 w-4" />
                      <span>{result.file.filename}</span>
                    </div>

                    <p className="mt-3 text-gray-900 leading-relaxed">
                      {result.content}
                    </p>

                    {result.similarity !== undefined && (
                      <div className="mt-3 flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${result.similarity * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {(result.similarity * 100).toFixed(0)}% match
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <a
                    href={`/dashboard/packages/${result.package.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View package
                  </a>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm text-gray-500">{result.file.path}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && query && results.length === 0 && !error && (
        <div className="mt-12 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search query or changing the search type
          </p>
        </div>
      )}
    </div>
  )
}
