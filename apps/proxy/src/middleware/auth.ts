import { FastifyRequest, FastifyReply } from 'fastify'
import { createClient } from '@supabase/supabase-js'

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl) {
  throw new Error(
    'SUPABASE_URL environment variable is required. Please set it in your .env file.'
  )
}

if (!supabaseServiceKey) {
  throw new Error(
    'SUPABASE_SERVICE_KEY environment variable is required. Please set it in your .env file.'
  )
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: string
  isAuthenticated: boolean
}

/**
 * Verify JWT token from Authorization header
 */
export async function verifyAuth(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    request.isAuthenticated = false
    return
  }

  const token = authHeader.substring(7)

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      request.isAuthenticated = false
      return
    }

    request.userId = data.user.id
    request.isAuthenticated = true
  } catch (error) {
    request.log.error({ error }, 'Auth verification failed')
    request.isAuthenticated = false
  }
}

/**
 * Check if user has access to a specific package version
 */
export async function checkPackageAccess(
  userId: string | undefined,
  packageId: string,
  isPublic: boolean
): Promise<boolean> {
  // Public packages are accessible to everyone
  if (isPublic) {
    return true
  }

  // Private packages require authentication
  if (!userId) {
    return false
  }

  // Check database for package access permissions
  const { data, error } = await supabase
    .from('package_access')
    .select('*')
    .eq('package_id', packageId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return false
  }

  return true
}
