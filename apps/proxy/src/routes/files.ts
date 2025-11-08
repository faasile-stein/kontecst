import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { retrieveFile, listFiles } from '../services/storage'
import { verifyAuth, checkPackageAccess, AuthenticatedRequest } from '../middleware/auth'

const FileParamsSchema = z.object({
  packageId: z.string(),
  version: z.string(),
  filename: z.string(),
})

const ListParamsSchema = z.object({
  packageId: z.string(),
  version: z.string(),
})

export async function fileRoutes(fastify: FastifyInstance) {
  // Retrieve a specific file
  fastify.get<{
    Params: z.infer<typeof FileParamsSchema>
  }>(
    '/files/:packageId/:version/:filename',
    {
      preHandler: async (request: AuthenticatedRequest, reply) => {
        await verifyAuth(request, reply)
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const params = FileParamsSchema.parse(request.params)

      const result = await retrieveFile(
        params.packageId,
        params.version,
        params.filename
      )

      if (!result) {
        return reply.code(404).send({ error: 'File not found' })
      }

      // Check access permissions
      const hasAccess = await checkPackageAccess(
        request.userId,
        params.packageId,
        result.metadata.isPublic
      )

      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      return reply
        .header('Content-Type', 'text/markdown')
        .header('X-Package-Id', params.packageId)
        .header('X-Version', params.version)
        .send(result.content)
    }
  )

  // List files in a package version
  fastify.get<{
    Params: z.infer<typeof ListParamsSchema>
  }>(
    '/files/:packageId/:version',
    {
      preHandler: async (request: AuthenticatedRequest, reply) => {
        await verifyAuth(request, reply)
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const params = ListParamsSchema.parse(request.params)

      const files = await listFiles(params.packageId, params.version)

      // Filter based on access permissions
      const accessibleFiles = []
      for (const file of files) {
        const hasAccess = await checkPackageAccess(
          request.userId,
          params.packageId,
          file.isPublic
        )
        if (hasAccess) {
          accessibleFiles.push(file)
        }
      }

      return { files: accessibleFiles }
    }
  )

  // Get file metadata
  fastify.head<{
    Params: z.infer<typeof FileParamsSchema>
  }>(
    '/files/:packageId/:version/:filename',
    {
      preHandler: async (request: AuthenticatedRequest, reply) => {
        await verifyAuth(request, reply)
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const params = FileParamsSchema.parse(request.params)

      const result = await retrieveFile(
        params.packageId,
        params.version,
        params.filename
      )

      if (!result) {
        return reply.code(404).send()
      }

      const hasAccess = await checkPackageAccess(
        request.userId,
        params.packageId,
        result.metadata.isPublic
      )

      if (!hasAccess) {
        return reply.code(403).send()
      }

      return reply
        .header('Content-Type', 'text/markdown')
        .header('Content-Length', result.content.length.toString())
        .header('X-Package-Id', params.packageId)
        .header('X-Version', params.version)
        .header('X-Created-At', result.metadata.createdAt)
        .send()
    }
  )
}
