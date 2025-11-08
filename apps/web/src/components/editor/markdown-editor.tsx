'use client'

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Eye, Code, Save, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  initialContent?: string
  onSave?: (content: string) => Promise<void>
  fileName?: string
}

export function MarkdownEditor({
  initialContent = '',
  onSave,
  fileName,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [saving, setSaving] = useState(false)
  const [aiAssisting, setAiAssisting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(newContent !== initialContent)
  }

  const handleSave = async () => {
    if (!onSave) return

    setSaving(true)
    try {
      await onSave(content)
      setHasChanges(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAiAssist = async () => {
    setAiAssisting(true)
    try {
      // Placeholder for AI assistance
      // In production, this would call an API to improve the content
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // For now, just add a helpful comment
      setContent(
        content +
          '\n\n<!-- AI Assistant: Consider adding more detailed examples or explanations -->'
      )
    } finally {
      setAiAssisting(false)
    }
  }

  const insertMarkdown = useCallback((before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end)

    setContent(newText)
    setHasChanges(true)

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      )
    }, 0)
  }, [content])

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => insertMarkdown('# ')}
            className="rounded px-2 py-1 text-sm hover:bg-gray-100"
            title="Heading"
          >
            H1
          </button>
          <button
            onClick={() => insertMarkdown('## ')}
            className="rounded px-2 py-1 text-sm hover:bg-gray-100"
            title="Subheading"
          >
            H2
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <button
            onClick={() => insertMarkdown('**', '**')}
            className="rounded px-2 py-1 text-sm font-bold hover:bg-gray-100"
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => insertMarkdown('*', '*')}
            className="rounded px-2 py-1 text-sm italic hover:bg-gray-100"
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() => insertMarkdown('`', '`')}
            className="rounded px-2 py-1 font-mono text-sm hover:bg-gray-100"
            title="Code"
          >
            {'<>'}
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <button
            onClick={() => insertMarkdown('[', '](url)')}
            className="rounded px-2 py-1 text-sm hover:bg-gray-100"
            title="Link"
          >
            🔗
          </button>
          <button
            onClick={() => insertMarkdown('- ')}
            className="rounded px-2 py-1 text-sm hover:bg-gray-100"
            title="List"
          >
            • List
          </button>
          <button
            onClick={() => insertMarkdown('```\n', '\n```')}
            className="rounded px-2 py-1 text-sm hover:bg-gray-100"
            title="Code block"
          >
            {'{ }'}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="flex rounded-md border">
            <button
              onClick={() => setMode('edit')}
              className={cn(
                'px-3 py-1 text-sm',
                mode === 'edit' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMode('split')}
              className={cn(
                'border-x px-3 py-1 text-sm',
                mode === 'split' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              Split
            </button>
            <button
              onClick={() => setMode('preview')}
              className={cn(
                'px-3 py-1 text-sm',
                mode === 'preview' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAiAssist}
            disabled={aiAssisting}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {aiAssisting ? 'Assisting...' : 'AI Assist'}
          </Button>

          {onSave && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      {/* Editor and Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        {(mode === 'edit' || mode === 'split') && (
          <div
            className={cn(
              'flex flex-col border-r',
              mode === 'split' ? 'w-1/2' : 'w-full'
            )}
          >
            <div className="border-b bg-gray-50 px-4 py-2">
              <p className="text-sm font-medium text-gray-700">
                {fileName || 'Edit Markdown'}
              </p>
            </div>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-1 resize-none p-4 font-mono text-sm focus:outline-none"
              placeholder="Start writing your markdown content..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {(mode === 'preview' || mode === 'split') && (
          <div
            className={cn(
              'flex flex-col overflow-auto bg-white',
              mode === 'split' ? 'w-1/2' : 'w-full'
            )}
          >
            <div className="border-b bg-gray-50 px-4 py-2">
              <p className="text-sm font-medium text-gray-700">Preview</p>
            </div>
            <div className="prose prose-sm max-w-none p-4">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>{content.length} characters</span>
          <span>{content.split('\n').length} lines</span>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
        </div>
        {hasChanges && <span className="text-yellow-600">• Unsaved changes</span>}
      </div>
    </div>
  )
}
