import { AppBrandConfig } from '../types';

export interface UploadedNotificationTune {
  id: string;
  name: string;
  fileName: string;
  fileSize: string;
  dataUrl: string;
  uploadedAt: string;
  isDefaultBell?: boolean;
}

const UPLOADED_TUNES_STORAGE_KEY = 'freedom_admin_notification_tunes_v1';

export const BUILTIN_NOTIFICATION_TUNES: UploadedNotificationTune[] = [
  {
    id: 'tune_weedchat_official_bell',
    name: 'WeedChat Official Bell Ringtone',
    fileName: 'weedchat-official-bell.synth',
    fileSize: 'Official App Ringtone',
    dataUrl: 'synth:weedchat_official_bell',
    uploadedAt: 'Official Default Ringtone',
    isDefaultBell: true,
  },
  {
    id: 'tune_crystal_bell',
    name: 'Crystal Bell Chime',
    fileName: 'crystal-bell.synth',
    fileSize: 'Built-in',
    dataUrl: 'synth:crystal_bell',
    uploadedAt: 'Default System Tune',
    isDefaultBell: false,
  },
  {
    id: 'tune_emerald_pulse',
    name: 'WeedChat Emerald Pulse',
    fileName: 'emerald-pulse.synth',
    fileSize: 'Built-in',
    dataUrl: 'synth:emerald_pulse',
    uploadedAt: 'Default System Tune',
    isDefaultBell: false,
  },
  {
    id: 'tune_double_ding',
    name: 'Classic Double Ding',
    fileName: 'double-ding.synth',
    fileSize: 'Built-in',
    dataUrl: 'synth:double_ding',
    uploadedAt: 'Default System Tune',
    isDefaultBell: false,
  },
];

export function loadUploadedNotificationTunes(): UploadedNotificationTune[] {
  try {
    const raw = localStorage.getItem(UPLOADED_TUNES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasOfficial = parsed.some((t: UploadedNotificationTune) => t.id === 'tune_weedchat_official_bell');
        if (!hasOfficial) {
          return [BUILTIN_NOTIFICATION_TUNES[0], ...parsed.map((t: UploadedNotificationTune) => ({ ...t, isDefaultBell: false }))];
        }
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return BUILTIN_NOTIFICATION_TUNES;
}

export function saveUploadedNotificationTunes(tunes: UploadedNotificationTune[]): void {
  try {
    localStorage.setItem(UPLOADED_TUNES_STORAGE_KEY, JSON.stringify(tunes));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Plays a synthesized notification bell using Web Audio API when a synth preset is selected
 * or as a fallback if audio playback fails.
 */
export function playSynthNotificationBell(preset: string = 'synth:weedchat_official_bell'): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 120]);
      } catch {
        // ignore vibration permission errors
      }
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    if (preset === 'synth:weedchat_official_bell' || !preset) {
      // Official WeedChat Notification Bell Ringtone: Bright 4-note harmonic chime (C6 -> E6 -> G6 -> C7) with warm bell resonance
      const notes = [
        { freq: 1046.5, harmonic: 2093.0, delay: 0, duration: 0.42, peak: 0.28 },
        { freq: 1318.51, harmonic: 2637.02, delay: 0.11, duration: 0.45, peak: 0.26 },
        { freq: 1567.98, harmonic: 3135.96, delay: 0.22, duration: 0.5, peak: 0.28 },
        { freq: 2093.0, harmonic: 4186.01, delay: 0.35, duration: 0.85, peak: 0.32 },
      ];
      notes.forEach(({ freq, harmonic, delay, duration, peak }) => {
        const oscMain = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gainMain = ctx.createGain();
        const gainHarmonic = ctx.createGain();

        oscMain.type = 'sine';
        oscMain.frequency.setValueAtTime(freq, now + delay);
        gainMain.gain.setValueAtTime(0.001, now + delay);
        gainMain.gain.exponentialRampToValueAtTime(peak, now + delay + 0.015);
        gainMain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(harmonic, now + delay);
        gainHarmonic.gain.setValueAtTime(0.001, now + delay);
        gainHarmonic.gain.exponentialRampToValueAtTime(peak * 0.35, now + delay + 0.01);
        gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration * 0.65);

        oscMain.connect(gainMain);
        gainMain.connect(ctx.destination);
        oscHarmonic.connect(gainHarmonic);
        gainHarmonic.connect(ctx.destination);

        oscMain.start(now + delay);
        oscMain.stop(now + delay + duration + 0.02);
        oscHarmonic.start(now + delay);
        oscHarmonic.stop(now + delay + duration * 0.65 + 0.02);
      });
    } else if (preset === 'synth:emerald_pulse') {
      const freqs = [587.33, 880, 1174.66]; // D5, A5, D6
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.09);
        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.46);
      });
    } else if (preset === 'synth:double_ding') {
      [0, 0.18].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 783.99 : 1046.5, now + offset); // G5 -> C6
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.36);
      });
    } else {
      // Crystal Bell Chime
      const freqs = [659.25, 987.77, 1318.51]; // E5, B5, E6
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.07);
        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.24 / (idx + 1), now + idx * 0.07 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.66);
      });
    }
  } catch {
    // ignore Web Audio errors
  }
}

let activeNotificationAudio: HTMLAudioElement | null = null;

/**
 * Plays a specific notification sound URL (data:audio/... or https://... or synth:...)
 */
export function playNotificationTuneUrl(soundUrl?: string): void {
  if (!soundUrl || soundUrl.startsWith('synth:')) {
    playSynthNotificationBell(soundUrl || 'synth:weedchat_official_bell');
    return;
  }

  try {
    if (activeNotificationAudio) {
      activeNotificationAudio.pause();
      activeNotificationAudio.currentTime = 0;
    }
    const audio = new Audio(soundUrl);
    audio.volume = 0.9;
    activeNotificationAudio = audio;
    audio.play().catch(() => {
      playSynthNotificationBell('synth:weedchat_official_bell');
    });
  } catch {
    playSynthNotificationBell('synth:weedchat_official_bell');
  }
}

/**
 * Plays the currently configured Official App Notification Bell Ringtone from brandConfig or localStorage
 */
export function playDefaultAppNotificationBell(brandConfig?: Partial<AppBrandConfig>): void {
  if (brandConfig?.notificationSoundUrl) {
    playNotificationTuneUrl(brandConfig.notificationSoundUrl);
    return;
  }
  const tunes = loadUploadedNotificationTunes();
  const defaultTune = tunes.find((t) => t.isDefaultBell) || tunes[0];
  playNotificationTuneUrl(defaultTune?.dataUrl || 'synth:weedchat_official_bell');
}
