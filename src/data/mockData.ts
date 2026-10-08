import { UserContact, ChatMessage, CallLog, AppBrandConfig, BannedUser, ReportedUser } from '../types';
import { getInitialsAvatar, getCleanAvatar } from '../lib/avatarHelper';
import { createPlatformSvgThumbnail } from '../lib/videoPlatformHelper';

export const ADMIN_CREDENTIALS = {
  email: 'MobilePhonesky987@gmail.com',
  password: 'B45$y5via',
};

export const calculateInactivityDays = (lastActivityDate?: string, timeStr?: string): number => {
  if (lastActivityDate) {
    const activityTime = new Date(lastActivityDate).getTime();
    if (!isNaN(activityTime)) {
      const diffMs = Date.now() - activityTime;
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
  }
  if (timeStr) {
    if (timeStr.includes('d ago')) {
      const days = parseInt(timeStr.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(days)) return days;
    }
    if (timeStr.includes('mo ago') || timeStr.includes('month')) {
      const months = parseInt(timeStr.replace(/[^0-9]/g, ''), 10) || 1;
      return months * 30;
    }
    if (timeStr.includes('w ago') || timeStr.includes('week')) {
      const weeks = parseInt(timeStr.replace(/[^0-9]/g, ''), 10) || 1;
      return weeks * 7;
    }
  }
  return 0;
};

// Initial verified contacts: ONLY the App Owner / Admin remains (all example users removed)
export const INITIAL_CONTACTS: UserContact[] = [
  {
    id: 'admin_mobilephonesky',
    name: 'WeedChat Support & Admin',
    avatar: getInitialsAvatar('WeedChat Admin', '#7C3AED'),
    lastMessage: 'Welcome to WeedChat! Communicate with any person in your mother language.',
    time: 'Online',
    online: true,
    unreadCount: 0,
    nativeLanguage: 'English',
    statusText: 'Official Administrator',
    status: 'active',
    isBlocked: false,
    entityType: 'individual',
    isGroup: false,
    username: 'mobilephonesky987',
    email: 'MobilePhonesky987@gmail.com',
    location: 'New York,NY',
    bio: 'WeedChat Official Administration & User Support Desk',
  },
];

export const INITIAL_GROUP_MESSAGES: ChatMessage[] = [
  {
    id: 'grp-msg-admin-1',
    senderId: 'me',
    senderParticipantId: 'admin_mobilephonesky',
    senderName: 'WeedChat Support & Admin',
    senderAvatar: getInitialsAvatar('WeedChat Admin', '#7C3AED'),
    senderLanguage: 'English',
    text: 'Welcome to WeedChat! Official App Owner & Admin channel.',
    type: 'text',
    status: 'read',
    timestamp: '1:30 PM',
    dateLabel: 'Today',
  },
];

export const INITIAL_KRISTIN_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-admin-welcome-1',
    senderId: 'other',
    senderName: 'WeedChat Support & Admin',
    senderAvatar: getInitialsAvatar('WeedChat Admin', '#7C3AED'),
    text: 'Welcome to WeedChat! Communicate with any person in your mother language.',
    type: 'text',
    status: 'read',
    timestamp: '1:38 PM',
    dateLabel: 'Yesterday',
  },
  {
    id: 'msg-admin-welcome-2',
    senderId: 'me',
    senderName: 'WeedChat Support & Admin',
    senderAvatar: getInitialsAvatar('WeedChat Admin', '#7C3AED'),
    text: 'Official WeedChat Admin workspace is active and ready.',
    type: 'text',
    status: 'read',
    timestamp: '1:40 PM',
    dateLabel: 'Today',
  },
];

export const INITIAL_CALLS: CallLog[] = [];

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
];

export const DEFAULT_BRAND_CONFIG: AppBrandConfig = {
  appName: 'WeedChat',
  appDescription:
    'WeedChat — Next-generation multilingual messaging with instant mother-tongue translation, Channels, AI Voice & 2FA security.',
  faviconUrl: '/chat-2.svg',
  faviconFileName: 'chat-2.svg',
  primaryColor: '#7C3AED',
  primaryColorName: 'WeedChat Purple',
  notificationSoundUrl: 'synth:weedchat_official_bell',
  notificationSoundFileName: 'weedchat-official-bell.synth',
  notificationTuneName: 'WeedChat Official Bell Ringtone',
  notificationBellSettings: {
    bellSoundUrl: 'synth:weedchat_official_bell',
    bellSoundFileName: 'weedchat-official-bell.synth',
    bellTuneName: 'WeedChat Official Bell Ringtone',
    bellVolume: 90,
    bellAlertMode: 'sound_and_badge',
    vibrateOnRing: true,
    ringOnNewMessage: true,
    ringOnFriendInvite: true,
    isAppDefaultBell: true,
  },
  updatedAt: new Date().toISOString(),
};

export const INITIAL_BANNED_USERS: BannedUser[] = [];

export const INITIAL_REPORTED_USERS: ReportedUser[] = [];
