import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { UserContact, UserProfile } from '../types';
import { getInitialsAvatar } from './avatarHelper';

export interface ScannedContactPayload {
  id?: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  nativeLanguage: string;
  bio?: string;
  avatar?: string;
  initialMessage?: string;
  isFreedomUser?: boolean;
}

export interface DemoQrContact {
  id: string;
  name: string;
  phoneNumber: string;
  nativeLanguage: string;
  bio: string;
  avatar: string;
  initialMessage: string;
  role: string;
}

export const DEMO_QR_CONTACTS: DemoQrContact[] = [
  {
    id: 'contact_elena_rostova',
    name: 'Elena Rostova',
    phoneNumber: '+1 (555) 349-8812',
    nativeLanguage: 'Russian',
    bio: 'Product Designer & Multilingual Polyglot',
    avatar: getInitialsAvatar('Elena Rostova', '#8b5cf6'),
    initialMessage: 'Privet! Excited to connect on Freedom.',
    role: 'Product Designer',
  },
  {
    id: 'contact_mateo_silva',
    name: 'Mateo Silva',
    phoneNumber: '+34 612 884 920',
    nativeLanguage: 'Spanish',
    bio: 'Mobile & Cloud Architect in Barcelona',
    avatar: getInitialsAvatar('Mateo Silva', '#3b82f6'),
    initialMessage: 'Hola amigo! Adding you via QR.',
    role: 'Cloud Architect',
  },
  {
    id: 'contact_kenji_sato',
    name: 'Dr. Kenji Sato',
    phoneNumber: '+81 90-1234-5678',
    nativeLanguage: 'Japanese',
    bio: 'AI & Real-time Translation Researcher',
    avatar: getInitialsAvatar('Kenji Sato', '#10b981'),
    initialMessage: 'Konnichiwa! Great connecting with you.',
    role: 'AI Researcher',
  },
  {
    id: 'contact_amara_okafor',
    name: 'Amara Okafor',
    phoneNumber: '+234 803 123 4567',
    nativeLanguage: 'English',
    bio: 'Global Documentary Filmmaker',
    avatar: getInitialsAvatar('Amara Okafor', '#f59e0b'),
    initialMessage: 'Hello! Stoked to share stories across languages.',
    role: 'Filmmaker',
  },
  {
    id: 'contact_lucian_dubois',
    name: 'Lucian Dubois',
    phoneNumber: '+33 6 45 89 12 34',
    nativeLanguage: 'French',
    bio: 'Spatial Audio Engineer in Paris',
    avatar: getInitialsAvatar('Lucian Dubois', '#06b6d4'),
    initialMessage: 'Bonjour! Let’s test live translation.',
    role: 'Audio Engineer',
  },
];

/**
 * Parses raw decoded QR string into structured ScannedContactPayload.
 * Robust parser supporting:
 * 1. Freedom JSON format {"freedomContact": true, ...}
 * 2. Freedom URL format: freedom://contact?name=...&phone=...
 * 3. vCard format (BEGIN:VCARD ... FN: ... TEL: ...)
 * 4. Plain text / Phone / Key-value lines
 */
export function parseQrContactData(rawText: string): ScannedContactPayload {
  const trimmed = rawText.trim();

  // 1. Check for JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return {
          id: parsed.id || parsed.userId || `contact_qr_${Date.now()}`,
          name: parsed.name || parsed.fullName || parsed.displayName || 'Unnamed Contact',
          phoneNumber: parsed.phoneNumber || parsed.phone || parsed.tel || '',
          email: parsed.email || '',
          nativeLanguage: parsed.nativeLanguage || parsed.motherLanguage || parsed.language || 'English',
          bio: parsed.bio || parsed.statusText || parsed.status || 'Freedom contact added via QR code',
          avatar: parsed.avatar || parsed.avatarUrl || parsed.photoUrl || '',
          initialMessage: parsed.initialMessage || 'Hello! Connected via QR code scan.',
          isFreedomUser: true,
        };
      }
    } catch {
      // Continue to next parsers
    }
  }

  // 2. Check for Freedom URI format: freedom://contact?name=...&phone=... or freedom:contact?...
  if (trimmed.toLowerCase().startsWith('freedom://') || trimmed.toLowerCase().startsWith('freedom:')) {
    try {
      const urlStr = trimmed.replace(/^freedom:\/\//i, 'https://freedom.app/').replace(/^freedom:/i, 'https://freedom.app/');
      const url = new URL(urlStr);
      const name = url.searchParams.get('name') || url.searchParams.get('fn') || 'Freedom User';
      const phoneNumber = url.searchParams.get('phone') || url.searchParams.get('tel') || '';
      const email = url.searchParams.get('email') || '';
      const nativeLanguage = url.searchParams.get('lang') || url.searchParams.get('language') || 'English';
      const bio = url.searchParams.get('bio') || 'Scanned via Freedom QR Code';
      const avatar = url.searchParams.get('avatar') || '';
      const initialMessage = url.searchParams.get('msg') || 'Hi! Connected via Freedom QR scan.';
      const id = url.searchParams.get('id') || `contact_qr_${Date.now()}`;

      return {
        id,
        name,
        phoneNumber,
        email,
        nativeLanguage,
        bio,
        avatar,
        initialMessage,
        isFreedomUser: true,
      };
    } catch {
      // Continue to next parsers
    }
  }

  // 3. Check for vCard format (BEGIN:VCARD)
  if (trimmed.toUpperCase().includes('BEGIN:VCARD')) {
    let name = '';
    let phoneNumber = '';
    let email = '';
    let bio = '';
    let nativeLanguage = 'English';
    let avatar = '';

    const lines = trimmed.split(/\r\n|\r|\n/);
    for (const line of lines) {
      const upper = line.toUpperCase();
      if (upper.startsWith('FN:')) {
        name = line.substring(3).trim();
      } else if (upper.startsWith('N:') && !name) {
        const parts = line.substring(2).split(';');
        name = parts.filter(Boolean).reverse().join(' ').trim();
      } else if (upper.startsWith('TEL') || upper.startsWith('TEL:')) {
        const idx = line.indexOf(':');
        if (idx !== -1) phoneNumber = line.substring(idx + 1).trim();
      } else if (upper.startsWith('EMAIL') || upper.startsWith('EMAIL:')) {
        const idx = line.indexOf(':');
        if (idx !== -1) email = line.substring(idx + 1).trim();
      } else if (upper.startsWith('NOTE:') || upper.startsWith('TITLE:')) {
        const idx = line.indexOf(':');
        if (idx !== -1) {
          const val = line.substring(idx + 1).trim();
          if (val.toLowerCase().includes('lang:')) {
            nativeLanguage = val.split('lang:')[1]?.trim().split(/[;\n]/)[0] || nativeLanguage;
          } else {
            bio = val;
          }
        }
      } else if (upper.startsWith('PHOTO:') || upper.startsWith('PHOTO;')) {
        const idx = line.indexOf(':');
        if (idx !== -1) avatar = line.substring(idx + 1).trim();
      }
    }

    return {
      id: `contact_vcard_${Date.now()}`,
      name: name || 'vCard Contact',
      phoneNumber,
      email,
      nativeLanguage,
      bio: bio || 'Imported via vCard QR scan',
      avatar,
      initialMessage: 'Hello! Added via vCard QR scan.',
      isFreedomUser: false,
    };
  }

  // 4. Plain text / telephone fallback
  // If it's a telephone number
  const cleanPhoneCandidate = trimmed.replace(/[^\d+]/g, '');
  if (cleanPhoneCandidate.length >= 7 && /^\+?[\d\s\-()]+$/.test(trimmed)) {
    return {
      id: `contact_phone_${Date.now()}`,
      name: `User ${trimmed.slice(-4)}`,
      phoneNumber: trimmed,
      nativeLanguage: 'English',
      bio: 'Added via phone number QR code',
      initialMessage: 'Hello! Added your phone via QR scan.',
      isFreedomUser: false,
    };
  }

  // Generic text fallback (could be a name or message)
  return {
    id: `contact_qr_${Date.now()}`,
    name: trimmed.slice(0, 40) || 'Scanned Contact',
    nativeLanguage: 'English',
    bio: 'Added via QR code scan',
    initialMessage: 'Hello from Freedom Chat!',
    isFreedomUser: false,
  };
}

/**
 * Generate a JSON string payload formatted for Freedom Contact QR codes
 */
export function formatContactQrPayload(contact: {
  id?: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  nativeLanguage?: string;
  bio?: string;
  avatar?: string;
}): string {
  return JSON.stringify({
    freedomContact: true,
    version: '1.0',
    id: contact.id || `user_${Date.now()}`,
    name: contact.name,
    phoneNumber: contact.phoneNumber || '',
    email: contact.email || '',
    nativeLanguage: contact.nativeLanguage || 'English',
    bio: contact.bio || '',
    avatar: contact.avatar || '',
  });
}

/**
 * Generate QR code data URL using `qrcode` library
 */
export async function generateQrDataUrl(
  text: string,
  options?: {
    primaryColor?: string;
    width?: number;
    margin?: number;
  }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options?.width || 320,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.primaryColor || '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    throw err;
  }
}

/**
 * Synthesizes a pleasant high-tech audio chime when a QR code is scanned
 * Uses Web Audio API without external audio file dependencies
 */
export function playQrScanSuccessSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (pleasant mid-high)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second tone (higher chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, now + 0.08); // A6
    gain2.gain.setValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.32);
  } catch {
    // AudioContext blocked or not allowed by browser autoplay policy
  }
}

/**
 * Scan an image element / canvas / file for QR code using jsQR
 */
export function decodeQrFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): string | null {
  try {
    const code = jsQR(data, width, height, {
      inversionAttempts: 'attemptBoth',
    });
    return code ? code.data : null;
  } catch (err) {
    console.warn('Error in jsQR decode:', err);
    return null;
  }
}
