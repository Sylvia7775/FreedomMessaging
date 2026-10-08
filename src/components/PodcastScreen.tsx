import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Mic,
  MicOff,
  Users,
  MessageSquare,
  Send,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
  Hand,
  ArrowLeft,
  X,
  Headphones,
  CheckCircle2,
  Search,
  Share2,
} from 'lucide-react';
import { ScreenView, ThemeMode, UserProfile, FooterPageTab } from '../types';
import {
  LivePodcastRoom,
  PodcastChatMessage,
  PODCAST_CATEGORIES,
  getLivePodcastRooms,
  saveLivePodcastRooms,
  createLivePodcastRoom,
} from '../lib/podcastHelper';
import { BottomNav } from './BottomNav';

interface PodcastScreenProps {
  currentUser: UserProfile;
  theme: ThemeMode;
  primaryColor?: string;
  onNavigate: (screen: ScreenView, footerTab?: FooterPageTab) => void;
  isAdminVerified?: boolean;
}

export const PodcastScreen: React.FC<PodcastScreenProps> = ({
  currentUser,
  theme,
  primaryColor = '#7C3AED',
  onNavigate,
  isAdminVerified = false,
}) => {
  const isDark = theme === 'dark';

  const [rooms, setRooms] = useState<LivePodcastRoom[]>(() => getLivePodcastRooms());
  const [selectedCategory, setSelectedCategory] = useState<string>('All Live');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Currently joined Live Podcast Room
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);

  // Audience Chat Input inside active Podcast
  const [audienceChatInput, setAudienceChatInput] = useState<string>('');
  const [floatingReactions, setFloatingReactions] = useState<
    { id: number; emoji: string; left: number }[]
  >([]);

  // Create Live Podcast Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newPodcastTitle, setNewPodcastTitle] = useState<string>('');
  const [newPodcastDesc, setNewPodcastDesc] = useState<string>('');
  const [newPodcastCategory, setNewPodcastCategory] = useState<string>('Tech & AI');
  const [newPodcastStartMicOn, setNewPodcastStartMicOn] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserIntervalRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  useEffect(() => {
    const handleSync = () => {
      setRooms(getLivePodcastRooms());
    };
    window.addEventListener('freedom-podcasts-updated', handleSync);
    return () => window.removeEventListener('freedom-podcasts-updated', handleSync);
  }, []);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  // Scroll audience chat to bottom when new messages arrive
  useEffect(() => {
    if (activeRoomId) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeRoom?.chatMessages.length, activeRoomId]);

  // Manage real Web Audio API microphone stream & audio level meter when Mic is ON
  useEffect(() => {
    const stopMicStream = () => {
      if (analyserIntervalRef.current) {
        window.clearInterval(analyserIntervalRef.current);
        analyserIntervalRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setMicAudioLevel(0);
    };

    if (!activeRoomId || !isMicOn) {
      stopMicStream();
      return;
    }

    let cancelled = false;

    const startMicStream = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            analyserIntervalRef.current = window.setInterval(() => {
              analyser.getByteFrequencyData(dataArray);
              const avg =
                dataArray.reduce((acc, v) => acc + v, 0) / Math.max(1, dataArray.length);
              setMicAudioLevel(Math.min(100, Math.max(18, Math.round((avg / 128) * 100))));
            }, 140);
            return;
          }
        }
      } catch {
        // Fallback voice level animation if browser blocks mic permission in iframe
      }

      if (!cancelled) {
        analyserIntervalRef.current = window.setInterval(() => {
          setMicAudioLevel(Math.floor(25 + Math.random() * 60));
        }, 200);
      }
    };

    startMicStream();

    return () => {
      cancelled = true;
      stopMicStream();
    };
  }, [activeRoomId, isMicOn]);

  // Join an existing Live Podcast Room
  const handleJoinPodcast = (room: LivePodcastRoom, joinWithMicOn: boolean = false) => {
    const userId = currentUser.id || 'me';
    const updatedRooms = rooms.map((r) => {
      if (r.id !== room.id) return r;
      const alreadySpeaker = r.speakers.some((s) => s.id === userId);
      const nextSpeakers = alreadySpeaker
        ? r.speakers.map((s) =>
            s.id === userId ? { ...s, isMicOn: joinWithMicOn, isSpeaking: joinWithMicOn } : s
          )
        : [
            ...r.speakers,
            {
              id: userId,
              name: currentUser.name || 'You',
              avatar: currentUser.avatar,
              role: 'speaker' as const,
              isMicOn: joinWithMicOn,
              isSpeaking: joinWithMicOn,
            },
          ];

      return {
        ...r,
        listenersCount: r.listenersCount + 1,
        speakers: nextSpeakers,
      };
    });

    setRooms(updatedRooms);
    saveLivePodcastRooms(updatedRooms);
    setActiveRoomId(room.id);
    setIsMicOn(joinWithMicOn);
    showToast(
      `🎙️ Joined "${room.title}" (${joinWithMicOn ? 'Mic is ON' : 'Mic is OFF — Muted'})`
    );
  };

  // Toggle User's Microphone ON / OFF inside the active Live Podcast
  const handleToggleMic = () => {
    if (!activeRoom) return;
    const nextMic = !isMicOn;
    setIsMicOn(nextMic);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextMic;
      });
    }

    const userId = currentUser.id || 'me';
    const updatedRooms = rooms.map((r) => {
      if (r.id !== activeRoom.id) return r;
      const existsInSpeakers = r.speakers.some((s) => s.id === userId);
      const nextSpeakers = existsInSpeakers
        ? r.speakers.map((s) =>
            s.id === userId ? { ...s, isMicOn: nextMic, isSpeaking: nextMic } : s
          )
        : [
            ...r.speakers,
            {
              id: userId,
              name: currentUser.name || 'You',
              avatar: currentUser.avatar,
              role: 'speaker' as const,
              isMicOn: nextMic,
              isSpeaking: nextMic,
            },
          ];
      return { ...r, speakers: nextSpeakers };
    });

    setRooms(updatedRooms);
    saveLivePodcastRooms(updatedRooms);
    showToast(nextMic ? '🎙️ Microphone turned ON — You are live!' : '🔇 Microphone turned OFF (Muted)');
  };

  // Create and Launch a New Live Podcast
  const handleCreateLivePodcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPodcastTitle.trim()) {
      showToast('Please enter a title for your Live Podcast');
      return;
    }

    const created = createLivePodcastRoom({
      title: newPodcastTitle.trim(),
      description: newPodcastDesc.trim(),
      category: newPodcastCategory,
      hostId: currentUser.id || 'me',
      hostName: currentUser.name || 'You',
      hostAvatar: currentUser.avatar,
      startMicOn: newPodcastStartMicOn,
    });

    setRooms(getLivePodcastRooms());
    setIsCreateModalOpen(false);
    setNewPodcastTitle('');
    setNewPodcastDesc('');
    setActiveRoomId(created.id);
    setIsMicOn(newPodcastStartMicOn);
    showToast(`🎙️ Your Live Podcast "${created.title}" is now LIVE!`);
  };

  // Send a message to the Audience Chat in the active Podcast
  const handleSendAudienceChat = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    if (!activeRoom) return;
    const textToSend = (customText ?? audienceChatInput).trim();
    if (!textToSend) return;

    const userId = currentUser.id || 'me';
    const isHost = activeRoom.hostId === userId;
    const userMsg: PodcastChatMessage = {
      id: `pchat-${Date.now()}`,
      podcastId: activeRoom.id,
      senderId: userId,
      senderName: currentUser.name || 'You',
      senderAvatar: currentUser.avatar,
      senderRole: isHost ? 'host' : isMicOn ? 'speaker' : 'audience',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedRooms = rooms.map((r) =>
      r.id === activeRoom.id ? { ...r, chatMessages: [...r.chatMessages, userMsg] } : r
    );
    setRooms(updatedRooms);
    saveLivePodcastRooms(updatedRooms);
    if (!customText) {
      setAudienceChatInput('');
    }

    // Trigger simulated audience reply so the user experiences real-time audience chat interaction
    setTimeout(() => {
      const latestRooms = getLivePodcastRooms();
      const target = latestRooms.find((r) => r.id === activeRoom.id);
      if (!target) return;
      const sampleAudienceResponders = [
        {
          id: 'aud-reply-1',
          name: 'Kristin Watson',
          avatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
          replies: [
            `Great point ${currentUser.name?.split(' ')[0] || ''}! 100% agree 🔥`,
            'Love this live podcast topic! Keep going 🎙️👏',
            'Loud and clear from the audience! Thanks for sharing 💯',
          ],
        },
        {
          id: 'aud-reply-2',
          name: 'Ralph Edwards',
          avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
          replies: [
            'Awesome insight! The audience chat is super lively today 🙌',
            'Spot on! Can you elaborate a bit more on that?',
            'Listening in live — audio sounds super crisp! 🎧',
          ],
        },
      ];
      const pick =
        sampleAudienceResponders[Math.floor(Math.random() * sampleAudienceResponders.length)];
      const replyText = pick.replies[Math.floor(Math.random() * pick.replies.length)];

      const replyMsg: PodcastChatMessage = {
        id: `pchat-reply-${Date.now()}`,
        podcastId: activeRoom.id,
        senderId: pick.id,
        senderName: pick.name,
        senderAvatar: pick.avatar,
        senderRole: 'audience',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const nextList = latestRooms.map((r) =>
        r.id === activeRoom.id ? { ...r, chatMessages: [...r.chatMessages, replyMsg] } : r
      );
      setRooms(nextList);
      saveLivePodcastRooms(nextList);
    }, 1800);
  };

  const triggerFloatingEmoji = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = 15 + Math.floor(Math.random() * 70);
    setFloatingReactions((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  const filteredRooms = rooms.filter((r) => {
    if (selectedCategory !== 'All Live' && r.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.hostName.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      id="podcast-screen"
      className={`w-full h-full flex flex-col overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-[#0F131A] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[150] px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-bold shadow-xl border border-white/15 flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW A: ACTIVE LIVE PODCAST STUDIO / ROOM (STAGE + MIC ON/OFF + AUDIENCE CHAT)
         ========================================================================= */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#131622] via-[#171B2A] to-[#0F121C] text-white relative">
          {/* Floating Emoji Reactions */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-40">
            {floatingReactions.map((r) => (
              <div
                key={r.id}
                style={{ left: `${r.left}%` }}
                className="absolute bottom-24 text-3xl animate-bounce transition-all duration-1000 opacity-90"
              >
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Room Top Header */}
          <div className="px-4 pt-3 pb-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-black/25 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                id="podcast-room-back-btn"
                type="button"
                onClick={() => {
                  setIsMicOn(false);
                  setActiveRoomId(null);
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
                title="Back to Podcast Lobby"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-rose-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>LIVE PODCAST</span>
                  </span>
                  <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5 text-purple-400" />
                    <span>{activeRoom.listenersCount} listening</span>
                  </span>
                </div>
                <h2 className="text-sm font-extrabold text-white truncate mt-0.5">
                  {activeRoom.title}
                </h2>
              </div>
            </div>

            <button
              id="podcast-leave-room-btn"
              type="button"
              onClick={() => {
                setIsMicOn(false);
                setActiveRoomId(null);
                showToast('Left Live Podcast room');
              }}
              className="px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 text-rose-200 hover:text-white text-xs font-extrabold transition-all cursor-pointer shrink-0"
            >
              Leave Quietly ✌️
            </button>
          </div>

          {/* Scrollable Middle: Stage Speakers + Audience + Live Audience Chat */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Stage Card: Host & Speakers */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Live Podcast Stage ({activeRoom.speakers.length} Speakers)
                  </span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                  {activeRoom.category}
                </span>
              </div>

              {/* Speakers Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                {activeRoom.speakers.map((speaker) => {
                  const isMe =
                    speaker.id === (currentUser.id || 'me') || speaker.name === currentUser.name;
                  const effectiveMicOn = isMe ? isMicOn : speaker.isMicOn;

                  return (
                    <div
                      key={speaker.id}
                      onClick={() => {
                        if (isMe) handleToggleMic();
                      }}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                        isMe ? 'cursor-pointer hover:bg-white/10' : ''
                      } ${
                        effectiveMicOn
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="relative">
                        {/* Speaking Ring Animation */}
                        {effectiveMicOn && (
                          <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-pulse" />
                        )}
                        <img
                          src={speaker.avatar}
                          alt={speaker.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-slate-800"
                        />
                        {/* Mic Status Badge on Avatar */}
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center absolute -bottom-1 -right-1 border-2 border-[#151926] shadow ${
                            effectiveMicOn ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          }`}
                          title={effectiveMicOn ? 'Mic is ON' : 'Mic is OFF (Muted)'}
                        >
                          {effectiveMicOn ? (
                            <Mic className="w-3 h-3" />
                          ) : (
                            <MicOff className="w-3 h-3" />
                          )}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-white truncate max-w-full mt-2">
                        {isMe ? `${speaker.name} (You)` : speaker.name}
                      </p>
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${
                          speaker.role === 'host'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {speaker.role}
                      </span>

                      {/* Live Audio Level Bar if Mic is ON */}
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-150 ${
                            effectiveMicOn ? 'bg-emerald-400' : 'bg-transparent'
                          }`}
                          style={{
                            width: effectiveMicOn ? `${isMe ? micAudioLevel : 65}%` : '0%',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Audience Listeners Row */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    Audience ({activeRoom.audience.length + activeRoom.listenersCount}):
                  </span>
                  <div className="flex -space-x-2">
                    {activeRoom.audience.map((aud) => (
                      <img
                        key={aud.id}
                        src={aud.avatar}
                        alt={aud.name}
                        title={aud.name}
                        className="w-7 h-7 rounded-full object-cover border-2 border-[#161A28]"
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Emoji Reactions Bar */}
                <div className="flex items-center gap-1">
                  {['🔥', '❤️', '👏', '🎙️', '💯'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => triggerFloatingEmoji(emoji)}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-transform active:scale-125 cursor-pointer"
                      title={`Send ${emoji} reaction`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Audience Chat Box inside the Podcast */}
            <div className="rounded-2xl bg-black/35 border border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Live Audience Chat ({activeRoom.chatMessages.length})
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  ● Real-Time Podcast Chat
                </span>
              </div>

              {/* Messages List */}
              <div
                id="podcast-audience-chat-messages"
                className="max-h-60 min-h-[180px] overflow-y-auto p-3.5 space-y-2.5"
              >
                {activeRoom.chatMessages.map((msg) => {
                  const isMyMsg = msg.senderId === (currentUser.id || 'me');
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                        isMyMsg
                          ? 'bg-purple-600/20 border-purple-500/30'
                          : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">{msg.senderName}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              msg.senderRole === 'host'
                                ? 'bg-amber-500/25 text-amber-300'
                                : msg.senderRole === 'speaker'
                                ? 'bg-emerald-500/25 text-emerald-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {msg.senderRole}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1 leading-relaxed break-words">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Audience Chat Input Form */}
              <form
                onSubmit={(e) => handleSendAudienceChat(e)}
                className="p-2.5 bg-white/5 border-t border-white/10 flex items-center gap-2"
              >
                <input
                  id="podcast-audience-chat-input"
                  type="text"
                  value={audienceChatInput}
                  onChange={(e) => setAudienceChatInput(e.target.value)}
                  placeholder="Chat with the audience in this live podcast..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
                />
                <button
                  id="podcast-audience-chat-send-btn"
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Podcast Controls Bar: Mic On/Off, Speaker Audio, Raise Hand */}
          <div className="px-4 py-3 bg-[#0B0E17] border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
            {/* Prominent Mic ON / OFF Toggle Button */}
            <button
              id="podcast-toggle-mic-btn"
              type="button"
              onClick={handleToggleMic}
              className={`flex-1 py-3 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                isMicOn
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
              }`}
            >
              {isMicOn ? (
                <>
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Mic is ON (Tap to Mute)</span>
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Mic is OFF (Tap to Speak)</span>
                </>
              )}
            </button>

            {/* Raise Hand Button */}
            <button
              id="podcast-raise-hand-btn"
              type="button"
              onClick={() => {
                const next = !isHandRaised;
                setIsHandRaised(next);
                showToast(
                  next
                    ? '✋ You raised your hand to speak in the podcast!'
                    : 'Lowered your hand'
                );
              }}
              className={`px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isHandRaised
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                  : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
              }`}
              title="Raise Hand"
            >
              <Hand className="w-4 h-4" />
              <span className="hidden sm:inline">{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
            </button>

            {/* Speaker Output Mute / Unmute */}
            <button
              id="podcast-speaker-mute-btn"
              type="button"
              onClick={() => {
                setIsSpeakerMuted(!isSpeakerMuted);
                showToast(!isSpeakerMuted ? 'Podcast audio muted' : 'Podcast audio unmuted');
              }}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all cursor-pointer"
              title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
            >
              {isSpeakerMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW B: LIVE PODCAST DISCOVERY & CREATION HUB
           ========================================================================= */
        <>
          {/* Top Header */}
          <div
            style={{ backgroundColor: primaryColor }}
            className="px-4 pt-3.5 pb-4 text-white rounded-b-[26px] shadow-md shrink-0"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Radio className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-extrabold tracking-tight">Live Podcasts</h1>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                      {rooms.length} LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-white/85">
                    Create or join live podcasts • Chat with audience • Toggle Mic ON/OFF
                  </p>
                </div>
              </div>

              <button
                id="open-create-podcast-modal-btn"
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 text-rose-500 stroke-[2.5]" />
                <span>Create Podcast</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-white/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="podcast-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live podcasts, topics, or hosts..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/20 border border-white/15 text-xs text-white placeholder-white/70 focus:outline-none focus:bg-black/30"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2.5 pb-0.5">
              {PODCAST_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Live Podcast Rooms List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                id={`live-podcast-card-${room.id}`}
                className={`p-4 rounded-2xl border transition-all shadow-xs ${
                  isDark
                    ? 'bg-[#181D26] border-slate-800 hover:border-purple-500/40'
                    : 'bg-white border-slate-200/90 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>LIVE</span>
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">
                      {room.category}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{room.listenersCount} listening</span>
                    </span>
                  </div>

                  <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{room.chatMessages.length} chats</span>
                  </span>
                </div>

                <div className="mt-2.5 flex items-start gap-3">
                  <img
                    src={room.coverUrl}
                    alt={room.title}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold leading-snug">{room.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {room.description}
                    </p>
                  </div>
                </div>

                {/* Speakers Preview & Join Buttons */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {room.speakers.map((sp) => (
                        <img
                          key={sp.id}
                          src={sp.avatar}
                          alt={sp.name}
                          className="w-7 h-7 rounded-full object-cover border-2 border-white dark:border-[#181D26]"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Hosted by <strong className="text-slate-700 dark:text-slate-200">{room.hostName}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`join-podcast-mic-on-btn-${room.id}`}
                      type="button"
                      onClick={() => handleJoinPodcast(room, true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                      title="Join with Microphone ON"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Join (Mic ON)</span>
                    </button>

                    <button
                      id={`join-podcast-btn-${room.id}`}
                      type="button"
                      onClick={() => handleJoinPodcast(room, false)}
                      style={{ backgroundColor: primaryColor }}
                      className="px-3.5 py-1.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:brightness-110 transition-all cursor-pointer active:scale-95"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Join Live</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* =========================================================================
          MODAL: CREATE LIVE PODCAST
         ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border space-y-4 ${
              isDark
                ? 'bg-[#181D26] border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Create Live Podcast</h3>
                  <p className="text-[11px] text-slate-400">
                    Host a live audio room & chat with your audience
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLivePodcast} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold block mb-1">Podcast Title *</label>
                <input
                  id="create-podcast-title-input"
                  type="text"
                  value={newPodcastTitle}
                  onChange={(e) => setNewPodcastTitle(e.target.value)}
                  placeholder="e.g., Creator Talk & Live Q&A Session"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${
                    isDark
                      ? 'bg-[#12161F] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Topic / Description</label>
                <textarea
                  id="create-podcast-desc-input"
                  rows={2}
                  value={newPodcastDesc}
                  onChange={(e) => setNewPodcastDesc(e.target.value)}
                  placeholder="What are you talking about with your audience today?"
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#12161F] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {PODCAST_CATEGORIES.filter((c) => c !== 'All Live').map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewPodcastCategory(cat)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        newPodcastCategory === cat
                          ? 'bg-rose-500 text-white'
                          : isDark
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start with Mic ON / OFF Toggle */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {newPodcastStartMicOn ? (
                    <Mic className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <MicOff className="w-4 h-4 text-rose-500" />
                  )}
                  <div>
                    <p className="text-xs font-bold">
                      Start with Microphone {newPodcastStartMicOn ? 'ON' : 'OFF'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      You can toggle your mic on/off anytime during the podcast
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPodcastStartMicOn(!newPodcastStartMicOn)}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold cursor-pointer ${
                    newPodcastStartMicOn
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {newPodcastStartMicOn ? 'Mic ON' : 'Mic OFF'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-start-live-podcast-btn"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-lg shadow-rose-500/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>Go Live Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav
        currentScreen="podcast"
        onNavigate={onNavigate}
        theme={theme}
        unreadCount={3}
        isAdminVerified={isAdminVerified}
        primaryColor={primaryColor}
        userAvatar={currentUser.avatar}
      />
    </div>
  );
};
