import React, { useEffect, useRef, useState } from 'react';

interface AppLoadingScreenProps {
  appName?: string;
  tagline?: string;
  onFinishLoading?: () => void;
  durationMs?: number;
}

export const ChatBubbleLogoSvg: React.FC<{ className?: string }> = ({
  className = 'w-28 h-28',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    className={className}
    aria-label="App Loading Logo"
  >
    <defs>
      <linearGradient id="appLoadingChatGrad" x1="12%" y1="12%" x2="88%" y2="88%">
        <stop offset="0%" stopColor="#F700FF" />
        <stop offset="50%" stopColor="#9D00F0" />
        <stop offset="100%" stopColor="#5200D1" />
      </linearGradient>
      <linearGradient id="appLoadingDotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#AC00F5" />
        <stop offset="100%" stopColor="#7B00DF" />
      </linearGradient>
    </defs>
    {/* Outer Magenta-to-Purple Circle */}
    <circle cx="256" cy="256" r="252" fill="url(#appLoadingChatGrad)" />
    {/* White Speech Bubble with bottom-left tail */}
    <path
      d="M 256 122 C 330 122 390 178 390 248 C 390 318 330 374 256 374 C 239 374 222 371 207 366 L 124 390 L 143 317 C 129 297 122 273 122 248 C 122 178 182 122 256 122 Z"
      fill="#FFFFFF"
    />
    {/* Three Purple Dots inside Speech Bubble */}
    <circle cx="192" cy="254" r="21" fill="url(#appLoadingDotGrad)" />
    <circle cx="256" cy="254" r="21" fill="url(#appLoadingDotGrad)" />
    <circle cx="320" cy="254" r="21" fill="url(#appLoadingDotGrad)" />
  </svg>
);

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  appName = 'WeedChat',
  tagline = 'WeedChat — Talk to any person in your mother language',
  onFinishLoading,
  durationMs = 800,
}) => {
  const [progress, setProgress] = useState(12);
  const finishRef = useRef(onFinishLoading);
  finishRef.current = onFinishLoading;

  useEffect(() => {
    const start = Date.now();
    let done = false;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);
      if (pct >= 100 && !done) {
        done = true;
        clearInterval(interval);
        if (finishRef.current) {
          setTimeout(() => finishRef.current?.(), 100);
        }
      }
    }, 40);

    const safetyTimer = setTimeout(() => {
      if (!done) {
        done = true;
        clearInterval(interval);
        finishRef.current?.();
      }
    }, durationMs + 250);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, [durationMs]);

  return (
    <div
      id="app-loading-screen"
      onClick={onFinishLoading}
      className="w-full h-full min-h-[540px] flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-b from-[#150A2A] via-[#1E0F3B] to-[#0F071E] text-white select-none relative overflow-hidden cursor-pointer"
      title="Click to enter immediately"
    >
      {/* Ambient glow behind logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-purple-600/25 blur-2xl pointer-events-none" />

      {/* Top spacer */}
      <div className="text-xs font-semibold tracking-widest uppercase text-purple-300/70">
        Secure Multilingual Chat
      </div>

      {/* Center Logo & Brand Name */}
      <div className="flex flex-col items-center z-10 my-auto">
        <div className="relative flex items-center justify-center">
          {/* Outer subtle pulse ring */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-fuchsia-500/30 to-purple-600/30 animate-pulse blur-md" />
          <div className="relative rounded-full shadow-2xl shadow-purple-950/80 transform transition-transform duration-500 hover:scale-105">
            <ChatBubbleLogoSvg className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-[0_12px_28px_rgba(180,0,255,0.45)]" />
          </div>
        </div>

        <h1 className="mt-7 text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-center">
          {appName}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-purple-200/80 text-center max-w-xs font-medium">
          {tagline}
        </p>

        {/* Animated three dots indicator */}
        <div className="flex items-center gap-2 mt-6">
          <span
            className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="w-full max-w-[220px] flex flex-col items-center gap-2 z-10">
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F700FF] via-[#9D00F0] to-[#5200D1] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between w-full text-[11px] font-mono text-purple-200/75">
          <span>Loading workspace...</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};
