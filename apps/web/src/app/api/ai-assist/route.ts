import { createClient } from '@/lib/supabase-server'
import { sendChatCompletion } from '@/lib/services/llm-client'
import { NextResponse } from 'next/server'

// POST - AI assist request
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
    const { query, fileContent } = body

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    if (!fileContent) {
      return NextResponse.json({ error: 'fileContent is required' }, { status: 400 })
    }

    // Create system prompt for the AI assistant
    const systemPrompt = `You are an expert markdown editor assistant. Your task is to help users improve, modify, or expand their markdown documents based on their requests.

Guidelines:
- Return ONLY markdown-formatted content
- Be concise and relevant to the user's request
- Maintain the existing document structure unless asked to change it
- Use proper markdown syntax (#, ##, ###, lists, code blocks, etc.)
- If the user asks to add content, integrate it naturally with existing content
- If the user asks to improve content, enhance clarity, structure, and readability
- Preserve any important information from the original document
- Don't add unnecessary commentary outside the markdown content`

    // Create user prompt with the query and current content
    const userPrompt = `Current document content:
\`\`\`markdown
${fileContent}
\`\`\`

User request: ${query}

Please provide the improved or modified markdown content based on the request above. Return ONLY the markdown content, without any additional explanation or commentary.`

    // Call the LLM using the user's configured provider
    const response = await sendChatCompletion(user.id, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    return NextResponse.json({
      content: response.content,
      usage: response.usage,
    })
  } catch (error: any) {
    console.error('Error in AI assist:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
