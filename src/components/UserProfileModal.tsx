import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  Video,
  MessageSquare,
  Globe,
  Mail,
  Shield,
  Image as ImageIcon,
  User,
  UserPlus,
  UserCheck,
  Handshake,
  Check,
  Sparkles,
  Clock,
  Bell,
  Lock,
  Users,
  Camera,
  Upload,
  Ban,
  Trash2,
  Crown,
  RotateCcw,
  Search,
  LogOut,
  MapPin,
  Edit2,
  Plus,
  Save,
  Eye,
  EyeOff,
  Megaphone,
} from 'lucide-react';
import { UserContact, UserProfile, ThemeMode, ChatMessage, ActiveMediaItem, GroupParticipant, SocialLinkItem, SocialPlatform } from '../types';
import { INITIAL_GROUP_MESSAGES, INITIAL_CONTACTS } from '../data/mockData';
import { saveUserProfileToDb, deleteMyUserAccountFromDb, saveContactOrChannelToDb } from '../lib/firebase';
import { MediaPictureGalleryView } from './MediaPictureGalleryView';
import { SocialLinksDisplay, getSocialPlatformInfo } from './SocialLinksDisplay';
import { FriendshipModal } from './FriendshipModal';
import {
  FriendInvitationRecord,
  canUserSeeAndAcceptInvitation,
  getInvitationForContact,
  saveFriendInvitation,
} from '../lib/friendInvitationAccess';
import { getCleanAvatar } from '../lib/avatarHelper';
import { optimizeUploadedImageFile } from '../lib/videoPlatformHelper';
import {
  AdvancedAiSearchPanel,
  AdvancedSearchScope,
  filterAndSortEntitiesAdvanced,
  getUserUsername,
  getUserEmail,
  getUserAlphabetLetter,
} from './AdvancedAiSearchPanel';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: UserContact | UserProfile;
  messages?: ChatMessage[];
  onStartCall?: (type: 'voice' | 'video') => void;
  onSendMessage?: (customText?: string) => void;
  onOpenFriendshipModal?: () => void;
  onFriendInviteChange?: (contactId: string, status: 'none' | 'pending' | 'accepted') => void;
  theme?: ThemeMode;
  primaryColor?: string;
  onSelectMedia?: (media: ActiveMediaItem) => void;
  onToggleBlockUser?: (contactId: string, shouldBlock: boolean) => void;
  onJoinGroup?: (groupId: string) => void;
  onShareGroupMedia?: (media: ActiveMediaItem, memberIds: string[], note?: string) => void;
  onUpdateGroupParticipants?: (groupId: string, participants: GroupParticipant[]) => void;
  onUpdateGroupCover?: (groupId: string, coverUrl: string) => void;
  allGroups?: UserContact[];
  onSelectGroup?: (group: UserContact) => void;
  isCurrentUserProfile?: boolean;
  onDeleteMyAccount?: (deletedUserId: string) => void;
}

const DEFAULT_GROUP_COVER_URL =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80';

const PRESET_GROUP_COVERS = [
  {
    id: 'team_collab',
    label: 'Global Team',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'neon_studio',
    label: 'Creative Hub',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'mountain_aurora',
    label: 'Aurora Borealis',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
  },
];

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
];

const DEFAULT_GROUP_PARTICIPANTS: GroupParticipant[] = [
  {
    id: 'admin_mobilephonesky',
    name: 'WeedChat Support & Admin',
    avatar: getCleanAvatar('WeedChat Support & Admin', undefined, '#7C3AED', 'admin_mobilephonesky'),
    nativeLanguage: 'English',
    online: true,
    role: 'admin',
    moderationStatus: 'active',
  },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  contact,
  messages = [],
  onStartCall,
  onSendMessage,
  onOpenFriendshipModal,
  onFriendInviteChange,
  theme = 'dark',
  primaryColor = '#7C3AED',
  onSelectMedia,
  onJoinGroup,
  onShareGroupMedia,
  onUpdateGroupParticipants,
  onUpdateGroupCover,
  allGroups,
  onSelectGroup,
  isCurrentUserProfile = false,
  onDeleteMyAccount,
}) => {
  const isDark = theme === 'dark';
  const isGroup = Boolean(
    (contact as UserContact).isGroup || (contact as UserContact).entityType === 'group'
  );
  const isChannel = Boolean(
    (contact as UserContact).isChannel || (contact as UserContact).entityType === 'channel'
  );
  const channelSubStorageKey = `freedom_channel_subscribed_${contact.id}`;
  const [isSubscribedToChannel, setIsSubscribedToChannel] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(channelSubStorageKey);
      if (saved === 'true') return true;
      if (saved === 'false') return false;
    } catch {}
    return Boolean((contact as UserContact).isSubscribedChannel);
  });
  const [channelSubscribersCount, setChannelSubscribersCount] = useState<number>(() =>
    Math.max(1, (contact as UserContact).subscribersCount || 1)
  );
  const handleToggleChannelSubscribe = () => {
    const nextSub = !isSubscribedToChannel;
    const nextCount = nextSub ? channelSubscribersCount + 1 : Math.max(0, channelSubscribersCount - 1);
    setIsSubscribedToChannel(nextSub);
    setChannelSubscribersCount(nextCount);
    try {
      localStorage.setItem(channelSubStorageKey, String(nextSub));
    } catch {}
    saveContactOrChannelToDb({
      ...(contact as UserContact),
      isSubscribedChannel: nextSub,
      subscribersCount: nextCount,
    }).catch(() => {});
    setInviteToast(
      nextSub ? `🔔 Subscribed to ${contact.name}!` : `Unsubscribed from ${contact.name}.`
    );
    setTimeout(() => setInviteToast(null), 2800);
  };
  const directoryGroups = React.useMemo(() => {
    const source = allGroups && allGroups.length > 0 ? allGroups : INITIAL_CONTACTS;
    return source.filter((c) => Boolean(c.isGroup || c.entityType === 'group'));
  }, [allGroups]);

  const [joinedGroupsMap, setJoinedGroupsMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    INITIAL_CONTACTS.filter((c) => c.isGroup || c.entityType === 'group').forEach((g) => {
      try {
        const val = localStorage.getItem(`freedom_group_joined_state_${g.id}`);
        map[g.id] = val === 'joined' || val === 'true' || Boolean(g.isJoinedGroup);
      } catch {
        map[g.id] = Boolean(g.isJoinedGroup);
      }
    });
    return map;
  });
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isInternalFriendshipOpen, setIsInternalFriendshipOpen] = useState(false);

  // Group Page Advanced Search & AI Search state (Alphabet A-Z, Texted, Username, Email)
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>('');
  const [groupAlphabetFilter, setGroupAlphabetFilter] = useState<string>('ALL');
  const [groupSearchScope, setGroupSearchScope] = useState<AdvancedSearchScope>('all');
  const [groupSortOrder, setGroupSortOrder] = useState<'asc' | 'desc'>('asc');
  const [groupAiMatchedIds, setGroupAiMatchedIds] = useState<string[]>([]);
  const [groupAiMatchReasons, setGroupAiMatchReasons] = useState<Record<string, string>>({});

  // Group Join & Cover storage keys
  const groupJoinStorageKey = `freedom_group_joined_state_${contact.id}`;
  const groupCoverStorageKey = `freedom_group_cover_${contact.id}`;
  const groupMembersStorageKey = `freedom_group_members_${contact.id}`;
  const userCoverStorageKey = `freedom_user_cover_${contact.id}`;
  const userWallpaperStorageKey = `freedom_user_wallpaper_${contact.id}`;
  const userAvatarStorageKey = `freedom_user_avatar_${contact.id}`;

  const groupCoverInputRef = useRef<HTMLInputElement | null>(null);
  const userCoverInputRef = useRef<HTMLInputElement | null>(null);
  const userWallpaperInputRef = useRef<HTMLInputElement | null>(null);
  const userAvatarInputRef = useRef<HTMLInputElement | null>(null);

  const [customContactAvatar, setCustomContactAvatar] = useState<string>(() => {
    try {
      const savedForId = localStorage.getItem(userAvatarStorageKey);
      if (savedForId && savedForId.startsWith('data:image/')) return savedForId;
    } catch {}
    return getCleanAvatar(contact.avatar, contact.name, contact.id);
  });

  // Group Admin & Moderator permission role state
  const [groupPermissionRole, setGroupPermissionRole] = useState<'admin' | 'moderator' | 'member'>('admin');
  const canModerateGroup = groupPermissionRole === 'admin' || groupPermissionRole === 'moderator';
  const isGroupAdmin = groupPermissionRole === 'admin';
  const isGroupAdminViewer = canModerateGroup;
  const setIsGroupAdminViewer = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(canModerateGroup) : val;
    setGroupPermissionRole(next ? 'admin' : 'member');
  };

  const [groupCoverUrl, setGroupCoverUrl] = useState<string>(() => {
    try {
      const savedCover = localStorage.getItem(groupCoverStorageKey);
      if (savedCover) return savedCover;
    } catch {}
    return (
      (contact as UserContact).groupCoverUrl ||
      (contact as UserContact).profileCoverUrl ||
      DEFAULT_GROUP_COVER_URL
    );
  });

  // User Profile Cover & Profile Page Wallpaper State
  const [userProfileCoverUrl, setUserProfileCoverUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(userCoverStorageKey) ||
        (contact as UserContact).profileCoverUrl ||
        ''
      );
    } catch {
      return (contact as UserContact).profileCoverUrl || '';
    }
  });

  const [userProfileWallpaperUrl, setUserProfileWallpaperUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(userWallpaperStorageKey) ||
        (contact as UserContact).profileWallpaperUrl ||
        ''
      );
    } catch {
      return (contact as UserContact).profileWallpaperUrl || '';
    }
  });
  const [showCustomizeDrawer, setShowCustomizeDrawer] = useState(false);

  useEffect(() => {
    try {
      const savedCover = localStorage.getItem(groupCoverStorageKey);
      if (savedCover) {
        setGroupCoverUrl(savedCover);
      } else {
        setGroupCoverUrl(
          (contact as UserContact).groupCoverUrl ||
            (contact as UserContact).profileCoverUrl ||
            DEFAULT_GROUP_COVER_URL
        );
      }
      const savedUserCover = localStorage.getItem(userCoverStorageKey);
      setUserProfileCoverUrl(savedUserCover || (contact as UserContact).profileCoverUrl || '');
      const savedWallpaper = localStorage.getItem(userWallpaperStorageKey);
      setUserProfileWallpaperUrl(savedWallpaper || (contact as UserContact).profileWallpaperUrl || '');
      const savedAvatarForId = localStorage.getItem(userAvatarStorageKey);
      if (savedAvatarForId && savedAvatarForId.startsWith('data:image/')) {
        setCustomContactAvatar(savedAvatarForId);
      } else {
        setCustomContactAvatar(getCleanAvatar(contact.avatar, contact.name, contact.id));
      }
    } catch {}
  }, [
    contact.id,
    contact.avatar,
    contact.name,
    groupCoverStorageKey,
    userCoverStorageKey,
    userWallpaperStorageKey,
    userAvatarStorageKey,
    (contact as UserContact).groupCoverUrl,
    (contact as UserContact).profileCoverUrl,
    (contact as UserContact).profileWallpaperUrl,
  ]);

  const handleModalAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await optimizeUploadedImageFile(file, 320, 0.85);
      if (dataUrl) {
        setCustomContactAvatar(dataUrl);
        try {
          localStorage.setItem(userAvatarStorageKey, dataUrl);
          if (contact.id === 'me') {
            localStorage.setItem('freedom_uploaded_profile_avatar_v1', dataUrl);
          }
          window.dispatchEvent(
            new CustomEvent('freedom-avatar-updated', {
              detail: {
                userId: contact.id,
                avatar: dataUrl,
                fileName: file.name,
              },
            })
          );
        } catch {}
        setInviteToast(`✅ Avatar "${file.name}" uploaded and automatically saved!`);
        setTimeout(() => setInviteToast(null), 3200);
      }
    } catch {}
    e.target.value = '';
  };

  const handleGroupCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canModerateGroup) {
      setInviteToast('Only Group Admin or Moderator can upload a Group Cover.');
      setTimeout(() => setInviteToast(null), 3000);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const resultUrl = typeof reader.result === 'string' ? reader.result : '';
      if (resultUrl) {
        setGroupCoverUrl(resultUrl);
        try {
          localStorage.setItem(groupCoverStorageKey, resultUrl);
        } catch {}
        if (onUpdateGroupCover) {
          onUpdateGroupCover(contact.id, resultUrl);
        }
        setInviteToast(`🖼️ Group Cover uploaded and updated by Group Admin!`);
        setTimeout(() => setInviteToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectPresetGroupCover = (url: string, label: string) => {
    if (!canModerateGroup) return;
    setGroupCoverUrl(url);
    try {
      localStorage.setItem(groupCoverStorageKey, url);
    } catch {}
    if (onUpdateGroupCover) {
      onUpdateGroupCover(contact.id, url);
    }
    setInviteToast(`🖼️ Group Cover updated to "${label}" by Group Admin!`);
    setTimeout(() => setInviteToast(null), 3000);
  };

  const handleUserCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUserProfileCoverUrl(dataUrl);
      try {
        localStorage.setItem(userCoverStorageKey, dataUrl);
      } catch {}
      setInviteToast(`🖼️ User Profile Cover uploaded for ${contact.name}!`);
      setTimeout(() => setInviteToast(null), 3200);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUserWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUserProfileWallpaperUrl(dataUrl);
      try {
        localStorage.setItem(userWallpaperStorageKey, dataUrl);
      } catch {}
      setInviteToast(`✨ Custom Profile Wallpaper uploaded for ${contact.name}'s profile page!`);
      setTimeout(() => setInviteToast(null), 3200);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [hasJoinedGroup, setHasJoinedGroup] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(groupJoinStorageKey);
      if (saved === 'true' || saved === 'joined') return true;
      if (saved === 'false' || saved === 'not_joined') return false;
      return Boolean((contact as UserContact).isJoinedGroup);
    } catch {
      return Boolean((contact as UserContact).isJoinedGroup);
    }
  });

  useEffect(() => {
    try {
      const savedJoin = localStorage.getItem(groupJoinStorageKey);
      if (savedJoin === 'true' || savedJoin === 'joined') {
        setHasJoinedGroup(true);
      } else if (savedJoin === 'false' || savedJoin === 'not_joined') {
        setHasJoinedGroup(false);
      } else {
        setHasJoinedGroup(Boolean((contact as UserContact).isJoinedGroup));
      }
    } catch {
      setHasJoinedGroup(Boolean((contact as UserContact).isJoinedGroup));
    }
  }, [contact.id, groupJoinStorageKey, (contact as UserContact).isJoinedGroup]);

  const [groupParticipants, setGroupParticipants] = useState<GroupParticipant[]>(() => {
    try {
      const saved = localStorage.getItem(groupMembersStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (contact as UserContact).participants && (contact as UserContact).participants!.length > 0
      ? (contact as UserContact).participants!
      : DEFAULT_GROUP_PARTICIPANTS;
  });

  const persistGroupParticipants = (updated: GroupParticipant[], feedbackMessage?: string) => {
    setGroupParticipants(updated);
    try {
      localStorage.setItem(groupMembersStorageKey, JSON.stringify(updated));
    } catch {}
    if (onUpdateGroupParticipants) {
      onUpdateGroupParticipants(contact.id, updated);
    }
    if (feedbackMessage) {
      setInviteToast(feedbackMessage);
      setTimeout(() => setInviteToast(null), 3400);
    }
  };

  // Group Admin Moderation Handlers: Ban User, Temporary Suspend, Delete Group Member, Role Change
  const handleToggleBanGroupMember = (member: GroupParticipant) => {
    if (!canModerateGroup) {
      setInviteToast('Permission Denied: Only Group Admin or Moderator can ban group members.');
      setTimeout(() => setInviteToast(null), 3000);
      return;
    }
    const isCurrentlyBanned = member.moderationStatus === 'banned';
    const nextStatus = isCurrentlyBanned ? 'active' : 'banned';
    const updated = groupParticipants.map((p) =>
      p.id === member.id
        ? {
            ...p,
            moderationStatus: nextStatus as 'active' | 'banned',
            banReason: isCurrentlyBanned ? undefined : 'Banned by Group Admin',
          }
        : p
    );
    persistGroupParticipants(
      updated,
      isCurrentlyBanned
        ? `✅ Unbanned ${member.name} in ${contact.name}.`
        : `🚫 Banned ${member.name} from ${contact.name} (Group Admin Moderation).`
    );
  };

  const handleToggleSuspendGroupMember = (member: GroupParticipant) => {
    if (!canModerateGroup) {
      setInviteToast('Permission Denied: Only Group Admin or Moderator can suspend group members.');
      setTimeout(() => setInviteToast(null), 3000);
      return;
    }
    const isCurrentlySuspended = member.moderationStatus === 'suspended';
    const nextStatus = isCurrentlySuspended ? 'active' : 'suspended';
    const untilDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const updated = groupParticipants.map((p) =>
      p.id === member.id
        ? {
            ...p,
            moderationStatus: nextStatus as 'active' | 'suspended',
            suspendedUntil: isCurrentlySuspended ? undefined : `24h (until tomorrow ${untilDate})`,
          }
        : p
    );
    persistGroupParticipants(
      updated,
      isCurrentlySuspended
        ? `✅ Lifted temporary suspension for ${member.name}.`
        : `⏳ Temporarily suspended ${member.name} for 24 hours.`
    );
  };

  const handleDeleteGroupMember = (member: GroupParticipant) => {
    if (!canModerateGroup) {
      setInviteToast('Permission Denied: Only Group Admin or Moderator can delete group members.');
      setTimeout(() => setInviteToast(null), 3000);
      return;
    }
    const updated = groupParticipants.filter((p) => p.id !== member.id);
    persistGroupParticipants(
      updated,
      `🗑️ Deleted ${member.name} from group "${contact.name}".`
    );
  };

  const handleCycleMemberRole = (member: GroupParticipant) => {
    if (!isGroupAdmin) {
      setInviteToast('Permission Denied: Only Group Admin can change moderator/admin roles.');
      setTimeout(() => setInviteToast(null), 3000);
      return;
    }
    const nextRole: 'admin' | 'moderator' | 'member' =
      member.role === 'member' ? 'moderator' : member.role === 'moderator' ? 'admin' : 'member';
    const updated = groupParticipants.map((p) =>
      p.id === member.id ? { ...p, role: nextRole } : p
    );
    persistGroupParticipants(
      updated,
      `👑 Updated ${member.name}'s role to ${nextRole.toUpperCase()}.`
    );
  };

  const resolvedGroupMessages =
    isGroup && (!messages || messages.length === 0 || !messages.some((m) => m.id.startsWith('grp-')))
      ? [...INITIAL_GROUP_MESSAGES, ...messages]
      : messages;

  const handleJoinGroupClick = () => {
    setHasJoinedGroup(true);
    setJoinedGroupsMap((prev) => ({ ...prev, [contact.id]: true }));
    try {
      localStorage.setItem(groupJoinStorageKey, 'joined');
    } catch {}
    if (onJoinGroup) {
      onJoinGroup(contact.id);
    }
    setInviteToast(
      `🎉 You joined "${contact.name}"! You can now view & share media in the Group Gallery, or click "Leave the group" anytime.`
    );
    setTimeout(() => setInviteToast(null), 3500);
  };

  const handleLeaveGroupClick = () => {
    setHasJoinedGroup(false);
    setJoinedGroupsMap((prev) => ({ ...prev, [contact.id]: false }));
    try {
      localStorage.setItem(groupJoinStorageKey, 'not_joined');
    } catch {}
    setInviteToast(
      `👋 You have left "${contact.name}". Click "Join Group" anytime to rejoin.`
    );
    setTimeout(() => setInviteToast(null), 3500);
  };

  // Filtered Group Members & Directory Groups via Group Page Advanced AI Search (A-Z, Texted, Username, Email)
  const filteredGroupParticipants = React.useMemo(() => {
    const mapped = groupParticipants.map((m) => ({
      ...m,
      lastMessage: `${m.nativeLanguage || 'English'} speaker • ${m.role || 'member'} in ${contact.name}`,
    }));
    return filterAndSortEntitiesAdvanced(mapped, {
      searchQuery: groupSearchQuery,
      alphabetFilter: groupAlphabetFilter,
      scope: groupSearchScope,
      sortOrder: groupSortOrder,
      aiMatchedIds: groupAiMatchedIds,
      aiMatchReasons: groupAiMatchReasons,
    }).map((r) => r.item);
  }, [
    groupParticipants,
    contact.name,
    groupSearchQuery,
    groupAlphabetFilter,
    groupSearchScope,
    groupSortOrder,
    groupAiMatchedIds,
    groupAiMatchReasons,
  ]);

  const filteredDirectoryGroups = React.useMemo(() => {
    return filterAndSortEntitiesAdvanced(directoryGroups, {
      searchQuery: groupSearchQuery,
      alphabetFilter: groupAlphabetFilter,
      scope: groupSearchScope,
      sortOrder: groupSortOrder,
      aiMatchedIds: groupAiMatchedIds,
      aiMatchReasons: groupAiMatchReasons,
    }).map((r) => r.item);
  }, [
    directoryGroups,
    groupSearchQuery,
    groupAlphabetFilter,
    groupSearchScope,
    groupSortOrder,
    groupAiMatchedIds,
    groupAiMatchReasons,
  ]);

  const inviteStorageKey = `freedom_friend_invite_${contact.id}`;
  const [friendInviteStatus, setFriendInviteStatus] = useState<'none' | 'pending' | 'accepted'>(
    (contact as UserContact).friendInviteStatus || 'none'
  );
  const [invitationRecord, setInvitationRecord] = useState<FriendInvitationRecord | null>(() =>
    getInvitationForContact(contact.id)
  );
  // Active viewer identity to enforce that ONLY the invited user can see the invitation, notification, and accept button
  const [viewerRole, setViewerRole] = useState<
    'sender' | 'invited_user' | 'admin' | 'other_user'
  >('sender');
  const [inviteToast, setInviteToast] = useState<string | null>(null);

  useEffect(() => {
    const existingRecord = getInvitationForContact(contact.id);
    if (existingRecord) {
      setInvitationRecord(existingRecord);
      setFriendInviteStatus(
        existingRecord.status === 'declined' ? 'none' : existingRecord.status
      );
      return;
    }
    try {
      const saved = localStorage.getItem(inviteStorageKey) as
        | 'none'
        | 'pending'
        | 'accepted'
        | null;
      if (saved === 'none' || saved === 'pending' || saved === 'accepted') {
        setFriendInviteStatus(saved);
        if (saved !== 'none') {
          const rec: FriendInvitationRecord = {
            id: `inv_me_${contact.id}`,
            senderId: 'me',
            senderName: 'Sajol (You)',
            senderAvatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            invitedUserId: contact.id,
            invitedUserName: contact.name,
            invitedUserAvatar: contact.avatar,
            status: saved,
            createdAt: new Date().toISOString(),
          };
          setInvitationRecord(rec);
        }
      } else if ((contact as UserContact).friendInviteStatus) {
        setFriendInviteStatus((contact as UserContact).friendInviteStatus!);
      } else {
        setFriendInviteStatus('none');
      }
    } catch {
      setFriendInviteStatus('none');
    }
  }, [contact.id, contact.name, contact.avatar, inviteStorageKey, (contact as UserContact).friendInviteStatus]);

  if (!isOpen) return null;

  const activeViewerUserId =
    viewerRole === 'invited_user'
      ? contact.id
      : viewerRole === 'sender'
      ? 'me'
      : viewerRole === 'admin'
      ? 'admin_user'
      : 'other_uninvited_user';
  const isViewerAdmin = viewerRole === 'admin';

  // Strict Access Check: ONLY the invited user (and NOT admin or other uninvited users) can see the invitation, notification, and accept it
  const isAllowedToSeeAndAcceptInvite = canUserSeeAndAcceptInvitation(
    invitationRecord,
    activeViewerUserId,
    isViewerAdmin
  );

  const updateInviteStatus = (nextStatus: 'none' | 'pending' | 'accepted', toastMsg?: string) => {
    setFriendInviteStatus(nextStatus);
    const updatedRec: FriendInvitationRecord = {
      id: `inv_me_${contact.id}`,
      senderId: 'me',
      senderName: 'Sajol (You)',
      senderAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      invitedUserId: contact.id,
      invitedUserName: contact.name,
      invitedUserAvatar: contact.avatar,
      nativeLanguage:
        (contact as UserProfile).motherLanguage ||
        (contact as UserContact).nativeLanguage ||
        'Spanish',
      status: nextStatus === 'none' ? 'declined' : nextStatus,
      createdAt: invitationRecord?.createdAt || new Date().toISOString(),
      respondedAt: nextStatus !== 'pending' ? new Date().toISOString() : undefined,
    };
    setInvitationRecord(updatedRec);
    saveFriendInvitation(updatedRec);

    if (onFriendInviteChange) {
      onFriendInviteChange(contact.id, nextStatus);
    }
    if (toastMsg) {
      setInviteToast(toastMsg);
      setTimeout(() => setInviteToast(null), 3200);
    }
  };

  const handleSendFriendInvite = () => {
    updateInviteStatus(
      'pending',
      `Friend invite sent to ${contact.name}! Only ${contact.name} (the invited user) can see the invitation notification and accept it.`
    );
  };

  const handleAcceptFriendInviteAsInvitedUser = () => {
    // Enforce that ONLY the invited user can accept (never Admin or other uninvited users)
    if (!isAllowedToSeeAndAcceptInvite) {
      setInviteToast(
        `Access Denied: Only the invited user (${contact.name}) can see and accept this invitation.`
      );
      setTimeout(() => setInviteToast(null), 3200);
      return;
    }
    updateInviteStatus(
      'accepted',
      `🎉 Friend Request Accepted! ${contact.name} has accepted your friend invite.`
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('freedom-friend-request-accepted', {
          detail: {
            contactId: contact.id,
            contactName: contact.name,
            contactAvatar: contact.avatar,
            nativeLanguage:
              (contact as UserProfile).motherLanguage ||
              (contact as UserContact).nativeLanguage ||
              'Spanish',
          },
        })
      );
    }
  };

  // Extract properties
  const isBlocked = (contact as UserContact).isBlocked || false;
  const defaultUsername = (
    (contact as UserProfile).username ||
    (contact as UserContact).username ||
    contact.name.toLowerCase().replace(/\s+/g, '_')
  ).replace(/^@+/, '');
  const defaultBio =
    (contact as UserProfile).bio ||
    (contact as UserContact).bio ||
    'Mother language conversationalist • Connecting across cultures and native tongues with WeedChat 🌿';
  const motherLanguage =
    (contact as UserProfile).motherLanguage ||
    (contact as UserContact).nativeLanguage ||
    'Spanish';
  const defaultPhoneNumber = contact.phoneNumber || '+1 (555) 234-8901';
  const defaultEmail = (contact as any).email || `${defaultUsername}@weedchat.io`;
  const defaultAge = String((contact as UserProfile).age || (contact as UserContact).age || '25');
  const defaultGender = ((contact as UserProfile).gender || (contact as UserContact).gender || 'Male') as
    | 'Female'
    | 'Male'
    | string;
  const statusText =
    (contact as UserContact).statusText ||
    ((contact as any).online ? 'Online' : 'Active 3m ago');

  const userUsernameStorageKey = `freedom_user_username_${contact.id}`;
  const userLocationStorageKey = `freedom_user_location_${contact.id}`;
  const userPhoneStorageKey = `freedom_user_phone_${contact.id}`;
  const userHidePhonePublicStorageKey = `freedom_user_hide_phone_public_${contact.id}`;
  const userEmailStorageKey = `freedom_user_email_${contact.id}`;
  const userBioStorageKey = `freedom_user_bio_${contact.id}`;
  const userAgeStorageKey = `freedom_user_age_${contact.id}`;
  const userGenderStorageKey = `freedom_user_gender_${contact.id}`;
  const userLinksStorageKey = `freedom_user_links_${contact.id}`;

  const [username, setUsername] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem(userUsernameStorageKey);
      if (savedUser !== null && savedUser.trim()) return savedUser.replace(/^@+/, '');
    } catch {}
    return defaultUsername;
  });
  const [isEditingModalUsername, setIsEditingModalUsername] = useState(false);
  const [modalUsernameDraft, setModalUsernameDraft] = useState(`@${username}`);

  const [userAge, setUserAge] = useState<string>(() => {
    try {
      const savedAge = localStorage.getItem(userAgeStorageKey);
      if (savedAge !== null && savedAge.trim()) return savedAge;
    } catch {}
    return defaultAge;
  });
  const [isEditingModalAge, setIsEditingModalAge] = useState(false);
  const [modalAgeDraft, setModalAgeDraft] = useState(userAge);

  const [userGender, setUserGender] = useState<string>(() => {
    try {
      const savedGender = localStorage.getItem(userGenderStorageKey);
      if (savedGender === 'Female' || savedGender === 'Male') return savedGender;
    } catch {}
    return defaultGender === 'Female' ? 'Female' : 'Male';
  });
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);

  const [userLocation, setUserLocation] = useState<string>(() => {
    try {
      const savedLoc = localStorage.getItem(userLocationStorageKey);
      if (savedLoc !== null) return savedLoc;
    } catch {}
    return (
      (contact as UserProfile).location ||
      (contact as UserContact).location ||
      'New York,NY'
    );
  });
  const [isEditingModalLocation, setIsEditingModalLocation] = useState(false);
  const [modalLocationDraft, setModalLocationDraft] = useState(userLocation);

  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    try {
      const savedPhone = localStorage.getItem(userPhoneStorageKey);
      if (savedPhone !== null) return savedPhone;
    } catch {}
    return defaultPhoneNumber;
  });
  const [hidePhoneNumberPublic, setHidePhoneNumberPublic] = useState<boolean>(() => {
    try {
      const savedHide = localStorage.getItem(userHidePhonePublicStorageKey);
      if (savedHide !== null) return savedHide === 'true';
    } catch {}
    return Boolean(
      (contact as UserProfile).hidePhoneNumberPublic ||
        (contact as UserContact).hidePhoneNumberPublic
    );
  });
  const [isEditingModalPhone, setIsEditingModalPhone] = useState(false);
  const [modalPhoneDraft, setModalPhoneDraft] = useState(phoneNumber);

  const [email, setEmail] = useState<string>(() => {
    try {
      const savedEmail = localStorage.getItem(userEmailStorageKey);
      if (savedEmail !== null) return savedEmail;
    } catch {}
    return defaultEmail;
  });
  const [isEditingModalEmail, setIsEditingModalEmail] = useState(false);
  const [modalEmailDraft, setModalEmailDraft] = useState(email);

  const [bio, setBio] = useState<string>(() => {
    try {
      const savedBio = localStorage.getItem(userBioStorageKey);
      if (savedBio !== null) return savedBio;
    } catch {}
    return defaultBio;
  });
  const [isEditingModalBio, setIsEditingModalBio] = useState(false);
  const [modalBioDraft, setModalBioDraft] = useState(bio);

  const defaultSocialLinks: SocialLinkItem[] = [
    { platform: 'twitter', url: `https://x.com/${username}`, handle: `@${username}` },
    { platform: 'instagram', url: `https://instagram.com/${username}`, handle: `@${username}` },
    { platform: 'github', url: `https://github.com/${username}`, handle: username },
  ];

  const [modalSocialLinks, setModalSocialLinks] = useState<SocialLinkItem[]>(() => {
    try {
      const savedLinks = localStorage.getItem(userLinksStorageKey);
      if (savedLinks) {
        const parsed = JSON.parse(savedLinks);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return (contact as any).socialLinks && (contact as any).socialLinks.length > 0
      ? (contact as any).socialLinks
      : defaultSocialLinks;
  });
  const [isEditingModalLink, setIsEditingModalLink] = useState(false);
  const [editingModalLinkIndex, setEditingModalLinkIndex] = useState<number | null>(null);
  const [modalLinkPlatform, setModalLinkPlatform] = useState<SocialPlatform>('website');
  const [modalLinkUrl, setModalLinkUrl] = useState('');
  const [modalLinkHandle, setModalLinkHandle] = useState('');

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(userUsernameStorageKey);
      const resolvedUsername =
        savedUser !== null && savedUser.trim() ? savedUser.replace(/^@+/, '') : defaultUsername;
      setUsername(resolvedUsername);
      setModalUsernameDraft(`@${resolvedUsername}`);

      const savedAge = localStorage.getItem(userAgeStorageKey);
      const resolvedAge = savedAge !== null && savedAge.trim() ? savedAge : defaultAge;
      setUserAge(resolvedAge);
      setModalAgeDraft(resolvedAge);

      const savedGender = localStorage.getItem(userGenderStorageKey);
      const resolvedGender =
        savedGender === 'Female' || savedGender === 'Male'
          ? savedGender
          : defaultGender === 'Female'
          ? 'Female'
          : 'Male';
      setUserGender(resolvedGender);

      const savedLoc = localStorage.getItem(userLocationStorageKey);
      const resolvedLoc =
        savedLoc !== null
          ? savedLoc
          : (contact as UserProfile).location ||
            (contact as UserContact).location ||
            'New York,NY';
      setUserLocation(resolvedLoc);
      setModalLocationDraft(resolvedLoc);

      const savedPhone = localStorage.getItem(userPhoneStorageKey);
      const resolvedPhone = savedPhone !== null ? savedPhone : defaultPhoneNumber;
      setPhoneNumber(resolvedPhone);
      setModalPhoneDraft(resolvedPhone);

      const savedHidePhone = localStorage.getItem(userHidePhonePublicStorageKey);
      const resolvedHidePhone =
        savedHidePhone !== null
          ? savedHidePhone === 'true'
          : Boolean(
              (contact as UserProfile).hidePhoneNumberPublic ||
                (contact as UserContact).hidePhoneNumberPublic
            );
      setHidePhoneNumberPublic(resolvedHidePhone);

      const savedEmail = localStorage.getItem(userEmailStorageKey);
      const resolvedEmail = savedEmail !== null ? savedEmail : defaultEmail;
      setEmail(resolvedEmail);
      setModalEmailDraft(resolvedEmail);

      const savedBio = localStorage.getItem(userBioStorageKey);
      const resolvedBio = savedBio !== null ? savedBio : defaultBio;
      setBio(resolvedBio);
      setModalBioDraft(resolvedBio);

      const savedLinks = localStorage.getItem(userLinksStorageKey);
      if (savedLinks) {
        const parsed = JSON.parse(savedLinks);
        if (Array.isArray(parsed)) setModalSocialLinks(parsed);
      } else {
        setModalSocialLinks(
          (contact as any).socialLinks && (contact as any).socialLinks.length > 0
            ? (contact as any).socialLinks
            : defaultSocialLinks
        );
      }
    } catch {}
  }, [
    contact.id,
    userUsernameStorageKey,
    userAgeStorageKey,
    userGenderStorageKey,
    userLocationStorageKey,
    userPhoneStorageKey,
    userEmailStorageKey,
    userBioStorageKey,
    userLinksStorageKey,
    (contact as UserProfile).location,
    (contact as UserContact).location,
    defaultUsername,
    defaultAge,
    defaultGender,
    defaultPhoneNumber,
    defaultEmail,
    defaultBio,
  ]);

  const broadcastProfileDetailsUpdate = (fields: Partial<UserProfile>) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('freedom-user-profile-details-updated', {
          detail: {
            userId: contact.id,
            ...fields,
          },
        })
      );
    }
  };

  const handleSaveModalUsername = async () => {
    const raw = modalUsernameDraft.trim().replace(/^@+/, '').replace(/\s+/g, '_');
    const cleanUser = raw || defaultUsername;
    setUsername(cleanUser);
    setModalUsernameDraft(`@${cleanUser}`);
    setIsEditingModalUsername(false);
    try {
      localStorage.setItem(userUsernameStorageKey, cleanUser);
    } catch {}
    broadcastProfileDetailsUpdate({ username: cleanUser });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        username: cleanUser,
      });
    } catch {}
    setInviteToast(`✅ Username updated to @${cleanUser}!`);
    setTimeout(() => setInviteToast(null), 2600);
  };

  const handleSaveModalAge = async () => {
    const cleanAge = modalAgeDraft.trim() || defaultAge;
    setUserAge(cleanAge);
    setIsEditingModalAge(false);
    try {
      localStorage.setItem(userAgeStorageKey, cleanAge);
    } catch {}
    broadcastProfileDetailsUpdate({ age: cleanAge });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        age: cleanAge,
      });
    } catch {}
    setInviteToast(`🎂 Age updated to ${cleanAge}!`);
    setTimeout(() => setInviteToast(null), 2600);
  };

  const handleSelectModalGender = async (selectedGender: 'Female' | 'Male') => {
    setUserGender(selectedGender);
    try {
      localStorage.setItem(userGenderStorageKey, selectedGender);
    } catch {}
    broadcastProfileDetailsUpdate({ gender: selectedGender });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        gender: selectedGender,
      });
    } catch {}
    setInviteToast(`👤 Gender updated to ${selectedGender}!`);
    setTimeout(() => setInviteToast(null), 2400);
  };

  const handleConfirmDeleteAccount = async () => {
    await deleteMyUserAccountFromDb(contact.id);
    if (onDeleteMyAccount) {
      onDeleteMyAccount(contact.id);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('freedom-delete-my-account', {
          detail: { userId: contact.id },
        })
      );
    }
    setShowDeleteAccountConfirm(false);
    onClose();
  };

  const handleSaveModalLocation = async () => {
    const cleanLoc = modalLocationDraft.trim() || 'New York,NY';
    setUserLocation(cleanLoc);
    setIsEditingModalLocation(false);
    try {
      localStorage.setItem(userLocationStorageKey, cleanLoc);
    } catch {}
    broadcastProfileDetailsUpdate({ location: cleanLoc });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        location: cleanLoc,
      });
    } catch {}
    setInviteToast(`📍 Location updated to "${cleanLoc}"!`);
    setTimeout(() => setInviteToast(null), 2600);
  };

  const handleSaveModalPhone = async () => {
    const cleanPhone = modalPhoneDraft.trim() || defaultPhoneNumber;
    setPhoneNumber(cleanPhone);
    setIsEditingModalPhone(false);
    try {
      localStorage.setItem(userPhoneStorageKey, cleanPhone);
      localStorage.setItem(userHidePhonePublicStorageKey, String(hidePhoneNumberPublic));
    } catch {}
    broadcastProfileDetailsUpdate({
      phoneNumber: cleanPhone,
      hidePhoneNumberPublic,
    });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        phoneNumber: cleanPhone,
        hidePhoneNumberPublic,
      });
    } catch {}
    setInviteToast(`📞 Phone number updated to "${cleanPhone}"!`);
    setTimeout(() => setInviteToast(null), 2600);
  };

  const handleToggleModalHidePhonePublic = async (explicitHide?: boolean) => {
    const nextHide = typeof explicitHide === 'boolean' ? explicitHide : !hidePhoneNumberPublic;
    setHidePhoneNumberPublic(nextHide);
    try {
      localStorage.setItem(userHidePhonePublicStorageKey, String(nextHide));
    } catch {}
    broadcastProfileDetailsUpdate({ hidePhoneNumberPublic: nextHide });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        phoneNumber,
        hidePhoneNumberPublic: nextHide,
      });
    } catch {}
    setInviteToast(
      nextHide
        ? '🔒 Phone number is now hidden from public profile!'
        : '🌐 Phone number is now visible on public profile!'
    );
    setTimeout(() => setInviteToast(null), 2600);
  };

  const handleSaveModalEmail = async () => {
    const cleanEmail = modalEmailDraft.trim() || defaultEmail;
    setEmail(cleanEmail);
    setIsEditingModalEmail(false);
    try {
      localStorage.setItem(userEmailStorageKey, cleanEmail);
    } catch {}
    broadcastProfileDetailsUpdate({ email: cleanEmail });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        email: cleanEmail,
      });
    } catch {}
    setInviteToast(`✉️ Email updated to "${cleanEmail}"!`);
    setTimeout(() => setInviteToast(null), 2600);
  };

  const handleSaveModalBio = async () => {
    const cleanBio = modalBioDraft.trim() || defaultBio;
    setBio(cleanBio);
    setIsEditingModalBio(false);
    try {
      localStorage.setItem(userBioStorageKey, cleanBio);
    } catch {}
    broadcastProfileDetailsUpdate({ bio: cleanBio });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        bio: cleanBio,
      });
    } catch {}
    setInviteToast(`📝 About & Biography updated!`);
    setTimeout(() => setInviteToast(null), 2600);
  };

  const handleSaveModalSocialLink = async () => {
    if (!modalLinkUrl.trim()) return;
    const newItem: SocialLinkItem = {
      platform: modalLinkPlatform,
      url: modalLinkUrl.trim(),
      handle: modalLinkHandle.trim() || undefined,
    };
    const updatedLinks =
      editingModalLinkIndex !== null
        ? modalSocialLinks.map((item, idx) => (idx === editingModalLinkIndex ? newItem : item))
        : [...modalSocialLinks, newItem];
    setModalSocialLinks(updatedLinks);
    setIsEditingModalLink(false);
    setEditingModalLinkIndex(null);
    setModalLinkUrl('');
    setModalLinkHandle('');
    try {
      localStorage.setItem(userLinksStorageKey, JSON.stringify(updatedLinks));
    } catch {}
    broadcastProfileDetailsUpdate({ socialLinks: updatedLinks });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        socialLinks: updatedLinks,
      });
    } catch {}
    setInviteToast(
      editingModalLinkIndex !== null ? `🔗 Updated About link!` : `🔗 Added new About link!`
    );
    setTimeout(() => setInviteToast(null), 2600);
  };

  const handleRemoveModalSocialLink = async (_platform: SocialPlatform, index?: number) => {
    const updatedLinks =
      typeof index === 'number'
        ? modalSocialLinks.filter((_, idx) => idx !== index)
        : modalSocialLinks.filter((l) => l.platform !== _platform);
    setModalSocialLinks(updatedLinks);
    try {
      localStorage.setItem(userLinksStorageKey, JSON.stringify(updatedLinks));
    } catch {}
    broadcastProfileDetailsUpdate({ socialLinks: updatedLinks });
    try {
      await saveUserProfileToDb({
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        socialLinks: updatedLinks,
      });
    } catch {}
    setInviteToast(`🗑️ Removed About link`);
    setTimeout(() => setInviteToast(null), 2400);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Hidden File Inputs for User Profile Cover & User Profile Wallpaper */}
      <input
        ref={userCoverInputRef}
        id="user-profile-cover-upload-input"
        type="file"
        accept="image/*"
        onChange={handleUserCoverUpload}
        className="hidden"
      />
      <input
        ref={userWallpaperInputRef}
        id="user-profile-wallpaper-upload-input"
        type="file"
        accept="image/*"
        onChange={handleUserWallpaperUpload}
        className="hidden"
      />
      <input
        ref={userAvatarInputRef}
        id="user-profile-modal-avatar-upload-input"
        type="file"
        accept="image/*"
        onChange={handleModalAvatarUpload}
        className="hidden"
      />

      <div
        style={
          !isGroup && userProfileWallpaperUrl
            ? {
                backgroundImage: `linear-gradient(to bottom, ${
                  isDark ? 'rgba(18, 22, 31, 0.85)' : 'rgba(255, 255, 255, 0.88)'
                }, ${
                  isDark ? 'rgba(18, 22, 31, 0.94)' : 'rgba(255, 255, 255, 0.95)'
                }), url(${userProfileWallpaperUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
        className={`w-full max-w-2xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
          isDark
            ? 'bg-[#12161F] text-slate-100 border-slate-700/80'
            : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Top Header Banner / Group Cover / User Profile Cover */}
        <div
          style={{ backgroundColor: primaryColor }}
          className={`relative shrink-0 overflow-hidden ${
            isGroup ? 'h-36 sm:h-48' : 'h-32 sm:h-40'
          }`}
        >
          {isGroup && groupCoverUrl && (
            <>
              <img
                id="group-page-cover-image"
                src={groupCoverUrl}
                alt={`${contact.name} Group Cover`}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/35" />
            </>
          )}

          {!isGroup && userProfileCoverUrl && (
            <>
              <img
                id="user-profile-cover-image"
                src={userProfileCoverUrl}
                alt={`${contact.name} Profile Cover`}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
            </>
          )}

          {/* Hidden File Input for Group Admin Cover Upload */}
          {isGroup && (
            <input
              ref={groupCoverInputRef}
              id="group-cover-upload-input"
              type="file"
              accept="image/*"
              onChange={handleGroupCoverUpload}
              className="hidden"
            />
          )}

          {/* Hidden File Inputs for Individual User Profile Cover & Wallpaper */}
          {!isGroup && (
            <>
              <input
                ref={userCoverInputRef}
                id="user-profile-cover-upload-input"
                type="file"
                accept="image/*"
                onChange={handleUserCoverUpload}
                className="hidden"
              />
              <input
                ref={userWallpaperInputRef}
                id="user-profile-wallpaper-upload-input"
                type="file"
                accept="image/*"
                onChange={handleUserWallpaperUpload}
                className="hidden"
              />
            </>
          )}

          {/* Top Left Badge & Controls: Group Cover vs User Profile Cover & Wallpaper */}
          {isGroup ? (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/20 flex items-center gap-1.5 shadow-sm">
                <ImageIcon className="w-3 h-3 text-emerald-400" />
                <span>Group Cover</span>
              </span>

              <button
                id="toggle-group-admin-role-btn"
                type="button"
                onClick={() => setIsGroupAdminViewer((prev) => !prev)}
                className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  isGroupAdminViewer
                    ? 'bg-emerald-500/80 text-white border-emerald-300/50 shadow-sm'
                    : 'bg-black/55 text-slate-200 border-white/20 hover:bg-black/70'
                }`}
                title="Switch viewer role to test Group Admin cover upload permission"
              >
                <Shield className="w-3 h-3" />
                <span>{isGroupAdminViewer ? 'Role: Group Admin' : 'Role: Group Member'}</span>
              </button>
            </div>
          ) : (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
              <button
                id="upload-user-profile-cover-btn"
                type="button"
                onClick={() => userCoverInputRef.current?.click()}
                className="px-2.5 py-1 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/20 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                title="Upload User Profile Cover Picture"
              >
                <Camera className="w-3 h-3 text-purple-300" />
                <span>Upload Profile Cover</span>
              </button>

              <button
                id="customize-user-profile-wallpaper-btn"
                type="button"
                onClick={() => setShowCustomizeDrawer((prev) => !prev)}
                className="px-2.5 py-1 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/20 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                title="Customize User Profile Cover & Page Wallpaper"
              >
                <ImageIcon className="w-3 h-3 text-emerald-400" />
                <span>Profile Wallpaper</span>
              </button>

              <button
                id="direct-upload-user-wallpaper-btn"
                type="button"
                onClick={() => userWallpaperInputRef.current?.click()}
                className="px-2.5 py-1 rounded-full bg-emerald-600/85 hover:bg-emerald-500 backdrop-blur-md text-white text-[10px] font-extrabold border border-emerald-300/30 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                title="Upload User Wallpaper"
              >
                <Upload className="w-3 h-3 text-white" />
                <span>Upload Wallpaper</span>
              </button>
            </div>
          )}

          {/* Group Admin Upload Group Cover Button on Banner */}
          {isGroup && (
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
              {isGroupAdminViewer ? (
                <button
                  id="upload-group-cover-banner-btn"
                  type="button"
                  onClick={() => groupCoverInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-black/65 hover:bg-black/80 active:scale-95 text-white text-xs font-extrabold backdrop-blur-md border border-white/25 flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                  title="Upload custom Group Cover image (Group Admin)"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload Group Cover</span>
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-black/55 text-slate-300 text-[10px] font-semibold backdrop-blur-md border border-white/15 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Admin Only Cover Upload</span>
                </span>
              )}
            </div>
          )}

          <button
            id="close-user-profile-modal-btn"
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer z-10"
            title="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 pb-6 space-y-5 -mt-14">
          {/* Avatar and Main Info Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3.5">
              <div className="relative shrink-0 group">
                <img
                  src={customContactAvatar || getCleanAvatar(contact.avatar, contact.name, contact.id)}
                  alt={contact.name}
                  style={{ borderColor: primaryColor, width: '100px', height: '100px' }}
                  className="w-[100px] h-[100px] rounded-full object-cover border-4 shadow-xl bg-slate-800"
                />
                <button
                  id="modal-upload-avatar-camera-btn"
                  type="button"
                  onClick={() => userAvatarInputRef.current?.click()}
                  style={{ backgroundColor: primaryColor }}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full border-2 border-[#12161F] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Upload & Auto-Save Avatar Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    {contact.name}
                  </h2>
                  {isGroup ? (
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Group ({groupParticipants.length} Members)</span>
                    </span>
                  ) : isChannel ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Megaphone className="w-3 h-3" />
                      <span>Channel ({channelSubscribersCount} Subscribers)</span>
                    </span>
                  ) : (
                    friendInviteStatus === 'accepted' && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>Friends</span>
                      </span>
                    )
                  )}
                  {isGroup && hasJoinedGroup && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Joined</span>
                    </span>
                  )}
                  {isBlocked && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                      Blocked
                    </span>
                  )}
                </div>
                {isGroup ? (
                  <p style={{ color: primaryColor }} className="text-xs font-mono font-semibold">
                    {(contact as UserContact).groupTopic || 'Multilingual Group Page'}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {!isEditingModalUsername ? (
                      <button
                        id="user-profile-username-display-btn"
                        type="button"
                        onClick={() => {
                          setModalUsernameDraft(`@${username}`);
                          setIsEditingModalUsername(true);
                        }}
                        style={{ color: primaryColor }}
                        className="text-xs font-mono font-bold flex items-center gap-1 hover:opacity-80 cursor-pointer"
                        title="Click to edit @username"
                      >
                        <span>@{username}</span>
                        <Edit2 className="w-3 h-3 opacity-75" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div
                          className={`flex items-center rounded-lg border px-2 py-0.5 text-xs font-mono ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <span style={{ color: primaryColor }} className="font-bold select-none">
                            @
                          </span>
                          <input
                            id="user-profile-username-edit-input"
                            type="text"
                            value={modalUsernameDraft.replace(/^@+/, '')}
                            onChange={(e) =>
                              setModalUsernameDraft(`@${e.target.value.replace(/^@+/, '')}`)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveModalUsername();
                              if (e.key === 'Escape') setIsEditingModalUsername(false);
                            }}
                            placeholder="username"
                            className="bg-transparent outline-none w-28 text-xs font-mono"
                          />
                        </div>
                        <button
                          id="user-profile-username-save-btn"
                          type="button"
                          onClick={handleSaveModalUsername}
                          style={{ backgroundColor: primaryColor }}
                          className="p-1 rounded-md text-white cursor-pointer"
                          title="Save @username"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingModalUsername(false)}
                          className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 font-semibold">
                      {userGender} • {userAge} yrs
                    </span>
                  </div>
                )}
                <div className="mt-0.5 flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span style={{ backgroundColor: primaryColor }} className="w-1.5 h-1.5 rounded-full" />
                    <span>{statusText}</span>
                  </p>
                  {!isGroup && (
                    <div className="flex items-center gap-1.5">
                      {!isEditingModalLocation ? (
                        <button
                          id="user-profile-location-display"
                          type="button"
                          onClick={() => {
                            setModalLocationDraft(userLocation);
                            setIsEditingModalLocation(true);
                          }}
                          className={`text-xs sm:text-sm font-medium tracking-tight flex items-center gap-1 hover:opacity-80 cursor-pointer transition-opacity ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}
                          title="Click to edit user location"
                        >
                          <span>{userLocation || 'New York,NY'}</span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-70" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            id="user-profile-location-edit-input"
                            type="text"
                            value={modalLocationDraft}
                            onChange={(e) => setModalLocationDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveModalLocation();
                              if (e.key === 'Escape') setIsEditingModalLocation(false);
                            }}
                            placeholder="e.g. New York,NY"
                            className={`px-2 py-0.5 rounded-lg text-xs border outline-none w-32 ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-white'
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <button
                            id="user-profile-location-save-btn"
                            type="button"
                            onClick={handleSaveModalLocation}
                            style={{ backgroundColor: primaryColor }}
                            className="p-1 rounded-md text-white cursor-pointer"
                            title="Save location"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Area: On Group Page, show "Join Group" / "Leave the group"; on Channel Page, show "Subscribe to channel" */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {isGroup ? (
                <>
                  {hasJoinedGroup ? (
                    <button
                      id="group-page-leave-group-btn"
                      type="button"
                      onClick={handleLeaveGroupClick}
                      className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      title="Leave the group"
                    >
                      <LogOut className="w-4 h-4 stroke-[2.5]" />
                      <span>Leave the group</span>
                    </button>
                  ) : (
                    <button
                      id="group-page-join-group-btn"
                      type="button"
                      onClick={handleJoinGroupClick}
                      style={{ backgroundColor: primaryColor }}
                      className="px-4 py-2.5 rounded-2xl text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      title="Join the group"
                    >
                      <Users className="w-4 h-4" />
                      <span>Join Group</span>
                    </button>
                  )}
                </>
              ) : isChannel ? (
                <>
                  <button
                    id="channel-page-subscribe-btn"
                    type="button"
                    onClick={handleToggleChannelSubscribe}
                    style={isSubscribedToChannel ? undefined : { backgroundColor: primaryColor }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
                      isSubscribedToChannel
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'text-white hover:brightness-110'
                    }`}
                    title={isSubscribedToChannel ? 'Subscribed — click to unsubscribe' : 'Subscribe to channel'}
                  >
                    {isSubscribedToChannel ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Subscribed ({channelSubscribersCount})</span>
                      </>
                    ) : (
                      <>
                        <Megaphone className="w-4 h-4" />
                        <span>Subscribe to channel</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onSendMessage) {
                        onSendMessage();
                      }
                    }}
                    style={{ backgroundColor: primaryColor }}
                    className="p-2.5 rounded-2xl hover:brightness-110 active:scale-95 text-white flex items-center justify-center shadow-sm transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {onStartCall && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartCall('voice');
                      }}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                        isDark
                          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      }`}
                    >
                      <Phone style={{ color: primaryColor }} className="w-4 h-4" />
                    </button>
                  )}

                  {/* Only show Friendship icon (without title) if users are friends */}
                  {friendInviteStatus === 'accepted' && (
                    <button
                      id="profile-open-friendship-link-btn"
                      type="button"
                      onClick={() => {
                        if (onOpenFriendshipModal) {
                          onOpenFriendshipModal();
                        } else {
                          setIsInternalFriendshipOpen(true);
                        }
                      }}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                        isDark
                          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-emerald-400'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-emerald-600'
                      }`}
                    >
                      <Handshake className="w-4 h-4" />
                    </button>
                  )}

                  {/* Send "Friend Invite" button when not friends yet (Individual users only, NEVER on Group Page) */}
                  {friendInviteStatus === 'none' && (
                    <button
                      id="profile-send-friend-invite-btn"
                      type="button"
                      onClick={handleSendFriendInvite}
                      style={{ backgroundColor: primaryColor }}
                      className="px-3.5 py-2.5 rounded-2xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Send Friend Invite</span>
                    </button>
                  )}

                  {friendInviteStatus === 'pending' && (
                    <span className="px-3 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Invite Sent</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Toast Feedback */}
          {inviteToast && (
            <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{inviteToast}</span>
            </div>
          )}

          {/* User Profile Cover & Wallpaper Customization Drawer (for Individual User Profile Page) */}
          {!isGroup && showCustomizeDrawer && (
            <div
              className={`p-4 rounded-2xl border space-y-3 animate-in fade-in duration-150 ${
                isDark ? 'bg-[#181D27]/95 border-slate-700' : 'bg-slate-50/95 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon style={{ color: primaryColor }} className="w-4 h-4" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Customize Profile Cover & Page Wallpaper
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomizeDrawer(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => userCoverInputRef.current?.click()}
                  style={{ backgroundColor: primaryColor }}
                  className="py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Profile Cover Picture</span>
                </button>

                <button
                  type="button"
                  onClick={() => userWallpaperInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Upload Profile Page Wallpaper</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Preset Covers / Wallpapers
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COVERS.map((presetUrl, idx) => (
                    <div key={idx} className="space-y-1">
                      <img
                        src={presetUrl}
                        alt={`Preset ${idx + 1}`}
                        className="w-full h-12 rounded-lg object-cover border border-slate-700"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserProfileCoverUrl(presetUrl);
                            try {
                              localStorage.setItem(userCoverStorageKey, presetUrl);
                            } catch {}
                            setInviteToast('Applied preset as Profile Cover!');
                            setTimeout(() => setInviteToast(null), 2500);
                          }}
                          className="flex-1 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold cursor-pointer hover:bg-purple-500/30"
                        >
                          Cover
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserProfileWallpaperUrl(presetUrl);
                            try {
                              localStorage.setItem(userWallpaperStorageKey, presetUrl);
                            } catch {}
                            setInviteToast('Applied preset as Profile Wallpaper!');
                            setTimeout(() => setInviteToast(null), 2500);
                          }}
                          className="flex-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold cursor-pointer hover:bg-emerald-500/30"
                        >
                          Wall
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(userProfileCoverUrl || userProfileWallpaperUrl) && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  {userProfileCoverUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserProfileCoverUrl('');
                        try {
                          localStorage.removeItem(userCoverStorageKey);
                        } catch {}
                      }}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer font-semibold"
                    >
                      Reset Cover
                    </button>
                  )}
                  {userProfileWallpaperUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserProfileWallpaperUrl('');
                        try {
                          localStorage.removeItem(userWallpaperStorageKey);
                        } catch {}
                      }}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer font-semibold"
                    >
                      Reset Wallpaper
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Group Cover Management Bar for Group Admin */}
          {isGroup && (
            <div
              id="group-cover-admin-controls"
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-[#181D27] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Camera className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-extrabold">Group Cover Banner</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      Group Admin Control
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {isGroupAdminViewer
                      ? 'As Group Admin, upload a custom cover image or choose a preset banner.'
                      : 'Only the Group Admin is permitted to upload or change the group cover.'}
                  </p>
                </div>
              </div>

              {isGroupAdminViewer ? (
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    id="upload-group-cover-card-btn"
                    type="button"
                    onClick={() => groupCoverInputRef.current?.click()}
                    style={{ backgroundColor: primaryColor }}
                    className="px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Group Cover</span>
                  </button>
                  {PRESET_GROUP_COVERS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetGroupCover(preset.url, preset.label)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        groupCoverUrl === preset.url
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                          : isDark
                          ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsGroupAdminViewer(true)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer shrink-0"
                >
                  Switch to Group Admin to Upload
                </button>
              )}
            </div>
          )}

          {/* Group Page Advanced Search + AI Search Assistant (Search Members & Groups by Texted, Alphabet A-Z, Username, Email) */}
          {isGroup && (
            <div
              id="group-page-advanced-search-card"
              className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-[#181D27] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="relative">
                <input
                  id="group-page-search-input"
                  type="text"
                  placeholder="Search group members & groups by texted, A-Z, @username, or email..."
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  className={`w-full py-2 pl-9 pr-8 rounded-xl text-xs font-medium border focus:outline-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-400'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                {groupSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setGroupSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <AdvancedAiSearchPanel
                items={[
                  ...groupParticipants.map((m) => ({
                    ...m,
                    lastMessage: `${m.nativeLanguage || 'English'} speaker • ${m.role || 'member'}`,
                  })),
                  ...directoryGroups,
                ]}
                searchQuery={groupSearchQuery}
                onSearchQueryChange={setGroupSearchQuery}
                alphabetFilter={groupAlphabetFilter}
                onAlphabetFilterChange={setGroupAlphabetFilter}
                scope={groupSearchScope}
                onScopeChange={setGroupSearchScope}
                sortOrder={groupSortOrder}
                onSortOrderChange={setGroupSortOrder}
                onAiResults={(ids, _summary, reasons) => {
                  setGroupAiMatchedIds(ids);
                  setGroupAiMatchReasons(reasons);
                }}
                isDark={isDark}
                primaryColor={primaryColor}
                contextLabel={`Group Page (${contact.name})`}
                compact={true}
                idPrefix="group-page-adv-search"
              />
            </div>
          )}

          {/* Group Members List with Count (Prominently displayed at top of Group Page) */}
          {isGroup && (
            <div
              id="group-page-top-members-list-card"
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#181D27] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                        Group Members List ({filteredGroupParticipants.length}/{groupParticipants.length})
                      </h3>
                      <span
                        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                      >
                        {groupParticipants.length} Members Total
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                        {groupParticipants.filter((m) => m.online !== false && m.moderationStatus !== 'banned').length} Online
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Active participants in {contact.name} (filtered A–Z, @username, email & texted)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredGroupParticipants.map((member) => {
                  const isBanned = member.moderationStatus === 'banned';
                  const isSuspended = member.moderationStatus === 'suspended';
                  return (
                    <div
                      key={`top-member-${member.id}`}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
                        isBanned
                          ? 'bg-rose-950/25 border-rose-500/40'
                          : isSuspended
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : isDark
                          ? 'bg-slate-900/70 border-slate-800'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className={`w-12 h-12 rounded-full object-cover border border-slate-700 ${
                              isBanned ? 'grayscale opacity-60' : ''
                            }`}
                          />
                          {member.online !== false && !isBanned && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                              className="w-4 h-4 rounded-md text-[9px] font-extrabold inline-flex items-center justify-center shrink-0"
                            >
                              {getUserAlphabetLetter(member)}
                            </span>
                            <p className="text-xs font-bold truncate">{member.name}</p>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                member.role === 'admin'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : member.role === 'moderator'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-slate-500/15 text-slate-400'
                              }`}
                            >
                              {member.role || 'member'}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-emerald-500 truncate">
                            @{getUserUsername(member)} • {getUserEmail(member)}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {member.nativeLanguage || 'English'} Speaker
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Invitation Visibility & Accept Section (Individual Invited User Only — hidden on Group Page & Channel Page) */}
          {!isGroup && !isChannel && friendInviteStatus === 'pending' && (
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-[#181D27] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Invitation Visibility & Access Role:</span>
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    id="role-switch-sender-btn"
                    type="button"
                    onClick={() => setViewerRole('sender')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      viewerRole === 'sender'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    You (Sender)
                  </button>
                  <button
                    id="role-switch-invited-user-btn"
                    type="button"
                    onClick={() => setViewerRole('invited_user')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      viewerRole === 'invited_user'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : isDark
                        ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                    }`}
                  >
                    <Bell className="w-2.5 h-2.5" />
                    <span>Invited User ({contact.name.split(' ')[0]})</span>
                  </button>
                  <button
                    id="role-switch-admin-btn"
                    type="button"
                    onClick={() => setViewerRole('admin')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      viewerRole === 'admin'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    id="role-switch-other-user-btn"
                    type="button"
                    onClick={() => setViewerRole('other_user')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      viewerRole === 'other_user'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    Other User (Not Invited)
                  </button>
                </div>
              </div>

              {/* ONLY the invited user can see the Invitation Notification & Accept button */}
              {isAllowedToSeeAndAcceptInvite ? (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  {/* Private Invitation Notification Banner visible ONLY to Invited User */}
                  <div
                    id="invited-user-only-notification-banner"
                    className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-2.5 text-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Bell className="w-4 h-4 animate-bounce" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-emerald-500 dark:text-emerald-300 text-xs">
                        New Friend Invitation Notification (For {contact.name} Only)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300">
                        <strong>{invitationRecord?.senderName || 'Sajol'}</strong> invited you to connect as friends. Only you ({contact.name}) can see this notification and accept it.
                      </p>
                    </div>
                  </div>

                  {/* Invitation Card with Accept / Decline for the Invited User ONLY */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark
                        ? 'bg-slate-900/90 border-emerald-500/30'
                        : 'bg-white border-emerald-500/30 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-9 h-9 rounded-full object-cover border border-emerald-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          Friend Invitation for {contact.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Verified as invited user ({contact.name}) • You can accept or decline
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id="profile-accept-friend-invite-btn"
                        type="button"
                        onClick={handleAcceptFriendInviteAsInvitedUser}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Accept Friend Invite</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateInviteStatus('none', 'Friend invite declined by invited user.')}
                        className={`px-2.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          isDark
                            ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  id="non-invited-user-hidden-invite-notice"
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs ${
                    viewerRole === 'admin' || viewerRole === 'other_user'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : isDark
                      ? 'bg-slate-900/70 border-slate-800 text-slate-300'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                    <span className="text-[11px] leading-snug">
                      {viewerRole === 'admin'
                        ? `Hidden from Admin: Admins cannot see ${contact.name}'s private friend invitation, notifications, or accept it.`
                        : viewerRole === 'other_user'
                        ? `Hidden from Other Users: Users who are not invited cannot see this invitation, notifications, or accept it.`
                        : `Waiting for ${contact.name}: Only the invited user (${contact.name}) can see the invitation notification and accept it.`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Group Gallery / Media Gallery Section */}
          <div id="group-page-gallery-section" className="space-y-3 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon style={{ color: primaryColor }} className="w-4 h-4" />
                <h3 className="text-base font-bold tracking-tight">
                  {isGroup
                    ? 'Group Gallery (All Media Shared in Group Messages)'
                    : 'Shared Media, Pictures & Documents'}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {isGroup
                  ? 'View & share to other group members only'
                  : 'Click any file to view, zoom, like & share'}
              </span>
            </div>

            {/* Embedded Gallery View with 'Images', 'Videos', 'Documents' Tab Switcher */}
            <MediaPictureGalleryView
              messages={resolvedGroupMessages}
              contact={contact as UserContact}
              theme={theme}
              primaryColor={primaryColor}
              onSelectMedia={isGroup ? undefined : onSelectMedia}
              compact={false}
              isGroupGallery={isGroup}
              groupParticipants={isGroup ? groupParticipants : undefined}
              onShareWithGroupMembers={onShareGroupMedia}
            />
          </div>

          {/* User Profile Description / Group Admin Moderation & Members Section */}
          {isGroup ? (
            <div
              className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#181D27] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Group Admin & Moderator Permissions Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/40">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider block">
                      Group Admin & Moderator Controls
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Ban users, temporary suspend, delete group members & upload group cover
                    </span>
                  </div>
                </div>

                {/* Role Switcher to test Group Admin / Moderator vs Member permissions */}
                <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setGroupPermissionRole('admin')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      groupPermissionRole === 'admin'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Group Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupPermissionRole('moderator')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      groupPermissionRole === 'moderator'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Moderator
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupPermissionRole('member')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      groupPermissionRole === 'member'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Member View
                  </button>
                </div>
              </div>

              {/* Group Admin Cover Upload & Preset Picker Box */}
              {canModerateGroup && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Camera style={{ color: primaryColor }} className="w-4 h-4" />
                      <div>
                        <p className="text-xs font-bold">Group Cover Image (Admin Permission)</p>
                        <p className="text-[10px] text-slate-400">
                          Upload custom group cover or choose a preset banner for {contact.name}
                        </p>
                      </div>
                    </div>
                    <button
                      id="admin-panel-upload-group-cover-btn"
                      type="button"
                      onClick={() => groupCoverInputRef.current?.click()}
                      style={{ backgroundColor: primaryColor }}
                      className="px-3 py-1.5 rounded-xl text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Group Cover</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {PRESET_COVERS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setGroupCoverUrl(preset);
                          try {
                            localStorage.setItem(groupCoverStorageKey, preset);
                          } catch {}
                          if (onUpdateGroupCover) onUpdateGroupCover(contact.id, preset);
                          setInviteToast(`🖼️ Group Cover updated by Group Admin!`);
                          setTimeout(() => setInviteToast(null), 2800);
                        }}
                        className={`relative h-11 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          groupCoverUrl === preset
                            ? 'border-emerald-400 scale-[1.02]'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        title={`Set Group Cover Preset ${idx + 1}`}
                      >
                        <img src={preset} alt={`Group Cover ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Group Members Header with Join Group status and Restore button */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Users style={{ color: primaryColor }} className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Group Members List ({groupParticipants.length} Members)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {groupParticipants.length < DEFAULT_GROUP_PARTICIPANTS.length && canModerateGroup && (
                    <button
                      type="button"
                      onClick={() =>
                        persistGroupParticipants(
                          DEFAULT_GROUP_PARTICIPANTS,
                          'Restored all default group members.'
                        )
                      }
                      className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore Members</span>
                    </button>
                  )}
                  {!hasJoinedGroup ? (
                    <button
                      type="button"
                      onClick={handleJoinGroupClick}
                      style={{ backgroundColor: primaryColor }}
                      className="px-3 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:brightness-110"
                    >
                      <Users className="w-3 h-3" />
                      <span>Join Group</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLeaveGroupClick}
                      className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Leave the group</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Group Members List with Ban, Temporary Suspend, and Delete Member controls for Group Admin/Moderator */}
              <div className="space-y-2">
                {groupParticipants.map((member) => {
                  const isMe = member.id === 'me';
                  const isBanned = member.moderationStatus === 'banned';
                  const isSuspended = member.moderationStatus === 'suspended';

                  return (
                    <div
                      key={member.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                        isBanned
                          ? 'bg-rose-950/25 border-rose-500/40'
                          : isSuspended
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : isDark
                          ? 'bg-slate-900/60 border-slate-800'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className={`w-13 h-13 rounded-full object-cover border border-slate-700 ${
                              isBanned ? 'grayscale opacity-60' : ''
                            }`}
                          />
                          {member.online !== false && !isBanned && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold truncate">{member.name}</p>
                            <span
                              onClick={() => !isMe && handleCycleMemberRole(member)}
                              title={isGroupAdmin && !isMe ? 'Click to change role (Admin / Moderator / Member)' : undefined}
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                member.role === 'admin'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : member.role === 'moderator'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-slate-500/15 text-slate-400'
                              } ${isGroupAdmin && !isMe ? 'cursor-pointer hover:brightness-125' : ''}`}
                            >
                              {member.role || 'member'}
                            </span>
                            {isBanned && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-extrabold uppercase">
                                Banned
                              </span>
                            )}
                            {isSuspended && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold">
                                Suspended ({member.suspendedUntil || '24h'})
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {member.nativeLanguage || 'English'} Speaker
                          </p>
                        </div>
                      </div>

                      {/* Admin & Moderator Action Buttons: Ban, Temporary Suspend, Delete Member */}
                      {canModerateGroup && !isMe && (
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <button
                            id={`group-mod-suspend-${member.id}`}
                            type="button"
                            onClick={() => handleToggleSuspendGroupMember(member)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              isSuspended
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30'
                            }`}
                            title="Temporary Suspend Member (24h)"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                          </button>

                          <button
                            id={`group-mod-ban-${member.id}`}
                            type="button"
                            onClick={() => handleToggleBanGroupMember(member)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              isBanned
                                ? 'bg-rose-600 text-white'
                                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
                            }`}
                            title="Ban User from Group"
                          >
                            <Ban className="w-3 h-3" />
                            <span>{isBanned ? 'Unban' : 'Ban User'}</span>
                          </button>

                          <button
                            id={`group-mod-delete-${member.id}`}
                            type="button"
                            onClick={() => handleDeleteGroupMember(member)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-700"
                            title="Delete Member from Group"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Group List in Group Page */}
              <div
                id="group-page-group-list-section"
                className={`p-3.5 rounded-xl border space-y-2.5 mt-3 ${
                  isDark ? 'bg-slate-900/75 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users style={{ color: primaryColor }} className="w-4 h-4" />
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider">
                        Group List ({directoryGroups.length} Groups)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Browse all groups & join any group directly from the Group Page
                      </p>
                    </div>
                  </div>
                  <span
                    style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    Group Directory
                  </span>
                </div>

                <div className="space-y-2">
                  {filteredDirectoryGroups.map((grp) => {
                    const isCurrentGroup = grp.id === contact.id;
                    const isJoined =
                      isCurrentGroup
                        ? hasJoinedGroup
                        : Boolean(joinedGroupsMap[grp.id] || grp.isJoinedGroup);
                    const memberCount = grp.participants?.length || 4;

                    return (
                      <div
                        key={grp.id}
                        id={`group-page-list-item-${grp.id}`}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                          isCurrentGroup
                            ? 'border-purple-500/40 bg-purple-500/10'
                            : isDark
                            ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => {
                            if (onSelectGroup && !isCurrentGroup) {
                              onSelectGroup(grp);
                            }
                          }}
                          className={`flex items-center gap-3 min-w-0 flex-1 ${
                            onSelectGroup && !isCurrentGroup ? 'cursor-pointer' : ''
                          }`}
                        >
                          <img
                            src={grp.avatar}
                            alt={grp.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 shrink-0 shadow-xs"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                                className="w-4 h-4 rounded-md text-[9px] font-extrabold inline-flex items-center justify-center shrink-0"
                              >
                                {getUserAlphabetLetter(grp)}
                              </span>
                              <p className="text-xs font-bold truncate">{grp.name}</p>
                              {isCurrentGroup && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                                  Viewing
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-500/15 text-slate-400 font-semibold">
                                {memberCount} Members
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-emerald-500 truncate">
                              @{getUserUsername(grp)} • {getUserEmail(grp)}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {grp.groupTopic || grp.lastMessage || 'Multilingual group chat'}
                            </p>
                            {grp.participants && grp.participants.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {grp.participants.map((p) => (
                                  <img
                                    key={p.id}
                                    src={p.avatar}
                                    alt={p.name}
                                    title={`${p.name} (${p.nativeLanguage || 'English'})`}
                                    style={{ width: '25px', height: '25px' }}
                                    className="w-[25px] h-[25px] rounded-full object-cover border border-slate-700 shadow-2xs"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onSelectGroup && !isCurrentGroup && (
                            <button
                              type="button"
                              onClick={() => onSelectGroup(grp)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                                isDark
                                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              Open
                            </button>
                          )}

                          <button
                            id={`group-list-join-btn-${grp.id}`}
                            type="button"
                            onClick={() => {
                              if (isCurrentGroup) {
                                if (hasJoinedGroup) {
                                  handleLeaveGroupClick();
                                } else {
                                  handleJoinGroupClick();
                                }
                                return;
                              }
                              const nextJoined = !isJoined;
                              setJoinedGroupsMap((prev) => ({ ...prev, [grp.id]: nextJoined }));
                              try {
                                localStorage.setItem(
                                  `freedom_group_joined_state_${grp.id}`,
                                  nextJoined ? 'joined' : 'not_joined'
                                );
                              } catch {}
                              if (nextJoined && onJoinGroup) {
                                onJoinGroup(grp.id);
                              }
                              setInviteToast(
                                nextJoined
                                  ? `🎉 You joined ${grp.name}!`
                                  : `👋 Left ${grp.name}. Click "Join Group" anytime to rejoin.`
                              );
                              setTimeout(() => setInviteToast(null), 2800);
                            }}
                            style={{ backgroundColor: isJoined ? '#EF4444' : primaryColor }}
                            className="px-3 py-1.5 rounded-xl text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-2xs"
                          >
                            {isJoined ? (
                              <>
                                <LogOut className="w-3 h-3 stroke-[2.5]" />
                                <span>Leave the group</span>
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
            </div>
          ) : (
            <div
              className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 ${
                isDark ? 'bg-[#181D27] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-700/40">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    User Profile Description
                  </span>
                </div>
                <span
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                    borderColor: `${primaryColor}40`,
                  }}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  <span>{motherLanguage} Speaker</span>
                </span>
              </div>

              {/* Profile Bio & Description Quote (Editable About & Biography) */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p
                    style={{ color: primaryColor }}
                    className="text-[11px] font-bold uppercase tracking-wider"
                  >
                    About & Biography
                  </p>
                  {!isEditingModalBio ? (
                    <button
                      id="user-profile-edit-about-btn"
                      type="button"
                      onClick={() => {
                        setModalBioDraft(bio);
                        setIsEditingModalBio(true);
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-purple-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit About & Biography"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit About</span>
                    </button>
                  ) : null}
                </div>

                {!isEditingModalBio ? (
                  <p
                    onClick={() => {
                      setModalBioDraft(bio);
                      setIsEditingModalBio(true);
                    }}
                    className={`text-sm leading-relaxed cursor-pointer hover:opacity-90 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                    title="Click to edit About & Biography"
                  >
                    "{bio}"
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    <textarea
                      id="user-profile-about-edit-input"
                      rows={2}
                      value={modalBioDraft}
                      onChange={(e) => setModalBioDraft(e.target.value)}
                      placeholder="Write your About & Biography..."
                      className={`w-full px-3 py-2 rounded-lg text-xs border outline-none resize-none ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500'
                      }`}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingModalBio(false)}
                        className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="user-profile-about-save-btn"
                        type="button"
                        onClick={handleSaveModalBio}
                        style={{ backgroundColor: primaryColor }}
                        className="px-3 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:brightness-110"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save About</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Details Chips (Editable Phone Number & Email Address) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5 text-xs">
                {/* Editable Phone Number Card with Public Visibility Option */}
                <div
                  className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-colors ${
                    isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  {!isEditingModalPhone ? (
                    <div className="flex items-center justify-between gap-2">
                      <div
                        onClick={() => {
                          if (!hidePhoneNumberPublic || isCurrentUserProfile) {
                            handleCopy(phoneNumber, 'Phone number');
                          }
                        }}
                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                        title={
                          hidePhoneNumberPublic && !isCurrentUserProfile
                            ? 'Phone number is hidden from public by user'
                            : 'Click to copy phone number'
                        }
                      >
                        <Phone style={{ color: primaryColor }} className="w-3.5 h-3.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">
                              Phone Number
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 ${
                                hidePhoneNumberPublic
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              }`}
                            >
                              {hidePhoneNumberPublic ? (
                                <>
                                  <EyeOff className="w-2.5 h-2.5" />
                                  <span>Hidden Public</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-2.5 h-2.5" />
                                  <span>Public</span>
                                </>
                              )}
                            </span>
                          </div>
                          {hidePhoneNumberPublic && !isCurrentUserProfile ? (
                            <span className="text-[11px] italic text-slate-400 truncate block">
                              Hidden from public
                            </span>
                          ) : (
                            <span className="font-mono truncate block">{phoneNumber}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          id="user-profile-toggle-hide-phone-public-btn"
                          type="button"
                          onClick={() => handleToggleModalHidePhonePublic()}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                            hidePhoneNumberPublic
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                              : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:text-white'
                          }`}
                          title={
                            hidePhoneNumberPublic
                              ? 'Phone number is hidden from public — click to show publicly'
                              : 'Click to hide phone number from public'
                          }
                        >
                          {hidePhoneNumberPublic ? (
                            <>
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>Show Public</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>Hide Public</span>
                            </>
                          )}
                        </button>
                        <button
                          id="user-profile-edit-phone-btn"
                          type="button"
                          onClick={() => {
                            setModalPhoneDraft(phoneNumber);
                            setIsEditingModalPhone(true);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-purple-400 hover:bg-slate-800/60 cursor-pointer transition-colors"
                          title="Edit Phone Number"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {(!hidePhoneNumberPublic || isCurrentUserProfile) && (
                          <button
                            type="button"
                            onClick={() => handleCopy(phoneNumber, 'Phone number')}
                            className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                          >
                            {copiedText === 'Phone number' ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 w-full">
                      <div className="flex items-center gap-1.5 w-full">
                        <Phone style={{ color: primaryColor }} className="w-3.5 h-3.5 shrink-0" />
                        <input
                          id="user-profile-phone-edit-input"
                          type="tel"
                          value={modalPhoneDraft}
                          onChange={(e) => setModalPhoneDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveModalPhone();
                            if (e.key === 'Escape') setIsEditingModalPhone(false);
                          }}
                          placeholder="Phone number"
                          className={`flex-1 min-w-0 px-2 py-1 rounded-lg text-xs font-mono border outline-none ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-white'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                        <button
                          id="user-profile-phone-save-btn"
                          type="button"
                          onClick={handleSaveModalPhone}
                          style={{ backgroundColor: primaryColor }}
                          className="p-1.5 rounded-lg text-white cursor-pointer"
                          title="Save Phone Number"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingModalPhone(false)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Public Visibility:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleModalHidePhonePublic(false)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                              !hidePhoneNumberPublic
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'border-slate-700 text-slate-400'
                            }`}
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>Public</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleModalHidePhonePublic(true)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                              hidePhoneNumberPublic
                                ? 'bg-amber-500 text-slate-950 border-amber-500'
                                : 'border-slate-700 text-slate-400'
                            }`}
                          >
                            <EyeOff className="w-2.5 h-2.5" />
                            <span>Hide Public</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Editable Email Address Card */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                    isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  {!isEditingModalEmail ? (
                    <>
                      <div
                        onClick={() => handleCopy(email, 'Email address')}
                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                        title="Click to copy email address"
                      >
                        <Mail style={{ color: primaryColor }} className="w-3.5 h-3.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none mb-0.5">
                            Email Address
                          </span>
                          <span className="font-mono truncate block max-w-[160px]">{email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          id="user-profile-edit-email-btn"
                          type="button"
                          onClick={() => {
                            setModalEmailDraft(email);
                            setIsEditingModalEmail(true);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-purple-400 hover:bg-slate-800/60 cursor-pointer transition-colors"
                          title="Edit Email Address"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(email, 'Email address')}
                          className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                        >
                          {copiedText === 'Email address' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 w-full">
                      <Mail style={{ color: primaryColor }} className="w-3.5 h-3.5 shrink-0" />
                      <input
                        id="user-profile-email-edit-input"
                        type="email"
                        value={modalEmailDraft}
                        onChange={(e) => setModalEmailDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveModalEmail();
                          if (e.key === 'Escape') setIsEditingModalEmail(false);
                        }}
                        placeholder="Email address"
                        className={`flex-1 min-w-0 px-2 py-1 rounded-lg text-xs font-mono border outline-none ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        id="user-profile-email-save-btn"
                        type="button"
                        onClick={handleSaveModalEmail}
                        style={{ backgroundColor: primaryColor }}
                        className="p-1.5 rounded-lg text-white cursor-pointer"
                        title="Save Email Address"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingModalEmail(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe style={{ color: primaryColor }} className="w-3.5 h-3.5" />
                    <span>Native Language</span>
                  </div>
                  <span style={{ color: primaryColor }} className="font-bold">
                    {motherLanguage}
                  </span>
                </div>

                {/* Editable Username (@) Card */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  {!isEditingModalUsername ? (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <User style={{ color: primaryColor }} className="w-3.5 h-3.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none mb-0.5">
                            Username (@)
                          </span>
                          <span style={{ color: primaryColor }} className="font-mono font-bold truncate block">
                            @{username}
                          </span>
                        </div>
                      </div>
                      <button
                        id="user-profile-card-edit-username-btn"
                        type="button"
                        onClick={() => {
                          setModalUsernameDraft(`@${username}`);
                          setIsEditingModalUsername(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>Edit @</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 w-full">
                      <span style={{ color: primaryColor }} className="font-mono font-bold text-xs">
                        @
                      </span>
                      <input
                        type="text"
                        value={modalUsernameDraft.replace(/^@+/, '')}
                        onChange={(e) =>
                          setModalUsernameDraft(`@${e.target.value.replace(/^@+/, '')}`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveModalUsername();
                          if (e.key === 'Escape') setIsEditingModalUsername(false);
                        }}
                        placeholder="username"
                        className={`flex-1 min-w-0 px-2 py-1 rounded-lg text-xs font-mono border outline-none ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleSaveModalUsername}
                        style={{ backgroundColor: primaryColor }}
                        className="p-1.5 rounded-lg text-white cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Editable Age Card */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  {!isEditingModalAge ? (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <User style={{ color: primaryColor }} className="w-3.5 h-3.5 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none mb-0.5">
                            Age
                          </span>
                          <span className="font-bold">{userAge} Years Old</span>
                        </div>
                      </div>
                      <button
                        id="user-profile-edit-age-btn"
                        type="button"
                        onClick={() => {
                          setModalAgeDraft(userAge);
                          setIsEditingModalAge(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        title="Edit Age"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>Edit Age</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        id="user-profile-age-edit-input"
                        type="number"
                        min={13}
                        max={120}
                        value={modalAgeDraft}
                        onChange={(e) => setModalAgeDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveModalAge();
                          if (e.key === 'Escape') setIsEditingModalAge(false);
                        }}
                        placeholder="Age"
                        className={`flex-1 min-w-0 px-2 py-1 rounded-lg text-xs font-bold border outline-none ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        id="user-profile-age-save-btn"
                        type="button"
                        onClick={handleSaveModalAge}
                        style={{ backgroundColor: primaryColor }}
                        className="p-1.5 rounded-lg text-white cursor-pointer"
                        title="Save Age"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingModalAge(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Gender Selection Card (Female or Male) */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none mb-0.5">
                      Gender
                    </span>
                    <span className="font-bold text-xs">{userGender}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800/60 p-0.5 rounded-lg border border-slate-700/60">
                    <button
                      id="user-profile-gender-female-btn"
                      type="button"
                      onClick={() => handleSelectModalGender('Female')}
                      style={userGender === 'Female' ? { backgroundColor: primaryColor } : undefined}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                        userGender === 'Female'
                          ? 'text-white shadow-2xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Female
                    </button>
                    <button
                      id="user-profile-gender-male-btn"
                      type="button"
                      onClick={() => handleSelectModalGender('Male')}
                      style={userGender === 'Male' ? { backgroundColor: primaryColor } : undefined}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                        userGender === 'Male'
                          ? 'text-white shadow-2xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Male
                    </button>
                  </div>
                </div>
              </div>

              {/* User Profile Wallpaper & Cover Upload Section */}
              <div
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon style={{ color: primaryColor }} className="w-4 h-4" />
                  <div>
                    <p className="text-xs font-bold">Profile Cover & User Wallpaper</p>
                    <p className="text-[10px] text-slate-400">
                      Upload custom cover photo or user profile page wallpaper
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => userCoverInputRef.current?.click()}
                    style={{ backgroundColor: primaryColor }}
                    className="px-3 py-1.5 rounded-xl text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Cover</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => userWallpaperInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Upload Wallpaper</span>
                  </button>
                </div>
              </div>

              {/* About Links & Social Networks (Editable) */}
              <div className={`p-3.5 rounded-xl border mt-3 space-y-2.5 ${isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      style={{ color: primaryColor }}
                      className="text-[11px] font-bold uppercase tracking-wider block"
                    >
                      About Links & Social Networks
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Click any link to visit, or click Edit / + Add Link to customize
                    </span>
                  </div>
                  <button
                    id="user-profile-add-about-link-btn"
                    type="button"
                    onClick={() => {
                      if (isEditingModalLink && editingModalLinkIndex === null) {
                        setIsEditingModalLink(false);
                      } else {
                        setEditingModalLinkIndex(null);
                        setModalLinkPlatform('website');
                        setModalLinkUrl('');
                        setModalLinkHandle('');
                        setIsEditingModalLink(true);
                      }
                    }}
                    style={{ backgroundColor: primaryColor }}
                    className="px-2.5 py-1 rounded-xl text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:brightness-110 shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isEditingModalLink && editingModalLinkIndex === null ? 'Cancel' : 'Add Link'}</span>
                  </button>
                </div>

                {isEditingModalLink && (
                  <div
                    className={`p-3 rounded-xl border space-y-2 ${
                      isDark ? 'bg-slate-950/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[11px] font-bold" style={{ color: primaryColor }}>
                      {editingModalLinkIndex !== null ? 'Edit About Link' : 'Add New About Link'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={modalLinkPlatform}
                        onChange={(e) => setModalLinkPlatform(e.target.value as SocialPlatform)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs border font-medium cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="website">Website / About Link</option>
                        <option value="twitter">X (Twitter)</option>
                        <option value="instagram">Instagram</option>
                        <option value="github">GitHub</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="youtube">YouTube</option>
                        <option value="tiktok">TikTok</option>
                        <option value="facebook">Facebook</option>
                      </select>

                      <input
                        id="user-profile-about-link-url-input"
                        type="text"
                        value={modalLinkUrl}
                        onChange={(e) => setModalLinkUrl(e.target.value)}
                        placeholder={getSocialPlatformInfo(modalLinkPlatform).placeholder}
                        className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
                        }`}
                      />

                      <input
                        id="user-profile-about-link-label-input"
                        type="text"
                        value={modalLinkHandle}
                        onChange={(e) => setModalLinkHandle(e.target.value)}
                        placeholder="Label / Handle (optional)"
                        className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingModalLink(false);
                          setEditingModalLinkIndex(null);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="user-profile-about-link-save-btn"
                        type="button"
                        onClick={handleSaveModalSocialLink}
                        disabled={!modalLinkUrl.trim()}
                        style={modalLinkUrl.trim() ? { backgroundColor: primaryColor } : undefined}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                          modalLinkUrl.trim()
                            ? 'text-white hover:brightness-110'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Save className="w-3 h-3" />
                        <span>{editingModalLinkIndex !== null ? 'Update Link' : 'Save Link'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <SocialLinksDisplay
                  links={modalSocialLinks}
                  isDark={isDark}
                  size="md"
                  onEdit={(item, idx) => {
                    setEditingModalLinkIndex(idx);
                    setModalLinkPlatform(item.platform);
                    setModalLinkUrl(item.url);
                    setModalLinkHandle(item.handle || '');
                    setIsEditingModalLink(true);
                  }}
                  onRemove={handleRemoveModalSocialLink}
                />
              </div>

              {/* Delete My Account Section in User Profile */}
              <div
                id="user-profile-modal-delete-account-section"
                className={`p-3.5 rounded-xl border mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-rose-500">Delete My Account</h4>
                    <p className="text-[10px] text-slate-400">
                      Permanently remove your user profile and account data from WeedChat
                    </p>
                  </div>
                </div>

                {!showDeleteAccountConfirm ? (
                  <button
                    id="user-profile-delete-my-account-btn"
                    type="button"
                    onClick={() => setShowDeleteAccountConfirm(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete My Account</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="user-profile-confirm-delete-account-btn"
                      type="button"
                      onClick={handleConfirmDeleteAccount}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold cursor-pointer shadow-xs"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteAccountConfirm(false)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Internal Friendship Modal when opened from UserProfileModal standalone */}
      {isInternalFriendshipOpen && (
        <FriendshipModal
          isOpen={isInternalFriendshipOpen}
          onClose={() => setIsInternalFriendshipOpen(false)}
          contact={contact as UserContact}
          messages={messages}
          onStartCall={onStartCall}
          onSendMessage={(text) => {
            if (onSendMessage) onSendMessage(text);
          }}
          theme={theme}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
};
