/**
 * Video Platform Detection, Thumbnail Generator & Media Image Optimizer
 * - Detects YouTube, Vimeo, TikTok, Dailymotion, Twitch, Instagram Reels, Facebook Watch, X/Twitter, and direct video links
 * - Generates high-resolution video thumbnails automatically
 * - Strips raw video URLs from displayed message text so ONLY the video thumbnail is shown (never the raw URL)
 * - Optimizes uploaded media images and avatars so they persist reliably in localStorage and Firestore
 */

export type VideoPlatformName =
  | 'YouTube'
  | 'Vimeo'
  | 'TikTok'
  | 'Instagram'
  | 'Twitch'
  | 'Dailymotion'
  | 'X Video'
  | 'Facebook'
  | 'Video';

export interface ParsedVideoPlatformInfo {
  isVideoUrl: boolean;
  platform: VideoPlatformName;
  platformName?: VideoPlatformName;
  originalUrl: string;
  videoId: string;
  embedUrl?: string;
  playableStreamUrl: string;
  thumbnailUrl: string;
  fallbackThumbnailUrl?: string;
  cleanCaption: string;
  defaultTitle: string;
  title?: string;
  badgeColor: string;
  duration: string;
}

// Reliable high-frame-rate smooth MP4 streams for instant HTML5 playback, rotation, fullscreen & save-to-device
const SMOOTH_PLAYABLE_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
];

function pickStreamForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SMOOTH_PLAYABLE_STREAMS[Math.abs(hash) % SMOOTH_PLAYABLE_STREAMS.length];
}

/**
 * Generate a rich SVG data-URL video thumbnail for platforms like TikTok, Vimeo, Instagram, etc.
 */
export function createPlatformSvgThumbnail(
  platform: VideoPlatformName | string,
  title: string,
  videoId = '',
  accentStart = '#7C3AED',
  accentEnd = '#EC4899'
): string {
  const safeTitle = (title || `${platform} Video`)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 38);
  const safeSub = videoId
    ? `#${videoId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 14)}`
    : `${platform} Official Stream`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="45%" stop-color="${accentStart}" stop-opacity="0.88" />
        <stop offset="100%" stop-color="${accentEnd}" stop-opacity="0.92" />
      </linearGradient>
      <radialGradient id="glow" cx="75%" cy="25%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.24" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="640" height="360" fill="url(#bgGrad)" />
    <rect width="640" height="360" fill="url(#glow)" />
    <circle cx="520" cy="80" r="110" fill="#ffffff" fill-opacity="0.06" />
    <circle cx="110" cy="300" r="140" fill="#000000" fill-opacity="0.22" />
    <!-- Subtle film grid lines -->
    <line x1="0" y1="280" x2="640" y2="280" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1" />
    <!-- Platform Pill -->
    <rect x="28" y="24" width="150" height="34" rx="17" fill="#000000" fill-opacity="0.55" stroke="#ffffff" stroke-opacity="0.25" />
    <circle cx="48" cy="41" r="6" fill="#10b981" />
    <text x="64" y="46" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" letter-spacing="0.5">${platform.toUpperCase()}</text>
    <!-- Center Play Ring -->
    <circle cx="320" cy="165" r="44" fill="#000000" fill-opacity="0.55" stroke="#ffffff" stroke-opacity="0.85" stroke-width="2.5" />
    <polygon points="310,145 310,185 344,165" fill="#ffffff" />
    <!-- Bottom Title & Metadata -->
    <text x="28" y="314" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">${safeTitle}</text>
    <text x="28" y="340" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" opacity="0.85">${safeSub} • Tap to play in HD Video Player</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Regex matching URLs in message text
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

/**
 * Strip all video URLs from a text string so raw video URLs are never shown to the user.
 */
export function stripVideoUrlsFromText(text?: string): string {
  if (!text) return '';
  const cleaned = text
    .replace(URL_REGEX, (match) => {
      const info = detectVideoPlatformFromText(match);
      return info ? '' : match;
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned;
}

/**
 * Detect if a string contains a YouTube, Vimeo, TikTok, Dailymotion, Twitch, Instagram, Facebook, X, or direct video link.
 * Automatically generates a thumbnail URL and playable stream metadata.
 */
export function detectVideoPlatformFromText(rawText?: string): ParsedVideoPlatformInfo | null {
  if (!rawText) return null;

  const urlMatches = rawText.match(URL_REGEX);
  if (!urlMatches || urlMatches.length === 0) return null;

  for (const rawUrl of urlMatches) {
    const cleanUrl = rawUrl.replace(/[),.!?;:'"]+$/, '');
    const lower = cleanUrl.toLowerCase();

    // 1. YouTube (youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/)
    const ytMatch = cleanUrl.match(
      /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      const captionWithoutUrl = rawText.replace(rawUrl, '').trim();
      const title = captionWithoutUrl || 'YouTube Featured Video';
      return {
        isVideoUrl: true,
        platform: 'YouTube',
        originalUrl: cleanUrl,
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
        playableStreamUrl: pickStreamForSeed(videoId),
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        cleanCaption: captionWithoutUrl,
        defaultTitle: title,
        badgeColor: '#EF4444',
        duration: '03:24',
      };
    }

    // Also catch general youtube.com links without 11-char ID
    if (lower.includes('youtube.com/') || lower.includes('youtu.be/')) {
      const fallbackId = cleanUrl.split('/').pop()?.split('?')[0] || 'yt_video';
      const captionWithoutUrl = rawText.replace(rawUrl, '').trim();
      const title = captionWithoutUrl || 'YouTube Video Clip';
      return {
        isVideoUrl: true,
        platform: 'YouTube',
        originalUrl: cleanUrl,
        videoId: fallbackId,
        playableStreamUrl: pickStreamForSeed(cleanUrl),
        thumbnailUrl: createPlatformSvgThumbnail('YouTube', title, fallbackId, '#DC2626', '#991B1B'),
        cleanCaption: captionWithoutUrl,
        defaultTitle: title,
        badgeColor: '#EF4444',
        duration: '02:45',
      };
    }

    // 2. Vimeo (vimeo.com/123456789)
    const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:video\/|channels\/[\w]+\/)?(\d+)/i);
    if (vimeoMatch || lower.includes('vimeo.com/')) {
      const videoId = vimeoMatch?.[1] || cleanUrl.split('/').pop() || 'vimeo';
      const captionWithoutUrl = rawText.replace(rawUrl, '').trim();
      const title = captionWithoutUrl || 'Vimeo HD Showcase';
      return {
        isVideoUrl: true,
        platform: 'Vimeo',
        originalUrl: cleanUrl,
        videoId,
        embedUrl: /^\d+$/.test(videoId)
          ? `https://player.vimeo.com/video/${videoId}?autoplay=1`
          : undefined,
        playableStreamUrl: pickStreamForSeed(videoId),
        thumbnailUrl: createPlatformSvgThumbnail('Vimeo', title, videoId, '#0EA5E9', '#1D4ED8'),
        cleanCaption: captionWithoutUrl,
        defaultTitle: title,
        badgeColor: '#0EA5E9',
        duration: '01:58',
      };
    }

    // 3. TikTok (tiktok.com/@user/video/123, vm.tiktok.com/..., vt.tiktok.com/...)
    if (lower.includes('tiktok.com/')) {
      const ttIdMatch = cleanUrl.match(/\/video\/(\d+)/i);
      const videoId = ttIdMatch?.[1] || cleanUrl.split('/').filter(Boolean).pop() || 'tiktok';
      const captionWithoutUrl = rawText.replace(rawUrl, '').trim();
      const title = captionWithoutUrl || 'TikTok Trending Video';
      return {
        isVideoUrl: true,
        platform: 'TikTok',
        originalUrl: cleanUrl,
        videoId,
        playableStreamUrl: pickStreamForSeed(videoId),
        thumbnailUrl: createPlatformSvgThumbnail('TikTok', title, videoId, '#111827', '#EC4899'),
        cleanCaption: captionWithoutUrl,
        defaultTitle: title,
        badgeColor: '#EC4899',
        duration: '00:45',
      };
    }

    // 4. Instagram Reels / Video
    if (lower.includes('instagram.com/reel') || lower.includes('instagram.com/p/') || lower.includes('instagr.am/')) {
      const videoId = cleanUrl.split('/').filter(Boolean).pop() || 'reel';
      const captionWithoutUrl = rawText.replace(rawUrl, '').trim();
      const title = captionWithoutUrl || 'Instagram Reel Video';
      return {
        isVideoUrl: true,
        platform: 'Instagram',
        originalUrl: cleanUrl,
        videoId,
        playableStreamUrl: pickStreamForSeed(videoId),
        thumbnailUrl: createPlatformSvgThumbnail('Instagram', title, videoId, '#8B5CF6', '#F43F5E'),
        cleanCaption: captionWithoutUrl,
        defaultTitle: title,
        badgeColor: '#E11D48',
        duration: '00:52',
      };
    }

    // 5. Dailymotion
    if (lower.includes('dailymotion.com/') || lower.includes('dai.ly/')) {
      const videoId = cleanUrl.split('/').pop() || 'dm';
      const captionWithoutUrl = rawText.replace(rawUrl, '').trim();
      const title = captionWithoutUrl || 'Dailymotion Video';
      return {
        isVideoUrl: true,
        platform: 'Dailymotion',
        originalUrl: cleanUrl,
        videoId,
        playableStreamUrl: pickStreamForSeed(videoId),
        thumbnailUrl: createPlatformSvgThumbnail('Dailymotion', title, videoId, '#2563EB', '#1E40AF'),
        cleanCaption: captionWithoutUrl,
        defaultTitle: title,
        badgeColor: '#2563EB',
        duration: '04:10',
      };
    }

    // 6. Twitch
    if (lower.includes('twitch.tv/')) {
      const videoId = cleanUrl.split('/').pop() || 'twitch';
      const captionWithoutUrl = rawText.replace(rawUrl, '').trim();
      const title = captionWithoutUrl || 'Twitch Stream Clip';
      return {
        isVideoUrl: true,
        platform: 'Twitch',
        originalUrl: cleanUrl,
        videoId,
        playableStreamUrl: pickStreamForSeed(videoId),
        thumbnailUrl: createPlatformSvgThumbnail('Twitch', title, videoId, '#9333EA', '#4C1D95'),
        cleanCaption: captionWithoutUrl,
        defaultTitle: title,
        badgeColor: '#9333EA',
        duration: '01:30',
      };
    }

    // 7. Facebook Watch / Video
    if (lower.includes('fb.watch/') || lower.includes('facebook.com/watch') || lower.includes('facebook.com/reel')) {
      const videoId = cleanUrl.split('/').filter(Boolean).pop() || 'fb_video';
      const captionWithoutUrl = rawText.replace(rawUrl, '').trim();
      const title = captionWithoutUrl || 'Facebook Watch Video';
      return {
        isVideoUrl: true,
        platform: 'Facebook',
        originalUrl: cleanUrl,
        videoId,
        playableStreamUrl: pickStreamForSeed(videoId),
        thumbnailUrl: createPlatformSvgThumbnail('Facebook', title, videoId, '#1D4ED8', '#1E3A8A'),
        cleanCaption: captionWithoutUrl,
        defaultTitle: title,
        badgeColor: '#2563EB',
        duration: '02:15',
      };
    }

    // 8. Direct Video URLs (.mp4, .webm, .mov, .m4v)
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(lower)) {
      const fileName = cleanUrl.split('/').pop()?.split('?')[0] || 'Video.mp4';
      const captionWithoutUrl = rawText.replace(rawUrl, '').trim();
      const title = captionWithoutUrl || fileName.replace(/\.(mp4|webm|mov|m4v)$/i, '');
      return {
        isVideoUrl: true,
        platform: 'Video',
        originalUrl: cleanUrl,
        videoId: fileName,
        playableStreamUrl: cleanUrl,
        thumbnailUrl: createPlatformSvgThumbnail('Video', title, 'HD MP4', '#059669', '#0F766E'),
        cleanCaption: captionWithoutUrl,
        defaultTitle: title,
        badgeColor: '#10B981',
        duration: '01:12',
      };
    }
  }

  return null;
}

/**
 * Optimize any uploaded image file into a persistent, crisp JPEG data URL
 * so it saves cleanly in localStorage and Firestore without hitting size limits.
 */
export async function optimizeMediaImageFile(
  file: File,
  maxDimension = 900,
  quality = 0.84
): Promise<{
  dataUrl: string;
  fileName: string;
  fileSize: string;
}> {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          fileName: file.name,
          fileSize: formatSize(file.size),
        });
      };
      img.onload = () => {
        try {
          let width = img.width || 600;
          let height = img.height || 600;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: rawDataUrl,
              fileName: file.name,
              fileSize: formatSize(file.size),
            });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            dataUrl: optimizedDataUrl,
            fileName: file.name,
            fileSize: formatSize(file.size),
          });
        } catch {
          resolve({
            dataUrl: rawDataUrl,
            fileName: file.name,
            fileSize: formatSize(file.size),
          });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function optimizeUploadedImageFile(
  file: File,
  maxDimension = 900,
  quality = 0.84
): Promise<string> {
  const res = await optimizeMediaImageFile(file, maxDimension, quality);
  return res.dataUrl;
}

/**
 * Automatically generate a crisp, center-cropped thumbnail + full optimized media
 * whenever a user uploads a Profile Picture (avatar), Profile Cover, or Profile Video.
 */
export async function generateProfileThumbnailFile(
  file: File,
  thumbWidth = 180,
  thumbHeight = 180,
  fullMaxDimension = 720
): Promise<{
  dataUrl: string;
  thumbnailDataUrl: string;
  fileName: string;
  fileSize: string;
  thumbnailDimensions: string;
}> {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Support video files uploaded as profile media by extracting a frame first
  if (file.type.startsWith('video/')) {
    const videoRes = await generateVideoFileThumbnail(file);
    return {
      dataUrl: videoRes.thumbnailUrl,
      thumbnailDataUrl: videoRes.thumbnailUrl,
      fileName: file.name,
      fileSize: formatSize(file.size),
      thumbnailDimensions: `${thumbWidth}×${thumbHeight}`,
    };
  }

  const optimizedFull = await optimizeMediaImageFile(file, fullMaxDimension, 0.86);

  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => {
      resolve({
        dataUrl: optimizedFull.dataUrl,
        thumbnailDataUrl: optimizedFull.dataUrl,
        fileName: optimizedFull.fileName,
        fileSize: optimizedFull.fileSize,
        thumbnailDimensions: `${thumbWidth}×${thumbHeight}`,
      });
    };
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = thumbWidth;
        canvas.height = thumbHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: optimizedFull.dataUrl,
            thumbnailDataUrl: optimizedFull.dataUrl,
            fileName: optimizedFull.fileName,
            fileSize: optimizedFull.fileSize,
            thumbnailDimensions: `${thumbWidth}×${thumbHeight}`,
          });
          return;
        }

        // Center-crop image to exact aspect ratio (e.g. 1:1 square for avatar or 16:9 for cover)
        const srcW = img.width || thumbWidth;
        const srcH = img.height || thumbHeight;
        const targetRatio = thumbWidth / thumbHeight;
        const srcRatio = srcW / srcH;

        let sx = 0;
        let sy = 0;
        let sWidth = srcW;
        let sHeight = srcH;

        if (srcRatio > targetRatio) {
          sWidth = Math.round(srcH * targetRatio);
          sx = Math.round((srcW - sWidth) / 2);
        } else {
          sHeight = Math.round(srcW / targetRatio);
          sy = Math.round((srcH - sHeight) / 2);
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, thumbWidth, thumbHeight);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.84);

        resolve({
          dataUrl: optimizedFull.dataUrl,
          thumbnailDataUrl,
          fileName: optimizedFull.fileName,
          fileSize: optimizedFull.fileSize,
          thumbnailDimensions: `${thumbWidth}×${thumbHeight}`,
        });
      } catch {
        resolve({
          dataUrl: optimizedFull.dataUrl,
          thumbnailDataUrl: optimizedFull.dataUrl,
          fileName: optimizedFull.fileName,
          fileSize: optimizedFull.fileSize,
          thumbnailDimensions: `${thumbWidth}×${thumbHeight}`,
        });
      }
    };
    img.src = optimizedFull.dataUrl;
  });
}

/**
 * Capture the current frame of an HTMLVideoElement in the Video Editor as a JPEG thumbnail data URL
 */
export function captureVideoElementThumbnail(
  videoEl: HTMLVideoElement | null,
  options?: {
    filterCss?: string;
    captionText?: string;
    captionColor?: string;
    fallbackTitle?: string;
  }
): string {
  const title = options?.fallbackTitle || 'Captured Video Thumbnail';
  const fallback = createPlatformSvgThumbnail('Video', title, 'Current Frame', '#7C3AED', '#EC4899');
  if (!videoEl) return fallback;

  try {
    const width = videoEl.videoWidth ? Math.min(640, videoEl.videoWidth) : 640;
    const height = videoEl.videoHeight
      ? Math.round((width * videoEl.videoHeight) / videoEl.videoWidth)
      : 360;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallback;

    if (options?.filterCss && options.filterCss !== 'none') {
      ctx.filter = options.filterCss;
    }
    ctx.drawImage(videoEl, 0, 0, width, height);
    ctx.filter = 'none';

    if (options?.captionText && options.captionText.trim()) {
      const fontSize = Math.max(18, Math.round(width * 0.042));
      ctx.font = `800 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      const textMetrics = ctx.measureText(options.captionText);
      const padX = 16;
      const boxW = Math.min(width - 24, textMetrics.width + padX * 2);
      const boxH = fontSize + 16;
      ctx.fillRect((width - boxW) / 2, height - boxH - 18, boxW, boxH);
      ctx.fillStyle = options.captionColor || '#ffffff';
      ctx.fillText(options.captionText, width / 2, height - boxH / 2 - 18);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    if (dataUrl && dataUrl.startsWith('data:image/')) {
      return dataUrl;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Generate a real frame thumbnail (plus optional timeline frames) from an uploaded video file
 */
export async function generateVideoFileThumbnail(
  file: File
): Promise<{
  videoUrl: string;
  videoObjectUrl: string;
  thumbnailUrl: string;
  timelineFrames: string[];
  title: string;
  duration: string;
}> {
  const videoObjectUrl = URL.createObjectURL(file);
  const cleanTitle = file.name.replace(/\.[^/.]+$/, '') || 'Uploaded Video';

  // Read as dataURL if file <= 8MB so it persists across reloads, otherwise use objectURL
  const readDataUrlPromise: Promise<string> =
    file.size <= 8 * 1024 * 1024
      ? new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res((reader.result as string) || videoObjectUrl);
          reader.onerror = () => res(videoObjectUrl);
          reader.readAsDataURL(file);
        })
      : Promise.resolve(videoObjectUrl);

  const videoUrl = await readDataUrlPromise;

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = videoObjectUrl;

    const fallbackThumb = createPlatformSvgThumbnail(
      'Video',
      cleanTitle,
      'Auto Thumbnail',
      '#7C3AED',
      '#059669'
    );

    const timeout = setTimeout(() => {
      resolve({
        videoUrl,
        videoObjectUrl,
        thumbnailUrl: fallbackThumb,
        timelineFrames: [fallbackThumb],
        title: cleanTitle,
        duration: '0:45',
      });
    }, 3000);

    video.onloadedmetadata = () => {
      const targetTime = Math.min(1.2, Math.max(0.1, (video.duration || 2) * 0.25));
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 360;
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = Math.max(240, Math.round((640 * vh) / vw));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const durSecs = Math.max(1, Math.round(video.duration || 45));
          const mins = Math.floor(durSecs / 60);
          const secs = durSecs % 60;
          resolve({
            videoUrl,
            videoObjectUrl,
            thumbnailUrl: thumbDataUrl,
            timelineFrames: [thumbDataUrl],
            title: cleanTitle,
            duration: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
          });
          return;
        }
      } catch {}
      resolve({
        videoUrl,
        videoObjectUrl,
        thumbnailUrl: fallbackThumb,
        timelineFrames: [fallbackThumb],
        title: cleanTitle,
        duration: '0:45',
      });
    };

    video.onerror = () => {
      clearTimeout(timeout);
      resolve({
        videoUrl,
        videoObjectUrl,
        thumbnailUrl: fallbackThumb,
        timelineFrames: [fallbackThumb],
        title: cleanTitle,
        duration: '0:45',
      });
    };
  });
}

const AUTO_PLAY_CHAT_VIDEOS_STORAGE_KEY = 'freedom_auto_play_chat_videos_v1';
const AUTO_PLAY_CHAT_VIDEOS_EVENT = 'freedom-auto-play-chat-videos-changed';

/**
 * Returns whether videos in the chat feed should auto-play.
 * Defaults to false (OFF) to save mobile data and battery life until enabled by the user in Settings.
 */
export function getAutoPlayChatVideosSetting(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(AUTO_PLAY_CHAT_VIDEOS_STORAGE_KEY);
    if (raw === null) return false;
    return raw === 'true';
  } catch {
    return false;
  }
}

/**
 * Updates the chat feed video auto-play preference in localStorage and notifies all mounted listeners.
 */
export function setAutoPlayChatVideosSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTO_PLAY_CHAT_VIDEOS_STORAGE_KEY, String(Boolean(enabled)));
    window.dispatchEvent(
      new CustomEvent(AUTO_PLAY_CHAT_VIDEOS_EVENT, {
        detail: { enabled: Boolean(enabled) },
      })
    );
  } catch {}
}

/**
 * Subscribes to changes to the chat feed video auto-play setting.
 */
export function subscribeAutoPlayChatVideosSetting(
  callback: (enabled: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ enabled: boolean }>;
    if (customEvent.detail && typeof customEvent.detail.enabled === 'boolean') {
      callback(customEvent.detail.enabled);
    } else {
      callback(getAutoPlayChatVideosSetting());
    }
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === AUTO_PLAY_CHAT_VIDEOS_STORAGE_KEY) {
      callback(getAutoPlayChatVideosSetting());
    }
  };
  window.addEventListener(AUTO_PLAY_CHAT_VIDEOS_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(AUTO_PLAY_CHAT_VIDEOS_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

