export type MediaReportCategory =
  | 'forbidden_platform_content'
  | 'adult_nudity'
  | 'violence_graphic'
  | 'harassment_hate'
  | 'spam_scam'
  | 'copyright';

export interface ReportedMediaRecord {
  id: string;
  mediaId: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaTitle: string;
  uploaderName: string;
  uploaderAvatar?: string;
  senderName?: string;
  reporterName: string;
  reportedBy?: string;
  category: MediaReportCategory;
  categoryLabel: string;
  reason: string;
  isAdultNudity: boolean;
  isForbiddenContent: boolean;
  status: 'pending' | 'removed_forbidden' | 'marked_adult' | 'dismissed';
  createdAt: string;
  reportedAt?: string;
  reviewedAt?: string;
  adminNotes?: string;
}

const REPORTED_MEDIA_STORAGE_KEY = 'freedom_reported_media_files_v1';
const REMOVED_FORBIDDEN_MEDIA_IDS_KEY = 'freedom_removed_forbidden_media_ids_v1';
const ADULT_NUDITY_MEDIA_IDS_KEY = 'freedom_adult_nudity_media_ids_v1';
const HIDE_ADULT_NUDITY_SETTING_KEY = 'freedom_hide_adult_nudity_media_v1';
const HIDE_ADULT_MODE_SETTING_KEY = 'freedom_hide_adult_nudity_mode_v1'; // 'hide' | 'blur'

export const MEDIA_REPORT_CATEGORIES: {
  id: MediaReportCategory;
  label: string;
  description: string;
  isForbiddenDefault?: boolean;
  isAdultDefault?: boolean;
}[] = [
  {
    id: 'forbidden_platform_content',
    label: 'Forbidden Content Against Platform Rules',
    description: 'Illegal, prohibited, or strictly forbidden content that violates platform terms.',
    isForbiddenDefault: true,
  },
  {
    id: 'adult_nudity',
    label: 'Adult Content / Nudity (18+ NSFW)',
    description: 'Explicit nudity, adult sexual content, or sensitive 18+ visual media.',
    isAdultDefault: true,
  },
  {
    id: 'violence_graphic',
    label: 'Graphic Violence or Dangerous Acts',
    description: 'Violent, disturbing, or dangerous media prohibited on the platform.',
    isForbiddenDefault: true,
  },
  {
    id: 'harassment_hate',
    label: 'Harassment, Bullying or Hate Speech',
    description: 'Abusive media targeting an individual or protected group.',
    isForbiddenDefault: true,
  },
  {
    id: 'spam_scam',
    label: 'Spam, Scam or Misleading Media',
    description: 'Deceptive links, phishing QR codes, or repetitive spam uploads.',
  },
  {
    id: 'copyright',
    label: 'Copyright or Intellectual Property Infringement',
    description: 'Unauthorized use of copyrighted photos or video streams.',
  },
];

const INITIAL_REPORTED_MEDIA: ReportedMediaRecord[] = [
  {
    id: 'rep_media_1',
    mediaId: 'gal-seed-vid-2',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    mediaTitle: 'Late Night Uncensored Stream Clip',
    uploaderName: 'Jacob Jones',
    uploaderAvatar:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    reporterName: 'Kristin Watson',
    category: 'forbidden_platform_content',
    categoryLabel: 'Forbidden Content Against Platform Rules',
    reason: 'Contains forbidden content violating platform community broadcasting guidelines.',
    isAdultNudity: false,
    isForbiddenContent: true,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'rep_media_2',
    mediaId: 'gal-seed-img-3',
    mediaType: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80',
    mediaTitle: 'Neon Midnight Lounge Photo',
    uploaderName: 'Jenny Wilson',
    uploaderAvatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    reporterName: 'Community Member',
    category: 'adult_nudity',
    categoryLabel: 'Adult Content / Nudity (18+ NSFW)',
    reason: 'Reported as sensitive adult / nudity photo that should be hidden for safe viewing.',
    isAdultNudity: true,
    isForbiddenContent: false,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

function emitModerationUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('freedom-media-moderation-updated'));
  }
}

export function getReportedMediaFiles(): ReportedMediaRecord[] {
  try {
    const raw = localStorage.getItem(REPORTED_MEDIA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    localStorage.setItem(REPORTED_MEDIA_STORAGE_KEY, JSON.stringify(INITIAL_REPORTED_MEDIA));
    return INITIAL_REPORTED_MEDIA;
  } catch {
    return INITIAL_REPORTED_MEDIA;
  }
}

export function saveReportedMediaFiles(list: ReportedMediaRecord[]): void {
  try {
    localStorage.setItem(REPORTED_MEDIA_STORAGE_KEY, JSON.stringify(list));
  } catch {}
  emitModerationUpdate();
}

export function reportGalleryMediaFile(params: {
  mediaId: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaTitle: string;
  uploaderName?: string;
  uploaderAvatar?: string;
  reporterName?: string;
  category: MediaReportCategory;
  reason?: string;
  markAsAdultNudity?: boolean;
}): ReportedMediaRecord {
  const existing = getReportedMediaFiles();
  const catInfo =
    MEDIA_REPORT_CATEGORIES.find((c) => c.id === params.category) || MEDIA_REPORT_CATEGORIES[0];

  const isAdult = Boolean(
    params.markAsAdultNudity || params.category === 'adult_nudity' || catInfo.isAdultDefault
  );
  const isForbidden = Boolean(
    params.category === 'forbidden_platform_content' || catInfo.isForbiddenDefault
  );

  const newRecord: ReportedMediaRecord = {
    id: `rep_media_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    mediaId: params.mediaId,
    mediaType: params.mediaType,
    mediaUrl: params.mediaUrl,
    thumbnailUrl: params.thumbnailUrl || params.mediaUrl,
    mediaTitle: params.mediaTitle || (params.mediaType === 'video' ? 'Gallery Video' : 'Gallery Photo'),
    uploaderName: params.uploaderName || 'Gallery User',
    uploaderAvatar: params.uploaderAvatar,
    reporterName: params.reporterName || 'You',
    category: params.category,
    categoryLabel: catInfo.label,
    reason: params.reason?.trim() || catInfo.description,
    isAdultNudity: isAdult,
    isForbiddenContent: isForbidden,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const updated = [newRecord, ...existing];
  saveReportedMediaFiles(updated);

  if (isAdult) {
    markMediaAsAdultNudity(params.mediaId, true);
  }

  return newRecord;
}

export function getRemovedForbiddenMediaIds(): string[] {
  try {
    const raw = localStorage.getItem(REMOVED_FORBIDDEN_MEDIA_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function adminRemoveForbiddenMediaFile(
  reportId: string,
  mediaId: string,
  adminNotes?: string
): void {
  // 1. Add mediaId to removed forbidden media list
  const removedIds = getRemovedForbiddenMediaIds();
  if (!removedIds.includes(mediaId)) {
    const nextRemoved = [...removedIds, mediaId];
    try {
      localStorage.setItem(REMOVED_FORBIDDEN_MEDIA_IDS_KEY, JSON.stringify(nextRemoved));
    } catch {}
  }

  // 2. Also add to deleted media IDs so all gallery views remove it immediately
  try {
    const deletedRaw = localStorage.getItem('freedom_deleted_media_ids');
    const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
    if (!deletedList.includes(mediaId)) {
      localStorage.setItem('freedom_deleted_media_ids', JSON.stringify([...deletedList, mediaId]));
    }
  } catch {}

  // 3. Update report status to 'removed_forbidden'
  const reports = getReportedMediaFiles();
  const updated = reports.map((r) =>
    r.id === reportId || r.mediaId === mediaId
      ? {
          ...r,
          status: 'removed_forbidden' as const,
          reviewedAt: new Date().toISOString(),
          adminNotes:
            adminNotes || 'Removed by Admin: Forbidden content violating platform guidelines.',
        }
      : r
  );
  saveReportedMediaFiles(updated);
}

export function adminRestoreRemovedMediaFile(reportId: string, mediaId: string): void {
  const removedIds = getRemovedForbiddenMediaIds().filter((id) => id !== mediaId);
  try {
    localStorage.setItem(REMOVED_FORBIDDEN_MEDIA_IDS_KEY, JSON.stringify(removedIds));
  } catch {}

  try {
    const deletedRaw = localStorage.getItem('freedom_deleted_media_ids');
    const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
    localStorage.setItem(
      'freedom_deleted_media_ids',
      JSON.stringify(deletedList.filter((id) => id !== mediaId))
    );
  } catch {}

  const reports = getReportedMediaFiles();
  const updated = reports.map((r) =>
    r.id === reportId || r.mediaId === mediaId
      ? {
          ...r,
          status: 'dismissed' as const,
          reviewedAt: new Date().toISOString(),
          adminNotes: 'Restored by Admin after review.',
        }
      : r
  );
  saveReportedMediaFiles(updated);
}

export function adminUpdateMediaReportStatus(
  reportId: string,
  status: ReportedMediaRecord['status'],
  adminNotes?: string
): void {
  const reports = getReportedMediaFiles();
  const target = reports.find((r) => r.id === reportId);
  if (target && status === 'removed_forbidden') {
    adminRemoveForbiddenMediaFile(reportId, target.mediaId, adminNotes);
    return;
  }
  if (target && status === 'marked_adult') {
    markMediaAsAdultNudity(target.mediaId, true);
  }
  const updated = reports.map((r) =>
    r.id === reportId
      ? {
          ...r,
          status,
          isAdultNudity: status === 'marked_adult' ? true : r.isAdultNudity,
          reviewedAt: new Date().toISOString(),
          adminNotes: adminNotes || r.adminNotes,
        }
      : r
  );
  saveReportedMediaFiles(updated);
}

export function getAdultNudityMediaIds(): string[] {
  try {
    const raw = localStorage.getItem(ADULT_NUDITY_MEDIA_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Seed with initial adult-flagged media ID so the user can see adult filtering working right away
    const initial = ['gal-seed-img-3'];
    localStorage.setItem(ADULT_NUDITY_MEDIA_IDS_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return ['gal-seed-img-3'];
  }
}

export function markMediaAsAdultNudity(mediaId: string, isAdult: boolean = true): string[] {
  const current = getAdultNudityMediaIds();
  const next = isAdult
    ? current.includes(mediaId)
      ? current
      : [...current, mediaId]
    : current.filter((id) => id !== mediaId);
  try {
    localStorage.setItem(ADULT_NUDITY_MEDIA_IDS_KEY, JSON.stringify(next));
  } catch {}
  emitModerationUpdate();
  return next;
}

export function unmarkMediaAsAdultNudity(mediaId: string): string[] {
  return markMediaAsAdultNudity(mediaId, false);
}

export const getReportedMediaList = getReportedMediaFiles;

export function removeForbiddenMediaByAdmin(
  reportId: string,
  mediaId: string,
  _adminEmail?: string,
  adminNotes?: string
): void {
  adminRemoveForbiddenMediaFile(reportId, mediaId, adminNotes);
}

export const restoreRemovedMediaByAdmin = adminRestoreRemovedMediaFile;

export function dismissReportedMediaByAdmin(reportId: string, _adminEmail?: string): void {
  adminUpdateMediaReportStatus(reportId, 'dismissed', 'Dismissed by Admin after review.');
}

export function deleteReportedMediaRecord(reportId: string): void {
  const list = getReportedMediaFiles().filter((r) => r.id !== reportId);
  saveReportedMediaFiles(list);
}

export const REPORT_CATEGORY_LABELS: Record<MediaReportCategory, string> = {
  forbidden_platform_content: 'Forbidden Content Against Platform Rules',
  adult_nudity: 'Adult Content / Nudity (18+ NSFW)',
  violence_graphic: 'Graphic Violence or Dangerous Acts',
  harassment_hate: 'Harassment, Bullying or Hate Speech',
  spam_scam: 'Spam, Scam or Misleading Media',
  copyright: 'Copyright or IP Infringement',
};

export function getHideAdultNuditySetting(): boolean {
  try {
    const raw = localStorage.getItem(HIDE_ADULT_NUDITY_SETTING_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return true; // Default ON for safe viewing
  } catch {
    return true;
  }
}

export function setHideAdultNuditySetting(hide: boolean): void {
  try {
    localStorage.setItem(HIDE_ADULT_NUDITY_SETTING_KEY, String(hide));
  } catch {}
  emitModerationUpdate();
}

export function getHideAdultNudityMode(): 'hide' | 'blur' {
  try {
    const raw = localStorage.getItem(HIDE_ADULT_MODE_SETTING_KEY);
    if (raw === 'hide' || raw === 'blur') return raw;
    return 'hide';
  } catch {
    return 'hide';
  }
}

export function setHideAdultNudityMode(mode: 'hide' | 'blur'): void {
  try {
    localStorage.setItem(HIDE_ADULT_MODE_SETTING_KEY, mode);
  } catch {}
  emitModerationUpdate();
}
