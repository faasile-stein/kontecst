import { z } from 'zod'

// Package visibility
export const PackageVisibilitySchema = z.enum(['public', 'private', 'internal'])
export type PackageVisibility = z.infer<typeof PackageVisibilitySchema>

// Subscription tiers
export const SubscriptionTierSchema = z.enum(['free', 'team', 'enterprise'])
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>

// Package schema
export const PackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  ownerId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  visibility: PackageVisibilitySchema,
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Package = z.infer<typeof PackageSchema>

// Package version schema
export const PackageVersionSchema = z.object({
  id: z.string().uuid(),
  packageId: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // semver
  description: z.string().optional(),
  changelog: z.string().optional(),
  isPublished: z.boolean(),
  publishedAt: z.string().optional(),
  publishedBy: z.string().uuid().optional(),
  fileCount: z.number().int().min(0),
  totalSizeBytes: z.number().int().min(0),
  createdAt: z.string(),
})
export type PackageVersion = z.infer<typeof PackageVersionSchema>

// File metadata schema
export const FileMetadataSchema = z.object({
  id: z.string().uuid(),
  packageVersionId: z.string().uuid(),
  filename: z.string(),
  path: z.string(),
  contentHash: z.string(),
  sizeBytes: z.number().int().min(0),
  mimeType: z.string(),
  storagePath: z.string(),
  createdAt: z.string(),
})
export type FileMetadata = z.infer<typeof FileMetadataSchema>

// Search result schema
export const SearchResultSchema = z.object({
  id: z.string().uuid(),
  fileId: z.string().uuid(),
  packageVersionId: z.string().uuid(),
  content: z.string(),
  similarity: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional(),
})
export type SearchResult = z.infer<typeof SearchResultSchema>

// API error schema
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
})
export type ApiError = z.infer<typeof ApiErrorSchema>
