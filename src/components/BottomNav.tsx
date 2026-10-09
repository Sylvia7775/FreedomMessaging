import React from 'react';
import { MessageSquare, Users, Phone, User } from 'lucide-react';
import { FooterPageTab, ScreenView, ThemeMode } from '../types';
import { getPersistentUserThumbnail } from '../lib/avatarHelper';

interface BottomNavProps {
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView, footerTab?: FooterPageTab) => void;
  theme?: ThemeMode;
  unreadCount?: number;
  isAdminVerified?: boolean;
  primaryColor?: string;
  userAvatar?: string;
  appName?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  theme = 'light',
  unreadCount = 0,
  primaryColor = '#7C3AED',
  userAvatar,
}) => {
  const isDark = theme === 'dark';
  const resolvedProfileAvatar = getPersistentUserThumbnail({ avatar: userAvatar }, true);

  return (
    <nav
      id="app-bottom-navigation"
      aria-label="Bottom Navigation Menu"
      className={`w-full border-t flex items-center justify-around pt-2.5 pb-2 px-3 select-none transition-colors duration-200 shrink-0 z-30 ${
        isDark
          ? 'bg-[#181A20] border-slate-800 text-slate-400'
          : 'bg-white border-slate-100 text-slate-500 shadow-xs'
      }`}
    >
      {/* 1. Chats Tab */}
      <button
        id="nav-chats-btn"
        type="button"
        onClick={() => onNavigate('chats')}
        style={currentScreen === 'chats' || currentScreen === 'chat_detail' ? { color: primaryColor } : undefined}
        className={`relative flex flex-col items-center justify-center gap-1 py-1.5 px-4 min-w-[70px] transition-all cursor-pointer ${
          currentScreen === 'chats' || currentScreen === 'chat_detail'
            ? 'font-extrabold'
            : isDark
            ? 'font-semibold hover:text-slate-200'
            : 'font-semibold hover:text-slate-800'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <MessageSquare className="w-7 h-7 sm:w-[30px] sm:h-[30px] stroke-[2.25]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#181A20]">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[13px] leading-tight">Chats</span>
      </button>

      {/* 2. People Tab */}
      <button
        id="nav-people-btn"
        type="button"
        onClick={() => onNavigate('people')}
        style={currentScreen === 'people' ? { color: primaryColor } : undefined}
        className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 min-w-[70px] transition-all cursor-pointer ${
          currentScreen === 'people'
            ? 'font-extrabold'
            : isDark
            ? 'font-semibold hover:text-slate-200'
            : 'font-semibold hover:text-slate-800'
        }`}
      >
        <Users className="w-7 h-7 sm:w-[30px] sm:h-[30px] stroke-[2.25]" />
        <span className="text-[13px] leading-tight">People</span>
      </button>

      {/* 3. Calls Tab */}
      <button
        id="nav-calls-btn"
        type="button"
        onClick={() => onNavigate('calls')}
        style={currentScreen === 'calls' ? { color: primaryColor } : undefined}
        className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 min-w-[70px] transition-all cursor-pointer ${
          currentScreen === 'calls'
            ? 'font-extrabold'
            : isDark
            ? 'font-semibold hover:text-slate-200'
            : 'font-semibold hover:text-slate-800'
        }`}
      >
        <Phone className="w-7 h-7 sm:w-[30px] sm:h-[30px] stroke-[2.25]" />
        <span className="text-[13px] leading-tight">Calls</span>
      </button>

      {/* 4. Profile Tab */}
      <button
        id="nav-profile-btn"
        type="button"
        onClick={() => onNavigate('profile')}
        style={currentScreen === 'profile' ? { color: primaryColor } : undefined}
        className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 min-w-[70px] transition-all cursor-pointer ${
          currentScreen === 'profile'
            ? 'font-extrabold'
            : isDark
            ? 'font-semibold hover:text-slate-200'
            : 'font-semibold hover:text-slate-800'
        }`}
      >
        <div className="w-7 h-7 sm:w-[30px] sm:h-[30px] rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          {resolvedProfileAvatar ? (
            <img
              src={resolvedProfileAvatar}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          )}
        </div>
        <span className="text-[13px] leading-tight">Profile</span>
      </button>
    </nav>
  );
};
