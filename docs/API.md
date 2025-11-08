# Kontecst API Documentation

This document describes the Kontecst API endpoints.

## Base URLs

- **Production**: `https://kontecst.com/api`
- **File Proxy**: `https://proxy.kontecst.com/api`

## Authentication

All API requests require authentication using a JWT token from Supabase Auth or an API key.

### Using JWT Token

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://kontecst.com/api/packages
```

### Using API Key

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://kontecst.com/api/packages
```

## Endpoints

### Packages

#### List Packages

```http
GET /api/packages
```

Query parameters:
- `visibility` - Filter by visibility (public, private, internal)
- `organization_id` - Filter by organization
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Pagination offset

Response:
```json
{
  "packages": [
    {
      "id": "uuid",
      "name": "my-package",
      "slug": "my-package",
      "description": "Package description",
      "visibility": "public",
      "owner_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

#### Get Package

```http
GET /api/packages/:id
```

Response:
```json
{
  "id": "uuid",
  "name": "my-package",
  "slug": "my-package",
  "description": "Package description",
  "visibility": "public",
  "owner_id": "uuid",
  "versions": [
    {
      "version": "1.0.0",
      "is_published": true,
      "published_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Package

```http
POST /api/packages
```

Request body:
```json
{
  "name": "my-package",
  "slug": "my-package",
  "description": "Package description",
  "visibility": "public"
}
```

Response: 201 Created

#### Update Package

```http
PATCH /api/packages/:id
```

Request body:
```json
{
  "description": "Updated description",
  "visibility": "private"
}
```

Response: 200 OK

#### Delete Package

```http
DELETE /api/packages/:id
```

Response: 204 No Content

### Package Versions

#### List Versions

```http
GET /api/packages/:package_id/versions
```

Response:
```json
{
  "versions": [
    {
      "id": "uuid",
      "version": "1.0.0",
      "description": "Initial release",
      "is_published": true,
      "published_at": "2024-01-01T00:00:00Z",
      "file_count": 5,
      "total_size_bytes": 12345
    }
  ]
}
```

#### Get Version

```http
GET /api/packages/:package_id/versions/:version
```

Response:
```json
{
  "id": "uuid",
  "version": "1.0.0",
  "description": "Initial release",
  "is_published": true,
  "published_at": "2024-01-01T00:00:00Z",
  "files": [
    {
      "filename": "introduction.md",
      "path": "introduction.md",
      "size_bytes": 1234
    }
  ]
}
```

#### Create Version

```http
POST /api/packages/:package_id/versions
```

Request body:
```json
{
  "version": "1.0.0",
  "description": "Initial release",
  "changelog": "First release"
}
```

Response: 201 Created

#### Publish Version

```http
POST /api/packages/:package_id/versions/:version/publish
```

Response: 200 OK

### Files (via File Proxy)

#### Upload File

```http
POST /api/files
```

Request: `multipart/form-data`
```
file: <file>
packageId: <uuid>
version: <semver>
path: <relative-path>
```

Response:
```json
{
  "id": "uuid",
  "filename": "introduction.md",
  "path": "introduction.md",
  "size_bytes": 1234,
  "content_hash": "sha256-hash"
}
```

#### Retrieve File

```http
GET /api/files/:package_id/:version/:filename
```

Response: Raw markdown file

Headers:
- `Content-Type: text/markdown`
- `X-Package-Id: uuid`
- `X-Version: 1.0.0`

#### List Files

```http
GET /api/files/:package_id/:version
```

Response:
```json
{
  "files": [
    {
      "filename": "introduction.md",
      "path": "introduction.md",
      "size_bytes": 1234,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Search

#### Semantic Search

```http
POST /api/search
```

Request body:
```json
{
  "query": "How to authenticate users?",
  "package_id": "uuid",
  "limit": 10,
  "threshold": 0.7
}
```

Response:
```json
{
  "results": [
    {
      "id": "uuid",
      "file_id": "uuid",
      "content": "Matching content snippet...",
      "similarity": 0.92,
      "metadata": {
        "filename": "authentication.md",
        "package": "my-package",
        "version": "1.0.0"
      }
    }
  ]
}
```

### Feeds

#### List Feeds

```http
GET /api/feeds
```

Response:
```json
{
  "feeds": [
    {
      "id": "uuid",
      "name": "Public API Docs",
      "slug": "public-api-docs",
      "is_public": true,
      "packages": [
        {
          "package_id": "uuid",
          "name": "my-package"
        }
      ]
    }
  ]
}
```

#### Get Feed

```http
GET /api/feeds/:slug
```

Response:
```json
{
  "id": "uuid",
  "name": "Public API Docs",
  "slug": "public-api-docs",
  "description": "Public documentation feed",
  "is_public": true,
  "packages": [...]
}
```

#### Subscribe to Feed

```http
POST /api/feeds/:slug/subscribe
```

Response: 200 OK

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limits

- **Free tier**: 60 requests/minute
- **Team tier**: 300 requests/minute
- **Enterprise tier**: 1000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

```http
GET /api/packages?limit=20&offset=40
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "total": 100,
  "limit": 20,
  "offset": 40,
  "has_more": true
}
```

## Webhooks

Configure webhooks to receive events:

### Events

- `package.created`
- `package.updated`
- `package.deleted`
- `version.published`
- `version.unpublished`

### Webhook Payload

```json
{
  "event": "version.published",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "package_id": "uuid",
    "version": "1.0.0"
  }
}
```

### Signature Verification

Webhooks include a signature header:
```
X-Kontecst-Signature: sha256=...
```

Verify using your webhook secret:
```javascript
const crypto = require('crypto')
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex')
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { createClient } from '@kontecst/sdk'

const kontecst = createClient({
  apiKey: 'your-api-key'
})

// List packages
const packages = await kontecst.packages.list()

// Get file
const file = await kontecst.files.get('package-id', '1.0.0', 'intro.md')

// Search
const results = await kontecst.search({
  query: 'authentication',
  limit: 10
})
```

### Python

```python
from kontecst import KontecstClient

client = KontecstClient(api_key='your-api-key')

# List packages
packages = client.packages.list()

# Get file
file = client.files.get('package-id', '1.0.0', 'intro.md')

# Search
results = client.search(query='authentication', limit=10)
```

### cURL

```bash
# List packages
curl -H "X-API-Key: your-api-key" \
  https://kontecst.com/api/packages

# Get file
curl -H "X-API-Key: your-api-key" \
  https://proxy.kontecst.com/api/files/package-id/1.0.0/intro.md

# Search
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query":"authentication","limit":10}' \
  https://kontecst.com/api/search
```

## Support

- API Status: https://status.kontecst.com
- Documentation: https://docs.kontecst.com
- Support: support@kontecst.com
