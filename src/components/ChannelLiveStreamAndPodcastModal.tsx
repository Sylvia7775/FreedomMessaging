import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  Eye,
  Send,
  CheckCircle2,
  Radio,
  Headphones,
  Edit2,
  Trash2,
  Check,
  Camera,
  Download,
} from 'lucide-react';
import { ChannelLiveChatMessage, UserContact } from '../types';
import { SNAP_MASKS, SNAP_EFFECTS, SNAP_FILTERS } from './SnapFaceFilterCameraModal';
import { getCleanAvatar } from '../lib/avatarHelper';

export type LiveBroadcastMode = 'live' | 'podcast';

interface ChannelLiveStreamAndPodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: UserContact;
  streamMsgId: string;
  streamTitle: string;
  initialMode?: LiveBroadcastMode;
  initialCameraOn?: boolean;
  initialMicOn?: boolean;
  initialFilterId?: string;
  initialMaskId?: string;
  isChannelCreator: boolean;
  subscribersCount: number;
  liveChatMessages: ChannelLiveChatMessage[];
  liveChatInput: string;
  onChangeLiveChatInput: (val: string) => void;
  onSendLiveChatMessage: (e?: React.FormEvent, quickText?: string) => void;
  onRenameStream: (msgId: string, newTitle: string) => void;
  onDeleteStream: (msgId: string) => void;
  primaryColor?: string;
}

export const ChannelLiveStreamAndPodcastModal: React.FC<
  ChannelLiveStreamAndPodcastModalProps
> = ({
  isOpen,
  onClose,
  contact,
  streamMsgId,
  streamTitle,
  initialMode = 'live',
  initialCameraOn = true,
  initialMicOn = true,
  initialFilterId = 'normal',
  initialMaskId = 'none',
  isChannelCreator,
  subscribersCount,
  liveChatMessages,
  liveChatInput,
  onChangeLiveChatInput,
  onSendLiveChatMessage,
  onRenameStream,
  onDeleteStream,
  primaryColor = '#10B981',
}) => {
  const [broadcastMode, setBroadcastMode] = useState<LiveBroadcastMode>(initialMode);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(initialCameraOn);
  const [isMicOn, setIsMicOn] = useState<boolean>(initialMicOn);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // On-stream Filters, Face Masks & Effects
  const [showFilterTray, setShowFilterTray] = useState<boolean>(false);
  const [selectedMaskId, setSelectedMaskId] = useState<string>(initialMaskId);
  const [selectedEffectId, setSelectedEffectId] = useState<string>('none');
  const [selectedFilterId, setSelectedFilterId] = useState<string>(initialFilterId);

  // Real-time Face Tracking / Touch Drag Position
  const [faceOffset, setFaceOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [headScale, setHeadScale] = useState<number>(1);
  const [isDraggingFace, setIsDraggingFace] = useState<boolean>(false);

  // Live Cam Snapshot Preview
  const [liveSnapshotUrl, setLiveSnapshotUrl] = useState<string | null>(null);
  const [flashPulse, setFlashPulse] = useState<boolean>(false);

  // Rename state
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleDraft, setTitleDraft] = useState<string>(streamTitle);

  // Viewer count & status toast
  const [viewerCount, setViewerCount] = useState<number>(() =>
    Math.max(0, subscribersCount > 1 ? subscribersCount - 1 : 0)
  );
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setBroadcastMode(initialMode);
    setIsCameraOn(initialCameraOn);
    setIsMicOn(initialMicOn);
    setSelectedFilterId(initialFilterId || 'normal');
    setSelectedMaskId(initialMaskId || 'none');
    setTitleDraft(streamTitle);
  }, [
    initialMode,
    initialCameraOn,
    initialMicOn,
    initialFilterId,
    initialMaskId,
    streamTitle,
    streamMsgId,
  ]);

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 2200);
  };

  const stopStreams = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Acquire REAL hardware user camera stream with progressive fallback (never uses mock images)
  const startRealStreamCamera = useCallback(async () => {
    if (!isOpen) return;

    if (!isCameraOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported on this browser.');
      return;
    }

    setCameraError(null);

    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      let stream: MediaStream | null = null;

      // Attempt 1: Selected deviceId or ideal facingMode (video only so mic permission never blocks camera)
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
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch {
        // Attempt 2: Simple facingMode constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
        } catch {
          // Attempt 3: Any available hardware camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      mediaStreamRef.current = stream;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
      } catch {}

      if (videoRef.current) {
        const vid = videoRef.current;
        vid.srcObject = stream;
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

      // Acquire microphone separately so audio permissions never block live video
      if (isMicOn && !audioStreamRef.current) {
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: false })
          .then((aud) => {
            aud.getAudioTracks().forEach((t) => {
              t.enabled = isMicOn;
            });
            audioStreamRef.current = aud;
          })
          .catch(() => {});
      }
    } catch (err: any) {
      setCameraReady(false);
      setCameraError(
        err?.message || 'Please allow camera permission in your browser to broadcast your live camera.'
      );
    }
  }, [isOpen, isCameraOn, facingMode, selectedDeviceId, isMicOn]);

  useEffect(() => {
    if (!isOpen) {
      stopStreams();
      return;
    }
    startRealStreamCamera();
    return () => {
      stopStreams();
    };
  }, [isOpen, startRealStreamCamera, stopStreams]);

  useEffect(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveChatMessages.length]);

  // Native hardware FaceDetector tracking when available
  useEffect(() => {
    if (!isOpen || !isCameraOn || !cameraReady || isDraggingFace) return;
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
    }, 150);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [isOpen, isCameraOn, cameraReady, facingMode, isDraggingFace]);

  const drawHeart = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      tilt: number
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.shadowColor = 'rgba(255, 90, 170, 0.65)';
      ctx.shadowBlur = size * 0.4;
      ctx.beginPath();
      const topCurve = size * 0.32;
      ctx.moveTo(0, topCurve);
      ctx.bezierCurveTo(0, 0, -size, 0, -size, topCurve);
      ctx.bezierCurveTo(-size, size * 0.75, 0, size * 1.05, 0, size * 1.3);
      ctx.bezierCurveTo(0, size * 1.05, size, size * 0.75, size, topCurve);
      ctx.bezierCurveTo(size, 0, 0, 0, 0, topCurve);
      ctx.closePath();
      const g = ctx.createRadialGradient(-size * 0.25, size * 0.25, 2, 0, size * 0.5, size * 1.2);
      g.addColorStop(0, '#FFE4F2');
      g.addColorStop(0.4, '#FF8CC6');
      g.addColorStop(1, '#E11D74');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    },
    []
  );

  // Composite real user camera + active filter + AR face mask + effects onto canvas
  const drawLiveCompositeFrame = useCallback(
    (now: number, forceOpaqueBg = false) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);

      const activeFilter =
        SNAP_FILTERS.find((f) => f.id === selectedFilterId) || SNAP_FILTERS[0];

      if (isCameraOn) {
        const vid = videoRef.current;
        const hasLiveWebcam = Boolean(
          vid && vid.readyState >= 2 && vid.videoWidth > 0 && vid.videoHeight > 0
        );

        if (hasLiveWebcam && vid) {
          ctx.save();
          try {
            ctx.filter = activeFilter.cssFilter || 'none';
          } catch {}
          const vw = vid.videoWidth;
          const vh = vid.videoHeight;
          const scale = Math.max(cw / vw, ch / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;
          if (facingMode === 'user') {
            ctx.translate(cw, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(vid, dx, dy, dw, dh);
          ctx.restore();
        } else if (forceOpaqueBg) {
          ctx.fillStyle = '#090D16';
          ctx.fillRect(0, 0, cw, ch);
        }

        if (activeFilter.tintColor) {
          ctx.save();
          ctx.fillStyle = activeFilter.tintColor;
          ctx.fillRect(0, 0, cw, ch);
          ctx.restore();
        }

        const fcx = cw * (0.5 + faceOffset.x) + Math.sin(elapsed * 1.5) * 3;
        const fcy = ch * (0.43 + faceOffset.y) + Math.cos(elapsed * 1.9) * 3;
        const hr = cw * 0.24 * headScale;

        if (selectedMaskId === 'heart_crown') {
          // Cheek blush
          [fcx - hr * 0.55, fcx + hr * 0.55].forEach((cxPos) => {
            const blush = ctx.createRadialGradient(
              cxPos,
              fcy + hr * 0.18,
              2,
              cxPos,
              fcy + hr * 0.18,
              hr * 0.4
            );
            blush.addColorStop(0, 'rgba(255, 105, 165, 0.34)');
            blush.addColorStop(1, 'rgba(255, 105, 165, 0)');
            ctx.fillStyle = blush;
            ctx.beginPath();
            ctx.arc(cxPos, fcy + hr * 0.18, hr * 0.4, 0, Math.PI * 2);
            ctx.fill();
          });

          const crown = [
            { a: -138, d: 1.28, s: 21, t: -0.35 },
            { a: -115, d: 1.12, s: 27, t: -0.2 },
            { a: -90, d: 1.2, s: 32, t: 0 },
            { a: -65, d: 1.12, s: 27, t: 0.2 },
            { a: -42, d: 1.28, s: 21, t: 0.35 },
          ];
          crown.forEach((c, idx) => {
            const rad = (c.a * Math.PI) / 180;
            const bob = Math.sin(elapsed * 2.8 + idx) * 4;
            drawHeart(
              ctx,
              fcx + Math.cos(rad) * hr * c.d,
              fcy + Math.sin(rad) * hr * c.d - hr * 0.1 + bob,
              c.s * (cw / 420) * headScale,
              c.t
            );
          });
        } else if (selectedMaskId === 'gold_crown') {
          ctx.save();
          ctx.font = `${Math.round(68 * (cw / 420) * headScale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('👑', fcx, fcy - hr * 1.05 + Math.sin(elapsed * 2.2) * 4);
          ctx.restore();
        } else if (selectedMaskId === 'cool_shades') {
          ctx.save();
          ctx.font = `${Math.round(74 * (cw / 420) * headScale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🕶️', fcx, fcy - hr * 0.08);
          ctx.restore();
        } else if (selectedMaskId === 'dog_ears') {
          ctx.save();
          ctx.font = `${Math.round(64 * (cw / 420) * headScale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐶', fcx, fcy - hr * 0.95);
          ctx.restore();
        } else if (selectedMaskId === 'neon_cat') {
          ctx.save();
          ctx.font = `${Math.round(62 * (cw / 420) * headScale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐱', fcx, fcy - hr * 0.95);
          ctx.restore();
        } else if (selectedMaskId === 'butterfly_halo') {
          [-125, -90, -55].forEach((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            ctx.save();
            ctx.font = `${Math.round(34 * (cw / 420) * headScale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(
              '🦋',
              fcx + Math.cos(rad) * hr * 1.15,
              fcy + Math.sin(rad) * hr * 1.1 + Math.sin(elapsed * 4 + i) * 5
            );
            ctx.restore();
          });
        }

        if (selectedEffectId === 'floating_hearts') {
          for (let i = 0; i < 8; i++) {
            const py = ((1 - ((elapsed * 0.14 + i * 0.13) % 1)) * ch) | 0;
            const px = (cw * (0.15 + ((i * 0.19) % 0.7)) + Math.sin(elapsed * 2 + i) * 18) | 0;
            drawHeart(ctx, px, py, 12, Math.sin(elapsed + i) * 0.3);
          }
        } else if (selectedEffectId === 'sparkle_glitter') {
          ctx.save();
          ctx.font = '20px sans-serif';
          for (let i = 0; i < 10; i++) {
            const px = cw * ((i * 0.17 + 0.08) % 0.9);
            const py = ch * ((i * 0.23 + 0.1) % 0.85);
            ctx.globalAlpha = 0.35 + Math.abs(Math.sin(elapsed * 3.5 + i)) * 0.65;
            ctx.fillText('✨', px, py);
          }
          ctx.restore();
        } else if (selectedEffectId === 'neon_aura') {
          const aura = ctx.createRadialGradient(fcx, fcy, hr * 0.6, fcx, fcy, cw * 0.75);
          aura.addColorStop(0, 'rgba(0,0,0,0)');
          aura.addColorStop(0.7, 'rgba(236, 72, 153, 0.22)');
          aura.addColorStop(1, 'rgba(6, 182, 212, 0.38)');
          ctx.fillStyle = aura;
          ctx.fillRect(0, 0, cw, ch);
        }
      } else {
        const bg = ctx.createLinearGradient(0, 0, 0, ch);
        bg.addColorStop(0, broadcastMode === 'podcast' ? '#1E1B4B' : '#1F1624');
        bg.addColorStop(0.5, '#111827');
        bg.addColorStop(1, '#090D16');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cw, ch);

        const cx = cw / 2;
        const cy = ch * 0.42;
        if (isMicOn) {
          for (let r = 1; r <= 3; r++) {
            const pulse = ((elapsed * 1.4 + r * 0.33) % 1) * 85;
            const alpha = Math.max(0, 0.45 - pulse / 190);
            ctx.beginPath();
            ctx.arc(cx, cy, 55 + pulse, 0, Math.PI * 2);
            ctx.strokeStyle =
              broadcastMode === 'podcast'
                ? `rgba(167, 139, 250, ${alpha})`
                : `rgba(244, 63, 94, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }
      }
    },
    [
      isCameraOn,
      isMicOn,
      broadcastMode,
      selectedMaskId,
      selectedEffectId,
      selectedFilterId,
      facingMode,
      faceOffset,
      headScale,
      drawHeart,
    ]
  );

  useEffect(() => {
    if (!isOpen) return;
    startTimeRef.current = performance.now();

    const renderLoop = (now: number) => {
      drawLiveCompositeFrame(now, false);
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, drawLiveCompositeFrame]);

  // Take a live cam snapshot with the active filter & mask baked in
  const handleTakeLiveCamSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setFlashPulse(true);
    setTimeout(() => setFlashPulse(false), 240);

    drawLiveCompositeFrame(performance.now(), true);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setLiveSnapshotUrl(dataUrl);
    triggerToast('📸 Captured Live Cam Snapshot with Filter!');
  };

  if (!isOpen) return null;

  const hostHandleName = contact.name.toLowerCase();
  const activeFilterObj =
    SNAP_FILTERS.find((f) => f.id === selectedFilterId) || SNAP_FILTERS[0];

  const defaultSeedMessages: ChannelLiveChatMessage[] = [
    {
      id: 'seed_join_1',
      channelId: contact.id,
      streamId: `${contact.id}_${streamMsgId}`,
      senderId: 'user_shivanshu',
      senderName: 'Shivanshu',
      senderAvatar: getCleanAvatar('Shivanshu', undefined, '#6366F1', 'user_shivanshu'),
      text: 'Shivanshu joined the stream.',
      createdAt: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: 'seed_msg_2',
      channelId: contact.id,
      streamId: `${contact.id}_${streamMsgId}`,
      senderId: 'user_shivanshu',
      senderName: 'Shivanshu',
      senderAvatar: getCleanAvatar('Shivanshu', undefined, '#6366F1', 'user_shivanshu'),
      text: 'Hey how are you',
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: 'seed_msg_3',
      channelId: contact.id,
      streamId: `${contact.id}_${streamMsgId}`,
      senderId: contact.id,
      senderName: hostHandleName,
      senderAvatar: contact.avatar,
      text: 'Im Fine',
      createdAt: new Date(Date.now() - 30000).toISOString(),
    },
  ];

  const displayedChatMessages =
    liveChatMessages.length > 0
      ? [...defaultSeedMessages, ...liveChatMessages]
      : defaultSeedMessages;

  return (
    <div
      id="channel-active-live-stream-chat-modal"
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-0 sm:p-3 select-none animate-in fade-in duration-150"
    >
      <div className="relative w-full h-full sm:max-w-[400px] sm:max-h-[820px] sm:rounded-[34px] overflow-hidden bg-black shadow-2xl border border-white/15 flex flex-col justify-between">
        {/* Visible Real Hardware Camera <video> Feed (never hidden so mobile browsers decode frames at 60fps) */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            filter: activeFilterObj.cssFilter || 'none',
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            opacity: isCameraOn ? 1 : 0,
          }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Real-Time AR Mask, Filter & Effect Compositing Canvas */}
        <canvas
          ref={canvasRef}
          width={540}
          height={960}
          onPointerDown={(e) => {
            if (!isCameraOn) return;
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
            if (!isDraggingFace || !isCameraOn) return;
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

        {flashPulse && (
          <div className="absolute inset-0 z-40 bg-white animate-out fade-out duration-250 pointer-events-none" />
        )}

        {/* Camera Permission Prompt if blocked */}
        {isCameraOn && cameraError && (
          <div className="absolute inset-x-6 top-1/3 z-30 p-4 rounded-3xl bg-black/80 backdrop-blur-md border border-white/20 text-center space-y-2.5 shadow-2xl">
            <Camera className="w-8 h-8 text-pink-400 mx-auto" />
            <p className="text-xs font-bold text-white leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={() => startRealStreamCamera()}
              className="px-4 py-1.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold cursor-pointer active:scale-95 transition-all"
            >
              Enable Live Camera
            </button>
          </div>
        )}

        {/* Live Snapshot Preview Mini-Card when user takes a snapshot during Live Cam */}
        {liveSnapshotUrl && (
          <div className="absolute top-20 left-3.5 z-30 w-28 rounded-2xl overflow-hidden bg-black/85 border-2 border-white/80 shadow-2xl animate-in zoom-in-95 duration-150">
            <img
              src={liveSnapshotUrl}
              alt="Live Cam Snapshot"
              className="w-full aspect-[3/4] object-cover"
            />
            <div className="p-1.5 flex items-center justify-between gap-1 bg-black/90">
              <a
                href={liveSnapshotUrl}
                download={`live-cam-snap-${Date.now()}.jpg`}
                className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Save</span>
              </a>
              <button
                type="button"
                onClick={() => setLiveSnapshotUrl(null)}
                className="p-1 rounded-lg bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                title="Dismiss snapshot"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {!isCameraOn && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6 text-center -mt-12">
            <div className="relative">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-24 h-24 rounded-full object-cover border-3 border-pink-500 shadow-2xl"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-pink-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                {broadcastMode === 'podcast' ? 'Podcast' : 'Live'}
              </span>
            </div>
            <h3 className="mt-4 text-base font-extrabold text-white drop-shadow">
              {streamTitle}
            </h3>
            <p className="text-xs text-white/75 mt-1 flex items-center gap-1.5">
              {broadcastMode === 'podcast' ? (
                <>
                  <Headphones className="w-3.5 h-3.5 text-purple-400" />
                  <span>Live Audio Podcast • {isMicOn ? 'Mic Live' : 'Mic Muted'}</span>
                </>
              ) : (
                <>
                  <VideoOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Camera Off • {isMicOn ? 'Audio Streaming' : 'Mic Muted'}</span>
                </>
              )}
            </p>
          </div>
        )}

        {isCameraOn && broadcastMode === 'podcast' && (
          <div className="relative z-20 self-start ml-3.5 mt-14 px-3 py-1 rounded-full bg-purple-600/85 backdrop-blur-md text-white text-[10px] font-extrabold flex items-center gap-1.5 shadow-lg">
            <Headphones className="w-3.5 h-3.5 animate-bounce" />
            <span>LIVE VIDEO PODCAST • {streamTitle}</span>
          </div>
        )}

        <div className="relative z-20 flex items-start justify-between px-3.5 pt-3.5">
          <div className="flex flex-col gap-1.5 max-w-[78%]">
            <div className="flex items-center gap-2 flex-wrap">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-8 h-8 rounded-full object-cover border border-white/80 shadow-md shrink-0"
              />
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-white text-xs sm:text-[13px] font-bold tracking-tight truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                  {hostHandleName}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white/25 shrink-0 drop-shadow" />
              </div>

              <button
                id="live-stream-mode-badge-btn"
                type="button"
                onClick={() => {
                  const next = broadcastMode === 'live' ? 'podcast' : 'live';
                  setBroadcastMode(next);
                  triggerToast(
                    next === 'podcast' ? '🎙️ Switched to Live Podcast Mode' : '🔴 Switched to Live Stream Mode'
                  );
                }}
                className={`px-2 py-0.5 rounded-[5px] text-white text-[11px] font-extrabold tracking-tight shadow-sm cursor-pointer transition-all ${
                  broadcastMode === 'podcast' ? 'bg-purple-600' : 'bg-[#E1306C]'
                }`}
                title="Click to switch between Live Stream and Live Podcast"
              >
                {broadcastMode === 'podcast' ? 'Podcast' : 'Live'}
              </button>

              <div className="px-2 py-0.5 rounded-[5px] bg-black/35 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs">
                <Eye className="w-3.5 h-3.5 text-white/90" />
                <span>{viewerCount}</span>
              </div>
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white/10 text-white text-xs font-bold outline-none w-36"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    onRenameStream(streamMsgId, titleDraft);
                    setIsEditingTitle(false);
                  }}
                  className="p-1 rounded-lg bg-emerald-500 text-white cursor-pointer"
                  title="Save title"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 rounded-lg bg-white/15 text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-1">
                <span className="text-[11px] text-white/90 font-semibold drop-shadow truncate max-w-[180px]">
                  {streamTitle}
                </span>
                {isChannelCreator && (
                  <>
                    <button
                      id="live-modal-rename-btn"
                      type="button"
                      onClick={() => {
                        setTitleDraft(streamTitle);
                        setIsEditingTitle(true);
                      }}
                      className="p-1 rounded-full bg-black/35 hover:bg-black/60 text-white/90 cursor-pointer"
                      title="Rename live stream / podcast"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      id="live-modal-delete-btn"
                      type="button"
                      onClick={() => onDeleteStream(streamMsgId)}
                      className="p-1 rounded-full bg-black/35 hover:bg-rose-600/80 text-white/90 cursor-pointer"
                      title="Delete live stream / podcast"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3.5 pt-0.5">
            <button
              id="live-modal-close-btn"
              type="button"
              onClick={onClose}
              className="text-white hover:text-white/80 active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]"
              title="Leave Live Stream"
            >
              <X className="w-6 h-6 stroke-[2.4]" />
            </button>

            <button
              id="live-stream-flip-camera-btn"
              type="button"
              onClick={() => {
                if (videoDevices.length > 1) {
                  const idx = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
                  const nextIdx = (idx + 1) % videoDevices.length;
                  setSelectedDeviceId(videoDevices[nextIdx].deviceId);
                } else {
                  setSelectedDeviceId(null);
                }
                setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
                triggerToast('🔄 Switched Live Camera');
              }}
              className="text-white hover:text-white/80 active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]"
              title="Flip Front / Back Camera"
            >
              <RefreshCw className="w-5 h-5 stroke-[2.2]" />
            </button>

            <button
              id="live-stream-toggle-camera-btn"
              type="button"
              onClick={() => {
                const next = !isCameraOn;
                setIsCameraOn(next);
                triggerToast(next ? '📹 Live Camera Turned ON' : '🚫 Live Camera Turned OFF');
              }}
              className={`active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] ${
                isCameraOn ? 'text-white' : 'text-rose-400'
              }`}
              title={isCameraOn ? 'Turn Off Live Camera' : 'Turn On Live Camera'}
            >
              {isCameraOn ? (
                <Video className="w-5 h-5 fill-white text-white" />
              ) : (
                <VideoOff className="w-5 h-5 stroke-[2.3]" />
              )}
            </button>

            <button
              id="live-stream-toggle-mic-btn"
              type="button"
              onClick={() => {
                const next = !isMicOn;
                setIsMicOn(next);
                triggerToast(next ? '🎙️ Live Microphone Turned ON' : '🔇 Live Microphone Muted');
              }}
              className={`active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] ${
                isMicOn ? 'text-white' : 'text-rose-400'
              }`}
              title={isMicOn ? 'Mute Live Microphone' : 'Unmute Live Microphone'}
            >
              {isMicOn ? (
                <Mic className="w-5 h-5 stroke-[2.3]" />
              ) : (
                <MicOff className="w-5 h-5 stroke-[2.3]" />
              )}
            </button>

            <button
              id="live-stream-toggle-filters-btn"
              type="button"
              onClick={() => setShowFilterTray((prev) => !prev)}
              className={`active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] ${
                showFilterTray || selectedMaskId !== 'none' || selectedFilterId !== 'normal'
                  ? 'text-pink-400 scale-110'
                  : 'text-white'
              }`}
              title="Toggle Live Stream Face Filters, Masks & Effects"
            >
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </button>

            {isCameraOn && (
              <button
                id="live-stream-snap-capture-btn"
                type="button"
                onClick={handleTakeLiveCamSnapshot}
                className="text-white hover:text-pink-300 active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]"
                title="Take Live Cam Snapshot with Active Filter"
              >
                <Camera className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}

            <button
              id="live-stream-toggle-podcast-btn"
              type="button"
              onClick={() => {
                const next = broadcastMode === 'live' ? 'podcast' : 'live';
                setBroadcastMode(next);
                triggerToast(
                  next === 'podcast' ? '🎙️ Podcast Mode Active' : '🔴 Live Video Stream Active'
                );
              }}
              className={`active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] ${
                broadcastMode === 'podcast' ? 'text-purple-400 scale-110' : 'text-white'
              }`}
              title="Switch between Live Stream and Podcast"
            >
              {broadcastMode === 'podcast' ? (
                <Headphones className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <Radio className="w-5 h-5 stroke-[2.2]" />
              )}
            </button>
          </div>
        </div>

        {statusToast && (
          <div className="relative z-30 self-center px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-bold border border-white/15 animate-in fade-in duration-150">
            {statusToast}
          </div>
        )}

        <div className="relative z-20 mt-auto flex flex-col justify-end pt-10 pb-3.5 px-3.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
          {showFilterTray && (
            <div className="mb-3 p-2.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 space-y-2 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Live Cam Filters & Face Masks</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMaskId('none');
                    setSelectedEffectId('none');
                    setSelectedFilterId('normal');
                    triggerToast('Cleared all live filters');
                  }}
                  className="text-[10px] font-bold text-white/70 hover:text-white cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {SNAP_MASKS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMaskId(m.id === selectedMaskId ? 'none' : m.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-all ${
                      selectedMaskId === m.id
                        ? 'bg-pink-500 text-white shadow'
                        : 'bg-white/10 text-white/85 hover:bg-white/20'
                    }`}
                  >
                    <span>{m.badge}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {SNAP_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilterId(f.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-all ${
                      selectedFilterId === f.id
                        ? 'bg-white text-slate-900 shadow'
                        : 'bg-white/10 text-white/85 hover:bg-white/20'
                    }`}
                  >
                    <span>{f.badge}</span>
                    <span>{f.name}</span>
                  </button>
                ))}
                {SNAP_EFFECTS.map((ef) => (
                  <button
                    key={ef.id}
                    type="button"
                    onClick={() =>
                      setSelectedEffectId(ef.id === selectedEffectId ? 'none' : ef.id)
                    }
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-all ${
                      selectedEffectId === ef.id
                        ? 'bg-purple-500 text-white shadow'
                        : 'bg-white/10 text-white/85 hover:bg-white/20'
                    }`}
                  >
                    <span>{ef.badge}</span>
                    <span>{ef.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="w-full max-h-52 overflow-y-auto no-scrollbar space-y-2.5 mb-3 pr-6">
            {displayedChatMessages.map((msg) => {
              const isHostMsg =
                msg.senderId === contact.id ||
                msg.senderName.toLowerCase() === hostHandleName;
              return (
                <div
                  key={msg.id}
                  className="flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-150"
                >
                  <img
                    src={
                      msg.senderAvatar ||
                      getCleanAvatar(msg.senderName, undefined, primaryColor, msg.senderId)
                    }
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/60 shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-white text-xs font-extrabold leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                        {msg.senderName.replace(' (Channel Member)', '')}
                      </span>
                      {isHostMsg && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white/30 shrink-0 drop-shadow" />
                      )}
                    </div>
                    <p className="text-white/95 text-xs font-medium leading-snug break-words drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              onSendLiveChatMessage(e);
              setViewerCount((v) => Math.max(1, v));
            }}
            className="flex items-center gap-2.5 w-full"
          >
            <input
              id="channel-live-chat-input"
              type="text"
              value={liveChatInput}
              onChange={(e) => onChangeLiveChatInput(e.target.value)}
              placeholder="Send a message"
              className="flex-1 px-4 py-2.5 rounded-full border-[1.8px] border-white/90 bg-black/20 backdrop-blur-2xs text-white placeholder-white/90 text-xs sm:text-sm font-medium outline-none focus:bg-black/35 transition-all"
            />
            <button
              id="channel-live-chat-send-btn"
              type="submit"
              className="p-2 text-white hover:scale-105 active:scale-90 transition-transform cursor-pointer shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              title="Send message"
            >
              <Send className="w-6 h-6 text-white fill-white rotate-12" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
