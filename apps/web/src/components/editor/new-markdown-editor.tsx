'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Editor as TiptapEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { createMarkdownEditor } from 'tiptap-markdown'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Eye, Code, Save, Sparkles, Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NewMarkdownEditorProps {
  initialContent?: string
  onSave?: (content: string) => Promise<void>
  fileName?: string
  autoSave?: boolean
  autoSaveInterval?: number // in milliseconds
}

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

// Create MarkdownEditor class once outside component to avoid recreating
const MarkdownEditor = createMarkdownEditor(TiptapEditor)

export function NewMarkdownEditor({
  initialContent = '',
  onSave,
  fileName,
  autoSave = true,
  autoSaveInterval = 3000,
}: NewMarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [aiAssisting, setAiAssisting] = useState(false)
  const [markdownContent, setMarkdownContent] = useState(initialContent)
  const [editorKey, setEditorKey] = useState(0)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiQuery, setAiQuery] = useState('')

  // Refs to track content state
  const lastSavedContentRef = useRef(initialContent)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const editorRef = useRef<InstanceType<typeof MarkdownEditor> | null>(null)

  // Create the editor instance - only once, no dependencies
  useEffect(() => {
    if (editorRef.current) {
      return // Editor already created
    }

    // Reset ready state when creating new editor
    setIsEditorReady(false)

    const editor = new MarkdownEditor({
      content: initialContent,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
        }),
      ],
      markdown: {
        html: true,
        tightLists: true,
        bulletListMarker: '-',
        linkify: false,
        breaks: false,
      },
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none p-4 focus:outline-none min-h-full',
        },
      },
      onUpdate: ({ editor }) => {
        // Get markdown content
        const markdown = (editor as InstanceType<typeof MarkdownEditor>).getMarkdown()
        setMarkdownContent(markdown)

        // Mark as unsaved if content changed
        if (markdown !== lastSavedContentRef.current && !isSavingRef.current) {
          setSaveStatus('unsaved')
        }
      },
    })

    editorRef.current = editor
    // Set editor as ready after initialization
    setIsEditorReady(true)

    // Cleanup on unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
      setIsEditorReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorKey]) // initialContent intentionally excluded - we don't want to recreate the editor

  const editor = editorRef.current

  // Define handleSave before useEffects that use it
  const handleSave = useCallback(async (isAutoSave: boolean = false) => {
    if (!onSave || !editor || isSavingRef.current) return

    const markdown = editor.getMarkdown()

    // Don't save if no changes
    if (markdown === lastSavedContentRef.current) {
      return
    }

    isSavingRef.current = true
    setSaveStatus('saving')

    try {
      await onSave(markdown)
      lastSavedContentRef.current = markdown
      setSaveStatus('saved')

      if (!isAutoSave) {
        toast.success('Changes saved successfully')
      }
    } catch (error) {
      console.error('Save failed:', error)
      setSaveStatus('error')
      toast.error('Failed to save changes')
    } finally {
      isSavingRef.current = false
    }
  }, [editor, onSave])

  // Handle auto-save with debouncing
  useEffect(() => {
    if (!autoSave || !onSave || saveStatus !== 'unsaved' || !editor) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true)
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [markdownContent, autoSave, onSave, saveStatus, autoSaveInterval, editor, handleSave])

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
  }, [handleSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const handleAiAssist = async () => {
    if (!editor) return
    setAiDialogOpen(true)
  }

  const handleAiAssistSubmit = async () => {
    if (!editor || !aiQuery.trim()) return

    setAiAssisting(true)
    setAiDialogOpen(false)

    try {
      const currentMarkdown = editor.getMarkdown()

      // Call the AI assist API
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: aiQuery,
          fileContent: currentMarkdown,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get AI assistance')
      }

      const data = await response.json()

      // Set the new content in the editor
      editor.commands.setContent(data.content)

      toast.success('AI assistance applied successfully')
      setAiQuery('') // Clear the query
    } catch (error) {
      console.error('AI assist error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to get AI assistance')
    } finally {
      setAiAssisting(false)
    }
  }

  const insertMarkdown = useCallback((command: () => boolean) => {
    if (editor) {
      command()
      editor.commands.focus()
    }
  }, [editor])

  if (!editor || !isEditorReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
            className={cn(
              'rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors',
              editor.isActive('heading', { level: 1 }) && 'bg-gray-200'
            )}
            title="Heading 1"
            type="button"
          >
            H1
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
            className={cn(
              'rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors',
              editor.isActive('heading', { level: 2 }) && 'bg-gray-200'
            )}
            title="Heading 2"
            type="button"
          >
            H2
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
            className={cn(
              'rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors',
              editor.isActive('heading', { level: 3 }) && 'bg-gray-200'
            )}
            title="Heading 3"
            type="button"
          >
            H3
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleBold().run())}
            className={cn(
              'rounded px-2 py-1 text-sm font-bold hover:bg-gray-100 transition-colors',
              editor.isActive('bold') && 'bg-gray-200'
            )}
            title="Bold"
            type="button"
          >
            B
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleItalic().run())}
            className={cn(
              'rounded px-2 py-1 text-sm italic hover:bg-gray-100 transition-colors',
              editor.isActive('italic') && 'bg-gray-200'
            )}
            title="Italic"
            type="button"
          >
            I
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleCode().run())}
            className={cn(
              'rounded px-2 py-1 font-mono text-sm hover:bg-gray-100 transition-colors',
              editor.isActive('code') && 'bg-gray-200'
            )}
            title="Inline Code"
            type="button"
          >
            {'<>'}
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleBulletList().run())}
            className={cn(
              'rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors',
              editor.isActive('bulletList') && 'bg-gray-200'
            )}
            title="Bullet List"
            type="button"
          >
            • List
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleOrderedList().run())}
            className={cn(
              'rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors',
              editor.isActive('orderedList') && 'bg-gray-200'
            )}
            title="Numbered List"
            type="button"
          >
            1. List
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleCodeBlock().run())}
            className={cn(
              'rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors',
              editor.isActive('codeBlock') && 'bg-gray-200'
            )}
            title="Code Block"
            type="button"
          >
            {'{ }'}
          </button>
          <button
            onClick={() => insertMarkdown(() => editor.chain().focus().toggleBlockquote().run())}
            className={cn(
              'rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors',
              editor.isActive('blockquote') && 'bg-gray-200'
            )}
            title="Quote"
            type="button"
          >
            &quot;&quot;
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="flex rounded-md border">
            <button
              onClick={() => setMode('edit')}
              className={cn(
                'px-3 py-1 text-sm transition-colors',
                mode === 'edit' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
              type="button"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMode('split')}
              className={cn(
                'border-x px-3 py-1 text-sm transition-colors',
                mode === 'split' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
              type="button"
            >
              Split
            </button>
            <button
              onClick={() => setMode('preview')}
              className={cn(
                'px-3 py-1 text-sm transition-colors',
                mode === 'preview' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
              type="button"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleAiAssist}
            disabled={aiAssisting}
            type="button"
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
              type="button"
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
            <div className="flex-1 overflow-auto bg-white">
              <EditorContent editor={editor} className="h-full" />
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
            <div className="prose prose-sm max-w-none p-4 overflow-auto">
              <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>{markdownContent.length} characters</span>
          <span>{markdownContent.split('\n').length} lines</span>
          <span>{markdownContent.split(/\s+/).filter(Boolean).length} words</span>
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

      {/* AI Assist Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Assist</DialogTitle>
            <DialogDescription>
              What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Add more examples, improve clarity, expand on this topic..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAiAssistSubmit()
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setAiDialogOpen(false)
                setAiQuery('')
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAiAssistSubmit}
              disabled={!aiQuery.trim()}
              type="button"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Apply AI Assist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
