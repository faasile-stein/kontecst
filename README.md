# Kontecst

> Platform for versioned, queryable context for AI agents—served via API or managed vector stores.

## What is Kontecst?

Kontecst lets developers and teams curate structured `.md` files, version them, and serve them to LLM agents as raw Markdown, via an API, or through fully managed vector stores backed by Postgres/pgvector.

### Key Features

- **Kontecst Packages** → Collections of `.md` files with metadata and versioning
- **Versioning** → Immutable snapshots on publish with semver
- **Kontecst Editor** → Guided, AI-assisted Markdown editor
- **Feeds** → Public or private distribution channels for knowledge
- **Multiple Serving Modes**:
  - Raw `.md` files
  - REST/GraphQL API
  - PostgreSQL vector store (shared or dedicated)
- **Embeddings Pipeline** → Automatic chunking, embedding, and indexing
- **Enterprise Features** → SSO, audit logs, dedicated databases, data residency

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/kontecst.git
cd kontecst

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/proxy/.env.example apps/proxy/.env

# Generate encryption key
openssl rand -hex 32

# Configure .env files with:
# - Supabase URL and keys (from your Supabase project)
# - OpenAI API key (for embeddings and semantic search)
# - Encryption key (generated above)

# Start local development environment
pnpm docker:up

# Start development servers
pnpm dev
```

This will start:
- Next.js web app on `http://localhost:3000`
- File proxy service on `http://localhost:3001`
- PostgreSQL with pgvector on `localhost:5432`

### Project Structure

```
kontecst/
├── apps/
│   ├── web/              # Next.js web application
│   └── proxy/            # File proxy service (Fastify)
├── packages/
│   ├── database/         # Supabase migrations and schema
│   └── shared/           # Shared types and utilities
├── docker/               # Docker configurations
└── docker-compose.yml    # Local development environment
```

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [API Documentation](./docs/API.md)

## Use Cases

### For AI Builders
Provide accurate, controlled context to your AI agents with version control and access management.

### For Enterprises
Private, secure, versioned knowledge base for internal AI agents with audit logging and compliance features.

### For Open Source Creators
Publish public "context packages" that users can subscribe to and query.

## Tech Stack

- **Frontend**: Next.js 14 (TypeScript, React, Tailwind CSS)
- **Backend**: Fastify (TypeScript, Node.js)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Deployment**: Vercel (frontend), Docker containers (proxy + dedicated DBs)
- **Auth**: Supabase Auth
- **Payments**: Stripe

## Roadmap

### Phase 1 - MVP ✅
- [x] Monorepo setup
- [x] Database schema
- [x] File proxy with encryption
- [x] Package creation & versioning
- [x] File upload system
- [x] Vector search (semantic + keyword)
- [x] API endpoints
- [x] Authentication (email + OAuth)
- [x] Dashboard UI
- [x] Embeddings generation

### Phase 2 - Team & Growth
- [ ] Rich editor with AI assistance
- [ ] Diff viewer
- [ ] Reviews/approvals
- [ ] Public marketplace
- [ ] Usage analytics
- [ ] GitHub sync

### Phase 3 - Enterprise
- [ ] Dedicated PostgreSQL instances
- [ ] Region selection
- [ ] Advanced semantic search
- [ ] Multi-region infrastructure
- [ ] SSO/SAML
- [ ] Audit trails

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- Documentation: [docs/](./docs/)
- Issues: [GitHub Issues](https://github.com/your-org/kontecst/issues)
- Discussions: [GitHub Discussions](https://github.com/your-org/kontecst/discussions)