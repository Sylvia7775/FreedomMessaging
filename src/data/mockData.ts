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

// Initial WhatsApp-style contacts & groups (Admin logged out everywhere)
export const INITIAL_CONTACTS: UserContact[] = [
  {
    id: 'usr_elena_rodriguez',
    name: 'Elena Rodriguez',
    avatar: getInitialsAvatar('Elena Rodriguez', '#10B981'),
    lastMessage: '¡Hola! Are we still on for the video call today? 📞',
    time: '10:42 AM',
    online: true,
    unreadCount: 2,
    nativeLanguage: 'Spanish',
    statusText: 'Available • WhatsApp Encrypted',
    status: 'active',
    isBlocked: false,
     isPinned: true,
    entityType: 'individual',
    isGroup: false,
    username: 'elena_rodriguez',
    phoneNumber: '+34 612 345 678',
    email: 'elena.rodriguez@weedchat.app',
    location: 'Madrid, ES',
    bio: 'Product Designer • Communicating across languages 🌎',
    lastMessageStatus: 'read',
    isVerified: true,
    profileValidatedAt: '2026-10-01T09:30:00.000Z',
  },
  {
    id: 'usr_marcus_vance',
    name: 'Marcus Vance',
    avatar: getInitialsAvatar('Marcus Vance', '#3B82F6'),
    lastMessage: 'Sent the updated project photos and voice note 🎙️',
    time: '9:15 AM',
    online: true,
    unreadCount: 1,
    nativeLanguage: 'English',
    statusText: 'Online',
    status: 'active',
    isBlocked: false,
    entityType: 'individual',
    isGroup: false,
    username: 'marcus_vance',
    phoneNumber: '+1 (415) 890-2341',
    email: 'marcus.vance@weedchat.app',
    location: 'San Francisco, CA',
    bio: 'Building next-gen mobile experiences 🚀',
    lastMessageStatus: 'delivered',
    isVerified: true,
    profileValidatedAt: '2026-10-02T14:15:00.000Z',
  },
  {
    id: 'group_global_team',
    name: 'Global Friends & Creators 🌍',
    avatar: getInitialsAvatar('Global Friends', '#7C3AED'),
    lastMessage: 'Aisha: Welcome everyone! Messages auto-translate here ✨',
    time: 'Yesterday',
    online: true,
    unreadCount: 3,
    nativeLanguage: 'English',
    statusText: '4 members • 3 online',
    status: 'active',
    isBlocked: false,
    entityType: 'group',
    isGroup: true,
    isJoinedGroup: true,
    isVerified: true,
    profileValidatedAt: '2026-10-01T12:00:00.000Z',
    groupTopic: 'Multilingual WhatsApp-style group chat with instant mother-tongue translation',
    participants: [
      {
        id: 'usr_elena_rodriguez',
        name: 'Elena Rodriguez',
        avatar: getInitialsAvatar('Elena Rodriguez', '#10B981'),
        role: 'admin',
        nativeLanguage: 'Spanish',
        online: true,
        isVerified: true,
        profileValidatedAt: '2026-10-01T09:30:00.000Z',
      },
      {
        id: 'usr_marcus_vance',
        name: 'Marcus Vance',
        avatar: getInitialsAvatar('Marcus Vance', '#3B82F6'),
        role: 'member',
        nativeLanguage: 'English',
        online: true,
        isVerified: true,
        profileValidatedAt: '2026-10-02T14:15:00.000Z',
      },
      {
        id: 'usr_aisha_mansoor',
        name: 'Aisha Al-Mansoor',
        avatar: getInitialsAvatar('Aisha Al-Mansoor', '#F59E0B'),
        role: 'member',
        nativeLanguage: 'Arabic',
        online: true,
        isVerified: true,
        profileValidatedAt: '2026-10-03T11:20:00.000Z',
      },
    ],
  },
  {
    id: 'usr_aisha_mansoor',
    name: 'Aisha Al-Mansoor',
    avatar: getInitialsAvatar('Aisha Al-Mansoor', '#F59E0B'),
    lastMessage: 'Thank you! The instant Arabic-English translation works great.',
    time: 'Yesterday',
    online: false,
    unreadCount: 0,
    nativeLanguage: 'Arabic',
    statusText: 'Last seen yesterday at 8:20 PM',
    status: 'active',
    isBlocked: false,
    entityType: 'individual',
    isGroup: false,
    username: 'aisha_mansoor',
    phoneNumber: '+971 50 123 4567',
    email: 'aisha@weedchat.app',
    location: 'Dubai, UAE',
    bio: 'Creative Director & Photographer 📸',
    lastMessageStatus: 'read',
    isVerified: true,
    profileValidatedAt: '2026-10-03T11:20:00.000Z',
  },
  {
    id: 'usr_kenji_takahashi',
    name: 'Kenji Takahashi',
    avatar: getInitialsAvatar('Kenji Takahashi', '#EC4899'),
    lastMessage: 'Let’s catch up on a voice call tomorrow morning!',
    time: 'Tuesday',
    online: true,
    unreadCount: 0,
    nativeLanguage: 'Japanese',
    statusText: 'Online',
    status: 'active',
    isBlocked: false,
    entityType: 'individual',
    isGroup: false,
    username: 'kenji_t',
    phoneNumber: '+81 90 1234 5678',
    email: 'kenji@weedchat.app',
    location: 'Tokyo, JP',
    bio: 'Sound Engineer & Podcaster 🎧',
    lastMessageStatus: 'read',
    isVerified: true,
    profileValidatedAt: '2026-10-04T08:45:00.000Z',
  },
];

export const INITIAL_GROUP_MESSAGES: ChatMessage[] = [
  {
    id: 'grp-msg-1',
    senderId: 'other',
    senderParticipantId: 'usr_elena_rodriguez',
    senderName: 'Elena Rodriguez',
    senderAvatar: getInitialsAvatar('Elena Rodriguez', '#10B981'),
    senderLanguage: 'Spanish',
    text: 'Welcome to Global Friends & Creators! Every message here is end-to-end encrypted.',
    translation: {
      original: '¡Bienvenidos a Global Friends & Creators! Cada mensaje aquí está cifrado de extremo a extremo.',
      translated: 'Welcome to Global Friends & Creators! Every message here is end-to-end encrypted.',
      language: 'English',
    },
    type: 'text',
    status: 'read',
    timestamp: '11:20 AM',
    dateLabel: 'Today',
  },
  {
    id: 'grp-msg-2',
    senderId: 'other',
    senderParticipantId: 'usr_aisha_mansoor',
    senderName: 'Aisha Al-Mansoor',
    senderAvatar: getInitialsAvatar('Aisha Al-Mansoor', '#F59E0B'),
    senderLanguage: 'Arabic',
    text: 'Welcome everyone! Messages auto-translate here ✨',
    translation: {
      original: 'مرحباً بالجميع! الرسائل تترجم تلقائياً هنا ✨',
      translated: 'Welcome everyone! Messages auto-translate here ✨',
      language: 'English',
    },
    type: 'text',
    status: 'read',
    timestamp: '11:24 AM',
    dateLabel: 'Today',
  },
];

export const INITIAL_KRISTIN_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-chat-1',
    senderId: 'other',
    senderName: 'Elena Rodriguez',
    senderAvatar: getInitialsAvatar('Elena Rodriguez', '#10B981'),
    senderLanguage: 'Spanish',
    text: 'Hey! Welcome to WeedChat — your messages, voice notes, and calls work just like WhatsApp with instant language translation.',
    translation: {
      original: '¡Hola! Bienvenido a WeedChat: tus mensajes, notas de voz y llamadas funcionan como WhatsApp con traducción instantánea.',
      translated: 'Hey! Welcome to WeedChat — your messages, voice notes, and calls work just like WhatsApp with instant language translation.',
      language: 'English',
    },
    type: 'text',
    status: 'read',
    timestamp: '10:38 AM',
    dateLabel: 'Today',
  },
  {
    id: 'msg-chat-2',
    senderId: 'me',
    senderName: 'You',
    senderAvatar: getInitialsAvatar('You', '#7C3AED'),
    text: 'Awesome! The double-check read receipts and voice notes work smoothly.',
    type: 'text',
    status: 'read',
    timestamp: '10:40 AM',
    dateLabel: 'Today',
  },
  {
    id: 'msg-chat-3',
    senderId: 'other',
    senderName: 'Elena Rodriguez',
    senderAvatar: getInitialsAvatar('Elena Rodriguez', '#10B981'),
    senderLanguage: 'Spanish',
    text: '¡Hola! Are we still on for the video call today? 📞',
    translation: {
      original: '¡Hola! ¿Seguimos en pie para la videollamada de hoy? 📞',
      translated: '¡Hola! Are we still on for the video call today? 📞',
      language: 'English',
    },
    type: 'text',
    status: 'read',
    timestamp: '10:42 AM',
    dateLabel: 'Today',
  },
];

export const INITIAL_CALLS: CallLog[] = [
  {
    id: 'call-1',
    contactId: 'usr_elena_rodriguez',
    contactName: 'Elena Rodriguez',
    avatar: getInitialsAvatar('Elena Rodriguez', '#10B981'),
    type: 'video',
    direction: 'incoming',
    time: 'Today, 10:15 AM',
    duration: '12m 40s',
  },
  {
    id: 'call-2',
    contactId: 'usr_marcus_vance',
    contactName: 'Marcus Vance',
    avatar: getInitialsAvatar('Marcus Vance', '#3B82F6'),
    type: 'voice',
    direction: 'outgoing',
    time: 'Yesterday, 6:30 PM',
    duration: '5m 18s',
  },
];

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
