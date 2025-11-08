# @kontecst/database

Database schemas, migrations, and types for Kontecst.

## Supabase Migrations

The migrations are located in `supabase/migrations/`. To apply them:

### Local Development

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Generate TypeScript types
pnpm generate-types
```

### Production

Migrations are automatically applied when you push to Supabase:

```bash
supabase db push
```

## Schema Overview

- **profiles**: User profiles extending Supabase Auth
- **organizations**: Teams and companies
- **packages**: Kontecst packages (collections of .md files)
- **package_versions**: Immutable version snapshots
- **files**: File metadata (actual files stored encrypted via proxy)
- **embeddings**: Vector embeddings for semantic search
- **package_access**: Access control lists
- **feeds**: Public/private distribution channels
- **access_logs**: Audit logs from file proxy
- **dedicated_databases**: Enterprise dedicated DB instances
- **subscriptions**: Stripe subscription tracking
- **api_keys**: Programmatic API access

## Vector Search

The `embeddings` table uses pgvector for semantic search. Use the `search_embeddings()` function:

```sql
SELECT * FROM search_embeddings(
  query_embedding := '[...]'::vector(1536),
  match_threshold := 0.7,
  match_count := 10,
  filter_package_id := 'uuid-here'
);
```
