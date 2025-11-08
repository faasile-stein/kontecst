'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Search,
  Package,
  FileText,
  Sparkles,
  SlidersHorizontal,
  Calendar,
  X,
} from 'lucide-react'

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
  created_at?: string
}

interface PackageOption {
  id: string
  name: string
  slug: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<'semantic' | 'keyword'>(
    'semantic'
  )

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false)
  const [threshold, setThreshold] = useState(0.7)
  const [limit, setLimit] = useState(20)
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance')

  // Available packages for filtering
  const [packages, setPackages] = useState<PackageOption[]>([])

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages')
      if (!response.ok) throw new Error('Failed to fetch packages')

      const data = await response.json()
      setPackages(data)
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setError(null)
    setLoading(true)

    try {
      let response

      if (searchType === 'semantic') {
        // Semantic search using vector embeddings
        const body: any = {
          query: query.trim(),
          limit,
          threshold,
        }

        if (selectedPackages.length > 0) {
          body.packageIds = selectedPackages
        }

        if (dateFrom) {
          body.dateFrom = dateFrom
        }

        if (dateTo) {
          body.dateTo = dateTo
        }

        if (sortBy) {
          body.sortBy = sortBy
        }

        response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        // Keyword search
        const params = new URLSearchParams({
          query: query.trim(),
          limit: limit.toString(),
        })

        if (selectedPackages.length > 0) {
          params.append('packageIds', selectedPackages.join(','))
        }

        if (dateFrom) {
          params.append('dateFrom', dateFrom)
        }

        if (dateTo) {
          params.append('dateTo', dateTo)
        }

        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        response = await fetch(`/api/search?${params.toString()}`)
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

  const resetFilters = () => {
    setThreshold(0.7)
    setLimit(20)
    setSelectedPackages([])
    setDateFrom('')
    setDateTo('')
    setSortBy('relevance')
  }

  const hasActiveFilters =
    threshold !== 0.7 ||
    limit !== 20 ||
    selectedPackages.length > 0 ||
    dateFrom ||
    dateTo ||
    sortBy !== 'relevance'

  return (
    <div className="mx-auto max-w-4xl p-6">
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

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              Search type:
            </span>
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

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                !
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Advanced Filters
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Similarity Threshold (Semantic only) */}
              {searchType === 'semantic' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Similarity Threshold: {(threshold * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="mt-2 w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Higher values = more precise matches
                  </p>
                </div>
              )}

              {/* Results Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Results per page
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Package Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Filter by package
                </label>
                <select
                  multiple
                  value={selectedPackages}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                    setSelectedPackages(selected)
                  }}
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                  size={4}
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl/Cmd to select multiple
                </p>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'relevance' | 'date')
                  }
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date (Newest first)</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date from
                </label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date to
                </label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
            {selectedPackages.length > 0 && (
              <span> in {selectedPackages.length} package(s)</span>
            )}
          </p>

          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{result.package.name}</span>
                      <span>·</span>
                      <span className="font-mono">
                        v{result.package.version}
                      </span>
                      <span>·</span>
                      <FileText className="h-4 w-4" />
                      <span>{result.file.filename}</span>
                    </div>

                    <p className="mt-3 leading-relaxed text-gray-900">
                      {result.content}
                    </p>

                    {result.similarity !== undefined && (
                      <div className="mt-3 flex items-center space-x-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${result.similarity * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {(result.similarity * 100).toFixed(0)}% match
                        </span>
                      </div>
                    )}

                    {result.created_at && (
                      <p className="mt-2 text-xs text-gray-500">
                        Created {new Date(result.created_at).toLocaleDateString()}
                      </p>
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
                  <span className="text-sm text-gray-500">
                    {result.file.path}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && query && results.length === 0 && !error && (
        <div className="mt-12 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No results found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search query or changing the filters
          </p>
        </div>
      )}
    </div>
  )
}
