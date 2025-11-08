import { FastifyRequest, FastifyReply } from 'fastify'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

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
