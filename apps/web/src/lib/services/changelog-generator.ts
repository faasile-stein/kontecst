interface FileChange {
  type: 'added' | 'modified' | 'deleted'
  filename: string
  path: string
  oldContent?: string
  newContent?: string
}

export async function generateChangelog(
  changes: FileChange[]
): Promise<string> {
  if (changes.length === 0) {
    return 'No changes detected in this version.'
  }

  // Prepare a summary of changes for OpenAI
  const changesSummary = changes
    .map((change) => {
      const action = change.type.toUpperCase()
      if (change.type === 'added') {
        return `${action}: ${change.path}\nContent:\n${change.newContent?.substring(0, 500) || ''}...`
      } else if (change.type === 'deleted') {
        return `${action}: ${change.path}`
      } else {
        // Modified
        return `${action}: ${change.path}\nOld length: ${change.oldContent?.length || 0} chars\nNew length: ${change.newContent?.length || 0} chars`
      }
    })
    .join('\n\n')

  const prompt = `You are a technical writer helping to generate a changelog for a software package version.
Based on the following file changes, create a concise, professional changelog in markdown format.

File Changes:
${changesSummary}

Generate a changelog that:
1. Summarizes the main changes in bullet points
2. Groups similar changes together (e.g., "Added X files", "Updated Y features")
3. Is concise and easy to read
4. Focuses on user-facing changes
5. Uses present tense (e.g., "Add feature X", "Fix bug Y")

Format the output as a clean markdown list without any headers or extra formatting.`

  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a technical writer specializing in creating clear, concise changelogs for software packages.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Failed to generate changelog.'
  } catch (error) {
    console.error('Error generating changelog:', error)
    throw error
  }
}

export async function compareVersionFiles(
  currentVersionId: string,
  previousVersionId: string | null,
  supabase: any
): Promise<FileChange[]> {
  const changes: FileChange[] = []

  // Get files from current version
  const { data: currentFiles } = await supabase
    .from('files')
    .select('id, filename, path, content')
    .eq('package_version_id', currentVersionId)

  if (!previousVersionId) {
    // All files are new
    return (currentFiles || []).map((file: any) => ({
      type: 'added' as const,
      filename: file.filename,
      path: file.path,
      newContent: file.content,
    }))
  }

  // Get files from previous version
  const { data: previousFiles } = await supabase
    .from('files')
    .select('id, filename, path, content')
    .eq('package_version_id', previousVersionId)

  const previousFileMap = new Map(
    (previousFiles || []).map((f: any) => [f.path, f])
  )
  const currentFileMap = new Map(
    (currentFiles || []).map((f: any) => [f.path, f])
  )

  // Check for added and modified files
  for (const currentFile of currentFiles || []) {
    const previousFile = previousFileMap.get(currentFile.path)
    if (!previousFile) {
      changes.push({
        type: 'added',
        filename: currentFile.filename,
        path: currentFile.path,
        newContent: currentFile.content,
      })
    } else if (currentFile.content !== previousFile.content) {
      changes.push({
        type: 'modified',
        filename: currentFile.filename,
        path: currentFile.path,
        oldContent: previousFile.content,
        newContent: currentFile.content,
      })
    }
  }

  // Check for deleted files
  for (const previousFile of previousFiles || []) {
    if (!currentFileMap.has(previousFile.path)) {
      changes.push({
        type: 'deleted',
        filename: previousFile.filename,
        path: previousFile.path,
        oldContent: previousFile.content,
      })
    }
  }

  return changes
}
