import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  Sliders,
  Droplet,
  Sticker,
  Type,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Undo2,
  Redo2,
  Sparkles,
  Shuffle,
  Plus,
  Trash2,
  PenTool,
  Smile,
  Image as ImageIcon,
  Check,
  Wand2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Palette,
  Crop,
  Share2,
  Send,
  Upload,
  Camera,
  Film,
} from 'lucide-react';
import {
  generateVideoFileThumbnail,
  generateProfileThumbnailFile,
  captureVideoElementThumbnail,
} from '../lib/videoPlatformHelper';
import {
  FILTER_CATEGORIES,
  SIXTY_PLUS_FILTERS,
  TEXT_DESIGN_TEMPLATES,
  EDITOR_COLOR_PALETTE,
  BUILTIN_EDITOR_STICKERS,
  FilterCategory,
  StickerCategory,
  EditorStickerDefinition,
  getSavedCustomEditorStickers,
  addCustomEditorSticker,
  removeCustomEditorSticker,
} from '../lib/mediaEditorCatalog';

export type EditorToolTab =
  | 'adjust'
  | 'focus'
  | 'filter'
  | 'sticker'
  | 'text'
  | 'text_design'
  | 'brush'
  | 'video_thumbnail'
  | 'ai_tools';

export interface EditorAdjustments {
  brightness: number; // -100..100
  contrast: number; // -100..100
  saturation: number; // -100..100
  warmth: number; // -100..100
  exposure: number; // -100..100
  highlights: number; // -100..100
  shadows: number; // -100..100
  sharpness: number; // 0..100
  vignette: number; // 0..100
  fade: number; // 0..100
  hue: number; // -180..180
}

export interface EditorFocusConfig {
  mode: 'none' | 'radial' | 'linear' | 'portrait_bokeh';
  intensity: number; // 0..100
  radius: number; // 20..85
}

export type CropAspectRatio = 'original' | '1:1' | '4:5' | '16:9' | '9:16';

export interface EditorCropConfig {
  aspectRatio: CropAspectRatio;
  zoomScale: number; // 1.0..1.5
  offsetX: number; // -0.25..0.25
  offsetY: number; // -0.25..0.25
}

export interface AiMagicFixSuggestion {
  visualAnalysis: string;
  colorAdjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
    exposure: number;
    highlights: number;
    shadows: number;
    sharpness: number;
    vignette: number;
    rationale: string;
  };
  cropSuggestion: {
    aspectRatio: CropAspectRatio;
    zoomScale: number;
    focusOffsetX: number;
    focusOffsetY: number;
    label: string;
    rationale: string;
  };
  filterEnhancements: {
    primaryFilterId: string;
    alternativeFilterIds: string[];
    rationale: string;
  };
}

export interface CanvasOverlayElement {
  id: string;
  kind: 'text' | 'text_design' | 'sticker';
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  scale: number; // 0.4..2.8
  rotationDeg: number; // -180..180
  // Text / Text Design props
  text?: string;
  color?: string;
  bgColor?: string;
  fontFamily?: string;
  templateId?: string;
  // Sticker props
  stickerDef?: EditorStickerDefinition;
}

export interface BrushStrokePath {
  id: string;
  color: string;
  size: number;
  style: 'solid' | 'neon' | 'dashed';
  points: { x: number; y: number }[]; // normalized 0..1
}

interface EditorSnapshotState {
  adjustments: EditorAdjustments;
  focusConfig: EditorFocusConfig;
  cropConfig: EditorCropConfig;
  selectedFilterId: string;
  overlays: CanvasOverlayElement[];
  brushStrokes: BrushStrokePath[];
}

export interface GalleryPhotoVideoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaTitle?: string;
  mediaId?: string;
  thumbnailUrl?: string;
  primaryColor?: string;
  onSaveEditedMedia?: (result: {
    mediaId?: string;
    mediaType: 'image' | 'video';
    editedDataUrl: string;
    thumbnailUrl: string;
    title: string;
  }) => void;
}

const DEFAULT_ADJUSTMENTS: EditorAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  vignette: 0,
  fade: 0,
  hue: 0,
};

const DEFAULT_FOCUS: EditorFocusConfig = {
  mode: 'none',
  intensity: 35,
  radius: 55,
};

const DEFAULT_CROP: EditorCropConfig = {
  aspectRatio: 'original',
  zoomScale: 1,
  offsetX: 0,
  offsetY: 0,
};

export const GalleryPhotoVideoEditorModal: React.FC<GalleryPhotoVideoEditorModalProps> = ({
  isOpen,
  onClose,
  mediaType: initialMediaType,
  mediaUrl: initialMediaUrl,
  mediaTitle = 'Creative Media',
  mediaId,
  thumbnailUrl,
  onSaveEditedMedia,
}) => {
  const [activeMediaType, setActiveMediaType] = useState<'image' | 'video'>(initialMediaType);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string>(initialMediaUrl);
  const [activeTitle, setActiveTitle] = useState<string>(mediaTitle);

  const [activeTool, setActiveTool] = useState<EditorToolTab>('adjust');
  const [activeAdjustParam, setActiveAdjustParam] =
    useState<keyof EditorAdjustments>('brightness');

  // Core Editor State
  const [adjustments, setAdjustments] = useState<EditorAdjustments>(DEFAULT_ADJUSTMENTS);
  const [focusConfig, setFocusConfig] = useState<EditorFocusConfig>(DEFAULT_FOCUS);
  const [cropConfig, setCropConfig] = useState<EditorCropConfig>(DEFAULT_CROP);
  const [selectedFilterCategory, setSelectedFilterCategory] =
    useState<FilterCategory>('popular');
  const [selectedFilterId, setSelectedFilterId] = useState<string>('original');
  const [overlays, setOverlays] = useState<CanvasOverlayElement[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [brushStrokes, setBrushStrokes] = useState<BrushStrokePath[]>([]);

  // Floating AI Magic Fix State
  const [isMagicFixRunning, setIsMagicFixRunning] = useState<boolean>(false);
  const [magicFixSuggestion, setMagicFixSuggestion] = useState<AiMagicFixSuggestion | null>(null);
  const [isMagicFixCardOpen, setIsMagicFixCardOpen] = useState<boolean>(false);

  // Share Edited Photo/Video to Friends & Groups with Message State
  const [isShareEditorModalOpen, setIsShareEditorModalOpen] = useState<boolean>(false);
  const [shareRecipientTab, setShareRecipientTab] = useState<'all' | 'friends' | 'groups'>('all');
  const [selectedShareRecipientIds, setSelectedShareRecipientIds] = useState<string[]>([
    'user_kristin',
    'group_global_team',
  ]);
  const [shareMessageCaption, setShareMessageCaption] = useState<string>(
    'Check out this photo I just edited in the Studio Editor! ✨'
  );
  const [sharePreviewDataUrl, setSharePreviewDataUrl] = useState<string>('');

  // Undo / Redo History Stack
  const [history, setHistory] = useState<EditorSnapshotState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Video playback controls (matching Screenshot_20210725_004432.jpg)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(44);

  // Current Video Thumbnail State (Auto-generated on upload/load + Custom Upload in Video Editor)
  const [currentVideoThumbnailUrl, setCurrentVideoThumbnailUrl] = useState<string>(
    thumbnailUrl || ''
  );
  const [videoThumbnailSource, setVideoThumbnailSource] = useState<
    'auto' | 'uploaded' | 'captured_frame'
  >('auto');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState<boolean>(false);

  // Text & Text Design Input State
  const [textInputDraft, setTextInputDraft] = useState<string>('My cat');
  const [selectedTextColor, setSelectedTextColor] = useState<string>('#60A5FA');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('bold_modern');

  // Sticker Library State
  const [activeStickerCat, setActiveStickerCat] = useState<StickerCategory>('props');
  const [customStickers, setCustomStickers] = useState<EditorStickerDefinition[]>(() =>
    getSavedCustomEditorStickers()
  );
  const [customStickerTextDraft, setCustomStickerTextDraft] = useState<string>('');

  // Brush State (matching 36.jpg marker tool)
  const [brushColor, setBrushColor] = useState<string>('#F472B6');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [brushStyle, setBrushStyle] = useState<'solid' | 'neon' | 'dashed'>('neon');
  const [isDrawingStroke, setIsDrawingStroke] = useState<boolean>(false);

  // AI Studio Tools State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [editorToast, setEditorToast] = useState<string | null>(null);

  // Dragging overlay state
  const [draggingOverlayId, setDraggingOverlayId] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const loadedStickerImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const customStickerFileRef = useRef<HTMLInputElement | null>(null);
  const replaceMediaFileRef = useRef<HTMLInputElement | null>(null);
  const videoThumbnailFileRef = useRef<HTMLInputElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setEditorToast(msg);
    setTimeout(() => setEditorToast(null), 2600);
  }, []);

  // Push snapshot to Undo/Redo stack
  const pushHistorySnapshot = useCallback(
    (next: Partial<EditorSnapshotState>) => {
      const snap: EditorSnapshotState = {
        adjustments: next.adjustments ?? adjustments,
        focusConfig: next.focusConfig ?? focusConfig,
        cropConfig: next.cropConfig ?? cropConfig,
        selectedFilterId: next.selectedFilterId ?? selectedFilterId,
        overlays: next.overlays ?? overlays,
        brushStrokes: next.brushStrokes ?? brushStrokes,
      };
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const updated = [...sliced, snap].slice(-30);
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    },
    [adjustments, focusConfig, cropConfig, selectedFilterId, overlays, brushStrokes, historyIndex]
  );

  // Initialize editor when opened
  useEffect(() => {
    if (!isOpen) return;
    setActiveMediaType(initialMediaType);
    setActiveMediaUrl(initialMediaUrl);
    setActiveTitle(mediaTitle || 'Creative Media');
    setCurrentVideoThumbnailUrl(thumbnailUrl || initialMediaUrl || '');
    setVideoThumbnailSource('auto');
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setFocusConfig(DEFAULT_FOCUS);
    setCropConfig(DEFAULT_CROP);
    setSelectedFilterId('original');
    setBrushStrokes([]);
    setMagicFixSuggestion(null);
    setIsMagicFixCardOpen(false);

    // Default initial overlays so user can immediately see how movable/editable overlays work or clear them
    const initialOverlays: CanvasOverlayElement[] = [];
    setOverlays(initialOverlays);
    setSelectedOverlayId(null);

    const initialSnap: EditorSnapshotState = {
      adjustments: DEFAULT_ADJUSTMENTS,
      focusConfig: DEFAULT_FOCUS,
      cropConfig: DEFAULT_CROP,
      selectedFilterId: 'original',
      overlays: initialOverlays,
      brushStrokes: [],
    };
    setHistory([initialSnap]);
    setHistoryIndex(0);
  }, [isOpen, initialMediaType, initialMediaUrl, mediaTitle]);

  // Load Image or Video source
  useEffect(() => {
    if (!isOpen) return;

    if (activeMediaType === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
      };
      img.onerror = () => {
        // Fallback if CORS blocks direct Image() with crossOrigin
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          imageRef.current = fallbackImg;
        };
        fallbackImg.src = activeMediaUrl;
      };
      img.src = activeMediaUrl;
    } else if (videoRef.current) {
      const vid = videoRef.current;
      vid.src = activeMediaUrl;
      vid.muted = isMuted;
      vid.loop = true;
      vid.playsInline = true;
      vid.onloadedmetadata = () => {
        setVideoDuration(Math.max(1, Math.round(vid.duration || 44)));
        if (isPlaying) {
          vid.play().catch(() => {});
        }
      };
      vid.onloadeddata = () => {
        // Automatically generate a thumbnail from the loaded video if not custom uploaded
        setVideoThumbnailSource((prevSource) => {
          if (prevSource === 'auto') {
            const autoThumb = captureVideoElementThumbnail(vid, {
              fallbackTitle: activeTitle || 'Video Clip',
            });
            if (autoThumb) {
              setCurrentVideoThumbnailUrl(autoThumb);
            }
          }
          return prevSource;
        });
      };
      vid.ontimeupdate = () => {
        setVideoCurrentTime(vid.currentTime || 0);
      };
    }
  }, [isOpen, activeMediaType, activeMediaUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    const snap = history[prevIdx];
    if (!snap) return;
    setAdjustments(snap.adjustments);
    setFocusConfig(snap.focusConfig);
    setCropConfig(snap.cropConfig || DEFAULT_CROP);
    setSelectedFilterId(snap.selectedFilterId);
    setOverlays(snap.overlays);
    setBrushStrokes(snap.brushStrokes);
    setHistoryIndex(prevIdx);
    showToast('↶ Undid last edit');
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    const snap = history[nextIdx];
    if (!snap) return;
    setAdjustments(snap.adjustments);
    setFocusConfig(snap.focusConfig);
    setCropConfig(snap.cropConfig || DEFAULT_CROP);
    setSelectedFilterId(snap.selectedFilterId);
    setOverlays(snap.overlays);
    setBrushStrokes(snap.brushStrokes);
    setHistoryIndex(nextIdx);
    showToast('↷ Redid edit');
  };

  // Build combined CSS filter from 64-filter preset + 11 fine-tuning adjustment sliders
  const buildCombinedFilterString = useCallback(() => {
    const preset =
      SIXTY_PLUS_FILTERS.find((f) => f.id === selectedFilterId) || SIXTY_PLUS_FILTERS[0];
    const baseFilter = preset.cssFilter === 'none' ? '' : preset.cssFilter;

    const b = 1 + adjustments.brightness / 100 + adjustments.exposure / 130;
    const c = 1 + adjustments.contrast / 100 + adjustments.sharpness / 220 - adjustments.fade / 220;
    const s = Math.max(0, 1 + adjustments.saturation / 100);
    const sep = Math.max(0, adjustments.warmth / 150 + adjustments.fade / 300);
    const hueDeg = adjustments.hue + (adjustments.warmth < 0 ? adjustments.warmth * 0.25 : 0);

    const adjString = `brightness(${b.toFixed(2)}) contrast(${c.toFixed(2)}) saturate(${s.toFixed(
      2
    )}) sepia(${sep.toFixed(2)}) hue-rotate(${Math.round(hueDeg)}deg)`;

    return `${baseFilter} ${adjString}`.trim();
  }, [selectedFilterId, adjustments]);

  // Draw the 3D Pink Cowboy Hat with White Flower from screenshot 36.jpg
  const drawPinkCowboyHat = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number,
    rotDeg: number
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotDeg * Math.PI) / 180);
    ctx.scale(scale, scale);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    // Back brim
    const brimGrad = ctx.createLinearGradient(-150, -20, 150, 45);
    brimGrad.addColorStop(0, '#A82868');
    brimGrad.addColorStop(0.5, '#D6458B');
    brimGrad.addColorStop(1, '#B83072');

    // Crown of cowboy hat (two western peaks)
    const crownGrad = ctx.createLinearGradient(0, -105, 0, 15);
    crownGrad.addColorStop(0, '#C83B80');
    crownGrad.addColorStop(0.55, '#9E2460');
    crownGrad.addColorStop(1, '#7A1848');
    ctx.fillStyle = crownGrad;
    ctx.beginPath();
    ctx.moveTo(-78, 10);
    ctx.bezierCurveTo(-85, -65, -45, -108, -14, -82);
    ctx.bezierCurveTo(0, -70, 12, -105, 36, -85);
    ctx.bezierCurveTo(68, -60, 75, -10, 78, 12);
    ctx.closePath();
    ctx.fill();

    // Hatband ribbon
    ctx.fillStyle = '#7C1547';
    ctx.beginPath();
    ctx.roundRect(-74, -4, 148, 16, 8);
    ctx.fill();

    // Sweeping front & side western brim
    ctx.fillStyle = brimGrad;
    ctx.beginPath();
    ctx.moveTo(-148, 18);
    ctx.bezierCurveTo(-155, -26, -65, -24, 0, 8);
    ctx.bezierCurveTo(65, -36, 158, -32, 148, 18);
    ctx.bezierCurveTo(132, 54, 45, 42, 0, 32);
    ctx.bezierCurveTo(-48, 42, -135, 50, -148, 18);
    ctx.closePath();
    ctx.fill();

    // White 6-petal daisy flower on hatband (matching 36.jpg)
    const fx = 42;
    const fy = -8;
    ctx.shadowBlur = 4;
    for (let p = 0; p < 6; p++) {
      const a = (p * Math.PI) / 3;
      ctx.save();
      ctx.translate(fx + Math.cos(a) * 11, fy + Math.sin(a) * 11);
      ctx.rotate(a);
      ctx.fillStyle = '#FFF5FA';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#FBCFE8';
    ctx.beginPath();
    ctx.arc(fx, fy, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Draw the Flip-Clock "00 44" Timestamp Sticker from Screenshot_20210725_004432.jpg
  const drawFlipClockSticker = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number,
    rotDeg: number,
    label = '00 44'
  ) => {
    const parts = label.trim().split(/\s+/);
    const leftText = parts[0] || '00';
    const rightText = parts[1] || '44';

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotDeg * Math.PI) / 180);
    ctx.scale(scale, scale);

    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10;

    // Two gray rounded flip-clock cards side by side
    [
      { x: -50, val: leftText },
      { x: 6, val: rightText },
    ].forEach((card) => {
      ctx.fillStyle = 'rgba(115, 118, 124, 0.88)';
      ctx.beginPath();
      ctx.roundRect(card.x, -26, 46, 52, 6);
      ctx.fill();

      // Subtle horizontal flip-clock split line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(card.x, 0);
      ctx.lineTo(card.x + 46, 0);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.val, card.x + 23, 1);
    });

    ctx.restore();
  };

  // Main Canvas Render Function
  const renderCanvasScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    // Dark studio letterbox backdrop
    ctx.fillStyle = '#0D0E11';
    ctx.fillRect(0, 0, cw, ch);

    const combinedFilter = buildCombinedFilterString();
    const activePreset =
      SIXTY_PLUS_FILTERS.find((f) => f.id === selectedFilterId) || SIXTY_PLUS_FILTERS[0];

    // 1. Draw Base Photo or Video Frame (with Smart Crop Aspect Ratio & Zoom Framing)
    ctx.save();
    let cropBox = { x: 0, y: 0, w: cw, h: ch };
    if (cropConfig.aspectRatio !== 'original') {
      const targetRatio =
        cropConfig.aspectRatio === '1:1'
          ? 1
          : cropConfig.aspectRatio === '4:5'
          ? 4 / 5
          : cropConfig.aspectRatio === '16:9'
          ? 16 / 9
          : 9 / 16;
      if (cw / ch > targetRatio) {
        const h = ch * 0.92;
        const w = h * targetRatio;
        cropBox = { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
      } else {
        const w = cw * 0.92;
        const h = w / targetRatio;
        cropBox = { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
      }
      ctx.beginPath();
      ctx.roundRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h, 8);
      ctx.clip();
    }

    try {
      ctx.filter = combinedFilter || 'none';
    } catch {}

    let mediaDrawn = false;
    let drawRect = { dx: cropBox.x, dy: cropBox.y, dw: cropBox.w, dh: cropBox.h };
    const zoom = Math.max(1, cropConfig.zoomScale || 1);
    const panX = (cropConfig.offsetX || 0) * cw;
    const panY = (cropConfig.offsetY || 0) * ch;

    if (activeMediaType === 'video' && videoRef.current && videoRef.current.readyState >= 2) {
      const vid = videoRef.current;
      const vw = vid.videoWidth || 640;
      const vh = vid.videoHeight || 480;
      const baseScale =
        cropConfig.aspectRatio === 'original'
          ? Math.min(cw / vw, ch / vh)
          : Math.max(cropBox.w / vw, cropBox.h / vh);
      const dw = vw * baseScale * zoom;
      const dh = vh * baseScale * zoom;
      const dx = (cw - dw) / 2 + panX;
      const dy = (ch - dh) / 2 + panY;
      drawRect =
        cropConfig.aspectRatio === 'original'
          ? { dx, dy, dw, dh }
          : { dx: cropBox.x, dy: cropBox.y, dw: cropBox.w, dh: cropBox.h };
      try {
        ctx.drawImage(vid, dx, dy, dw, dh);
        mediaDrawn = true;
      } catch {}
    }

    if (!mediaDrawn && imageRef.current) {
      const img = imageRef.current;
      const iw = img.naturalWidth || img.width || 640;
      const ih = img.naturalHeight || img.height || 640;
      const baseScale =
        cropConfig.aspectRatio === 'original'
          ? Math.min(cw / iw, ch / ih)
          : Math.max(cropBox.w / iw, cropBox.h / ih);
      const dw = iw * baseScale * zoom;
      const dh = ih * baseScale * zoom;
      const dx = (cw - dw) / 2 + panX;
      const dy = (ch - dh) / 2 + panY;
      drawRect =
        cropConfig.aspectRatio === 'original'
          ? { dx, dy, dw, dh }
          : { dx: cropBox.x, dy: cropBox.y, dw: cropBox.w, dh: cropBox.h };
      try {
        ctx.drawImage(img, dx, dy, dw, dh);
        mediaDrawn = true;
      } catch {}
    }
    ctx.restore();

    // Subtle crop frame border if cropped
    if (cropConfig.aspectRatio !== 'original') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
      ctx.restore();
    }

    // 2. Apply Filter Tint Color & Warmth/Highlights/Shadows Overlays
    if (activePreset.tintColor) {
      ctx.save();
      ctx.fillStyle = activePreset.tintColor;
      ctx.fillRect(drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh);
      ctx.restore();
    }

    if (adjustments.warmth !== 0) {
      ctx.save();
      ctx.fillStyle =
        adjustments.warmth > 0
          ? `rgba(255, 160, 50, ${(adjustments.warmth / 100) * 0.22})`
          : `rgba(60, 150, 255, ${(Math.abs(adjustments.warmth) / 100) * 0.22})`;
      ctx.fillRect(drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh);
      ctx.restore();
    }

    if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
      ctx.save();
      if (adjustments.highlights > 0) {
        ctx.fillStyle = `rgba(255,255,255,${(adjustments.highlights / 100) * 0.14})`;
        ctx.fillRect(drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh);
      }
      if (adjustments.shadows < 0) {
        ctx.fillStyle = `rgba(0,0,0,${(Math.abs(adjustments.shadows) / 100) * 0.22})`;
        ctx.fillRect(drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh);
      }
      ctx.restore();
    }

    // 3. Apply Focus / Tilt-Shift Depth of Field (Focus droplet tool)
    if (focusConfig.mode !== 'none' && focusConfig.intensity > 0) {
      ctx.save();
      const alpha = (focusConfig.intensity / 100) * 0.55;
      const rPx = (focusConfig.radius / 100) * Math.min(cw, ch) * 0.65;
      const fGrad = ctx.createRadialGradient(cw / 2, ch / 2, rPx * 0.5, cw / 2, ch / 2, cw * 0.72);
      if (focusConfig.mode === 'portrait_bokeh') {
        fGrad.addColorStop(0, 'rgba(255,255,255,0)');
        fGrad.addColorStop(1, `rgba(20, 24, 38, ${alpha})`);
      } else {
        fGrad.addColorStop(0, 'rgba(255,255,255,0)');
        fGrad.addColorStop(1, `rgba(235, 240, 255, ${alpha * 0.65})`);
      }
      ctx.fillStyle = fGrad;
      ctx.fillRect(drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh);
      ctx.restore();
    }

    // 4. Apply Vignette Slider
    if (adjustments.vignette > 0) {
      ctx.save();
      const vGrad = ctx.createRadialGradient(
        cw / 2,
        ch / 2,
        cw * 0.25,
        cw / 2,
        ch / 2,
        cw * 0.72
      );
      vGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, `rgba(0,0,0,${(adjustments.vignette / 100) * 0.78})`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh);
      ctx.restore();
    }

    // 5. Draw Freehand Brush Strokes (36.jpg marker tool)
    brushStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.style === 'neon') {
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.size * 1.8;
      } else if (stroke.style === 'dashed') {
        ctx.setLineDash([stroke.size * 2, stroke.size * 1.4]);
      }
      ctx.beginPath();
      stroke.points.forEach((pt, idx) => {
        const px = pt.x * cw;
        const py = pt.y * ch;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();
    });

    // 6. Draw Stickers, Text, and Text Design Overlays
    overlays.forEach((ov) => {
      const cx = ov.x * cw;
      const cy = ov.y * ch;
      const isSelected = ov.id === selectedOverlayId;

      if (ov.kind === 'sticker' && ov.stickerDef) {
        const def = ov.stickerDef;
        if (def.renderType === 'special_cowboy_hat') {
          drawPinkCowboyHat(ctx, cx, cy, ov.scale, ov.rotationDeg);
        } else if (def.renderType === 'special_flip_clock') {
          drawFlipClockSticker(ctx, cx, cy, ov.scale, ov.rotationDeg, def.content);
        } else if (def.renderType === 'emoji') {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((ov.rotationDeg * Math.PI) / 180);
          ctx.font = `${Math.round(68 * ov.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 10;
          ctx.fillText(def.content, 0, 0);
          ctx.restore();
        } else if (def.renderType === 'shape_badge') {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((ov.rotationDeg * Math.PI) / 180);
          ctx.scale(ov.scale, ov.scale);
          ctx.font = '900 22px sans-serif';
          const textW = ctx.measureText(def.content).width;
          const padX = 20;
          const boxW = textW + padX * 2;
          const boxH = 44;
          ctx.shadowColor = 'rgba(0,0,0,0.45)';
          ctx.shadowBlur = 12;
          ctx.fillStyle = def.bgColor || '#EC4899';
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 22);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.fillStyle = def.textColor || '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(def.content, 0, 1);
          ctx.restore();
        } else if (def.renderType === 'image_url') {
          let cachedImg = loadedStickerImagesRef.current[def.content];
          if (!cachedImg) {
            cachedImg = new Image();
            cachedImg.src = def.content;
            loadedStickerImagesRef.current[def.content] = cachedImg;
          }
          if (cachedImg.complete && cachedImg.naturalWidth > 0) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((ov.rotationDeg * Math.PI) / 180);
            const size = 110 * ov.scale;
            const ratio = cachedImg.naturalWidth / cachedImg.naturalHeight;
            ctx.drawImage(cachedImg, -size * ratio * 0.5, -size * 0.5, size * ratio, size);
            ctx.restore();
          }
        }
      } else if (ov.kind === 'text' || ov.kind === 'text_design') {
        const tpl =
          TEXT_DESIGN_TEMPLATES.find((t) => t.id === ov.templateId) || TEXT_DESIGN_TEMPLATES[0];
        if (tpl.boxStyle === 'flip_clock') {
          drawFlipClockSticker(ctx, cx, cy, ov.scale, ov.rotationDeg, ov.text || '00 44');
        } else {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((ov.rotationDeg * Math.PI) / 180);
          ctx.scale(ov.scale, ov.scale);

          const rawText = `${tpl.decorativePrefix || ''}${ov.text || 'My cat'}${
            tpl.decorativeSuffix || ''
          }`;
          const formattedText =
            tpl.textTransform === 'uppercase'
              ? rawText.toUpperCase()
              : tpl.textTransform === 'lowercase'
              ? rawText.toLowerCase()
              : rawText;

          const fontSize = ov.kind === 'text_design' ? 38 : 34;
          ctx.font = `${tpl.fontWeight} ${fontSize}px ${ov.fontFamily || tpl.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const metrics = ctx.measureText(formattedText);
          const boxW = metrics.width + 36;
          const boxH = fontSize + 24;

          if (tpl.boxStyle === 'solid_pill' || tpl.boxStyle === 'glass_banner') {
            ctx.fillStyle = ov.bgColor && ov.bgColor !== 'transparent' ? ov.bgColor : tpl.defaultBgColor;
            ctx.beginPath();
            ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 14);
            ctx.fill();
          } else if (tpl.boxStyle === 'neon_outline') {
            ctx.shadowColor = ov.color || tpl.defaultColor;
            ctx.shadowBlur = 18;
            ctx.strokeStyle = ov.color || tpl.defaultColor;
            ctx.lineWidth = 2.5;
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.beginPath();
            ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
            ctx.fill();
            ctx.stroke();
          } else if (tpl.boxStyle === 'editorial_frame' || tpl.boxStyle === 'stamp_badge') {
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
            ctx.strokeStyle = ov.color || tpl.defaultColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(-boxW / 2 + 4, -boxH / 2 + 4, boxW - 8, boxH - 8);
          } else if (tpl.boxStyle === 'shadow_pop') {
            ctx.fillStyle = '#0F172A';
            ctx.fillText(formattedText, 4, 4);
          }

          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = ov.color || tpl.defaultColor;
          ctx.fillText(formattedText, 0, 0);
          ctx.restore();
        }
      }

      // Draw selection ring if currently selected
      if (isSelected) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((ov.rotationDeg * Math.PI) / 180);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        const ringW = 140 * ov.scale;
        const ringH = 68 * ov.scale;
        ctx.strokeRect(-ringW / 2, -ringH / 2, ringW, ringH);
        ctx.restore();
      }
    });
  }, [
    activeMediaType,
    buildCombinedFilterString,
    selectedFilterId,
    adjustments,
    focusConfig,
    cropConfig,
    brushStrokes,
    overlays,
    selectedOverlayId,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const loop = () => {
      renderCanvasScene();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, renderCanvasScene]);

  // Add a Text or Text Design Overlay onto the Canvas
  const handleAddTextOverlay = (kind: 'text' | 'text_design', overrideTemplateId?: string) => {
    const cleanText = textInputDraft.trim() || 'My cat';
    const tplId = overrideTemplateId || selectedTemplateId;
    const tpl = TEXT_DESIGN_TEMPLATES.find((t) => t.id === tplId) || TEXT_DESIGN_TEMPLATES[0];

    const newOverlay: CanvasOverlayElement = {
      id: `ov-text-${Date.now()}`,
      kind,
      x: 0.58,
      y: 0.58,
      scale: 1.05,
      rotationDeg: tpl.defaultTiltDeg,
      text: cleanText,
      color: selectedTextColor || tpl.defaultColor,
      bgColor: tpl.defaultBgColor,
      fontFamily: tpl.fontFamily,
      templateId: tpl.id,
    };

    const nextOverlays = [...overlays, newOverlay];
    setOverlays(nextOverlays);
    setSelectedOverlayId(newOverlay.id);
    pushHistorySnapshot({ overlays: nextOverlays });
    showToast(`Added "${cleanText}" (${tpl.name})`);
  };

  // Text Design Randomizer / Shuffle Function (explicitly requested by user!)
  const handleShuffleTextDesign = () => {
    const randomTpl =
      TEXT_DESIGN_TEMPLATES[Math.floor(Math.random() * TEXT_DESIGN_TEMPLATES.length)];
    const randomColor =
      EDITOR_COLOR_PALETTE[Math.floor(Math.random() * EDITOR_COLOR_PALETTE.length)];
    const randomTilt = Math.floor((Math.random() - 0.5) * 24);

    setSelectedTemplateId(randomTpl.id);
    setSelectedTextColor(randomColor);

    if (selectedOverlayId) {
      const target = overlays.find((o) => o.id === selectedOverlayId);
      if (target && (target.kind === 'text' || target.kind === 'text_design')) {
        const updated = overlays.map((o) =>
          o.id === selectedOverlayId
            ? {
                ...o,
                kind: 'text_design' as const,
                templateId: randomTpl.id,
                fontFamily: randomTpl.fontFamily,
                color: randomColor,
                bgColor: randomTpl.defaultBgColor,
                rotationDeg: randomTilt,
              }
            : o
        );
        setOverlays(updated);
        pushHistorySnapshot({ overlays: updated });
        showToast(`🎲 Shuffled Text Design: ${randomTpl.name}!`);
        return;
      }
    }

    // If no text layer selected yet, create one with the randomized typography
    const newOverlay: CanvasOverlayElement = {
      id: `ov-td-${Date.now()}`,
      kind: 'text_design',
      x: 0.5,
      y: 0.55,
      scale: 1.1,
      rotationDeg: randomTilt,
      text: textInputDraft.trim() || 'My cat',
      color: randomColor,
      bgColor: randomTpl.defaultBgColor,
      fontFamily: randomTpl.fontFamily,
      templateId: randomTpl.id,
    };
    const nextOverlays = [...overlays, newOverlay];
    setOverlays(nextOverlays);
    setSelectedOverlayId(newOverlay.id);
    pushHistorySnapshot({ overlays: nextOverlays });
    showToast(`🎲 Randomized Text Design: ${randomTpl.name}!`);
  };

  // Add Sticker to Canvas
  const handleAddStickerOverlay = (sticker: EditorStickerDefinition) => {
    const isHat = sticker.renderType === 'special_cowboy_hat';
    const isClock = sticker.renderType === 'special_flip_clock';
    const newOverlay: CanvasOverlayElement = {
      id: `ov-stk-${Date.now()}`,
      kind: 'sticker',
      x: isHat ? 0.54 : isClock ? 0.22 : 0.5,
      y: isHat ? 0.18 : isClock ? 0.26 : 0.48,
      scale: 1,
      rotationDeg: isClock ? -18 : 0,
      stickerDef: sticker,
    };
    const nextOverlays = [...overlays, newOverlay];
    setOverlays(nextOverlays);
    setSelectedOverlayId(newOverlay.id);
    pushHistorySnapshot({ overlays: nextOverlays });
    showToast(`Added sticker: ${sticker.name}`);
  };

  // Upload Own Custom Sticker Design from Device
  const handleUploadCustomStickerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      const customDef: EditorStickerDefinition = {
        id: `custom-stk-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, '') || 'My Sticker',
        category: 'custom',
        renderType: 'image_url',
        content: dataUrl,
      };
      const updatedCustom = addCustomEditorSticker(customDef);
      setCustomStickers(updatedCustom);
      setActiveStickerCat('custom');
      handleAddStickerOverlay(customDef);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Create Own Custom Badge Sticker
  const handleCreateCustomBadgeSticker = () => {
    const label = customStickerTextDraft.trim();
    if (!label) return;
    const customDef: EditorStickerDefinition = {
      id: `custom-badge-${Date.now()}`,
      name: label,
      category: 'custom',
      renderType: 'shape_badge',
      content: label,
      bgColor: selectedTextColor || '#EC4899',
      textColor: '#FFFFFF',
    };
    const updatedCustom = addCustomEditorSticker(customDef);
    setCustomStickers(updatedCustom);
    setCustomStickerTextDraft('');
    handleAddStickerOverlay(customDef);
  };

  // Floating "AI Magic Fix" Handler — analyzes visual content of the media via Gemini API
  // and suggests Color Adjustments, Crop Framing, and Filter Enhancements
  const handleRunAiMagicFix = async () => {
    setIsMagicFixRunning(true);
    try {
      // Sample current media frame from canvas so Gemini visually inspects the photo or video frame
      let frameBase64 = '';
      if (canvasRef.current) {
        try {
          frameBase64 = canvasRef.current.toDataURL('image/jpeg', 0.65);
        } catch {
          frameBase64 = '';
        }
      }

      const resp = await fetch('/api/ai-media-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai_magic_fix',
          prompt: aiPrompt,
          mediaType: activeMediaType,
          mediaTitle: activeTitle,
          imageBase64: frameBase64,
        }),
      });
      const data = await resp.json();
      const res = data?.result;

      if (res) {
        const validRatios: CropAspectRatio[] = ['original', '1:1', '4:5', '16:9', '9:16'];
        const rawRatio = res.cropSuggestion?.aspectRatio;
        const resolvedRatio: CropAspectRatio = validRatios.includes(rawRatio)
          ? rawRatio
          : '4:5';

        const primaryFilter = SIXTY_PLUS_FILTERS.some(
          (f) => f.id === res.filterEnhancements?.primaryFilterId
        )
          ? res.filterEnhancements.primaryFilterId
          : 'golden_hour';

        const altFilters: string[] = Array.isArray(res.filterEnhancements?.alternativeFilterIds)
          ? res.filterEnhancements.alternativeFilterIds.filter((fid: string) =>
              SIXTY_PLUS_FILTERS.some((f) => f.id === fid)
            )
          : ['soft_glam', 'kodak_portra', 'vivid_pop'];

        const suggestion: AiMagicFixSuggestion = {
          visualAnalysis:
            res.visualAnalysis ||
            'Gemini analyzed your media lighting, subject framing, and color balance.',
          colorAdjustments: {
            brightness: Number(res.colorAdjustments?.brightness ?? 10),
            contrast: Number(res.colorAdjustments?.contrast ?? 18),
            saturation: Number(res.colorAdjustments?.saturation ?? 16),
            warmth: Number(res.colorAdjustments?.warmth ?? 12),
            exposure: Number(res.colorAdjustments?.exposure ?? 6),
            highlights: Number(res.colorAdjustments?.highlights ?? -8),
            shadows: Number(res.colorAdjustments?.shadows ?? 14),
            sharpness: Number(res.colorAdjustments?.sharpness ?? 26),
            vignette: Number(res.colorAdjustments?.vignette ?? 12),
            rationale:
              res.colorAdjustments?.rationale ||
              'Balanced dynamic range, lifted shadows, and enriched natural color vibrance.',
          },
          cropSuggestion: {
            aspectRatio: resolvedRatio,
            zoomScale: Number(res.cropSuggestion?.zoomScale ?? 1.12),
            focusOffsetX: Number(res.cropSuggestion?.focusOffsetX ?? 0),
            focusOffsetY: Number(res.cropSuggestion?.focusOffsetY ?? -0.02),
            label:
              res.cropSuggestion?.label ||
              `${resolvedRatio.toUpperCase()} Smart Subject Crop (${Number(
                res.cropSuggestion?.zoomScale ?? 1.12
              ).toFixed(2)}x)`,
            rationale:
              res.cropSuggestion?.rationale ||
              'Tightens framing around the focal subject using rule-of-thirds composition.',
          },
          filterEnhancements: {
            primaryFilterId: primaryFilter,
            alternativeFilterIds: altFilters.length > 0 ? altFilters : ['soft_glam', 'kodak_portra'],
            rationale:
              res.filterEnhancements?.rationale ||
              'Applies cinematic color grading matched to scene lighting.',
          },
        };

        const nextAdj: EditorAdjustments = {
          ...adjustments,
          brightness: suggestion.colorAdjustments.brightness,
          contrast: suggestion.colorAdjustments.contrast,
          saturation: suggestion.colorAdjustments.saturation,
          warmth: suggestion.colorAdjustments.warmth,
          exposure: suggestion.colorAdjustments.exposure,
          highlights: suggestion.colorAdjustments.highlights,
          shadows: suggestion.colorAdjustments.shadows,
          sharpness: suggestion.colorAdjustments.sharpness,
          vignette: suggestion.colorAdjustments.vignette,
        };

        const nextCrop: EditorCropConfig = {
          aspectRatio: suggestion.cropSuggestion.aspectRatio,
          zoomScale: suggestion.cropSuggestion.zoomScale,
          offsetX: suggestion.cropSuggestion.focusOffsetX,
          offsetY: suggestion.cropSuggestion.focusOffsetY,
        };

        setMagicFixSuggestion(suggestion);
        setIsMagicFixCardOpen(true);
        setAdjustments(nextAdj);
        setCropConfig(nextCrop);
        setSelectedFilterId(primaryFilter);
        pushHistorySnapshot({
          adjustments: nextAdj,
          cropConfig: nextCrop,
          selectedFilterId: primaryFilter,
        });
        showToast('✨ AI Magic Fix applied Color, Crop & Filter suggestions!');
      }
    } catch {
      showToast('✨ Applied AI Magic Fix enhancements!');
    } finally {
      setIsMagicFixRunning(false);
    }
  };

  // AI Studio Tools Handler (/api/ai-media-editor)
  const handleRunAiTool = async (action: 'auto_enhance' | 'magic_text' | 'ai_sticker') => {
    setIsAiLoading(true);
    try {
      const resp = await fetch('/api/ai-media-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          prompt: aiPrompt,
          mediaType: activeMediaType,
          mediaTitle: activeTitle,
        }),
      });
      const data = await resp.json();
      const res = data?.result;

      if (action === 'auto_enhance' && res) {
        const nextAdj: EditorAdjustments = {
          ...adjustments,
          brightness: Number(res.brightness ?? 8),
          contrast: Number(res.contrast ?? 16),
          saturation: Number(res.saturation ?? 18),
          warmth: Number(res.warmth ?? 10),
          sharpness: Number(res.sharpness ?? 24),
          vignette: Number(res.vignette ?? 14),
        };
        const recFilter = SIXTY_PLUS_FILTERS.some((f) => f.id === res.recommendedFilterId)
          ? res.recommendedFilterId
          : 'golden_hour';
        setAdjustments(nextAdj);
        setSelectedFilterId(recFilter);
        pushHistorySnapshot({ adjustments: nextAdj, selectedFilterId: recFilter });
        showToast(`✨ ${res.summary || 'AI Auto-Enhance applied!'}`);
      } else if (action === 'magic_text' && res) {
        const phrases: string[] = Array.isArray(res.phrases)
          ? res.phrases
          : ['✨ Pure Aesthetic ✨', 'Good Vibes Only', 'Living the Moment'];
        setAiSuggestions(phrases);
        if (phrases[0]) {
          setTextInputDraft(phrases[0]);
        }
        showToast('✨ AI generated creative typography ideas!');
      } else if (action === 'ai_sticker' && res) {
        const aiSticker: EditorStickerDefinition = {
          id: `ai-stk-${Date.now()}`,
          name: res.label || 'AI Sticker',
          category: 'custom',
          renderType: 'shape_badge',
          content: `${res.emoji || '✨'} ${res.label || 'AI VIBES'}`,
          bgColor: res.bgColor || '#EC4899',
          textColor: res.textColor || '#FFFFFF',
        };
        const updatedCustom = addCustomEditorSticker(aiSticker);
        setCustomStickers(updatedCustom);
        handleAddStickerOverlay(aiSticker);
      }
    } catch {
      showToast('Applied smart AI preset!');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Canvas Pointer Events for dragging stickers/text or drawing with brush
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    if (activeTool === 'brush') {
      setIsDrawingStroke(true);
      const newStroke: BrushStrokePath = {
        id: `stroke-${Date.now()}`,
        color: brushColor,
        size: brushSize,
        style: brushStyle,
        points: [{ x: nx, y: ny }],
      };
      setBrushStrokes((prev) => [...prev, newStroke]);
      return;
    }

    // Check if user tapped on an existing overlay (reverse order for top-most first)
    for (let i = overlays.length - 1; i >= 0; i--) {
      const ov = overlays[i];
      const dist = Math.hypot(nx - ov.x, ny - ov.y);
      if (dist < 0.16 * ov.scale) {
        setSelectedOverlayId(ov.id);
        setDraggingOverlayId(ov.id);
        if (ov.text) setTextInputDraft(ov.text);
        return;
      }
    }

    setSelectedOverlayId(null);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(0.04, Math.min(0.96, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0.04, Math.min(0.96, (e.clientY - rect.top) / rect.height));

    if (activeTool === 'brush' && isDrawingStroke) {
      setBrushStrokes((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const updatedLast = { ...last, points: [...last.points, { x: nx, y: ny }] };
        return [...prev.slice(0, -1), updatedLast];
      });
      return;
    }

    if (draggingOverlayId) {
      setOverlays((prev) =>
        prev.map((ov) => (ov.id === draggingOverlayId ? { ...ov, x: nx, y: ny } : ov))
      );
    }
  };

  const handleCanvasPointerUp = () => {
    if (isDrawingStroke) {
      setIsDrawingStroke(false);
      pushHistorySnapshot({ brushStrokes });
    }
    if (draggingOverlayId) {
      setDraggingOverlayId(null);
      pushHistorySnapshot({ overlays });
    }
  };

  // Export & Save Edited Photo or Video Frame
  const handleSaveAndExport = (alsoDownload = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Temporarily hide selection box before exporting
    const prevSelected = selectedOverlayId;
    setSelectedOverlayId(null);

    setTimeout(() => {
      renderCanvasScene();
      let dataUrl = '';
      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      } catch {
        dataUrl = activeMediaUrl;
      }

      if (alsoDownload && dataUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `edited-${activeMediaType}-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      const resolvedThumb =
        activeMediaType === 'video'
          ? videoThumbnailSource === 'uploaded' && currentVideoThumbnailUrl
            ? currentVideoThumbnailUrl
            : dataUrl || currentVideoThumbnailUrl || thumbnailUrl || activeMediaUrl
          : dataUrl || thumbnailUrl || activeMediaUrl;

      if (onSaveEditedMedia) {
        onSaveEditedMedia({
          mediaId,
          mediaType: activeMediaType,
          editedDataUrl: activeMediaType === 'image' ? dataUrl : activeMediaUrl,
          thumbnailUrl: resolvedThumb,
          title: activeTitle,
        });
      }

      setSelectedOverlayId(prevSelected);
      showToast(
        alsoDownload
          ? '✅ Saved to User Gallery & downloaded!'
          : '✅ Saved edited creative to User Gallery!'
      );
      setTimeout(() => {
        onClose();
      }, 450);
    }, 40);
  };

  // Capture current edited canvas frame and open Share to Friends & Groups Modal
  const handleOpenEditorShareModal = () => {
    const canvas = canvasRef.current;
    const prevSelected = selectedOverlayId;
    setSelectedOverlayId(null);

    setTimeout(() => {
      renderCanvasScene();
      let dataUrl = activeMediaUrl;
      if (canvas) {
        try {
          dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        } catch {
          dataUrl = activeMediaUrl;
        }
      }
      setSelectedOverlayId(prevSelected);
      setSharePreviewDataUrl(dataUrl);
      setIsShareEditorModalOpen(true);
    }, 30);
  };

  // Available Friends & Groups for sharing edited photos/videos
  const availableShareRecipients = React.useMemo(() => {
    const defaults = [
      {
        id: 'user_kristin',
        name: 'Kristin Watson',
        avatar: '/kristin_avatar.jpg',
        isGroup: false,
        subtitle: 'Friend • Spanish',
      },
      {
        id: 'user_jenny',
        name: 'Jenny Wilson',
        avatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        isGroup: false,
        subtitle: 'Friend • French',
      },
      {
        id: 'user_jacob',
        name: 'Jacob Jones',
        avatar:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        isGroup: false,
        subtitle: 'Friend • German',
      },
      {
        id: 'group_global_team',
        name: 'Global Multilingual Group',
        avatar:
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
        isGroup: true,
        subtitle: 'Group • 4 Members',
      },
      {
        id: 'group_creative_studio',
        name: 'Creative Photo & Video Studio Group',
        avatar:
          'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&auto=format&fit=crop&q=80',
        isGroup: true,
        subtitle: 'Group • Creators',
      },
    ];

    try {
      const cachedRaw = localStorage.getItem('freedom_cached_contacts_v1');
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (Array.isArray(cached) && cached.length > 0) {
          const map = new Map<
            string,
            { id: string; name: string; avatar: string; isGroup: boolean; subtitle: string }
          >();
          cached.forEach((c: any) => {
            if (!c || !c.id) return;
            const isGrp = Boolean(c.isGroup || c.entityType === 'group');
            map.set(c.id, {
              id: c.id,
              name: c.name || 'Friend',
              avatar: c.avatar || '/kristin_avatar.jpg',
              isGroup: isGrp,
              subtitle: isGrp ? 'Group Chat' : `Friend • ${c.nativeLanguage || 'English'}`,
            });
          });
          defaults.forEach((d) => {
            if (!map.has(d.id)) map.set(d.id, d);
          });
          return Array.from(map.values());
        }
      }
    } catch {}
    return defaults;
  }, [isShareEditorModalOpen]);

  const filteredShareRecipients = availableShareRecipients.filter((r) => {
    if (shareRecipientTab === 'friends') return !r.isGroup;
    if (shareRecipientTab === 'groups') return r.isGroup;
    return true;
  });

  // Send Edited Photo/Video + Message to Selected Friends & Groups
  const handleConfirmSendToFriendsAndGroups = () => {
    if (selectedShareRecipientIds.length === 0) return;
    const finalDataUrl = sharePreviewDataUrl || activeMediaUrl;
    const chosenRecipients = availableShareRecipients.filter((r) =>
      selectedShareRecipientIds.includes(r.id)
    );
    const chosenNames = chosenRecipients.map((r) => r.name);

    // 1. Save the edited creative into the user's gallery
    if (onSaveEditedMedia) {
      onSaveEditedMedia({
        mediaId,
        mediaType: activeMediaType,
        editedDataUrl: activeMediaType === 'image' ? finalDataUrl : activeMediaUrl,
        thumbnailUrl: finalDataUrl || thumbnailUrl || activeMediaUrl,
        title: activeTitle,
      });
    }

    // 2. Dispatch event to App.tsx so the edited photo + message is added to each selected Friend & Group chat
    window.dispatchEvent(
      new CustomEvent('freedom-editor-share-media', {
        detail: {
          recipientIds: selectedShareRecipientIds,
          recipientNames: chosenNames,
          mediaType: activeMediaType,
          mediaUrl: activeMediaType === 'image' ? finalDataUrl : activeMediaUrl,
          thumbnailUrl: finalDataUrl || thumbnailUrl || activeMediaUrl,
          title: activeTitle || 'Edited Photo',
          messageText:
            shareMessageCaption.trim() ||
            `📸 Shared edited ${activeMediaType}: ${activeTitle || 'Studio Creative'}`,
        },
      })
    );

    setIsShareEditorModalOpen(false);
    showToast(`🚀 Sent edited ${activeMediaType} & message to ${chosenNames.join(', ')}!`);
  };

  if (!isOpen) return null;

  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId) || null;
  const filteredCategoryFilters = SIXTY_PLUS_FILTERS.filter(
    (f) => f.category === selectedFilterCategory
  );
  const displayedStickers =
    activeStickerCat === 'custom'
      ? customStickers
      : BUILTIN_EDITOR_STICKERS.filter((s) => s.category === activeStickerCat);

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      id="gallery-photo-video-editor-modal"
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 sm:p-2 select-none animate-in fade-in duration-150"
    >
      {/* Hidden <video> source element for real-time video frame decoding */}
      <video
        ref={videoRef}
        playsInline
        loop
        crossOrigin="anonymous"
        className="fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none"
      />

      {/* Hidden file inputs for uploading custom sticker or switching photo/video */}
      <input
        ref={customStickerFileRef}
        type="file"
        accept="image/*"
        onChange={handleUploadCustomStickerFile}
        className="hidden"
      />
      <input
        ref={replaceMediaFileRef}
        type="file"
        accept="image/*,video/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const isVid = file.type.startsWith('video');
          setIsGeneratingThumbnail(true);
          try {
            if (isVid) {
              const vidRes = await generateVideoFileThumbnail(file);
              setActiveMediaType('video');
              setActiveMediaUrl(vidRes.videoUrl);
              setActiveTitle(vidRes.title || 'Edited Video');
              setCurrentVideoThumbnailUrl(vidRes.thumbnailUrl);
              setVideoThumbnailSource('auto');
              showToast('🎬 Video loaded & thumbnail automatically generated!');
            } else {
              const imgRes = await generateProfileThumbnailFile(file, 320, 320, 960);
              setActiveMediaType('image');
              setActiveMediaUrl(imgRes.dataUrl);
              setActiveTitle(file.name.replace(/\.[^.]+$/, '') || 'Edited Creative');
              setCurrentVideoThumbnailUrl(imgRes.thumbnailDataUrl);
              setVideoThumbnailSource('auto');
              showToast('📸 Image loaded & thumbnail automatically generated!');
            }
          } finally {
            setIsGeneratingThumbnail(false);
          }
          e.target.value = '';
        }}
        className="hidden"
      />
      {/* Hidden file input for uploading a custom video thumbnail in Video Editor */}
      <input
        ref={videoThumbnailFileRef}
        id="video-editor-thumbnail-file-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setIsGeneratingThumbnail(true);
          try {
            const thumbRes = await generateProfileThumbnailFile(file, 640, 360, 960);
            setCurrentVideoThumbnailUrl(thumbRes.dataUrl);
            setVideoThumbnailSource('uploaded');
            // Also load into imageRef fallback so if video is paused or exported, the uploaded thumbnail is ready
            const uploadedImg = new Image();
            uploadedImg.onload = () => {
              imageRef.current = uploadedImg;
            };
            uploadedImg.src = thumbRes.dataUrl;
            if (onSaveEditedMedia) {
              onSaveEditedMedia({
                mediaId,
                mediaType: activeMediaType,
                editedDataUrl: activeMediaType === 'video' ? activeMediaUrl : thumbRes.dataUrl,
                thumbnailUrl: thumbRes.dataUrl,
                title: activeTitle,
              });
            }
            showToast('🖼️ Uploaded & applied current video thumbnail!');
          } catch {
            showToast('Failed to upload video thumbnail image');
          } finally {
            setIsGeneratingThumbnail(false);
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Main Dark Studio Container matching Screenshot_20210725_004432.jpg & 36.jpg */}
      <div className="relative w-full h-full sm:max-w-[430px] sm:max-h-[860px] sm:rounded-[30px] overflow-hidden bg-[#121212] text-white shadow-2xl border border-white/10 flex flex-col justify-between">
        {/* Top Quick Studio Bar (inspired by 36.jpg: TT, Marker, Filter Sparkle, Sticker Smiley, Upload Media + Photo/Video Switcher) */}
        <div className="px-3.5 py-2.5 bg-[#161616] border-b border-white/10 flex items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-bold tracking-wide text-white flex items-center gap-1.5">
              <span>{activeMediaType === 'video' ? '🎬 Video Editor' : '📸 Photo Editor'}</span>
            </span>
            <button
              type="button"
              onClick={() => replaceMediaFileRef.current?.click()}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/15 text-[10px] font-semibold text-white/80 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              title="Open another Photo or Video from device (auto-generates thumbnail)"
            >
              <ImageIcon className="w-3 h-3" />
              <span>Open Media</span>
            </button>
            <button
              id="video-editor-upload-thumbnail-top-btn"
              type="button"
              onClick={() => {
                setActiveTool('video_thumbnail');
                videoThumbnailFileRef.current?.click();
              }}
              className="px-2 py-1 rounded-md bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-[10px] font-bold text-purple-200 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              title="Upload custom image or capture current frame as Video Thumbnail"
            >
              <Upload className="w-3 h-3" />
              <span>Upload Thumbnail</span>
            </button>
          </div>

          {/* 36.jpg Top-Level Quick Icons: TT | Marker | Sparkle Frame | Smiley Sticker | Add Photo Sticker */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTool('text_design')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'text' || activeTool === 'text_design'
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:text-white'
              }`}
              title="Text & Typography Design (TT)"
            >
              <Type className="w-4 h-4 stroke-[2.4]" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('brush')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'brush' ? 'bg-white/20 text-pink-400' : 'text-white/80 hover:text-white'
              }`}
              title="Freehand Marker / Brush Tool"
            >
              <PenTool className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('filter')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'filter'
                  ? 'bg-white/20 text-amber-300'
                  : 'text-white/80 hover:text-white'
              }`}
              title="60+ Categorized Filter Library"
            >
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('sticker')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'sticker'
                  ? 'bg-white/20 text-pink-300'
                  : 'text-white/80 hover:text-white'
              }`}
              title="Stickers, Hats & Emoticons"
            >
              <Smile className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => customStickerFileRef.current?.click()}
              className="p-1.5 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Add Own Sticker Design from Device"
            >
              <ImageIcon className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Center Interactive Canvas Viewport */}
        <div className="relative flex-1 min-h-0 w-full bg-[#0D0E11] flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            width={640}
            height={640}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            className="w-full h-full object-contain touch-none cursor-crosshair"
          />

          {/* Floating Toast Notification */}
          {editorToast && (
            <div className="absolute top-3 left-3 z-30 max-w-[62%] px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold shadow-lg truncate animate-in fade-in duration-150">
              {editorToast}
            </div>
          )}

          {/* FLOATING "AI MAGIC FIX" BUTTON (Uses Gemini API to suggest Color Adjustments, Crops, and Filter Enhancements) */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
            {cropConfig.aspectRatio !== 'original' && (
              <button
                type="button"
                onClick={() => {
                  setCropConfig(DEFAULT_CROP);
                  pushHistorySnapshot({ cropConfig: DEFAULT_CROP });
                  showToast('Reset crop to Original');
                }}
                className="px-2.5 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-[10px] font-bold text-emerald-300 flex items-center gap-1 cursor-pointer shadow-lg"
                title="Click to reset crop"
              >
                <Crop className="w-3 h-3" />
                <span>{cropConfig.aspectRatio}</span>
              </button>
            )}
            <button
              id="editor-floating-ai-magic-fix-btn"
              type="button"
              disabled={isMagicFixRunning}
              onClick={handleRunAiMagicFix}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-[0_6px_20px_rgba(168,85,247,0.5)] border border-white/30 cursor-pointer transition-all"
              title="AI Magic Fix: Analyze visual content with Gemini API for smart Color, Crop & Filter enhancements"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isMagicFixRunning ? 'animate-spin' : ''}`} />
              <span>{isMagicFixRunning ? 'Analyzing...' : 'AI Magic Fix'}</span>
            </button>
          </div>

          {/* FLOATING AI MAGIC FIX SUGGESTIONS CARD (Color Adjustments, Crop Framing & Filter Enhancements) */}
          {isMagicFixCardOpen && magicFixSuggestion && (
            <div
              id="editor-ai-magic-fix-inspector"
              className="absolute inset-x-2.5 bottom-2.5 z-30 p-3 rounded-2xl bg-[#12131A]/95 backdrop-blur-xl border border-purple-500/40 text-white shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
                      <span>Gemini AI Magic Fix</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                        Visual Analysis
                      </span>
                    </h4>
                    <p className="text-[10px] text-white/75 leading-snug mt-0.5">
                      {magicFixSuggestion.visualAnalysis}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMagicFixCardOpen(false)}
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
                  title="Minimize AI Magic Fix panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 AI Suggestion Pillars: Color Adjustments | Smart Crop | Filter Enhancements */}
              <div className="grid grid-cols-1 gap-1.5 text-[10px]">
                {/* Pillar 1: Color Adjustments */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-purple-300 flex items-center gap-1">
                      <Sliders className="w-3 h-3" />
                      <span>Color Adjustments</span>
                    </div>
                    <p className="text-white/65 truncate text-[9px]">
                      {magicFixSuggestion.colorAdjustments.rationale}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextAdj: EditorAdjustments = {
                        ...adjustments,
                        brightness: magicFixSuggestion.colorAdjustments.brightness,
                        contrast: magicFixSuggestion.colorAdjustments.contrast,
                        saturation: magicFixSuggestion.colorAdjustments.saturation,
                        warmth: magicFixSuggestion.colorAdjustments.warmth,
                        exposure: magicFixSuggestion.colorAdjustments.exposure,
                        highlights: magicFixSuggestion.colorAdjustments.highlights,
                        shadows: magicFixSuggestion.colorAdjustments.shadows,
                        sharpness: magicFixSuggestion.colorAdjustments.sharpness,
                        vignette: magicFixSuggestion.colorAdjustments.vignette,
                      };
                      setAdjustments(nextAdj);
                      pushHistorySnapshot({ adjustments: nextAdj });
                      showToast('Applied Gemini Color Adjustments');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white font-bold shrink-0 cursor-pointer"
                  >
                    Apply Color
                  </button>
                </div>

                {/* Pillar 2: Smart Crop Suggestion & Aspect Ratio Pills */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-emerald-300 flex items-center gap-1">
                        <Crop className="w-3 h-3" />
                        <span>{magicFixSuggestion.cropSuggestion.label}</span>
                      </div>
                      <p className="text-white/65 truncate text-[9px]">
                        {magicFixSuggestion.cropSuggestion.rationale}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextCrop: EditorCropConfig = {
                          aspectRatio: magicFixSuggestion.cropSuggestion.aspectRatio,
                          zoomScale: magicFixSuggestion.cropSuggestion.zoomScale,
                          offsetX: magicFixSuggestion.cropSuggestion.focusOffsetX,
                          offsetY: magicFixSuggestion.cropSuggestion.focusOffsetY,
                        };
                        setCropConfig(nextCrop);
                        pushHistorySnapshot({ cropConfig: nextCrop });
                        showToast(`Applied ${magicFixSuggestion.cropSuggestion.label}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold shrink-0 cursor-pointer"
                    >
                      Apply Crop
                    </button>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {(['original', '1:1', '4:5', '16:9', '9:16'] as CropAspectRatio[]).map(
                      (ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => {
                            const nextCrop: EditorCropConfig = {
                              aspectRatio: ratio,
                              zoomScale:
                                ratio === 'original'
                                  ? 1
                                  : magicFixSuggestion.cropSuggestion.zoomScale,
                              offsetX:
                                ratio === 'original'
                                  ? 0
                                  : magicFixSuggestion.cropSuggestion.focusOffsetX,
                              offsetY:
                                ratio === 'original'
                                  ? 0
                                  : magicFixSuggestion.cropSuggestion.focusOffsetY,
                            };
                            setCropConfig(nextCrop);
                            pushHistorySnapshot({ cropConfig: nextCrop });
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                            cropConfig.aspectRatio === ratio
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-white/10 text-white/75 hover:bg-white/20'
                          }`}
                        >
                          {ratio === 'original' ? 'Original' : ratio}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Pillar 3: Filter Enhancements */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Suggested Filter Enhancements</span>
                    </span>
                    <span className="text-[9px] text-white/60 truncate max-w-[160px]">
                      {magicFixSuggestion.filterEnhancements.rationale}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {Array.from(
                      new Set([
                        magicFixSuggestion.filterEnhancements.primaryFilterId,
                        ...magicFixSuggestion.filterEnhancements.alternativeFilterIds,
                      ])
                    ).map((fid) => {
                      const fObj = SIXTY_PLUS_FILTERS.find((f) => f.id === fid);
                      if (!fObj) return null;
                      const isSel = selectedFilterId === fid;
                      return (
                        <button
                          key={fid}
                          type="button"
                          onClick={() => {
                            setSelectedFilterId(fid);
                            pushHistorySnapshot({ selectedFilterId: fid });
                            showToast(`Applied AI suggested filter: ${fObj.name}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer flex items-center gap-1 border ${
                            isSel
                              ? 'bg-amber-400 text-slate-950 border-amber-300'
                              : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                          }`}
                        >
                          <span>✨ {fObj.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Overlay Quick Transform Pill (Scale, Rotate, Delete) */}
          {selectedOverlay && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 flex items-center gap-2.5 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  const updated = overlays.map((o) =>
                    o.id === selectedOverlay.id
                      ? { ...o, scale: Math.max(0.4, +(o.scale - 0.15).toFixed(2)) }
                      : o
                  );
                  setOverlays(updated);
                }}
                className="p-1 text-white/85 hover:text-white cursor-pointer"
                title="Smaller"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = overlays.map((o) =>
                    o.id === selectedOverlay.id
                      ? { ...o, scale: Math.min(2.6, +(o.scale + 0.15).toFixed(2)) }
                      : o
                  );
                  setOverlays(updated);
                }}
                className="p-1 text-white/85 hover:text-white cursor-pointer"
                title="Larger"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = overlays.map((o) =>
                    o.id === selectedOverlay.id
                      ? { ...o, rotationDeg: (o.rotationDeg + 15) % 360 }
                      : o
                  );
                  setOverlays(updated);
                }}
                className="p-1 text-white/85 hover:text-white cursor-pointer"
                title="Rotate 15°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              {(selectedOverlay.kind === 'text' || selectedOverlay.kind === 'text_design') && (
                <button
                  type="button"
                  onClick={handleShuffleTextDesign}
                  className="px-2 py-0.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Randomize Typography & Color"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Shuffle</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const updated = overlays.filter((o) => o.id !== selectedOverlay.id);
                  setOverlays(updated);
                  setSelectedOverlayId(null);
                  pushHistorySnapshot({ overlays: updated });
                }}
                className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                title="Remove selected item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Playback & Undo/Redo Strip (Exact match to Screenshot_20210725_004432.jpg: [Speaker]   [Play]   [Undo] [Redo]) */}
        <div className="px-4 py-2 bg-[#141414] border-t border-white/10 flex items-center justify-between">
          {/* Left: Audio Speaker Toggle + Video Time */}
          <div className="flex items-center gap-2.5">
            <button
              id="editor-audio-mute-btn"
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className="p-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white cursor-pointer transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            {activeMediaType === 'video' && (
              <span className="text-[11px] font-mono tabular-nums text-white/70">
                {formatSec(videoCurrentTime)} / {formatSec(videoDuration)}
              </span>
            )}
          </div>

          {/* Center: Play / Pause Button */}
          <button
            id="editor-play-pause-btn"
            type="button"
            onClick={() => {
              if (activeMediaType === 'video' && videoRef.current) {
                if (videoRef.current.paused) {
                  videoRef.current.play().catch(() => {});
                  setIsPlaying(true);
                } else {
                  videoRef.current.pause();
                  setIsPlaying(false);
                }
              } else {
                setIsPlaying((p) => !p);
              }
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white flex items-center justify-center cursor-pointer transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying && activeMediaType === 'video' ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
          </button>

          {/* Right: Video Thumbnail Quick Upload + Undo & Redo Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="editor-capture-current-video-thumbnail-btn"
              type="button"
              onClick={() => {
                let capturedUrl = '';
                if (canvasRef.current) {
                  try {
                    capturedUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
                  } catch {}
                }
                if (!capturedUrl && videoRef.current) {
                  capturedUrl = captureVideoElementThumbnail(videoRef.current, {
                    filterCss: buildCombinedFilterString(),
                    fallbackTitle: activeTitle,
                  });
                }
                if (capturedUrl) {
                  setCurrentVideoThumbnailUrl(capturedUrl);
                  setVideoThumbnailSource('captured_frame');
                  if (onSaveEditedMedia) {
                    onSaveEditedMedia({
                      mediaId,
                      mediaType: activeMediaType,
                      editedDataUrl: activeMediaType === 'video' ? activeMediaUrl : capturedUrl,
                      thumbnailUrl: capturedUrl,
                      title: activeTitle,
                    });
                  }
                  showToast('📸 Current video frame captured & uploaded as thumbnail!');
                }
              }}
              className="px-2 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Use & upload current video frame as video thumbnail"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Use Current Frame</span>
            </button>
            <button
              id="editor-undo-btn"
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              className={`p-1.5 rounded-lg bg-[#1E1E1E] transition-colors ${
                historyIndex > 0
                  ? 'text-white hover:bg-[#2A2A2A] cursor-pointer'
                  : 'text-white/30 cursor-not-allowed'
              }`}
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              id="editor-redo-btn"
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              className={`p-1.5 rounded-lg bg-[#1E1E1E] transition-colors ${
                historyIndex < history.length - 1
                  ? 'text-white hover:bg-[#2A2A2A] cursor-pointer'
                  : 'text-white/30 cursor-not-allowed'
              }`}
              title="Redo"
            >
              <Redo2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contextual Tool Sub-Panel (Adjust / Focus / 60+ Filters / Sticker / Text / Text Design / Brush / AI) */}
        <div className="px-3.5 py-2.5 bg-[#1B1B1B] border-t border-white/10 max-h-48 overflow-y-auto no-scrollbar">
          {/* 1. ADJUST TOOL PANEL */}
          {activeTool === 'adjust' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/85 capitalize">
                  {activeAdjustParam}:{' '}
                  <strong className="font-mono text-blue-400">
                    {adjustments[activeAdjustParam]}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustments(DEFAULT_ADJUSTMENTS);
                    pushHistorySnapshot({ adjustments: DEFAULT_ADJUSTMENTS });
                  }}
                  className="text-[10px] text-white/60 hover:text-white cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              <input
                type="range"
                min={
                  activeAdjustParam === 'sharpness' ||
                  activeAdjustParam === 'vignette' ||
                  activeAdjustParam === 'fade'
                    ? 0
                    : activeAdjustParam === 'hue'
                    ? -180
                    : -100
                }
                max={activeAdjustParam === 'hue' ? 180 : 100}
                value={adjustments[activeAdjustParam]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAdjustments((prev) => ({ ...prev, [activeAdjustParam]: val }));
                }}
                onMouseUp={() => pushHistorySnapshot({ adjustments })}
                onTouchEnd={() => pushHistorySnapshot({ adjustments })}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-white/15 rounded-lg"
              />

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {(
                  [
                    { id: 'brightness', label: 'Brightness' },
                    { id: 'contrast', label: 'Contrast' },
                    { id: 'saturation', label: 'Saturation' },
                    { id: 'warmth', label: 'Warmth' },
                    { id: 'exposure', label: 'Exposure' },
                    { id: 'highlights', label: 'Highlights' },
                    { id: 'shadows', label: 'Shadows' },
                    { id: 'sharpness', label: 'Sharpness' },
                    { id: 'vignette', label: 'Vignette' },
                    { id: 'fade', label: 'Fade' },
                    { id: 'hue', label: 'Hue' },
                  ] as { id: keyof EditorAdjustments; label: string }[]
                ).map((param) => (
                  <button
                    key={param.id}
                    type="button"
                    onClick={() => setActiveAdjustParam(param.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 cursor-pointer transition-colors ${
                      activeAdjustParam === param.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-white/75 hover:bg-white/15'
                    }`}
                  >
                    {param.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. FOCUS TOOL PANEL (Matching Droplet Icon in Screenshot_20210725_004432.jpg) */}
          {activeTool === 'focus' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: 'none', label: 'Off' },
                    { id: 'radial', label: 'Radial Tilt-Shift' },
                    { id: 'linear', label: 'Linear Depth' },
                    { id: 'portrait_bokeh', label: 'Portrait Bokeh' },
                  ] as { id: EditorFocusConfig['mode']; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      const next = { ...focusConfig, mode: m.id };
                      setFocusConfig(next);
                      pushHistorySnapshot({ focusConfig: next });
                    }}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium shrink-0 cursor-pointer ${
                      focusConfig.mode === m.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-white/75 hover:bg-white/15'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {focusConfig.mode !== 'none' && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/75 shrink-0">Intensity</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={focusConfig.intensity}
                    onChange={(e) =>
                      setFocusConfig((prev) => ({ ...prev, intensity: Number(e.target.value) }))
                    }
                    className="flex-1 accent-blue-500 h-1.5 bg-white/15 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. FILTER LIBRARY PANEL (64 Categorized Filters across 8 Categories) */}
          {activeTool === 'filter' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {FILTER_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedFilterCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold shrink-0 cursor-pointer transition-colors ${
                      selectedFilterCategory === cat.id
                        ? 'bg-white text-slate-900'
                        : 'bg-white/10 text-white/75 hover:bg-white/15'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {filteredCategoryFilters.map((f) => {
                  const isSel = selectedFilterId === f.id;
                  return (
                    <button
                      key={f.id}
                      id={`editor-filter-item-${f.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedFilterId(f.id);
                        pushHistorySnapshot({ selectedFilterId: f.id });
                      }}
                      className={`flex flex-col items-center gap-1 shrink-0 p-1 rounded-xl border transition-all cursor-pointer ${
                        isSel
                          ? 'border-blue-400 bg-blue-500/15 scale-105'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${f.swatchGradient} flex items-center justify-center shadow-inner`}
                      >
                        <span className="text-[10px] font-bold text-white drop-shadow">
                          {f.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-white/90 max-w-[56px] truncate">
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. STICKER LIBRARY PANEL (Props/Hats including Pink Cowboy Hat & 00 44 Clock, Emoticons, Shapes, Custom) */}
          {activeTool === 'sticker' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {(
                    [
                      { id: 'props', label: 'Hats & Props' },
                      { id: 'emoticons', label: 'Emoticons' },
                      { id: 'shapes', label: 'Shapes & Badges' },
                      { id: 'custom', label: `My Stickers (${customStickers.length})` },
                    ] as { id: StickerCategory; label: string }[]
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveStickerCat(cat.id)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold shrink-0 cursor-pointer ${
                        activeStickerCat === cat.id
                          ? 'bg-pink-600 text-white'
                          : 'bg-white/10 text-white/75 hover:bg-white/15'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  id="editor-upload-custom-sticker-btn"
                  type="button"
                  onClick={() => customStickerFileRef.current?.click()}
                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  title="Upload your own custom sticker design"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Own Sticker</span>
                </button>
              </div>

              {activeStickerCat === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customStickerTextDraft}
                    onChange={(e) => setCustomStickerTextDraft(e.target.value)}
                    placeholder="Or type custom sticker badge text..."
                    className="flex-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomBadgeSticker}
                    className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {displayedStickers.map((stk) => (
                  <div key={stk.id} className="relative group shrink-0">
                    <button
                      id={`editor-sticker-item-${stk.id}`}
                      type="button"
                      onClick={() => handleAddStickerOverlay(stk)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex flex-col items-center justify-center min-w-[56px] cursor-pointer transition-all active:scale-95"
                    >
                      {stk.renderType === 'image_url' ? (
                        <img
                          src={stk.content}
                          alt={stk.name}
                          className="w-7 h-7 object-contain"
                        />
                      ) : (
                        <span className="text-base leading-none">{stk.content}</span>
                      )}
                      <span className="text-[9px] text-white/75 mt-1 max-w-[64px] truncate">
                        {stk.name}
                      </span>
                    </button>
                    {stk.category === 'custom' && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = removeCustomEditorSticker(stk.id);
                          setCustomStickers(updated);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] cursor-pointer"
                        title="Delete custom sticker"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. TEXT & 6. TEXT DESIGN TOOL PANEL (With Typography Templates, Colors & Shuffle Randomizer) */}
          {(activeTool === 'text' || activeTool === 'text_design') && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <input
                  id="editor-text-input"
                  type="text"
                  value={textInputDraft}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTextInputDraft(val);
                    if (selectedOverlayId) {
                      setOverlays((prev) =>
                        prev.map((o) =>
                          o.id === selectedOverlayId &&
                          (o.kind === 'text' || o.kind === 'text_design')
                            ? { ...o, text: val }
                            : o
                        )
                      );
                    }
                  }}
                  placeholder="Enter text (e.g. My cat)..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 outline-none focus:border-blue-400"
                />
                <button
                  id="editor-add-text-btn"
                  type="button"
                  onClick={() => handleAddTextOverlay(activeTool)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
                <button
                  id="editor-shuffle-text-design-btn"
                  type="button"
                  onClick={handleShuffleTextDesign}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  title="Randomize Typography & Color"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Shuffle</span>
                </button>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <Palette className="w-3.5 h-3.5 text-white/60 shrink-0 mr-0.5" />
                {EDITOR_COLOR_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      setSelectedTextColor(hex);
                      if (selectedOverlayId) {
                        setOverlays((prev) =>
                          prev.map((o) =>
                            o.id === selectedOverlayId ? { ...o, color: hex } : o
                          )
                        );
                      }
                    }}
                    style={{ backgroundColor: hex }}
                    className={`w-5 h-5 rounded-full shrink-0 border cursor-pointer transition-transform ${
                      selectedTextColor === hex
                        ? 'border-white scale-125 ring-2 ring-blue-400'
                        : 'border-white/30'
                    }`}
                  />
                ))}
              </div>

              {/* Typography Design Templates */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                {TEXT_DESIGN_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    id={`editor-text-design-tpl-${tpl.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      if (selectedOverlayId) {
                        const updated = overlays.map((o) =>
                          o.id === selectedOverlayId &&
                          (o.kind === 'text' || o.kind === 'text_design')
                            ? {
                                ...o,
                                kind: 'text_design' as const,
                                templateId: tpl.id,
                                fontFamily: tpl.fontFamily,
                                bgColor: tpl.defaultBgColor,
                                rotationDeg: tpl.defaultTiltDeg,
                              }
                            : o
                        );
                        setOverlays(updated);
                        pushHistorySnapshot({ overlays: updated });
                      } else {
                        handleAddTextOverlay('text_design', tpl.id);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 cursor-pointer border transition-all ${
                      selectedTemplateId === tpl.id
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-white/10 text-white/85 border-white/10 hover:bg-white/20'
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 7. BRUSH / MARKER TOOL PANEL (Matching 36.jpg Marker Icon) */}
          {activeTool === 'brush' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: 'neon', label: 'Neon Glow' },
                      { id: 'solid', label: 'Solid Marker' },
                      { id: 'dashed', label: 'Dashed' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setBrushStyle(st.id)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                        brushStyle === st.id
                          ? 'bg-pink-600 text-white'
                          : 'bg-white/10 text-white/75'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBrushStrokes([]);
                    pushHistorySnapshot({ brushStrokes: [] });
                  }}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Ink
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {EDITOR_COLOR_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setBrushColor(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-5 h-5 rounded-full shrink-0 border cursor-pointer ${
                        brushColor === hex ? 'border-white scale-125' : 'border-white/30'
                      }`}
                    />
                  ))}
                </div>
                <input
                  type="range"
                  min={3}
                  max={24}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24 accent-pink-500 h-1.5 bg-white/15 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* 7B. VIDEO THUMBNAIL MANAGER & UPLOAD PANEL */}
          {activeTool === 'video_thumbnail' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-black border border-white/20 shrink-0">
                    {currentVideoThumbnailUrl ? (
                      <img
                        src={currentVideoThumbnailUrl}
                        alt="Current Video Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <Film className="w-4 h-4" />
                      </div>
                    )}
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-extrabold text-emerald-300 uppercase">
                      {videoThumbnailSource === 'uploaded'
                        ? 'Custom'
                        : videoThumbnailSource === 'captured_frame'
                        ? 'Frame'
                        : 'Auto'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                      <span>Current Video Thumbnail</span>
                      {isGeneratingThumbnail && (
                        <span className="text-[9px] text-purple-300 animate-pulse">
                          Generating...
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/60 truncate">
                      {videoThumbnailSource === 'uploaded'
                        ? 'Custom thumbnail uploaded from your device'
                        : videoThumbnailSource === 'captured_frame'
                        ? `Captured from current video frame (${formatSec(videoCurrentTime)})`
                        : 'Automatically generated when media was uploaded'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="video-editor-panel-upload-thumbnail-btn"
                  type="button"
                  onClick={() => videoThumbnailFileRef.current?.click()}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Thumbnail File</span>
                </button>
                <button
                  id="video-editor-panel-capture-frame-btn"
                  type="button"
                  onClick={() => {
                    let capturedUrl = '';
                    if (canvasRef.current) {
                      try {
                        capturedUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
                      } catch {}
                    }
                    if (!capturedUrl && videoRef.current) {
                      capturedUrl = captureVideoElementThumbnail(videoRef.current, {
                        filterCss: buildCombinedFilterString(),
                        fallbackTitle: activeTitle,
                      });
                    }
                    if (capturedUrl) {
                      setCurrentVideoThumbnailUrl(capturedUrl);
                      setVideoThumbnailSource('captured_frame');
                      if (onSaveEditedMedia) {
                        onSaveEditedMedia({
                          mediaId,
                          mediaType: activeMediaType,
                          editedDataUrl: activeMediaType === 'video' ? activeMediaUrl : capturedUrl,
                          thumbnailUrl: capturedUrl,
                          title: activeTitle,
                        });
                      }
                      showToast(
                        `📸 Uploaded current video frame (${formatSec(videoCurrentTime)}) as thumbnail!`
                      );
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Current Frame</span>
                </button>
              </div>
            </div>
          )}

          {/* 8. AI STUDIO TOOLS PANEL */}
          {activeTool === 'ai_tools' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask AI (e.g. Golden sunset mood, Cute cat caption)..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  id="editor-ai-auto-enhance-btn"
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => handleRunAiTool('auto_enhance')}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isAiLoading ? 'Enhancing...' : 'AI Auto-Enhance'}</span>
                </button>
                <button
                  id="editor-ai-magic-text-btn"
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => handleRunAiTool('magic_text')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Magic Text Design</span>
                </button>
                <button
                  id="editor-ai-sticker-btn"
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => handleRunAiTool('ai_sticker')}
                  className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Sticker className="w-3.5 h-3.5" />
                  <span>AI Sticker Maker</span>
                </button>
              </div>
              {aiSuggestions.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  {aiSuggestions.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTextInputDraft(phrase);
                        handleAddTextOverlay('text_design');
                      }}
                      className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] text-white shrink-0 cursor-pointer"
                    >
                      + “{phrase}”
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Studio Tool Dock (Exact match to Screenshot_20210725_004432.jpg: Adjust | Focus | Filter | Sticker | Text | Text Design | AI) */}
        <div className="px-2 py-2.5 bg-[#1F1F1F] border-t border-white/10 flex items-center justify-between overflow-x-auto no-scrollbar gap-1">
          {(
            [
              { id: 'adjust', label: 'Adjust', icon: Sliders },
              { id: 'focus', label: 'Focus', icon: Droplet },
              { id: 'filter', label: 'Filters (64)', icon: Sparkles },
              { id: 'video_thumbnail', label: 'Thumbnail', icon: Film },
              { id: 'sticker', label: 'Sticker', icon: Sticker },
              { id: 'text', label: 'Text', icon: Type },
              { id: 'text_design', label: 'Text Design', icon: Bookmark },
              { id: 'ai_tools', label: 'AI Tools', icon: Wand2 },
            ] as { id: EditorToolTab; label: string; icon: React.FC<{ className?: string }> }[]
          ).map((tool) => {
            const IconComp = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                id={`editor-dock-tab-${tool.id}`}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`flex flex-col items-center justify-center gap-1.5 px-2.5 py-1 rounded-xl shrink-0 cursor-pointer transition-all ${
                  isActive ? 'text-white scale-105' : 'text-white/65 hover:text-white'
                }`}
              >
                <IconComp className="w-5 h-5 stroke-[1.9]" />
                <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom-Most "EDITOR" Bar (Exact match to Screenshot_20210725_004432.jpg: [X]   EDITOR   [Save / Share / Download]) */}
        <div className="px-4 py-3 bg-[#181818] border-t border-white/10 flex items-center justify-between">
          <button
            id="editor-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white cursor-pointer transition-colors"
            title="Cancel & Close Editor"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-xs font-semibold tracking-[0.16em] uppercase text-white/90">
            EDITOR
          </span>

          <div className="flex items-center gap-1.5">
            <button
              id="editor-save-to-gallery-btn"
              type="button"
              onClick={() => handleSaveAndExport(false)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Save Edited Creative to User Gallery"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            {/* Share Edited Photo/Video to Friends & Groups with Message Icon Button next to Download */}
            <button
              id="editor-share-friends-groups-btn"
              type="button"
              onClick={handleOpenEditorShareModal}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-purple-600 text-white/90 hover:text-white cursor-pointer transition-all"
              title="Share edited photo to Friends & Groups with message"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              id="editor-download-btn"
              type="button"
              onClick={() => handleSaveAndExport(true)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white cursor-pointer transition-colors"
              title="Save & Download Edited Creative"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SHARE EDITED PHOTO/VIDEO TO FRIENDS & GROUPS WITH MESSAGE MODAL */}
        {isShareEditorModalOpen && (
          <div
            id="editor-share-modal-backdrop"
            onClick={() => setIsShareEditorModalOpen(false)}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-150"
          >
            <div
              id="editor-share-modal"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#161822] border border-white/15 text-white p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150 max-h-[90%] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/25 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold">
                      Share Edited {activeMediaType === 'video' ? 'Video' : 'Photo'}
                    </h4>
                    <p className="text-[10px] text-white/60">
                      Send to Friends & Groups with a message
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShareEditorModalOpen(false)}
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edited Photo Preview + Custom Message Box */}
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <img
                    src={sharePreviewDataUrl || activeMediaUrl}
                    alt={activeTitle}
                    className="w-14 h-14 rounded-xl object-cover border border-white/15 shrink-0 bg-black"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <input
                      type="text"
                      value={activeTitle}
                      onChange={(e) => setActiveTitle(e.target.value)}
                      placeholder="Edited photo title..."
                      className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/15 text-xs font-bold text-white outline-none focus:border-purple-400"
                    />
                    <span className="text-[10px] text-emerald-400 font-semibold block">
                      ✓ Filters, adjustments & stickers baked in
                    </span>
                  </div>
                </div>

                {/* Message Input to accompany the shared photo */}
                <div>
                  <label className="text-[10px] font-bold text-white/75 block mb-1">
                    Message with Edited Photo
                  </label>
                  <textarea
                    id="editor-share-message-input"
                    rows={2}
                    value={shareMessageCaption}
                    onChange={(e) => setShareMessageCaption(e.target.value)}
                    placeholder="Write a message to send with your edited photo..."
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/40 outline-none focus:border-purple-400 resize-none"
                  />
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                    {[
                      'Check out this photo I just edited! ✨',
                      'Thoughts on this new edit? 🎨',
                      'Edited with AI Magic Fix 🔥',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setShareMessageCaption(chip)}
                        className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[9px] text-white/85 shrink-0 cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Pills: All | Friends | Groups + Toggle All */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'friends', label: 'Friends' },
                      { id: 'groups', label: 'Groups' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setShareRecipientTab(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        shareRecipientTab === tab.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const visibleIds = filteredShareRecipients.map((r) => r.id);
                    const allSelected = visibleIds.every((id) =>
                      selectedShareRecipientIds.includes(id)
                    );
                    if (allSelected) {
                      setSelectedShareRecipientIds((prev) =>
                        prev.filter((id) => !visibleIds.includes(id))
                      );
                    } else {
                      setSelectedShareRecipientIds((prev) =>
                        Array.from(new Set([...prev, ...visibleIds]))
                      );
                    }
                  }}
                  className="text-[10px] font-bold text-purple-400 hover:underline cursor-pointer"
                >
                  Toggle All
                </button>
              </div>

              {/* Friends & Groups Multi-Select List */}
              <div className="flex-1 min-h-0 max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {filteredShareRecipients.map((rec) => {
                  const isSelected = selectedShareRecipientIds.includes(rec.id);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => {
                        setSelectedShareRecipientIds((prev) =>
                          prev.includes(rec.id)
                            ? prev.filter((id) => id !== rec.id)
                            : [...prev, rec.id]
                        );
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500/70'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={rec.avatar}
                          alt={rec.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-800"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span>{rec.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                                rec.isGroup
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {rec.isGroup ? 'Group' : 'Friend'}
                            </span>
                          </p>
                          <p className="text-[10px] text-white/55 truncate">{rec.subtitle}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'border-white/30'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send to Friends & Groups Action Button */}
              <button
                id="editor-confirm-send-friends-groups-btn"
                type="button"
                disabled={selectedShareRecipientIds.length === 0}
                onClick={handleConfirmSendToFriendsAndGroups}
                className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                  selectedShareRecipientIds.length > 0
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white shadow-lg cursor-pointer'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  Send Edited Photo & Message ({selectedShareRecipientIds.length})
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
