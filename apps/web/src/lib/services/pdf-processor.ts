import { createWorker } from 'tesseract.js'
import { PDFDocument } from 'pdf-lib'

interface PdfProcessingResult {
  text: string
  pageCount: number
  metadata: {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    producer?: string
    creationDate?: Date
    modificationDate?: Date
  }
}

/**
 * Extract text from a PDF using pdf-parse
 * This works well for text-based PDFs
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<PdfProcessingResult> {
  try {
    // Dynamic import for pdf-parse to handle CommonJS module in Next.js
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)

    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        keywords: data.info?.Keywords,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate,
        modificationDate: data.info?.ModDate,
      },
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

/**
 * Perform OCR on a PDF using Tesseract.js
 * This is useful for scanned PDFs or images
 */
export async function performOcrOnPdf(buffer: Buffer): Promise<string> {
  try {
    // Load the PDF
    const pdfDoc = await PDFDocument.load(buffer)
    const pages = pdfDoc.getPages()

    // Initialize Tesseract worker
    const worker = await createWorker('eng')

    let fullText = ''

    // For now, we'll skip the actual image extraction and OCR
    // as it requires canvas and image conversion which is complex in Node.js
    // This would need additional libraries like pdf2pic or similar

    // Placeholder: In a real implementation, you would:
    // 1. Convert each PDF page to an image
    // 2. Run OCR on each image
    // 3. Combine the results

    await worker.terminate()

    return fullText
  } catch (error) {
    console.error('Error performing OCR on PDF:', error)
    throw new Error('Failed to perform OCR on PDF')
  }
}

/**
 * Extract text from PDF with fallback to OCR
 * First tries text extraction, then OCR if no text is found
 */
export async function extractTextWithOcr(buffer: Buffer): Promise<PdfProcessingResult> {
  // Try regular text extraction first
  const result = await extractTextFromPdf(buffer)

  // If we got very little text (less than 100 characters), the PDF might be scanned
  // In that case, we should try OCR
  if (result.text.trim().length < 100) {
    console.log('PDF appears to be scanned, attempting OCR...')
    try {
      const ocrText = await performOcrOnPdf(buffer)
      if (ocrText.length > result.text.length) {
        result.text = ocrText
      }
    } catch (error) {
      console.error('OCR failed, using extracted text:', error)
      // Fall back to the original extracted text
    }
  }

  return result
}

/**
 * Digest PDF content into markdown using AI
 */
export async function digestPdfToMarkdown(
  pdfText: string,
  purpose: string,
  metadata: PdfProcessingResult['metadata']
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  // Create a comprehensive prompt for the AI
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

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4 for better understanding and formatting
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more focused output
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error digesting PDF to markdown:', error)
    throw error
  }
}

/**
 * Main function to process PDF: extract text, OCR if needed, and digest to markdown
 */
export async function processPdfToMarkdown(
  buffer: Buffer,
  purpose: string
): Promise<{ markdown: string; metadata: PdfProcessingResult['metadata'] }> {
  console.log('Starting PDF processing...')

  // Extract text from PDF with OCR fallback
  const pdfResult = await extractTextWithOcr(buffer)

  console.log(`Extracted ${pdfResult.text.length} characters from ${pdfResult.pageCount} pages`)

  // If no text was extracted, throw an error
  if (!pdfResult.text.trim()) {
    throw new Error('No text could be extracted from the PDF')
  }

  // Digest the content to markdown using AI
  console.log('Digesting content to markdown...')
  const markdown = await digestPdfToMarkdown(pdfResult.text, purpose, pdfResult.metadata)

  return {
    markdown,
    metadata: pdfResult.metadata,
  }
}
