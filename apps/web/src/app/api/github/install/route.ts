import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * GitHub App installation initiation endpoint
 * Redirects user to GitHub App installation page with proper state tracking
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get GitHub App configuration from environment
    const githubAppId = process.env.GITHUB_APP_ID
    const githubAppClientId = process.env.GITHUB_APP_CLIENT_ID

    if (!githubAppId || !githubAppClientId) {
      console.error('Missing GitHub App configuration')
      return NextResponse.json(
        {
          error:
            'GitHub App not configured. Please set GITHUB_APP_ID and GITHUB_APP_CLIENT_ID environment variables.',
        },
        { status: 500 }
      )
    }

    // Generate state parameter for CSRF protection
    // Store user_id in the state so we can verify it on callback
    const state = Buffer.from(
      JSON.stringify({
        user_id: user.id,
        timestamp: Date.now(),
      })
    ).toString('base64url')

    // Get the base URL for callback
    const requestUrl = new URL(request.url)
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
    const redirectUri = `${baseUrl}/api/github/install/callback`

    // Build GitHub App installation URL
    // https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app
    const installUrl = new URL(
      'https://github.com/apps/YOUR_APP_NAME/installations/new'
    )
    installUrl.searchParams.set('state', state)

    // Alternative: Use OAuth flow for GitHub App user access token
    // This is better for getting repository-scoped tokens
    const oauthUrl = new URL('https://github.com/login/oauth/authorize')
    oauthUrl.searchParams.set('client_id', githubAppClientId)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('state', state)
    oauthUrl.searchParams.set('scope', 'repo user:email')

    // Redirect to GitHub OAuth
    return NextResponse.redirect(oauthUrl.toString())
  } catch (error) {
    console.error('Error initiating GitHub App installation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
