import fs from 'fs/promises'
import path from 'path'
import { encryptFile, decryptFile, EncryptedData } from './encryption'

const STORAGE_PATH = process.env.STORAGE_PATH || '/data/files'

export interface FileMetadata {
  packageId: string
  version: string
  filename: string
  isPublic: boolean
  createdAt: string
}

/**
 * Store an encrypted file with metadata
 */
export async function storeFile(
  packageId: string,
  version: string,
  filename: string,
  content: Buffer,
  isPublic: boolean
): Promise<void> {
  const encrypted = encryptFile(content)
  const fileData = {
    ...encrypted,
    metadata: {
      packageId,
      version,
      filename,
      isPublic,
      createdAt: new Date().toISOString(),
    },
  }

  const filePath = getFilePath(packageId, version, filename)
  await ensureDirectoryExists(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(fileData), 'utf8')
}

/**
 * Retrieve and decrypt a file
 */
export async function retrieveFile(
  packageId: string,
  version: string,
  filename: string
): Promise<{ content: Buffer; metadata: FileMetadata } | null> {
  try {
    const filePath = getFilePath(packageId, version, filename)
    const fileData = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(fileData)

    const encryptedData: EncryptedData = {
      encrypted: parsed.encrypted,
      iv: parsed.iv,
      authTag: parsed.authTag,
    }

    const content = decryptFile(encryptedData)
    return {
      content,
      metadata: parsed.metadata,
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

/**
 * List files in a package version
 */
export async function listFiles(
  packageId: string,
  version: string
): Promise<FileMetadata[]> {
  try {
    const dirPath = path.join(STORAGE_PATH, packageId, version)
    const files = await fs.readdir(dirPath)

    const metadataList: FileMetadata[] = []
    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const fileData = await fs.readFile(filePath, 'utf8')
      const parsed = JSON.parse(fileData)
      metadataList.push(parsed.metadata)
    }

    return metadataList
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

/**
 * Delete a file
 */
export async function deleteFile(
  packageId: string,
  version: string,
  filename: string
): Promise<boolean> {
  try {
    const filePath = getFilePath(packageId, version, filename)
    await fs.unlink(filePath)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }
    throw error
  }
}

function getFilePath(packageId: string, version: string, filename: string): string {
  // Sanitize inputs to prevent path traversal
  const sanitizedPackageId = packageId.replace(/[^a-zA-Z0-9-_]/g, '')
  const sanitizedVersion = version.replace(/[^a-zA-Z0-9.-]/g, '')
  const sanitizedFilename = path.basename(filename)

  return path.join(STORAGE_PATH, sanitizedPackageId, sanitizedVersion, sanitizedFilename + '.enc')
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}
