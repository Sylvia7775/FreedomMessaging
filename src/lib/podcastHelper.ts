export interface PodcastSpeaker {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'co-host' | 'speaker';
  isMicOn: boolean;
  isSpeaking?: boolean;
}

export interface PodcastAudienceMember {
  id: string;
  name: string;
  avatar: string;
  handRaised?: boolean;
}

export interface PodcastChatMessage {
  id: string;
  podcastId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'host' | 'speaker' | 'audience';
  text: string;
  timestamp: string;
}

export interface LivePodcastRoom {
  id: string;
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  isLive: boolean;
  listenersCount: number;
  startedAt: string;
  speakers: PodcastSpeaker[];
  audience: PodcastAudienceMember[];
  chatMessages: PodcastChatMessage[];
}

const PODCAST_ROOMS_STORAGE_KEY = 'freedom_live_podcast_rooms_v1';

export const PODCAST_CATEGORIES = [
  'All Live',
  'Tech & AI',
  'Music & Culture',
  'Creator Talk',
  'Language Exchange',
  'Community Q&A',
  'Late Night Vibes',
];

const INITIAL_LIVE_PODCASTS: LivePodcastRoom[] = [
  {
    id: 'podcast-live-1',
    title: 'Future of AI & Real-Time Multilingual Voice',
    description:
      'Live discussion on instant voice translation, creator tools, and global community building. Join the stage or ask questions in the audience chat!',
    category: 'Tech & AI',
    coverUrl:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
    hostId: 'kristin_watson',
    hostName: 'Kristin Watson',
    hostAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    isLive: true,
    listenersCount: 248,
    startedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    speakers: [
      {
        id: 'kristin_watson',
        name: 'Kristin Watson',
        avatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        role: 'host',
        isMicOn: true,
        isSpeaking: true,
      },
      {
        id: 'ralph_edwards',
        name: 'Ralph Edwards',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        role: 'co-host',
        isMicOn: true,
        isSpeaking: false,
      },
      {
        id: 'jenny_wilson',
        name: 'Jenny Wilson',
        avatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        role: 'speaker',
        isMicOn: false,
        isSpeaking: false,
      },
    ],
    audience: [
      {
        id: 'aud-1',
        name: 'Jacob Jones',
        avatar:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        handRaised: true,
      },
      {
        id: 'aud-2',
        name: 'Albert Flores',
        avatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: 'aud-3',
        name: 'Courtney Henry',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: 'aud-4',
        name: 'Devon Lane',
        avatar:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      },
    ],
    chatMessages: [
      {
        id: 'pchat-1',
        podcastId: 'podcast-live-1',
        senderId: 'kristin_watson',
        senderName: 'Kristin Watson',
        senderAvatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        senderRole: 'host',
        text: 'Welcome everyone to our Live Podcast! Feel free to drop your thoughts in the audience chat or toggle your mic when on stage 🎙️🔥',
        timestamp: '18m ago',
      },
      {
        id: 'pchat-2',
        podcastId: 'podcast-live-1',
        senderId: 'aud-1',
        senderName: 'Jacob Jones',
        senderAvatar:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        senderRole: 'audience',
        text: 'Audio quality is crystal clear! Love the live audience chat feature 👏',
        timestamp: '12m ago',
      },
      {
        id: 'pchat-3',
        podcastId: 'podcast-live-1',
        senderId: 'aud-3',
        senderName: 'Courtney Henry',
        senderAvatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        senderRole: 'audience',
        text: 'Can we talk about how Photo & Video AI Magic Fix helps creators prep podcast covers?',
        timestamp: '4m ago',
      },
    ],
  },
  {
    id: 'podcast-live-2',
    title: 'Indie Music & Late Night Acoustic Session 🎸',
    description:
      'Live acoustic beats, producer Q&A, and open mic showcase with the community.',
    category: 'Music & Culture',
    coverUrl:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    hostId: 'jacob_jones',
    hostName: 'Jacob Jones',
    hostAvatar:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    isLive: true,
    listenersCount: 164,
    startedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    speakers: [
      {
        id: 'jacob_jones',
        name: 'Jacob Jones',
        avatar:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        role: 'host',
        isMicOn: true,
        isSpeaking: true,
      },
      {
        id: 'courtney_henry',
        name: 'Courtney Henry',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        role: 'speaker',
        isMicOn: true,
        isSpeaking: false,
      },
    ],
    audience: [
      {
        id: 'aud-10',
        name: 'Kristin Watson',
        avatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: 'aud-11',
        name: 'Jenny Wilson',
        avatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      },
    ],
    chatMessages: [
      {
        id: 'pchat-201',
        podcastId: 'podcast-live-2',
        senderId: 'jacob_jones',
        senderName: 'Jacob Jones',
        senderAvatar:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        senderRole: 'host',
        text: 'Welcome to Late Night Acoustic Session! Let us know what track vibe you want next in the chat 🎶',
        timestamp: '30m ago',
      },
      {
        id: 'pchat-202',
        podcastId: 'podcast-live-2',
        senderId: 'aud-11',
        senderName: 'Jenny Wilson',
        senderAvatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        senderRole: 'audience',
        text: 'This synth melody is incredible 🔥🔥🔥',
        timestamp: '2m ago',
      },
    ],
  },
  {
    id: 'podcast-live-3',
    title: 'Global Language Exchange & Travel Stories 🌍',
    description:
      'Practice Spanish, French, English, and Japanese live with native speakers from around the world.',
    category: 'Language Exchange',
    coverUrl:
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
    hostId: 'jenny_wilson',
    hostName: 'Jenny Wilson',
    hostAvatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    isLive: true,
    listenersCount: 95,
    startedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    speakers: [
      {
        id: 'jenny_wilson',
        name: 'Jenny Wilson',
        avatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        role: 'host',
        isMicOn: true,
        isSpeaking: true,
      },
    ],
    audience: [
      {
        id: 'aud-20',
        name: 'Ralph Edwards',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      },
    ],
    chatMessages: [
      {
        id: 'pchat-301',
        podcastId: 'podcast-live-3',
        senderId: 'jenny_wilson',
        senderName: 'Jenny Wilson',
        senderAvatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        senderRole: 'host',
        text: '¡Hola a todos! Welcome! Turn on your mic when you join the stage or say hi in the audience chat!',
        timestamp: '8m ago',
      },
    ],
  },
];

function emitPodcastUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('freedom-podcasts-updated'));
  }
}

export function getLivePodcastRooms(): LivePodcastRoom[] {
  try {
    const raw = localStorage.getItem(PODCAST_ROOMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem(PODCAST_ROOMS_STORAGE_KEY, JSON.stringify(INITIAL_LIVE_PODCASTS));
    return INITIAL_LIVE_PODCASTS;
  } catch {
    return INITIAL_LIVE_PODCASTS;
  }
}

export function saveLivePodcastRooms(rooms: LivePodcastRoom[]): void {
  try {
    localStorage.setItem(PODCAST_ROOMS_STORAGE_KEY, JSON.stringify(rooms));
  } catch {}
  emitPodcastUpdate();
}

export function createLivePodcastRoom(params: {
  title: string;
  description: string;
  category: string;
  coverUrl?: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  startMicOn: boolean;
}): LivePodcastRoom {
  const existing = getLivePodcastRooms();
  const defaultCovers = [
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
  ];
  const newRoomId = `podcast-live-${Date.now()}`;
  const newRoom: LivePodcastRoom = {
    id: newRoomId,
    title: params.title.trim() || 'Live Community Podcast',
    description:
      params.description.trim() ||
      'Join the live conversation! Chat with the audience and toggle your mic on stage.',
    category: params.category || 'Creator Talk',
    coverUrl:
      params.coverUrl || defaultCovers[Math.floor(Math.random() * defaultCovers.length)],
    hostId: params.hostId,
    hostName: params.hostName,
    hostAvatar: params.hostAvatar,
    isLive: true,
    listenersCount: 12,
    startedAt: new Date().toISOString(),
    speakers: [
      {
        id: params.hostId,
        name: params.hostName,
        avatar: params.hostAvatar,
        role: 'host',
        isMicOn: params.startMicOn,
        isSpeaking: params.startMicOn,
      },
    ],
    audience: [
      {
        id: 'aud-sim-1',
        name: 'Kristin Watson',
        avatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: 'aud-sim-2',
        name: 'Ralph Edwards',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      },
      {
        id: 'aud-sim-3',
        name: 'Jenny Wilson',
        avatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      },
    ],
    chatMessages: [
      {
        id: `pchat-welcome-${Date.now()}`,
        podcastId: newRoomId,
        senderId: params.hostId,
        senderName: params.hostName,
        senderAvatar: params.hostAvatar,
        senderRole: 'host',
        text: `🎙️ Welcome to "${params.title.trim() || 'Live Community Podcast'}"! Audience chat is open — say hello below!`,
        timestamp: 'Just now',
      },
    ],
  };

  saveLivePodcastRooms([newRoom, ...existing]);
  return newRoom;
}
