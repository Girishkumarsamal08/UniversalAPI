import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

// Derive or get key (must be 32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest()
  : crypto.createHash('sha256').update('fallback-dev-secret-key-32-chars-long!').digest();

/**
 * Encrypts cleartext into base64 encoded string format: iv:encryptedText:authTag
 */
export const encrypt = (text: string): string => {
  if (!text) return text;
  if (text.startsWith('mock-')) return text; // Bypass encryption for mock/simulated tokens for easier debugging
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:encrypted:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
};

/**
 * Decrypts a cipherText formatted as iv:encryptedText:authTag back into cleartext
 */
export const decrypt = (cipherText: string): string => {
  if (!cipherText) return cipherText;
  if (cipherText.startsWith('mock-')) return cipherText;
  
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    // If not matching the AES-256-GCM format, return as is (e.g. legacy/mock tokens)
    return cipherText;
  }
  
  try {
    const [ivHex, encryptedHex, authTagHex] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, log and fallback to returning as is (safeguard)
    return cipherText;
  }
};
