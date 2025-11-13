# GitHub App Setup Guide

This guide will walk you through setting up a GitHub App for the Kontecst GitHub integration, which allows users to sync Markdown files from their GitHub repositories.

## Prerequisites

- GitHub account (personal or organization)
- Access to your Kontecst deployment URL
- Access to your `.env` file for the web app

## Step 1: Create a GitHub App

1. Go to your GitHub account settings:
   - For personal apps: https://github.com/settings/apps/new
   - For organization apps: https://github.com/organizations/YOUR_ORG/settings/apps/new

2. Fill in the following fields:

### Basic Information

- **GitHub App name**: `Kontecst` (or your preferred name)
- **Homepage URL**: Your Kontecst deployment URL (e.g., `https://kontecst.example.com`)
- **Callback URL**: `https://your-domain.com/api/github/install/callback`
  - Replace `your-domain.com` with your actual domain
  - For local development: `http://localhost:3000/api/github/install/callback`
- **Setup URL (optional)**: Leave blank
- **Webhook URL (optional)**: Leave blank for now
- **Webhook secret (optional)**: Leave blank for now

### Permissions

Under **Repository permissions**, set the following:

- **Contents**: `Read-only` (required to read repository files)
- **Metadata**: `Read-only` (automatically selected, required for repository info)

### User Permissions

Under **Account permissions**, you can leave all as `No access` unless you need specific features.

### Where can this GitHub App be installed?

- Select **Any account** (recommended) or **Only on this account** if you want to restrict it

### Post-installation

- **Redirect on update**: Leave unchecked
- Uncheck **Active** for webhooks (we'll enable this later if needed)

3. Click **Create GitHub App**

## Step 2: Generate Client Secret

After creating the app:

1. Scroll down to **Client secrets** section
2. Click **Generate a new client secret**
3. Copy the secret immediately (you won't be able to see it again)
4. Save it for the next step

## Step 3: Get Your App Credentials

From your GitHub App settings page, note down:

1. **App ID**: Found at the top of the settings page
2. **Client ID**: Found in the "About" section
3. **Client Secret**: The one you just generated

## Step 4: Configure Environment Variables

Add the following to your `apps/web/.env` file:

```bash
# GitHub App Configuration
GITHUB_APP_ID=123456                          # Your App ID
GITHUB_APP_CLIENT_ID=Iv1.abc123def456         # Your Client ID
GITHUB_APP_CLIENT_SECRET=your-client-secret   # Your Client Secret

# Encryption Key (for storing access tokens securely)
ENCRYPTION_KEY=your-64-character-hex-key
```

### Generate Encryption Key

Generate a secure 32-byte encryption key using OpenSSL:

```bash
openssl rand -hex 32
```

Copy the output and use it as your `ENCRYPTION_KEY`.

## Step 5: Update GitHub App Settings (Optional)

If you need to update your GitHub App's callback URL after initial creation:

1. Go to your GitHub App settings
2. Update the **Callback URL** field
3. Click **Save changes**

## Step 6: Test the Integration

1. Restart your Next.js development server (if running)
2. Navigate to `/dashboard/github` in your Kontecst app
3. Click **Connect GitHub** button
4. You should be redirected to GitHub to authorize the app
5. After authorizing, you'll be redirected back to your app
6. You should see your GitHub account connected

## Troubleshooting

### "Missing GitHub App configuration" error

- Make sure all three environment variables are set correctly in `.env`
- Restart your Next.js server after adding environment variables

### "State verification failed" error

- This usually indicates a CSRF issue
- Make sure cookies are enabled in your browser
- Check that your callback URL matches exactly (including http/https)

### "Failed to exchange code for token" error

- Verify your `GITHUB_APP_CLIENT_SECRET` is correct
- Check that the callback URL in your GitHub App settings matches your deployment URL

### "Missing encryption key" error

- Generate an encryption key using `openssl rand -hex 32`
- Add it to your `.env` file as `ENCRYPTION_KEY`

### Callback URL mismatch

- GitHub is strict about callback URLs
- For local development: `http://localhost:3000/api/github/install/callback`
- For production: `https://your-domain.com/api/github/install/callback`
- The protocol (http/https) and port must match exactly

## Security Notes

1. **Never commit** your `.env` file or expose your client secret
2. The encryption key is used to encrypt GitHub access tokens in the database
3. Rotate your client secret and encryption key periodically
4. Use different GitHub Apps for development and production environments

## Additional Features (Future)

### Webhooks

To enable automatic syncing when repository content changes:

1. In your GitHub App settings, enable webhooks
2. Set **Webhook URL**: `https://your-domain.com/api/github/webhooks`
3. Generate a webhook secret: `openssl rand -hex 32`
4. Add to `.env`: `GITHUB_APP_WEBHOOK_SECRET=your-webhook-secret`
5. Subscribe to events: `push`, `pull_request`

### Fine-grained Permissions

You can request additional permissions based on your needs:

- **Pull requests**: Read & write (to create PRs with synced content)
- **Issues**: Read & write (to create issues for sync errors)
- **Webhooks**: Read-only (to manage webhook subscriptions)

## OAuth Flow Overview

The GitHub App authentication follows this flow:

1. User clicks "Connect GitHub" button
2. User is redirected to `/api/github/install` (your app)
3. Your app generates a state parameter and redirects to GitHub OAuth
4. User authorizes the app on GitHub
5. GitHub redirects back to `/api/github/install/callback` with code
6. Your app exchanges the code for an access token
7. Your app stores the encrypted token in the database
8. User is redirected back to `/dashboard/github`

## References

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [GitHub OAuth Flow](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [Repository Contents API](https://docs.github.com/en/rest/repos/contents)
