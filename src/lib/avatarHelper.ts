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
  if (!url || typeof url !== 'string') return false;
  return (
    (url.startsWith('data:image/') && !url.startsWith('data:image/svg+xml')) ||
    url.startsWith('blob:')
  );
}

const CURRENT_USER_ALIASES = ['user_abdullah', 'current_user', 'me', 'admin_mobilephonesky'];

/**
 * Save an uploaded user avatar & auto-generated thumbnail to localStorage and broadcast update event.
 * Never overwrites a previously uploaded real photo/thumbnail with an SVG initials placeholder.
 */
export function saveUserAvatarLocally(
  userId: string,
  avatarDataUrl: string,
  fileName?: string,
  fileSize?: string,
  thumbnailDataUrl?: string
): void {
  if (!userId || !avatarDataUrl) return;
  try {
    const existing = getSavedAvatarRecord(userId);
    const incomingIsReal = isUploadedRealAvatar(avatarDataUrl);
    const incomingThumbIsReal = isUploadedRealAvatar(thumbnailDataUrl);
    const existingIsReal = isUploadedRealAvatar(existing?.avatar);
    const existingThumbIsReal = isUploadedRealAvatar(existing?.avatarThumbnailUrl);

    // Do NOT overwrite an already-uploaded real user photo/thumbnail with an SVG initials placeholder
    if (!incomingIsReal && !incomingThumbIsReal && (existingIsReal || existingThumbIsReal)) {
      return;
    }

    const bestAvatar = incomingIsReal
      ? avatarDataUrl
      : existingIsReal && existing?.avatar
      ? existing.avatar
      : avatarDataUrl;

    const bestThumbnail = incomingThumbIsReal
      ? thumbnailDataUrl!
      : existingThumbIsReal && existing?.avatarThumbnailUrl
      ? existing.avatarThumbnailUrl!
      : incomingIsReal
      ? avatarDataUrl
      : existing?.avatarThumbnailUrl;

    const recordObj = {
      avatar: bestAvatar,
      avatarThumbnailUrl: bestThumbnail,
      avatarFileName: fileName || existing?.avatarFileName || 'uploaded_avatar.jpg',
      avatarFileSize: fileSize || existing?.avatarFileSize || '',
      updatedAt: new Date().toISOString(),
    };
    const record = JSON.stringify(recordObj);

    localStorage.setItem(`freedom_user_avatar_${userId}`, record);
    if (bestThumbnail && isUploadedRealAvatar(bestThumbnail)) {
      localStorage.setItem(`freedom_profile_thumbnail_${userId}`, bestThumbnail);
    }

    // Check if this userId is the currently active user or one of the current-user aliases
    let activeProfileId = '';
    try {
      const currentProfileRaw = localStorage.getItem('freedom_current_user_profile');
      if (currentProfileRaw) {
        const parsed = JSON.parse(currentProfileRaw);
        activeProfileId = parsed?.id || '';
      }
    } catch {}

    const isCurrentActiveUser =
      CURRENT_USER_ALIASES.includes(userId) || (activeProfileId && userId === activeProfileId);

    if (isCurrentActiveUser) {
      for (const alias of CURRENT_USER_ALIASES) {
        localStorage.setItem(`freedom_user_avatar_${alias}`, record);
        if (bestThumbnail && isUploadedRealAvatar(bestThumbnail)) {
          localStorage.setItem(`freedom_profile_thumbnail_${alias}`, bestThumbnail);
        }
      }
      if (activeProfileId) {
        localStorage.setItem(`freedom_user_avatar_${activeProfileId}`, record);
        if (bestThumbnail && isUploadedRealAvatar(bestThumbnail)) {
          localStorage.setItem(`freedom_profile_thumbnail_${activeProfileId}`, bestThumbnail);
        }
      }
      if (isUploadedRealAvatar(bestAvatar)) {
        localStorage.setItem('freedom_active_user_avatar_v1', bestAvatar);
      }
      if (bestThumbnail && isUploadedRealAvatar(bestThumbnail)) {
        localStorage.setItem('freedom_active_user_thumbnail_v1', bestThumbnail);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('freedom-avatar-updated', {
          detail: {
            userId,
            avatar: bestAvatar,
            avatarThumbnailUrl: bestThumbnail,
            fileName: recordObj.avatarFileName,
            fileSize: recordObj.avatarFileSize,
          },
        })
      );
    }
  } catch (err) {
    console.warn('Could not cache avatar in localStorage:', err);
  }
}

/**
 * Retrieve saved avatar & thumbnail metadata from localStorage for a userId
 */
export function getSavedAvatarRecord(userId?: string): {
  avatar: string;
  avatarThumbnailUrl?: string;
  avatarFileName?: string;
  avatarFileSize?: string;
  updatedAt?: string;
} | null {
  if (!userId) return null;
  try {
    const isAlias = CURRENT_USER_ALIASES.includes(userId);
    const raw =
      localStorage.getItem(`freedom_user_avatar_${userId}`) ||
      (isAlias
        ? localStorage.getItem('freedom_user_avatar_admin_mobilephonesky') ||
          localStorage.getItem('freedom_user_avatar_user_abdullah') ||
          localStorage.getItem('freedom_user_avatar_current_user') ||
          localStorage.getItem('freedom_user_avatar_me')
        : null);

    const savedThumb =
      localStorage.getItem(`freedom_profile_thumbnail_${userId}`) ||
      (isAlias ? localStorage.getItem('freedom_active_user_thumbnail_v1') : null);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.avatar === 'string' && parsed.avatar.length > 0) {
        const resolvedThumb =
          (savedThumb && isUploadedRealAvatar(savedThumb) ? savedThumb : undefined) ||
          (isUploadedRealAvatar(parsed.avatarThumbnailUrl) ? parsed.avatarThumbnailUrl : undefined) ||
          (isUploadedRealAvatar(parsed.avatar) ? parsed.avatar : undefined);
        return {
          ...parsed,
          avatar:
            isUploadedRealAvatar(parsed.avatar)
              ? parsed.avatar
              : resolvedThumb || parsed.avatar,
          avatarThumbnailUrl: resolvedThumb,
        };
      }
    }

    if (savedThumb && isUploadedRealAvatar(savedThumb)) {
      return {
        avatar: savedThumb,
        avatarThumbnailUrl: savedThumb,
        updatedAt: new Date().toISOString(),
      };
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
    localStorage.removeItem(`freedom_profile_thumbnail_${userId}`);
    if (CURRENT_USER_ALIASES.includes(userId)) {
      for (const alias of CURRENT_USER_ALIASES) {
        localStorage.removeItem(`freedom_user_avatar_${alias}`);
        localStorage.removeItem(`freedom_profile_thumbnail_${alias}`);
      }
      localStorage.removeItem('freedom_active_user_avatar_v1');
      localStorage.removeItem('freedom_active_user_thumbnail_v1');
    }
  } catch {}
}

/**
 * Return a clean, valid avatar for a user:
 * 1. If a real uploaded avatar/thumbnail is saved in localStorage for this userId, return it
 * 2. If currentAvatar is a real uploaded image (data:image/jpeg, png, webp, etc.), return it
 * 3. Otherwise remove any mock stock photo and return a crisp SVG initials avatar
 */
export function getCleanAvatar(
  name: string,
  currentAvatar?: string,
  customBg?: string,
  userId?: string
): string {
  // Guard against callers accidentally passing (avatarUrl, name) in reversed order
  let actualName = name || 'User';
  let actualAvatar = currentAvatar;
  if (
    isUploadedRealAvatar(name) ||
    (typeof name === 'string' && name.startsWith('data:image/'))
  ) {
    actualAvatar = name;
    actualName =
      currentAvatar && !currentAvatar.startsWith('data:image/') ? currentAvatar : 'User';
  }

  if (userId) {
    const saved = getSavedAvatarRecord(userId);
    if (saved?.avatar && isUploadedRealAvatar(saved.avatar)) {
      return saved.avatar;
    }
    if (saved?.avatarThumbnailUrl && isUploadedRealAvatar(saved.avatarThumbnailUrl)) {
      return saved.avatarThumbnailUrl;
    }
  }
  if (actualAvatar && isUploadedRealAvatar(actualAvatar)) {
    return actualAvatar;
  }
  if (userId) {
    const saved = getSavedAvatarRecord(userId);
    if (saved?.avatar && !isMockAvatar(saved.avatar)) {
      return saved.avatar;
    }
  }
  if (actualAvatar && !isMockAvatar(actualAvatar)) {
    return actualAvatar;
  }
  return getInitialsAvatar(actualName, customBg);
}

/**
 * Resolves the persistent user profile thumbnail/avatar so that once uploaded by a user,
 * it never disappears and remains identical in user chats, status updates, and profile page avatar.
 */
export function getPersistentUserThumbnail(
  user?: {
    id?: string;
    name?: string;
    avatar?: string;
    avatarThumbnailUrl?: string;
  } | null,
  isCurrentUser: boolean = false
): string {
  const uid = user?.id || (isCurrentUser ? 'admin_mobilephonesky' : '');
  const uName = user?.name || 'User';

  if (user?.avatarThumbnailUrl && isUploadedRealAvatar(user.avatarThumbnailUrl)) {
    return user.avatarThumbnailUrl;
  }
  if (user?.avatar && isUploadedRealAvatar(user.avatar)) {
    return user.avatar;
  }

  if (uid) {
    const saved = getSavedAvatarRecord(uid);
    if (saved?.avatarThumbnailUrl && isUploadedRealAvatar(saved.avatarThumbnailUrl)) {
      return saved.avatarThumbnailUrl;
    }
    if (saved?.avatar && isUploadedRealAvatar(saved.avatar)) {
      return saved.avatar;
    }
  }

  if (isCurrentUser || CURRENT_USER_ALIASES.includes(uid)) {
    try {
      const activeThumb = localStorage.getItem('freedom_active_user_thumbnail_v1');
      if (activeThumb && isUploadedRealAvatar(activeThumb)) return activeThumb;
      const activeAv = localStorage.getItem('freedom_active_user_avatar_v1');
      if (activeAv && isUploadedRealAvatar(activeAv)) return activeAv;
      const rawProfile = localStorage.getItem('freedom_current_user_profile');
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile);
        if (parsed?.avatarThumbnailUrl && isUploadedRealAvatar(parsed.avatarThumbnailUrl)) {
          return parsed.avatarThumbnailUrl;
        }
        if (parsed?.avatar && isUploadedRealAvatar(parsed.avatar)) {
          return parsed.avatar;
        }
      }
    } catch {}
  }

  return getCleanAvatar(uName, user?.avatarThumbnailUrl || user?.avatar, undefined, uid || undefined);
}
