import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  SwitchCamera,
  Maximize2,
  Minimize2,
  Grid,
  ShieldCheck,
  CheckCircle2,
  X,
  PhoneForwarded,
} from 'lucide-react';
import { getInitialsAvatar, getCleanAvatar } from '../lib/avatarHelper';

interface ActiveCallModalProps {
  contactName: string;
  avatar: string;
  type: 'voice' | 'video';
  onEndCall: (summary?: { durationSecs: number; type: 'voice' | 'video' }) => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  contactName,
  avatar,
  type: initialType,
  onEndCall,
}) => {
  const [callType, setCallType] = useState<'voice' | 'video'>(initialType);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialType === 'video');
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [dialedKey, setDialedKey] = useState<string>('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Audio Equalizer wave level
  const [audioLevel, setAudioLevel] = useState<number>(0.4);

  // Refs for media elements
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringOscillatorRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Play realistic phone ringing tone using Web Audio API
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Dual frequency ring tone (US/International standard 440Hz + 480Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        // Ring cadence: 1.5s on, 2s off
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime + 1.4);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + 3.0);
        gain.gain.setValueAtTime(0, ctx.currentTime + 4.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        ringOscillatorRef.current = { osc1, osc2, gain };
      }
    } catch {
      // AudioContext unavailable or restricted
    }

    // Automatically transition from 'ringing' to 'connected' after 2.4s
    timeout = setTimeout(() => {
      stopRingtone();
      setCallStatus('connected');
    }, 2400);

    return () => {
      clearTimeout(timeout);
      stopRingtone();
    };
  }, []);

  const stopRingtone = () => {
    if (ringOscillatorRef.current) {
      try {
        ringOscillatorRef.current.osc1.stop();
        ringOscillatorRef.current.osc2.stop();
        ringOscillatorRef.current.gain.disconnect();
      } catch {
        // ignore
      }
      ringOscillatorRef.current = null;
    }
  };

  // 2. Camera & Microphone Stream Handler
  useEffect(() => {
    let isCancelled = false;

    const startLocalStream = async () => {
      if (callType === 'video' && isVideoEnabled) {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            let stream: MediaStream;
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  facingMode: { ideal: facingMode },
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
                audio: false,
              });
            } catch {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            }

            if (isCancelled) {
              stream.getTracks().forEach((t) => t.stop());
              return;
            }

            localStreamRef.current = stream;
            setHasCameraPermission(true);
            setCameraError(null);

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => {});
            }

            // Acquire microphone separately so audio permissions never block video
            navigator.mediaDevices
              .getUserMedia({ audio: true, video: false })
              .then((audStream) => {
                if (isCancelled) {
                  audStream.getTracks().forEach((t) => t.stop());
                  return;
                }
                if (audioContextRef.current) {
                  try {
                    const source = audioContextRef.current.createMediaStreamSource(audStream);
                    const analyser = audioContextRef.current.createAnalyser();
                    analyser.fftSize = 64;
                    source.connect(analyser);
                    analyserRef.current = analyser;
                  } catch {
                    // Ignore audio graph errors
                  }
                }
              })
              .catch(() => {});
          } else {
            setHasCameraPermission(false);
            setCameraError('Camera access not supported on this browser');
          }
        } catch (err: unknown) {
          if (!isCancelled) {
            setHasCameraPermission(false);
            const errMsg = err instanceof Error ? err.message : 'Camera permission denied or unavailable';
            setCameraError(errMsg);
          }
        }
      } else {
        // Stop video tracks if video is disabled
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = false));
        }
      }
    };

    startLocalStream();

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [callType, isVideoEnabled, facingMode]);

  // 3. Audio level simulation or analyzer loop
  useEffect(() => {
    let animId: number;
    const dataArray = new Uint8Array(32);

    const updateAudioWave = () => {
      if (analyserRef.current && !isMuted) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(1.0, 0.2 + avg / 120));
      } else if (callStatus === 'connected' && !isMuted) {
        // Simulated voice rhythm
        const time = Date.now() / 300;
        const synthLevel = 0.35 + Math.sin(time) * 0.25 + Math.cos(time * 1.7) * 0.15;
        setAudioLevel(Math.max(0.15, Math.min(0.9, synthLevel)));
      } else {
        setAudioLevel(0.1);
      }
      animId = requestAnimationFrame(updateAudioWave);
    };

    animId = requestAnimationFrame(updateAudioWave);
    animFrameRef.current = animId;

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [callStatus, isMuted]);

  // 4. Call Duration Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  // 5. DTMF Keypad Tones
  const handleKeypadPress = (digit: string) => {
    setDialedKey((prev) => prev + digit);
    if (audioContextRef.current) {
      try {
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        osc.frequency.setValueAtTime(697 + digit.charCodeAt(0) * 8, audioContextRef.current.currentTime);
        gain.gain.setValueAtTime(0.06, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        osc.start();
        osc.stop(audioContextRef.current.currentTime + 0.16);
      } catch {
        // Ignore
      }
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
    }
  };

  // Toggle Video
  const handleToggleVideo = () => {
    const next = !isVideoEnabled;
    setIsVideoEnabled(next);
    if (next && callType === 'voice') {
      setCallType('video');
    }
  };

  // Flip Camera
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // End Call Handler
  const handleEndCall = () => {
    stopRingtone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setCallStatus('ended');
    setTimeout(() => {
      onEndCall({ durationSecs: callDuration, type: callType });
    }, 200);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-[#0A0E17]/95 backdrop-blur-md z-50 flex flex-col justify-between p-4 sm:p-6 text-white select-none animate-in fade-in duration-200">
      {/* Top Header info */}
      <div className="relative text-center pt-5 sm:pt-7 z-20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2.5 border border-emerald-500/30 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Freedom Encrypted {callType === 'video' ? 'Video' : 'Voice'} Call</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
          {contactName}
        </h2>

        {callStatus === 'ringing' ? (
          <p className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1 flex items-center justify-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Ringing...</span>
          </p>
        ) : (
          <p className="text-xs sm:text-sm font-mono text-emerald-300 mt-1 font-bold tracking-wider">
            {formatTime(callDuration)}
          </p>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-3 min-h-0">
        {callType === 'video' ? (
          <div className="relative w-full max-w-xs sm:max-w-sm h-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900 group">
            {/* Remote Video Stream */}
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
              {avatar ? (
                <img
                  src={avatar}
                  alt={contactName}
                  className="w-full h-full object-cover brightness-95"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-2xl">
                  {contactName.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Remote participant audio wave badge */}
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-2 border border-white/10">
                <span className="text-[11px] font-bold text-white">{contactName}</span>
                <div className="flex items-center gap-0.5 h-3">
                  {[0.4, 0.8, 0.5, 0.9, 0.6].map((bar, i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-emerald-400 rounded-full transition-all duration-100"
                      style={{ height: `${Math.round(bar * audioLevel * 12)}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* HD Tag */}
              <div className="absolute top-3 right-3 bg-emerald-500/80 backdrop-blur-xs text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
                HD 1080p
              </div>
            </div>

            {/* Local User Stream (Picture in Picture) */}
            <div className="absolute bottom-3 right-3 w-24 h-32 sm:w-28 sm:h-36 rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-2xl bg-black/80 z-20 group/pip">
              {isVideoEnabled ? (
                <div className="relative w-full h-full bg-slate-950">
                  <video
                    ref={(el) => {
                      localVideoRef.current = el;
                      if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                        el.srcObject = localStreamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      facingMode === 'user' ? 'scale-x-[-1]' : ''
                    }`}
                  />
                  {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-950/90">
                      <span className="text-[9px] text-rose-300 font-semibold leading-tight">
                        Allow Camera
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-950">
                  <VideoOff className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[9px] text-slate-400">Camera Off</span>
                </div>
              )}

              {/* Local PiP Label */}
              <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.2 rounded text-[8px] font-bold text-white">
                You
              </div>

              {/* Camera Flip Button on PiP */}
              {isVideoEnabled && (
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  title="Flip camera"
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:text-white cursor-pointer active:scale-90"
                >
                  <SwitchCamera className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Camera error / fallback notification banner */}
            {cameraError && isVideoEnabled && (
              <div className="absolute bottom-2 left-2 right-28 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg border border-amber-500/30 text-[10px] text-amber-200 flex items-center gap-1 z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="truncate">Camera simulated (preview mode)</span>
              </div>
            )}
          </div>
        ) : (
          /* Voice Call Visuals with Pulsing Ring & Equalizer Bars */
          <div className="flex flex-col items-center justify-center relative">
            <div className="relative mb-6">
              {/* Dynamic pulsing audio rings */}
              <div
                className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping transition-all duration-300"
                style={{ transform: `scale(${1.1 + audioLevel * 0.4})` }}
              />
              <div
                className="absolute -inset-4 rounded-full bg-emerald-500/10 animate-pulse transition-all duration-300"
                style={{ transform: `scale(${1.2 + audioLevel * 0.3})` }}
              />

              <img
                src={avatar}
                alt={contactName}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-emerald-500 relative z-10 shadow-2xl"
              />

              {/* Online pulse dot */}
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 border-2 border-[#0A0E17] rounded-full z-20" />
            </div>

            {/* Live voice wave visualizer */}
            <div className="flex items-center gap-1.5 h-8 px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] text-emerald-400 font-semibold mr-1">Voice Audio:</span>
              {[0.3, 0.7, 0.9, 0.5, 0.8, 1.0, 0.6, 0.4, 0.7, 0.5].map((factor, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(4, Math.round(factor * audioLevel * 24))}px`,
                    opacity: isMuted ? 0.3 : 0.9,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* In-Call Keypad Overlay if opened */}
        {isKeypadOpen && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl p-4 flex flex-col justify-between z-30 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">In-Call Keypad</h4>
              <button
                type="button"
                onClick={() => setIsKeypadOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-xl font-mono tracking-widest text-emerald-400 min-h-7 inline-block">
                {dialedKey || 'Dial digits...'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleKeypadPress(d)}
                  className="w-12 h-12 mx-auto rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-base font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  {d}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsKeypadOpen(false)}
              className="w-full py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 mt-2"
            >
              Close Keypad
            </button>
          </div>
        )}
      </div>

      {/* Action Controls Bar */}
      <div className="relative pb-6 sm:pb-8 z-20">
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          {/* Mute Mic toggle */}
          <button
            type="button"
            id="call-mute-toggle-btn"
            onClick={handleToggleMute}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isMuted ? 'bg-rose-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white active:scale-95'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle (Switch to Video or Turn Off Camera) */}
          <button
            type="button"
            id="call-video-toggle-btn"
            onClick={handleToggleVideo}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isVideoEnabled ? 'bg-emerald-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white active:scale-95'
            }`}
            title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Switch Call Mode (Voice <-> Video) */}
          <button
            type="button"
            id="call-switch-type-btn"
            onClick={() => {
              const nextType = callType === 'voice' ? 'video' : 'voice';
              setCallType(nextType);
              setIsVideoEnabled(nextType === 'video');
            }}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
            title={callType === 'voice' ? 'Switch to Video Call' : 'Switch to Audio Call'}
          >
            <PhoneForwarded className="w-5 h-5" />
          </button>

          {/* Keypad toggle */}
          <button
            type="button"
            id="call-keypad-btn"
            onClick={() => setIsKeypadOpen((prev) => !prev)}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isKeypadOpen ? 'bg-emerald-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white active:scale-95'
            }`}
            title="Dialpad"
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* Speaker toggle */}
          <button
            type="button"
            id="call-speaker-btn"
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isSpeaker ? 'bg-emerald-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white active:scale-95'
            }`}
            title={isSpeaker ? 'Speaker On' : 'Speaker Off'}
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* End Call */}
          <button
            type="button"
            id="call-end-btn"
            onClick={handleEndCall}
            className="w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-90 text-white flex items-center justify-center shadow-lg shadow-rose-500/35 transition-all cursor-pointer ml-1"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
