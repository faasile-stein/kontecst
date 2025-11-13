'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DiffViewer } from '@/components/editor/diff-viewer'

interface Version {
  id: string
  version: string
  description: string | null
}

interface File {
  id: string
  filename: string
  path: string
  content: string
}

export default function CompareVersionsPage() {
  const params = useParams()
  const router = useRouter()
  const packageId = params.id as string

  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion1, setSelectedVersion1] = useState<string>('')
  const [selectedVersion2, setSelectedVersion2] = useState<string>('')
  const [files1, setFiles1] = useState<File[]>([])
  const [files2, setFiles2] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [packageName, setPackageName] = useState<string>('')

  // Fetch package and versions on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch package info
        const pkgResponse = await fetch(`/api/packages/${packageId}`)
        if (pkgResponse.ok) {
          const pkgData = await pkgResponse.json()
          setPackageName(pkgData.name)

          // Sort versions by semver (newest first)
          const sortedVersions = (pkgData.package_versions || []).sort((a: Version, b: Version) => {
            const partsA = a.version.split('.').map(Number)
            const partsB = b.version.split('.').map(Number)
            for (let i = 0; i < 3; i++) {
              if (partsA[i] !== partsB[i]) {
                return partsB[i] - partsA[i]
              }
            }
            return 0
          })

          setVersions(sortedVersions)

          // Auto-select latest two versions if available
          if (sortedVersions.length >= 2) {
            setSelectedVersion1(sortedVersions[0].id)
            setSelectedVersion2(sortedVersions[1].id)
          } else if (sortedVersions.length === 1) {
            setSelectedVersion1(sortedVersions[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [packageId])

  // Fetch files when versions are selected
  useEffect(() => {
    async function fetchFiles() {
      if (!selectedVersion1 && !selectedVersion2) return

      setComparing(true)
      try {
        // Fetch files for version 1
        if (selectedVersion1) {
          const response = await fetch(`/api/packages/${packageId}/versions/${selectedVersion1}/files`)
          if (response.ok) {
            const data = await response.json()
            setFiles1(data)
          }
        } else {
          setFiles1([])
        }

        // Fetch files for version 2
        if (selectedVersion2) {
          const response = await fetch(`/api/packages/${packageId}/versions/${selectedVersion2}/files`)
          if (response.ok) {
            const data = await response.json()
            setFiles2(data)
          }
        } else {
          setFiles2([])
        }
      } catch (error) {
        console.error('Error fetching files:', error)
      } finally {
        setComparing(false)
      }
    }

    fetchFiles()
  }, [selectedVersion1, selectedVersion2, packageId])

  // Get all unique file paths
  const allFilePaths = Array.from(
    new Set([...files1.map((f) => f.path), ...files2.map((f) => f.path)])
  ).sort()

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/packages/${packageId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to package
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Compare Versions</h1>
        {packageName && (
          <p className="mt-1 text-sm text-gray-600">{packageName}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Version 1 (Base)
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              value={selectedVersion1}
              onChange={(e) => setSelectedVersion1(e.target.value)}
            >
              <option value="">Select a version</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version}
                  {v.description ? ` - ${v.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Version 2 (Compare)
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              value={selectedVersion2}
              onChange={(e) => setSelectedVersion2(e.target.value)}
            >
              <option value="">Select a version</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version}
                  {v.description ? ` - ${v.description}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {comparing && (
          <div className="mt-6 text-center text-gray-500">
            Loading files for comparison...
          </div>
        )}
      </div>

      {!comparing && (selectedVersion1 || selectedVersion2) && (
        <div className="mt-8 space-y-6">
          {allFilePaths.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
              <p className="text-gray-500">No files to compare</p>
            </div>
          ) : (
            allFilePaths.map((filePath) => {
              const file1 = files1.find((f) => f.path === filePath)
              const file2 = files2.find((f) => f.path === filePath)

              // Determine if file was added, removed, or modified
              let status = 'modified'
              if (!file1 && file2) status = 'added'
              if (file1 && !file2) status = 'removed'
              if (file1 && file2 && file1.content === file2.content) status = 'unchanged'

              return (
                <div key={filePath} className="rounded-lg border bg-white shadow-sm">
                  <div className="border-b bg-gray-50 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{filePath}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          status === 'added'
                            ? 'bg-green-100 text-green-800'
                            : status === 'removed'
                              ? 'bg-red-100 text-red-800'
                              : status === 'unchanged'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {status === 'unchanged' ? (
                      <p className="text-sm text-gray-500">No changes</p>
                    ) : (
                      <DiffViewer
                        oldContent={file1?.content || ''}
                        newContent={file2?.content || ''}
                        filename={filePath}
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
