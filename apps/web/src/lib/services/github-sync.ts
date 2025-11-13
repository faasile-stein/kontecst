import { createClient } from '@supabase/supabase-js'
import { Octokit } from '@octokit/rest'
import { processFileEmbeddings } from './embeddings'

interface GitHubFile {
  path: string
  content: string
  sha: string
}

interface SyncResult {
  success: boolean
  filesAdded: number
  filesUpdated: number
  filesDeleted: number
  commitSha: string
  commitMessage?: string
  commitAuthor?: string
  commitDate?: string
  error?: string
  errorDetails?: any
  packageVersionId?: string
}

/**
 * Sync a GitHub repository to a Kontecst package
 */
export async function syncGitHubRepository(
  repositoryId: string,
  syncId: string
): Promise<SyncResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for background tasks
  )

  try {
    // Fetch repository details
    const { data: repo, error: repoError } = await supabase
      .from('github_repositories')
      .select(
        `
        *,
        github_connections(access_token_encrypted),
        packages(id, name, slug, owner_id)
      `
      )
      .eq('id', repositoryId)
      .single()

    if (repoError || !repo) {
      throw new Error('Repository not found')
    }

    // Decrypt access token (for now, just decode from base64)
    const accessToken = Buffer.from(
      repo.github_connections.access_token_encrypted,
      'base64'
    ).toString('utf-8')

    // Initialize Octokit
    const octokit = new Octokit({ auth: accessToken })

    // Get latest commit from branch
    const branch = repo.sync_branch || repo.default_branch
    const { data: branchData } = await octokit.repos.getBranch({
      owner: repo.repo_owner,
      repo: repo.repo_name,
      branch,
    })

    const commitSha = branchData.commit.sha
    const commitMessage = branchData.commit.commit.message
    const commitAuthor = branchData.commit.commit.author?.name
    const commitDate = branchData.commit.commit.author?.date

    // Check if we've already synced this commit
    if (repo.last_sync_commit_sha === commitSha) {
      await completeSync(supabase, syncId, {
        success: true,
        filesAdded: 0,
        filesUpdated: 0,
        filesDeleted: 0,
        commitSha,
        commitMessage,
        commitAuthor,
        commitDate,
      })
      return {
        success: true,
        filesAdded: 0,
        filesUpdated: 0,
        filesDeleted: 0,
        commitSha,
        commitMessage,
        commitAuthor,
        commitDate,
      }
    }

    // Fetch repository tree
    const { data: tree } = await octokit.git.getTree({
      owner: repo.repo_owner,
      repo: repo.repo_name,
      tree_sha: commitSha,
      recursive: 'true',
    })

    // Filter markdown files in sync path
    const syncPath = repo.sync_path || '/'
    const markdownFiles = tree.tree.filter(
      (item) =>
        item.type === 'blob' &&
        item.path?.startsWith(syncPath === '/' ? '' : syncPath) &&
        item.path?.match(/\.(md|markdown)$/i)
    )

    // Fetch file contents
    const files: GitHubFile[] = []
    for (const file of markdownFiles) {
      if (!file.path || !file.sha) continue

      try {
        const { data: blob } = await octokit.git.getBlob({
          owner: repo.repo_owner,
          repo: repo.repo_name,
          file_sha: file.sha,
        })

        const content = Buffer.from(blob.content, 'base64').toString('utf-8')
        files.push({
          path: file.path,
          content,
          sha: file.sha,
        })
      } catch (error) {
        console.error(`Error fetching file ${file.path}:`, error)
      }
    }

    // Create or update package if needed
    let packageId = repo.package_id
    if (!packageId && repo.packages) {
      packageId = repo.packages.id
    }

    if (!packageId) {
      // Auto-create package
      const { data: newPackage, error: pkgError } = await supabase
        .from('packages')
        .insert({
          name: repo.repo_name,
          slug: repo.repo_name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          description: `Synced from GitHub: ${repo.repo_full_name}`,
          visibility: repo.is_private ? 'private' : 'public',
          owner_id: repo.github_connections.user_id,
        })
        .select()
        .single()

      if (pkgError) {
        throw new Error(`Failed to create package: ${pkgError.message}`)
      }

      packageId = newPackage.id

      // Link package to repository
      await supabase
        .from('github_repositories')
        .update({ package_id: packageId })
        .eq('id', repositoryId)
    }

    // Create new package version
    const { data: version, error: versionError } = await supabase
      .from('package_versions')
      .insert({
        package_id: packageId,
        version: `0.0.${Date.now()}`, // Auto-increment based on timestamp
        changelog: commitMessage || 'Synced from GitHub',
        is_published: repo.auto_publish,
      })
      .select()
      .single()

    if (versionError) {
      throw new Error(`Failed to create version: ${versionError.message}`)
    }

    // Insert files
    let filesAdded = 0
    let filesUpdated = 0

    for (const file of files) {
      const { error: fileError } = await supabase.from('files').insert({
        package_version_id: version.id,
        filename: file.path,
        content: file.content,
        size_bytes: Buffer.byteLength(file.content, 'utf-8'),
        content_type: 'text/markdown',
      })

      if (fileError) {
        console.error(`Error inserting file ${file.path}:`, fileError)
        continue
      }

      filesAdded++

      // Generate embeddings if auto-publish is enabled
      if (repo.auto_publish) {
        try {
          // Note: processFileEmbeddings requires fileId, which we don't have here yet
          // This would need to be refactored to get the file ID after insertion
          // For now, skipping embeddings generation during sync
          // await processFileEmbeddings(fileId, version.id, file.content)
        } catch (embError) {
          console.error(`Error generating embeddings for ${file.path}:`, embError)
        }
      }
    }

    // Complete sync
    await completeSync(supabase, syncId, {
      success: true,
      filesAdded,
      filesUpdated,
      filesDeleted: 0,
      commitSha,
      commitMessage,
      commitAuthor,
      commitDate,
      packageVersionId: version.id,
    })

    return {
      success: true,
      filesAdded,
      filesUpdated,
      filesDeleted: 0,
      commitSha,
      commitMessage,
      commitAuthor,
      commitDate,
      packageVersionId: version.id,
    }
  } catch (error: any) {
    console.error('Sync error:', error)

    // Complete sync with error
    await completeSync(supabase, syncId, {
      success: false,
      filesAdded: 0,
      filesUpdated: 0,
      filesDeleted: 0,
      commitSha: 'error',
      error: error.message,
      errorDetails: { stack: error.stack },
    })

    return {
      success: false,
      filesAdded: 0,
      filesUpdated: 0,
      filesDeleted: 0,
      commitSha: 'error',
      error: error.message,
      errorDetails: error,
    }
  }
}

async function completeSync(
  supabase: any,
  syncId: string,
  result: SyncResult
) {
  await supabase.rpc('complete_github_sync', {
    p_sync_id: syncId,
    p_status: result.success ? 'success' : 'error',
    p_commit_sha: result.commitSha,
    p_commit_message: result.commitMessage,
    p_commit_author: result.commitAuthor,
    p_commit_date: result.commitDate,
    p_files_added: result.filesAdded,
    p_files_updated: result.filesUpdated,
    p_files_deleted: result.filesDeleted,
    p_error_message: result.error,
    p_error_details: result.errorDetails ? JSON.stringify(result.errorDetails) : null,
    p_package_version_id: result.packageVersionId,
  })
}
