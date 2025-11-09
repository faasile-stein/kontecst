import { FastifyRequest, FastifyReply } from 'fastify'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/**
 * Log all requests for audit purposes
 */
export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now()

  // Store start time on request object for later use
  ;(request as any).startTime = startTime

  // Use reply's onSend hook to log after response is sent
  reply.raw.on('finish', () => {
    const duration = Date.now() - startTime

    // Log to stdout
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    })

    // Store access logs in database (fire and forget)
    if (request.url.startsWith('/api/files')) {
      storeAccessLog({
        method: request.method,
        path: request.url,
        statusCode: reply.statusCode,
        duration,
        ip: request.ip,
        userAgent: request.headers['user-agent'] || null,
        userId: (request as any).userId || null,
      }).catch((error: Error) => {
        request.log.error({ error }, 'Failed to store access log')
      })
    }
  })
}

interface AccessLog {
  method: string
  path: string
  statusCode: number
  duration: number
  ip: string
  userAgent: string | null
  userId: string | null
}

async function storeAccessLog(log: AccessLog): Promise<void> {
  await supabase.from('access_logs').insert({
    method: log.method,
    path: log.path,
    status_code: log.statusCode,
    duration_ms: log.duration,
    ip_address: log.ip,
    user_agent: log.userAgent,
    user_id: log.userId,
    created_at: new Date().toISOString(),
  })
}
