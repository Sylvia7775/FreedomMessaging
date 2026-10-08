import React, { useState, useEffect } from 'react';
import { FreedomLogo } from './FreedomLogo';
import { Lock, Globe, Database, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { ThemeMode } from '../types';

interface AppLoadingPageProps {
  appName?: string;
  customFavicon?: string;
  primaryColor?: string;
  onComplete: () => void;
  durationMs?: number;
  theme?: ThemeMode;
}

const LOADING_STEPS = [
  { at: 0, text: 'Starting secure cryptographic sandbox...' },
  { at: 22, text: 'Verifying end-to-end encryption keys...' },
  { at: 48, text: 'Connecting to real-time messaging mesh...' },
  { at: 74, text: 'Synchronizing mother-language translation engines...' },
  { at: 92, text: 'Loading conversation threads & active media...' },
  { at: 100, text: 'Security verified. Welcome to WeedChat!' },
];

export const AppLoadingPage: React.FC<AppLoadingPageProps> = ({
  appName = 'WeedChat',
  customFavicon,
  primaryColor = '#7C3AED',
  onComplete,
  durationMs = 2400,
  theme = 'dark',
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.round((elapsed / durationMs) * 100));

      setProgress(rawPct);

      // Determine step
      const stepIdx = LOADING_STEPS.slice().reverse().findIndex((s) => rawPct >= s.at);
      if (stepIdx !== -1) {
        setCurrentStepIndex(LOADING_STEPS.length - 1 - stepIdx);
      }

      if (rawPct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 350);
        }, 200);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  const isDark = theme === 'dark' || true; // Default dark aesthetic provides sleek native splash feel

  return (
    <div
      id="app-loading-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden transition-all duration-300 ${
        isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      } ${
        isDark
          ? 'bg-[#0f131a] text-white'
          : 'bg-slate-900 text-white'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.12) 0%, rgba(15, 19, 26, 0.95) 70%, #0a0d12 100%)`,
      }}
    >
      {/* Top Header / Skip Button */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-2 sm:pt-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Initializing
          </span>
        </div>

        <button
          type="button"
          id="skip-loading-screen-btn"
          onClick={handleSkip}
          className="group flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-95"
          title="Skip loading screen directly to app"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Center Branding & App Icon Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full -mt-4 z-10">
        {/* Glowing Aura Ring & App Icon Container */}
        <div className="relative mb-7">
          {/* Ambient Outer Pulse Ring */}
          <div
            className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl animate-pulse"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute -inset-1 rounded-3xl opacity-50 blur-md transition-all duration-500"
            style={{ backgroundColor: primaryColor }}
          />

          {/* App Icon Container */}
          <div
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-900/90 border border-white/20 p-5 shadow-2xl flex items-center justify-center transform transition-transform hover:scale-105 duration-300"
            style={{
              boxShadow: `0 20px 40px -15px ${primaryColor}40`,
            }}
          >
            {customFavicon ? (
              <img
                src={customFavicon}
                alt={`${appName} Icon`}
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            ) : (
              <FreedomLogo
                appName={appName}
                customFavicon={customFavicon}
                primaryColor={primaryColor}
                size="lg"
                showText={false}
                theme="dark"
              />
            )}

            {/* Micro Sparkle badge */}
            <div
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md border border-white/30"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* App Title & Tagline */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
          {appName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs leading-relaxed mb-8">
          Talk any person of your mother language with private end-to-end encryption.
        </p>

        {/* Progress Bar Container */}
        <div className="w-full max-w-xs space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{LOADING_STEPS[currentStepIndex]?.text || 'Loading...'}</span>
            </span>
            <span className="font-bold text-white tracking-wider">{progress}%</span>
          </div>

          {/* Outer Track */}
          <div className="relative w-full h-2.5 rounded-full bg-slate-800/80 border border-white/10 overflow-hidden shadow-inner p-0.5">
            {/* Animated Inner Bar */}
            <div
              className="h-full rounded-full transition-all duration-150 ease-out relative overflow-hidden"
              style={{
                width: `${progress}%`,
                backgroundColor: primaryColor,
              }}
            >
              {/* Shimmer light effect passing through */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
            </div>
          </div>

          {/* Step indicator pills */}
          <div className="pt-2 flex items-center justify-center gap-1 text-[11px] text-slate-400">
            {progress === 100 ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold animate-in fade-in duration-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Initialization complete
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">
                Preparing secure environment...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Trust & Capability Badges */}
      <div className="w-full max-w-md z-10 pb-2">
        <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex flex-col items-center text-center gap-1">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-semibold text-slate-300">E2E Encrypted</span>
            <span className="text-[9px] text-slate-500 leading-none">Zero Knowledge</span>
          </div>

          <div className="flex flex-col items-center text-center gap-1 border-x border-white/10 px-1">
            <Globe className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] font-semibold text-slate-300">Multilingual</span>
            <span className="text-[9px] text-slate-500 leading-none">30+ Languages</span>
          </div>

          <div className="flex flex-col items-center text-center gap-1">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-slate-300">Live Sync</span>
            <span className="text-[9px] text-slate-500 leading-none">Real-time DB</span>
          </div>
        </div>

        <div className="text-center mt-3">
          <p className="text-[10px] text-slate-600 font-mono tracking-tight">
            Protected by Freedom Core Protocol v2.4
          </p>
        </div>
      </div>
    </div>
  );
};
