import React, { useState, useRef, useEffect } from 'react';
import { StatusBar } from './StatusBar';
import { BottomNav } from './BottomNav';
import { Search, MessageSquare, Phone, Video, UserPlus, Globe, Smartphone, CheckCircle2, QrCode, User, Handshake, Users, Check, Mic, MicOff, X, Megaphone, Clock } from 'lucide-react';
import { UserContact, ScreenView, ThemeMode } from '../types';
import { FriendshipModal } from './FriendshipModal';
import { saveFriendInvitation, getInvitationForContact, getLoggedInViewerIdentity } from '../lib/friendInvitationAccess';
import { saveContactOrChannelToDb } from '../lib/firebase';

interface PeopleScreenProps {
  contacts: UserContact[];
  onSelectChat: (contact: UserContact) => void;
  onNavigate: (screen: ScreenView) => void;
  onStartCall: (contact: UserContact, type: 'voice' | 'video') => void;
  onViewProfile?: (contact: UserContact) => void;
  theme?: ThemeMode;
  onOpenNewChatModal?: () => void;
  onOpenCreateChannelModal?: () => void;
  onOpenImportContacts?: () => void;
  onOpenQrScanner?: () => void;
  primaryColor?: string;
  isAdminVerified?: boolean;
  userAvatar?: string;
}

export const PeopleScreen: React.FC<PeopleScreenProps> = ({
  contacts,
  onSelectChat,
  onNavigate,
  onStartCall,
  onViewProfile,
  theme = 'light',
  onOpenNewChatModal,
  onOpenCreateChannelModal,
  onOpenImportContacts,
  onOpenQrScanner,
  primaryColor = '#7C3AED',
  isAdminVerified = false,
  userAvatar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningVoiceSearch, setIsListeningVoiceSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const [friendshipTarget, setFriendshipTarget] = useState<UserContact | null>(null);
  const [channelSubscribedMap, setChannelSubscribedMap] = useState<Record<string, boolean>>({});
  const [channelSubscribersCountMap, setChannelSubscribersCountMap] = useState<Record<string, number>>({});

  useEffect(() => {
    return () => {
      try {
        speechRecognitionRef.current?.abort?.();
      } catch {}
    };
  }, []);

  const handleToggleVoiceSearch = () => {
    if (isListeningVoiceSearch) {
      try {
        speechRecognitionRef.current?.stop?.();
      } catch {}
      setIsListeningVoiceSearch(false);
      return;
    }

    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) {
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListeningVoiceSearch(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0]?.transcript || '';
        }
        setSearchQuery(transcript.trim());
      };

      recognition.onerror = () => {
        setIsListeningVoiceSearch(false);
      };

      recognition.onend = () => {
        setIsListeningVoiceSearch(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
      searchInputRef.current?.focus();
    } catch {
      setIsListeningVoiceSearch(false);
    }
  };
  const [joinedGroupIds, setJoinedGroupIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    contacts
      .filter((c) => c.isGroup || c.entityType === 'group')
      .forEach((g) => {
        try {
          map[g.id] = localStorage.getItem(`freedom_group_joined_state_${g.id}`) === 'joined';
        } catch {
          map[g.id] = false;
        }
      });
    return map;
  });
  const isDark = theme === 'dark';

  const groupContacts = contacts.filter(
    (c) =>
      (c.isGroup || c.entityType === 'group') &&
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.groupTopic && c.groupTopic.toLowerCase().includes(searchQuery.toLowerCase())))
  );
  const onlineContacts = contacts.filter(
    (c) => c.online && !c.isGroup && c.entityType !== 'group'
  );
  const filtered = contacts.filter(
    (c) =>
      !c.isGroup &&
      c.entityType !== 'group' &&
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nativeLanguage && c.nativeLanguage.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phoneNumber && c.phoneNumber.includes(searchQuery)))
  );

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-[#12161F] text-white' : 'bg-white text-slate-900'
      }`}
    >
      {/* Top Header */}
      <div
        className="text-white pt-1 pb-4 px-5 rounded-b-[28px] shadow-sm z-10 transition-colors"
        style={{ backgroundColor: primaryColor }}
      >
        <StatusBar time="9:41" theme="green" className="px-1 -mx-3" />

        <div className="flex items-center justify-between mt-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">People</h1>
              <span className="text-[10px] bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full font-bold">
                {contacts.length} Total
              </span>
            </div>
            <p className="text-xs text-white/85 font-medium">
              WeedChat connects across languages
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenCreateChannelModal && (
              <button
                id="people-create-channel-btn"
                onClick={onOpenCreateChannelModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-xs font-bold transition-all cursor-pointer text-white shadow-xs"
                title="Create new broadcast channel"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span className="text-[11px]">Create Channel</span>
              </button>
            )}

            {onOpenQrScanner && (
              <button
                id="people-scan-qr-btn"
                onClick={onOpenQrScanner}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-xs font-bold transition-all cursor-pointer text-white shadow-xs"
                title="Scan contact QR code with camera"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="text-[11px]">Scan QR</span>
              </button>
            )}

            {onOpenImportContacts && (
              <button
                id="people-import-contacts-btn"
                onClick={onOpenImportContacts}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-xs font-bold transition-all cursor-pointer text-white"
                title="Import mobile phone contacts"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[11px]">Import</span>
              </button>
            )}

            {onOpenNewChatModal && (
              <button
                onClick={onOpenNewChatModal}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-white"
                title="Add user to database"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search bar matching screenshot design with Voice (Web Speech API) */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative"
        >
          <input
            ref={searchInputRef}
            id="people-search-input"
            type="text"
            placeholder={
              isListeningVoiceSearch
                ? 'Listening... speak now'
                : 'Search people by name, phone or language...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2.5 pl-9 pr-16 rounded-2xl text-xs font-medium focus:outline-none bg-white text-slate-900 placeholder-slate-400 shadow-inner transition-all ${
              isListeningVoiceSearch ? 'ring-2 ring-rose-500' : ''
            }`}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                id="people-search-clear-btn"
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id="people-search-voice-mic-btn"
              type="button"
              onClick={handleToggleVoiceSearch}
              aria-label={isListeningVoiceSearch ? 'Stop voice search' : 'Search people by voice'}
              title={
                isListeningVoiceSearch
                  ? 'Listening... click to stop voice search'
                  : 'Voice search (Web Speech API)'
              }
              className={`p-1 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                isListeningVoiceSearch
                  ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                  : 'text-slate-500 hover:text-purple-600 hover:bg-slate-100'
              }`}
            >
              {isListeningVoiceSearch ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Active Now Section */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
            Active Now ({onlineContacts.length})
          </h3>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {onlineContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => (onViewProfile ? onViewProfile(contact) : onSelectChat(contact))}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
                title={`Visit ${contact.name}'s profile & description`}
              >
                <div className="relative">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 group-hover:scale-105 transition-transform shadow-sm"
                  />
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#12161F] rounded-full" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 max-w-16 truncate">
                  {contact.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Group List Section */}
        {groupContacts.length > 0 && (
          <div id="people-screen-group-list">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <Users style={{ color: primaryColor }} className="w-3.5 h-3.5" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Group List ({groupContacts.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-500">
                Join Group • Group Gallery
              </span>
            </div>

            <div className="space-y-2">
              {groupContacts.map((group) => {
                const isJoined = Boolean(joinedGroupIds[group.id] || group.isJoinedGroup);
                return (
                  <div
                    key={group.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                      isDark
                        ? 'bg-[#181D27] border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div
                      onClick={() => (onViewProfile ? onViewProfile(group) : onSelectChat(group))}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={group.avatar}
                          alt={group.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 shadow-sm"
                        />
                        <span
                          style={{ backgroundColor: primaryColor }}
                          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center border-2 border-slate-900"
                        >
                          <Users className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm truncate">{group.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-400 font-bold">
                            {group.participants?.length || 4} Members
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {group.groupTopic || group.lastMessage}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onViewProfile && (
                        <button
                          type="button"
                          onClick={() => onViewProfile(group)}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Open Group Page & Group Gallery"
                        >
                          Group Page
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isJoined;
                          setJoinedGroupIds((prev) => ({ ...prev, [group.id]: next }));
                          try {
                            localStorage.setItem(
                              `freedom_group_joined_state_${group.id}`,
                              next ? 'joined' : 'not_joined'
                            );
                          } catch {}
                        }}
                        style={{ backgroundColor: isJoined ? '#10B981' : primaryColor }}
                        className="px-3 py-1.5 rounded-xl text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-xs"
                      >
                        {isJoined ? (
                          <>
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Joined Group</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3" />
                            <span>Join Group</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Contacts Directory */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              All Contacts ({filtered.length})
            </h3>
            {onOpenImportContacts && (
              <button
                onClick={onOpenImportContacts}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Smartphone className="w-3 h-3" />
                <span>Import Phonebook</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filtered.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-center justify-between py-3 px-1.5 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                }`}
              >
                <div
                  onClick={() => onSelectChat(contact)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div
                    onClick={(e) => {
                      if (onViewProfile) {
                        e.stopPropagation();
                        onViewProfile(contact);
                      }
                    }}
                    className="relative shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    title={`View ${contact.name}'s Profile & Description`}
                  >
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-15 h-15 rounded-full object-cover border-2 border-slate-700 hover:border-emerald-400 shadow-xs"
                    />
                    {contact.online && (
                      <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#12161F] rounded-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs sm:text-sm truncate">{contact.name}</h4>
                      {(contact.isBlocked || contact.status === 'blocked') && (
                        <span className="text-[9px] bg-rose-500/15 text-rose-500 dark:text-rose-400 px-1.5 py-0.2 rounded-full font-bold border border-rose-500/20">
                          Blocked
                        </span>
                      )}
                      {contact.isImported && (
                        <span className="text-[9px] bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded-full font-bold">
                          Phone Synced
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <Globe className="w-3 h-3 shrink-0" />
                      <span>{contact.nativeLanguage || 'English'}</span>
                      {contact.phoneNumber && !contact.hidePhoneNumberPublic && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400 truncate">{contact.phoneNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {contact.isGroup || contact.entityType === 'group' ? (
                    <>
                      <button
                        id={`people-join-group-btn-${contact.id}`}
                        type="button"
                        onClick={() => {
                          try {
                            localStorage.setItem(`freedom_group_joined_state_${contact.id}`, 'true');
                          } catch {}
                          if (onViewProfile) {
                            onViewProfile({ ...contact, isJoinedGroup: true });
                          } else {
                            onSelectChat(contact);
                          }
                        }}
                        style={{ backgroundColor: primaryColor }}
                        className="px-2.5 py-1.5 rounded-full text-white text-[11px] font-bold flex items-center gap-1 shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        title="Join Group & open Group Page"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Join Group</span>
                      </button>
                      {onViewProfile && (
                        <button
                          id={`people-view-group-page-btn-${contact.id}`}
                          onClick={() => onViewProfile(contact)}
                          className="p-2 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                          title="Open Group Page & Group Gallery"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : contact.isChannel || contact.entityType === 'channel' ? (
                    <>
                      {(() => {
                        const subKey = `freedom_channel_subscribed_${contact.id}`;
                        let isSubbed =
                          channelSubscribedMap[contact.id] !== undefined
                            ? channelSubscribedMap[contact.id]
                            : Boolean(contact.isSubscribedChannel);
                        try {
                          const savedSub = localStorage.getItem(subKey);
                          if (savedSub === 'true') isSubbed = true;
                          if (savedSub === 'false') isSubbed = false;
                        } catch {}
                        const baseCount = contact.subscribersCount || 1;
                        const countDisplay =
                          channelSubscribersCountMap[contact.id] !== undefined
                            ? channelSubscribersCountMap[contact.id]
                            : baseCount;

                        return (
                          <button
                            id={`people-subscribe-channel-btn-${contact.id}`}
                            type="button"
                            onClick={() => {
                              const nextSub = !isSubbed;
                              const nextCount = nextSub
                                ? countDisplay + 1
                                : Math.max(0, countDisplay - 1);
                              setChannelSubscribedMap((prev) => ({
                                ...prev,
                                [contact.id]: nextSub,
                              }));
                              setChannelSubscribersCountMap((prev) => ({
                                ...prev,
                                [contact.id]: nextCount,
                              }));
                              try {
                                localStorage.setItem(subKey, String(nextSub));
                              } catch {}
                              saveContactOrChannelToDb({
                                ...contact,
                                isSubscribedChannel: nextSub,
                                subscribersCount: nextCount,
                              }).catch(() => {});
                            }}
                            style={isSubbed ? undefined : { backgroundColor: primaryColor }}
                            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer ${
                              isSubbed
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'text-white hover:brightness-110 active:scale-95'
                            }`}
                            title={isSubbed ? 'Subscribed — click to unsubscribe' : 'Subscribe to channel'}
                          >
                            {isSubbed ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Subscribed ({countDisplay})</span>
                              </>
                            ) : (
                              <>
                                <Megaphone className="w-3.5 h-3.5" />
                                <span>Subscribe to channel</span>
                              </>
                            )}
                          </button>
                        );
                      })()}
                      {onViewProfile && (
                        <button
                          id={`people-view-channel-page-btn-${contact.id}`}
                          onClick={() => onViewProfile(contact)}
                          className="p-2 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                          title="Open Channel Page"
                        >
                          <Megaphone className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelectChat(contact)}
                        className="p-2 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                        title="Open Channel"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        id={`people-friend-request-btn-${contact.id}`}
                        type="button"
                        onClick={() => {
                          const existing = getInvitationForContact(contact.id);
                          const currentStatus =
                            existing?.status || contact.friendInviteStatus || 'none';
                          if (currentStatus === 'none' || currentStatus === 'declined') {
                            const viewer = getLoggedInViewerIdentity();
                            saveFriendInvitation({
                              id: `inv_${viewer.id || 'me'}_${contact.id}`,
                              senderId: viewer.id || 'me',
                              senderName: viewer.name || 'WeedChat User',
                              senderAvatar: userAvatar || contact.avatar,
                              invitedUserId: contact.id,
                              invitedUserName: contact.name,
                              invitedUserAvatar: contact.avatar,
                              nativeLanguage: contact.nativeLanguage || 'English',
                              status: 'pending',
                              createdAt: new Date().toISOString(),
                            });
                          } else {
                            setFriendshipTarget(contact);
                          }
                        }}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          contact.friendInviteStatus === 'accepted'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : contact.friendInviteStatus === 'pending'
                            ? 'bg-amber-500/15 text-amber-500'
                            : 'hover:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        }`}
                        title={
                          contact.friendInviteStatus === 'accepted'
                            ? 'Friends Connected'
                            : contact.friendInviteStatus === 'pending'
                            ? 'Invite Sent (Waiting for invited user to accept)'
                            : `Send Friend Request to ${contact.name}`
                        }
                      >
                        {contact.friendInviteStatus === 'accepted' ? (
                          <Check className="w-4 h-4" />
                        ) : contact.friendInviteStatus === 'pending' ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </button>
                      {onViewProfile && (
                        <button
                          id={`people-view-profile-btn-${contact.id}`}
                          onClick={() => onViewProfile(contact)}
                          className="p-2 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                          title="View user profile description & media gallery"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelectChat(contact)}
                        className="p-2 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                        title="Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onStartCall(contact, 'voice')}
                        className="p-2 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                        title="Voice call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onStartCall(contact, 'video')}
                        className="p-2 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                        title="Video call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav
        currentScreen="people"
        onNavigate={onNavigate}
        theme={theme}
        unreadCount={3}
        primaryColor={primaryColor}
        isAdminVerified={isAdminVerified}
        userAvatar={userAvatar}
      />

      {/* Device Bottom Home Indicator Bar (iOS style) */}
      <div className="w-full flex justify-center pb-2 pt-0.5 bg-white dark:bg-[#181A20] shrink-0 z-30">
        <div className="w-32 h-1 bg-slate-900/25 dark:bg-white/25 rounded-full pointer-events-none" />
      </div>

      {/* Friendship & User Engagement Modal */}
      {friendshipTarget && (
        <FriendshipModal
          isOpen={Boolean(friendshipTarget)}
          onClose={() => setFriendshipTarget(null)}
          contact={friendshipTarget}
          theme={theme}
          primaryColor={primaryColor}
          onSendMessage={() => {
            onSelectChat(friendshipTarget);
          }}
          onOpenChat={(contact) => {
            onSelectChat(contact);
          }}
          onStartCall={(type) => {
            onStartCall(friendshipTarget, type);
          }}
        />
      )}
    </div>
  );
};
