export interface LikedGalleryMediaItem {
  id: string;
  messageId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  title: string;
  senderName: string;
  timestamp: string;
  likesCount: number;
  likesDisplay: string;
  isLiked: boolean;
  addedAt: string;
  contactId?: string;
}

const LIKED_USER_GALLERY_STORAGE_KEY = 'freedom_liked_user_gallery_v1';

export function formatCompactLikes(count?: number, fallbackDisplay = '120K'): string {
  if (count === undefined || count === null) return fallbackDisplay;
  if (count >= 1000000) {
    const val = (count / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${val}M`;
  }
  if (count >= 1000) {
    const val = (count / 1000).toFixed(1).replace(/\.0$/, '');
    return `${val}K`;
  }
  return String(count);
}

export function getLikedUserGalleryItems(): LikedGalleryMediaItem[] {
  try {
    const raw = localStorage.getItem(LIKED_USER_GALLERY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any legacy demo items (ug-portrait-*)
        return parsed.filter(
          (item: LikedGalleryMediaItem) =>
            item && item.id && !String(item.id).startsWith('ug-portrait-')
        );
      }
    }
  } catch {}
  return [];
}

export function saveLikedUserGalleryItems(items: LikedGalleryMediaItem[]): void {
  try {
    const cleaned = items.filter(
      (item) => item && item.id && !String(item.id).startsWith('ug-portrait-')
    );
    localStorage.setItem(LIKED_USER_GALLERY_STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent('freedom-liked-gallery-updated'));
  } catch {}
}

export function addMediaToLikedUserGallery(
  item: Partial<LikedGalleryMediaItem> & { id: string; url: string }
): LikedGalleryMediaItem[] {
  const current = getLikedUserGalleryItems();
  const cleanId = item.messageId || item.id;
  const existingIdx = current.findIndex(
    (x) => x.id === cleanId || x.messageId === cleanId || x.url === item.url
  );

  const nowTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const newEntry: LikedGalleryMediaItem = {
    id: cleanId,
    messageId: cleanId,
    type: item.type === 'video' ? 'video' : 'image',
    url: item.url,
    thumbnailUrl: item.thumbnailUrl || item.url,
    title: item.title || 'Liked Media',
    senderName: item.senderName || 'You',
    timestamp: item.timestamp || nowTime,
    likesCount: item.likesCount ?? 1,
    likesDisplay: item.likesDisplay || formatCompactLikes(item.likesCount ?? 1, '1'),
    isLiked: true,
    addedAt: new Date().toISOString(),
    contactId: item.contactId,
  };

  let updated: LikedGalleryMediaItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = {
      ...updated[existingIdx],
      ...newEntry,
    };
  } else {
    updated = [newEntry, ...current];
  }

  saveLikedUserGalleryItems(updated);
  return updated;
}

export function removeMediaFromLikedUserGallery(messageIdOrId: string): LikedGalleryMediaItem[] {
  const current = getLikedUserGalleryItems();
  const updated = current.filter(
    (x) => x.id !== messageIdOrId && x.messageId !== messageIdOrId
  );
  saveLikedUserGalleryItems(updated);
  return updated;
}
