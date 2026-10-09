import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Video,
  MessageSquare,
  Globe,
  Sparkles,
  Flame,
  Award,
  Send,
  Lock,
  Unlock,
  Check,
  Edit3,
  Users,
  Handshake,
  Calendar,
  Zap,
  UserPlus,
  UserCheck,
  Clock,
  Bell,
  Megaphone,
} from 'lucide-react';
import { UserContact, ThemeMode, ChatMessage } from '../types';
import { saveContactOrChannelToDb } from '../lib/firebase';
import {
  FriendInvitationRecord,
  canUserSeeAndAcceptInvitation,
  getInvitationForContact,
  getLoggedInViewerIdentity,
  saveFriendInvitation,
} from '../lib/friendInvitationAccess';

interface FriendshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: UserContact;
  currentUserAvatar?: string;
  currentUserName?: string;
  userMotherLanguage?: string;
  messages?: ChatMessage[];
  onStartCall?: (type: 'voice' | 'video') => void;
  onSendMessage?: (text: string) => void;
  onOpenChat?: (contact: UserContact) => void;
  onToggleLockUserContribution?: (contactId: string, locked: boolean) => void;
  onUpdateFriendship?: (
    contactId: string,
    updates: {
      relationshipTier?: string;
      nickname?: string;
      friendshipNotes?: string;
      friendshipStreak?: number;
    }
  ) => void;
  theme?: ThemeMode;
  primaryColor?: string;
}

const RELATIONSHIP_TIERS = [
  { id: 'Best Friend', label: 'Best Friend', badge: '🌟', desc: 'Top priority connection' },
  { id: 'Close Friend', label: 'Close Friend', badge: '💜', desc: 'Trusted daily contact' },
  { id: 'Language Partner', label: 'Language Partner', badge: '🌍', desc: 'Multilingual exchange' },
  { id: 'Teammate', label: 'Teammate', badge: '💼', desc: 'Project & group collaborator' },
  { id: 'Connected', label: 'Connected', badge: '🤝', desc: 'Verified Freedom contact' },
];

export const FriendshipModal: React.FC<FriendshipModalProps> = ({
  isOpen,
  onClose,
  contact,
  currentUserAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  currentUserName = 'You',
  userMotherLanguage = 'English',
  messages = [],
  onStartCall,
  onSendMessage,
  onOpenChat,
  onToggleLockUserContribution,
  onUpdateFriendship,
  theme = 'dark',
  primaryColor = '#7C3AED',
}) => {
  const isDark = theme === 'dark';
  const isChannel = Boolean(contact.isChannel || contact.entityType === 'channel');
  const channelSubKey = `freedom_channel_subscribed_${contact.id}`;
  const [isSubscribedChannel, setIsSubscribedChannel] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(channelSubKey);
      if (saved === 'true') return true;
      if (saved === 'false') return false;
    } catch {}
    return Boolean(contact.isSubscribedChannel);
  });
  const [channelSubCount, setChannelSubCount] = useState<number>(() =>
    Math.max(1, contact.subscribersCount || 1)
  );
  const storageKey = `freedom_friendship_${contact.id}`;

  const [relationshipTier, setRelationshipTier] = useState<string>(
    contact.relationshipTier || 'Close Friend'
  );
  const [nickname, setNickname] = useState<string>(contact.nickname || '');
  const [friendshipNotes, setFriendshipNotes] = useState<string>(
    contact.friendshipNotes ||
      `Connected in Freedom • Translating ${userMotherLanguage} ↔ ${
        contact.nativeLanguage || 'Spanish'
      }`
  );
  const [streakDays, setStreakDays] = useState<number>(contact.friendshipStreak || 14);
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [customGreetText, setCustomGreetText] = useState<string>('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isContributionLocked, setIsContributionLocked] = useState<boolean>(
    Boolean(contact.isContributionLocked)
  );
  const inviteStorageKey = `freedom_friend_invite_${contact.id}`;
  const [friendInviteStatus, setFriendInviteStatus] = useState<'none' | 'pending' | 'accepted'>(
    contact.friendInviteStatus || 'none'
  );
  const [invitationRecord, setInvitationRecord] = useState<FriendInvitationRecord | null>(() =>
    getInvitationForContact(contact.id)
  );
  const [viewerRole, setViewerRole] = useState<
    'sender' | 'invited_user' | 'admin' | 'other_user'
  >('sender');

  useEffect(() => {
    const existing = getInvitationForContact(contact.id);
    if (existing) {
      setInvitationRecord(existing);
      setFriendInviteStatus(existing.status === 'declined' ? 'none' : existing.status);
      return;
    }
    try {
      const savedInvite = localStorage.getItem(inviteStorageKey) as
        | 'none'
        | 'pending'
        | 'accepted'
        | null;
      if (savedInvite === 'none' || savedInvite === 'pending' || savedInvite === 'accepted') {
        setFriendInviteStatus(savedInvite);
        if (savedInvite !== 'none') {
          setInvitationRecord({
            id: `inv_me_${contact.id}`,
            senderId: 'me',
            senderName: currentUserName,
            senderAvatar: currentUserAvatar,
            invitedUserId: contact.id,
            invitedUserName: contact.name,
            invitedUserAvatar: contact.avatar,
            status: savedInvite,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setFriendInviteStatus(contact.friendInviteStatus || 'none');
      }
    } catch {}
  }, [contact.id, contact.name, contact.avatar, contact.friendInviteStatus, currentUserName, currentUserAvatar, inviteStorageKey]);

  const loggedInViewer = getLoggedInViewerIdentity();
  const isAllowedToSeeAndAcceptInvite = canUserSeeAndAcceptInvitation(
    invitationRecord,
    loggedInViewer.id,
    false,
    loggedInViewer.name
  );

  const handleUpdateInviteStatus = (nextStatus: 'none' | 'pending' | 'accepted', msg?: string) => {
    if (nextStatus === 'accepted' && !isAllowedToSeeAndAcceptInvite) {
      setFeedbackToast(
        `Only the invited person (${invitationRecord?.invitedUserName || contact.name}) can accept this friend invite.`
      );
      setTimeout(() => setFeedbackToast(null), 2800);
      return;
    }
    setFriendInviteStatus(nextStatus);
    const updatedRec: FriendInvitationRecord = {
      id: invitationRecord?.id || `inv_${loggedInViewer.id || 'me'}_${contact.id}`,
      senderId:
        nextStatus === 'pending'
          ? loggedInViewer.id || 'me'
          : invitationRecord?.senderId || loggedInViewer.id || 'me',
      senderName:
        nextStatus === 'pending'
          ? loggedInViewer.name || currentUserName
          : invitationRecord?.senderName || loggedInViewer.name || currentUserName,
      senderAvatar: currentUserAvatar,
      invitedUserId:
        nextStatus === 'pending'
          ? contact.id
          : invitationRecord?.invitedUserId || contact.id,
      invitedUserName:
        nextStatus === 'pending'
          ? contact.name
          : invitationRecord?.invitedUserName || contact.name,
      invitedUserAvatar:
        nextStatus === 'pending'
          ? contact.avatar
          : invitationRecord?.invitedUserAvatar || contact.avatar,
      nativeLanguage: contact.nativeLanguage || 'Spanish',
      status: nextStatus === 'none' ? 'declined' : nextStatus,
      createdAt: invitationRecord?.createdAt || new Date().toISOString(),
      respondedAt: nextStatus !== 'pending' ? new Date().toISOString() : undefined,
      acceptedAt: nextStatus === 'accepted' ? new Date().toISOString() : undefined,
    };
    setInvitationRecord(updatedRec);
    saveFriendInvitation(updatedRec);

    if (msg) {
      setFeedbackToast(msg);
      setTimeout(() => setFeedbackToast(null), 2800);
    }
    if (nextStatus === 'accepted' && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('freedom-friend-request-accepted', {
          detail: {
            contactId: contact.id,
            contactName: contact.name,
            contactAvatar: contact.avatar,
            nativeLanguage: contact.nativeLanguage || 'Spanish',
          },
        })
      );
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.relationshipTier) setRelationshipTier(parsed.relationshipTier);
        if (parsed.nickname !== undefined) setNickname(parsed.nickname);
        if (parsed.friendshipNotes !== undefined) setFriendshipNotes(parsed.friendshipNotes);
        if (parsed.streakDays) setStreakDays(parsed.streakDays);
        if (parsed.hasCheckedInToday) setHasCheckedInToday(parsed.hasCheckedInToday);
      } else {
        setRelationshipTier(contact.relationshipTier || 'Close Friend');
        setNickname(contact.nickname || '');
        setFriendshipNotes(
          contact.friendshipNotes ||
            `Connected in Freedom • Translating ${userMotherLanguage} ↔ ${
              contact.nativeLanguage || 'Spanish'
            }`
        );
        setStreakDays(contact.friendshipStreak || 14);
        setHasCheckedInToday(false);
      }
    } catch {}
    setIsContributionLocked(Boolean(contact.isContributionLocked));
  }, [contact.id, contact.isContributionLocked, storageKey, userMotherLanguage, contact.nativeLanguage]);

  if (!isOpen) return null;

  const persistFriendshipState = (overrides?: Partial<{
    relationshipTier: string;
    nickname: string;
    friendshipNotes: string;
    streakDays: number;
    hasCheckedInToday: boolean;
  }>) => {
    const nextState = {
      relationshipTier: overrides?.relationshipTier ?? relationshipTier,
      nickname: overrides?.nickname ?? nickname,
      friendshipNotes: overrides?.friendshipNotes ?? friendshipNotes,
      streakDays: overrides?.streakDays ?? streakDays,
      hasCheckedInToday: overrides?.hasCheckedInToday ?? hasCheckedInToday,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextState));
    } catch {}
    if (onUpdateFriendship) {
      onUpdateFriendship(contact.id, {
        relationshipTier: nextState.relationshipTier,
        nickname: nextState.nickname,
        friendshipNotes: nextState.friendshipNotes,
        friendshipStreak: nextState.streakDays,
      });
    }
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 2800);
  };

  const handleSelectTier = (tierId: string) => {
    setRelationshipTier(tierId);
    persistFriendshipState({ relationshipTier: tierId });
    showToast(`Relationship tier updated to ${tierId}`);
  };

  const handleSaveDetails = () => {
    setIsEditingProfile(false);
    persistFriendshipState({ nickname, friendshipNotes });
    showToast('Saved contact nickname & friendship notes');
  };

  const handleDailyCheckIn = () => {
    if (hasCheckedInToday) {
      showToast('Already checked in today! Keep the streak going tomorrow 🔥');
      return;
    }
    const nextStreak = streakDays + 1;
    setStreakDays(nextStreak);
    setHasCheckedInToday(true);
    persistFriendshipState({ streakDays: nextStreak, hasCheckedInToday: true });
    if (onSendMessage) {
      onSendMessage(
        `🔥 ${nextStreak}-Day Friendship Streak Check-In with ${contact.name}! Let's keep communicating in our mother languages.`
      );
    }
    showToast(`🔥 ${nextStreak}-Day Streak unlocked and shared!`);
  };

  const handleQuickEngage = (promptText: string, label: string) => {
    if (onSendMessage) {
      onSendMessage(promptText);
    }
    showToast(`${label} sent to ${contact.name}!`);
  };

  const handleSendCustomEngagement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGreetText.trim()) return;
    if (onSendMessage) {
      onSendMessage(customGreetText.trim());
    }
    showToast(`Engagement note sent to ${contact.name}!`);
    setCustomGreetText('');
  };

  const handleToggleLock = () => {
    const nextLocked = !isContributionLocked;
    setIsContributionLocked(nextLocked);
    if (onToggleLockUserContribution) {
      onToggleLockUserContribution(contact.id, nextLocked);
    }
    showToast(
      nextLocked
        ? `🔒 Locked ${contact.name}'s message contributions`
        : `🔓 Unlocked ${contact.name}'s message contributions`
    );
  };

  const totalMessagesCount = Math.max(messages.length, 18);
  const voiceNotesCount = Math.max(messages.filter((m) => m.type === 'audio').length, 4);
  const sharedMediaCount = Math.max(
    messages.filter((m) => m.type === 'image' || m.type === 'video').length,
    6
  );

  const quickPrompts = [
    {
      id: 'wave',
      emoji: '👋',
      label: 'Friendly Wave',
      sub: 'Say hello quickly',
      text: `👋 Hey ${contact.name.split(' ')[0]}! Sending a friendly wave to check in today!`,
    },
    {
      id: 'appreciate',
      emoji: '🌟',
      label: 'Send Appreciation',
      sub: 'Celebrate friendship',
      text: `🌟 Really appreciate our friendship and seamless conversations on Freedom!`,
    },
    {
      id: 'language',
      emoji: '🌍',
      label: 'Language Exchange',
      sub: `${userMotherLanguage} ↔ ${contact.nativeLanguage || 'Spanish'}`,
      text: `🌍 Let's practice ${contact.nativeLanguage || 'Spanish'} & ${userMotherLanguage} together today! How is your day going?`,
    },
    {
      id: 'catchup',
      emoji: '☕',
      label: 'Catch-up Invite',
      sub: 'Plan a quick call',
      text: `☕ Hey ${contact.name.split(' ')[0]}, let's catch up on a quick voice or video call when you're free!`,
    },
  ];

  return (
    <div
      id="friendship-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        id="friendship-modal-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${
          isDark
            ? 'bg-[#161B24] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Hero Banner with Dual Avatars & Friendship Bridge */}
        <div
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, #4F46E5)`,
          }}
          className="relative pt-4 pb-5 px-5 text-white shrink-0"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold">
              <Handshake className="w-3.5 h-3.5" />
              <span>Friendship & Engagement Hub</span>
            </div>
            <button
              id="close-friendship-modal-btn"
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connected Avatars Bridge */}
          <div className="flex items-center justify-center gap-3 my-2">
            {/* Current User Avatar */}
            <div className="flex flex-col items-center">
              <img
                src={currentUserAvatar}
                alt={currentUserName}
                className="w-13 h-13 rounded-full object-cover border-2 border-white/90 shadow-md"
              />
              <span className="text-[10px] font-bold mt-1 text-white/90">You</span>
              <span className="text-[9px] bg-black/25 px-1.5 py-0.2 rounded-full">
                {userMotherLanguage}
              </span>
            </div>

            {/* Bridge Connector */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="w-5 h-0.5 bg-white/40 rounded-full" />
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <span className="w-5 h-0.5 bg-white/40 rounded-full" />
              </div>
              <span className="text-[10px] font-extrabold text-amber-300 mt-1">
                98% Affinity
              </span>
            </div>

            {/* Target Contact Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-13 h-13 rounded-full object-cover border-2 border-amber-300 shadow-md"
                />
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                )}
              </div>
              <span className="text-[10px] font-bold mt-1 text-white truncate max-w-[85px]">
                {nickname || contact.name.split(' ')[0]}
              </span>
              <span className="text-[9px] bg-black/25 px-1.5 py-0.2 rounded-full">
                {contact.nativeLanguage || 'Spanish'}
              </span>
            </div>
          </div>

          {/* Contact Name & Current Relationship Tier */}
          <div className="text-center mt-2">
            <h3 className="font-extrabold text-base leading-tight">
              {contact.name}
              {nickname ? ` (${nickname})` : ''}
            </h3>
            <p className="text-[11px] text-white/85 mt-0.5">{friendshipNotes}</p>
          </div>

          {/* Toast Feedback inside Modal */}
          {feedbackToast && (
            <div className="mt-2.5 py-1.5 px-3 rounded-xl bg-black/45 backdrop-blur-xs text-white text-[11px] font-bold text-center border border-white/20 animate-in fade-in duration-150">
              {feedbackToast}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Friend Invite & Invited User Accept Card (or Channel Subscription if Channel) */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isDark ? 'bg-[#1D2430] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            {isChannel ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold flex items-center gap-1.5">
                    <Megaphone style={{ color: primaryColor }} className="w-3.5 h-3.5 shrink-0" />
                    <span>Channel Subscription</span>
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {isSubscribedChannel
                      ? `Subscribed to ${contact.name} (${channelSubCount} subscribers)`
                      : `Subscribe to receive broadcasts from ${contact.name}`}
                  </p>
                </div>
                <button
                  id="friendship-modal-subscribe-channel-btn"
                  type="button"
                  onClick={() => {
                    const nextSub = !isSubscribedChannel;
                    const nextCount = nextSub ? channelSubCount + 1 : Math.max(0, channelSubCount - 1);
                    setIsSubscribedChannel(nextSub);
                    setChannelSubCount(nextCount);
                    try {
                      localStorage.setItem(channelSubKey, String(nextSub));
                    } catch {}
                    saveContactOrChannelToDb({
                      ...contact,
                      isSubscribedChannel: nextSub,
                      subscribersCount: nextCount,
                    }).catch(() => {});
                    showToast(
                      nextSub
                        ? `🔔 Subscribed to ${contact.name}!`
                        : `Unsubscribed from ${contact.name}`
                    );
                  }}
                  style={isSubscribedChannel ? undefined : { backgroundColor: primaryColor }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0 ${
                    isSubscribedChannel
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'text-white hover:brightness-110 active:scale-95'
                  }`}
                >
                  {isSubscribedChannel ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Subscribed ({channelSubCount})</span>
                    </>
                  ) : (
                    <>
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Subscribe to channel</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-extrabold flex items-center gap-1.5">
                  <UserPlus style={{ color: primaryColor }} className="w-3.5 h-3.5 shrink-0" />
                  <span>Friend Invite Status</span>
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {friendInviteStatus === 'accepted'
                    ? `Friends connected with ${contact.name}`
                    : friendInviteStatus === 'pending'
                    ? `Waiting for ${contact.name} to accept`
                    : `Send a Friend Invite to ${contact.name}`}
                </p>
              </div>

              {friendInviteStatus === 'none' && (
                <button
                  id="friendship-modal-send-invite-btn"
                  type="button"
                  onClick={() =>
                    handleUpdateInviteStatus(
                      'pending',
                      `Sent "Friend Invite" to ${contact.name}!`
                    )
                  }
                  style={{ backgroundColor: primaryColor }}
                  className="px-3 py-1.5 rounded-xl text-white text-[11px] font-bold flex items-center gap-1 shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Send Friend Invite</span>
                </button>
              )}

              {friendInviteStatus === 'pending' && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>Pending</span>
                </span>
              )}

              {friendInviteStatus === 'accepted' && (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <UserCheck className="w-3 h-3" />
                  <span>Accepted</span>
                </span>
              )}
            </div>
            )}

            {friendInviteStatus === 'pending' && isAllowedToSeeAndAcceptInvite && (
              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 animate-in fade-in duration-150">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Friend Invitation for {invitationRecord?.invitedUserName || loggedInViewer.name || 'You'}
                  </span>
                </div>
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    isDark
                      ? 'bg-slate-900/80 border-emerald-500/30'
                      : 'bg-white border-emerald-500/30'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-300 dark:text-slate-200">
                    Accept or decline this friend invitation
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id="friendship-modal-accept-invite-btn"
                      type="button"
                      onClick={() =>
                        handleUpdateInviteStatus(
                          'accepted',
                          `Friend Invite accepted! 🎉`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Accept Friend Invite</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateInviteStatus('none', 'Friend invite declined.')}
                      className="px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:bg-slate-800 cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 1. Quick Contact & Streak Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              id="friendship-open-chat-btn"
              type="button"
              onClick={() => {
                if (onOpenChat) {
                  onOpenChat(contact);
                }
                onClose();
              }}
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              className="p-2.5 rounded-2xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              id="friendship-call-voice-btn"
              type="button"
              onClick={() => {
                if (onStartCall) {
                  onClose();
                  onStartCall('voice');
                }
              }}
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              className="p-2.5 rounded-2xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
            </button>

            <button
              id="friendship-lock-contrib-btn"
              type="button"
              onClick={handleToggleLock}
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-[10px] active:scale-95 transition-all cursor-pointer ${
                isContributionLocked
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Lock or unlock this user's messages with a Pin"
            >
              {isContributionLocked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span className="truncate">{isContributionLocked ? 'Pin Locked' : 'Lock with a Pin'}</span>
            </button>
          </div>

          {/* 2. Friendship Streak & Engagement Metrics */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
              isDark
                ? 'bg-[#1D2432] border-slate-800'
                : 'bg-amber-50/70 border-amber-200/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs sm:text-sm">
                    {streakDays} Day Friendship Streak
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {totalMessagesCount} messages • {voiceNotesCount} voice • {sharedMediaCount} media
                </p>
              </div>
            </div>

            <button
              id="friendship-daily-checkin-btn"
              type="button"
              onClick={handleDailyCheckIn}
              style={
                hasCheckedInToday
                  ? undefined
                  : { backgroundColor: primaryColor }
              }
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 cursor-pointer transition-all flex items-center gap-1 ${
                hasCheckedInToday
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  : 'text-white shadow-sm hover:brightness-110 active:scale-95'
              }`}
            >
              {hasCheckedInToday ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Checked In</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  <span>Check-In</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Relationship Tier Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>Friendship & Contact Tier</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                style={{ color: primaryColor }}
                className="text-[10px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingProfile ? 'Done' : 'Edit Nickname'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {RELATIONSHIP_TIERS.map((tier) => {
                const active = relationshipTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => handleSelectTier(tier.id)}
                    style={
                      active
                        ? { backgroundColor: primaryColor, borderColor: primaryColor }
                        : undefined
                    }
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border flex items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? 'text-white shadow-xs'
                        : isDark
                        ? 'bg-[#1D2432] border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tier.badge}</span>
                    <span>{tier.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Editable Nickname & Relationship Note Drawer */}
            {isEditingProfile && (
              <div
                className={`mt-2 p-3 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Custom Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={`Nickname for ${contact.name}`}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none ${
                      isDark
                        ? 'bg-[#161B24] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Friendship & Contact Note
                  </label>
                  <input
                    type="text"
                    value={friendshipNotes}
                    onChange={(e) => setFriendshipNotes(e.target.value)}
                    placeholder="Add a shared note or reminder..."
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none ${
                      isDark
                        ? 'bg-[#161B24] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-1.5 rounded-xl text-white text-xs font-bold cursor-pointer hover:brightness-110"
                >
                  Save Friendship Details
                </button>
              </div>
            )}
          </div>

          {/* 4. Interactive User Engagement Actions */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5 px-0.5">
              One-Tap User Engagement
            </span>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((item) => (
                <button
                  key={item.id}
                  id={`friendship-engage-${item.id}-btn`}
                  type="button"
                  onClick={() => handleQuickEngage(item.text, item.label)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.01] active:scale-95 flex items-start gap-2 ${
                    isDark
                      ? 'bg-[#1D2432] border-slate-800 hover:border-purple-500/40'
                      : 'bg-slate-50 border-slate-200/80 hover:border-purple-500/40'
                  }`}
                >
                  <span className="text-base leading-none mt-0.5">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Send Custom Friendship / Icebreaker Note */}
          <form onSubmit={handleSendCustomEngagement} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customGreetText}
              onChange={(e) => setCustomGreetText(e.target.value)}
              placeholder={`Send an engagement note to ${contact.name.split(' ')[0]}...`}
              className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none ${
                isDark
                  ? 'bg-[#1D2432] border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:brightness-110 active:scale-95 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
