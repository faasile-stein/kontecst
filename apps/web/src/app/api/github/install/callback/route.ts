import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { encrypt } from '@/lib/crypto'

/**
 * GitHub App OAuth callback handler
 * Exchanges authorization code for access token and stores connection
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle user denying access
  if (error) {
    console.error('GitHub OAuth error:', error, errorDescription)
    const redirectUrl = new URL('/dashboard/github', requestUrl.origin)
    redirectUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(redirectUrl.toString())
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        '/dashboard/github?error=Missing code or state parameter',
        requestUrl.origin
      )
    )
  }

  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=Unauthorized', requestUrl.origin)
      )
    }

    // Verify state parameter (CSRF protection)
    try {
      const stateData = JSON.parse(
        Buffer.from(state, 'base64url').toString('utf8')
      )

      if (stateData.user_id !== user.id) {
        throw new Error('State verification failed: user_id mismatch')
      }

      // Optional: Check timestamp to prevent replay attacks (e.g., 10 minutes)
      const stateAge = Date.now() - stateData.timestamp
      if (stateAge > 10 * 60 * 1000) {
        throw new Error('State verification failed: expired')
      }
    } catch (error) {
      console.error('State verification error:', error)
      return NextResponse.redirect(
        new URL(
          '/dashboard/github?error=Invalid state parameter',
          requestUrl.origin
        )
      )
    }

    // Get GitHub App credentials
    const clientId = process.env.GITHUB_APP_CLIENT_ID
    const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Missing GitHub App credentials')
      return NextResponse.redirect(
        new URL(
          '/dashboard/github?error=Server configuration error',
          requestUrl.origin
        )
      )
    }

    // Exchange code for access token
    // https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    )

    if (!tokenResponse.ok) {
      throw new Error(
        `Failed to exchange code for token: ${tokenResponse.statusText}`
      )
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(
        `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`
      )
    }

    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('No access token received from GitHub')
    }

    // Use the access token to get user information and installations
    const octokit = new Octokit({ auth: accessToken })

    // Get authenticated user info
    const { data: githubUser } = await octokit.users.getAuthenticated()

    // Get user's installations
    // For GitHub App user access tokens, we need to use the installations endpoint
    let installationId: number | null = null
    let installationType: 'user' | 'organization' = 'user'
    let accountLogin = githubUser.login
    let accountId = githubUser.id
    let accountAvatarUrl = githubUser.avatar_url

    try {
      // Try to get the installation for this user
      // Note: This might not work for all GitHub App configurations
      // Alternative: Store the user access token and use it for API calls
      const { data: installation } =
        await octokit.apps.getUserInstallation({
          username: githubUser.login,
        })

      installationId = installation.id
      // Type guard for installation.account which can be a union type
      const account = installation.account
      if (account && 'login' in account && 'type' in account) {
        installationType = account.type === 'Organization' ? 'organization' : 'user'
        accountLogin = account.login
        accountId = account.id
        accountAvatarUrl = account.avatar_url
      } else {
        // Fallback to githubUser if account doesn't have expected properties
        installationType = 'user'
        accountLogin = githubUser.login
        accountId = githubUser.id
        accountAvatarUrl = githubUser.avatar_url
      }
    } catch (error) {
      // If we can't get installation, we'll use the user's info
      // The user can install the app later
      console.log(
        'Could not get installation, using user access token directly:',
        error
      )
      // We'll set installation_id to 0 to indicate this is a user access token
      installationId = 0
    }

    // Encrypt the access token before storing
    const encryptedToken = encrypt(accessToken)

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('github_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .single()

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('github_connections')
        .update({
          installation_id: installationId || 0,
          installation_type: installationType,
          account_login: accountLogin,
          account_avatar_url: accountAvatarUrl,
          access_token_encrypted: encryptedToken,
          permissions: tokenData.scope ? { scope: tokenData.scope } : {},
          repository_selection: 'all',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)

      if (updateError) {
        throw new Error(`Failed to update connection: ${updateError.message}`)
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('github_connections')
        .insert({
          user_id: user.id,
          installation_id: installationId || 0,
          installation_type: installationType,
          account_login: accountLogin,
          account_id: accountId,
          account_avatar_url: accountAvatarUrl,
          access_token_encrypted: encryptedToken,
          permissions: tokenData.scope ? { scope: tokenData.scope } : {},
          repository_selection: 'all',
        })

      if (insertError) {
        throw new Error(`Failed to create connection: ${insertError.message}`)
      }
    }

    // Redirect to GitHub dashboard with success message
    return NextResponse.redirect(
      new URL('/dashboard/github?success=connected', requestUrl.origin)
    )
  } catch (error) {
    console.error('Error in GitHub callback:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.redirect(
      new URL(
        `/dashboard/github?error=${encodeURIComponent(errorMessage)}`,
        requestUrl.origin
      )
    )
  }
}
