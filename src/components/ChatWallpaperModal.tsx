import React, { useState } from 'react';
import { X, Image as ImageIcon, Check, Sparkles, Link, Send, Trash2 } from 'lucide-react';
import { ChatWallpaperConfig, ThemeMode, UserContact } from '../types';
import { WALLPAPER_PRESETS, isLikelyImageUrl, createCustomUrlWallpaper, DEFAULT_WALLPAPER_CONFIG } from '../data/wallpapers';

interface ChatWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: UserContact;
  currentWallpaper: ChatWallpaperConfig;
  onSelectWallpaper: (wallpaper: ChatWallpaperConfig, applyToAll?: boolean) => void;
  onSendWallpaperLinkInChat?: (url: string, name: string) => void;
  theme: ThemeMode;
  onShowToast: (msg: string) => void;
}

export const ChatWallpaperModal: React.FC<ChatWallpaperModalProps> = ({
  isOpen,
  onClose,
  contact,
  currentWallpaper,
  onSelectWallpaper,
  onSendWallpaperLinkInChat,
  theme,
  onShowToast,
}) => {
  const isDark = theme === 'dark';
  const [customUrl, setCustomUrl] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);

  if (!isOpen) return null;

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    if (!isLikelyImageUrl(customUrl)) {
      onShowToast('Please enter a valid image URL');
      return;
    }
    const wp = createCustomUrlWallpaper(customUrl.trim(), 20, 0, 'Custom Image');
    onSelectWallpaper(wp, applyToAll);
    onShowToast(`Wallpaper applied for ${contact.name}`);
    onClose();
  };

  const handleShareInChat = () => {
    if (!customUrl.trim()) return;
    if (onSendWallpaperLinkInChat) {
      onSendWallpaperLinkInChat(customUrl.trim(), 'Custom Wallpaper');
      onShowToast('Wallpaper image sent into chat!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border space-y-5 max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-[#181D26] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Chat Wallpaper</h3>
              <p className="text-xs text-slate-400">Custom theme for {contact.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wallpaper presets grid */}
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2.5 uppercase tracking-wider">
            Choose Background Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WALLPAPER_PRESETS.map((wp) => {
              const isSelected = currentWallpaper.id === wp.id;
              return (
                <button
                  key={wp.id}
                  onClick={() => {
                    onSelectWallpaper(wp, applyToAll);
                    onShowToast(`Wallpaper updated to ${wp.name}`);
                  }}
                  className={`h-24 rounded-2xl p-3 text-left relative flex flex-col justify-end border-2 transition-all cursor-pointer overflow-hidden ${
                    isSelected ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/30' : 'border-slate-700/50 hover:border-slate-500'
                  }`}
                  style={{
                    background: wp.previewBg || '#0f172a',
                  }}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <span className="text-xs font-semibold text-white drop-shadow-md truncate">
                    {wp.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Image URL */}
        <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            <Link className="w-4 h-4 text-emerald-400" />
            <span>Set From Image URL</span>
          </div>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://images.unsplash.com/... or image link"
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-mono ${
              isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleApplyCustomUrl}
              disabled={!customUrl.trim()}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Image</span>
            </button>
            {onSendWallpaperLinkInChat && (
              <button
                onClick={handleShareInChat}
                disabled={!customUrl.trim()}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send in Chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Apply to all toggle & Reset */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-emerald-500"
            />
            <span>Apply to all conversations</span>
          </label>
          <button
            onClick={() => {
              onSelectWallpaper(DEFAULT_WALLPAPER_CONFIG, applyToAll);
              onShowToast('Wallpaper reset to default');
              onClose();
            }}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
        </div>
      </div>
    </div>
  );
};
