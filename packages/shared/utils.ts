/**
 * Validate semver version string
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
  return semverRegex.test(version)
}

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * Extract package and version from full package identifier
 * Example: "my-package@1.0.0" -> { package: "my-package", version: "1.0.0" }
 */
export function parsePackageIdentifier(identifier: string): {
  package: string
  version?: string
} {
  const parts = identifier.split('@')
  if (parts.length === 1) {
    return { package: parts[0] }
  }
  return {
    package: parts.slice(0, -1).join('@'),
    version: parts[parts.length - 1],
  }
}

/**
 * Check if a string is a valid markdown file
 */
export function isMarkdownFile(filename: string): boolean {
  return /\.(md|markdown)$/i.test(filename)
}
