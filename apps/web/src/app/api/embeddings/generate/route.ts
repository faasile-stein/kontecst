import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { processFileEmbeddings } from '@/lib/services/embeddings'
import { z } from 'zod'

const GenerateEmbeddingsSchema = z.object({
  fileId: z.string().uuid(),
  content: z.string().min(1),
})

/**
 * Generate embeddings for a file
 * This endpoint is called after a file is uploaded
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = GenerateEmbeddingsSchema.parse(body)

    // Get file information
    const { data: file } = await supabase
      .from('files')
      .select('package_version_id, package_versions(packages(owner_id))')
      .eq('id', validated.fileId)
      .single()

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if user owns the package
    const packageData = file.package_versions as any
    if (packageData?.packages?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate embeddings
    await processFileEmbeddings(
      validated.fileId,
      file.package_version_id,
      validated.content
    )

    return NextResponse.json({
      success: true,
      message: 'Embeddings generated successfully',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Embeddings generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
