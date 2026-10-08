import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Zap,
  ZapOff,
  ChevronLeft,
  ChevronRight,
  Send,
  Download,
  RotateCcw,
  Video,
  Camera,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export type SnapCameraCategory = 'masks' | 'effects' | 'filters';

export interface MaskOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export interface EffectOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export interface FilterOption {
  id: string;
  name: string;
  badge: string;
  cssFilter: string;
  tintColor?: string;
  vignetteColor?: string;
}

export const SNAP_MASKS: MaskOption[] = [
  { id: 'heart_crown', name: 'Heart Crown', badge: '💗', description: '3D Pink Heart Crown & Rosy Blush' },
  { id: 'dog_ears', name: 'Puppy Filter', badge: '🐶', description: 'Classic Puppy Ears, Nose & Tongue' },
  { id: 'neon_cat', name: 'Cyber Cat', badge: '🐱', description: 'Glowing Neon Cat Ears & Whiskers' },
  { id: 'butterfly_halo', name: 'Butterfly Halo', badge: '🦋', description: 'Fluttering Iridescent Butterflies' },
  { id: 'gold_crown', name: 'Royal Crown', badge: '👑', description: '24K Golden Crown & Warm Glow' },
  { id: 'bunny_ears', name: 'Sweet Bunny', badge: '🐰', description: 'Plush Bunny Ears & Cute Nose' },
  { id: 'cool_shades', name: 'Aviator Shades', badge: '😎', description: 'Reflective Gradient Sunglasses' },
  { id: 'devil_horns', name: 'Neon Horns', badge: '😈', description: 'Glowing Crimson Horns' },
  { id: 'cyber_visor', name: 'Cyber Visor', badge: '🤖', description: 'Holographic LED Eye Visor' },
  { id: 'none', name: 'No Mask', badge: '🚫', description: 'Natural Face (No Mask)' },
];

export const SNAP_EFFECTS: EffectOption[] = [
  { id: 'floating_hearts', name: 'Dreamy Hearts', badge: '💕', description: 'Floating 3D Pink Hearts' },
  { id: 'sparkle_glitter', name: 'Starlight Glitter', badge: '✨', description: 'Twinkling Diamond Sparkles' },
  { id: 'neon_aura', name: 'Neon Aura', badge: '🔮', description: 'Dual-Tone Cyber Rim Light' },
  { id: 'fireflies', name: 'Golden Bokeh', badge: '🌟', description: 'Warm Floating Light Orbs' },
  { id: 'rainbow_prism', name: 'Rainbow Prism', badge: '🌈', description: 'Anamorphic Rainbow Lens Flare' },
  { id: 'snow_dream', name: 'Frost Snow', badge: '❄️', description: 'Falling Crystalline Snowflakes' },
  { id: 'confetti_pop', name: 'Party Confetti', badge: '🎉', description: 'Celebration Confetti Rain' },
  { id: 'vhs_glitch', name: '90s VHS Cam', badge: '📼', description: 'Retro Camcorder Scanlines' },
  { id: 'none', name: 'No Effect', badge: '🚫', description: 'Clean Viewfinder' },
];

export const SNAP_FILTERS: FilterOption[] = [
  {
    id: 'soft_glam',
    name: 'Soft Glam',
    badge: '🌸',
    cssFilter: 'brightness(1.06) contrast(0.98) saturate(1.18) sepia(0.08)',
    tintColor: 'rgba(255, 165, 205, 0.14)',
  },
  {
    id: 'normal',
    name: 'Original',
    badge: '📷',
    cssFilter: 'none',
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    badge: '🌅',
    cssFilter: 'brightness(1.06) contrast(1.06) saturate(1.32) sepia(0.22)',
    tintColor: 'rgba(255, 175, 65, 0.18)',
  },
  {
    id: 'rose_quartz',
    name: 'Rose Quartz',
    badge: '🌷',
    cssFilter: 'brightness(1.08) contrast(0.95) saturate(1.18) hue-rotate(-8deg)',
    tintColor: 'rgba(255, 120, 180, 0.18)',
  },
  {
    id: 'tokyo_neon',
    name: 'Tokyo Night',
    badge: '🌆',
    cssFilter: 'brightness(1.03) contrast(1.18) saturate(1.4) hue-rotate(12deg)',
    tintColor: 'rgba(130, 60, 255, 0.2)',
  },
  {
    id: 'vintage_film',
    name: 'Kodak 400',
    badge: '🎞️',
    cssFilter: 'brightness(1.02) contrast(0.92) saturate(0.88) sepia(0.32)',
    tintColor: 'rgba(210, 170, 110, 0.18)',
  },
  {
    id: 'bw_noir',
    name: 'Classic B&W',
    badge: '🎬',
    cssFilter: 'grayscale(1) contrast(1.22) brightness(1.04)',
    tintColor: 'rgba(15, 23, 42, 0.12)',
  },
  {
    id: 'emerald_vibe',
    name: 'Emerald Vibe',
    badge: '💎',
    cssFilter: 'brightness(1.05) contrast(1.1) saturate(1.25) hue-rotate(8deg)',
    tintColor: 'rgba(16, 185, 129, 0.16)',
  },
];

interface ParticleItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
  hue: number;
}

interface SnapFaceFilterCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName?: string;
  primaryColor?: string;
  onSendPhoto: (photoDataUrl: string, caption?: string) => void;
  onSendVideo: (
    videoUrl: string,
    thumbnailDataUrl: string,
    caption?: string,
    durationSec?: number
  ) => void;
}

export const SnapFaceFilterCameraModal: React.FC<SnapFaceFilterCameraModalProps> = ({
  isOpen,
  onClose,
  recipientName = 'Chat',
  primaryColor = '#10B981',
  onSendPhoto,
  onSendVideo,
}) => {
  const [activeCategory, setActiveCategory] = useState<SnapCameraCategory>('masks');
  const [selectedMaskId, setSelectedMaskId] = useState<string>('heart_crown');
  const [selectedEffectId, setSelectedEffectId] = useState<string>('floating_hearts');
  const [selectedFilterId, setSelectedFilterId] = useState<string>('soft_glam');

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [screenFlashPulse, setScreenFlashPulse] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Interactive & auto-tracked face offset + head scale
  const [faceOffset, setFaceOffset] = useState<{ x: number; y: number }>({ x: 0, y: -0.04 });
  const [headScale, setHeadScale] = useState<number>(1);
  const [isDraggingFace, setIsDraggingFace] = useState<boolean>(false);

  // Capture / Recording states
  const [captureMode, setCaptureMode] = useState<'tap_or_hold' | 'video_toggle'>('tap_or_hold');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [capturedMedia, setCapturedMedia] = useState<{
    type: 'photo' | 'video';
    url: string;
    thumbnailUrl: string;
    durationSec?: number;
  } | null>(null);
  const [captionText, setCaptionText] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const firstFrameThumbRef = useRef<string>('');
  const holdTimerRef = useRef<number | null>(null);
  const isHoldTriggeredRef = useRef<boolean>(false);
  const recordIntervalRef = useRef<number | null>(null);
  const particlesRef = useRef<ParticleItem[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  // Initialize particles for AR effects
  useEffect(() => {
    const list: ParticleItem[] = [];
    for (let i = 0; i < 28; i++) {
      list.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0025,
        vy: -0.002 - Math.random() * 0.003,
        size: 12 + Math.random() * 18,
        alpha: 0.45 + Math.random() * 0.5,
        rotation: (Math.random() - 0.5) * 0.6,
        vRot: (Math.random() - 0.5) * 0.02,
        hue: Math.floor(Math.random() * 360),
      });
    }
    particlesRef.current = list;
  }, [selectedEffectId]);

  const stopAllStreams = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Acquire REAL user camera stream with progressive hardware fallback (never uses a mock image)
  const startRealUserCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser.');
      return;
    }

    setCameraError(null);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      let mediaStream: MediaStream | null = null;

      // Attempt 1: Preferred device or facingMode with ideal HD resolution (video only so audio permission never blocks video)
      try {
        const videoConstraints: MediaTrackConstraints = selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            };
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch {
        // Attempt 2: Simple facingMode constraint
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
        } catch {
          // Attempt 3: Any available hardware camera
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = mediaStream;

      // Enumerate available cameras so user can switch between all device cameras
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const cams = allDevices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cams);
      } catch {}

      // Attach live stream to visible <video> element so mobile browsers decode frames at 60fps
      if (videoRef.current) {
        const vid = videoRef.current;
        vid.srcObject = mediaStream;
        vid.muted = true;
        vid.playsInline = true;
        vid.setAttribute('playsinline', 'true');
        vid.setAttribute('webkit-playsinline', 'true');
        vid.onloadedmetadata = () => {
          vid.play().catch(() => {});
          setCameraReady(true);
        };
        await vid.play().catch(() => {});
        setCameraReady(true);
      }

      // Non-blocking microphone acquisition for video recording
      if (!audioStreamRef.current) {
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: false })
          .then((audStream) => {
            audioStreamRef.current = audStream;
          })
          .catch(() => {
            // Audio is optional; camera continues uninterrupted
          });
      }
    } catch (err: any) {
      setCameraReady(false);
      setCameraError(
        err?.message ||
          'Please allow camera access in your browser to see your live face and apply filters.'
      );
    }
  }, [facingMode, selectedDeviceId]);

  useEffect(() => {
    if (!isOpen) {
      stopAllStreams();
      return;
    }
    startRealUserCamera();
    return () => {
      stopAllStreams();
    };
  }, [isOpen, startRealUserCamera, stopAllStreams]);

  // Native hardware FaceDetector tracking when available (e.g. Android Chrome)
  useEffect(() => {
    if (!isOpen || !cameraReady || isDraggingFace) return;
    const FaceDetectorCtor = (window as any).FaceDetector;
    if (!FaceDetectorCtor) return;

    let detector: any = null;
    try {
      detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
    } catch {
      return;
    }

    let active = true;
    const intervalId = window.setInterval(async () => {
      if (!active || !detector || !videoRef.current) return;
      const vid = videoRef.current;
      if (vid.readyState < 2 || vid.videoWidth === 0 || vid.videoHeight === 0) return;

      try {
        const faces = await detector.detect(vid);
        if (faces && faces.length > 0 && active) {
          const box = faces[0].boundingBox;
          const normCenterX = (box.x + box.width / 2) / vid.videoWidth;
          const normCenterY = (box.y + box.height / 2) / vid.videoHeight;
          const mirroredX = facingMode === 'user' ? 1 - normCenterX : normCenterX;
          const nextOffsetX = Math.max(-0.32, Math.min(0.32, mirroredX - 0.5));
          const nextOffsetY = Math.max(-0.32, Math.min(0.32, normCenterY - 0.43));
          const detectedScale = Math.max(0.75, Math.min(1.45, (box.width / vid.videoWidth) * 2.2));

          setFaceOffset((prev) => ({
            x: prev.x * 0.55 + nextOffsetX * 0.45,
            y: prev.y * 0.55 + nextOffsetY * 0.45,
          }));
          setHeadScale((prev) => prev * 0.6 + detectedScale * 0.4);
        }
      } catch {}
    }, 140);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [isOpen, cameraReady, facingMode, isDraggingFace]);

  // Draw a 3D glossy pink heart at (cx, cy) with size & rotation
  const drawGlossyPinkHeart = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      angleRad: number,
      alpha = 0.96
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRad);
      ctx.globalAlpha = alpha;

      ctx.shadowColor = 'rgba(255, 85, 165, 0.65)';
      ctx.shadowBlur = size * 0.45;

      ctx.beginPath();
      const topCurveHeight = size * 0.32;
      ctx.moveTo(0, topCurveHeight);
      ctx.bezierCurveTo(0, 0, -size, 0, -size, topCurveHeight);
      ctx.bezierCurveTo(-size, size * 0.75, 0, size * 1.05, 0, size * 1.32);
      ctx.bezierCurveTo(0, size * 1.05, size, size * 0.75, size, topCurveHeight);
      ctx.bezierCurveTo(size, 0, 0, 0, 0, topCurveHeight);
      ctx.closePath();

      const grad = ctx.createRadialGradient(
        -size * 0.28,
        size * 0.28,
        size * 0.08,
        0,
        size * 0.55,
        size * 1.25
      );
      grad.addColorStop(0, '#FFE4F2');
      grad.addColorStop(0.35, '#FF94C8');
      grad.addColorStop(0.78, '#FF4FA2');
      grad.addColorStop(1, '#D9267E');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(-size * 0.36, size * 0.34, size * 0.22, size * 0.12, -0.45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fill();

      ctx.restore();
    },
    []
  );

  // Core function that composites the REAL user camera frame + filter + AR face mask + effects onto canvas
  const drawCompositeCameraFrame = useCallback(
    (now: number, forceOpaqueBackground = false) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);

      const currentFilter =
        SNAP_FILTERS.find((f) => f.id === selectedFilterId) || SNAP_FILTERS[0];

      // 1. Draw the REAL user camera frame from <video> with active CSS filter
      const vid = videoRef.current;
      const hasLiveVideo = Boolean(
        vid && vid.readyState >= 2 && vid.videoWidth > 0 && vid.videoHeight > 0
      );

      if (hasLiveVideo && vid) {
        ctx.save();
        try {
          ctx.filter = currentFilter.cssFilter || 'none';
        } catch {}

        const vw = vid.videoWidth;
        const vh = vid.videoHeight;
        const scale = Math.max(cw / vw, ch / vh);
        const drawW = vw * scale;
        const drawH = vh * scale;
        const dx = (cw - drawW) / 2;
        const dy = (ch - drawH) / 2;

        if (facingMode === 'user') {
          ctx.translate(cw, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(vid, dx, dy, drawW, drawH);
        ctx.restore();

        // Fallback grayscale / contrast pass for Classic B&W on mobile browsers where ctx.filter is ignored
        if (selectedFilterId === 'bw_noir') {
          ctx.save();
          ctx.globalCompositeOperation = 'saturation';
          ctx.fillStyle = 'hsl(0, 0%, 50%)';
          ctx.fillRect(0, 0, cw, ch);
          ctx.restore();
        }
      } else if (forceOpaqueBackground) {
        ctx.fillStyle = '#090D16';
        ctx.fillRect(0, 0, cw, ch);
      }

      // 2. Apply Filter Color Tint & Beauty Glow
      if (currentFilter.tintColor) {
        ctx.save();
        ctx.fillStyle = currentFilter.tintColor;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }

      const breathX = Math.sin(elapsed * 1.6) * 0.004;
      const breathY = Math.cos(elapsed * 2.1) * 0.004;
      const faceCenterX = cw * (0.5 + faceOffset.x + breathX);
      const faceCenterY = ch * (0.43 + faceOffset.y + breathY);
      const headRadius = cw * 0.25 * headScale;

      // 3. Draw AR Face Mask (`Masks` category) onto user's real face
      if (selectedMaskId !== 'none') {
        ctx.save();

        if (selectedMaskId === 'heart_crown') {
          const leftCheekX = faceCenterX - headRadius * 0.56;
          const rightCheekX = faceCenterX + headRadius * 0.56;
          const cheekY = faceCenterY + headRadius * 0.18;
          [leftCheekX, rightCheekX].forEach((cxPos) => {
            const blushGrad = ctx.createRadialGradient(
              cxPos,
              cheekY,
              2,
              cxPos,
              cheekY,
              headRadius * 0.42
            );
            blushGrad.addColorStop(0, 'rgba(255, 105, 165, 0.34)');
            blushGrad.addColorStop(1, 'rgba(255, 105, 165, 0)');
            ctx.fillStyle = blushGrad;
            ctx.beginPath();
            ctx.arc(cxPos, cheekY, headRadius * 0.42, 0, Math.PI * 2);
            ctx.fill();
          });

          const crownHearts = [
            { angleDeg: -138, dist: 1.34, size: 22, tilt: -0.42, phase: 0 },
            { angleDeg: -120, dist: 1.15, size: 32, tilt: -0.32, phase: 0.8 },
            { angleDeg: -102, dist: 0.96, size: 26, tilt: -0.18, phase: 1.6 },
            { angleDeg: -88, dist: 1.26, size: 36, tilt: -0.05, phase: 2.3 },
            { angleDeg: -75, dist: 0.92, size: 20, tilt: 0.08, phase: 3.1 },
            { angleDeg: -56, dist: 1.05, size: 29, tilt: 0.24, phase: 3.9 },
            { angleDeg: -42, dist: 1.38, size: 17, tilt: 0.32, phase: 4.5 },
            { angleDeg: -26, dist: 1.28, size: 23, tilt: 0.44, phase: 5.2 },
            { angleDeg: -154, dist: 1.36, size: 19, tilt: -0.52, phase: 5.9 },
          ];

          crownHearts.forEach((h) => {
            const rad = (h.angleDeg * Math.PI) / 180;
            const floatBob = Math.sin(elapsed * 2.6 + h.phase) * 5;
            const scalePulse = 1 + Math.sin(elapsed * 3.1 + h.phase) * 0.06;
            const hx = faceCenterX + Math.cos(rad) * (headRadius * h.dist);
            const hy =
              faceCenterY +
              Math.sin(rad) * (headRadius * h.dist * 0.95) -
              headRadius * 0.1 +
              floatBob;
            drawGlossyPinkHeart(
              ctx,
              hx,
              hy,
              h.size * (cw / 420) * headScale * scalePulse,
              h.tilt + Math.sin(elapsed * 1.8 + h.phase) * 0.06
            );
          });
        } else if (selectedMaskId === 'dog_ears') {
          const earSwing = Math.sin(elapsed * 3) * 0.06;
          ctx.save();
          ctx.translate(faceCenterX - headRadius * 0.78, faceCenterY - headRadius * 0.78);
          ctx.rotate(-0.45 + earSwing);
          ctx.fillStyle = '#8B5A2B';
          ctx.beginPath();
          ctx.ellipse(0, 18, headRadius * 0.36, headRadius * 0.62, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#D2996C';
          ctx.beginPath();
          ctx.ellipse(4, 22, headRadius * 0.2, headRadius * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.translate(faceCenterX + headRadius * 0.78, faceCenterY - headRadius * 0.78);
          ctx.rotate(0.45 - earSwing);
          ctx.fillStyle = '#8B5A2B';
          ctx.beginPath();
          ctx.ellipse(0, 18, headRadius * 0.36, headRadius * 0.62, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#D2996C';
          ctx.beginPath();
          ctx.ellipse(-4, 22, headRadius * 0.2, headRadius * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          const noseY = faceCenterY + headRadius * 0.12;
          ctx.fillStyle = '#2A1B12';
          ctx.beginPath();
          ctx.ellipse(faceCenterX, noseY, headRadius * 0.24, headRadius * 0.17, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.ellipse(
            faceCenterX - headRadius * 0.07,
            noseY - headRadius * 0.05,
            headRadius * 0.07,
            headRadius * 0.04,
            -0.3,
            0,
            Math.PI * 2
          );
          ctx.fill();

          const tongueBob = Math.abs(Math.sin(elapsed * 3.6)) * 8;
          const tongueY = faceCenterY + headRadius * 0.48;
          ctx.fillStyle = '#FF6B8B';
          ctx.beginPath();
          ctx.roundRect(
            faceCenterX - headRadius * 0.15,
            tongueY,
            headRadius * 0.3,
            headRadius * 0.38 + tongueBob,
            [4, 4, 24, 24]
          );
          ctx.fill();
          ctx.strokeStyle = '#D94B6B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(faceCenterX, tongueY + 4);
          ctx.lineTo(faceCenterX, tongueY + headRadius * 0.3 + tongueBob);
          ctx.stroke();
        } else if (selectedMaskId === 'neon_cat') {
          ctx.shadowColor = '#FF2A85';
          ctx.shadowBlur = 16;
          ctx.strokeStyle = '#FF55B8';
          ctx.lineWidth = 4;

          [-1, 1].forEach((dir) => {
            ctx.save();
            ctx.translate(faceCenterX + dir * headRadius * 0.68, faceCenterY - headRadius * 0.86);
            ctx.rotate(dir * 0.28);
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.32, headRadius * 0.25);
            ctx.lineTo(0, -headRadius * 0.45);
            ctx.lineTo(headRadius * 0.32, headRadius * 0.25);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 42, 133, 0.28)';
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          });

          const noseY = faceCenterY + headRadius * 0.1;
          ctx.fillStyle = '#FF55B8';
          ctx.beginPath();
          ctx.moveTo(faceCenterX - 12, noseY - 6);
          ctx.lineTo(faceCenterX + 12, noseY - 6);
          ctx.lineTo(faceCenterX, noseY + 8);
          ctx.closePath();
          ctx.fill();

          [-1, 1].forEach((dir) => {
            [-0.14, 0, 0.14].forEach((slope, idx) => {
              ctx.beginPath();
              const startX = faceCenterX + dir * headRadius * 0.32;
              const startY = noseY + (idx - 1) * 8;
              ctx.moveTo(startX, startY);
              ctx.lineTo(startX + dir * headRadius * 0.52, startY + slope * 45);
              ctx.stroke();
            });
          });
        } else if (selectedMaskId === 'butterfly_halo') {
          const butterflies = [
            { angleDeg: -135, dist: 1.22, emoji: '🦋', scale: 1.15 },
            { angleDeg: -108, dist: 1.08, emoji: '🦋', scale: 1.35 },
            { angleDeg: -82, dist: 1.18, emoji: '🦋', scale: 1.25 },
            { angleDeg: -55, dist: 1.1, emoji: '🦋', scale: 1.3 },
            { angleDeg: -30, dist: 1.25, emoji: '🦋', scale: 1.1 },
          ];
          butterflies.forEach((b, i) => {
            const rad = (b.angleDeg * Math.PI) / 180;
            const wingFlutter = Math.sin(elapsed * 6 + i) * 0.22;
            const bx = faceCenterX + Math.cos(rad) * headRadius * b.dist;
            const by =
              faceCenterY +
              Math.sin(rad) * headRadius * b.dist * 0.92 -
              headRadius * 0.08 +
              Math.sin(elapsed * 2.5 + i) * 6;
            ctx.save();
            ctx.translate(bx, by);
            ctx.scale(1 + wingFlutter, 1);
            ctx.shadowColor = '#60A5FA';
            ctx.shadowBlur = 14;
            ctx.font = `${Math.round(28 * b.scale * (cw / 420) * headScale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.emoji, 0, 0);
            ctx.restore();
          });
        } else if (selectedMaskId === 'gold_crown') {
          ctx.save();
          ctx.translate(faceCenterX, faceCenterY - headRadius * 1.05 + Math.sin(elapsed * 2) * 4);
          ctx.shadowColor = 'rgba(250, 204, 21, 0.75)';
          ctx.shadowBlur = 18;
          ctx.font = `${Math.round(74 * (cw / 420) * headScale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('👑', 0, 0);
          ctx.restore();
        } else if (selectedMaskId === 'bunny_ears') {
          [-1, 1].forEach((dir) => {
            ctx.save();
            ctx.translate(faceCenterX + dir * headRadius * 0.45, faceCenterY - headRadius * 1.15);
            ctx.rotate(dir * (0.12 + Math.sin(elapsed * 2.5) * 0.04));
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(0, 0, headRadius * 0.22, headRadius * 0.62, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath();
            ctx.ellipse(0, 4, headRadius * 0.12, headRadius * 0.46, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
          ctx.fillStyle = '#FF8DA1';
          ctx.beginPath();
          ctx.arc(faceCenterX, faceCenterY + headRadius * 0.1, headRadius * 0.11, 0, Math.PI * 2);
          ctx.fill();
        } else if (selectedMaskId === 'cool_shades') {
          const eyeY = faceCenterY - headRadius * 0.12;
          const lensW = headRadius * 0.48;
          const lensH = headRadius * 0.34;
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.45)';
          ctx.shadowBlur = 12;
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 3.5;

          [-1, 1].forEach((dir) => {
            const lx = faceCenterX + dir * headRadius * 0.42;
            const grad = ctx.createLinearGradient(lx, eyeY - lensH, lx, eyeY + lensH);
            grad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
            grad.addColorStop(0.5, 'rgba(88, 28, 135, 0.82)');
            grad.addColorStop(1, 'rgba(236, 72, 153, 0.72)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(lx - lensW / 2, eyeY - lensH / 2, lensW, lensH, 14);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            ctx.beginPath();
            ctx.roundRect(lx - lensW * 0.32, eyeY - lensH * 0.32, lensW * 0.25, lensH * 0.18, 6);
            ctx.fill();
          });

          ctx.beginPath();
          ctx.moveTo(faceCenterX - headRadius * 0.18, eyeY - 4);
          ctx.lineTo(faceCenterX + headRadius * 0.18, eyeY - 4);
          ctx.stroke();
          ctx.restore();
        } else if (selectedMaskId === 'devil_horns') {
          [-1, 1].forEach((dir) => {
            ctx.save();
            ctx.translate(faceCenterX + dir * headRadius * 0.55, faceCenterY - headRadius * 0.92);
            ctx.rotate(dir * 0.35);
            ctx.shadowColor = '#EF4444';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#DC2626';
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.18, headRadius * 0.2);
            ctx.quadraticCurveTo(
              dir * headRadius * 0.12,
              -headRadius * 0.45,
              dir * headRadius * 0.28,
              -headRadius * 0.48
            );
            ctx.quadraticCurveTo(headRadius * 0.18, 0, headRadius * 0.18, headRadius * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          });
        } else if (selectedMaskId === 'cyber_visor') {
          const eyeY = faceCenterY - headRadius * 0.12;
          const visorW = headRadius * 1.45;
          const visorH = headRadius * 0.34;
          ctx.save();
          ctx.shadowColor = '#06B6D4';
          ctx.shadowBlur = 20;
          const vGrad = ctx.createLinearGradient(
            faceCenterX - visorW / 2,
            eyeY,
            faceCenterX + visorW / 2,
            eyeY
          );
          vGrad.addColorStop(0, 'rgba(6, 182, 212, 0.78)');
          vGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.82)');
          vGrad.addColorStop(1, 'rgba(6, 182, 212, 0.78)');
          ctx.fillStyle = vGrad;
          ctx.strokeStyle = '#67E8F9';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(faceCenterX - visorW / 2, eyeY - visorH / 2, visorW, visorH, 16);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      }

      // 4. Draw Animated Particle / Lens Effects (`Effects` category)
      if (selectedEffectId !== 'none') {
        ctx.save();
        const particles = particlesRef.current;

        if (
          selectedEffectId === 'floating_hearts' ||
          selectedEffectId === 'sparkle_glitter' ||
          selectedEffectId === 'fireflies' ||
          selectedEffectId === 'snow_dream' ||
          selectedEffectId === 'confetti_pop'
        ) {
          particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.vRot;
            if (p.y < -0.08) {
              p.y = 1.06;
              p.x = Math.random();
            }
            if (p.x < -0.05) p.x = 1.05;
            if (p.x > 1.05) p.x = -0.05;

            const px = p.x * cw;
            const py = p.y * ch;

            if (selectedEffectId === 'floating_hearts') {
              drawGlossyPinkHeart(ctx, px, py, p.size * 0.55, p.rotation, p.alpha * 0.75);
            } else if (selectedEffectId === 'sparkle_glitter') {
              const twinkle = 0.4 + Math.abs(Math.sin(elapsed * 4 + p.hue)) * 0.6;
              ctx.save();
              ctx.translate(px, py);
              ctx.rotate(p.rotation);
              ctx.globalAlpha = twinkle;
              ctx.fillStyle = '#FFFBEB';
              ctx.shadowColor = '#FDE047';
              ctx.shadowBlur = 10;
              const s = p.size * 0.45;
              ctx.beginPath();
              ctx.moveTo(0, -s);
              ctx.quadraticCurveTo(0, 0, s, 0);
              ctx.quadraticCurveTo(0, 0, 0, s);
              ctx.quadraticCurveTo(0, 0, -s, 0);
              ctx.quadraticCurveTo(0, 0, 0, -s);
              ctx.fill();
              ctx.restore();
            } else if (selectedEffectId === 'fireflies') {
              ctx.save();
              const orbGrad = ctx.createRadialGradient(px, py, 1, px, py, p.size);
              orbGrad.addColorStop(0, 'rgba(253, 224, 71, 0.85)');
              orbGrad.addColorStop(0.5, 'rgba(251, 146, 60, 0.35)');
              orbGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
              ctx.fillStyle = orbGrad;
              ctx.beginPath();
              ctx.arc(px, py, p.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            } else if (selectedEffectId === 'snow_dream') {
              ctx.save();
              ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
              ctx.shadowColor = '#E0F2FE';
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(px, cw - py, p.size * 0.25, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            } else if (selectedEffectId === 'confetti_pop') {
              ctx.save();
              ctx.translate(px, ch - py);
              ctx.rotate(p.rotation * 3);
              ctx.fillStyle = `hsl(${p.hue}, 90%, 60%)`;
              ctx.fillRect(-p.size * 0.25, -p.size * 0.12, p.size * 0.5, p.size * 0.24);
              ctx.restore();
            }
          });
        } else if (selectedEffectId === 'neon_aura') {
          const auraGrad = ctx.createRadialGradient(
            faceCenterX,
            faceCenterY,
            headRadius * 0.8,
            faceCenterX,
            faceCenterY,
            cw * 0.75
          );
          auraGrad.addColorStop(0, 'rgba(0,0,0,0)');
          auraGrad.addColorStop(0.65, 'rgba(236, 72, 153, 0.18)');
          auraGrad.addColorStop(1, 'rgba(6, 182, 212, 0.38)');
          ctx.fillStyle = auraGrad;
          ctx.fillRect(0, 0, cw, ch);
        } else if (selectedEffectId === 'rainbow_prism') {
          const prismGrad = ctx.createLinearGradient(0, 0, cw, ch);
          prismGrad.addColorStop(0, 'rgba(255, 0, 128, 0.14)');
          prismGrad.addColorStop(0.3, 'rgba(255, 204, 0, 0.14)');
          prismGrad.addColorStop(0.6, 'rgba(0, 255, 180, 0.14)');
          prismGrad.addColorStop(1, 'rgba(120, 40, 255, 0.18)');
          ctx.fillStyle = prismGrad;
          ctx.fillRect(0, 0, cw, ch);
        } else if (selectedEffectId === 'vhs_glitch') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
          for (let y = 0; y < ch; y += 6) {
            ctx.fillRect(0, y, cw, 2);
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px monospace';
          ctx.fillText('PLAY ▶  VHS-SP', 22, 76);
          ctx.fillText(new Date().toLocaleTimeString(), 22, ch - 190);
        }

        ctx.restore();
      }
    },
    [
      selectedFilterId,
      selectedMaskId,
      selectedEffectId,
      facingMode,
      faceOffset,
      headScale,
      drawGlossyPinkHeart,
    ]
  );

  // Real-time 60fps Canvas Render Loop
  useEffect(() => {
    if (!isOpen) return;
    startTimeRef.current = performance.now();

    const renderFrame = (now: number) => {
      drawCompositeCameraFrame(now, false);
      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, drawCompositeCameraFrame]);

  // Snap Photo (synchronously composites the real user camera + filter + mask + effects onto canvas)
  const handleSnapPhoto = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (flashEnabled) {
      setScreenFlashPulse(true);
      setTimeout(() => setScreenFlashPulse(false), 260);
    }

    drawCompositeCameraFrame(performance.now(), true);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedMedia({
      type: 'photo',
      url: dataUrl,
      thumbnailUrl: dataUrl,
    });
  }, [flashEnabled, drawCompositeCameraFrame]);

  // Start Video Recording (records live composited canvas stream containing real user face + filters)
  const startVideoRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;

    try {
      drawCompositeCameraFrame(performance.now(), true);
      firstFrameThumbRef.current = canvas.toDataURL('image/jpeg', 0.85);
      const canvasStream = canvas.captureStream(30);

      // Attach microphone audio track if available
      if (audioStreamRef.current) {
        const audioTracks = audioStreamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      } else if (streamRef.current) {
        const audioTracks = streamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      }

      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

      const recorder = mimeType
        ? new MediaRecorder(canvasStream, { mimeType })
        : new MediaRecorder(canvasStream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mimeType || 'video/webm',
        });
        const videoObjectUrl = URL.createObjectURL(blob);
        setCapturedMedia({
          type: 'video',
          url: videoObjectUrl,
          thumbnailUrl: firstFrameThumbRef.current,
          durationSec: Math.max(1, recordingSeconds),
        });
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            stopVideoRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      handleSnapPhoto();
    }
  }, [isRecording, recordingSeconds, handleSnapPhoto, drawCompositeCameraFrame]);

  const stopVideoRecording = useCallback(() => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  }, []);

  const handleShutterPointerDown = () => {
    if (captureMode === 'video_toggle') {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
      return;
    }

    isHoldTriggeredRef.current = false;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      isHoldTriggeredRef.current = true;
      startVideoRecording();
    }, 280);
  };

  const handleShutterPointerUp = () => {
    if (captureMode === 'video_toggle') return;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldTriggeredRef.current) {
      stopVideoRecording();
    } else {
      handleSnapPhoto();
    }
  };

  const handleCycleOption = (direction: -1 | 1) => {
    if (activeCategory === 'masks') {
      const idx = SNAP_MASKS.findIndex((m) => m.id === selectedMaskId);
      const nextIdx = (idx + direction + SNAP_MASKS.length) % SNAP_MASKS.length;
      setSelectedMaskId(SNAP_MASKS[nextIdx].id);
    } else if (activeCategory === 'effects') {
      const idx = SNAP_EFFECTS.findIndex((e) => e.id === selectedEffectId);
      const nextIdx = (idx + direction + SNAP_EFFECTS.length) % SNAP_EFFECTS.length;
      setSelectedEffectId(SNAP_EFFECTS[nextIdx].id);
    } else {
      const idx = SNAP_FILTERS.findIndex((f) => f.id === selectedFilterId);
      const nextIdx = (idx + direction + SNAP_FILTERS.length) % SNAP_FILTERS.length;
      setSelectedFilterId(SNAP_FILTERS[nextIdx].id);
    }
  };

  const handleFlipCamera = () => {
    if (videoDevices.length > 1) {
      const currentIdx = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIdx = (currentIdx + 1) % videoDevices.length;
      setSelectedDeviceId(videoDevices[nextIdx].deviceId);
    } else {
      setSelectedDeviceId(null);
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleDownloadCaptured = () => {
    if (!capturedMedia) return;
    const a = document.createElement('a');
    a.href = capturedMedia.url;
    a.download =
      capturedMedia.type === 'photo'
        ? `weedchat-snap-${Date.now()}.jpg`
        : `weedchat-snap-video-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendCaptured = () => {
    if (!capturedMedia) return;
    const activeMask = SNAP_MASKS.find((m) => m.id === selectedMaskId);
    const activeFilter = SNAP_FILTERS.find((f) => f.id === selectedFilterId);
    const defaultCaption =
      captionText.trim() ||
      (capturedMedia.type === 'video'
        ? `🎥 Snap Video (${activeMask?.name || 'Filter'} • ${activeFilter?.name || 'Glam'})`
        : '');

    if (capturedMedia.type === 'photo') {
      onSendPhoto(capturedMedia.url, defaultCaption);
    } else {
      onSendVideo(
        capturedMedia.url,
        capturedMedia.thumbnailUrl,
        defaultCaption,
        capturedMedia.durationSec
      );
    }
    setCapturedMedia(null);
    setCaptionText('');
    onClose();
  };

  if (!isOpen) return null;

  const currentItems =
    activeCategory === 'masks'
      ? SNAP_MASKS
      : activeCategory === 'effects'
      ? SNAP_EFFECTS
      : SNAP_FILTERS;

  const currentSelectedId =
    activeCategory === 'masks'
      ? selectedMaskId
      : activeCategory === 'effects'
      ? selectedEffectId
      : selectedFilterId;

  const activeFilterObj =
    SNAP_FILTERS.find((f) => f.id === selectedFilterId) || SNAP_FILTERS[0];

  return (
    <div
      id="snap-face-filter-camera-modal"
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-0 sm:p-3 select-none animate-in fade-in duration-150"
    >
      {/* Full-Height Portrait Camera Frame */}
      <div className="relative w-full h-full sm:max-w-[395px] sm:max-h-[820px] sm:rounded-[38px] overflow-hidden bg-black shadow-2xl border border-white/15 flex flex-col justify-between">
        {/* Visible Real Hardware Camera <video> Feed (never hidden, so mobile browsers decode frames at 60fps) */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            filter: activeFilterObj.cssFilter || 'none',
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
          }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Live 60FPS AR Face Mask, Effect & Filter Compositing Canvas */}
        <canvas
          ref={canvasRef}
          width={540}
          height={960}
          onPointerDown={(e) => {
            if (capturedMedia) return;
            setIsDraggingFace(true);
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width - 0.5;
            const relY = (e.clientY - rect.top) / rect.height - 0.43;
            setFaceOffset({
              x: Math.max(-0.32, Math.min(0.32, relX)),
              y: Math.max(-0.32, Math.min(0.32, relY)),
            });
          }}
          onPointerMove={(e) => {
            if (!isDraggingFace || capturedMedia) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width - 0.5;
            const relY = (e.clientY - rect.top) / rect.height - 0.43;
            setFaceOffset({
              x: Math.max(-0.32, Math.min(0.32, relX)),
              y: Math.max(-0.32, Math.min(0.32, relY)),
            });
          }}
          onPointerUp={() => setIsDraggingFace(false)}
          className="absolute inset-0 w-full h-full object-cover cursor-crosshair"
        />

        {/* Camera Permission / Retry Prompt (only shown if browser blocked camera access) */}
        {cameraError && !capturedMedia && (
          <div className="absolute inset-x-6 top-1/3 z-30 p-5 rounded-3xl bg-black/80 backdrop-blur-md border border-white/20 text-center space-y-3 shadow-2xl">
            <Camera className="w-9 h-9 text-pink-400 mx-auto" />
            <p className="text-xs font-bold text-white leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={() => startRealUserCamera()}
              className="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold cursor-pointer active:scale-95 transition-all"
            >
              Enable Live Camera
            </button>
          </div>
        )}

        {/* Front Screen Flash White Overlay when snapping with flash enabled */}
        {screenFlashPulse && (
          <div className="absolute inset-0 z-40 bg-white animate-out fade-out duration-300 pointer-events-none" />
        )}

        {/* Top Translucent Camera Bar */}
        <div className="relative z-20 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/65 via-black/25 to-transparent">
          <button
            id="snap-camera-close-btn"
            type="button"
            onClick={() => {
              if (isRecording) stopVideoRecording();
              setCapturedMedia(null);
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Active Lens Status Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>
              {SNAP_MASKS.find((m) => m.id === selectedMaskId)?.name || 'Mask'} ·{' '}
              {SNAP_FILTERS.find((f) => f.id === selectedFilterId)?.name || 'Filter'}
            </span>
          </div>

          {/* Switch Front Selfie Cam / Back Camera */}
          <button
            id="snap-camera-source-toggle-btn"
            type="button"
            onClick={handleFlipCamera}
            className="px-2.5 py-1.5 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
            title="Switch Front / Back Live Camera"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{facingMode === 'user' ? 'Front Cam' : 'Rear Cam'}</span>
          </button>
        </div>

        {/* Recording Timer Pill when recording video */}
        {isRecording && (
          <div className="relative z-20 self-center mt-1 px-3.5 py-1 rounded-full bg-rose-600/90 text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="font-mono tabular-nums">
              REC 00:{String(recordingSeconds).padStart(2, '0')} / 00:15
            </span>
          </div>
        )}

        {/* Captured Photo / Recorded Video Preview & Send Overlay */}
        {capturedMedia ? (
          <div className="absolute inset-0 z-30 bg-black flex flex-col justify-between animate-in fade-in duration-150">
            <div className="relative flex-1 w-full h-full overflow-hidden">
              {capturedMedia.type === 'photo' ? (
                <img
                  src={capturedMedia.url}
                  alt="Captured Snap"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={capturedMedia.url}
                  poster={capturedMedia.thumbnailUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}

              {/* Top Preview Actions */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <button
                  id="snap-preview-retake-btn"
                  type="button"
                  onClick={() => setCapturedMedia(null)}
                  className="px-3.5 py-2 rounded-full bg-black/55 hover:bg-black/75 text-white text-xs font-bold backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake</span>
                </button>

                <button
                  id="snap-preview-download-btn"
                  type="button"
                  onClick={handleDownloadCaptured}
                  className="px-3.5 py-2 rounded-full bg-black/55 hover:bg-black/75 text-white text-xs font-bold backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Bottom Caption & Send Bar */}
            <div className="p-4 bg-black/90 border-t border-white/15 space-y-3">
              <input
                id="snap-caption-input"
                type="text"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder={`Add a caption for ${recipientName}...`}
                className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-xs outline-none focus:border-pink-400"
              />
              <div className="flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setCapturedMedia(null)}
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Discard
                </button>
                <button
                  id="snap-send-to-chat-btn"
                  type="button"
                  onClick={handleSendCaptured}
                  style={{ backgroundColor: primaryColor }}
                  className="flex-1 py-2.5 px-5 rounded-full text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    Send {capturedMedia.type === 'video' ? 'Video' : 'Photo'} to {recipientName}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Bottom Snapchat Camera Controls Overlay */
          <div className="relative z-20 mt-auto pt-8 pb-4 px-4 bg-gradient-to-t from-black/80 via-black/45 to-transparent flex flex-col items-center">
            {/* Horizontal scrollable quick-picker for current category (Masks / Effects / Filters) */}
            <div className="w-full flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar justify-start sm:justify-center">
              {currentItems.map((item) => {
                const isSelected = item.id === currentSelectedId;
                return (
                  <button
                    key={item.id}
                    id={`snap-item-${activeCategory}-${item.id}`}
                    type="button"
                    onClick={() => {
                      if (activeCategory === 'masks') setSelectedMaskId(item.id);
                      else if (activeCategory === 'effects') setSelectedEffectId(item.id);
                      else setSelectedFilterId(item.id);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 flex items-center gap-1 transition-all cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-md scale-105'
                        : 'bg-black/40 text-white/85 hover:bg-black/60 border border-white/15'
                    }`}
                  >
                    <span>{item.badge}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* "Hold for video, Tap for photo" label + quick mode toggle */}
            <div className="flex items-center gap-2 mb-3">
              <p className="text-white text-xs sm:text-[13px] font-semibold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                Hold for video, Tap for photo
              </p>
              <button
                id="snap-toggle-video-mode-btn"
                type="button"
                onClick={() =>
                  setCaptureMode((prev) =>
                    prev === 'tap_or_hold' ? 'video_toggle' : 'tap_or_hold'
                  )
                }
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  captureMode === 'video_toggle'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-white/20 text-white/90 hover:bg-white/30'
                }`}
                title="Switch between Hold-to-Record and Tap-to-Record Video"
              >
                {captureMode === 'video_toggle' ? (
                  <>
                    <Video className="w-3 h-3" />
                    <span>Video Mode</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3 h-3" />
                    <span>Auto</span>
                  </>
                )}
              </button>
            </div>

            {/* Main Shutter Row: [Flip Camera]   [Large White Shutter Ring]   [Flash Bolt] */}
            <div className="w-full flex items-center justify-around max-w-[290px] mb-5">
              {/* Left: Flip Front/Back Camera Icon */}
              <button
                id="snap-flip-camera-btn"
                type="button"
                onClick={handleFlipCamera}
                className="w-11 h-11 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-xs text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="Flip Front/Back Camera"
              >
                <RefreshCw className="w-6 h-6 stroke-[2.2] drop-shadow" />
              </button>

              {/* Center: Large Circular White Shutter Ring */}
              <button
                id="snap-shutter-btn"
                type="button"
                onPointerDown={handleShutterPointerDown}
                onPointerUp={handleShutterPointerUp}
                className={`w-[74px] h-[74px] rounded-full border-[5px] flex items-center justify-center transition-all cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
                  isRecording
                    ? 'border-rose-500 scale-110 bg-rose-500/30'
                    : 'border-white hover:scale-105 active:scale-95 bg-white/10'
                }`}
                title="Tap for photo, Hold for video"
              >
                {isRecording ? (
                  <span className="w-7 h-7 rounded-md bg-rose-500 animate-pulse" />
                ) : captureMode === 'video_toggle' ? (
                  <span className="w-5 h-5 rounded-full bg-rose-500" />
                ) : null}
              </button>

              {/* Right: Flash Lightning Bolt Icon */}
              <button
                id="snap-flash-toggle-btn"
                type="button"
                onClick={() => setFlashEnabled((prev) => !prev)}
                className={`w-11 h-11 rounded-full backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                  flashEnabled
                    ? 'bg-amber-400/25 text-amber-300'
                    : 'bg-black/25 hover:bg-black/45 text-white'
                }`}
                title={flashEnabled ? 'Flash On' : 'Flash Off'}
              >
                {flashEnabled ? (
                  <Zap className="w-6 h-6 fill-current drop-shadow" />
                ) : (
                  <ZapOff className="w-6 h-6 stroke-[2.2] drop-shadow" />
                )}
              </button>
            </div>

            {/* Bottom Category Navigation Bar: <   (•) Masks   ( ) Effects   ( ) Filters   > */}
            <div className="w-full flex items-center justify-between px-2">
              <button
                id="snap-prev-option-btn"
                type="button"
                onClick={() => handleCycleOption(-1)}
                className="p-2 text-white hover:text-pink-300 transition-colors cursor-pointer active:scale-90"
                title="Previous lens"
              >
                <ChevronLeft className="w-7 h-7 stroke-[2.6] drop-shadow" />
              </button>

              <div className="flex items-center gap-8">
                {(
                  [
                    { id: 'masks', label: 'Masks' },
                    { id: 'effects', label: 'Effects' },
                    { id: 'filters', label: 'Filters' },
                  ] as { id: SnapCameraCategory; label: string }[]
                ).map((tab) => {
                  const isActive = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`snap-category-tab-${tab.id}`}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isActive
                            ? 'border-white scale-105'
                            : 'border-white/75 group-hover:border-white'
                        }`}
                      >
                        {isActive && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </span>
                      <span
                        className={`text-xs tracking-wide transition-all drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${
                          isActive ? 'text-white font-bold' : 'text-white/80 font-medium'
                        }`}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                id="snap-next-option-btn"
                type="button"
                onClick={() => handleCycleOption(1)}
                className="p-2 text-white hover:text-pink-300 transition-colors cursor-pointer active:scale-90"
                title="Next lens"
              >
                <ChevronRight className="w-7 h-7 stroke-[2.6] drop-shadow" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
