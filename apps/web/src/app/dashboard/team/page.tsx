'use client'
import { toast } from 'sonner'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Mail, Shield, Trash2, Crown } from 'lucide-react'

interface TeamMember {
  id: string
  user_id: string
  role: string
  created_at: string
  profiles: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
}

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('member')
  const [organizationId, setOrganizationId] = useState<string>('')

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      // Get user's organizations
      const response = await fetch('/api/organizations')
      if (!response.ok) throw new Error('Failed to fetch organizations')

      const data = await response.json()
      if (data.organizations && data.organizations.length > 0) {
        const org = data.organizations[0].organizations
        setOrganizationId(org.id)
        await fetchMembers(org.id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/members`)
      if (!response.ok) throw new Error('Failed to fetch members')

      const data = await response.json()
      setMembers(data.members || [])
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail || !organizationId) return

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send invitation')
      }

      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
      await fetchMembers(organizationId)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members?memberId=${memberId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to remove member')

      await fetchMembers(organizationId)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading team...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your organization members and permissions
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Members List */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Members ({members.length})
          </h2>
        </div>

        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      {member.profiles.full_name?.charAt(0) ||
                        member.profiles.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.profiles.full_name || 'Unnamed'}
                    </p>
                    <p className="text-sm text-gray-500">{member.profiles.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      roleColors[member.role]
                    }`}
                  >
                    {member.role === 'owner' && <Crown className="mr-1 inline h-3 w-3" />}
                    {member.role === 'admin' && <Shield className="mr-1 inline h-3 w-3" />}
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Invitations ({invitations.length})
            </h2>
          </div>

          <div className="divide-y">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Mail className="h-10 w-10 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-gray-500">
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      roleColors[invitation.role]
                    }`}
                  >
                    {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
            <p className="mt-2 text-sm text-gray-600">
              Send an invitation to join your organization
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="viewer">Viewer - Can view packages</option>
                  <option value="member">Member - Can create and edit</option>
                  <option value="admin">Admin - Can manage team</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite}>Send Invitation</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
