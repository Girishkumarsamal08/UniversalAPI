/**
 * Configurable PII Masking Engine
 * Automatically detects and masks sensitive patterns in log messages, payloads, and queries
 */

// Credit card patterns: 13-16 digit numbers with optional dashes/spaces
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;

// US Social Security Number: XXX-XX-XXXX
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

// Email addresses
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Authorization headers, API keys, client secrets
const API_KEY_REGEX = /(?:bearer\s+|api-key\s+|key=|secret=)([A-Za-z0-9-_=.]{12,})/gi;

/**
 * Mask PII from string inputs
 */
export const maskPII = (input: string): string => {
  if (!input || typeof input !== 'string') return input;

  let masked = input;

  // Mask credit cards
  masked = masked.replace(CREDIT_CARD_REGEX, '[CREDIT_CARD_MASKED]');

  // Mask Social Security Numbers
  masked = masked.replace(SSN_REGEX, '[SSN_MASKED]');

  // Mask Email addresses
  masked = masked.replace(EMAIL_REGEX, '[EMAIL_MASKED]');

  // Mask dynamic authorization secrets & keys
  masked = masked.replace(API_KEY_REGEX, (match, keyGroup) => {
    return match.replace(keyGroup, '[SECRET_MASKED]');
  });

  return masked;
};

/**
 * Recursively masks PII inside an object payload
 */
export const maskObjectPII = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return maskPII(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(maskObjectPII);
  }

  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    // Specifically target credentials keys
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('password') ||
      lowerKey.includes('key') ||
      lowerKey.includes('auth')
    ) {
      result[key] = '[SECRET_MASKED]';
    } else {
      result[key] = maskObjectPII(val);
    }
  }

  return result;
};
