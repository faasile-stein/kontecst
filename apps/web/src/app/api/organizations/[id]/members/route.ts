import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const InviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get members
    const { data: members } = await supabase
      .from('organization_members')
      .select(
        `
        *,
        profiles (full_name, email, avatar_url)
      `
      )
      .eq('organization_id', params.id)
      .order('created_at', { ascending: true })

    // Get pending invitations
    const { data: invitations } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('organization_id', params.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())

    return NextResponse.json({
      members: members || [],
      invitations: invitations || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validated = InviteUserSchema.parse(body)

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 409 }
      )
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: params.id,
        email: validated.email,
        role: validated.role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Send invitation email
    // await sendInvitationEmail(validated.email, token, orgName)

    return NextResponse.json(invitation, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Remove team member
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
    }

    // Check if user is admin/owner
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Remove member
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
