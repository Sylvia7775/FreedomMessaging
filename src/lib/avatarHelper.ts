/**
 * Avatar Generator, Persistent Storage & Sanitizer Utility
 * Ensures all avatars in the application are authentic:
 * - Real uploaded base64 data URLs and saved user avatars are automatically persisted and prioritized
 * - Mock/unknown stock portrait images (e.g. Unsplash photos) are removed and replaced with crisp SVG initials
 */

const AVATAR_BG_COLORS = [
  '#7C3AED', // Freedom Purple
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#0d9488', // Teal
];

/**
 * Deterministically pick a color based on a name string
 */
export function getAvatarColorForName(name: string): string {
  if (!name) return AVATAR_BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[index];
}

/**
 * Generate a clean, crisp, modern SVG initials avatar data URL
 */
export function getInitialsAvatar(name: string = 'User', customBg?: string, textColor = '#ffffff'): string {
  const cleanName = (name || 'User').replace(/\(.*\)/g, '').trim() || 'User';
  const parts = cleanName.split(/\s+/).filter(Boolean);
  let initials = 'U';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    initials = parts[0].slice(0, 2).toUpperCase();
  }

  const bg = customBg || getAvatarColorForName(cleanName);
  const safeId = initials.replace(/[^a-zA-Z0-9]/g, 'U');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g_${safeId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg}" />
        <stop offset="100%" stop-color="${bg}" stop-opacity="0.82" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="50" fill="url(#g_${safeId})" />
    <text x="50" y="53" fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="700" letter-spacing="1" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Check if an avatar URL is an unknown mock stock photo (e.g. Unsplash portrait)
 */
export function isMockAvatar(url?: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('unsplash.com') ||
    lower.includes('dummy') ||
    lower.includes('mock') ||
    lower.includes('example.com') ||
    lower.includes('pravatar.cc') ||
    lower.includes('randomuser.me')
  );
}

/**
 * Check if an avatar is a user-uploaded real image (non-SVG data URL or blob)
 */
export function isUploadedRealAvatar(url?: string): boolean {
  if (!url) return false;
  return (
    (url.startsWith('data:image/') && !url.startsWith('data:image/svg+xml')) ||
    url.startsWith('blob:')
  );
}

/**
 * Save an uploaded user avatar to localStorage and broadcast update event
 */
export function saveUserAvatarLocally(
  userId: string,
  avatarDataUrl: string,
  fileName?: string,
  fileSize?: string
): void {
  if (!userId || !avatarDataUrl) return;
  try {
    const record = JSON.stringify({
      avatar: avatarDataUrl,
      avatarFileName: fileName || 'uploaded_avatar.jpg',
      avatarFileSize: fileSize || '',
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(`freedom_user_avatar_${userId}`, record);

    // If this is the current logged-in user, also mirror to all current-user aliases
    if (
      userId === 'user_abdullah' ||
      userId === 'current_user' ||
      userId === 'me'
    ) {
      localStorage.setItem('freedom_user_avatar_user_abdullah', record);
      localStorage.setItem('freedom_user_avatar_current_user', record);
      localStorage.setItem('freedom_user_avatar_me', record);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('freedom-avatar-updated', {
          detail: {
            userId,
            avatar: avatarDataUrl,
            fileName: fileName || 'uploaded_avatar.jpg',
            fileSize: fileSize || '',
          },
        })
      );
    }
  } catch (err) {
    console.warn('Could not cache avatar in localStorage:', err);
  }
}

/**
 * Retrieve saved avatar metadata from localStorage for a userId
 */
export function getSavedAvatarRecord(userId?: string): {
  avatar: string;
  avatarFileName?: string;
  avatarFileSize?: string;
  updatedAt?: string;
} | null {
  if (!userId) return null;
  try {
    const raw =
      localStorage.getItem(`freedom_user_avatar_${userId}`) ||
      (userId === 'user_abdullah' || userId === 'current_user' || userId === 'me'
        ? localStorage.getItem('freedom_user_avatar_user_abdullah') ||
          localStorage.getItem('freedom_user_avatar_current_user')
        : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.avatar === 'string' && parsed.avatar.length > 0) {
      return parsed;
    }
  } catch {}
  return null;
}

/**
 * Remove saved custom avatar for a user so it resets cleanly to authentic initials
 */
export function clearSavedUserAvatar(userId: string): void {
  try {
    localStorage.removeItem(`freedom_user_avatar_${userId}`);
    if (
      userId === 'user_abdullah' ||
      userId === 'current_user' ||
      userId === 'me'
    ) {
      localStorage.removeItem('freedom_user_avatar_user_abdullah');
      localStorage.removeItem('freedom_user_avatar_current_user');
      localStorage.removeItem('freedom_user_avatar_me');
    }
  } catch {}
}

/**
 * Return a clean, valid avatar for a user:
 * 1. If a real uploaded avatar is saved in localStorage for this userId, return it
 * 2. If currentAvatar is a real uploaded image (data:image/jpeg, png, webp, etc.), return it
 * 3. Otherwise remove any mock stock photo and return a crisp SVG initials avatar
 */
export function getCleanAvatar(
  name: string,
  currentAvatar?: string,
  customBg?: string,
  userId?: string
): string {
  if (userId) {
    const saved = getSavedAvatarRecord(userId);
    if (saved?.avatar && !isMockAvatar(saved.avatar)) {
      return saved.avatar;
    }
  }
  if (currentAvatar && isUploadedRealAvatar(currentAvatar)) {
    return currentAvatar;
  }
  if (currentAvatar && !isMockAvatar(currentAvatar)) {
    return currentAvatar;
  }
  return getInitialsAvatar(name, customBg);
}
