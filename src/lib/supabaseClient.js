import { createClient } from '@supabase/supabase-js';

/**
 * Sanitizes environment variables: trims spaces, removes wrapping quotes (' or ")
 */
const sanitizeEnv = (val) => {
  if (!val || typeof val !== 'string') return '';
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
};

// Direct property access so Vite can statically replace during build
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = sanitizeEnv(rawUrl);
const supabaseAnonKey = sanitizeEnv(rawKey);

/**
 * Validates whether the Supabase URL is properly formatted
 */
const isValidSupabaseUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (
    lower === 'your_supabase_project_url' ||
    lower.includes('placeholder') ||
    lower === 'undefined' ||
    lower === 'null' ||
    lower === ''
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validates whether the Supabase Anon Key is present and non-placeholder
 */
const isValidSupabaseKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  const lower = key.toLowerCase();
  if (
    lower === 'your_supabase_anon_key' ||
    lower === 'your_anon_key' ||
    lower.includes('placeholder') ||
    lower === 'undefined' ||
    lower === 'null' ||
    lower === ''
  ) {
    return false;
  }
  // Supabase anon keys are JWTs or lengthy API keys (> 20 chars)
  return key.length > 20;
};

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(supabaseUrl) && isValidSupabaseKey(supabaseAnonKey)
);

let clientInstance = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('[Supabase] Inizializzazione fallita:', err?.message || err);
  }
}

export const supabase = clientInstance;

export const getSupabase = async () => supabase;

/**
 * Safe non-sensitive diagnostic check for debugging configuration issues.
 * NEVER returns or logs the actual key value.
 */
export const getSupabaseDiagnostics = () => {
  return {
    urlPresent: Boolean(supabaseUrl),
    urlValid: isValidSupabaseUrl(supabaseUrl),
    keyPresent: Boolean(supabaseAnonKey),
    keyValid: isValidSupabaseKey(supabaseAnonKey),
    isConfigured: isSupabaseConfigured,
    clientReady: Boolean(supabase),
  };
};

// Safe diagnostic log to browser console (no secrets exposed)
if (typeof window !== 'undefined') {
  const diag = getSupabaseDiagnostics();
  console.log('[Supabase Config Status]', {
    'Supabase URL presente': diag.urlPresent,
    'Supabase URL valido': diag.urlValid,
    'Supabase Anon Key presente': diag.keyPresent,
    'Supabase Anon Key valida': diag.keyValid,
    'Client Supabase creato': diag.clientReady,
  });
}

