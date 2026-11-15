import { UserProfile } from '../types';
import { OfflineStorageService } from './offlineStorage';

// Security configuration
const STORAGE_KEY_PIN_HASH = 'slwt_admin_pin_hash_v2';
const STORAGE_KEY_ADMIN_ELEVATED = 'slwt_admin_elevated_session';
const DEPRECATED_OLD_PINS = ['77', '077', '0077'];

// Initial default secure PIN for initial authorized admin login (can be rotated by Admin)
const DEFAULT_INITIAL_PIN = '8899';

// Cryptographic hash helper (SHA-256 with project salt)
async function hashPin(pin: string): Promise<string> {
  const salted = `ir_ctc_secure_salt_2026_${pin}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salted);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash for environments without Web Crypto API
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

export class AdminSecurityService {
  /**
   * Check if the entered PIN is an old deprecated PIN that must be strictly rejected
   */
  static isDeprecatedOldPin(enteredPin: string): boolean {
    const clean = enteredPin.trim();
    return DEPRECATED_OLD_PINS.includes(clean);
  }

  /**
   * Verify an entered admin security PIN against the current active secure hash.
   * If incorrect, returns exactly: "Invalid Security PIN. Please try again."
   */
  static async verifyAdminPin(enteredPin: string): Promise<{ valid: boolean; message?: string }> {
    const clean = enteredPin.trim();

    if (!clean) {
      return {
        valid: false,
        message: 'Invalid Security PIN. Please try again.'
      };
    }

    // 1. Strict rejection of deprecated old PIN 77
    if (this.isDeprecatedOldPin(clean)) {
      OfflineStorageService.addAuditLog('Admin Access Blocked: Deprecated PIN Entered', {
        reason: 'DEPRECATED_PIN_REJECTED',
        timestamp: new Date().toISOString()
      });
      return {
        valid: false,
        message: 'Invalid Security PIN. Please try again.'
      };
    }

    if (clean.length < 4) {
      return {
        valid: false,
        message: 'Invalid Security PIN. Please try again.'
      };
    }

    // 2. Compute hash of entered PIN
    const enteredHash = await hashPin(clean);

    // 3. Compare with stored hash, or bootstrap initial authorized PIN hashes
    const storedHash = localStorage.getItem(STORAGE_KEY_PIN_HASH);
    if (storedHash) {
      if (enteredHash === storedHash) {
        return { valid: true };
      }
    } else {
      // Bootstrap authorized PINs (8899 or 4321) prior to first custom rotation
      const hash8899 = await hashPin(DEFAULT_INITIAL_PIN);
      const hash4321 = await hashPin('4321');
      if (enteredHash === hash8899 || enteredHash === hash4321) {
        return { valid: true };
      }
    }

    OfflineStorageService.addAuditLog('Admin Security PIN Failed', {
      timestamp: new Date().toISOString()
    });

    return {
      valid: false,
      message: 'Invalid Security PIN. Please try again.'
    };
  }

  /**
   * Store a newly configured Admin Security PIN hash during authorized account registration or rotation.
   */
  static async setConfiguredPin(newPin: string): Promise<string> {
    const clean = newPin.trim();
    const newHash = await hashPin(clean);
    localStorage.setItem(STORAGE_KEY_PIN_HASH, newHash);
    OfflineStorageService.addAuditLog('Admin Security PIN Configured', {
      timestamp: new Date().toISOString()
    });
    return newHash;
  }

  /**
   * Rotate / Update the Administrator Security PIN.
   * Rejects old PIN 77 and trivial PINs.
   */
  static async updateAdminPin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
    const cleanCurrent = currentPin.trim();
    const cleanNew = newPin.trim();

    if (this.isDeprecatedOldPin(cleanNew)) {
      return {
        success: false,
        message: 'Security Violation: Cannot reuse deprecated PIN 77. Choose a new secure 4-8 digit numeric PIN.'
      };
    }

    if (!cleanNew || cleanNew.length < 4 || cleanNew.length > 8 || !/^\d+$/.test(cleanNew)) {
      return {
        success: false,
        message: 'New PIN must be between 4 and 8 numeric digits.'
      };
    }

    // Verify current PIN first
    const verification = await this.verifyAdminPin(cleanCurrent);
    if (!verification.valid) {
      return {
        success: false,
        message: verification.message || 'Current Security PIN verification failed.'
      };
    }

    // Store new hash
    const newHash = await hashPin(cleanNew);
    localStorage.setItem(STORAGE_KEY_PIN_HASH, newHash);

    OfflineStorageService.addAuditLog('Admin Security PIN Rotated', {
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Administrator Security PIN has been updated successfully.'
    };
  }

  /**
   * Set elevated admin session flag
   */
  static setElevatedSession(adminProfile: UserProfile): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY_ADMIN_ELEVATED, JSON.stringify({
        verified_at: Date.now(),
        admin_id: adminProfile.id,
        admin_email: adminProfile.email,
        pin_verified: true
      }));
    }
  }

  /**
   * Check if elevated admin session is active
   */
  static isElevatedSessionActive(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const data = sessionStorage.getItem(STORAGE_KEY_ADMIN_ELEVATED);
      if (!data) return false;
      const parsed = JSON.parse(data);
      // Valid for max 8 hours
      return Boolean(parsed.pin_verified && (Date.now() - parsed.verified_at < 8 * 3600 * 1000));
    } catch {
      return false;
    }
  }

  /**
   * Clear elevated admin session
   */
  static clearElevatedSession(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_ELEVATED);
    }
  }

  /**
   * Get default initial hint for authorized admin
   */
  static isUsingDefaultPin(): boolean {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(STORAGE_KEY_PIN_HASH);
  }
}
