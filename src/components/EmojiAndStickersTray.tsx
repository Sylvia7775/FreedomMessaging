import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  Smile,
  Tag,
  Clock,
  Flame,
  Heart,
  PartyPopper,
  Shield,
  Layers,
} from 'lucide-react';
import { StickerItem } from '../types';
import { STICKER_CATEGORIES, STICKERS_COLLECTION } from '../data/stickersData';
import { StickerItemCard } from './StickerItemCard';

interface EmojiAndStickersTrayProps {
  isDark: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onDeleteChar: () => void;
  onSendSticker: (sticker: StickerItem) => void;
  initialTab?: 'emojis' | 'stickers';
  customStickers?: StickerItem[];
}

const ANDROID_EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Emotion',
    emojis: [
      '😊', '😂', '🤣', '😍', '🥰', '😎', '🥳', '😇',
      '😋', '😜', '🤩', '🤔', '😴', '😅', '😭', '🥺',
      '😏', '🙄', '🤗', '🤐', '🤫', '🤭', '🤓', '🤠',
    ],
  },
  {
    name: 'Gestures & People',
    emojis: [
      '👍', '👎', '👏', '🙌', '🙏', '👋', '🤝', '✌️',
      '💪', '👊', '🤞', '🤙', '👈', '👉', '☝️', '✋',
    ],
  },
  {
    name: 'Hearts & Symbols',
    emojis: [
      '❤️', '💖', '💙', '💜', '💚', '💛', '🧡', '🖤',
      '🔥', '✨', '🎉', '💯', '⭐', '🚀', '💡', '☕',
      '🎵', '🌿', '💬', '👀', '🕊️', '⚡', '🏆', '💎',
    ],
  },
];

export const EmojiAndStickersTray: React.FC<EmojiAndStickersTrayProps> = ({
  isDark,
  onClose,
  onSelectEmoji,
  onDeleteChar,
  onSendSticker,
  initialTab = 'stickers',
  customStickers = [],
}) => {
  const [activeTab, setActiveTab] = useState<'emojis' | 'stickers'>(initialTab);
  const [stickerCategory, setStickerCategory] = useState<StickerItem['category'] | 'all'>('all');
  const [stickerSearch, setStickerSearch] = useState('');

  // Combined stickers list: Custom Admin Uploads appear first!
  const allStickers = useMemo(() => {
    if (!customStickers || customStickers.length === 0) return STICKERS_COLLECTION;
    return [...customStickers, ...STICKERS_COLLECTION];
  }, [customStickers]);

  // Dynamic categories with Admin Uploads tab if custom stickers exist
  const categories = useMemo(() => {
    if (!customStickers || customStickers.length === 0) return STICKER_CATEGORIES;
    return [
      { id: 'all', label: 'All', icon: '✨' },
      { id: 'custom', label: 'Admin Uploads', icon: '⭐' },
      ...STICKER_CATEGORIES.filter((c) => c.id !== 'all'),
    ];
  }, [customStickers]);

  const [recentStickerIds, setRecentStickerIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('freedom_recent_stickers');
      return stored ? JSON.parse(stored) : ['cat-love', 'fire-lit', 'party-time', 'freedom-dove'];
    } catch {
      return ['cat-love', 'fire-lit', 'party-time', 'freedom-dove'];
    }
  });

  const handleStickerClick = (sticker: StickerItem) => {
    // Add to recents
    setRecentStickerIds((prev) => {
      const updated = [sticker.id, ...prev.filter((id) => id !== sticker.id)].slice(0, 6);
      try {
        localStorage.setItem('freedom_recent_stickers', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });

    onSendSticker(sticker);
  };

  const filteredStickers = useMemo(() => {
    return allStickers.filter((sticker) => {
      const matchesCategory =
        stickerCategory === 'all' ||
        sticker.category === stickerCategory ||
        (stickerCategory === 'custom' && (sticker.uploadedBy || sticker.category === 'custom'));
      const matchesSearch =
        !stickerSearch.trim() ||
        sticker.name.toLowerCase().includes(stickerSearch.toLowerCase()) ||
        sticker.title.toLowerCase().includes(stickerSearch.toLowerCase()) ||
        (sticker.badgeText && sticker.badgeText.toLowerCase().includes(stickerSearch.toLowerCase())) ||
        sticker.category.toLowerCase().includes(stickerSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allStickers, stickerCategory, stickerSearch]);

  const recentStickers = useMemo(() => {
    return recentStickerIds
      .map((id) => allStickers.find((s) => s.id === id))
      .filter((s): s is StickerItem => Boolean(s));
  }, [recentStickerIds, allStickers]);

  return (
    <div
      id="emoji-and-stickers-tray"
      className={`border-t select-none animate-in slide-in-from-bottom-2 duration-150 flex flex-col ${
        isDark ? 'bg-[#181A20] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}
    >
      {/* Top Header with Tab Switcher: Emojis vs Stickers */}
      <div className="px-3 pt-2.5 pb-2 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 gap-2">
        {/* Modern Segmented Tab Switcher */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            id="tray-tab-stickers"
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'stickers'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Stickers</span>
            <span
              className={`text-[10px] px-1 rounded-full ${
                activeTab === 'stickers'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
              }`}
            >
              {allStickers.length}
            </span>
          </button>

          <button
            type="button"
            id="tray-tab-emojis"
            onClick={() => setActiveTab('emojis')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'emojis'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emojis</span>
          </button>
        </div>

        {/* Right side controls: Backspace & Close */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'emojis' && (
            <button
              type="button"
              id="tray-emoji-backspace-btn"
              onClick={onDeleteChar}
              className="text-xs px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1 font-medium transition-colors"
              title="Delete last character"
            >
              <span>⌫</span>
              <span className="hidden sm:inline">Del</span>
            </button>
          )}

          <button
            type="button"
            id="tray-close-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Close tray"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB 1: STICKERS VIEW */}
      {activeTab === 'stickers' && (
        <div className="p-3 flex flex-col gap-2.5">
          {/* Sticker Search Bar & Category Scroller */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                id="sticker-search-input"
                type="text"
                value={stickerSearch}
                onChange={(e) => setStickerSearch(e.target.value)}
                placeholder="Search stickers (cat, fire, hug, winner...)"
                className={`w-full text-xs py-1.5 pl-8 pr-7 rounded-xl outline-none border transition-all ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-700/80 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
              {stickerSearch && (
                <button
                  type="button"
                  onClick={() => setStickerSearch('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Tap to send</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                id={`sticker-cat-${cat.id}`}
                onClick={() => setStickerCategory(cat.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 font-medium transition-all cursor-pointer ${
                  stickerCategory === cat.id
                    ? 'bg-emerald-500 text-white shadow-xs font-semibold'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Recent Stickers strip if available and on 'all' or empty search */}
          {!stickerSearch && stickerCategory === 'all' && recentStickers.length > 0 && (
            <div className="border-b border-slate-200/50 dark:border-slate-800/60 pb-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>Recently Used Stickers</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {recentStickers.map((sticker) => (
                  <div
                    key={`recent-${sticker.id}`}
                    id={`recent-sticker-${sticker.id}`}
                    className="shrink-0 p-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <StickerItemCard
                      sticker={sticker}
                      size="sm"
                      onClick={() => handleStickerClick(sticker)}
                      showLabel
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Sticker Grid */}
          <div className="max-h-56 overflow-y-auto pr-1">
            {filteredStickers.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
                <Tag className="w-8 h-8 stroke-[1.5] text-slate-400 mb-1.5" />
                <p className="text-xs font-semibold">No stickers found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Try searching with a different keyword</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pb-2">
                {filteredStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    id={`sticker-item-${sticker.id}`}
                    className="p-1 rounded-xl flex flex-col items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <StickerItemCard
                      sticker={sticker}
                      size="md"
                      onClick={() => handleStickerClick(sticker)}
                      showLabel
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EMOJIS VIEW */}
      {activeTab === 'emojis' && (
        <div className="p-3 max-h-60 overflow-y-auto pr-1 space-y-3">
          {ANDROID_EMOJI_CATEGORIES.map((cat, idx) => (
            <div key={idx}>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                {cat.name}
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {cat.emojis.map((emoji, eIdx) => (
                  <button
                    key={eIdx}
                    type="button"
                    onClick={() => onSelectEmoji(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-xl rounded-lg hover:bg-slate-200/80 dark:hover:bg-slate-800/80 active:scale-90 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
