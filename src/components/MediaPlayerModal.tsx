import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Download,
  Share2,
  Music,
  Video,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Heart,
  Star,
  Check,
  Copy,
  ZoomIn,
  ZoomOut,
  Edit2,
  Trash2,
  Users,
  Shield,
  Send,
  Smartphone,
  Globe,
  Tag,
  Sliders,
} from 'lucide-react';
import { ActiveMediaItem, GroupParticipant } from '../types';
import { stripVideoUrlsFromText, detectVideoPlatformFromText } from '../lib/videoPlatformHelper';
import {
  getMediaSeoTags,
  formatSeoTagsForInput,
  saveAndSubmitMediaSeoToSearchEngines,
  syncHiddenHeadSeoMeta,
  parseSeoTagsInput,
} from '../lib/mediaSeoHelper';
import {
  addMediaToLikedUserGallery,
  removeMediaFromLikedUserGallery,
  getLikedUserGalleryItems,
} from '../lib/likedUserGalleryHelper';

interface MediaPlayerModalProps {
  media: ActiveMediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  primaryColor?: string;
  onToggleLike?: (mediaId: string, isLiked: boolean) => void;
  onToggleFavorite?: (mediaId: string, isFavorite: boolean) => void;
  onRateMedia?: (mediaId: string, rating: number) => void;
  onShareMedia?: (media: ActiveMediaItem) => void;
  onEditTitle?: (mediaId: string, newTitle: string) => void;
  onDeleteMedia?: (mediaId: string) => void;
  onOpenStudioEditor?: (media: ActiveMediaItem) => void;
  isGroupMedia?: boolean;
  groupName?: string;
  groupParticipants?: GroupParticipant[];
  onShareWithGroupMembers?: (media: ActiveMediaItem, memberIds: string[], note?: string) => void;
}

// Fallback media links
const SAMPLE_VIDEO_FALLBACK =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const SAMPLE_AUDIO_FALLBACK =
  'https://actions.google.com/sounds/v1/ambiences/outdoor_garden_birds.ogg';

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Outstanding!',
};

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  media,
  isOpen,
  onClose,
  isDark = true,
  primaryColor = '#7C3AED',
  onToggleLike,
  onToggleFavorite,
  onRateMedia,
  onEditTitle,
  onDeleteMedia,
  onOpenStudioEditor,
  isGroupMedia = false,
  groupName = 'Group',
  groupParticipants = [],
  onShareWithGroupMembers,
}) => {
  // Playback states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [videoFallbackUsed, setVideoFallbackUsed] = useState(false);

  // Social & engagement states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(14);
  const [isFavorite, setIsFavorite] = useState(false);
  const [inLikedUserGallery, setInLikedUserGallery] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [averageRating, setAverageRating] = useState(4.8);
  const [totalRatings, setTotalRatings] = useState(24);
  const [hasRated, setHasRated] = useState(false);

  // Title Edit & Delete states
  const [currentTitle, setCurrentTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [seoTagsInput, setSeoTagsInput] = useState('');
  const [isSubmittingSeo, setIsSubmittingSeo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Share & Notification states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [groupShareNote, setGroupShareNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otherGroupMembers = groupParticipants.filter((p) => p.id !== 'me');

  // Image zoom & pan state
  const [zoomScale, setZoomScale] = useState(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didMoveRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Sync state when new media is opened
  useEffect(() => {
    if (isOpen && media) {
      setIsPlaying(true);
      setCurrentTime(0);
      setZoomScale(1.0);
      setPanOffset({ x: 0, y: 0 });
      setRotationAngle(0);
      setVideoFallbackUsed(false);
      setIsEditingTitle(false);
      setConfirmDelete(false);

      // Check localStorage for persisted media metrics & custom title
      const mediaKey = media.id || media.mediaUrl;
      let cachedData: any = null;
      try {
        const item = localStorage.getItem(`freedom_media_${mediaKey}`);
        if (item) cachedData = JSON.parse(item);
      } catch {}

      const rawTitle =
        cachedData?.customTitle ||
        media.title ||
        (media.type === 'video' ? 'Shared Video Clip' : 'Shared Picture');
      const cleanedTitle = stripVideoUrlsFromText(rawTitle) || (media.videoPlatform ? `${media.videoPlatform} Video` : media.type === 'video' ? 'Shared Video Clip' : 'Shared Picture');

      setCurrentTitle(cleanedTitle);
      setTitleInput(cleanedTitle);

      const existingSeoTags = getMediaSeoTags(mediaKey);
      setSeoTagsInput(formatSeoTagsForInput(existingSeoTags));
      syncHiddenHeadSeoMeta();

      const liked = cachedData?.isLiked ?? media.isLiked ?? false;
      const initialLikes = cachedData?.likesCount ?? media.likesCount ?? 14;
      const fav = cachedData?.isFavorite ?? media.isFavorite ?? false;
      const rating = cachedData?.userRating ?? media.userRating ?? 0;
      const avg = cachedData?.averageRating ?? media.averageRating ?? 4.8;
      const totals = cachedData?.totalRatings ?? media.totalRatings ?? 24;

      setIsLiked(liked);
      setLikesCount(initialLikes);
      setIsFavorite(fav);
      const currentLikedGallery = getLikedUserGalleryItems();
      setInLikedUserGallery(
        currentLikedGallery.some(
          (g) => g.id === mediaKey || g.messageId === mediaKey || g.url === media.mediaUrl
        )
      );
      setUserRating(rating);
      setAverageRating(avg);
      setTotalRatings(totals);
      setHasRated(rating > 0);
    } else {
      setIsPlaying(false);
      setIsShareModalOpen(false);
      setIsEditingTitle(false);
      setConfirmDelete(false);
    }
  }, [isOpen, media]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isShareModalOpen) {
          setIsShareModalOpen(false);
        } else if (isEditingTitle) {
          setIsEditingTitle(false);
        } else {
          onClose();
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          togglePlay();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, isShareModalOpen, isEditingTitle]);

  if (!isOpen || !media) return null;

  // Distinguish media type
  const isAudio =
    media.type === 'audio' ||
    media.mediaUrl.endsWith('.ogg') ||
    media.mediaUrl.endsWith('.mp3');
  const isVideo =
    media.type === 'video' ||
    Boolean(media.videoPlatform) ||
    Boolean(media.embedUrl) ||
    media.mediaUrl.endsWith('.mp4') ||
    media.mediaUrl.endsWith('.webm') ||
    media.mediaUrl.startsWith('data:video') ||
    media.mediaUrl.includes('sample/ForBiggerBlazes') ||
    media.mediaUrl.includes('BigBuckBunny') ||
    media.mediaUrl.includes('ElephantsDream') ||
    media.mediaUrl.includes('ForBiggerEscapes') ||
    media.mediaUrl.includes('ForBiggerFun') ||
    media.mediaUrl.includes('video') ||
    Boolean(detectVideoPlatformFromText(media.mediaUrl));
  const isDocument = media.type === 'document' || media.mediaUrl.endsWith('.pdf');
  const isImage = !isAudio && !isVideo && !isDocument;

  const togglePlay = () => {
    if (isVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else if (isAudio && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) videoRef.current.muted = nextMuted;
    if (audioRef.current) audioRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    setCurrentTime(seekTo);
    if (videoRef.current) videoRef.current.currentTime = seekTo;
    if (audioRef.current) audioRef.current.currentTime = seekTo;
  };

  const handleSpeedCycle = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  };

  const toggleFullscreen = () => {
    const nextFullscreen = !isFullscreen;
    setIsFullscreen(nextFullscreen);
    if (containerRef.current) {
      if (nextFullscreen && !document.fullscreenElement) {
        containerRef.current.requestFullscreen?.().catch(() => {
          // Fallback to full-viewport CSS fullscreen when inside restricted iframe
        });
      } else if (!nextFullscreen && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
    showToast(nextFullscreen ? 'Entered Full Screen mode 📺' : 'Exited Full Screen mode');
  };

  const handleRotateMedia = () => {
    setRotationAngle((prev) => {
      const next = (prev + 90) % 360;
      showToast(`Rotated video ${next}° 🔄`);
      return next;
    });
  };

  // Like interaction handler
  const handleToggleLike = () => {
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextLiked);
    setLikesCount(nextCount);

    const mediaId = media.id || media.mediaUrl;
    try {
      const existing = JSON.parse(localStorage.getItem(`freedom_media_${mediaId}`) || '{}');
      localStorage.setItem(
        `freedom_media_${mediaId}`,
        JSON.stringify({ ...existing, id: mediaId, isLiked: nextLiked, likesCount: nextCount })
      );
    } catch {}

    if (nextLiked && (isImage || isVideo)) {
      addMediaToLikedUserGallery({
        id: mediaId,
        messageId: mediaId,
        type: isVideo ? 'video' : 'image',
        url: media.mediaUrl,
        thumbnailUrl: media.thumbnailUrl || media.mediaUrl,
        title: currentTitle || media.title || 'Liked Media',
        senderName: media.senderName || 'You',
        timestamp: media.timestamp || 'Just now',
        likesCount: nextCount >= 1000 ? nextCount : 120000,
        likesDisplay: '120K',
      });
      setInLikedUserGallery(true);
    }

    if (onToggleLike) {
      onToggleLike(mediaId, nextLiked);
    }
    showToast(
      nextLiked
        ? 'Liked media ❤️ & added to User Profile Gallery (🤍 120K)!'
        : 'Removed like'
    );
  };

  // Favourite interaction handler (turns Red when clicked)
  const handleToggleFavorite = () => {
    const nextFav = !isFavorite;
    setIsFavorite(nextFav);

    const mediaId = media.id || media.mediaUrl;
    try {
      const existing = JSON.parse(localStorage.getItem(`freedom_media_${mediaId}`) || '{}');
      localStorage.setItem(
        `freedom_media_${mediaId}`,
        JSON.stringify({ ...existing, id: mediaId, isFavorite: nextFav })
      );
    } catch {}

    if (nextFav && (isImage || isVideo)) {
      addMediaToLikedUserGallery({
        id: mediaId,
        messageId: mediaId,
        type: isVideo ? 'video' : 'image',
        url: media.mediaUrl,
        thumbnailUrl: media.thumbnailUrl || media.mediaUrl,
        title: currentTitle || media.title || 'Liked Media',
        senderName: media.senderName || 'You',
        timestamp: media.timestamp || 'Just now',
        likesCount: 120000,
        likesDisplay: '120K',
      });
      setInLikedUserGallery(true);
    }

    if (onToggleFavorite) {
      onToggleFavorite(mediaId, nextFav);
    }
    showToast(
      nextFav
        ? 'Added to Favourites & User Profile Gallery (🤍 120K) ❤️'
        : 'Removed from Favourites'
    );
  };

  const handleToggleAddToLikedUserGallery = () => {
    const mediaId = media.id || media.mediaUrl;
    if (inLikedUserGallery) {
      removeMediaFromLikedUserGallery(mediaId);
      setInLikedUserGallery(false);
      showToast('Removed from User Profile Gallery');
    } else {
      if (!isLiked) {
        setIsLiked(true);
      }
      addMediaToLikedUserGallery({
        id: mediaId,
        messageId: mediaId,
        type: isVideo ? 'video' : 'image',
        url: media.mediaUrl,
        thumbnailUrl: media.thumbnailUrl || media.mediaUrl,
        title: currentTitle || media.title || 'Liked Media',
        senderName: media.senderName || 'You',
        timestamp: media.timestamp || 'Just now',
        likesCount: 120000,
        likesDisplay: '120K',
      });
      setInLikedUserGallery(true);
      showToast('✨ Added to User Profile Gallery (🤍 120K 3×3 Grid)!');
    }
  };

  // Save edited title & submit hidden SEO media tags to search engines
  const handleSaveTitle = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed) return;
    setCurrentTitle(trimmed);
    setIsSubmittingSeo(true);

    const mediaId = media.id || media.mediaUrl;
    const parsedSeoTags = parseSeoTagsInput(seoTagsInput);

    try {
      const existing = JSON.parse(localStorage.getItem(`freedom_media_${mediaId}`) || '{}');
      localStorage.setItem(
        `freedom_media_${mediaId}`,
        JSON.stringify({
          ...existing,
          id: mediaId,
          customTitle: trimmed,
          seoTags: parsedSeoTags,
          submittedToSearchEngines: true,
        })
      );
    } catch {}

    if (onEditTitle) {
      onEditTitle(mediaId, trimmed);
    }

    const seoResult = await saveAndSubmitMediaSeoToSearchEngines({
      mediaId,
      title: trimmed,
      seoTagsInput,
      mediaType: isVideo ? 'video' : isAudio ? 'audio' : isDocument ? 'document' : 'image',
      mediaUrl: media.mediaUrl,
    });

    setIsSubmittingSeo(false);
    setIsEditingTitle(false);
    showToast(seoResult.message || 'Media title & hidden SEO tags submitted to Search Engines!');
  };

  const handleAutoGenerateSeoTags = () => {
    const baseWords = (titleInput || currentTitle || 'media')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const typeTag = isVideo ? 'hd video' : isAudio ? 'voice audio' : isDocument ? 'document pdf' : 'photo image';
    const platformTag = media.videoPlatform ? media.videoPlatform.toLowerCase() : 'freedom messaging';
    const combined = Array.from(new Set([...baseWords, typeTag, platformTag, 'multilingual media'])).slice(0, 8);
    setSeoTagsInput(combined.join(', '));
  };

  // Delete media handler
  const handleConfirmDelete = () => {
    const mediaId = media.id || media.mediaUrl;
    try {
      const deletedList: string[] = JSON.parse(
        localStorage.getItem('freedom_deleted_media_ids') || '[]'
      );
      if (!deletedList.includes(mediaId)) {
        deletedList.push(mediaId);
        localStorage.setItem('freedom_deleted_media_ids', JSON.stringify(deletedList));
      }
    } catch {}

    if (onDeleteMedia) {
      onDeleteMedia(mediaId);
    }
    onClose();
  };

  // Rating interaction handler (1 - 5 stars)
  const handleRate = (rating: number) => {
    setUserRating(rating);
    const wasRated = hasRated;
    setHasRated(true);

    const newTotals = wasRated ? totalRatings : totalRatings + 1;
    const diff = wasRated ? rating - userRating : rating - averageRating;
    const newAverage = Math.round((averageRating + diff / newTotals) * 10) / 10;
    const clampedAvg = Math.min(5, Math.max(1, newAverage));

    setAverageRating(clampedAvg);
    setTotalRatings(newTotals);

    const mediaId = media.id || media.mediaUrl;
    try {
      const existing = JSON.parse(localStorage.getItem(`freedom_media_${mediaId}`) || '{}');
      localStorage.setItem(
        `freedom_media_${mediaId}`,
        JSON.stringify({
          ...existing,
          id: mediaId,
          userRating: rating,
          averageRating: clampedAvg,
          totalRatings: newTotals,
        })
      );
    } catch {}

    if (onRateMedia) {
      onRateMedia(mediaId, rating);
    }
    showToast(`You rated ${rating} star${rating > 1 ? 's' : ''} (${RATING_DESCRIPTIONS[rating]}) ⭐`);
  };

  // Share handlers
  const handleCopyLink = () => {
    const url = media.mediaUrl || window.location.href;
    navigator.clipboard?.writeText(url);
    showToast('Media link copied to clipboard!');
    setIsShareModalOpen(false);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: currentTitle || 'Freedom Media Attachment',
          text: `Check out this media shared on Freedom Messaging: ${currentTitle || ''}`,
          url: media.mediaUrl,
        });
        showToast('Shared successfully!');
        setIsShareModalOpen(false);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownload = async () => {
    const ext = isVideo ? 'mp4' : isAudio ? 'ogg' : isDocument ? 'pdf' : 'jpg';
    const safeFilename = `${(currentTitle || 'freedom-media')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'media'}-${Date.now()}.${ext}`;

    const targetUrl = isVideo ? videoSrc : media.mediaUrl;

    try {
      // Save record to device local saved media list as well
      const savedList = JSON.parse(localStorage.getItem('freedom_saved_device_media') || '[]');
      savedList.unshift({
        id: media.id || `saved_${Date.now()}`,
        title: currentTitle,
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
        mediaUrl: targetUrl,
        thumbnailUrl: media.thumbnailUrl || media.mediaUrl,
        savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      localStorage.setItem('freedom_saved_device_media', JSON.stringify(savedList.slice(0, 40)));
    } catch {}

    try {
      if (targetUrl.startsWith('data:') || targetUrl.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = targetUrl;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Saved to device! 📥');
        setIsShareModalOpen(false);
        return;
      }

      showToast('Saving to device... 📥');
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      showToast('Saved to device! 📥');
    } catch {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Saved to device! 📥');
    }
    setIsShareModalOpen(false);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const detectedPlatform = detectVideoPlatformFromText(media.originalVideoUrl || media.mediaUrl || '');
  const resolvedVideoPlatform = media.videoPlatform || detectedPlatform?.platformName;

  const videoSrc = videoFallbackUsed
    ? SAMPLE_VIDEO_FALLBACK
    : media.mediaUrl &&
      (media.mediaUrl.endsWith('.mp4') ||
        media.mediaUrl.endsWith('.webm') ||
        media.mediaUrl.startsWith('blob:') ||
        media.mediaUrl.startsWith('data:video') ||
        media.mediaUrl.includes('commondatastorage.googleapis.com'))
    ? media.mediaUrl
    : detectedPlatform?.playableStreamUrl || SAMPLE_VIDEO_FALLBACK;

  const audioSrc =
    media.mediaUrl &&
    (media.mediaUrl.startsWith('http') ||
      media.mediaUrl.startsWith('blob:') ||
      media.mediaUrl.startsWith('data:audio'))
      ? media.mediaUrl
      : SAMPLE_AUDIO_FALLBACK;

  const activeStarCount = hoverRating > 0 ? hoverRating : userRating;

  // Image click-to-zoom & drag-to-pan handlers
  const handleImageClick = () => {
    if (didMoveRef.current) {
      didMoveRef.current = false;
      return;
    }
    setZoomScale((prev) => {
      if (prev < 1.5) return 1.5;
      if (prev < 2.25) return 2.25;
      if (prev < 3.0) return 3.0;
      setPanOffset({ x: 0, y: 0 });
      return 1.0;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1.0) return;
    e.preventDefault();
    setIsPanning(true);
    didMoveRef.current = false;
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    didMoveRef.current = true;
    setPanOffset({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      id="media-player-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        className={`relative overflow-hidden shadow-2xl flex flex-col border transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none rounded-none border-0'
            : 'w-full max-w-2xl max-h-[96vh] rounded-3xl my-auto'
        } ${
          isDark
            ? 'bg-slate-950 border-slate-800 text-white'
            : 'bg-[#18202c] border-slate-700 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Title Edit & Quick Actions */}
        <div className="px-4 py-3 bg-black/60 backdrop-blur-md flex items-center justify-between border-b border-white/10 z-20 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            >
              {isAudio ? (
                <Music className="w-4 h-4" />
              ) : isVideo ? (
                <Video className="w-4 h-4" />
              ) : isDocument ? (
                <FileText className="w-4 h-4" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <div className="space-y-1.5 bg-slate-900/95 border border-purple-500/50 rounded-xl p-2.5 shadow-xl">
                  <div className="flex items-center gap-1.5">
                    <input
                      id="media-player-edit-title-input"
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                      autoFocus
                      placeholder="Enter media title..."
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-purple-500 text-xs text-white font-semibold outline-none"
                    />
                    <button
                      id="media-player-save-title-seo-btn"
                      type="button"
                      disabled={isSubmittingSeo}
                      onClick={handleSaveTitle}
                      style={{ backgroundColor: primaryColor }}
                      className="px-2.5 py-1 rounded-lg text-white text-[11px] font-bold hover:brightness-110 cursor-pointer shrink-0 flex items-center gap-1"
                      title="Save Title & Submit Hidden SEO Tags to Search Engines"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSubmittingSeo ? 'Submitting...' : 'Save & Fetch SEO'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingTitle(false);
                        setTitleInput(currentTitle);
                      }}
                      className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer shrink-0"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Hidden SEO Media Tags Input (Only visible when editing media title; never publicly displayed on media files) */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="media-player-seo-tags-input"
                        className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        <span>SEO Media Tags (Submit to Search Engines • Hidden from public display)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateSeoTags}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1 cursor-pointer"
                        title="Auto-suggest SEO tags from title"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>+ Auto SEO Tags</span>
                      </button>
                    </div>
                    <input
                      id="media-player-seo-tags-input"
                      type="text"
                      value={seoTagsInput}
                      onChange={(e) => setSeoTagsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                      placeholder="Add SEO media tags (e.g. sunset, travel, hd video) — indexed for Search Engines only..."
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-950/90 border border-emerald-500/40 focus:border-emerald-400 text-[11px] text-emerald-200 placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate" title={currentTitle}>
                    {currentTitle}
                  </h3>
                  <button
                    id="media-player-edit-title-btn"
                    type="button"
                    onClick={() => {
                      const mediaKey = media.id || media.mediaUrl;
                      setTitleInput(currentTitle);
                      setSeoTagsInput(formatSeoTagsForInput(getMediaSeoTags(mediaKey)));
                      setIsEditingTitle(true);
                    }}
                    className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Edit Media Title & Hidden SEO Search Engine Tags"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {isFavorite && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 font-bold flex items-center gap-1 shrink-0">
                      <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                      <span>Favourite</span>
                    </span>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                {resolvedVideoPlatform && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/25 border border-purple-400/40 text-purple-200 text-[10px] font-bold">
                    {resolvedVideoPlatform}
                  </span>
                )}
                <span>
                  {media.senderName ? `Shared by ${media.senderName}` : 'Media Attachment'}
                  {media.timestamp && ` • ${media.timestamp}`}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Header Action Icons: Rotate, Fullscreen, Save to Device, Favourite, Share, Delete, Close */}
          <div className="flex items-center gap-1 shrink-0">
            {(isVideo || isImage) && onOpenStudioEditor && (
              <button
                type="button"
                id="header-media-studio-editor-btn"
                onClick={() => onOpenStudioEditor(media)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/80 to-purple-600/80 hover:from-pink-500 hover:to-purple-600 text-white text-[11px] font-extrabold transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-sm mr-0.5"
                title={isVideo ? 'Open in Video Editor' : 'Open in Photo Editor'}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isVideo ? 'Video Editor' : 'Photo Editor'}</span>
              </button>
            )}
            {(isVideo || isImage) && (
              <button
                type="button"
                id="header-media-rotate-btn"
                onClick={handleRotateMedia}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
                title={`Rotate (${rotationAngle}°)`}
              >
                <RotateCw className="w-4 h-4" />
                {rotationAngle > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400">{rotationAngle}°</span>
                )}
              </button>
            )}

            {(isVideo || isImage) && (
              <button
                type="button"
                id="header-media-fullscreen-btn"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
                title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              id="header-media-save-device-btn"
              onClick={handleDownload}
              className="p-2 rounded-xl hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer active:scale-95"
              title="Save to device"
            >
              <Download className="w-4 h-4" />
            </button>
            {/* 1. Favourite Heart Button (Displays Red when clicked) */}
            <button
              type="button"
              id="header-media-fav-btn"
              onClick={handleToggleFavorite}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-90 ${
                isFavorite
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                  : 'hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 ${
                  isFavorite ? 'fill-red-500 text-red-500 scale-110' : ''
                }`}
              />
            </button>

            {/* 2. Share Button */}
            <button
              type="button"
              id="media-player-share-btn"
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Share media"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* 3. Delete Button */}
            <button
              type="button"
              id="header-media-delete-btn"
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-xl hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors cursor-pointer active:scale-95"
              title="Delete media file"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* 4. Close Button */}
            <button
              type="button"
              id="media-player-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95 ml-1"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner */}
        {confirmDelete && (
          <div className="px-4 py-2.5 bg-red-950/90 border-b border-red-500/40 flex items-center justify-between gap-2 z-30 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-red-200">
              Delete "{currentTitle}" from your media gallery?
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer active:scale-95"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div
            style={{ backgroundColor: primaryColor }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full text-white text-xs font-semibold shadow-xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Media Canvas Area */}
        <div
          className={`relative w-full ${
            isFullscreen ? 'flex-1 min-h-0' : 'aspect-video sm:aspect-16/10'
          } bg-black flex items-center justify-center overflow-hidden shrink-0`}
        >
          {isVideo ? (
            <>
              <video
                ref={videoRef}
                src={videoSrc}
                poster={media.thumbnailUrl}
                autoPlay
                playsInline
                preload="auto"
                loop
                onError={() => {
                  if (!videoFallbackUsed) {
                    setVideoFallbackUsed(true);
                  }
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
                style={{
                  transform: `rotate(${rotationAngle}deg) scale(${
                    rotationAngle % 180 !== 0 ? 0.72 : 1
                  })`,
                  transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className="w-full h-full object-contain cursor-pointer"
              />

              {/* Top-left Platform & Rotation Status Pill */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 pointer-events-none">
                {resolvedVideoPlatform && (
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-extrabold text-white border border-white/15 flex items-center gap-1.5 shadow-md">
                    <Video className="w-3 h-3 text-emerald-400" />
                    <span>{resolvedVideoPlatform} Player</span>
                  </span>
                )}
                {rotationAngle !== 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-bold shadow-md">
                    {rotationAngle}°
                  </span>
                )}
              </div>

              {/* Floating Video Quick Controls Overlay (Rotate, Fullscreen, Save, Share) */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/65 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotateMedia();
                  }}
                  className="px-2 py-1 rounded-lg hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Rotate Video (90° / 180° / 270°)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rotate</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="px-2 py-1 rounded-lg hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 text-purple-300" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-purple-300" />
                  )}
                  <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
                </button>
              </div>

              {/* Big Center Play/Pause button on pause */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-opacity z-10"
                >
                  <div
                    style={{ backgroundColor: primaryColor }}
                    className="w-16 h-16 rounded-full hover:brightness-110 text-white flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-all"
                  >
                    <Play className="w-7 h-7 fill-white ml-1" />
                  </div>
                </div>
              )}
            </>
          ) : isAudio ? (
            /* Audio / Music Visualizer Experience */
            <div className="w-full h-full p-6 sm:p-8 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/40 relative">
              <audio
                ref={audioRef}
                src={audioSrc}
                autoPlay
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime);
                  }
                }}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration || 37);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Spinning Vinyl Record Visualizer */}
              <div
                onClick={togglePlay}
                style={{ backgroundColor: primaryColor, animationDuration: '8s' }}
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 shadow-2xl flex items-center justify-center cursor-pointer transform hover:scale-105 active:scale-95 transition-all ${
                  isPlaying ? 'animate-spin' : ''
                }`}
              >
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center border-4 border-white/20">
                  <div
                    style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                  >
                    <Music className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Dancing Waveform Frequency Bars */}
              <div className="flex items-center gap-1.5 mt-5 h-8">
                {[14, 28, 42, 60, 80, 52, 35, 75, 90, 65, 40, 85, 95, 70, 50, 30, 20].map(
                  (height, i) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: primaryColor,
                        height: isPlaying
                          ? `${Math.max(8, (height * ((currentTime * 10 + i * 5) % 100)) / 100)}px`
                          : `${height * 0.3}px`,
                      }}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isPlaying ? 'opacity-90' : 'opacity-40'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          ) : isDocument ? (
            /* Document Preview */
            <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-center">
              <div
                style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-white/10"
              >
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white max-w-md truncate">{currentTitle}</h4>
              <p className="text-xs text-slate-400 mt-1">Document Attachment</p>
              <button
                type="button"
                onClick={handleDownload}
                style={{ backgroundColor: primaryColor }}
                className="mt-4 px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 hover:brightness-110 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download / Open Document</span>
              </button>
            </div>
          ) : (
            /* High-Res Picture Viewer with Click-to-Zoom & Drag Pan Controls */
            <div
              className="relative w-full h-full flex items-center justify-center overflow-hidden group"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={media.mediaUrl}
                alt={currentTitle}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale}) rotate(${rotationAngle}deg)`,
                  transition: isPanning
                    ? 'none'
                    : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                className={`max-w-full max-h-full object-contain ${
                  zoomScale > 1.0 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
                }`}
                referrerPolicy="no-referrer"
                onClick={handleImageClick}
                title="Click picture to zoom in/out"
              />

              {/* Top-left hint badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white/90 border border-white/10 pointer-events-none flex items-center gap-1.5">
                <ZoomIn className="w-3 h-3" />
                <span>Click picture to zoom ({Math.round(zoomScale * 100)}%)</span>
              </div>

              {/* Zoom Controls Overlay */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/15 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setZoomScale((z) => {
                      const next = Math.max(0.75, z - 0.25);
                      if (next <= 1.0) setPanOffset({ x: 0, y: 0 });
                      return next;
                    });
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1.5 font-bold text-white">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(3.5, z + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomScale !== 1.0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoomScale(1.0);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    style={{ color: primaryColor }}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-[10px] font-bold"
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Video & Audio Timeline & Playback Bar */}
        {(isVideo || isAudio) && (
          <div className="px-4 py-2.5 bg-black/75 backdrop-blur-md flex flex-col gap-2 border-t border-white/10 shrink-0">
            {/* Progress Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400 min-w-9">
                {formatTime(currentTime)}
              </span>
              <input
                id="media-timeline-slider"
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                style={{ accentColor: primaryColor }}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-400 min-w-9 text-right">
                {formatTime(duration)}
              </span>
            </div>

            {/* Play/Pause & Speed & Volume Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="media-play-pause-btn"
                  onClick={togglePlay}
                  style={{ backgroundColor: primaryColor }}
                  className="w-8 h-8 rounded-full hover:brightness-110 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetTime = Math.max(0, currentTime - 10);
                    setCurrentTime(targetTime);
                    if (videoRef.current) videoRef.current.currentTime = targetTime;
                    if (audioRef.current) audioRef.current.currentTime = targetTime;
                  }}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  id="media-speed-btn"
                  onClick={handleSpeedCycle}
                  className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                  title="Playback speed"
                >
                  {playbackSpeed}x
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Volume & Mute */}
                <button
                  type="button"
                  id="media-mute-btn"
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-slate-300" />
                  )}
                </button>
                <input
                  id="media-volume-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{ accentColor: primaryColor }}
                  className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer hidden sm:block"
                />

                {/* Rotate & Fullscreen & Share & Save controls in video bar */}
                {isVideo && (
                  <>
                    <button
                      type="button"
                      id="media-rotate-btn"
                      onClick={handleRotateMedia}
                      className="px-2 py-1 rounded-lg text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Rotate video"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Rotate</span>
                    </button>

                    <button
                      type="button"
                      id="media-bar-share-btn"
                      onClick={() => setIsShareModalOpen(true)}
                      className="px-2 py-1 rounded-lg text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Share video"
                    >
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Share</span>
                    </button>

                    <button
                      type="button"
                      id="media-bar-save-btn"
                      onClick={handleDownload}
                      className="px-2 py-1 rounded-lg text-slate-200 hover:text-white bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-500/40 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Save video to device"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Save</span>
                    </button>

                    <button
                      type="button"
                      id="media-fullscreen-btn"
                      onClick={toggleFullscreen}
                      className="px-2 py-1 rounded-lg text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* INTERACTIVE MEDIA SOCIAL, EDIT & DELETE DECK: Like, Share, Favourite, Edit Title, Delete */}
        {/* ====================================================================== */}
        <div className="p-4 bg-slate-900/95 border-t border-white/10 flex flex-col gap-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* 1. Like, Share, Favourite, Edit Title, Delete Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Like Button */}
              <button
                type="button"
                id="media-deck-like-btn"
                onClick={handleToggleLike}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
                  isLiked
                    ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isLiked ? 'fill-red-500 text-red-500 scale-110' : ''
                  }`}
                />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isLiked ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {likesCount}
                </span>
              </button>

              {/* Share Button */}
              <button
                type="button"
                id="media-deck-share-btn"
                onClick={() => setIsShareModalOpen(true)}
                style={{ backgroundColor: `${primaryColor}25`, borderColor: `${primaryColor}50` }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border text-white hover:brightness-110 transition-all cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              {/* Favourite Button (turns red) */}
              <button
                type="button"
                id="media-deck-fav-btn"
                onClick={handleToggleFavorite}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
                  isFavorite
                    ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isFavorite ? 'fill-red-500 text-red-500 scale-110' : ''
                  }`}
                />
                <span>{isFavorite ? 'Favourited' : 'Favourite'}</span>
              </button>

              {/* Add Liked Media to User Gallery (🤍 120K 3x3 Profile Grid) */}
              {(isImage || isVideo) && (
                <button
                  type="button"
                  id="media-deck-add-to-user-gallery-btn"
                  onClick={handleToggleAddToLikedUserGallery}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
                    inLikedUserGallery
                      ? 'bg-pink-500/25 border-pink-400/50 text-pink-200 shadow-sm'
                      : 'bg-gradient-to-r from-pink-600 to-rose-500 border-pink-400/40 text-white shadow-md hover:brightness-110'
                  }`}
                  title="Add this liked media to your 3×3 User Profile Gallery (🤍 120K style)"
                >
                  <Heart className="w-3.5 h-3.5 fill-white text-white" />
                  <span>
                    {inLikedUserGallery ? 'In User Gallery (120K)' : '+ Add to User Gallery'}
                  </span>
                </button>
              )}

              {/* Edit Title Button */}
              <button
                type="button"
                id="media-deck-edit-title-btn"
                onClick={() => {
                  setTitleInput(currentTitle);
                  setIsEditingTitle(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Title</span>
              </button>

              {/* Delete Media Button */}
              <button
                type="button"
                id="media-deck-delete-btn"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* 2. Interactive Star Rating Bar & Save */}
          <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">
                {hasRated ? 'Your rating:' : 'Rate media:'}
              </span>

              <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((starNum) => {
                  const isHighlighted = starNum <= activeStarCount;
                  return (
                    <button
                      key={starNum}
                      type="button"
                      id={`star-rate-${starNum}`}
                      onClick={() => handleRate(starNum)}
                      onMouseEnter={() => setHoverRating(starNum)}
                      className="p-1 text-slate-500 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                      title={`Rate ${starNum} star${starNum > 1 ? 's' : ''} (${RATING_DESCRIPTIONS[starNum]})`}
                    >
                      <Star
                        className={`w-4 h-4 transition-colors duration-150 ${
                          isHighlighted
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] font-bold text-amber-400">
                {averageRating.toFixed(1)} ({totalRatings})
              </span>
            </div>

            {/* Quick Actions: Rotate, Share & Save to Device */}
            <div className="flex items-center gap-1.5 ml-auto">
              {(isVideo || isImage) && (
                <button
                  type="button"
                  onClick={handleRotateMedia}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rotate</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Share media"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Share</span>
              </button>

              <button
                type="button"
                id="deck-save-to-device-btn"
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Save to device"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to Device</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog / Modal Sheet */}
      {isShareModalOpen && (
        <div
          id="media-share-dialog-backdrop"
          onClick={() => setIsShareModalOpen(false)}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            id="media-share-dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl p-5 bg-[#18202c] border border-slate-700 text-white shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                >
                  {isGroupMedia ? <Users className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {isGroupMedia ? 'Share to Group Members Only' : 'Share Media'}
                  </h4>
                  {isGroupMedia && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      <span>Restricted to {groupName} members only</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isGroupMedia ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Select other members of <strong>{groupName}</strong> to share "{currentTitle}" with. External non-member sharing is disabled.
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>
                    {selectedGroupMemberIds.length > 0 ? (
                      <span className="text-emerald-400 font-bold">
                        {selectedGroupMemberIds.length} group member{selectedGroupMemberIds.length > 1 ? 's' : ''} selected
                      </span>
                    ) : (
                      'Choose group members'
                    )}
                  </span>
                  {otherGroupMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedGroupMemberIds.length === otherGroupMembers.length) {
                          setSelectedGroupMemberIds([]);
                        } else {
                          setSelectedGroupMemberIds(otherGroupMembers.map((m) => m.id));
                        }
                      }}
                      style={{ color: primaryColor }}
                      className="font-bold hover:underline cursor-pointer"
                    >
                      {selectedGroupMemberIds.length === otherGroupMembers.length
                        ? 'Deselect All'
                        : 'Select All Members'}
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {otherGroupMembers.map((member) => {
                    const isSelected = selectedGroupMemberIds.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          setSelectedGroupMemberIds((prev) =>
                            prev.includes(member.id)
                              ? prev.filter((id) => id !== member.id)
                              : [...prev, member.id]
                          );
                        }}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500/70 text-white'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Group Member • {member.nativeLanguage || 'English'}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={groupShareNote}
                  onChange={(e) => setGroupShareNote(e.target.value)}
                  placeholder="Optional note for group members..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none"
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="confirm-share-group-members-btn"
                    disabled={selectedGroupMemberIds.length === 0}
                    onClick={() => {
                      const targetMembers = otherGroupMembers.filter((m) =>
                        selectedGroupMemberIds.includes(m.id)
                      );
                      const names = targetMembers.map((m) => m.name.split(' ')[0]).join(', ');
                      if (onShareWithGroupMembers && media) {
                        onShareWithGroupMembers(
                          { ...media, title: currentTitle },
                          selectedGroupMemberIds,
                          groupShareNote.trim() || undefined
                        );
                      }
                      showToast(`Shared "${currentTitle}" with ${names} (Group Members Only)!`);
                      setSelectedGroupMemberIds([]);
                      setGroupShareNote('');
                      setIsShareModalOpen(false);
                    }}
                    style={
                      selectedGroupMemberIds.length > 0
                        ? { backgroundColor: primaryColor }
                        : undefined
                    }
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      selectedGroupMemberIds.length > 0
                        ? 'text-white hover:brightness-110 active:scale-95 cursor-pointer shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      Share ({selectedGroupMemberIds.length})
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300 mb-4">
                  Share "{currentTitle}" with friends or export it to your device.
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    id="share-copy-link-btn"
                    onClick={handleCopyLink}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <Copy className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold">Copy Media Link</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Copy direct link to clipboard
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="share-native-sheet-btn"
                    onClick={handleNativeShare}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                      >
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold">Share via Device Sheet</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Send to friends or external apps
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="share-download-btn"
                    onClick={handleDownload}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold">Save File to Device</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Download original high quality media
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
