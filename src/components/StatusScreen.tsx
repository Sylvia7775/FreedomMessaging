import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StatusBar } from './StatusBar';
import { BottomNav } from './BottomNav';
import {
  Camera,
  Plus,
  Edit3,
  Clock,
  Eye,
  Trash2,
  X,
  Send,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  Video,
  Type,
  Palette,
  CheckCircle2,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import {
  EphemeralStatusItem,
  ScreenView,
  ThemeMode,
  UserContact,
  UserProfile,
} from '../types';
import { getPersistentUserThumbnail } from '../lib/avatarHelper';
import { generateProfileThumbnailFile } from '../lib/videoPlatformHelper';
import {
  VerifiedCheckmarkBadge,
  isAccountProfileValidated,
} from './VerifiedCheckmarkBadge';

interface StatusScreenProps {
  currentUser: UserProfile;
  contacts: UserContact[];
  onNavigate: (screen: ScreenView) => void;
  onReplyToStatus?: (contact: UserContact, statusItem: EphemeralStatusItem, replyText: string) => void;
  theme?: ThemeMode;
  primaryColor?: string;
  isAdminVerified?: boolean;
}

const STATUS_STORAGE_KEY = 'freedom_ephemeral_statuses_v1';
const VIEWED_STATUS_IDS_KEY = 'freedom_viewed_status_ids_v1';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const TEXT_STATUS_BACKGROUNDS = [
  'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
  'linear-gradient(135deg, #059669 0%, #10B981 100%)',
  'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #D97706 0%, #EF4444 100%)',
  'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
  'linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)',
  'linear-gradient(135deg, #BE123C 0%, #FB7185 100%)',
  'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
];

const QUICK_STATUS_EMOJIS = ['❤️', '🔥', '😂', '👏', '😍', '🎉'];

function formatRelativeTime(createdAtMs: number, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  if (diffHr < 24) {
    return remMin > 0 ? `${diffHr}h ${remMin}m ago` : `${diffHr}h ago`;
  }
  return '23h ago';
}

function formatTimeRemaining(expiresAtMs: number, nowMs: number): string {
  const remainingMs = Math.max(0, expiresAtMs - nowMs);
  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m left`;
  return `${hours}h ${minutes}m left`;
}

function buildDefaultStatuses(contacts: UserContact[]): EphemeralStatusItem[] {
  const now = Date.now();
  const c1 = contacts[0];
  const c2 = contacts[1];
  const c3 = contacts[2];

  const defaults: EphemeralStatusItem[] = [];

  if (c1) {
    const created1 = now - 35 * 60 * 1000; // 35 mins ago
    defaults.push({
      id: 'status_default_c1_1',
      userId: c1.id,
      userName: c1.name,
      userAvatar: getPersistentUserThumbnail(c1, false),
      userThumbnailUrl: getPersistentUserThumbnail(c1, false),
      isVerified: isAccountProfileValidated(c1),
      type: 'image',
      mediaUrl:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
      caption: 'Sunset vibes after a productive multilingual team call!🌅✨',
      createdAt: created1,
      expiresAt: created1 + TWENTY_FOUR_HOURS_MS,
      viewsCount: 18,
    });
  }

  if (c2) {
    const created2 = now - 2 * 60 * 60 * 1000; // 2 hours ago
    defaults.push({
      id: 'status_default_c2_1',
      userId: c2.id,
      userName: c2.name,
      userAvatar: getPersistentUserThumbnail(c2, false),
      userThumbnailUrl: getPersistentUserThumbnail(c2, false),
      isVerified: isAccountProfileValidated(c2),
      type: 'text',
      text: 'Testing instant voice translation on WeedChat today 🚀 Talk in any mother language effortlessly!',
      bgColor: TEXT_STATUS_BACKGROUNDS[0],
      fontStyle: 'bold',
      createdAt: created2,
      expiresAt: created2 + TWENTY_FOUR_HOURS_MS,
      viewsCount: 24,
    });
  }

  if (c3) {
    const created3 = now - 5 * 60 * 60 * 1000; // 5 hours ago
    defaults.push({
      id: 'status_default_c3_1',
      userId: c3.id,
      userName: c3.name,
      userAvatar: getPersistentUserThumbnail(c3, false),
      userThumbnailUrl: getPersistentUserThumbnail(c3, false),
      isVerified: isAccountProfileValidated(c3),
      type: 'image',
      mediaUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&auto=format&fit=crop&q=80',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      caption: 'Late night studio session 🎧🔥 Disappears in 24 hours!',
      createdAt: created3,
      expiresAt: created3 + TWENTY_FOUR_HOURS_MS,
      viewsCount: 31,
    });
  }

  return defaults;
}

export const StatusScreen: React.FC<StatusScreenProps> = ({
  currentUser,
  contacts,
  onNavigate,
  onReplyToStatus,
  theme = 'light',
  primaryColor = '#7C3AED',
  isAdminVerified = false,
}) => {
  const isDark = theme === 'dark';
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Resolve persistent user profile thumbnail so it never disappears and matches Chats & Profile Page
  const persistentMyThumbnail = getPersistentUserThumbnail(currentUser, true);

  // Load & filter only non-expired (< 24h) statuses
  const [statuses, setStatuses] = useState<EphemeralStatusItem[]>(() => {
    const currentNow = Date.now();
    try {
      const saved = localStorage.getItem(STATUS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EphemeralStatusItem[];
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (item) => item && typeof item.expiresAt === 'number' && item.expiresAt > currentNow
          );
          if (valid.length > 0) {
            return valid;
          }
        }
      }
    } catch {}
    return buildDefaultStatuses(contacts);
  });

  // Track which status IDs the user has viewed
  const [viewedStatusIds, setViewedStatusIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(VIEWED_STATUS_IDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {}
    return new Set();
  });

  // Composer modals state
  const [isTextComposerOpen, setIsTextComposerOpen] = useState(false);
  const [textStatusInput, setTextStatusInput] = useState('');
  const [selectedBgIndex, setSelectedBgIndex] = useState(0);
  const [selectedFontStyle, setSelectedFontStyle] = useState<'sans' | 'serif' | 'mono' | 'bold'>('bold');

  const [isMediaComposerOpen, setIsMediaComposerOpen] = useState(false);
  const [pendingMediaData, setPendingMediaData] = useState<{
    type: 'image' | 'video';
    mediaUrl: string;
    thumbnailUrl: string;
    fileName: string;
  } | null>(null);
  const [mediaCaptionInput, setMediaCaptionInput] = useState('');
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);

  const [showManageMyStatuses, setShowManageMyStatuses] = useState(false);
  const [statusFeedbackToast, setStatusFeedbackToast] = useState<string | null>(null);

  // Full-screen Story Viewer state
  const [activeViewerUserId, setActiveViewerUserId] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [slideProgress, setSlideProgress] = useState<number>(0);
  const [isViewerPaused, setIsViewerPaused] = useState<boolean>(false);
  const [replyInputText, setReplyInputText] = useState<string>('');

  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setStatusFeedbackToast(msg);
    setTimeout(() => {
      setStatusFeedbackToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Periodically prune expired (> 24 hours) status updates every 15 seconds
  useEffect(() => {
    const pruneExpired = () => {
      const currentNow = Date.now();
      setNowMs(currentNow);
      setStatuses((prev) => {
        const activeOnly = prev.filter((item) => item.expiresAt > currentNow);
        if (activeOnly.length !== prev.length) {
          try {
            localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(activeOnly));
          } catch {}
        }
        return activeOnly;
      });
    };
    const interval = setInterval(pruneExpired, 15000);
    return () => clearInterval(interval);
  }, []);

  // Persist statuses whenever updated
  const saveStatusesList = (nextList: EphemeralStatusItem[]) => {
    const currentNow = Date.now();
    const activeOnly = nextList.filter((s) => s.expiresAt > currentNow);
    setStatuses(activeOnly);
    try {
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(activeOnly));
    } catch {}
  };

  const markStatusViewed = (statusId: string) => {
    setViewedStatusIds((prev) => {
      if (prev.has(statusId)) return prev;
      const next = new Set(prev);
      next.add(statusId);
      try {
        localStorage.setItem(VIEWED_STATUS_IDS_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Separate current user's statuses from contacts' statuses
  const myUserId = currentUser.id || 'user_abdullah';
  const myStatuses = useMemo(() => {
    return statuses
      .filter(
        (s) =>
          (s.userId === myUserId ||
            s.userId === 'me' ||
            s.userId === 'user_abdullah' ||
            s.userId === 'admin_mobilephonesky') &&
          s.expiresAt > nowMs
      )
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [statuses, myUserId, nowMs]);

  // Group contact statuses by userId
  const contactStatusGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        userId: string;
        userName: string;
        userAvatar: string;
        isVerified?: boolean;
        items: EphemeralStatusItem[];
        latestCreatedAt: number;
        allViewed: boolean;
      }
    >();

    statuses
      .filter(
        (s) =>
          s.userId !== myUserId &&
          s.userId !== 'me' &&
          s.userId !== 'user_abdullah' &&
          s.userId !== 'admin_mobilephonesky' &&
          s.expiresAt > nowMs
      )
      .forEach((item) => {
        const matchedContact = contacts.find((c) => c.id === item.userId);
        const resolvedAvatar = matchedContact
          ? getPersistentUserThumbnail(matchedContact, false)
          : item.userThumbnailUrl || item.userAvatar;
        const existing = map.get(item.userId);
        if (!existing) {
          map.set(item.userId, {
            userId: item.userId,
            userName: matchedContact?.name || item.userName,
            userAvatar: resolvedAvatar,
            isVerified: matchedContact ? isAccountProfileValidated(matchedContact) : item.isVerified,
            items: [item],
            latestCreatedAt: item.createdAt,
            allViewed: viewedStatusIds.has(item.id),
          });
        } else {
          existing.items.push(item);
          existing.items.sort((a, b) => a.createdAt - b.createdAt);
          if (item.createdAt > existing.latestCreatedAt) {
            existing.latestCreatedAt = item.createdAt;
          }
          existing.allViewed = existing.items.every((i) => viewedStatusIds.has(i.id));
        }
      });

    const groups = Array.from(map.values()).sort((a, b) => b.latestCreatedAt - a.latestCreatedAt);
    return {
      recent: groups.filter((g) => !g.allViewed),
      viewed: groups.filter((g) => g.allViewed),
    };
  }, [statuses, contacts, myUserId, nowMs, viewedStatusIds]);

  // Active viewer items
  const activeViewerItems = useMemo(() => {
    if (!activeViewerUserId) return [];
    if (activeViewerUserId === 'me' || activeViewerUserId === myUserId) {
      return myStatuses;
    }
    return statuses
      .filter((s) => s.userId === activeViewerUserId && s.expiresAt > nowMs)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [activeViewerUserId, myUserId, myStatuses, statuses, nowMs]);

  const currentSlide = activeViewerItems[activeSlideIndex] || null;

  // Story viewer auto-advance timer (5 seconds per status slide)
  useEffect(() => {
    if (!activeViewerUserId || !currentSlide || isViewerPaused) return;

    markStatusViewed(currentSlide.id);

    const stepMs = 50;
    const durationMs = 5000;
    const increment = (stepMs / durationMs) * 100;

    const timer = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev + increment >= 100) {
          if (activeSlideIndex < activeViewerItems.length - 1) {
            setActiveSlideIndex((idx) => idx + 1);
            return 0;
          } else {
            setActiveViewerUserId(null);
            setActiveSlideIndex(0);
            return 0;
          }
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [activeViewerUserId, currentSlide?.id, activeSlideIndex, activeViewerItems.length, isViewerPaused]);

  const openViewerForUser = (targetUserId: string, startIndex: number = 0) => {
    setActiveViewerUserId(targetUserId);
    setActiveSlideIndex(startIndex);
    setSlideProgress(0);
    setIsViewerPaused(false);
    setReplyInputText('');
  };

  // Post a new 24h Text Status
  const handlePostTextStatus = () => {
    const cleanText = textStatusInput.trim();
    if (!cleanText) return;

    const created = Date.now();
    const newStatus: EphemeralStatusItem = {
      id: `status_txt_${created}`,
      userId: myUserId,
      userName: currentUser.name || 'You',
      userAvatar: persistentMyThumbnail,
      userThumbnailUrl: persistentMyThumbnail,
      isVerified: Boolean(currentUser.isVerified || currentUser.verifiedByAdmin),
      type: 'text',
      text: cleanText,
      bgColor: TEXT_STATUS_BACKGROUNDS[selectedBgIndex % TEXT_STATUS_BACKGROUNDS.length],
      fontStyle: selectedFontStyle,
      createdAt: created,
      expiresAt: created + TWENTY_FOUR_HOURS_MS,
      viewsCount: 1,
    };

    saveStatusesList([...statuses, newStatus]);
    setTextStatusInput('');
    setIsTextComposerOpen(false);
    showToast('✅ Status posted! Will automatically disappear after 24 hours.');
  };

  // Handle selecting a Photo or Video file for a 24h Media Status
  const handleSelectMediaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      showToast('Please select an image or video file for your 24h Status.');
      return;
    }

    try {
      setIsGeneratingThumb(true);
      setIsMediaComposerOpen(true);
      const thumbRes = await generateProfileThumbnailFile(file, 240, 240, 800);
      setPendingMediaData({
        type: isVideo ? 'video' : 'image',
        mediaUrl: thumbRes.dataUrl,
        thumbnailUrl: thumbRes.thumbnailDataUrl,
        fileName: file.name,
      });
    } catch {
      showToast('Could not process selected file.');
      setIsMediaComposerOpen(false);
    } finally {
      setIsGeneratingThumb(false);
    }
  };

  const handlePostMediaStatus = () => {
    if (!pendingMediaData) return;
    const created = Date.now();
    const safeMediaUrl =
      pendingMediaData.mediaUrl.length <= 240000
        ? pendingMediaData.mediaUrl
        : pendingMediaData.thumbnailUrl;

    const newStatus: EphemeralStatusItem = {
      id: `status_media_${created}`,
      userId: myUserId,
      userName: currentUser.name || 'You',
      userAvatar: persistentMyThumbnail,
      userThumbnailUrl: persistentMyThumbnail,
      isVerified: Boolean(currentUser.isVerified || currentUser.verifiedByAdmin),
      type: pendingMediaData.type,
      mediaUrl: safeMediaUrl,
      thumbnailUrl: pendingMediaData.thumbnailUrl,
      caption: mediaCaptionInput.trim() || undefined,
      createdAt: created,
      expiresAt: created + TWENTY_FOUR_HOURS_MS,
      viewsCount: 1,
    };

    saveStatusesList([...statuses, newStatus]);
    setPendingMediaData(null);
    setMediaCaptionInput('');
    setIsMediaComposerOpen(false);
    showToast('✅ Media Status posted! Disappears automatically after 24 hours.');
  };

  const handleDeleteStatus = (statusId: string) => {
    const updated = statuses.filter((s) => s.id !== statusId);
    saveStatusesList(updated);
    showToast('🗑️ Status update deleted.');
    if (activeViewerUserId && activeViewerItems.length <= 1) {
      setActiveViewerUserId(null);
    } else if (activeSlideIndex >= activeViewerItems.length - 1) {
      setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    }
  };

  const handleSendStatusReply = (replyText: string) => {
    if (!currentSlide || !replyText.trim()) return;
    const targetContact = contacts.find((c) => c.id === currentSlide.userId) || contacts[0];
    if (targetContact && onReplyToStatus) {
      onReplyToStatus(targetContact, currentSlide, replyText.trim());
    }
    setReplyInputText('');
    setIsViewerPaused(false);
    showToast(`💬 Sent reply to ${currentSlide.userName}!`);
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-[#12161F] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Hidden File Input for Photo/Video Status Upload */}
      <input
        ref={mediaFileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleSelectMediaFile}
        className="hidden"
      />

      {/* Top Header (WhatsApp Status Header) */}
      <div
        style={{ backgroundColor: primaryColor }}
        className="pt-1 pb-3.5 px-4 z-10 shrink-0 text-white rounded-b-[24px] shadow-sm"
      >
        <StatusBar time="9:41" theme="green" className="px-0 -mx-1 text-white" />

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Status</h1>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>24h Ephemeral</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="status-header-text-btn"
              type="button"
              onClick={() => setIsTextComposerOpen(true)}
              className="px-2.5 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center gap-1 transition-all cursor-pointer text-white text-[11px] font-bold"
              title="Create Text Status (Disappears after 24h)"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
            <button
              id="status-header-camera-btn"
              type="button"
              onClick={() => mediaFileInputRef.current?.click()}
              className="px-2.5 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center gap-1 transition-all cursor-pointer text-white text-[11px] font-bold"
              title="Upload Photo or Video Status (Disappears after 24h)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photo/Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable Status Body */}
      <div
        style={{ WebkitOverflowScrolling: 'touch' }}
        className="flex-1 overflow-y-auto overscroll-y-contain px-3.5 pt-3.5 pb-24 space-y-4"
      >
        {/* Toast Feedback Banner */}
        {statusFeedbackToast && (
          <div
            style={{ backgroundColor: `${primaryColor}18`, borderColor: `${primaryColor}45` }}
            className="p-2.5 rounded-2xl border flex items-center gap-2 text-xs font-bold animate-in fade-in duration-150"
          >
            <CheckCircle2 style={{ color: primaryColor }} className="w-4 h-4 shrink-0" />
            <span>{statusFeedbackToast}</span>
          </div>
        )}

        {/* 1. MY STATUS CARD (WhatsApp Style) */}
        <div
          className={`p-3.5 rounded-2xl border shadow-xs space-y-3 ${
            isDark ? 'bg-[#181F2C] border-slate-800' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => {
                if (myStatuses.length > 0) {
                  openViewerForUser(myUserId, 0);
                } else {
                  setIsTextComposerOpen(true);
                }
              }}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
            >
              {/* Persistent User Profile Thumbnail Avatar with Status Ring */}
              <div className="relative shrink-0">
                <div
                  style={
                    myStatuses.length > 0
                      ? { borderColor: '#25D366' }
                      : { borderColor: primaryColor }
                  }
                  className={`w-15 h-15 rounded-full p-0.5 border-2 transition-transform group-hover:scale-105 ${
                    myStatuses.length > 0 ? 'ring-2 ring-emerald-500/30' : ''
                  }`}
                >
                  <img
                    id="status-my-profile-thumbnail-img"
                    src={persistentMyThumbnail}
                    alt={currentUser.name}
                    className="w-full h-full rounded-full object-cover bg-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    mediaFileInputRef.current?.click();
                  }}
                  style={{ backgroundColor: '#25D366' }}
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full text-white flex items-center justify-center border-2 border-white dark:border-[#181F2C] shadow-md cursor-pointer hover:scale-110 transition-transform"
                  title="Add Photo or Video Status"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm sm:text-base truncate">My Status</h2>
                  {myStatuses.length > 0 && (
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-extrabold">
                      {myStatuses.length} active
                    </span>
                  )}
                </div>
                {myStatuses.length > 0 ? (
                  <div className="space-y-0.5 mt-0.5">
                    <p className="text-xs text-slate-400 truncate">
                      Posted {formatRelativeTime(myStatuses[myStatuses.length - 1].createdAt, nowMs)} • Tap to view
                    </p>
                    <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>
                        Disappears in{' '}
                        {formatTimeRemaining(myStatuses[myStatuses.length - 1].expiresAt, nowMs)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    Tap to add a status update • Disappears after 24 hours
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons on My Status row */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="status-create-text-btn"
                type="button"
                onClick={() => setIsTextComposerOpen(true)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all active:scale-95 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title="Write Text Status"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                id="status-create-media-btn"
                type="button"
                onClick={() => mediaFileInputRef.current?.click()}
                style={{ backgroundColor: primaryColor }}
                className="p-2.5 rounded-xl text-white shadow-sm cursor-pointer transition-all hover:brightness-110 active:scale-95"
                title="Upload Photo or Video Status"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Manage My Active 24h Statuses Drawer Toggle */}
          {myStatuses.length > 0 && (
            <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowManageMyStatuses((prev) => !prev)}
                  className="text-[11px] font-bold text-emerald-500 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {showManageMyStatuses
                      ? 'Hide my active status slides'
                      : `Manage my ${myStatuses.length} status update${myStatuses.length > 1 ? 's' : ''}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openViewerForUser(myUserId, 0)}
                  className="text-[11px] font-bold text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play My Status</span>
                </button>
              </div>

              {showManageMyStatuses && (
                <div className="mt-2.5 space-y-2">
                  {myStatuses.map((st, idx) => (
                    <div
                      key={st.id}
                      onClick={() => openViewerForUser(myUserId, idx)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer ${
                        isDark
                          ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-900'
                          : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {st.type === 'text' ? (
                          <div
                            style={{ background: st.bgColor || TEXT_STATUS_BACKGROUNDS[0] }}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[9px] font-bold px-1 text-center leading-tight shrink-0"
                          >
                            <span className="line-clamp-2">{st.text}</span>
                          </div>
                        ) : (
                          <img
                            src={st.thumbnailUrl || st.mediaUrl}
                            alt="Status slide"
                            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-900"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {st.type === 'text' ? st.text : st.caption || `${st.type.toUpperCase()} Status`}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{formatRelativeTime(st.createdAt, nowMs)}</span>
                            <span>•</span>
                            <span className="text-amber-500 font-semibold">
                              {formatTimeRemaining(st.expiresAt, nowMs)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Eye className="w-2.5 h-2.5" />
                              {st.viewsCount || 1}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStatus(st.id);
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 cursor-pointer shrink-0"
                        title="Delete this status update"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. RECENT UPDATES SECTION (Unviewed 24h Status Updates from Contacts) */}
        {contactStatusGroups.recent.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Recent Updates ({contactStatusGroups.recent.length})
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold">
                Tap any contact to view 24h story
              </span>
            </div>

            <div className="space-y-2">
              {contactStatusGroups.recent.map((group) => {
                const latest = group.items[group.items.length - 1];
                return (
                  <div
                    key={group.userId}
                    id={`status-contact-row-${group.userId}`}
                    onClick={() => openViewerForUser(group.userId, 0)}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.005] ${
                      isDark
                        ? 'bg-[#181F2C] hover:bg-[#1E2738] border-slate-800'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar with WhatsApp Emerald Unviewed Ring */}
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-full p-0.5 border-2 border-[#25D366] ring-2 ring-[#25D366]/25">
                          <img
                            src={group.userAvatar}
                            alt={group.userName}
                            className="w-full h-full rounded-full object-cover bg-slate-900"
                          />
                        </div>
                        {group.items.length > 1 && (
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#25D366] text-slate-950 text-[9px] font-black shadow-xs">
                            {group.items.length}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm truncate">{group.userName}</h3>
                          {group.isVerified && (
                            <VerifiedCheckmarkBadge
                              variant="chat_list"
                              size="sm"
                              title="Verified Account"
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {latest.type === 'text'
                            ? latest.text
                            : latest.caption || `Shared a ${latest.type} status`}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <span className="text-emerald-500 font-bold">
                            {formatRelativeTime(latest.createdAt, nowMs)}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimeRemaining(latest.expiresAt, nowMs)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preview Thumbnail of Latest Status */}
                    <div className="shrink-0">
                      {latest.type === 'text' ? (
                        <div
                          style={{ background: latest.bgColor || TEXT_STATUS_BACKGROUNDS[0] }}
                          className="w-11 h-11 rounded-xl flex items-center justify-center p-1 text-white text-[8px] font-extrabold text-center leading-tight shadow-xs"
                        >
                          <span className="line-clamp-3">{latest.text}</span>
                        </div>
                      ) : (
                        <img
                          src={latest.thumbnailUrl || latest.mediaUrl}
                          alt="Status preview"
                          className="w-11 h-11 rounded-xl object-cover border border-slate-700/40 shadow-xs bg-slate-900"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. VIEWED UPDATES SECTION */}
        {contactStatusGroups.viewed.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1 block">
              Viewed Updates ({contactStatusGroups.viewed.length})
            </span>

            <div className="space-y-2">
              {contactStatusGroups.viewed.map((group) => {
                const latest = group.items[group.items.length - 1];
                return (
                  <div
                    key={group.userId}
                    onClick={() => openViewerForUser(group.userId, 0)}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer opacity-85 hover:opacity-100 transition-opacity ${
                      isDark
                        ? 'bg-[#151A24] border-slate-800/80'
                        : 'bg-white border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-13 h-13 rounded-full p-0.5 border-2 border-slate-400 dark:border-slate-600 shrink-0">
                        <img
                          src={group.userAvatar}
                          alt={group.userName}
                          className="w-full h-full rounded-full object-cover bg-slate-900"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm truncate">{group.userName}</h3>
                          {group.isVerified && (
                            <VerifiedCheckmarkBadge variant="chat_list" size="sm" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Viewed • {formatRelativeTime(latest.createdAt, nowMs)}</span>
                          <span>•</span>
                          <span>{formatTimeRemaining(latest.expiresAt, nowMs)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy & 24h Ephemeral Footer Note */}
        <div className="pt-3 pb-4 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            Your status updates are end-to-end protected and automatically disappear after 24 hours.
          </span>
        </div>
      </div>

      {/* WhatsApp-Style Floating Action Buttons (Pencil for Text Status + Camera for Photo/Video Status) */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center gap-2.5 z-20">
        <button
          id="fab-status-text-btn"
          type="button"
          onClick={() => setIsTextComposerOpen(true)}
          className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center border cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-white'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
          title="Write Text Status"
        >
          <Edit3 className="w-4.5 h-4.5" />
        </button>

        <button
          id="fab-status-camera-btn"
          type="button"
          onClick={() => mediaFileInputRef.current?.click()}
          style={{ backgroundColor: '#25D366' }}
          className="w-13 h-13 rounded-full text-white shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
          title="Post Photo or Video Status"
        >
          <Camera className="w-5.5 h-5.5 stroke-[2.2]" />
        </button>
      </div>

      {/* ============================================================================
          MODAL 1: WHATSAPP-STYLE TEXT STATUS COMPOSER
      ============================================================================ */}
      {isTextComposerOpen && (
        <div
          id="text-status-composer-modal"
          style={{ background: TEXT_STATUS_BACKGROUNDS[selectedBgIndex % TEXT_STATUS_BACKGROUNDS.length] }}
          className="fixed inset-0 z-[120] flex flex-col justify-between p-4 text-white animate-in fade-in duration-150"
        >
          {/* Top Controls */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsTextComposerOpen(false)}
              className="w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center cursor-pointer"
              title="Close composer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-black/25 text-[11px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Disappears in 24h</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  const styles: Array<'sans' | 'serif' | 'mono' | 'bold'> = [
                    'bold',
                    'sans',
                    'serif',
                    'mono',
                  ];
                  const nextIdx = (styles.indexOf(selectedFontStyle) + 1) % styles.length;
                  setSelectedFontStyle(styles[nextIdx]);
                }}
                className="w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center cursor-pointer font-bold"
                title="Change Font Style"
              >
                <Type className="w-4.5 h-4.5" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedBgIndex((prev) => (prev + 1) % TEXT_STATUS_BACKGROUNDS.length)}
                className="w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center cursor-pointer"
                title="Cycle Background Color"
              >
                <Palette className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Center Textarea */}
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <textarea
              id="text-status-textarea"
              value={textStatusInput}
              onChange={(e) => setTextStatusInput(e.target.value)}
              placeholder="Type a status..."
              maxLength={320}
              autoFocus
              rows={4}
              className={`w-full max-w-md bg-transparent text-white placeholder-white/60 text-center text-xl sm:text-2xl outline-none resize-none leading-relaxed ${
                selectedFontStyle === 'serif'
                  ? 'font-serif'
                  : selectedFontStyle === 'mono'
                  ? 'font-mono'
                  : selectedFontStyle === 'bold'
                  ? 'font-black tracking-tight'
                  : 'font-sans font-semibold'
              }`}
            />

            {/* Quick Emoji Insert Chips */}
            <div className="flex items-center gap-2 mt-4 bg-black/20 px-3 py-1.5 rounded-full">
              {QUICK_STATUS_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setTextStatusInput((prev) => `${prev}${em}`)}
                  className="text-lg hover:scale-125 transition-transform cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Bar with User Avatar & Send Button */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/20">
            <div className="flex items-center gap-2">
              <img
                src={persistentMyThumbnail}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-white/50"
              />
              <span className="text-xs font-bold">My Status (24h)</span>
            </div>

            <button
              id="submit-text-status-btn"
              type="button"
              disabled={!textStatusInput.trim()}
              onClick={handlePostTextStatus}
              style={{ backgroundColor: '#25D366' }}
              className="px-5 py-2.5 rounded-full text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-45 hover:brightness-110 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Post Status</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 2: PHOTO / VIDEO STATUS COMPOSER WITH AUTO-GENERATED THUMBNAIL
      ============================================================================ */}
      {isMediaComposerOpen && (
        <div
          id="media-status-composer-modal"
          className="fixed inset-0 z-[120] bg-black/95 flex flex-col justify-between p-4 text-white animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsMediaComposerOpen(false);
                setPendingMediaData(null);
              }}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              24h Photo / Video Status
            </span>
            <div className="w-10" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4 overflow-hidden">
            {isGeneratingThumb ? (
              <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-300">
                  Generating HD Status Thumbnail...
                </p>
              </div>
            ) : pendingMediaData ? (
              <div className="w-full max-w-sm flex flex-col items-center gap-3">
                <div className="relative w-full max-h-[52vh] rounded-2xl overflow-hidden border border-white/20 bg-slate-900 flex items-center justify-center">
                  {pendingMediaData.type === 'video' ? (
                    <video
                      src={pendingMediaData.mediaUrl}
                      poster={pendingMediaData.thumbnailUrl}
                      controls
                      className="max-h-[50vh] w-auto object-contain"
                    />
                  ) : (
                    <img
                      src={pendingMediaData.mediaUrl}
                      alt="Selected status media"
                      className="max-h-[50vh] w-auto object-contain"
                    />
                  )}
                </div>

                {/* Auto-generated thumbnail badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px]">
                  <img
                    src={pendingMediaData.thumbnailUrl}
                    alt="Auto thumbnail"
                    className="w-7 h-7 rounded-md object-cover border border-emerald-400"
                  />
                  <span className="text-emerald-300 font-bold">
                    Auto-generated thumbnail ready • Disappears in 24h
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="w-full max-w-md mx-auto flex items-center gap-2 pt-2">
            <input
              type="text"
              value={mediaCaptionInput}
              onChange={(e) => setMediaCaptionInput(e.target.value)}
              placeholder="Add a caption to your 24h status..."
              className="flex-1 px-4 py-2.5 rounded-full bg-white/15 border border-white/20 text-white placeholder-white/60 text-xs outline-none focus:border-emerald-400"
            />
            <button
              id="submit-media-status-btn"
              type="button"
              disabled={!pendingMediaData || isGeneratingThumb}
              onClick={handlePostMediaStatus}
              style={{ backgroundColor: '#25D366' }}
              className="px-4 py-2.5 rounded-full text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-45"
            >
              <Send className="w-4 h-4" />
              <span>Post</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 3: FULL-SCREEN WHATSAPP STORY / STATUS VIEWER
      ============================================================================ */}
      {activeViewerUserId && currentSlide && (
        <div
          id="fullscreen-status-viewer-modal"
          className="fixed inset-0 z-[130] bg-black flex flex-col justify-between text-white select-none animate-in fade-in duration-150"
        >
          {/* Top Segmented Progress Bars + Poster Info */}
          <div className="pt-3 px-3 z-20 space-y-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-4">
            {/* Segmented Progress Bars */}
            <div className="flex items-center gap-1.5">
              {activeViewerItems.map((slide, idx) => {
                const widthPct =
                  idx < activeSlideIndex
                    ? 100
                    : idx === activeSlideIndex
                    ? slideProgress
                    : 0;
                return (
                  <div
                    key={slide.id}
                    className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
                  >
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-white transition-all duration-75"
                    />
                  </div>
                );
              })}
            </div>

            {/* Poster Avatar, Name, Relative Time & 24h Expiration Countdown */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={
                    currentSlide.userId === myUserId || currentSlide.userId === 'me'
                      ? persistentMyThumbnail
                      : currentSlide.userThumbnailUrl || currentSlide.userAvatar
                  }
                  alt={currentSlide.userName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shrink-0 bg-slate-900"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm truncate">
                      {currentSlide.userId === myUserId ? 'My Status' : currentSlide.userName}
                    </span>
                    {currentSlide.isVerified && (
                      <VerifiedCheckmarkBadge variant="header" size="sm" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/80">
                    <span>{formatRelativeTime(currentSlide.createdAt, nowMs)}</span>
                    <span>•</span>
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Disappears in {formatTimeRemaining(currentSlide.expiresAt, nowMs)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsViewerPaused((prev) => !prev)}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                  title={isViewerPaused ? 'Resume status' : 'Pause status'}
                >
                  {isViewerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>

                {currentSlide.userId === myUserId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteStatus(currentSlide.id)}
                    className="w-9 h-9 rounded-full bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 flex items-center justify-center cursor-pointer"
                    title="Delete this status"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveViewerUserId(null)}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                  title="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Center Slide Content with Left/Right Tap Zones */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            {/* Left Tap Zone (Previous Slide) */}
            <div
              onClick={() => {
                if (activeSlideIndex > 0) {
                  setActiveSlideIndex((idx) => idx - 1);
                  setSlideProgress(0);
                }
              }}
              className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
            />
            {/* Right Tap Zone (Next Slide) */}
            <div
              onClick={() => {
                if (activeSlideIndex < activeViewerItems.length - 1) {
                  setActiveSlideIndex((idx) => idx + 1);
                  setSlideProgress(0);
                } else {
                  setActiveViewerUserId(null);
                }
              }}
              className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer"
            />

            {currentSlide.type === 'text' ? (
              <div
                style={{ background: currentSlide.bgColor || TEXT_STATUS_BACKGROUNDS[0] }}
                className="w-full h-full flex items-center justify-center p-8 text-center"
              >
                <p
                  className={`max-w-md text-2xl sm:text-3xl text-white leading-relaxed drop-shadow-sm ${
                    currentSlide.fontStyle === 'serif'
                      ? 'font-serif'
                      : currentSlide.fontStyle === 'mono'
                      ? 'font-mono'
                      : 'font-extrabold'
                  }`}
                >
                  {currentSlide.text}
                </p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
                {currentSlide.type === 'video' ? (
                  <video
                    src={currentSlide.mediaUrl}
                    poster={currentSlide.thumbnailUrl}
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <img
                    src={currentSlide.mediaUrl || currentSlide.thumbnailUrl}
                    alt={currentSlide.caption || 'Status'}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
                {currentSlide.caption && (
                  <div className="absolute bottom-4 inset-x-4 p-3 rounded-2xl bg-black/65 backdrop-blur-md text-center text-sm font-medium text-white">
                    {currentSlide.caption}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Bar: Reply / Quick Reactions for Contact Statuses OR Views Summary for My Status */}
          <div className="p-3 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            {currentSlide.userId === myUserId ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>{currentSlide.viewsCount || 1} views</span>
                </div>
                <span className="text-[11px] text-amber-300 font-semibold">
                  Auto-deletes after 24h ({formatTimeRemaining(currentSlide.expiresAt, nowMs)})
                </span>
              </div>
            ) : (
              <div className="space-y-2 max-w-md mx-auto">
                {/* Quick Emoji Reaction Bar */}
                <div className="flex items-center justify-center gap-2">
                  {QUICK_STATUS_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendStatusReply(`Reacted ${emoji} to your status`)}
                      className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-base hover:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyInputText}
                    onFocus={() => setIsViewerPaused(true)}
                    onBlur={() => setIsViewerPaused(false)}
                    onChange={(e) => setReplyInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && replyInputText.trim()) {
                        handleSendStatusReply(replyInputText);
                      }
                    }}
                    placeholder={`Reply to ${currentSlide.userName}'s status...`}
                    className="flex-1 px-4 py-2.5 rounded-full bg-white/15 border border-white/25 text-white placeholder-white/60 text-xs outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    disabled={!replyInputText.trim()}
                    onClick={() => handleSendStatusReply(replyInputText)}
                    style={{ backgroundColor: '#25D366' }}
                    className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav
        currentScreen="status"
        onNavigate={onNavigate}
        theme={theme}
        unreadCount={3}
        isAdminVerified={isAdminVerified}
        primaryColor={primaryColor}
        userAvatar={persistentMyThumbnail}
      />

      {/* Device Bottom Home Indicator Bar (iOS style) */}
      <div className="w-full flex justify-center pb-2 pt-0.5 bg-white dark:bg-[#181A20] shrink-0 z-30">
        <div className="w-32 h-1 bg-slate-900/25 dark:bg-white/25 rounded-full pointer-events-none" />
      </div>
    </div>
  );
};
