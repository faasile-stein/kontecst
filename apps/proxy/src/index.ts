// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from multiple locations (later files override earlier ones)
// Use __dirname to ensure we're loading from the correct location
// In tsx/ts-node, __dirname is available even in ES module mode
const envPaths = [
  // Monorepo root (go up from src/ to apps/proxy/ to apps/ to root/)
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../.env.local'),
  // App-specific (go up from src/ to apps/proxy/)
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../.env.local'),
]

// Load each .env file if it exists
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath })
    if (!result.error) {
      console.log(`✓ Loaded environment variables from: ${path.relative(process.cwd(), envPath)}`)
    }
  }
}

// Use dynamic imports to ensure env vars are loaded before any module that uses them
async function bootstrap() {
  const Fastify = (await import('fastify')).default
  const cors = (await import('@fastify/cors')).default
  const helmet = (await import('@fastify/helmet')).default
  const rateLimit = (await import('@fastify/rate-limit')).default
  const { fileRoutes } = await import('./routes/files.js')
  const { requestLogger } = await import('./middleware/logging.js')

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

  await start()
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
