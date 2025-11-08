import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, Search, TrendingUp, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900">Kontecst</h1>
        <p className="mt-6 max-w-2xl text-xl text-gray-600">
          Platform for versioned, queryable context for AI agents—served via API or
          managed vector stores
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button size="lg" variant="outline">
              Explore Marketplace
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Everything you need for AI context
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <Package className="h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Kontecst Packages
              </h3>
              <p className="mt-2 text-gray-600">
                Collections of .md files with metadata, versioned and curated for your
                AI agents
              </p>
            </div>
            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <Search className="h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Semantic Search
              </h3>
              <p className="mt-2 text-gray-600">
                AI-powered vector search using pgvector and OpenAI embeddings
              </p>
            </div>
            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <TrendingUp className="h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Usage Analytics
              </h3>
              <p className="mt-2 text-gray-600">
                Monitor package usage, API calls, and search performance in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Ready to build better AI agents?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join developers using Kontecst to provide accurate, controlled context to
            their AI applications
          </p>
          <div className="mt-8">
            <Link href="/auth/signup">
              <Button size="lg">Start for Free</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
