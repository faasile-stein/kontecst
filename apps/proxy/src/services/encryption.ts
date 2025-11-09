import crypto from 'crypto'

const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex')

if (KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
}

export interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

/**
 * Encrypts data using AES-256-GCM
 */
export function encrypt(data: string): EncryptedData {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv) as crypto.CipherGCM

  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

/**
 * Decrypts data using AES-256-GCM
 */
export function decrypt(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encryptedData.iv, 'hex')
  ) as crypto.DecipherGCM

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypts a file buffer
 */
export function encryptFile(buffer: Buffer): EncryptedData {
  return encrypt(buffer.toString('utf8'))
}

/**
 * Decrypts to a file buffer
 */
export function decryptFile(encryptedData: EncryptedData): Buffer {
  const decrypted = decrypt(encryptedData)
  return Buffer.from(decrypted, 'utf8')
}
