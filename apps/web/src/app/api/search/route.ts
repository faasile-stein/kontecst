import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateEmbedding } from '@/lib/services/llm-client'

const SearchSchema = z.object({
  query: z.string().min(1),
  packageId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
})

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
    const validated = SearchSchema.parse(body)

    // Generate embedding for the search query using the user's configured LLM provider
    const queryEmbedding = await generateEmbedding(user.id, validated.query)

    // Convert embedding to PostgreSQL vector format
    const embeddingString = `[${queryEmbedding.join(',')}]`

    // Call the search_embeddings function
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: embeddingString,
      match_threshold: validated.threshold,
      match_count: validated.limit,
      filter_package_id: validated.packageId || null,
    })

    if (error) throw error

    // Enhance results with file and package information
    const enhancedResults = await Promise.all(
      (data || []).map(async (result: any) => {
        // Get file information
        const { data: file } = await supabase
          .from('files')
          .select('filename, path, package_version_id')
          .eq('id', result.file_id)
          .single()

        // Get package version information
        const { data: version } = await supabase
          .from('package_versions')
          .select('version, package_id, packages(name, slug)')
          .eq('id', result.package_version_id)
          .single()

        return {
          id: result.id,
          content: result.content,
          similarity: result.similarity,
          file: file
            ? {
                filename: file.filename,
                path: file.path,
              }
            : null,
          package: version
            ? {
                name: (version.packages as any).name,
                slug: (version.packages as any).slug,
                version: version.version,
              }
            : null,
          metadata: result.metadata,
        }
      })
    )

    return NextResponse.json({
      results: enhancedResults,
      query: validated.query,
      count: enhancedResults.length,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Simple keyword search fallback
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const packageId = searchParams.get('packageId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Search in file content using PostgreSQL full-text search
    let searchQuery = supabase
      .from('embeddings')
      .select(
        `
        id,
        content,
        file_id,
        package_version_id,
        files!inner(filename, path),
        package_versions!inner(version, packages!inner(name, slug))
      `
      )
      .textSearch('content', query)
      .limit(limit)

    if (packageId) {
      searchQuery = searchQuery.eq('package_versions.package_id', packageId)
    }

    const { data, error } = await searchQuery

    if (error) throw error

    const results = (data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      file: {
        filename: item.files.filename,
        path: item.files.path,
      },
      package: {
        name: item.package_versions.packages.name,
        slug: item.package_versions.packages.slug,
        version: item.package_versions.version,
      },
    }))

    return NextResponse.json({
      results,
      query,
      count: results.length,
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
