'use client'

import { useMemo } from 'react'

interface DiffViewerProps {
  oldContent: string
  newContent: string
  filename?: string
}

interface DiffLine {
  type: 'add' | 'remove' | 'unchanged'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: DiffLine[] = []

  // Simple line-by-line diff (in production, use a proper diff algorithm)
  const maxLength = Math.max(oldLines.length, newLines.length)

  let oldLineNum = 1
  let newLineNum = 1

  for (let i = 0; i < maxLength; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]

    if (oldLine === newLine) {
      result.push({
        type: 'unchanged',
        content: oldLine || '',
        oldLineNumber: oldLineNum++,
        newLineNumber: newLineNum++,
      })
    } else {
      if (oldLine !== undefined && (newLine === undefined || oldLine !== newLine)) {
        result.push({
          type: 'remove',
          content: oldLine,
          oldLineNumber: oldLineNum++,
        })
      }
      if (newLine !== undefined && (oldLine === undefined || oldLine !== newLine)) {
        result.push({
          type: 'add',
          content: newLine,
          newLineNumber: newLineNum++,
        })
      }
    }
  }

  return result
}

export function DiffViewer({ oldContent, newContent, filename }: DiffViewerProps) {
  const diffLines = useMemo(
    () => computeDiff(oldContent, newContent),
    [oldContent, newContent]
  )

  const stats = useMemo(() => {
    const additions = diffLines.filter((line) => line.type === 'add').length
    const deletions = diffLines.filter((line) => line.type === 'remove').length
    return { additions, deletions }
  }, [diffLines])

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      {/* Header */}
      <div className="border-b bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-sm font-medium text-gray-900">
            {filename || 'Untitled'}
          </p>
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-green-600">+{stats.additions} additions</span>
            <span className="text-red-600">-{stats.deletions} deletions</span>
          </div>
        </div>
      </div>

      {/* Diff content */}
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-sm">
          <tbody>
            {diffLines.map((line, index) => (
              <tr
                key={index}
                className={
                  line.type === 'add'
                    ? 'bg-green-50'
                    : line.type === 'remove'
                    ? 'bg-red-50'
                    : ''
                }
              >
                <td className="w-12 select-none border-r border-gray-200 bg-gray-50 px-2 py-1 text-right text-gray-500">
                  {line.oldLineNumber}
                </td>
                <td className="w-12 select-none border-r border-gray-200 bg-gray-50 px-2 py-1 text-right text-gray-500">
                  {line.newLineNumber}
                </td>
                <td className="w-8 select-none px-2 py-1 text-center">
                  {line.type === 'add' ? (
                    <span className="text-green-600">+</span>
                  ) : line.type === 'remove' ? (
                    <span className="text-red-600">-</span>
                  ) : (
                    <span className="text-gray-400"> </span>
                  )}
                </td>
                <td
                  className={`px-2 py-1 ${
                    line.type === 'add'
                      ? 'text-green-800'
                      : line.type === 'remove'
                      ? 'text-red-800'
                      : 'text-gray-900'
                  }`}
                >
                  <pre className="whitespace-pre-wrap">{line.content || ' '}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
