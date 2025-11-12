'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Editor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { createMarkdownEditor } from 'tiptap-markdown'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Eye, Code, Save, Sparkles, Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MarkdownEditorProps {
  initialContent?: string
  onSave?: (content: string) => Promise<void>
  fileName?: string
  autoSave?: boolean
  autoSaveInterval?: number // in milliseconds
}

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export function MarkdownEditor({
  initialContent = '',
  onSave,
  fileName,
  autoSave = true,
  autoSaveInterval = 3000, // 3 seconds
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [aiAssisting, setAiAssisting] = useState(false)
  const [lastSavedContent, setLastSavedContent] = useState(initialContent)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef(initialContent)

  // Create the MarkdownEditor class once
  const MarkdownEditorClass = useMemo(() => createMarkdownEditor(Editor), [])

  const editor = useMemo(() => {
    const editorInstance = new MarkdownEditorClass({
      extensions: [StarterKit],
      content: initialContent,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none p-4 focus:outline-none h-full overflow-auto',
        },
      },
      onUpdate: ({ editor }) => {
        const markdown = (editor as any).getMarkdown()
        lastContentRef.current = markdown
        setContent(markdown)

        // Mark as unsaved if content changed
        if (markdown !== lastSavedContent) {
          setSaveStatus('unsaved')
        }
      },
    })
    return editorInstance
  }, [MarkdownEditorClass, initialContent, lastSavedContent])

  // Auto-save effect with debouncing
  useEffect(() => {
    if (!autoSave || !onSave || saveStatus !== 'unsaved') return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true)
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [content, autoSave, onSave, saveStatus, autoSaveInterval])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    return () => {
      editor?.destroy()
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [editor])

  const handleSave = async (isAutoSave: boolean = false) => {
    if (!onSave || !editor) return

    const markdown = lastContentRef.current

    // Don't save if no changes
    if (markdown === lastSavedContent) {
      return
    }

    setSaveStatus('saving')
    try {
      await onSave(markdown)
      setLastSavedContent(markdown)
      setSaveStatus('saved')

      if (!isAutoSave) {
        toast.success('Changes saved successfully')
      }
    } catch (error) {
      console.error('Save failed:', error)
      setSaveStatus('error')
      toast.error('Failed to save changes')
    }
  }

  const handleAiAssist = async () => {
    if (!editor) return

    setAiAssisting(true)
    try {
      // Placeholder for AI assistance
      // In production, this would call an API to improve the content
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // For now, just add a helpful comment
      const currentContent = (editor as any).getMarkdown()
      editor.commands.setContent(
        currentContent +
          '\n\n<!-- AI Assistant: Consider adding more detailed examples or explanations -->'
      )
    } finally {
      setAiAssisting(false)
    }
  }

  const insertMarkdown = useCallback((command: () => void) => {
    if (editor) {
      command()
      editor.commands.focus()
    }
  }, [editor])

  if (!editor) {
    return <div className="flex h-full items-center justify-center">Loading editor...</div>
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
            className={cn(
              "rounded px-2 py-1 text-sm hover:bg-gray-100",
              editor.isActive('heading', { level: 1 }) && 'bg-gray-200'
            )}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
            className={cn(
              "rounded px-2 py-1 text-sm hover:bg-gray-100",
              editor.isActive('heading', { level: 2 }) && 'bg-gray-200'
            )}
            title="Heading 2"
          >
            H2
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleBold().run())}
            className={cn(
              "rounded px-2 py-1 text-sm font-bold hover:bg-gray-100",
              editor.isActive('bold') && 'bg-gray-200'
            )}
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleItalic().run())}
            className={cn(
              "rounded px-2 py-1 text-sm italic hover:bg-gray-100",
              editor.isActive('italic') && 'bg-gray-200'
            )}
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleCode().run())}
            className={cn(
              "rounded px-2 py-1 font-mono text-sm hover:bg-gray-100",
              editor.isActive('code') && 'bg-gray-200'
            )}
            title="Inline Code"
          >
            {'<>'}
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleBulletList().run())}
            className={cn(
              "rounded px-2 py-1 text-sm hover:bg-gray-100",
              editor.isActive('bulletList') && 'bg-gray-200'
            )}
            title="Bullet List"
          >
            • List
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleCodeBlock().run())}
            className={cn(
              "rounded px-2 py-1 text-sm hover:bg-gray-100",
              editor.isActive('codeBlock') && 'bg-gray-200'
            )}
            title="Code Block"
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
            variant="secondary"
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
              onClick={() => handleSave(false)}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              variant={saveStatus === 'unsaved' ? 'primary' : 'secondary'}
            >
              {saveStatus === 'saving' && <Clock className="mr-2 h-4 w-4 animate-spin" />}
              {saveStatus === 'saved' && <Check className="mr-2 h-4 w-4" />}
              {saveStatus === 'unsaved' && <Save className="mr-2 h-4 w-4" />}
              {saveStatus === 'error' && <Save className="mr-2 h-4 w-4" />}
              {saveStatus === 'saving' ? 'Saving...' :
               saveStatus === 'saved' ? 'Saved' :
               saveStatus === 'error' ? 'Retry' : 'Save'}
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
            <div className="flex-1 overflow-auto">
              <EditorContent editor={editor} />
            </div>
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
        <div className="flex items-center gap-2">
          {saveStatus === 'unsaved' && autoSave && (
            <span className="text-yellow-600">• Auto-saving...</span>
          )}
          {saveStatus === 'unsaved' && !autoSave && (
            <span className="text-yellow-600">• Unsaved changes</span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-blue-600">• Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-green-600">• All changes saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600">• Save failed</span>
          )}
          <span className="text-neutral-400">Cmd+S to save</span>
        </div>
      </div>
    </div>
  )
}
