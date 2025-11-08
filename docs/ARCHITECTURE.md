# Kontecst Architecture

This document describes the high-level architecture of Kontecst.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users / AI Agents                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel (Next.js App)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Editor     │  │  Dashboard   │  │  API Routes  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────┬────────────────────────────┬───────────────────┘
                 │                            │
                 │                            │
        ┌────────▼────────┐          ┌───────▼────────┐
        │   Supabase      │          │  File Proxy    │
        │                 │          │   (Fastify)    │
        │ ┌─────────────┐ │          │                │
        │ │ PostgreSQL  │ │          │  ┌──────────┐  │
        │ │ + pgvector  │ │          │  │Encryption│  │
        │ └─────────────┘ │          │  │  Layer   │  │
        │                 │          │  └──────────┘  │
        │ ┌─────────────┐ │          │                │
        │ │    Auth     │ │          │  ┌──────────┐  │
        │ └─────────────┘ │          │  │  Access  │  │
        │                 │          │  │  Control │  │
        │ ┌─────────────┐ │          │  └──────────┘  │
        │ │  Storage    │ │          │                │
        │ └─────────────┘ │          │  ┌──────────┐  │
        └─────────────────┘          │  │  Logging │  │
                                     │  └──────────┘  │
                                     └───────┬────────┘
                                             │
                                             ▼
                                     ┌───────────────┐
                                     │  File Storage │
                                     │  (Encrypted)  │
                                     └───────────────┘

        ┌─────────────────────────────────────────┐
        │   Dedicated PostgreSQL Instances        │
        │   (Docker Containers for Enterprise)    │
        │                                         │
        │  ┌──────────┐  ┌──────────┐  ┌────────┐│
        │  │ Org A DB │  │ Org B DB │  │  ...   ││
        │  └──────────┘  └──────────┘  └────────┘│
        └─────────────────────────────────────────┘
```

## Components

### 1. Next.js Web Application (Vercel)

**Location**: `apps/web/`

**Purpose**: User-facing web application providing the Kontecst Editor, dashboard, and API routes.

**Tech Stack**:
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Radix UI components
- Supabase Auth helpers

**Responsibilities**:
- User authentication and session management
- Package creation and management UI
- Markdown editor (Kontecst Editor)
- Package version control UI
- API endpoints for file operations
- Integration with Supabase for data persistence
- Integration with File Proxy for secure file access

### 2. File Proxy Service

**Location**: `apps/proxy/`

**Purpose**: Secure service for serving encrypted `.md` files with access control and logging.

**Tech Stack**:
- Fastify (Node.js framework)
- TypeScript
- Supabase client (for auth verification)
- Node.js crypto (AES-256-GCM encryption)

**Responsibilities**:
- Encrypt files at rest
- Decrypt files on authorized requests
- Verify user authentication via Supabase
- Check package access permissions
- Log all file access attempts
- Rate limiting
- File storage management

**Security Features**:
- AES-256-GCM encryption for all files at rest
- JWT token verification
- Row-level access control
- Comprehensive audit logging
- Rate limiting per user/tier
- Path traversal prevention

### 3. Supabase (PostgreSQL + Services)

**Location**: `packages/database/`

**Purpose**: Primary database, authentication, and backend services.

**Components**:
- **PostgreSQL 15** with pgvector extension
- **Supabase Auth** for user authentication
- **Row Level Security (RLS)** for data access control
- **Database Functions** for complex queries
- **Realtime** (optional, for collaborative editing)

**Schema**:
- `profiles` - User profiles
- `organizations` - Teams and companies
- `packages` - Kontecst packages
- `package_versions` - Immutable version snapshots
- `files` - File metadata (not content)
- `embeddings` - Vector embeddings for semantic search
- `package_access` - Access control lists
- `feeds` - Distribution channels
- `access_logs` - Audit logs
- `dedicated_databases` - Enterprise DB instances
- `subscriptions` - Stripe billing data
- `api_keys` - Programmatic access

### 4. Shared Packages

**Location**: `packages/shared/`

**Purpose**: Shared TypeScript types, utilities, and constants.

**Exports**:
- Zod schemas for validation
- TypeScript types
- Utility functions
- Constants (rate limits, pricing, etc.)

## Data Flow

### Package Creation Flow

```
1. User creates package in Web App
   ↓
2. Web App saves metadata to Supabase
   ↓
3. User uploads .md files
   ↓
4. Web App sends files to File Proxy
   ↓
5. File Proxy encrypts and stores files
   ↓
6. File Proxy returns storage paths
   ↓
7. Web App saves file metadata to Supabase
   ↓
8. Embeddings are generated (background job)
   ↓
9. Package is ready for querying
```

### File Retrieval Flow

```
1. AI Agent requests file via API
   ↓
2. Web App verifies authentication
   ↓
3. Web App checks package access in Supabase
   ↓
4. If authorized, redirects to File Proxy
   ↓
5. File Proxy verifies token again
   ↓
6. File Proxy checks access permissions
   ↓
7. File Proxy decrypts file
   ↓
8. File Proxy logs access
   ↓
9. File Proxy returns decrypted content
```

### Vector Search Flow

```
1. User/Agent submits search query
   ↓
2. Web App generates query embedding (OpenAI API)
   ↓
3. Web App queries Supabase embeddings table
   ↓
4. pgvector performs cosine similarity search
   ↓
5. Results filtered by RLS (access control)
   ↓
6. Top N results returned
   ↓
7. User/Agent can fetch full files via File Proxy
```

## Security Architecture

### Encryption at Rest

- All `.md` files stored encrypted using **AES-256-GCM**
- Encryption keys stored as environment variables (never in database)
- Each file has unique IV and auth tag
- Files stored as JSON with metadata

### Access Control

**Multiple layers**:
1. **Authentication** - Supabase JWT tokens
2. **Row Level Security** - PostgreSQL RLS policies
3. **Application Layer** - File Proxy permission checks
4. **API Keys** - For programmatic access

### Audit Logging

All file access logged with:
- Timestamp
- User ID
- IP address
- User agent
- Request method/path
- Response status
- Duration

Logs stored in:
1. PostgreSQL (`access_logs` table) for queryability
2. File Proxy stdout for real-time monitoring

## Scalability

### Horizontal Scaling

- **Web App**: Auto-scales on Vercel
- **File Proxy**: Can run multiple instances behind load balancer
- **Supabase**: Managed scaling

### Dedicated Databases

For enterprise customers:
- Spin up dedicated PostgreSQL containers
- Isolated data and resources
- Custom resource allocation
- Region selection for data residency

### Caching Strategy

- **CDN**: Static assets via Vercel Edge
- **API Routes**: Cached responses for public packages
- **Vector Search**: Result caching (Redis, future)
- **File Proxy**: ETag support for file caching

## Deployment Architecture

### Development

```
Local Machine
├── Next.js dev server (localhost:3000)
├── File Proxy dev server (localhost:3001)
└── Docker Compose
    ├── PostgreSQL + pgvector (localhost:5432)
    └── pgAdmin (localhost:5050)
```

### Production

```
├── Vercel (Next.js App)
│   ├── Edge Functions
│   └── Serverless Functions
│
├── Supabase Cloud
│   ├── PostgreSQL
│   ├── Auth
│   └── Storage
│
├── File Proxy Cluster
│   ├── AWS ECS / Docker Swarm
│   ├── Load Balancer
│   └── Persistent Volume (EFS)
│
└── Dedicated DB Cluster
    ├── Docker Swarm / Kubernetes
    └── Per-org PostgreSQL containers
```

## Technology Decisions

### Why Supabase?

- PostgreSQL with pgvector for vector search
- Built-in auth with JWT
- Row Level Security for fine-grained access control
- Real-time capabilities (future)
- Managed backups and scaling
- Great developer experience

### Why Separate File Proxy?

- Security isolation (encryption layer separate from web app)
- Independent scaling
- Detailed access logging
- Can run in restricted network zones
- Flexibility for dedicated instances

### Why Monorepo?

- Shared types between frontend and backend
- Single version of dependencies
- Easier local development
- Atomic commits across multiple packages

### Why pgvector?

- Native PostgreSQL extension
- No separate vector database to manage
- Leverage existing RLS for access control
- ACID guarantees
- Cost-effective

## Future Enhancements

- **GraphQL API** (Apollo Server)
- **Real-time collaboration** (Supabase Realtime)
- **Reranking** for search results
- **Multi-region** file proxy
- **CDN integration** for public packages
- **Webhook support** for package updates
- **GitHub Actions integration** for CI/CD publishing
