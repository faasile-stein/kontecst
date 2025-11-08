// File size limits
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB per file
export const MAX_PACKAGE_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB per package

// Embedding settings
export const EMBEDDING_DIMENSION = 1536 // OpenAI text-embedding-3-small
export const EMBEDDING_CHUNK_SIZE = 512 // tokens
export const EMBEDDING_CHUNK_OVERLAP = 50 // tokens

// API rate limits (per minute)
export const RATE_LIMITS = {
  free: 60,
  team: 300,
  enterprise: 1000,
} as const

// Package visibility levels
export const PACKAGE_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  INTERNAL: 'internal',
} as const

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  TEAM: 'team',
  ENTERPRISE: 'enterprise',
} as const

// Pricing (USD per month)
export const PRICING = {
  [SUBSCRIPTION_TIERS.FREE]: 0,
  [SUBSCRIPTION_TIERS.TEAM]: 49,
  [SUBSCRIPTION_TIERS.ENTERPRISE]: 299,
  DEDICATED_DB: 99, // add-on per month
} as const
