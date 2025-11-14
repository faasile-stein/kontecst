'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch the OpenAPI spec
    fetch('/openapi.json')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load API spec:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading API documentation...</div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-red-600">Failed to load API documentation</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-gray-50 px-6 py-4">
        <h1 className="text-3xl font-bold text-gray-900">Kontecst API Documentation</h1>
        <p className="mt-2 text-sm text-gray-600">
          Explore and test the Kontecst API endpoints. All endpoints require authentication via JWT token or API key.
        </p>
      </div>
      <SwaggerUI spec={spec} />
    </div>
  )
}
