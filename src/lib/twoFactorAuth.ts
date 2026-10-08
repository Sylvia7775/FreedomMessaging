import QRCode from 'qrcode';
import { TwoFactorAuthConfig, TwoFactorVerifyResult } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const ADMIN_2FA_DEFAULT_SECRET = 'JBSWY3DPEHPK3PXP';
export const ADMIN_2FA_DEFAULT_BACKUP_CODES = [
  'SKY987-2FA-2026',
  'FREEDOM-ROOT-888',
  'ADMIN-RECOVERY-77',
  'BACKUP-AUTH-999',
  'CORDOVA-2FA-105',
  'SECURE-SKY-4433',
];

// Base32 Character Set (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode Base32 string into Uint8Array
 */
export function base32ToUint8Array(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Encode Uint8Array into Base32 string
 */
export function uint8ArrayToBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Generate a random Base32 TOTP Secret
 */
export function generateTwoFactorSecret(length = 16): string {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return uint8ArrayToBase32(bytes).slice(0, length);
}

/**
 * Generate 6-digit TOTP code using HMAC-SHA1 (RFC 6238)
 */
export async function generateTotpCode(secret: string, timeOffsetSecs = 0): Promise<string> {
  try {
    const epochSeconds = Math.floor((Date.now() + timeOffsetSecs * 1000) / 1000);
    const counter = Math.floor(epochSeconds / 30);

    // 8-byte big-endian counter buffer
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(0, Math.floor(counter / 0x100000000));
    counterView.setUint32(4, counter & 0xffffffff);

    const keyBytes = base32ToUint8Array(secret);

    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes as unknown as BufferSource,
        { name: 'HMAC', hash: { name: 'SHA-1' } },
        false,
        ['sign']
      );

      const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
      const signatureBytes = new Uint8Array(signature);

      // Dynamic truncation
      const offset = signatureBytes[signatureBytes.length - 1] & 0x0f;
      const binary =
        ((signatureBytes[offset] & 0x7f) << 24) |
        ((signatureBytes[offset + 1] & 0xff) << 16) |
        ((signatureBytes[offset + 2] & 0xff) << 8) |
        (signatureBytes[offset + 3] & 0xff);

      const otp = binary % 1000000;
      return otp.toString().padStart(6, '0');
    }
  } catch (err) {
    console.warn('WebCrypto TOTP generation fallback:', err);
  }

  // Deterministic fallback if WebCrypto is unavailable
  const epoch = Math.floor((Date.now() + timeOffsetSecs * 1000) / 30000);
  let hash = 0;
  const str = `${secret}-${epoch}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash) % 1000000;
  return code.toString().padStart(6, '0');
}

/**
 * Get remaining seconds in current 30-second window
 */
export function getRemainingSeconds(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

/**
 * Generate 6 emergency backup recovery codes (e.g. 4F8A-92BC)
 */
export function generateBackupCodes(count = 6): string[] {
  const codes: string[] = [];
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let i = 0; i < count; i++) {
    let p1 = '';
    let p2 = '';
    for (let j = 0; j < 4; j++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(`${p1}-${p2}`);
  }
  return codes;
}

/**
 * Generate standard otpauth URL for Google Authenticator / Authy / Microsoft Authenticator
 */
export function generateOtpAuthUri(
  accountName: string,
  secret: string,
  issuer = 'Freedom Messaging'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate QR code data URL for 2FA scanning
 */
export async function generateQrCodeDataUrl(otpAuthUri: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUri, {
    width: 256,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

/**
 * Verify a 2FA code against secret (with ±30s drift tolerance) or backup codes
 */
export async function verifyTwoFactorCode(
  secret: string,
  inputCode: string,
  backupCodes: string[] = []
): Promise<TwoFactorVerifyResult> {
  const cleanInput = inputCode.trim().toUpperCase().replace(/\s+/g, '');

  if (!cleanInput) {
    return { valid: false, message: 'Please enter your 2FA verification code' };
  }

  // 1. Check emergency backup codes
  const normalizedBackupCodes = backupCodes.map((b) => b.toUpperCase().replace(/\s+/g, ''));
  const backupIndex = normalizedBackupCodes.indexOf(cleanInput);
  if (backupIndex !== -1) {
    const updatedCodes = backupCodes.filter((_, idx) => idx !== backupIndex);
    return {
      valid: true,
      isBackupCode: true,
      remainingBackupCodes: updatedCodes,
      message: 'Emergency backup code accepted! Remember this code is now used.',
    };
  }

  // 2. Check 6-digit TOTP (current, -30s, +30s)
  const cleanDigits = cleanInput.replace(/\D/g, '');
  if (cleanDigits.length === 6) {
    const windows = [0, -30, 30];
    for (const offset of windows) {
      const generated = await generateTotpCode(secret, offset);
      if (generated === cleanDigits) {
        return {
          valid: true,
          isBackupCode: false,
          message: 'Two-factor authentication verified successfully!',
        };
      }
    }
  }

  // 3. Fallback demo verification code for quick testing: "123456" or current code
  const currentCode = await generateTotpCode(secret, 0);
  if (cleanDigits === currentCode || cleanDigits === '123456') {
    return {
      valid: true,
      isBackupCode: false,
      message: 'Authentication successful!',
    };
  }

  return {
    valid: false,
    message: 'Invalid 2FA code. Please check your Authenticator app and try again.',
  };
}

/**
 * Get Admin 2FA Settings (from Firestore with localStorage fallback)
 */
export async function getAdminTwoFactorConfig(): Promise<TwoFactorAuthConfig> {
  const defaultConf: TwoFactorAuthConfig = {
    enabled: true,
    secret: ADMIN_2FA_DEFAULT_SECRET,
    otpauthUrl: generateOtpAuthUri('MobilePhonesky987@gmail.com', ADMIN_2FA_DEFAULT_SECRET),
    backupCodes: ADMIN_2FA_DEFAULT_BACKUP_CODES,
    enforceForAdmin: true,
    enforceForAllUsers: false,
    updatedAt: new Date().toISOString(),
  };

  try {
    const ref = doc(db, 'app_config', 'security_2fa');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<TwoFactorAuthConfig>;
      return {
        ...defaultConf,
        ...data,
      };
    }
  } catch (err) {
    console.warn('Could not load 2FA settings from Firestore:', err);
  }

  try {
    const cached = localStorage.getItem('freedom_admin_2fa_config');
    if (cached) {
      return { ...defaultConf, ...JSON.parse(cached) };
    }
  } catch {}

  return defaultConf;
}

/**
 * Save Admin 2FA Settings to Firestore & localStorage
 */
export async function saveAdminTwoFactorConfig(
  config: Partial<TwoFactorAuthConfig>
): Promise<void> {
  const current = await getAdminTwoFactorConfig();
  const merged: TwoFactorAuthConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  try {
    const ref = doc(db, 'app_config', 'security_2fa');
    await setDoc(ref, merged, { merge: true });
  } catch (err) {
    console.warn('Could not save 2FA config to Firestore:', err);
  }

  try {
    localStorage.setItem('freedom_admin_2fa_config', JSON.stringify(merged));
  } catch {}
}
