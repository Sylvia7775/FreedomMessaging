import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  QrCode,
  Upload,
  RefreshCw,
  Zap,
  ZapOff,
  UserCheck,
  Globe,
  Sparkles,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Share2,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { UserContact, UserProfile, ThemeMode } from '../types';
import {
  parseQrContactData,
  formatContactQrPayload,
  generateQrDataUrl,
  playQrScanSuccessSound,
  decodeQrFromImageData,
  DEMO_QR_CONTACTS,
  DemoQrContact,
  ScannedContactPayload,
} from '../lib/qrCodeHelper';
import { AVAILABLE_LANGUAGES } from '../data/mockData';

interface QrCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: UserContact) => void;
  currentUser?: UserProfile;
  primaryColor?: string;
  theme?: ThemeMode;
}

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onAddContact,
  currentUser,
  primaryColor = '#7C3AED',
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  // Active view tab: 'camera' | 'demo' | 'my_qr'
  const [activeTab, setActiveTab] = useState<'camera' | 'demo' | 'my_qr'>('camera');

  // Camera stream states
  const [cameraState, setCameraState] = useState<'initializing' | 'active' | 'denied' | 'error' | 'unsupported'>('initializing');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Scanned contact confirmation view state
  const [scannedResult, setScannedResult] = useState<ScannedContactPayload | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [customLanguage, setCustomLanguage] = useState('English');
  const [customMessage, setCustomMessage] = useState('Hello from Freedom Chat!');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');

  // My QR code generation state
  const [myQrDataUrl, setMyQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Demo contact QR code preview modal
  const [selectedDemoQr, setSelectedDemoQr] = useState<DemoQrContact | null>(null);
  const [demoQrDataUrl, setDemoQrDataUrl] = useState<string>('');

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video & Canvas DOM references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanLoopIdRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(true);

  // Stop camera tracks helper
  const stopCameraStream = useCallback(() => {
    if (scanLoopIdRef.current) {
      cancelAnimationFrame(scanLoopIdRef.current);
      scanLoopIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Handle successful QR detection
  const handleQrDetected = useCallback((rawPayload: string) => {
    if (!isScanningRef.current) return;
    isScanningRef.current = false;

    // Haptic vibration feedback if available
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]);
      }
    } catch {
      // ignore
    }

    // Audio confirmation sound
    playQrScanSuccessSound();

    const parsed = parseQrContactData(rawPayload);
    setScannedResult(parsed);
    setCustomName(parsed.name);
    setCustomPhone(parsed.phoneNumber || '');
    setCustomLanguage(parsed.nativeLanguage || 'English');
    setCustomMessage(parsed.initialMessage || 'Hello from Freedom Chat!');
  }, []);

  // Scanning loop for camera stream
  const startScanningLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let lastCheckTime = 0;

    const tick = (now: number) => {
      if (!isScanningRef.current) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Run scan every ~80ms to balance high responsiveness and low CPU usage
        if (now - lastCheckTime > 80) {
          lastCheckTime = now;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const detectedString = decodeQrFromImageData(imageData.data, canvas.width, canvas.height);

          if (detectedString) {
            handleQrDetected(detectedString);
            return;
          }
        }
      }

      scanLoopIdRef.current = requestAnimationFrame(tick);
    };

    scanLoopIdRef.current = requestAnimationFrame(tick);
  }, [handleQrDetected]);

  // Initialize camera stream
  const initCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopCameraStream();
    setCameraState('initializing');
    setErrorMessage('');
    isScanningRef.current = true;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      setErrorMessage('Camera API is not supported on this browser or context (requires HTTPS or localhost).');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      // Check if torch/flashlight is supported
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
        setHasTorch(Boolean(capabilities?.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraState('active');
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
        setErrorMessage('Camera access was denied. Please allow camera permissions in browser settings or use photo upload / demo contacts.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('error');
        setErrorMessage('No camera device found on this system. You can still scan from image files or try demo QR codes.');
      } else {
        setCameraState('error');
        setErrorMessage(err.message || 'Unable to access camera.');
      }
    }
  }, [startScanningLoop, stopCameraStream]);

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const next = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: next }],
        });
        setIsTorchOn(next);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  // Flip Camera between environment & user
  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    initCamera(nextFacing);
  };

  // Process uploaded QR code image from gallery / photos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const detected = decodeQrFromImageData(imageData.data, canvas.width, canvas.height);

        if (detected) {
          handleQrDetected(detected);
        } else {
          alert('Could not find a valid QR code in this image. Please ensure the code is clear, well-lit, and uncropped.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Initialize camera when modal opens in camera mode
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !scannedResult) {
      initCamera(cameraFacing);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab, scannedResult, cameraFacing, initCamera, stopCameraStream]);

  // Generate My QR Code when 'my_qr' tab is chosen
  useEffect(() => {
    if (isOpen && activeTab === 'my_qr' && currentUser) {
      const payload = formatContactQrPayload({
        id: currentUser.id,
        name: currentUser.name,
        phoneNumber: currentUser.phoneNumber || '+1 555-0100',
        nativeLanguage: currentUser.motherLanguage || 'English',
        bio: currentUser.bio || 'Freedom user',
        avatar: currentUser.avatar,
      });

      generateQrDataUrl(payload, { primaryColor, width: 280, margin: 2 })
        .then((dataUrl) => setMyQrDataUrl(dataUrl))
        .catch((err) => console.error(err));
    }
  }, [isOpen, activeTab, currentUser, primaryColor]);

  // Generate preview for selected demo QR code
  useEffect(() => {
    if (selectedDemoQr) {
      const payload = formatContactQrPayload({
        id: selectedDemoQr.id,
        name: selectedDemoQr.name,
        phoneNumber: selectedDemoQr.phoneNumber,
        nativeLanguage: selectedDemoQr.nativeLanguage,
        bio: selectedDemoQr.bio,
        avatar: selectedDemoQr.avatar,
      });

      generateQrDataUrl(payload, { primaryColor, width: 260, margin: 2 })
        .then((url) => setDemoQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [selectedDemoQr, primaryColor]);

  // Confirm and save contact to app
  const handleConfirmAddContact = () => {
    if (!scannedResult) return;
    setIsConfirming(true);

    const defaultAvatar = `https://images.unsplash.com/photo-${
      1500000000000 + Math.floor(Math.random() * 1000000)
    }?w=150&auto=format&fit=crop&q=80`;

    const newContact: UserContact = {
      id: scannedResult.id || `contact_qr_${Date.now()}`,
      name: customName.trim() || scannedResult.name || 'New Contact',
      avatar: scannedResult.avatar || defaultAvatar,
      lastMessage: customMessage.trim() || scannedResult.initialMessage || 'Connected via QR Code',
      time: 'Just now',
      online: true,
      unreadCount: 0,
      nativeLanguage: customLanguage,
      statusText: scannedResult.bio || 'Active Freedom contact',
      phoneNumber: customPhone.trim() || scannedResult.phoneNumber || undefined,
      isImported: true,
      importedFrom: 'manual',
    };

    onAddContact(newContact);
    setIsConfirming(false);
    onClose();
  };

  // Reset scanner state to scan again
  const handleRescan = () => {
    setScannedResult(null);
    isScanningRef.current = true;
    if (activeTab === 'camera') {
      initCamera(cameraFacing);
    }
  };

  // Copy personal QR share link
  const handleCopyShareLink = () => {
    if (!currentUser) return;
    const url = `freedom://contact?name=${encodeURIComponent(currentUser.name)}&lang=${encodeURIComponent(
      currentUser.motherLanguage || 'English'
    )}&id=${encodeURIComponent(currentUser.id)}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-[#141824] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">
                {scannedResult ? 'Contact Found!' : 'Scan Contact QR'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {scannedResult
                  ? 'Verify details before adding to chats'
                  : 'Point camera at any Freedom or vCard code'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            title="Close scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input for Image Scanning */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Hidden Canvas for Live Video Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanner Navigation Tabs (hidden when a contact was scanned) */}
        {!scannedResult && (
          <div className="flex items-center px-4 pt-3 pb-1 gap-1.5 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/60">
            <button
              onClick={() => {
                setActiveTab('camera');
                setSelectedDemoQr(null);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scanner</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('demo');
                stopCameraStream();
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'demo'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Try Demo QR</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('my_qr');
                stopCameraStream();
                setSelectedDemoQr(null);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'my_qr'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>My QR Code</span>
            </button>
          </div>
        )}

        {/* ========================================================
            CASE A: A QR CODE WAS SCANNED -> CONFIRMATION PREVIEW FORM
            ======================================================== */}
        {scannedResult ? (
          <div className="p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Scanned Badge Banner */}
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span>QR code decoded successfully. Ready to add to your contacts!</span>
            </div>

            {/* Contact Card Summary */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500 shadow-sm bg-slate-200 dark:bg-slate-700">
                <img
                  src={
                    scannedResult.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={customName}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#141824]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base truncate">{customName || 'New Contact'}</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold">
                    Scanned
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {scannedResult.bio || 'Freedom Messenger User'}
                </p>
                {customPhone && (
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    <span>{customPhone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Editable Fields Form */}
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Contact full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    <span>Mother Language</span>
                  </label>
                  <select
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.name}>
                        {lang.name} ({lang.native})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-emerald-500" />
                  <span>First Message / Greeting</span>
                </label>
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Greeting message"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleConfirmAddContact}
                disabled={isConfirming || !customName.trim()}
                className="w-full py-3 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                <UserCheck className="w-4 h-4" />
                <span>Add Contact & Start Chatting</span>
              </button>

              <button
                onClick={handleRescan}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Scan Another Code
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
              CASE B: SCANNER ACTIVE VIEWS (CAMERA / DEMO / MY QR)
              ======================================================== */
          <div className="p-4 sm:p-5">
            {/* TAB 1: LIVE CAMERA SCANNER */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                {/* Viewfinder Frame */}
                <div className="relative w-full aspect-square max-h-[300px] sm:max-h-[340px] rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
                  {/* Live Video Feed */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      cameraState === 'active' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Camera Initializing Spinner */}
                  {cameraState === 'initializing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-3 p-4">
                      <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-semibold text-slate-300">
                        Initializing high-speed camera...
                      </p>
                    </div>
                  )}

                  {/* Camera Error / Permission Denied UI */}
                  {(cameraState === 'denied' || cameraState === 'error' || cameraState === 'unsupported') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-white p-5 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold">
                          {cameraState === 'denied' ? 'Camera Permission Blocked' : 'Camera Unavailable'}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed max-w-xs">
                          {errorMessage || 'Unable to start camera stream on this device.'}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-1 w-full max-w-xs">
                        <button
                          onClick={() => initCamera(cameraFacing)}
                          className="flex-1 py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Camera</span>
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Live Scanner Overlay & Laser Line Animation */}
                  {cameraState === 'active' && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {/* Darkened corner vignette */}
                      <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60" />

                      {/* Viewfinder Target Box */}
                      <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl border border-white/20 flex items-center justify-center">
                        {/* 4 Neon Target Corners */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 rounded-tl-lg border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 rounded-tr-lg border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 rounded-bl-lg border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 rounded-br-lg border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

                        {/* Animated Laser Scanning Beam */}
                        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,1)] animate-bounce" />

                        {/* Center Reticle */}
                        <div className="w-3 h-3 rounded-full border border-white/40 opacity-70" />
                      </div>

                      {/* Status guidance pill */}
                      <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] text-white/90 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Align QR code within reticle</span>
                      </div>
                    </div>
                  )}

                  {/* Top Floating Controls on Video (Torch & Flip) */}
                  {cameraState === 'active' && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      {hasTorch && (
                        <button
                          onClick={handleToggleTorch}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                            isTorchOn
                              ? 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/40'
                              : 'bg-black/50 text-white hover:bg-black/70'
                          }`}
                          title="Toggle Flashlight"
                        >
                          {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        onClick={handleFlipCamera}
                        className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                        title="Flip Camera (Front/Rear)"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar: Upload Photo from Gallery & Test Demo */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Upload QR from Gallery</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('demo');
                      stopCameraStream();
                    }}
                    className="py-2.5 px-3 rounded-xl border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try Sample QRs</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DEMO QR CODES CAROUSEL & SIMULATOR */}
            {activeTab === 'demo' && (
              <div className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                  <p>
                    Test the QR scanner without physical cards! Click <b>"Instant Scan"</b> to auto-fill the contact flow, or <b>"View QR"</b> to point another camera at it.
                  </p>
                </div>

                {/* Selected Demo QR Big Display Modal View */}
                {selectedDemoQr && demoQrDataUrl ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-3 animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {selectedDemoQr.name}
                      </span>
                      <button
                        onClick={() => setSelectedDemoQr(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        Back to list
                      </button>
                    </div>

                    <div className="p-3 bg-white rounded-2xl shadow-md">
                      <img src={demoQrDataUrl} alt={selectedDemoQr.name} className="w-44 h-44 rounded-lg" />
                    </div>

                    <div className="text-center">
                      <h4 className="font-bold text-sm">{selectedDemoQr.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedDemoQr.role} • {selectedDemoQr.nativeLanguage}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const payload = formatContactQrPayload({
                          id: selectedDemoQr.id,
                          name: selectedDemoQr.name,
                          phoneNumber: selectedDemoQr.phoneNumber,
                          nativeLanguage: selectedDemoQr.nativeLanguage,
                          bio: selectedDemoQr.bio,
                          avatar: selectedDemoQr.avatar,
                        });
                        handleQrDetected(payload);
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulate Instant Scan with this Code</span>
                    </button>
                  </div>
                ) : (
                  /* Demo Contacts List */
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                    {DEMO_QR_CONTACTS.map((demo) => (
                      <div
                        key={demo.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={demo.avatar}
                            alt={demo.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-600"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold truncate">{demo.name}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {demo.role} • {demo.nativeLanguage}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setSelectedDemoQr(demo)}
                            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                            title="Display QR code on screen"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              const payload = formatContactQrPayload({
                                id: demo.id,
                                name: demo.name,
                                phoneNumber: demo.phoneNumber,
                                nativeLanguage: demo.nativeLanguage,
                                bio: demo.bio,
                                avatar: demo.avatar,
                              });
                              handleQrDetected(payload);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Scan</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setActiveTab('camera')}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer text-center"
                >
                  ← Return to Live Camera
                </button>
              </div>
            )}

            {/* TAB 3: MY PERSONAL QR CODE CARD */}
            {activeTab === 'my_qr' && (
              <div className="flex flex-col items-center text-center space-y-3.5 animate-in fade-in duration-150">
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Let friends scan this QR code to immediately connect with you and translate conversations in real-time.
                </p>

                {/* Personal QR Card */}
                <div className="relative p-5 bg-white rounded-3xl shadow-xl border border-slate-200 text-slate-900 flex flex-col items-center max-w-[260px] w-full">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 mb-2.5 shadow-sm bg-slate-100">
                    <img
                      src={
                        currentUser?.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={currentUser?.name || 'My Profile'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{currentUser?.name || 'Freedom User'}</h3>
                  <span className="text-[10px] text-emerald-600 font-semibold mb-2.5">
                    {currentUser?.motherLanguage || 'English'} Native
                  </span>

                  {myQrDataUrl ? (
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <img src={myQrDataUrl} alt="Personal QR" className="w-44 h-44 rounded-lg" />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-slate-100 rounded-xl flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    {currentUser?.phoneNumber || '+1 555-0100'}
                  </p>
                </div>

                {/* Actions: Download QR & Copy Link */}
                <div className="flex items-center gap-2 w-full max-w-[260px]">
                  {myQrDataUrl && (
                    <a
                      href={myQrDataUrl}
                      download={`freedom-qr-${currentUser?.name || 'contact'}.png`}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save QR</span>
                    </a>
                  )}

                  <button
                    onClick={handleCopyShareLink}
                    className="flex-1 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('camera')}
                  className="pt-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  ← Switch Back to Scanner
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
