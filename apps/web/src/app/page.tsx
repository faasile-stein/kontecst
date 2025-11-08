import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Package,
  Search,
  TrendingUp,
  ArrowRight,
  FileText,
  GitBranch,
  Sparkles,
  Shield,
  Zap,
  Globe,
} from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-neutral-300 bg-white/80 backdrop-blur-sm">
        <div className="container-dashboard flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient shadow-sm">
              <span className="text-base font-bold text-white">K</span>
            </div>
            <span className="text-xl font-bold text-neutral-900">Kontecst</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">
                Marketplace
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="container-dashboard mx-auto">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-brand/5 px-4 py-2 text-sm font-medium text-brand">
              <Sparkles className="h-4 w-4" />
              Platform for versioned AI context
            </div>

            <h1 className="text-display mb-6 text-neutral-900">
              Structured Knowledge for{' '}
              <span className="text-brand-gradient">AI Agents</span>
            </h1>

            <p className="mb-10 text-xl leading-relaxed text-neutral-600">
              Curate, version, and serve Markdown documentation to LLMs via API or vector
              stores. Make complex context authoring simple and safe.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="secondary">
                  <Globe className="h-5 w-5" />
                  Explore Marketplace
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-neutral-600">
              No credit card required · Free tier available
            </p>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 right-0 h-[600px] w-[600px] rounded-full bg-brand/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-info/5 blur-3xl" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-neutral-100 px-6 py-20 sm:py-24">
        <div className="container-dashboard mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-h1 mb-4 text-neutral-900">
              Everything for AI Context Management
            </h2>
            <p className="text-lg text-neutral-600">
              Professional tools for developers and teams building with LLMs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="card group">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-gradient">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-h4 mb-2 text-neutral-900">Kontecst Packages</h3>
              <p className="text-neutral-600">
                Collections of Markdown files with metadata, immutable versioning, and
                semver support
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card group">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                <Sparkles className="h-6 w-6 text-info" />
              </div>
              <h3 className="text-h4 mb-2 text-neutral-900">Semantic Search</h3>
              <p className="text-neutral-600">
                AI-powered vector search with OpenAI embeddings, chunking strategies, and
                similarity tuning
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card group">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <GitBranch className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-h4 mb-2 text-neutral-900">GitHub Sync</h3>
              <p className="text-neutral-600">
                Automatic sync from GitHub repositories with branch tracking and
                auto-publishing
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card group">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <h3 className="text-h4 mb-2 text-neutral-900">Rich Markdown Editor</h3>
              <p className="text-neutral-600">
                Live preview, diff viewer, and AI-assisted editing with chunk management
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card group">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-danger/10">
                <TrendingUp className="h-6 w-6 text-danger" />
              </div>
              <h3 className="text-h4 mb-2 text-neutral-900">Usage Analytics</h3>
              <p className="text-neutral-600">
                Monitor package usage, API calls, and search performance with trend
                analysis
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card group">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800/90">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-h4 mb-2 text-neutral-900">Enterprise Security</h3>
              <p className="text-neutral-600">
                SSO/SAML, audit logs, dedicated databases, and multi-region data residency
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 py-20 sm:py-24">
        <div className="container-dashboard mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-h1 mb-4 text-neutral-900">Built for Every Scale</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-xl border border-neutral-300 bg-white p-8">
              <Zap className="mb-4 h-8 w-8 text-brand" />
              <h3 className="text-h3 mb-3 text-neutral-900">For AI Builders</h3>
              <p className="mb-4 text-neutral-600">
                Provide accurate, controlled context to your AI agents with version control
                and access management.
              </p>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-success">✓</span>
                  <span>Free tier for personal projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-success">✓</span>
                  <span>Public marketplace access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-success">✓</span>
                  <span>API and vector store serving</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-brand/20 bg-brand/5 p-8">
              <Package className="mb-4 h-8 w-8 text-brand" />
              <h3 className="text-h3 mb-3 text-neutral-900">For Teams</h3>
              <p className="mb-4 text-neutral-600">
                Collaborate on documentation with reviews, approvals, and role-based
                permissions.
              </p>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-success">✓</span>
                  <span>Team workspaces</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-success">✓</span>
                  <span>GitHub integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-success">✓</span>
                  <span>Advanced analytics</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-neutral-300 bg-white p-8">
              <Shield className="mb-4 h-8 w-8 text-brand" />
              <h3 className="text-h3 mb-3 text-neutral-900">For Enterprise</h3>
              <p className="mb-4 text-neutral-600">
                Private, secure, compliant knowledge base for internal AI with audit logging.
              </p>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-success">✓</span>
                  <span>SSO/SAML authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-success">✓</span>
                  <span>Dedicated databases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-success">✓</span>
                  <span>Multi-region deployment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-neutral-900 px-6 py-20 sm:py-24">
        <div className="container-dashboard mx-auto text-center">
          <h2 className="text-h1 mb-6 text-white">
            Ready to Build Better AI Agents?
          </h2>
          <p className="mb-10 text-xl text-neutral-300">
            Join developers using Kontecst to provide accurate, controlled context to
            their AI applications
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg">
                Start for Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="secondary">
                Explore Packages
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-300 bg-white px-6 py-12">
        <div className="container-dashboard mx-auto">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <span className="text-lg font-bold text-neutral-900">Kontecst</span>
            </div>
            <p className="text-sm text-neutral-600">
              © 2024 Kontecst. Platform for versioned AI context.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
