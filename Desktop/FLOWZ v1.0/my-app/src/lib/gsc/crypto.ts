/**
 * Google Search Console - Token Encryption (AES-256-GCM)
 *
 * Encrypts/decrypts individual token strings (not JSONB).
 * The real schema stores access_token_encrypted and refresh_token_encrypted
 * as separate TEXT columns.
 *
 * Uses Node.js built-in crypto module (server-side only).
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;

function getEncryptionKey(): Buffer {
    const key = process.env.GSC_TOKEN_ENCRYPTION_KEY;
    if (!key || key.length < 16) {
        throw new Error('GSC_TOKEN_ENCRYPTION_KEY is not configured or too short');
    }
    // Derive a 32-byte key using scrypt
    return scryptSync(key, 'flowz-gsc-salt', 32);
}

/**
 * Encrypt a single token string into format: salt:iv:tag:ciphertext (all hex)
 */
export function encryptToken(token: string): string {
    const key = getEncryptionKey();
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return [
        salt.toString('hex'),
        iv.toString('hex'),
        tag.toString('hex'),
        encrypted,
    ].join(':');
}

/**
 * Decrypt a single encrypted token string back to plaintext.
 */
export function decryptToken(encryptedStr: string): string {
    const key = getEncryptionKey();
    const parts = encryptedStr.split(':');

    if (parts.length !== 4) {
        throw new Error('Invalid encrypted token format');
    }

    const [, ivHex, tagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
