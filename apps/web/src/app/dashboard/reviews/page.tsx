'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  FileText,
  User,
  Package,
} from 'lucide-react'

interface ReviewRequest {
  id: string
  package_version_id: string
  requester_id: string
  status: string
  message?: string
  assigned_reviewers: string[]
  created_at: string
  package_versions: {
    id: string
    version: string
    packages: {
      id: string
      name: string
      slug: string
    }
  }
  profiles: {
    id: string
    full_name: string
    email: string
  }
}

interface Review {
  id: string
  package_version_id: string
  reviewer_id: string
  decision: string
  comment?: string
  created_at: string
  profiles: {
    id: string
    full_name: string
    email: string
  }
}

export default function ReviewsPage() {
  const [requests, setRequests] = useState<ReviewRequest[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(
    null
  )
  const [reviewDecision, setReviewDecision] = useState<string>('')
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchReviewRequests()
  }, [])

  const fetchReviewRequests = async () => {
    try {
      const response = await fetch('/api/reviews/requests')
      if (!response.ok) throw new Error('Failed to fetch review requests')

      const data = await response.json()
      setRequests(data)

      // Fetch reviews for each request
      for (const request of data) {
        fetchReviews(request.package_version_id)
      }
    } catch (error) {
      console.error('Error fetching review requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (versionId: string) => {
    try {
      const response = await fetch(`/api/reviews?versionId=${versionId}`)
      if (!response.ok) throw new Error('Failed to fetch reviews')

      const data = await response.json()
      setReviews((prev) => ({ ...prev, [versionId]: data }))
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedRequest || !reviewDecision) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageVersionId: selectedRequest.package_version_id,
          decision: reviewDecision,
          comment: reviewComment,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit review')
      }

      // Refresh data
      await fetchReviewRequests()
      await fetchReviews(selectedRequest.package_version_id)

      // Reset form
      setSelectedRequest(null)
      setReviewDecision('')
      setReviewComment('')
    } catch (error: any) {
      console.error('Error submitting review:', error)
      alert(`Failed to submit review: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      changes_requested: 'bg-orange-100 text-orange-800',
    }

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approve':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'reject':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'request_changes':
        return <MessageSquare className="h-5 w-5 text-orange-500" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Clock className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="mt-2 text-gray-600">
          Review and approve package versions before publishing
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No review requests</h3>
          <p className="mt-2 text-gray-600">
            Package versions awaiting review will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const versionReviews = reviews[request.package_version_id] || []
            const approvals = versionReviews.filter(
              (r) => r.decision === 'approve'
            ).length
            const rejections = versionReviews.filter(
              (r) => r.decision === 'reject'
            ).length

            return (
              <div
                key={request.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-semibold">
                        {request.package_versions.packages.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        v{request.package_versions.version}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {request.profiles.full_name || request.profiles.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(request.created_at).toLocaleString()}
                      </span>
                    </div>

                    {request.message && (
                      <p className="mt-3 text-sm text-gray-700">
                        {request.message}
                      </p>
                    )}

                    {/* Reviews */}
                    {versionReviews.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          Reviews ({approvals} approved, {rejections} rejected)
                        </h4>
                        {versionReviews.map((review) => (
                          <div
                            key={review.id}
                            className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
                          >
                            {getDecisionIcon(review.decision)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {review.profiles.full_name ||
                                  review.profiles.email}
                              </p>
                              {review.comment && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {review.comment}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <button
                      className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Submit Review</h2>
            <p className="mt-1 text-sm text-gray-600">
              {selectedRequest.package_versions.packages.name} v
              {selectedRequest.package_versions.version}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Decision
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                >
                  <option value="">Select decision...</option>
                  <option value="approve">Approve</option>
                  <option value="request_changes">Request Changes</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Comment (optional)
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add feedback or suggestions..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setSelectedRequest(null)
                  setReviewDecision('')
                  setReviewComment('')
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSubmitReview}
                disabled={!reviewDecision || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
