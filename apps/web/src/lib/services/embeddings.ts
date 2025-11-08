import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const CHUNK_SIZE = 512 // tokens (approximate)
const CHUNK_OVERLAP = 50 // tokens

interface EmbeddingChunk {
  content: string
  index: number
  metadata?: any
}

/**
 * Split text into chunks for embedding
 */
export function chunkText(text: string, chunkSize = CHUNK_SIZE): EmbeddingChunk[] {
  // Simple chunking by characters (rough approximation of tokens)
  // In production, use a proper tokenizer like tiktoken
  const avgCharsPerToken = 4
  const chunkChars = chunkSize * avgCharsPerToken
  const overlapChars = CHUNK_OVERLAP * avgCharsPerToken

  const chunks: EmbeddingChunk[] = []
  let startIndex = 0
  let chunkIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkChars, text.length)
    const chunk = text.slice(startIndex, endIndex)

    if (chunk.trim()) {
      chunks.push({
        content: chunk.trim(),
        index: chunkIndex++,
      })
    }

    // Move start index forward with overlap
    startIndex += chunkChars - overlapChars
  }

  return chunks
}

/**
 * Generate embedding for a piece of text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * Process a file and generate embeddings for all chunks
 */
export async function processFileEmbeddings(
  fileId: string,
  packageVersionId: string,
  content: string
): Promise<void> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Chunk the text
  const chunks = chunkText(content)

  // Generate embeddings for each chunk
  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.content)

      // Convert embedding to PostgreSQL vector format
      const embeddingString = `[${embedding.join(',')}]`

      // Store in database
      await supabase.from('embeddings').insert({
        file_id: fileId,
        package_version_id: packageVersionId,
        chunk_index: chunk.index,
        content: chunk.content,
        embedding: embeddingString,
        metadata: chunk.metadata || {},
      })

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Error processing chunk ${chunk.index}:`, error)
      throw error
    }
  }
}

/**
 * Delete all embeddings for a file
 */
export async function deleteFileEmbeddings(fileId: string): Promise<void> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  await supabase.from('embeddings').delete().eq('file_id', fileId)
}

/**
 * Regenerate embeddings for a package version
 */
export async function regeneratePackageEmbeddings(
  packageVersionId: string
): Promise<void> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Delete existing embeddings
  await supabase.from('embeddings').delete().eq('package_version_id', packageVersionId)

  // Get all files for this version
  const { data: files } = await supabase
    .from('files')
    .select('id, storage_path')
    .eq('package_version_id', packageVersionId)

  if (!files) return

  // Process each file
  for (const file of files) {
    // In production, you'd fetch the actual file content from storage
    // For now, this is a placeholder
    console.log(`Processing file ${file.id} at ${file.storage_path}`)
  }
}
