import crypto from 'crypto'

/**
 * Encryption utilities for sensitive data like GitHub tokens
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // For AES, this is always 16
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment variable
 * In production, this should be a securely generated 32-byte key
 */
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY

  if (!keyString) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. Please generate a 32-byte key using: openssl rand -hex 32'
    )
  }

  // Convert hex string to buffer
  const key = Buffer.from(keyString, 'hex')

  if (key.length !== 32) {
    throw new Error(
      'ENCRYPTION_KEY must be 32 bytes (64 hex characters). Generate using: openssl rand -hex 32'
    )
  }

  return key
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns base64-encoded format: iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    const authTag = cipher.getAuthTag()

    // Return format: iv:authTag:encryptedData (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts a string that was encrypted with the encrypt function
 * Expects format: iv:authTag:encryptedData (all base64)
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedText.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Legacy function to handle old base64-encoded tokens
 * This is for backward compatibility with existing data
 */
export function decryptLegacyBase64(base64Token: string): string {
  try {
    return Buffer.from(base64Token, 'base64').toString('utf8')
  } catch (error) {
    throw new Error('Failed to decode legacy token')
  }
}

/**
 * Detects if a token is encrypted with the new format or old base64
 * New format contains colons (iv:authTag:data)
 */
export function isEncryptedFormat(token: string): boolean {
  return token.includes(':') && token.split(':').length === 3
}

/**
 * Safely decrypt a token, handling both new encrypted format and legacy base64
 */
export function safeDecrypt(token: string): string {
  if (isEncryptedFormat(token)) {
    return decrypt(token)
  } else {
    // Legacy base64 format
    return decryptLegacyBase64(token)
  }
}
