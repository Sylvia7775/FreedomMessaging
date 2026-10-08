/**
 * Audio Waveform & Speech Synthesizer Helper
 * Provides realistic deterministic waveform generation, audio parsing,
 * and browser Web Audio API playback for voice notes.
 */

/**
 * Generate a deterministic list of bar heights (normalized 0.15 to 1.0)
 * based on a seed or message ID. Creates authentic voice syllable curves.
 */
export function generateWaveformBars(seed: string = 'msg-default', count: number = 32): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const bars: number[] = [];
  const pseudoRand = (n: number) => {
    const x = Math.sin(hash + n * 17.13) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    // Envelope: speech typically starts soft, has bursts in the middle, and trails off
    const progress = i / (count - 1);
    const envelope = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
    
    // Syllabic modulation (rhythm of syllables)
    const syllableWave = Math.sin(i * 0.85) * 0.25 + 0.75;
    
    // Random vocal frequency jitter
    const jitter = pseudoRand(i) * 0.45;
    
    // Combine factors
    const rawVal = (0.2 + 0.65 * envelope * syllableWave + jitter * 0.35);
    
    // Clamp between 0.18 and 1.0
    const normalized = Math.max(0.18, Math.min(1.0, rawVal));
    bars.push(parseFloat(normalized.toFixed(3)));
  }

  return bars;
}

/**
 * Parses duration string such as '0.37', '0:37', '1:24', '45s' into seconds
 */
export function parseDurationToSeconds(durationStr?: string | number): number {
  if (!durationStr) return 24; // Default sensible voice note duration
  
  if (typeof durationStr === 'number') {
    return durationStr > 0 ? durationStr : 24;
  }

  const str = durationStr.trim();
  
  // Format "0:37" or "1:05"
  if (str.includes(':')) {
    const parts = str.split(':');
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseFloat(parts[1]) || 0;
    const total = mins * 60 + secs;
    return total > 0 ? total : 24;
  }

  // Format "0.37" (often used in mock data representing 0 mins 37 secs)
  if (str.includes('.')) {
    const parts = str.split('.');
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    const total = mins * 60 + secs;
    return total > 0 ? total : 24;
  }

  // Raw number string
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) {
    return num;
  }

  return 24;
}

/**
 * Format seconds into mm:ss (e.g. 0:14)
 */
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Global AudioContext singleton for smooth audio playback
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export interface VoicePlaybackInstance {
  stop: () => void;
  setSpeed: (rate: number) => void;
  getFrequencyData: (array: Uint8Array) => void;
}

/**
 * Play synthesized voice cadence or audio clip
 * Generates pleasant human-like vocal harmonic tones so voice notes actually play real sound!
 */
export function startVoiceTonePlayback(
  onTick: (currentSec: number, progressPct: number) => void,
  onComplete: () => void,
  totalDurationSeconds: number = 24,
  initialTimeSeconds: number = 0,
  playbackSpeed: number = 1.0,
  mediaUrl?: string
): VoicePlaybackInstance {
  const ctx = getAudioContext();
  let isCancelled = false;
  let currentSpeed = playbackSpeed;
  let elapsed = initialTimeSeconds;

  let audioEl: HTMLAudioElement | null = null;
  let osc1: OscillatorNode | null = null;
  let osc2: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;
  let analyserNode: AnalyserNode | null = null;
  let rafId: number | null = null;
  let lastTimestamp = performance.now();

  const cleanup = () => {
    isCancelled = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (audioEl) {
      audioEl.pause();
      audioEl.src = '';
      audioEl = null;
    }
    if (osc1) {
      try { osc1.stop(); osc1.disconnect(); } catch {}
      osc1 = null;
    }
    if (osc2) {
      try { osc2.stop(); osc2.disconnect(); } catch {}
      osc2 = null;
    }
    if (gainNode) {
      try { gainNode.disconnect(); } catch {}
      gainNode = null;
    }
  };

  // Try real audio if mediaUrl is provided and valid
  const hasValidMediaUrl = mediaUrl && (mediaUrl.startsWith('http') || mediaUrl.startsWith('data:audio') || mediaUrl.startsWith('blob:'));

  if (hasValidMediaUrl) {
    try {
      audioEl = new Audio(mediaUrl);
      audioEl.playbackRate = playbackSpeed;
      audioEl.currentTime = initialTimeSeconds;
      audioEl.volume = 0.85;

      if (ctx) {
        try {
          analyserNode = ctx.createAnalyser();
          analyserNode.fftSize = 64;
          const source = ctx.createMediaElementSource(audioEl);
          source.connect(analyserNode);
          analyserNode.connect(ctx.destination);
        } catch {
          // Cross-origin audio or fallback
        }
      }

      audioEl.play().catch(() => {
        // Fallback to synth if autoplay blocked or network failed
        fallbackToSynth();
      });

      audioEl.onended = () => {
        if (!isCancelled) {
          cleanup();
          onComplete();
        }
      };

      const updateLoop = () => {
        if (isCancelled || !audioEl) return;
        const cur = audioEl.currentTime;
        const dur = audioEl.duration || totalDurationSeconds;
        const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
        onTick(cur, pct);
        rafId = requestAnimationFrame(updateLoop);
      };
      rafId = requestAnimationFrame(updateLoop);

      return {
        stop: cleanup,
        setSpeed: (rate) => {
          if (audioEl) audioEl.playbackRate = rate;
        },
        getFrequencyData: (arr) => {
          if (analyserNode) {
            analyserNode.getByteFrequencyData(arr as any);
          }
        },
      };
    } catch {
      fallbackToSynth();
    }
  } else {
    fallbackToSynth();
  }

  function fallbackToSynth() {
    if (isCancelled) return;
    if (ctx) {
      try {
        analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 64;

        // Create vocal formant simulation with harmonic oscillators
        osc1 = ctx.createOscillator();
        osc2 = ctx.createOscillator();
        gainNode = ctx.createGain();

        // Vocal chord pitch variation (warm speech range ~ 160Hz to 280Hz)
        osc1.type = 'triangle';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(180, ctx.currentTime);
        osc2.frequency.setValueAtTime(360, ctx.currentTime);

        // Low pass filter for soft natural voice timbre
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(2, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.04, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(analyserNode);
        analyserNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        // Modulate tone to sound like gentle vocal speech cadence
        const speechRhythmTimer = setInterval(() => {
          if (isCancelled || !ctx || !osc1 || !gainNode) {
            clearInterval(speechRhythmTimer);
            return;
          }
          const baseFreq = 160 + Math.sin(elapsed * 4) * 45 + Math.cos(elapsed * 1.5) * 30;
          osc1.frequency.setTargetAtTime(baseFreq, ctx.currentTime, 0.08);
          // Syllable pauses
          const isPause = Math.sin(elapsed * 6) < -0.65;
          const targetGain = isPause ? 0.005 : 0.038;
          gainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.04);
        }, 80);
      } catch {
        // AudioContext error fallback to timer only
      }
    }

    lastTimestamp = performance.now();
    const synthLoop = () => {
      if (isCancelled) return;
      const now = performance.now();
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      elapsed += dt * currentSpeed;

      if (elapsed >= totalDurationSeconds) {
        cleanup();
        onTick(totalDurationSeconds, 100);
        onComplete();
        return;
      }

      const pct = Math.min(100, Math.max(0, (elapsed / totalDurationSeconds) * 100));
      onTick(elapsed, pct);
      rafId = requestAnimationFrame(synthLoop);
    };

    rafId = requestAnimationFrame(synthLoop);
  }

  return {
    stop: cleanup,
    setSpeed: (rate) => {
      currentSpeed = rate;
      if (audioEl) audioEl.playbackRate = rate;
    },
    getFrequencyData: (arr) => {
      if (analyserNode) {
        analyserNode.getByteFrequencyData(arr as any);
      }
    },
  };
}
