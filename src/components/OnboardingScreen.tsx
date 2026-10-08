import React, { useState } from 'react';
import { FreedomLogo } from './FreedomLogo';
import { StatusBar } from './StatusBar';
import { ChevronRight, Globe, Sparkles } from 'lucide-react';
import { AVAILABLE_LANGUAGES } from '../data/mockData';
import { ThemeMode } from '../types';

interface OnboardingScreenProps {
  onStart: () => void;
  theme?: ThemeMode;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onStart,
  theme = 'light',
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const isDark = theme === 'dark';

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-[#12161F] text-white' : 'bg-white text-slate-900'
      }`}
    >
      {/* Top Status bar */}
      <StatusBar time="9:41" theme={isDark ? 'dark' : 'light'} />

      {/* Language Selector in top bar */}
      <div className="flex justify-between items-center px-6 pt-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Globe className="w-3.5 h-3.5" />
          <select
            aria-label="Select Mother Language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent border-none outline-none cursor-pointer font-semibold text-xs"
          >
            {AVAILABLE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-slate-900">
                {lang.name} ({lang.native})
              </option>
            ))}
          </select>
        </div>

        <button
          id="onboarding-skip-btn"
          onClick={onStart}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-emerald-500 transition-colors"
        >
          <span>Skip</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Branding & Illustration */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-6">
        <div className="relative mb-8 transform hover:scale-105 transition-transform duration-300">
          {/* Subtle glow circle */}
          <div className="absolute inset-0 bg-emerald-500/15 blur-2xl rounded-full scale-125 pointer-events-none" />
          <FreedomLogo size="xl" theme={theme} showText={true} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight max-w-xs leading-tight mb-3">
          Welcome to WeedChat
        </h1>

        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          WeedChat — talk to any person in your mother language.
        </p>

        {/* Feature badge */}
        <div className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time instant speech & text translation</span>
        </div>
      </div>

      {/* Bottom Action Buttons matching screenshot */}
      <div className="px-6 pb-8 space-y-3">
        <button
          id="onboarding-signin-btn"
          onClick={onStart}
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Sign in</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          id="onboarding-signup-btn"
          onClick={onStart}
          className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold rounded-2xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Sign up</span>
        </button>
      </div>
    </div>
  );
};
