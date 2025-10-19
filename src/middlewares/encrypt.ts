import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be set and 32 characters long");
}

const key = Buffer.from(ENCRYPTION_KEY, 'hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, the IV is recommended to be 12 bytes, but 16 is also common.
const AUTH_TAG_LENGTH = 16;

export const encrypt = (text: string): string => {
  // 1. Generate a random Initialization Vector (IV)
  const iv = crypto.randomBytes(IV_LENGTH);

  // 2. Create a cipher instance
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // 3. Encrypt the data
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 4. Get the Authentication Tag
  const authTag = cipher.getAuthTag();

  // 5. Combine iv, authTag, and encrypted data for storage
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
  try {
    // 1. Split the parts from the combined string
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format.');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    // 2. Create a decipher instance
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // 3. Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // In a real app, you might want to return null or handle this more gracefully
    throw new Error('Decryption failed. Data may be corrupt or tampered with.');
  }
};