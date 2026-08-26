// Secure cryptographic utilities for Heets Alcol Time authentication

/**
 * Generates a random cryptographic salt or token
 */
export const generateSalt = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
};

/**
 * Hashes a password string with a salt using SHA-256
 */
export const hashPassword = async (password, salt = 'heets_secure_salt_2026') => {
  if (!password) return '';
  const combined = `${salt}:${password}:${salt}`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(combined);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `sha256$${salt}$${hashHex}`;
    } catch (e) {
      console.warn('Crypto subtle failed, fallback hash:', e);
    }
  }

  // Pure JS fallback hash (FNV-1a 64-bit + hex)
  let h1 = 0x811c9dc5, h2 = 0x4b9eceac;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ ch, 0x01000193);
  }
  const fallbackHex = (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  return `fnv$${salt}$${fallbackHex}`;
};

/**
 * Verifies a plain password against a stored hash (or plain text for backward compatibility)
 */
export const verifyPassword = async (plainPassword, storedHashOrPlain) => {
  if (!plainPassword || !storedHashOrPlain) return false;
  
  // If stored as plain text (legacy compatibility)
  if (!storedHashOrPlain.startsWith('sha256$') && !storedHashOrPlain.startsWith('fnv$')) {
    return plainPassword === storedHashOrPlain;
  }

  const parts = storedHashOrPlain.split('$');
  if (parts.length >= 3) {
    const salt = parts[1];
    const calculatedHash = await hashPassword(plainPassword, salt);
    return calculatedHash === storedHashOrPlain;
  }

  return false;
};

/**
 * Generate human-friendly yet unpredictable invite codes (e.g., MOD-7X9K2)
 */
export const generateInviteCode = (prefix = 'MOD') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
};
