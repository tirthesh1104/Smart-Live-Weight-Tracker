/**
 * Smart Live Weight Tracker - Unified Email Validation Utility
 * ============================================================
 * Provides RFC 5322 compatible email validation across the application.
 * Accepts all legitimate providers: Gmail, Yahoo, Outlook, Hotmail,
 * educational institutions (.edu, .ac.in, etc.), corporate domains, and public providers.
 * Trims accidental spaces and normalizes case.
 */

// Standard RFC 5322 compatible regex
// 1. Local part: alphanumeric plus allowed symbols (. _ % + -) without consecutive dots
// 2. Domain part: alphanumeric and hyphens without consecutive dots
// 3. TLD: at least 2 alphabetic characters (e.g. .com, .org, .edu, .in, .co.in, .gov.in)
const EMAIL_REGEX = /^[a-zA-Z0-9]+(?:[._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

/**
 * Normalizes email by trimming accidental leading/trailing whitespace and lowercasing.
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validates whether an email string meets standard formatting rules.
 * - Accepts: abc123@gmail.com, user.name+tag@yahoo.co.in, student@stanford.edu, etc.
 * - Rejects: missing @, missing domain, missing TLD, consecutive dots, whitespace within.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = normalizeEmail(email);
  if (clean.length < 5 || clean.length > 254) return false;
  return EMAIL_REGEX.test(clean);
}

/**
 * Provides a user-friendly validation error message or null if valid.
 */
export function getEmailValidationError(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  const clean = normalizeEmail(email);
  if (!clean.includes('@')) {
    return 'Email address is missing an "@" symbol.';
  }
  const parts = clean.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return 'Please enter a complete email address (e.g., commuter@example.com).';
  }
  if (!parts[1].includes('.')) {
    return 'Email domain must include a top-level domain (e.g., .com, .in, .edu).';
  }
  if (!isValidEmail(clean)) {
    return 'Please enter a valid email address format (e.g., commuter@example.com).';
  }
  return null;
}
