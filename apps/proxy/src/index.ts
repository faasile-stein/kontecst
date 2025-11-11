// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv'
import path from 'path'

// Load .env from current working directory (pnpm runs this from apps/proxy/)
// Using process.cwd() instead of __dirname for tsx compatibility
dotenv.config({ path: path.join(process.cwd(), '.env') })

import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { fileRoutes } from './routes/files'
import { requestLogger } from './middleware/logging'

const PORT = parseInt(process.env.PORT || '3001', 10)
const NODE_ENV = process.env.NODE_ENV || 'development'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
})

async function start() {
  try {
    // Register plugins
    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    })

    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    })

    // Register middleware
    fastify.addHook('onRequest', requestLogger)

    // Register routes
    await fastify.register(fileRoutes, { prefix: '/api' })

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    })

    await fastify.listen({ port: PORT, host: '0.0.0.0' })

    fastify.log.info(`🚀 Kontecst File Proxy running on port ${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  fastify.log.info('Shutting down gracefully...')
  await fastify.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

start()
