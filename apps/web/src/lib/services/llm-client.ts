import { createClient as createSupabaseClient } from '@supabase/supabase-js'

interface LLMProvider {
  id: string
  name: string
  type: 'openai' | 'openai_compatible' | 'anthropic' | 'local' | 'test'
  api_endpoint: string
  api_key: string | null
  model_name: string
  max_tokens: number
  temperature: number
  metadata: any
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionRequest {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

interface ChatCompletionResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Get the LLM provider for a specific user
 * Falls back to default provider if user has no preference
 */
export async function getUserLLMProvider(userId: string): Promise<LLMProvider | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables!\n\n' +
      'Please ensure the following environment variables are set:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- SUPABASE_SERVICE_KEY\n\n' +
      'Create a .env.local file in apps/web/ with these variables.\n' +
      'See apps/web/.env.example for reference.\n\n' +
      'Find these values at: https://supabase.com/dashboard/project/_/settings/api'
    )
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey)

  try {
    // Use the database function to get user's provider or default
    const { data, error } = await supabase.rpc('get_user_llm_provider', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Error fetching user LLM provider:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.error('No LLM provider found for user')
      return null
    }

    return data[0]
  } catch (error) {
    console.error('Error getting user LLM provider:', error)
    return null
  }
}

/**
 * Call an OpenAI-compatible chat completion endpoint
 */
async function callOpenAICompatible(
  provider: LLMProvider,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add Authorization header if API key is present
  if (provider.api_key) {
    headers['Authorization'] = `Bearer ${provider.api_key}`
  }

  const response = await fetch(provider.api_endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.model_name,
      messages: request.messages,
      temperature: request.temperature ?? provider.temperature,
      max_tokens: request.maxTokens ?? provider.max_tokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LLM API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  return {
    content: data.choices[0].message.content,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  }
}

/**
 * Call Anthropic's chat completion endpoint
 */
async function callAnthropic(
  provider: LLMProvider,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  if (!provider.api_key) {
    throw new Error('Anthropic provider requires an API key')
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': provider.api_key,
    'anthropic-version': '2023-06-01',
  }

  // Convert messages format for Anthropic
  const systemMessage = request.messages.find((m) => m.role === 'system')
  const messages = request.messages.filter((m) => m.role !== 'system')

  const response = await fetch(provider.api_endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.model_name,
      messages,
      system: systemMessage?.content,
      temperature: request.temperature ?? provider.temperature,
      max_tokens: request.maxTokens ?? provider.max_tokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  return {
    content: data.content[0].text,
    usage: data.usage
      ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        }
      : undefined,
  }
}

/**
 * Call test provider - returns a mock response for testing
 */
async function callTestProvider(
  provider: LLMProvider,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  // Test provider returns a mock response for testing purposes
  const lastMessage = request.messages[request.messages.length - 1]
  const mockResponse = `Test provider response for: "${lastMessage.content.substring(0, 50)}..."`

  return {
    content: mockResponse,
    usage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    },
  }
}

/**
 * Send a chat completion request using the configured LLM provider
 */
export async function sendChatCompletion(
  userId: string,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const provider = await getUserLLMProvider(userId)

  if (!provider) {
    throw new Error('No LLM provider configured')
  }

  console.log(`Using LLM provider: ${provider.name} (${provider.type})`)

  switch (provider.type) {
    case 'openai':
    case 'openai_compatible':
    case 'local':
      return callOpenAICompatible(provider, request)

    case 'anthropic':
      return callAnthropic(provider, request)

    case 'test':
      return callTestProvider(provider, request)

    default:
      throw new Error(`Unsupported LLM provider type: ${provider.type}`)
  }
}

/**
 * Convenience function for digesting PDF to markdown
 */
export async function digestPdfToMarkdownWithLLM(
  userId: string,
  pdfText: string,
  purpose: string,
  metadata: { title?: string; author?: string; subject?: string }
): Promise<string> {
  const systemPrompt = `You are an expert at analyzing and summarizing documents. Your task is to digest the provided PDF content into a well-structured markdown document based on the user's specified purpose.

Guidelines:
- Create clear, hierarchical headings using markdown (#, ##, ###)
- Extract and organize key information relevant to the specified purpose
- Maintain factual accuracy - don't add information not present in the source
- Use bullet points, numbered lists, and tables where appropriate
- Include code blocks if the PDF contains code examples
- Preserve important technical details, numbers, and specific terminology
- Create a logical flow that makes the content easy to understand
- If the purpose specifies a particular format or structure, follow it`

  const userPrompt = `Please digest the following PDF content into a markdown document.

**Purpose:** ${purpose}

**PDF Metadata:**
- Title: ${metadata.title || 'N/A'}
- Author: ${metadata.author || 'N/A'}
- Subject: ${metadata.subject || 'N/A'}

**PDF Content:**
${pdfText}

Please create a comprehensive markdown document based on the purpose specified above.`

  const response = await sendChatCompletion(userId, {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  return response.content
}
