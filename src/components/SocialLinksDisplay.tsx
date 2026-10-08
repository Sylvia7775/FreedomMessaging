import React from 'react';
import {
  Twitter,
  Instagram,
  Github,
  Linkedin,
  Facebook,
  Youtube,
  Globe,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { SocialLinkItem, SocialPlatform } from '../types';

interface SocialLinksDisplayProps {
  links?: SocialLinkItem[];
  isDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onEdit?: (link: SocialLinkItem, index: number) => void;
  onRemove?: (platform: SocialPlatform, index?: number) => void;
}

export const getSocialPlatformInfo = (platform: SocialPlatform) => {
  switch (platform) {
    case 'twitter':
      return {
        name: 'X (Twitter)',
        icon: Twitter,
        bgColor: 'hover:bg-sky-500/20 hover:border-sky-500/60 hover:text-sky-400 text-sky-400 border-sky-500/30',
        badgeBg: 'bg-black text-white hover:bg-neutral-800',
        placeholder: 'https://x.com/username or @username',
      };
    case 'instagram':
      return {
        name: 'Instagram',
        icon: Instagram,
        bgColor: 'hover:bg-pink-500/20 hover:border-pink-500/60 hover:text-pink-400 text-pink-400 border-pink-500/30',
        badgeBg: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white',
        placeholder: 'https://instagram.com/username or @username',
      };
    case 'github':
      return {
        name: 'GitHub',
        icon: Github,
        bgColor: 'hover:bg-slate-700/40 hover:border-slate-500 hover:text-white text-slate-300 border-slate-700',
        badgeBg: 'bg-slate-900 text-white hover:bg-slate-800',
        placeholder: 'https://github.com/username',
      };
    case 'linkedin':
      return {
        name: 'LinkedIn',
        icon: Linkedin,
        bgColor: 'hover:bg-blue-600/20 hover:border-blue-500 hover:text-blue-400 text-blue-400 border-blue-500/30',
        badgeBg: 'bg-blue-600 text-white hover:bg-blue-700',
        placeholder: 'https://linkedin.com/in/username',
      };
    case 'facebook':
      return {
        name: 'Facebook',
        icon: Facebook,
        bgColor: 'hover:bg-blue-700/20 hover:border-blue-600 hover:text-blue-500 text-blue-500 border-blue-600/30',
        badgeBg: 'bg-blue-700 text-white hover:bg-blue-800',
        placeholder: 'https://facebook.com/username',
      };
    case 'youtube':
      return {
        name: 'YouTube',
        icon: Youtube,
        bgColor: 'hover:bg-red-600/20 hover:border-red-500 hover:text-red-400 text-red-400 border-red-500/30',
        badgeBg: 'bg-red-600 text-white hover:bg-red-700',
        placeholder: 'https://youtube.com/@channel',
      };
    case 'tiktok':
      return {
        name: 'TikTok',
        icon: Globe,
        bgColor: 'hover:bg-rose-500/20 hover:border-rose-500 hover:text-rose-400 text-rose-400 border-rose-500/30',
        badgeBg: 'bg-black text-white hover:bg-neutral-800',
        placeholder: 'https://tiktok.com/@username',
      };
    case 'website':
    default:
      return {
        name: 'Website',
        icon: Globe,
        bgColor: 'hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-400 text-emerald-400 border-emerald-500/30',
        badgeBg: 'bg-emerald-600 text-white hover:bg-emerald-700',
        placeholder: 'https://yourwebsite.com',
      };
  }
};

export const SocialLinksDisplay: React.FC<SocialLinksDisplayProps> = ({
  links = [],
  isDark = true,
  size = 'md',
  showLabel = true,
  onEdit,
  onRemove,
}) => {
  if (!links || links.length === 0) {
    return (
      <p className="text-xs text-slate-500 italic py-1">
        No social or about links added yet.
      </p>
    );
  }

  const formatUrl = (platform: SocialPlatform, raw: string) => {
    let clean = raw.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.startsWith('@')) {
        clean = clean.substring(1);
      }
      switch (platform) {
        case 'twitter':
          return `https://x.com/${clean}`;
        case 'instagram':
          return `https://instagram.com/${clean}`;
        case 'github':
          return `https://github.com/${clean}`;
        case 'linkedin':
          return `https://linkedin.com/in/${clean}`;
        case 'facebook':
          return `https://facebook.com/${clean}`;
        case 'youtube':
          return `https://youtube.com/@${clean}`;
        case 'tiktok':
          return `https://tiktok.com/@${clean}`;
        case 'website':
        default:
          return `https://${clean}`;
      }
    }
    return clean;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((item, idx) => {
        const info = getSocialPlatformInfo(item.platform);
        const IconComponent = info.icon;
        const targetUrl = formatUrl(item.platform, item.url);
        const displayHandle = item.handle || item.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

        return (
          <div
            key={`${item.platform}-${idx}`}
            className="group relative inline-flex items-center"
          >
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer text-xs font-semibold shadow-xs ${
                info.bgColor
              } ${
                isDark ? 'bg-slate-800/80' : 'bg-slate-100'
              }`}
              title={`Visit ${info.name}: ${targetUrl}`}
            >
              <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              {showLabel && (
                <span className="truncate max-w-[140px]">
                  {displayHandle}
                </span>
              )}
              <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(item, idx);
                }}
                className="ml-1 w-5 h-5 rounded-full bg-purple-500/20 hover:bg-purple-600 text-purple-400 hover:text-white flex items-center justify-center text-[10px] cursor-pointer transition-colors"
                title={`Edit ${info.name} link`}
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            )}

            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(item.platform, idx);
                }}
                className="ml-1 w-5 h-5 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white flex items-center justify-center text-[11px] font-bold cursor-pointer transition-colors"
                title={`Remove ${info.name}`}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
