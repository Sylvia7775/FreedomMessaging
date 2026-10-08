import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Maximize2,
  Volume2,
  RotateCcw,
  Sparkles,
  Languages,
  Copy,
  Check,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { ChatMessage, AudioTranscriptionData } from '../types';
import {
  generateWaveformBars,
  parseDurationToSeconds,
  formatAudioTime,
  startVoiceTonePlayback,
  VoicePlaybackInstance,
} from '../lib/audioWaveformHelper';
import { transcribeAudioMessage } from '../lib/geminiAudioService';

interface VoiceNoteWaveformVisualizerProps {
  message: ChatMessage;
  isMe: boolean;
  isDark: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenMediaModal?: () => void;
  primaryColor?: string;
  userMotherLanguage?: string;
  onUpdateTranscription?: (messageId: string, data: AudioTranscriptionData) => void;
  renderStatusIndicator?: (
    status: ChatMessage['status'],
    mode: 'bubble_dark' | 'bubble_light',
    messageId?: string
  ) => React.ReactNode;
}

export const VoiceNoteWaveformVisualizer: React.FC<VoiceNoteWaveformVisualizerProps> = ({
  message,
  isMe,
  isDark,
  isPlaying,
  onTogglePlay,
  onOpenMediaModal,
  primaryColor = '#7C3AED',
  userMotherLanguage = 'English',
  onUpdateTranscription,
  renderStatusIndicator,
}) => {
  const totalDuration = useMemo(
    () => parseDurationToSeconds(message.audioDuration),
    [message.audioDuration]
  );

  // Automatic Gemini audio transcription state
  const [transcription, setTranscription] = useState<AudioTranscriptionData | null>(
    message.audioTranscription || null
  );
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const aiVoiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // Trigger Gemini automatic transcription
  const fetchTranscription = useCallback(async () => {
    setIsTranscribing(true);
    try {
      const data = await transcribeAudioMessage(message, userMotherLanguage || 'English');
      setTranscription(data);
      if (onUpdateTranscription) {
        onUpdateTranscription(message.id, data);
      }
    } catch (e) {
      console.warn('Auto transcription error:', e);
    } finally {
      setIsTranscribing(false);
    }
  }, [message, userMotherLanguage, onUpdateTranscription]);

  // Automatically transcribe received audio messages so users can read them in their preferred language
  useEffect(() => {
    if (!transcription && !isMe) {
      fetchTranscription();
    }
  }, [transcription, isMe, fetchTranscription]);

  // Re-transcribe when preferred mother language changes
  useEffect(() => {
    if (transcription && userMotherLanguage && transcription.targetLanguage !== userMotherLanguage && !isMe) {
      fetchTranscription();
    }
  }, [userMotherLanguage, isMe, transcription, fetchTranscription]);

  const handleSpeakText = async (text: string) => {
    if (isSpeaking) {
      if (aiVoiceAudioRef.current) {
        aiVoiceAudioRef.current.pause();
        aiVoiceAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const speakFallback = (fallbackText: string) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fallbackText);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setIsSpeaking(false), 2500);
      }
    };

    try {
      const response = await fetch('/api/ai-voice-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: 'Kore',
          style: 'Warm, natural, conversational',
        }),
      });
      const data = await response.json();
      if (data.success && data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        aiVoiceAudioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => speakFallback(data.spokenText || text);
        await audio.play();
      } else {
        speakFallback(data.spokenText || text);
      }
    } catch {
      speakFallback(text);
    }
  };

  // 32 bars waveform unique to this message
  const rawBars = useMemo(
    () => generateWaveformBars(message.id || 'voice-msg', 32),
    [message.id]
  );

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 100%
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Visualizer animated dynamics
  const [animationTick, setAnimationTick] = useState(0);
  const playbackRef = useRef<VoicePlaybackInstance | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Frequency data array for real Web Audio analyzer
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(32));

  // Audio Playback synchronization
  useEffect(() => {
    if (isPlaying) {
      // Start or resume audio
      const initialSec = (playbackProgress / 100) * totalDuration;
      playbackRef.current = startVoiceTonePlayback(
        (curSec, pct) => {
          setCurrentTime(curSec);
          setPlaybackProgress(pct);
        },
        () => {
          // Playback finished
          onTogglePlay();
          setCurrentTime(0);
          setPlaybackProgress(0);
        },
        totalDuration,
        initialSec,
        playbackSpeed,
        message.mediaUrl
      );

      // Continuous animation loop for dancing waveform visual feedback
      const animateWave = () => {
        setAnimationTick((t) => (t + 1) % 1000);
        if (playbackRef.current) {
          playbackRef.current.getFrequencyData(freqDataRef.current);
        }
        animFrameRef.current = requestAnimationFrame(animateWave);
      };
      animFrameRef.current = requestAnimationFrame(animateWave);
    } else {
      // Stopped
      if (playbackRef.current) {
        playbackRef.current.stop();
        playbackRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }

    return () => {
      if (playbackRef.current) {
        playbackRef.current.stop();
        playbackRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, totalDuration, message.mediaUrl]);

  // Handle speed changes while playing
  useEffect(() => {
    if (playbackRef.current) {
      playbackRef.current.setSpeed(playbackSpeed);
    }
  }, [playbackSpeed]);

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1.0, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTime(0);
    setPlaybackProgress(0);
    if (!isPlaying) {
      onTogglePlay();
    }
  };

  // Calculate seek percentage from mouse/touch event
  const calculateSeekFromEvent = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!waveformContainerRef.current) return 0;
      const rect = waveformContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const relX = clientX - rect.left;
      const clampedPct = Math.max(0, Math.min(100, (relX / rect.width) * 100));
      return clampedPct;
    },
    []
  );

  const handleSeek = (pct: number) => {
    const targetSec = (pct / 100) * totalDuration;
    setCurrentTime(targetSec);
    setPlaybackProgress(pct);

    if (isPlaying) {
      // Re-initialize playback at new position
      if (playbackRef.current) {
        playbackRef.current.stop();
      }
      playbackRef.current = startVoiceTonePlayback(
        (curSec, newPct) => {
          setCurrentTime(curSec);
          setPlaybackProgress(newPct);
        },
        () => {
          onTogglePlay();
          setCurrentTime(0);
          setPlaybackProgress(0);
        },
        totalDuration,
        targetSec,
        playbackSpeed,
        message.mediaUrl
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    const pct = calculateSeekFromEvent(e);
    handleSeek(pct);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pct = calculateSeekFromEvent(e);
    setHoverProgress(pct);
    if (isDragging) {
      handleSeek(pct);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Color schemes for chat bubbles matching primary brand color
  const bubbleStyles = isMe
    ? {
        bg: 'bg-[#7C3AED] text-white rounded-[18px] rounded-tr-[4px] shadow-[0_2px_8px_rgba(124,58,237,0.22)]',
        playBtn: 'bg-white text-[#7C3AED] hover:bg-purple-50 active:scale-95 shadow-sm',
        barActive: 'bg-white',
        barInactive: 'bg-white/40',
        scrubber: 'bg-white ring-2 ring-purple-300',
        timeText: 'text-purple-100',
        pillSpeed: 'bg-white/20 hover:bg-white/30 text-white border border-white/30',
      }
    : isDark
    ? {
        bg: 'bg-[#1F2633] text-slate-100 rounded-bl-xs border border-slate-700/50 shadow-md',
        playBtn: 'bg-purple-600 text-white hover:bg-purple-500 active:scale-95 shadow-md shadow-purple-600/25',
        barActive: 'bg-purple-400',
        barInactive: 'bg-slate-700/70',
        scrubber: 'bg-purple-400 ring-2 ring-purple-300/60',
        timeText: 'text-slate-400',
        pillSpeed: 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700',
      }
    : {
        bg: 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/90 shadow-sm',
        playBtn: 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95 shadow-md shadow-purple-600/20',
        barActive: 'bg-purple-500',
        barInactive: 'bg-slate-200',
        scrubber: 'bg-purple-600 ring-2 ring-purple-300',
        timeText: 'text-slate-500',
        pillSpeed: 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200',
      };

  return (
    <div
      className={`relative flex flex-col p-3 rounded-2xl min-w-[260px] sm:min-w-[280px] max-w-xs sm:max-w-sm transition-all select-none group/voice ${bubbleStyles.bg}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header: Voice note title / status badge */}
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-white/10 dark:border-slate-700/40 text-[10px]">
        <div className="flex items-center gap-1.5 font-medium">
          <Volume2 className="w-3 h-3 opacity-80" />
          <span className="tracking-wide">Voice Note</span>
          {isPlaying && (
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-purple-400/20 text-purple-300 font-semibold text-[9px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Playback speed toggle */}
          <button
            type="button"
            onClick={toggleSpeed}
            title="Change playback speed"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight cursor-pointer transition-all active:scale-95 ${bubbleStyles.pillSpeed}`}
          >
            {playbackSpeed}x
          </button>

          {/* Expand to media modal if requested */}
          {onOpenMediaModal && (
            <button
              type="button"
              onClick={onOpenMediaModal}
              title="Open audio details and media actions"
              className="p-1 rounded hover:bg-white/10 dark:hover:bg-slate-700/50 cursor-pointer text-current/80 hover:text-current transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Row: Play/Pause button + Dynamic Audio Waveform */}
      <div className="flex items-center gap-3">
        {/* Play / Pause circular button with ripple effect when active */}
        <div className="relative shrink-0">
          {isPlaying && (
            <span className="absolute -inset-1 rounded-full bg-purple-400/30 animate-ping pointer-events-none" />
          )}
          <button
            id={`voice-play-btn-${message.id}`}
            type="button"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause voice note' : 'Play voice note'}
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 z-10 ${bubbleStyles.playBtn}`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current stroke-[1.5]" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5 stroke-[1.5]" />
            )}
          </button>
        </div>

        {/* Waveform Visualizer Interactive Track */}
        <div
          ref={waveformContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setHoverProgress(null);
          }}
          title="Click or drag to seek voice note"
          className="flex-1 relative flex items-center h-10 py-1.5 cursor-pointer group/wave"
        >
          {/* Waveform Bars */}
          <div className="w-full h-8 flex items-center justify-between gap-[2px] sm:gap-[3px]">
            {rawBars.map((baseHeight, idx) => {
              const barPct = (idx / (rawBars.length - 1)) * 100;
              const isPast = barPct <= playbackProgress;

              // Dynamic dancing bounce while playing for visual feedback
              let dynamicHeight = baseHeight;
              if (isPlaying) {
                // Combine frequency buffer if available or sinusoidal speech physics
                const freqVal = freqDataRef.current[idx % freqDataRef.current.length] / 255;
                const waveRhythm = Math.sin(animationTick * 0.12 + idx * 0.45) * 0.25;
                const dynamicMultiplier = 0.85 + freqVal * 0.4 + waveRhythm;
                dynamicHeight = Math.max(0.18, Math.min(1.0, baseHeight * dynamicMultiplier));
              }

              const heightPx = Math.round(dynamicHeight * 28);

              return (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center h-full"
                >
                  <div
                    className={`w-full max-w-[4px] rounded-full transition-[height,background-color] duration-75 ${
                      isPast ? bubbleStyles.barActive : bubbleStyles.barInactive
                    } ${isPlaying && isPast ? 'brightness-110 shadow-xs' : ''}`}
                    style={{
                      height: `${Math.max(4, heightPx)}px`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Current Playhead Scrubber Dot */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full pointer-events-none transition-[left] duration-75 shadow-sm ${bubbleStyles.scrubber}`}
            style={{ left: `${playbackProgress}%` }}
          />

          {/* Hover Scrubber Line & Time Tooltip */}
          {isHovering && hoverProgress !== null && (
            <>
              <div
                className="absolute top-1 bottom-1 w-0.5 bg-white/70 dark:bg-purple-300 pointer-events-none z-10"
                style={{ left: `${hoverProgress}%` }}
              />
              <div
                className="absolute -top-5 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[9px] font-mono pointer-events-none -translate-x-1/2 shadow-lg"
                style={{ left: `${hoverProgress}%` }}
              >
                {formatAudioTime((hoverProgress / 100) * totalDuration)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: Timestamp, Duration, and Read Status */}
      <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5 dark:border-slate-800/40 font-mono text-[10px]">
        {/* Playback time readout */}
        <div className="flex items-center gap-1.5 font-medium">
          <span className={bubbleStyles.timeText}>
            {isPlaying || playbackProgress > 0
              ? `${formatAudioTime(currentTime)} / ${formatAudioTime(totalDuration)}`
              : formatAudioTime(totalDuration)}
          </span>
          {playbackProgress > 0 && !isPlaying && (
            <button
              type="button"
              onClick={handleRestart}
              title="Restart from beginning"
              className="p-0.5 rounded hover:bg-white/10 dark:hover:bg-slate-700 cursor-pointer opacity-70 hover:opacity-100"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Message timestamp and delivery status */}
        <div className="flex items-center gap-1.5">
          <span className={`${bubbleStyles.timeText} text-[9px] font-sans`}>
            {message.timestamp}
          </span>
          {isMe &&
            renderStatusIndicator &&
            renderStatusIndicator(
              message.status,
              isDark ? 'bubble_dark' : 'bubble_light',
              message.id
            )}
        </div>
      </div>

      {/* Gemini AI Automatic Audio Message Transcription & Preferred Language Translation */}
      <div className="mt-2.5 pt-2 border-t border-white/15 dark:border-slate-700/60">
        {isTranscribing ? (
          <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center gap-2.5 animate-pulse">
            <Sparkles className="w-4 h-4 text-purple-300 animate-spin shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white">
                Transcribing Audio with Gemini API...
              </p>
              <p className="text-[10px] text-purple-200/80 truncate">
                Translating into your preferred language ({userMotherLanguage})
              </p>
            </div>
          </div>
        ) : transcription ? (
          <div className="p-2.5 rounded-xl bg-black/25 dark:bg-slate-900/75 border border-purple-400/30 text-left space-y-1.5 shadow-xs select-text">
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <div className="flex items-center gap-1.5 font-bold text-purple-300 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">
                  Gemini Transcript
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-purple-500/25 text-purple-200 font-mono text-[9px] border border-purple-400/40">
                  {transcription.targetLanguage}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSpeakText(showOriginal ? transcription.originalTranscript : transcription.translatedText)}
                  title={isSpeaking ? 'Stop AI Voice' : 'Speak with AI Voice'}
                  className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 text-[9px] font-bold ${
                    isSpeaking
                      ? 'bg-emerald-500 text-white animate-pulse'
                      : 'bg-white/10 hover:bg-white/20 text-emerald-300 hover:text-white'
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{isSpeaking ? 'Speaking...' : 'AI Voice'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(showOriginal ? transcription.originalTranscript : transcription.translatedText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  title="Copy transcript"
                  className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>

                <button
                  type="button"
                  onClick={fetchTranscription}
                  title="Re-transcribe with Gemini"
                  className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Read Text: Displayed in recipient's preferred language */}
            <p className="text-[12px] sm:text-[13px] leading-snug font-medium text-white select-text">
              {showOriginal ? transcription.originalTranscript : transcription.translatedText}
            </p>

            {/* Toggle between original and translated */}
            {transcription.originalTranscript !== transcription.translatedText && (
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300/90 hover:text-purple-100 transition-colors cursor-pointer pt-0.5"
              >
                <Languages className="w-3 h-3" />
                <span>
                  {showOriginal
                    ? `Read translated in ${transcription.targetLanguage}`
                    : `Show original (${transcription.detectedLanguage || 'English'})`}
                </span>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={fetchTranscription}
            className="w-full py-1.5 px-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Transcribe & Translate with Gemini</span>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Live audio visualizer bar for while recording a voice note
 */
export const RecordingVoiceVisualizer: React.FC<{
  seconds: number;
  onCancel: () => void;
  onSend: () => void;
  isDark?: boolean;
}> = ({ seconds, onCancel, onSend, isDark = true }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % 100);
    }, 90);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-4 py-2.5 bg-rose-500/10 dark:bg-rose-950/30 border-t border-rose-500/30 flex items-center justify-between text-xs text-rose-500 animate-in fade-in duration-150">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
          <span className="absolute w-2 h-2 bg-rose-600 rounded-full" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-rose-500">
            Recording Voice Note: {formatAudioTime(seconds)}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            Speak clearly into microphone
          </span>
        </div>

        {/* Live oscillating audio wave frequencies */}
        <div className="flex items-center gap-0.5 h-5 px-2 bg-rose-500/10 rounded-md">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => {
            const h = Math.sin(phase * 0.3 + i * 0.6) * 45 + 50;
            return (
              <div
                key={i}
                className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(20, Math.min(100, h))}%` }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSend}
          className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 cursor-pointer flex items-center gap-1.5 transition-all"
        >
          <span>Send Note</span>
        </button>
      </div>
    </div>
  );
};
