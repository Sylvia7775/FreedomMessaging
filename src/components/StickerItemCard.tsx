import React from 'react';
import { StickerItem } from '../types';
import { Sparkles } from 'lucide-react';

interface StickerItemCardProps {
  sticker: StickerItem;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
  showLabel?: boolean;
}

export const StickerItemCard: React.FC<StickerItemCardProps> = ({
  sticker,
  size = 'md',
  interactive = true,
  onClick,
  showLabel = false,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 sm:w-36 sm:h-36 text-5xl',
  };

  const badgeSize = {
    sm: 'text-[8px] px-1 py-0.2',
    md: 'text-[10px] px-1.5 py-0.5',
    lg: 'text-xs px-2.5 py-0.5',
  };

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`relative flex flex-col items-center justify-center select-none group ${
        interactive
          ? 'cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-150'
          : ''
      }`}
    >
      {/* Vinyl die-cut sticker badge container */}
      <div
        className={`${sizeClasses[size]} relative rounded-2xl bg-gradient-to-br ${sticker.bgGradient} p-1 shadow-md shadow-black/20 flex flex-col items-center justify-center overflow-hidden border-2 border-white/95 dark:border-white/80 ring-1 ring-black/10`}
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.18))',
        }}
      >
        {/* Subtle glossy sheen highlight on top edge */}
        <div className="absolute -top-6 -left-6 w-20 h-16 bg-white/25 rounded-full blur-xs pointer-events-none rotate-12" />

        {/* Center Emblem / Animated Emoji or Uploaded Image */}
        <div className="relative z-10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
          {sticker.imageUrl ? (
            <img
              src={sticker.imageUrl}
              alt={sticker.name}
              className={`${
                size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-16 h-16' : 'w-22 h-22 sm:w-24 sm:h-24'
              } object-contain drop-shadow-md select-none pointer-events-none rounded-xl`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="drop-shadow-md select-none leading-none">{sticker.emoji}</span>
          )}
        </div>

        {/* Die-cut badge text pill at bottom */}
        {sticker.badgeText && (
          <div
            className={`absolute bottom-1 z-10 font-black tracking-wider uppercase bg-white/95 text-slate-900 rounded-full shadow-xs ${badgeSize[size]} whitespace-nowrap leading-tight text-center`}
          >
            {sticker.badgeText}
          </div>
        )}

        {/* Tiny sparkle accent */}
        <Sparkles className="absolute top-1 right-1 w-3 h-3 text-white/70 pointer-events-none" />
      </div>

      {/* Optional title caption */}
      {showLabel && (
        <span className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[80px] text-center">
          {sticker.name}
        </span>
      )}
    </div>
  );
};
