import React, { useState, useRef } from 'react';
import { StatusBar } from './StatusBar';
import { BottomNav } from './BottomNav';
import {
  Globe,
  Moon,
  Sun,
  ShieldCheck,
  Shield,
  Lock,
  Bell,
  ChevronRight,
  LogOut,
  Camera,
  Upload,
  Database,
  CheckCircle2,
  FileImage,
  Loader2,
  Edit2,
  Save,
  X,
  QrCode,
  Image as ImageIcon,
  Circle,
  Square,
  Plus,
  Share2,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Handshake,
  UserPlus,
  UserCheck,
  Clock,
  Eye,
  EyeOff,
  MapPin,
  Navigation,
  Mail,
  Phone,
  FileText,
  Trash2,
  AlertTriangle,
  User as UserIcon,
  Fingerprint,
  Radio,
} from 'lucide-react';
import QRCode from 'qrcode';
import { AVAILABLE_LANGUAGES, INITIAL_CONTACTS } from '../data/mockData';
import { ScreenView, ThemeMode, UserProfile, ChatMessage, ActiveMediaItem, SocialPlatform, SocialLinkItem, UserContact } from '../types';
import { FriendshipModal } from './FriendshipModal';
import { uploadUserAvatarInDb, saveUserProfileToDb, updateUserOnlinePrivacyInDb, deleteMyUserAccountFromDb } from '../lib/firebase';
import { getCleanAvatar, getInitialsAvatar, clearSavedUserAvatar, saveUserAvatarLocally } from '../lib/avatarHelper';
import {
  FriendInvitationRecord,
  canUserSeeAndAcceptInvitation,
  getInvitationForContact,
  saveInvitationForContact,
} from '../lib/friendInvitationAccess';
import {
  generateOtpAuthUri,
  ADMIN_2FA_DEFAULT_SECRET,
  ADMIN_2FA_DEFAULT_BACKUP_CODES,
  generateTotpCode,
  getRemainingSeconds,
} from '../lib/twoFactorAuth';
import { MediaPictureGalleryView } from './MediaPictureGalleryView';
import { SocialLinksDisplay, getSocialPlatformInfo } from './SocialLinksDisplay';
import { playDefaultAppNotificationBell } from '../lib/notificationSound';
import {
  getHideAdultNuditySetting,
  setHideAdultNuditySetting,
  getReportedMediaFiles,
} from '../lib/mediaModerationHelper';
import { FingerprintSetupModal } from './FingerprintSetupModal';
import {
  FingerprintRecord,
  getFingerprintRecord,
  setFingerprint2FAEnabled,
} from '../lib/fingerprintAuthHelper';

interface ProfileScreenProps {
  onNavigate: (screen: ScreenView) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  motherLanguage: string;
  onChangeMotherLanguage: (lang: string) => void;
  onLogout: () => void;
  currentUser: UserProfile;
  onUpdateCurrentUser: (user: UserProfile) => void;
  isAdminVerified?: boolean;
  onOpenAdminAuth?: () => void;
  onOpenQrScanner?: () => void;
  primaryColor?: string;
  messages?: ChatMessage[];
  onSelectMedia?: (media: ActiveMediaItem) => void;
  onToggleFavoriteMedia?: (messageId: string, isFavorite: boolean) => void;
  onToggleLikeMedia?: (messageId: string, isLiked: boolean) => void;
  onDeleteMessageMedia?: (messageId: string) => void;
  onEditMessageMediaTitle?: (messageId: string, newTitle: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigate,
  theme,
  onToggleTheme,
  motherLanguage,
  onChangeMotherLanguage,
  onLogout,
  currentUser,
  onUpdateCurrentUser,
  isAdminVerified = false,
  onOpenAdminAuth,
  onOpenQrScanner,
  primaryColor = '#7C3AED',
  messages = [],
  onSelectMedia,
  onToggleFavoriteMedia,
  onToggleLikeMedia,
  onDeleteMessageMedia,
  onEditMessageMediaTitle,
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileCoverInputRef = useRef<HTMLInputElement>(null);
  const profileWallpaperInputRef = useRef<HTMLInputElement>(null);
  const profileGroupCoverInputRef = useRef<HTMLInputElement>(null);
  const profileCustomizeInputRef = useRef<HTMLInputElement>(null);
  const [profileCustomizeTarget, setProfileCustomizeTarget] = useState<'wallpaper' | 'cover' | 'both'>('both');
  const [profileCustomizeFileName, setProfileCustomizeFileName] = useState<string>(() => {
    try {
      return localStorage.getItem('freedom_my_profile_customize_filename') || '';
    } catch {
      return '';
    }
  });

  const [profileCoverUrl, setProfileCoverUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('freedom_my_profile_cover') ||
        currentUser.profileCoverUrl ||
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000&auto=format&fit=crop&q=80'
      );
    } catch {
      return (
        currentUser.profileCoverUrl ||
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000&auto=format&fit=crop&q=80'
      );
    }
  });

  const [profileWallpaperUrl, setProfileWallpaperUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('freedom_my_profile_wallpaper') ||
        currentUser.profileWallpaperUrl ||
        ''
      );
    } catch {
      return currentUser.profileWallpaperUrl || '';
    }
  });

  const [adminGroupCoverUrl, setAdminGroupCoverUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('freedom_group_cover_group_global_builders') ||
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80'
      );
    } catch {
      return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80';
    }
  });

  const handleUploadProfileCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProfileCoverUrl(dataUrl);
      try {
        localStorage.setItem('freedom_my_profile_cover', dataUrl);
      } catch {}
      onUpdateCurrentUser({ ...currentUser, profileCoverUrl: dataUrl });
      setUploadStatusMsg('Uploaded new User Profile Cover!');
      setTimeout(() => setUploadStatusMsg(null), 3200);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadProfileWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProfileWallpaperUrl(dataUrl);
      try {
        localStorage.setItem('freedom_my_profile_wallpaper', dataUrl);
      } catch {}
      onUpdateCurrentUser({ ...currentUser, profileWallpaperUrl: dataUrl });
      setUploadStatusMsg('Uploaded custom Profile Page Wallpaper!');
      setTimeout(() => setUploadStatusMsg(null), 3200);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadAdminGroupCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAdminGroupCoverUrl(dataUrl);
      try {
        localStorage.setItem('freedom_group_cover_group_global_builders', dataUrl);
        localStorage.setItem('freedom_group_cover_group_global_team', dataUrl);
      } catch {}
      setUploadStatusMsg('Uploaded new Group Cover as Group Admin!');
      setTimeout(() => setUploadStatusMsg(null), 3200);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadProfileCustomizeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProfileCustomizeFileName(file.name);
      try {
        localStorage.setItem('freedom_my_profile_customize_filename', file.name);
      } catch {}

      if (profileCustomizeTarget === 'wallpaper' || profileCustomizeTarget === 'both') {
        setProfileWallpaperUrl(dataUrl);
        try {
          localStorage.setItem('freedom_my_profile_wallpaper', dataUrl);
        } catch {}
      }
      if (profileCustomizeTarget === 'cover' || profileCustomizeTarget === 'both') {
        setProfileCoverUrl(dataUrl);
        try {
          localStorage.setItem('freedom_my_profile_cover', dataUrl);
        } catch {}
      }

      onUpdateCurrentUser({
        ...currentUser,
        profileCoverUrl:
          profileCustomizeTarget === 'cover' || profileCustomizeTarget === 'both'
            ? dataUrl
            : currentUser.profileCoverUrl,
        profileWallpaperUrl:
          profileCustomizeTarget === 'wallpaper' || profileCustomizeTarget === 'both'
            ? dataUrl
            : currentUser.profileWallpaperUrl,
      });

      setUploadStatusMsg(`Profile Page Customized with "${file.name}"!`);
      setTimeout(() => setUploadStatusMsg(null), 3500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editUsername, setEditUsername] = useState(
    (currentUser.username || 'sajol_freedom').replace(/^@+/, '')
  );
  const [editBio, setEditBio] = useState(
    currentUser.bio || 'WeedChat Official Administration & User Support Desk'
  );
  const [editAge, setEditAge] = useState<string>(
    currentUser.age !== undefined && currentUser.age !== null ? String(currentUser.age) : ''
  );
  const [editGender, setEditGender] = useState<string>(currentUser.gender || '');
  const [editLocation, setEditLocation] = useState(currentUser.location || 'New York,NY');
  const [editEmail, setEditEmail] = useState(
    currentUser.email || 'MobilePhonesky987@gmail.com'
  );
  const [editPhoneNumber, setEditPhoneNumber] = useState(
    currentUser.phoneNumber || '+1 (555) 234-8901'
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isEditingInlineUsername, setIsEditingInlineUsername] = useState(false);
  const [isEditingInlineBio, setIsEditingInlineBio] = useState(false);
  const [isEditingInlinePhone, setIsEditingInlinePhone] = useState(false);
  const [hidePhoneNumberPublic, setHidePhoneNumberPublic] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(
        `freedom_user_hide_phone_public_${currentUser.id || 'admin_mobilephonesky'}`
      );
      if (saved === 'true') return true;
      if (saved === 'false') return false;
    } catch {}
    return Boolean(currentUser.hidePhoneNumberPublic);
  });
  const [hideAdultNudityMedia, setHideAdultNudityMedia] = useState<boolean>(() =>
    getHideAdultNuditySetting()
  );
  const [pendingMediaReportsCount, setPendingMediaReportsCount] = useState<number>(() =>
    getReportedMediaFiles().filter((r) => r.status === 'pending').length
  );
  const [fingerprintRecord, setFingerprintRecord] = useState<FingerprintRecord | null>(() =>
    getFingerprintRecord(currentUser.id)
  );
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState<boolean>(false);

  React.useEffect(() => {
    const syncAdultSetting = () => {
      setHideAdultNudityMedia(getHideAdultNuditySetting());
      setPendingMediaReportsCount(
        getReportedMediaFiles().filter((r) => r.status === 'pending').length
      );
    };
    const syncFingerprint = () => {
      setFingerprintRecord(getFingerprintRecord(currentUser.id));
    };
    window.addEventListener('freedom-media-moderation-updated', syncAdultSetting);
    window.addEventListener('freedom-fingerprint-updated', syncFingerprint);
    return () => {
      window.removeEventListener('freedom-media-moderation-updated', syncAdultSetting);
      window.removeEventListener('freedom-fingerprint-updated', syncFingerprint);
    };
  }, [currentUser.id]);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Social Links & About Links State
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [editingSocialIndex, setEditingSocialIndex] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('website');
  const [socialUrlInput, setSocialUrlInput] = useState('');
  const [socialHandleInput, setSocialHandleInput] = useState('');

  const defaultProfileLinks: SocialLinkItem[] = [
    {
      platform: 'twitter',
      url: `https://x.com/${currentUser.username || 'sajol_freedom'}`,
      handle: `@${currentUser.username || 'sajol_freedom'}`,
    },
    {
      platform: 'instagram',
      url: `https://instagram.com/${currentUser.username || 'sajol_freedom'}`,
      handle: `@${currentUser.username || 'sajol_freedom'}`,
    },
    {
      platform: 'github',
      url: 'https://github.com/freedom-talk',
      handle: 'freedom-talk',
    },
  ];

  const effectiveSocialLinks: SocialLinkItem[] =
    currentUser.socialLinks && currentUser.socialLinks.length > 0
      ? currentUser.socialLinks
      : defaultProfileLinks;

  // Friendship & Friend Invite State on User Profile Page
  const individualContacts = INITIAL_CONTACTS.filter(
    (c) => !c.isGroup && c.entityType !== 'group'
  );
  const [selectedInviteContactId, setSelectedInviteContactId] = useState<string>(
    individualContacts[0]?.id || '1'
  );
  // Active viewer account to verify strict invited-user-only access (not admin or other uninvited users)
  const [activeViewerId, setActiveViewerId] = useState<string>('sender');

  const [inviteStatusMap, setInviteStatusMap] = useState<
    Record<string, 'none' | 'pending' | 'accepted'>
  >(() => {
    const map: Record<string, 'none' | 'pending' | 'accepted'> = {};
    individualContacts.forEach((c) => {
      try {
        const rec = getInvitationForContact(c.id);
        if (rec) {
          map[c.id] = rec.status === 'declined' ? 'none' : rec.status;
          return;
        }
        const saved = localStorage.getItem(`freedom_friend_invite_${c.id}`) as
          | 'none'
          | 'pending'
          | 'accepted'
          | null;
        map[c.id] =
          saved === 'pending' || saved === 'accepted' ? saved : c.friendInviteStatus || 'none';
      } catch {
        map[c.id] = 'none';
      }
    });
    return map;
  });
  const [profileFriendshipModalContact, setProfileFriendshipModalContact] =
    useState<UserContact | null>(null);
  const [friendInviteFeedback, setFriendInviteFeedback] = useState<string | null>(null);

  const handleSetContactInviteStatus = (
    contactId: string,
    status: 'none' | 'pending' | 'accepted',
    toastMsg?: string
  ) => {
    const targetContact = individualContacts.find((c) => c.id === contactId);
    if (!targetContact) return;

    const existingRecord =
      getInvitationForContact(contactId) ||
      ({
        id: `invite_${contactId}`,
        senderId: currentUser.id || 'current_user',
        senderName: currentUser.name || 'You',
        senderAvatar: currentUser.avatar || '',
        invitedUserId: contactId,
        invitedUserName: targetContact.name,
        invitedUserAvatar: targetContact.avatar,
        status: 'pending',
        createdAt: new Date().toISOString(),
      } as FriendInvitationRecord);

    if (status === 'accepted') {
      const viewerRole =
        activeViewerId === 'admin'
          ? 'admin'
          : activeViewerId === 'sender'
          ? 'sender'
          : activeViewerId === contactId
          ? 'invited_user'
          : 'other_user';
      if (!canUserSeeAndAcceptInvitation(existingRecord, activeViewerId, viewerRole)) {
        setFriendInviteFeedback(
          `Access Denied: Only the invited user (${targetContact.name}) can see and accept this invitation — not Admin or other uninvited users.`
        );
        setTimeout(() => setFriendInviteFeedback(null), 3500);
        return;
      }
    }

    const updatedRecord: FriendInvitationRecord = {
      ...existingRecord,
      status,
      acceptedAt: status === 'accepted' ? new Date().toISOString() : undefined,
    };
    saveInvitationForContact(updatedRecord);

    setInviteStatusMap((prev) => ({ ...prev, [contactId]: status }));
    if (status === 'pending') {
      // Automatically switch viewer to the invited user so they can see their invitation notification and accept
      setActiveViewerId(contactId);
    }
    if (toastMsg) {
      setFriendInviteFeedback(toastMsg);
      setTimeout(() => setFriendInviteFeedback(null), 3000);
    }
    if (status === 'accepted' && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('freedom-friend-request-accepted', {
          detail: {
            contactId: targetContact.id,
            contactName: targetContact.name,
            contactAvatar: targetContact.avatar,
            nativeLanguage: targetContact.nativeLanguage || 'Spanish',
          },
        })
      );
    }
  };

  // 2FA modal states
  const [show2FaModal, setShow2FaModal] = useState(false);
  const [qr2FaUrl, setQr2FaUrl] = useState<string>('');
  const [liveTotpCode, setLiveTotpCode] = useState<string>('');
  const [totpCountdown, setTotpCountdown] = useState<number>(30);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  React.useEffect(() => {
    if (show2FaModal) {
      const secret = currentUser.twoFactorSecret || ADMIN_2FA_DEFAULT_SECRET;
      const uri = generateOtpAuthUri(currentUser.email || currentUser.name, secret);
      QRCode.toDataURL(uri, {
        width: 240,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).then(setQr2FaUrl);
    }
  }, [show2FaModal, currentUser]);

  React.useEffect(() => {
    if (!show2FaModal) return;
    const update = async () => {
      setTotpCountdown(getRemainingSeconds());
      const secret = currentUser.twoFactorSecret || ADMIN_2FA_DEFAULT_SECRET;
      const c = await generateTotpCode(secret);
      setLiveTotpCode(c);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [show2FaModal, currentUser]);

  const handleUpdateAvatarShape = async (shape: 'round' | 'squircle') => {
    const updatedUser: UserProfile = {
      ...currentUser,
      avatarShape: shape,
    };
    onUpdateCurrentUser(updatedUser);
    try {
      await saveUserProfileToDb({
        id: updatedUser.id,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        avatarShape: shape,
      });
      setUploadStatusMsg(`Avatar updated to ${shape === 'round' ? 'Round circle' : 'Squircle'}`);
      setTimeout(() => setUploadStatusMsg(null), 3000);
    } catch (err) {
      console.error('Error saving avatar shape:', err);
    }
  };

  const handleAddSocialLink = async () => {
    if (!socialUrlInput.trim()) return;
    const newItem: SocialLinkItem = {
      platform: selectedPlatform,
      url: socialUrlInput.trim(),
      handle: socialHandleInput.trim() || undefined,
    };
    const baseLinks = [...effectiveSocialLinks];
    const updatedLinks: SocialLinkItem[] =
      editingSocialIndex !== null
        ? baseLinks.map((item, idx) => (idx === editingSocialIndex ? newItem : item))
        : [...baseLinks, newItem];

    const updatedUser: UserProfile = {
      ...currentUser,
      socialLinks: updatedLinks,
    };
    onUpdateCurrentUser(updatedUser);
    setSocialUrlInput('');
    setSocialHandleInput('');
    setEditingSocialIndex(null);
    setShowAddSocial(false);
    try {
      localStorage.setItem(
        `freedom_user_links_${updatedUser.id || 'admin_mobilephonesky'}`,
        JSON.stringify(updatedLinks)
      );
    } catch {}
    try {
      await saveUserProfileToDb({
        id: updatedUser.id,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        socialLinks: updatedLinks,
      });
      setUploadStatusMsg(
        editingSocialIndex !== null
          ? `Updated ${selectedPlatform} About link!`
          : `Added ${selectedPlatform} About link!`
      );
      setTimeout(() => setUploadStatusMsg(null), 3000);
    } catch (err) {
      console.error('Error saving social links:', err);
    }
  };

  const handleRemoveSocialLink = async (platform: SocialPlatform, index?: number) => {
    const baseLinks = [...effectiveSocialLinks];
    const updatedLinks =
      typeof index === 'number'
        ? baseLinks.filter((_, idx) => idx !== index)
        : baseLinks.filter((l) => l.platform !== platform);
    const updatedUser: UserProfile = {
      ...currentUser,
      socialLinks: updatedLinks,
    };
    onUpdateCurrentUser(updatedUser);
    try {
      localStorage.setItem(
        `freedom_user_links_${updatedUser.id || 'admin_mobilephonesky'}`,
        JSON.stringify(updatedLinks)
      );
    } catch {}
    try {
      await saveUserProfileToDb({
        id: updatedUser.id,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        socialLinks: updatedLinks,
      });
      setUploadStatusMsg(`Removed ${platform} link`);
      setTimeout(() => setUploadStatusMsg(null), 2500);
    } catch (err) {
      console.error('Error removing social link:', err);
    }
  };

  // Handle targeting user files on device and automatically saving uploaded avatar
  const handleFileTarget = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadStatusMsg('Please select a valid image file (PNG, JPG, WebP, etc.).');
      setTimeout(() => setUploadStatusMsg(null), 3000);
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatusMsg(`Uploading & auto-saving avatar: ${file.name}...`);

      const result = await uploadUserAvatarInDb(
        currentUser.id || 'user_abdullah',
        file,
        currentUser.name || 'Abdullah'
      );

      saveUserAvatarLocally(
        currentUser.id || 'user_abdullah',
        result.avatarUrl,
        result.fileName,
        result.fileSize
      );

      const updatedUser: UserProfile = {
        ...currentUser,
        avatar: result.avatarUrl,
        avatarFileName: result.fileName,
        avatarFileSize: result.fileSize,
        avatarUpdatedAt: new Date().toISOString(),
      };

      onUpdateCurrentUser(updatedUser);
      setUploadStatusMsg(
        `✅ Automatically saved uploaded avatar "${result.fileName}" (${result.fileSize})`
      );

      setTimeout(() => {
        setUploadStatusMsg(null);
      }, 4500);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setUploadStatusMsg('Upload failed. Please try another image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileTarget(file);
    }
    // reset input so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileTarget(file);
    }
  };

  const handleSaveProfileEdits = async () => {
    const cleanUsername =
      editUsername.trim().replace(/^@+/, '').replace(/\s+/g, '_').toLowerCase() ||
      currentUser.username ||
      'sajol_freedom';
    const cleanLocation = editLocation.trim() || currentUser.location || 'New York,NY';
    const cleanEmail = editEmail.trim() || currentUser.email || 'MobilePhonesky987@gmail.com';
    const cleanPhone = editPhoneNumber.trim() || currentUser.phoneNumber || '+1 (555) 234-8901';
    const cleanBio = editBio.trim() || currentUser.bio || 'Freedom talk any person of your mother language';
    const cleanAge = editAge.trim();
    const cleanGender = editGender.trim();
    const updated: UserProfile = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      username: cleanUsername,
      bio: cleanBio,
      age: cleanAge,
      gender: cleanGender,
      location: cleanLocation,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      hidePhoneNumberPublic,
    };
    onUpdateCurrentUser(updated);
    setIsEditingProfile(false);
    setIsEditingInlineUsername(false);
    setIsEditingInlineBio(false);
    setIsEditingInlinePhone(false);
    const targetId = updated.id || 'admin_mobilephonesky';
    try {
      localStorage.setItem(`freedom_user_username_v1_${targetId}`, cleanUsername);
      localStorage.setItem(`freedom_user_location_${targetId}`, cleanLocation);
      localStorage.setItem(`freedom_user_email_${targetId}`, cleanEmail);
      localStorage.setItem(`freedom_user_phone_${targetId}`, cleanPhone);
      localStorage.setItem(
        `freedom_user_hide_phone_public_${targetId}`,
        String(hidePhoneNumberPublic)
      );
      localStorage.setItem(`freedom_user_bio_${targetId}`, cleanBio);
      localStorage.setItem(`freedom_user_bio_v1_${targetId}`, cleanBio);
      localStorage.setItem(`freedom_user_age_v1_${targetId}`, cleanAge);
      localStorage.setItem(`freedom_user_gender_v1_${targetId}`, cleanGender);
    } catch {}
    try {
      await saveUserProfileToDb({
        id: updated.id,
        name: updated.name,
        username: cleanUsername,
        avatar: updated.avatar,
        bio: cleanBio,
        age: cleanAge,
        gender: cleanGender,
        location: cleanLocation,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        hidePhoneNumberPublic,
        motherLanguage,
      });
      setUploadStatusMsg('Profile, @Username, About, Age, Gender, Email & Phone synced to database');
      setTimeout(() => setUploadStatusMsg(null), 3000);
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  };

  const handleToggleHidePhonePublic = async (nextHideValue?: boolean) => {
    const nextHide =
      typeof nextHideValue === 'boolean' ? nextHideValue : !hidePhoneNumberPublic;
    setHidePhoneNumberPublic(nextHide);
    const targetId = currentUser.id || 'admin_mobilephonesky';
    const updated: UserProfile = {
      ...currentUser,
      hidePhoneNumberPublic: nextHide,
    };
    onUpdateCurrentUser(updated);
    try {
      localStorage.setItem(`freedom_user_hide_phone_public_${targetId}`, String(nextHide));
    } catch {}
    try {
      await saveUserProfileToDb({
        id: updated.id,
        name: updated.name,
        avatar: updated.avatar,
        phoneNumber: updated.phoneNumber,
        hidePhoneNumberPublic: nextHide,
      });
    } catch {}
    setUploadStatusMsg(
      nextHide
        ? '🔒 Phone number is now hidden from public view!'
        : '🌐 Phone number is now visible on your public profile!'
    );
    setTimeout(() => setUploadStatusMsg(null), 3000);
  };

  const handleDeleteMyAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteMyUserAccountFromDb(currentUser.id || 'user_abdullah');
    } catch (err) {
      console.error('Error deleting user account:', err);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountConfirm(false);
      onLogout();
    }
  };

  const handleUseCurrentDeviceLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const fallbackLoc = 'New York,NY';
      setEditLocation(fallbackLoc);
      const updated = { ...currentUser, location: fallbackLoc };
      onUpdateCurrentUser(updated);
      saveUserProfileToDb({
        id: updated.id,
        name: updated.name,
        avatar: updated.avatar,
        location: fallbackLoc,
      }).catch(() => {});
      setUploadStatusMsg(`📍 Location set to ${fallbackLoc}`);
      setTimeout(() => setUploadStatusMsg(null), 3000);
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.state ||
            'New York';
          const stateOrCountry =
            data?.address?.state_code ||
            data?.address?.country_code?.toUpperCase() ||
            'NY';
          const resolved = `${city},${stateOrCountry}`;
          setEditLocation(resolved);
          const updated: UserProfile = { ...currentUser, location: resolved };
          onUpdateCurrentUser(updated);
          await saveUserProfileToDb({
            id: updated.id,
            name: updated.name,
            avatar: updated.avatar,
            location: resolved,
          });
          setUploadStatusMsg(`📍 Location updated to ${resolved}`);
        } catch {
          const fallback = 'New York,NY';
          setEditLocation(fallback);
          onUpdateCurrentUser({ ...currentUser, location: fallback });
          setUploadStatusMsg(`📍 Location set to ${fallback}`);
        } finally {
          setIsDetectingLocation(false);
          setTimeout(() => setUploadStatusMsg(null), 3000);
        }
      },
      () => {
        setIsDetectingLocation(false);
        const fallback = editLocation.trim() || 'New York,NY';
        setEditLocation(fallback);
        onUpdateCurrentUser({ ...currentUser, location: fallback });
        setUploadStatusMsg(`📍 Location saved as ${fallback}`);
        setTimeout(() => setUploadStatusMsg(null), 3000);
      },
      { timeout: 6000 }
    );
  };

  return (
    <div
      style={
        profileWallpaperUrl
          ? {
              backgroundImage: `linear-gradient(to bottom, ${
                isDark ? 'rgba(18, 22, 31, 0.84)' : 'rgba(255, 255, 255, 0.86)'
              }, ${
                isDark ? 'rgba(18, 22, 31, 0.93)' : 'rgba(255, 255, 255, 0.94)'
              }), url(${profileWallpaperUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-[#12161F] text-white' : 'bg-white text-slate-900'
      }`}
    >
      {/* Hidden File Input for Targeting User Local Files */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={profileCoverInputRef}
        id="my-profile-cover-file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadProfileCover}
      />
      <input
        ref={profileWallpaperInputRef}
        id="my-profile-wallpaper-file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadProfileWallpaper}
      />
      <input
        ref={profileCustomizeInputRef}
        id="profile-customize-settings-file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadProfileCustomizeFile}
      />

      {/* Top Header */}
      <div
        style={{ backgroundColor: primaryColor }}
        className="text-white pt-1 pb-4 px-5 rounded-b-[28px] shadow-sm z-10 transition-colors"
      >
        <StatusBar time="9:41" theme="dark" className="px-1 -mx-3" />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Profile</h1>
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
              <Database className="w-2.5 h-2.5 text-white/90" />
              Firestore DB
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="profile-header-admin-panel-btn"
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Open Admin Control Panel & Reported Media Moderation"
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>Admin Panel</span>
              {pendingMediaReportsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {pendingMediaReportsCount}
                </span>
              )}
            </button>
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* User Card with Profile Cover Banner, File Dropzone & Avatar Target */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl transition-all relative border overflow-hidden ${
            isDragging
              ? 'border-purple-500 bg-purple-500/10'
              : isDark
              ? 'bg-[#1A202C]/95 border-slate-800'
              : 'bg-slate-50/95 border-slate-200/70'
          }`}
        >
          {/* User Profile Cover Banner */}
          <div
            id="my-profile-cover-banner"
            style={{ backgroundColor: primaryColor }}
            className="relative h-28 sm:h-32 w-full overflow-hidden"
          >
            {profileCoverUrl && (
              <>
                <img
                  src={profileCoverUrl}
                  alt="User Profile Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
              </>
            )}

            <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/20 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-purple-300" />
                <span>Profile Cover</span>
              </span>
            </div>

            <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
              <button
                id="upload-my-profile-cover-btn"
                type="button"
                onClick={() => profileCoverInputRef.current?.click()}
                className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold backdrop-blur-md border border-white/20 flex items-center gap-1 cursor-pointer transition-all"
                title="Upload Profile Cover Image"
              >
                <Camera className="w-3 h-3 text-purple-300" />
                <span>Upload Cover</span>
              </button>

              <button
                id="upload-my-profile-wallpaper-btn"
                type="button"
                onClick={() => profileWallpaperInputRef.current?.click()}
                className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold backdrop-blur-md border border-white/20 flex items-center gap-1 cursor-pointer transition-all"
                title="Upload Profile Page Wallpaper"
              >
                <ImageIcon className="w-3 h-3 text-emerald-400" />
                <span>Upload Wallpaper</span>
              </button>

              {(profileCoverUrl || profileWallpaperUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileWallpaperUrl('');
                    try {
                      localStorage.removeItem('freedom_my_profile_wallpaper');
                    } catch {}
                    setUploadStatusMsg('Reset Profile Page Wallpaper to default theme.');
                    setTimeout(() => setUploadStatusMsg(null), 2500);
                  }}
                  className="px-2 py-1 rounded-full bg-rose-600/75 hover:bg-rose-600 text-white text-[10px] font-bold backdrop-blur-md cursor-pointer"
                  title="Reset Profile Page Wallpaper"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="p-4 pt-2">
          <div className="flex items-start gap-4 -mt-8 relative z-10">
            {/* Avatar with Camera Trigger & Target File Overlay */}
            <div className="relative group shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ borderColor: primaryColor, width: '100px', height: '100px' }}
                className={`relative w-[100px] h-[100px] overflow-hidden border-2 shadow-md cursor-pointer group-hover:opacity-90 transition-all ${
                  currentUser.avatarShape === 'squircle' ? 'rounded-2xl' : 'rounded-full'
                }`}
                title="Click to target user files and upload avatar"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 style={{ color: primaryColor }} className="w-6 h-6 animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold">Change</span>
                </div>
              </div>

              {/* Camera circular badge button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ backgroundColor: primaryColor }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full hover:brightness-110 active:scale-95 text-white shadow-sm flex items-center justify-center cursor-pointer border-2 border-white dark:border-[#1A202C] transition-transform"
                title="Target image file on device"
              >
                <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Profile Info or Edit form */}
            <div className="flex-1 min-w-0">
              {!isEditingProfile ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="font-extrabold text-base tracking-tight truncate">
                        {currentUser.name}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          currentUser.hideOnlineStatus
                            ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                            : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            currentUser.hideOnlineStatus ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'
                          }`}
                        />
                        <span>{currentUser.hideOnlineStatus ? 'Online Hidden' : 'Online'}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(currentUser.name);
                        setEditUsername((currentUser.username || 'sajol_freedom').replace(/^@+/, ''));
                        setEditBio(currentUser.bio || '');
                        setEditAge(
                          currentUser.age !== undefined && currentUser.age !== null
                            ? String(currentUser.age)
                            : ''
                        );
                        setEditGender(currentUser.gender || '');
                        setEditLocation(currentUser.location || 'New York,NY');
                        setEditEmail(currentUser.email || 'MobilePhonesky987@gmail.com');
                        setEditPhoneNumber(currentUser.phoneNumber || '+1 (555) 234-8901');
                        setIsEditingProfile(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                      title="Edit Profile, @Username, About, Age, Gender, Email & Phone"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* @Username with inline edit */}
                  {isEditingInlineUsername ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="relative flex-1 max-w-[200px]">
                        <span
                          style={{ color: primaryColor }}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-extrabold"
                        >
                          @
                        </span>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value.replace(/^@+/, ''))}
                          placeholder="username"
                          autoFocus
                          className="w-full pl-6 pr-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveProfileEdits}
                        style={{ backgroundColor: primaryColor }}
                        className="px-2.5 py-1 rounded-lg text-white text-[10px] font-bold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingInlineUsername(false)}
                        className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <p style={{ color: primaryColor }} className="text-xs font-semibold">
                        @{(currentUser.username || 'sajol_freedom').replace(/^@+/, '')}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditUsername((currentUser.username || 'sajol_freedom').replace(/^@+/, ''));
                          setIsEditingInlineUsername(true);
                        }}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer transition ${
                          isDark
                            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title="Edit @username"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>Edit @</span>
                      </button>
                      {currentUser.age && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          Age: {currentUser.age}
                        </span>
                      )}
                      {currentUser.gender && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            currentUser.gender === 'Female'
                              ? 'bg-pink-500/15 border-pink-500/40 text-pink-400'
                              : 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                          }`}
                        >
                          {currentUser.gender === 'Female' ? '♀ Female' : '♂ Male'}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-0.5 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span
                        style={{ backgroundColor: primaryColor }}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                      <span>{currentUser.statusText || (currentUser.hideOnlineStatus ? 'Offline' : 'Busy')}</span>
                    </p>
                    <span
                      id="my-profile-location-display"
                      className={`text-xs sm:text-sm font-medium tracking-tight ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      {currentUser.location || 'New York,NY'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(currentUser.name);
                        setEditBio(currentUser.bio || '');
                        setEditLocation(currentUser.location || 'New York,NY');
                        setEditEmail(currentUser.email || 'MobilePhonesky987@gmail.com');
                        setEditPhoneNumber(currentUser.phoneNumber || '+1 (555) 234-8901');
                        setIsEditingProfile(true);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border cursor-pointer hover:border-purple-500/60 transition-colors ${
                        isDark
                          ? 'bg-slate-800/70 border-slate-700 text-slate-200'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                      title="Click to edit Email Address"
                    >
                      <Mail style={{ color: primaryColor }} className="w-3 h-3 shrink-0" />
                      <span className="font-mono truncate max-w-[160px]">
                        {currentUser.email || 'MobilePhonesky987@gmail.com'}
                      </span>
                      <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                    </button>

                    {isEditingInlinePhone ? (
                      <div className="flex items-center gap-1.5 flex-wrap w-full pt-1">
                        <div className="flex items-center gap-1 flex-1 min-w-[170px]">
                          <Phone style={{ color: primaryColor }} className="w-3.5 h-3.5 shrink-0" />
                          <input
                            id="profile-header-inline-phone-input"
                            type="tel"
                            value={editPhoneNumber}
                            onChange={(e) => setEditPhoneNumber(e.target.value)}
                            placeholder="+1 (555) 234-8901"
                            autoFocus
                            className="flex-1 px-2.5 py-1 rounded-lg text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveProfileEdits}
                          style={{ backgroundColor: primaryColor }}
                          className="px-2.5 py-1 rounded-lg text-white text-[10px] font-bold cursor-pointer"
                        >
                          Save Phone
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleHidePhonePublic()}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                            hidePhoneNumberPublic
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                          }`}
                          title="Toggle whether your phone number is hidden from public"
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
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingInlinePhone(false)}
                          className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 flex-wrap">
                        <button
                          id="profile-header-edit-phone-chip"
                          type="button"
                          onClick={() => {
                            setEditPhoneNumber(currentUser.phoneNumber || '+1 (555) 234-8901');
                            setIsEditingInlinePhone(true);
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border cursor-pointer hover:border-purple-500/60 transition-colors ${
                            isDark
                              ? 'bg-slate-800/70 border-slate-700 text-slate-200'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                          title="Click to edit Phone Number on User Profile page"
                        >
                          <Phone style={{ color: primaryColor }} className="w-3 h-3 shrink-0" />
                          <span className="font-mono truncate">
                            {currentUser.phoneNumber || '+1 (555) 234-8901'}
                          </span>
                          <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                        </button>

                        <button
                          id="profile-header-toggle-hide-phone-public-btn"
                          type="button"
                          onClick={() => handleToggleHidePhonePublic()}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                            hidePhoneNumberPublic
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/25'
                          }`}
                          title={
                            hidePhoneNumberPublic
                              ? 'Phone number is hidden from public — click to make public'
                              : 'Phone number is public — click to hide from public'
                          }
                        >
                          {hidePhoneNumberPublic ? (
                            <>
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>Phone Hidden (Public)</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-2.5 h-2.5" />
                              <span>Hide Phone Public</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Inline Editable About Description */}
                  {isEditingInlineBio ? (
                    <div className="mt-1.5 space-y-1.5">
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={2}
                        maxLength={200}
                        placeholder="Write your About description..."
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500 resize-none"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleSaveProfileEdits}
                          style={{ backgroundColor: primaryColor }}
                          className="px-2.5 py-1 rounded-md text-white text-[10px] font-bold cursor-pointer"
                        >
                          Save About
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingInlineBio(false)}
                          className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-start justify-between gap-2 group/bio">
                      <p className="text-[11px] text-slate-400 line-clamp-2 flex-1">
                        "{currentUser.bio || 'Freedom talk any person of your mother language'}"
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditBio(currentUser.bio || 'Freedom talk any person of your mother language');
                          setIsEditingInlineBio(true);
                        }}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0 cursor-pointer transition ${
                          isDark
                            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title="Edit About description"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>Edit About</span>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <button
                      id="profile-auto-upload-avatar-btn"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ backgroundColor: primaryColor }}
                      className="px-3 py-1.5 rounded-xl text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-xs"
                      title="Upload profile avatar image from device (auto-saves immediately)"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload & Auto-Save Avatar</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500"
                  />
                  <div className="relative">
                    <span
                      style={{ color: primaryColor }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-extrabold"
                    >
                      @
                    </span>
                    <input
                      id="profile-inline-username-input"
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.replace(/^@+/, ''))}
                      placeholder="username"
                      className="w-full text-xs pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      id="profile-inline-age-input"
                      type="number"
                      min={13}
                      max={120}
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      placeholder="Age (e.g. 25)"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500"
                    />
                    <div className="grid grid-cols-2 gap-1">
                      {(['Female', 'Male'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setEditGender(editGender === g ? '' : g)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                            editGender === g
                              ? g === 'Female'
                                ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                                : 'bg-sky-500/20 border-sky-500 text-sky-400'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {g === 'Female' ? '♀ Female' : '♂ Male'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    id="profile-inline-email-input"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500 font-mono"
                  />
                  <div className="space-y-1.5">
                    <input
                      id="profile-inline-phone-input"
                      type="tel"
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      placeholder="Phone Number (e.g. +1 (555) 234-8901)"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500 font-mono"
                    />
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50">
                      <div className="flex items-center gap-1.5">
                        {hidePhoneNumberPublic ? (
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        <span className="text-[11px] font-semibold">
                          Hide phone number public
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHidePhoneNumberPublic((prev) => !prev)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition ${
                          hidePhoneNumberPublic
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500'
                        }`}
                      >
                        {hidePhoneNumberPublic ? 'Hidden Public' : 'Public Visible'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="About description / Bio"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500 resize-none"
                  />
                  <input
                    id="profile-inline-location-input"
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Location (e.g. New York,NY)"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-purple-500"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveProfileEdits}
                      style={{ backgroundColor: primaryColor }}
                      className="px-2.5 py-1 rounded-md text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:brightness-110 active:scale-95"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Avatar Shape Preference: Round (Circle) vs Squircle */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold">Avatar Shape</span>
              <span className="text-[10px] text-slate-400">
                ({(currentUser.avatarShape || 'round') === 'round' ? 'Round profile' : 'Squircle'})
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => handleUpdateAvatarShape('round')}
                style={(currentUser.avatarShape || 'round') === 'round' ? { backgroundColor: primaryColor } : undefined}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  (currentUser.avatarShape || 'round') === 'round'
                    ? 'text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
                title="Round circular profile picture"
              >
                <Circle className="w-3 h-3 fill-current" />
                <span>Round</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdateAvatarShape('squircle')}
                style={currentUser.avatarShape === 'squircle' ? { backgroundColor: primaryColor } : undefined}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  currentUser.avatarShape === 'squircle'
                    ? 'text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
                title="Smooth squircle profile picture"
              >
                <Square className="w-3 h-3" />
                <span>Squircle</span>
              </button>
            </div>
          </div>

          {/* Uploading status banner */}
          {uploadStatusMsg && (
            <div
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              className="mt-2 text-xs flex items-center gap-1.5 font-medium px-2.5 py-1.5 rounded-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{uploadStatusMsg}</span>
            </div>
          )}

          {/* Metadata of user file in database */}
          {currentUser.avatarFileName && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
              <FileImage style={{ color: primaryColor }} className="w-3 h-3 shrink-0" />
              <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                {currentUser.avatarFileName}
              </span>
              {currentUser.avatarFileSize && (
                <span className="text-slate-400">({currentUser.avatarFileSize})</span>
              )}
              <span style={{ color: primaryColor }} className="ml-auto font-bold">Stored in DB</span>
            </div>
          )}

          </div>
        </div>

        {/* Send "Friend Invite" Section */}
        <div
          className={`p-4 rounded-2xl border space-y-3.5 ${
            isDark ? 'bg-[#1A202C] border-slate-800' : 'bg-slate-50 border-slate-200/70'
          }`}
        >
          {friendInviteFeedback && (
            <div
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{friendInviteFeedback}</span>
            </div>
          )}

          {/* Select Contact & Send "Friend Invite" */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedInviteContactId}
              onChange={(e) => setSelectedInviteContactId(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {individualContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.nativeLanguage || 'English'})
                </option>
              ))}
            </select>

            <button
              id="profile-page-send-friend-invite-btn"
              type="button"
              onClick={() => {
                const target = individualContacts.find((c) => c.id === selectedInviteContactId);
                if (!target) return;
                handleSetContactInviteStatus(
                  target.id,
                  'pending',
                  `Sent "Friend Invite" to ${target.name}! Invited user can accept below.`
                );
              }}
              style={{ backgroundColor: primaryColor }}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Send Friend Invite</span>
            </button>
          </div>

          {/* Viewer Identity Access Control Selector (Enforces Invited-User-Only Visibility & Notifications) */}
          <div
            className={`p-3 rounded-xl border space-y-2 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Viewing Invitations & Notifications As:</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-500">
                Invited-User-Only Access
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveViewerId('sender')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeViewerId === 'sender'
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                You (Sender)
              </button>
              {individualContacts.map((c) => (
                <button
                  key={`viewer-${c.id}`}
                  type="button"
                  onClick={() => setActiveViewerId(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeViewerId === c.id
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{c.name.split(' ')[0]} (Invited User)</span>
                  {inviteStatusMap[c.id] === 'pending' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActiveViewerId('admin')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeViewerId === 'admin'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Admin (Blocked)
              </button>
              <button
                type="button"
                onClick={() => setActiveViewerId('other_user')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeViewerId === 'other_user'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Other Uninvited User (Blocked)
              </button>
            </div>
          </div>

          {/* Invited-User-Only Invitation Notification Banner */}
          {(() => {
            const invitedContact = individualContacts.find((c) => c.id === activeViewerId);
            if (!invitedContact) return null;
            const status = inviteStatusMap[invitedContact.id] || 'none';
            if (status !== 'pending') return null;
            const rec: FriendInvitationRecord = {
              id: `invite_${invitedContact.id}`,
              senderId: currentUser.id || 'current_user',
              senderName: currentUser.name || 'You',
              senderAvatar: currentUser.avatar || '',
              invitedUserId: invitedContact.id,
              invitedUserName: invitedContact.name,
              invitedUserAvatar: invitedContact.avatar,
              status: 'pending',
              createdAt: new Date().toISOString(),
            };
            const isAllowed = canUserSeeAndAcceptInvitation(
              rec,
              activeViewerId,
              'invited_user'
            );
            if (!isAllowed) return null;
            return (
              <div
                id="profile-invited-user-only-notification"
                className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${
                  isDark
                    ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold">
                      Private Invitation Notification for {invitedContact.name}
                    </p>
                    <p className="text-[10px] opacity-85 truncate">
                      Only you ({invitedContact.name}) can see this notification and accept the Friend Invite.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSetContactInviteStatus(
                      invitedContact.id,
                      'accepted',
                      `${invitedContact.name} accepted your Friend Invite! 🎉`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Accept Invite</span>
                </button>
              </div>
            );
          })()}

          {(activeViewerId === 'admin' || activeViewerId === 'other_user') && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-400'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>
                <strong>Invitation & Notification Hidden:</strong>{' '}
                {activeViewerId === 'admin' ? 'Admin' : 'Other uninvited users'} cannot see pending
                invitations, invitation notifications, or accept invitations sent to another user.
              </span>
            </div>
          )}

          {/* Invited Users List with "Accept" Option Exclusively for the Invited User */}
          <div className="space-y-2 pt-1">
            {individualContacts.map((contactItem) => {
              const status = inviteStatusMap[contactItem.id] || 'none';
              const rec: FriendInvitationRecord = {
                id: `invite_${contactItem.id}`,
                senderId: currentUser.id || 'current_user',
                senderName: currentUser.name || 'You',
                senderAvatar: currentUser.avatar || '',
                invitedUserId: contactItem.id,
                invitedUserName: contactItem.name,
                invitedUserAvatar: contactItem.avatar,
                status,
                createdAt: new Date().toISOString(),
              };
              const viewerRole =
                activeViewerId === 'admin'
                  ? 'admin'
                  : activeViewerId === 'sender'
                  ? 'sender'
                  : activeViewerId === contactItem.id
                  ? 'invited_user'
                  : 'other_user';
              const isViewerTheInvitedUser = canUserSeeAndAcceptInvitation(
                rec,
                activeViewerId,
                viewerRole
              );
              const isViewerSender = activeViewerId === 'sender';

              // Hide pending invitations from Admin or other uninvited users
              const canSeePendingState =
                status === 'pending' && (isViewerTheInvitedUser || isViewerSender);

              return (
                <div
                  key={contactItem.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    isDark
                      ? 'bg-slate-900/70 border-slate-800'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={contactItem.avatar}
                      alt={contactItem.name}
                      className="w-13 h-13 rounded-full object-cover shrink-0 border-2 border-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold truncate">{contactItem.name}</p>
                        {status === 'accepted' && (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-500 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                            <UserCheck className="w-2.5 h-2.5" />
                            <span>Friends</span>
                          </span>
                        )}
                        {canSeePendingState && (
                          <span className="text-[9px] bg-amber-500/15 text-amber-500 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                              {isViewerTheInvitedUser ? 'Invited (For You)' : 'Invite Sent'}
                            </span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {status === 'accepted'
                          ? 'Friend invite accepted by invited user'
                          : isViewerTheInvitedUser
                          ? `You (${contactItem.name.split(' ')[0]}) were invited • Tap Accept`
                          : isViewerSender && status === 'pending'
                          ? `Waiting for ${contactItem.name.split(' ')[0]} (only they can see & accept)`
                          : `${contactItem.nativeLanguage || 'English'} • Private contact`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {status === 'none' && isViewerSender && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSetContactInviteStatus(
                            contactItem.id,
                            'pending',
                            `Sent "Friend Invite" to ${contactItem.name}! Only ${contactItem.name} can see and accept it.`
                          )
                        }
                        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:brightness-110 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Friend Invite</span>
                      </button>
                    )}

                    {/* ONLY the invited user can see the invitation action and accept it */}
                    {status === 'pending' && isViewerTheInvitedUser && (
                      <>
                        <button
                          id={`accept-friend-invite-${contactItem.id}`}
                          type="button"
                          onClick={() =>
                            handleSetContactInviteStatus(
                              contactItem.id,
                              'accepted',
                              `${contactItem.name} accepted your Friend Invite! 🎉`
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                          title={`Accept Friend Invite as ${contactItem.name}`}
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Accept Invite</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSetContactInviteStatus(
                              contactItem.id,
                              'none',
                              `Friend invite declined by ${contactItem.name}.`
                            )
                          }
                          className="px-2 py-1.5 rounded-lg text-[10px] text-slate-400 hover:bg-slate-800 cursor-pointer"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {status === 'pending' && isViewerSender && (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                        Invited User Only
                      </span>
                    )}

                    {status === 'pending' && !isViewerTheInvitedUser && !isViewerSender && (
                      <span className="px-2 py-1 rounded-lg bg-slate-500/10 text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Private</span>
                      </span>
                    )}

                    {status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => setProfileFriendshipModalContact(contactItem)}
                        className="p-2 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center cursor-pointer"
                      >
                        <Handshake className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Social Networks & About Links Section */}
        <div
          id="profile-about-links-section"
          className={`p-4 rounded-2xl border space-y-3.5 ${
            isDark ? 'bg-[#1A202C] border-slate-800' : 'bg-slate-50 border-slate-200/70'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
              >
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold">About Links & Social Networks</h3>
                <p className="text-[10px] text-slate-400">
                  Add, edit or remove clickable About & Social links on your profile
                </p>
              </div>
            </div>

            <button
              id="profile-toggle-add-about-link-btn"
              type="button"
              onClick={() => {
                if (showAddSocial && editingSocialIndex === null) {
                  setShowAddSocial(false);
                } else {
                  setEditingSocialIndex(null);
                  setSelectedPlatform('website');
                  setSocialUrlInput('');
                  setSocialHandleInput('');
                  setShowAddSocial(true);
                }
              }}
              style={{ backgroundColor: primaryColor }}
              className="px-2.5 py-1.5 rounded-xl hover:brightness-110 active:scale-95 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddSocial && editingSocialIndex === null ? 'Cancel' : 'Add Link'}</span>
            </button>
          </div>

          {/* Add / Edit About Link Form */}
          {showAddSocial && (
            <div className={`p-3 rounded-xl border space-y-2.5 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div style={{ color: primaryColor }} className="text-xs font-bold">
                {editingSocialIndex !== null ? 'Edit About / Social Link' : 'Add New About / Social Link'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                    Select Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as SocialPlatform)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs border font-medium cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="website">Website / About Link</option>
                    <option value="twitter">X (formerly Twitter)</option>
                    <option value="instagram">Instagram</option>
                    <option value="github">GitHub</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                    Profile Handle or URL
                  </label>
                  <input
                    id="profile-social-url-input"
                    type="text"
                    value={socialUrlInput}
                    onChange={(e) => setSocialUrlInput(e.target.value)}
                    placeholder={getSocialPlatformInfo(selectedPlatform).placeholder}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                    Display Label (Optional)
                  </label>
                  <input
                    id="profile-social-handle-input"
                    type="text"
                    value={socialHandleInput}
                    onChange={(e) => setSocialHandleInput(e.target.value)}
                    placeholder="e.g. Portfolio or @handle"
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSocial(false);
                    setEditingSocialIndex(null);
                  }}
                  className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="profile-save-about-link-btn"
                  type="button"
                  onClick={handleAddSocialLink}
                  disabled={!socialUrlInput.trim()}
                  style={socialUrlInput.trim() ? { backgroundColor: primaryColor } : undefined}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    socialUrlInput.trim()
                      ? 'text-white shadow-xs hover:brightness-110 active:scale-95'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {editingSocialIndex !== null ? 'Update Link' : 'Save Link'}
                </button>
              </div>
            </div>
          )}

          {/* Social Links List with Icons + Edit & Remove */}
          <SocialLinksDisplay
            links={effectiveSocialLinks}
            isDark={isDark}
            size="md"
            onEdit={(item, idx) => {
              setEditingSocialIndex(idx);
              setSelectedPlatform(item.platform);
              setSocialUrlInput(item.url);
              setSocialHandleInput(item.handle || '');
              setShowAddSocial(true);
            }}
            onRemove={handleRemoveSocialLink}
          />
        </div>

        {/* Database Status Card */}
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between border ${
            isDark ? 'bg-[#1A202C] border-slate-800' : 'bg-slate-50 border-slate-200/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
            >
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold">Users App Database</h4>
                <span style={{ backgroundColor: primaryColor }} className="w-2 h-2 rounded-full animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">
                Cloud Firestore synced for profiles & avatars
              </p>
            </div>
          </div>
          <span
            style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          >
            Online
          </span>
        </div>

        {/* My Contact QR Code Card */}
        {onOpenQrScanner && (
          <div
            id="profile-my-qr-btn"
            onClick={onOpenQrScanner}
            className={`p-3.5 rounded-2xl flex items-center justify-between border cursor-pointer hover:border-purple-500/50 transition-all ${
              isDark ? 'bg-[#1A202C] border-slate-800' : 'bg-slate-50 border-slate-200/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">My Contact QR Code</h4>
                <p className="text-[11px] text-slate-400">
                  Display personal code or scan friends to add
                </p>
              </div>
            </div>
            <div style={{ color: primaryColor }} className="flex items-center gap-1.5 text-xs font-bold">
              <span>View</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* User Media Picture Gallery (Images, Videos, Documents) */}
        <div
          className={`p-4 rounded-2xl border space-y-3.5 ${
            isDark ? 'bg-[#1A202C] border-slate-800' : 'bg-slate-50 border-slate-200/70'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  My Media & Picture Gallery
                </h3>
                <p className="text-[11px] text-slate-400">
                  Shared photos, video clips & documents
                </p>
              </div>
            </div>
            <span
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor, borderColor: `${primaryColor}30` }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
            >
              Gallery
            </span>
          </div>

          {/* Embedded Gallery View with 'Images', 'Videos', 'Documents' Tab Switcher */}
          <MediaPictureGalleryView
            messages={messages}
            currentUserId={currentUser.id}
            theme={theme}
            primaryColor={primaryColor}
            onSelectMedia={onSelectMedia}
            onToggleFavoriteMedia={onToggleFavoriteMedia}
            onToggleLikeMedia={onToggleLikeMedia}
            onDeleteMessageMedia={onDeleteMessageMedia}
            onEditMessageMediaTitle={onEditMessageMediaTitle}
            showSearch={true}
            compact={false}
          />
        </div>

        {/* Mother Language Setting */}
        <div
          className={`p-4 rounded-2xl space-y-2 ${
            isDark ? 'bg-[#1A202C]' : 'bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">My Mother Language</h4>
                <p className="text-[11px] text-slate-400">
                  Incoming chats translate into this language
                </p>
              </div>
            </div>

            <select
              aria-label="Select Mother Language"
              value={motherLanguage}
              onChange={(e) => onChangeMotherLanguage(e.target.value)}
              style={{ color: primaryColor }}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg outline-none cursor-pointer border ${
                isDark
                  ? 'bg-[#222834] border-slate-700'
                  : 'bg-white border-slate-200'
              }`}
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name} ({lang.native})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User Location Setting in User Settings */}
        <div
          id="app-settings-location-section"
          className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#1A202C] border-slate-800' : 'bg-slate-50 border-slate-200/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">User Location</h4>
                <p className="text-[11px] text-slate-400">
                  Displayed on your user profile (e.g. New York,NY)
                </p>
              </div>
            </div>

            <button
              id="settings-use-gps-location-btn"
              type="button"
              onClick={handleUseCurrentDeviceLocation}
              disabled={isDetectingLocation}
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 hover:brightness-110 cursor-pointer transition-all"
            >
              {isDetectingLocation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>Use Location</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="settings-user-location-input"
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="Enter city & state (e.g. New York,NY)"
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500'
                  : 'bg-white border-slate-200 text-slate-900 focus:border-purple-500'
              }`}
            />
            <button
              id="settings-save-user-location-btn"
              type="button"
              onClick={async () => {
                const cleanLoc = editLocation.trim() || 'New York,NY';
                setEditLocation(cleanLoc);
                const updated: UserProfile = {
                  ...currentUser,
                  location: cleanLoc,
                };
                onUpdateCurrentUser(updated);
                try {
                  localStorage.setItem(
                    `freedom_user_location_${updated.id || 'user_abdullah'}`,
                    cleanLoc
                  );
                } catch {}
                try {
                  await saveUserProfileToDb({
                    id: updated.id,
                    name: updated.name,
                    avatar: updated.avatar,
                    location: cleanLoc,
                  });
                } catch {}
                setUploadStatusMsg(`📍 Location updated to "${cleanLoc}"`);
                setTimeout(() => setUploadStatusMsg(null), 2800);
              }}
              style={{ backgroundColor: primaryColor }}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Location</span>
            </button>
          </div>
        </div>

        {/* User @Username, About, Age, Gender, Email & Phone Number Section in User Settings */}
        <div
          id="app-settings-email-phone-about-section"
          className={`p-4 rounded-2xl border space-y-3.5 ${
            isDark ? 'bg-[#1A202C] border-slate-800' : 'bg-slate-50 border-slate-200/70'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">@Username, About, Age, Gender, Email & Phone</h4>
                <p className="text-[11px] text-slate-400">
                  Edit your @username, about description, age, gender (Female or Male), email & phone
                </p>
              </div>
            </div>
            <span
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
            >
              Editable
            </span>
          </div>

          {/* @Username Input Row */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserIcon style={{ color: primaryColor }} className="w-3 h-3" />
              <span>Username (with @)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span
                  style={{ color: primaryColor }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold"
                >
                  @
                </span>
                <input
                  id="settings-user-username-input"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.replace(/^@+/, ''))}
                  placeholder="username"
                  className={`w-full pl-7 pr-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-purple-500'
                  }`}
                />
              </div>
              <button
                id="settings-save-user-username-btn"
                type="button"
                onClick={async () => {
                  const cleanUser =
                    editUsername.trim().replace(/^@+/, '').replace(/\s+/g, '_').toLowerCase() ||
                    'sajol_freedom';
                  setEditUsername(cleanUser);
                  const updated: UserProfile = {
                    ...currentUser,
                    username: cleanUser,
                  };
                  onUpdateCurrentUser(updated);
                  try {
                    localStorage.setItem(
                      `freedom_user_username_v1_${updated.id || 'admin_mobilephonesky'}`,
                      cleanUser
                    );
                  } catch {}
                  try {
                    await saveUserProfileToDb({
                      id: updated.id,
                      name: updated.name,
                      username: cleanUser,
                      avatar: updated.avatar,
                    });
                  } catch {}
                  setUploadStatusMsg(`✅ Username updated to "@${cleanUser}"`);
                  setTimeout(() => setUploadStatusMsg(null), 2800);
                }}
                style={{ backgroundColor: primaryColor }}
                className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save @Username</span>
              </button>
            </div>
          </div>

          {/* Age & Gender Selection (Female or Male) Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>Age</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="settings-user-age-input"
                  type="number"
                  min={13}
                  max={120}
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  placeholder="Age (e.g. 25)"
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-purple-500'
                  }`}
                />
                <button
                  id="settings-save-user-age-btn"
                  type="button"
                  onClick={async () => {
                    const cleanAge = editAge.trim();
                    setEditAge(cleanAge);
                    const updated: UserProfile = {
                      ...currentUser,
                      age: cleanAge,
                    };
                    onUpdateCurrentUser(updated);
                    try {
                      localStorage.setItem(
                        `freedom_user_age_v1_${updated.id || 'admin_mobilephonesky'}`,
                        cleanAge
                      );
                    } catch {}
                    try {
                      await saveUserProfileToDb({
                        id: updated.id,
                        name: updated.name,
                        avatar: updated.avatar,
                        age: cleanAge,
                      });
                    } catch {}
                    setUploadStatusMsg(`🎂 Age updated to "${cleanAge || 'Not set'}"`);
                    setTimeout(() => setUploadStatusMsg(null), 2800);
                  }}
                  style={{ backgroundColor: primaryColor }}
                  className="px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1 cursor-pointer hover:brightness-110 active:scale-95 transition-all shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Age</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>Gender Selection (Female or Male)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Female', 'Male'] as const).map((option) => {
                  const isSelected = (currentUser.gender || editGender) === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={async () => {
                        const nextGender = isSelected ? '' : option;
                        setEditGender(nextGender);
                        const updated: UserProfile = {
                          ...currentUser,
                          gender: nextGender,
                        };
                        onUpdateCurrentUser(updated);
                        try {
                          localStorage.setItem(
                            `freedom_user_gender_v1_${updated.id || 'admin_mobilephonesky'}`,
                            nextGender
                          );
                        } catch {}
                        try {
                          await saveUserProfileToDb({
                            id: updated.id,
                            name: updated.name,
                            avatar: updated.avatar,
                            gender: nextGender,
                          });
                        } catch {}
                        setUploadStatusMsg(
                          nextGender
                            ? `👤 Gender set to "${nextGender}"`
                            : '👤 Gender selection cleared'
                        );
                        setTimeout(() => setUploadStatusMsg(null), 2800);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? option === 'Female'
                            ? 'bg-pink-500/20 border-pink-500 text-pink-400 shadow-xs'
                            : 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-xs'
                          : isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{option === 'Female' ? '♀' : '♂'}</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Email Address Input Row */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail style={{ color: primaryColor }} className="w-3 h-3" />
              <span>Email Address</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="settings-user-email-input"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Enter email address"
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-purple-500'
                }`}
              />
              <button
                id="settings-save-user-email-btn"
                type="button"
                onClick={async () => {
                  const cleanMail = editEmail.trim() || 'MobilePhonesky987@gmail.com';
                  setEditEmail(cleanMail);
                  const updated: UserProfile = {
                    ...currentUser,
                    email: cleanMail,
                  };
                  onUpdateCurrentUser(updated);
                  try {
                    localStorage.setItem(
                      `freedom_user_email_${updated.id || 'admin_mobilephonesky'}`,
                      cleanMail
                    );
                  } catch {}
                  try {
                    await saveUserProfileToDb({
                      id: updated.id,
                      name: updated.name,
                      avatar: updated.avatar,
                      email: cleanMail,
                    });
                  } catch {}
                  setUploadStatusMsg(`✉️ Email updated to "${cleanMail}"`);
                  setTimeout(() => setUploadStatusMsg(null), 2800);
                }}
                style={{ backgroundColor: primaryColor }}
                className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Email</span>
              </button>
            </div>
          </div>

          {/* Phone Number Input Row + Option to Hide Phone Number Public */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Phone style={{ color: primaryColor }} className="w-3 h-3" />
                <span>Phone Number</span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  hidePhoneNumberPublic
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                }`}
              >
                {hidePhoneNumberPublic ? (
                  <>
                    <EyeOff className="w-2.5 h-2.5" />
                    <span>Hidden from Public</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-2.5 h-2.5" />
                    <span>Visible to Public</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="settings-user-phone-input"
                type="tel"
                value={editPhoneNumber}
                onChange={(e) => setEditPhoneNumber(e.target.value)}
                placeholder="Enter phone number (e.g. +1 (555) 234-8901)"
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-purple-500'
                }`}
              />
              <button
                id="settings-save-user-phone-btn"
                type="button"
                onClick={async () => {
                  const cleanPhone = editPhoneNumber.trim() || '+1 (555) 234-8901';
                  setEditPhoneNumber(cleanPhone);
                  const updated: UserProfile = {
                    ...currentUser,
                    phoneNumber: cleanPhone,
                    hidePhoneNumberPublic,
                  };
                  onUpdateCurrentUser(updated);
                  try {
                    localStorage.setItem(
                      `freedom_user_phone_${updated.id || 'admin_mobilephonesky'}`,
                      cleanPhone
                    );
                  } catch {}
                  try {
                    await saveUserProfileToDb({
                      id: updated.id,
                      name: updated.name,
                      avatar: updated.avatar,
                      phoneNumber: cleanPhone,
                      hidePhoneNumberPublic,
                    });
                  } catch {}
                  setUploadStatusMsg(`📞 Phone number updated to "${cleanPhone}"`);
                  setTimeout(() => setUploadStatusMsg(null), 2800);
                }}
                style={{ backgroundColor: primaryColor }}
                className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Phone</span>
              </button>
            </div>

            {/* Option to let user decide to hide Phone Number Public */}
            <div
              id="settings-phone-public-visibility-box"
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 flex-wrap ${
                isDark
                  ? 'bg-slate-900/70 border-slate-800'
                  : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {hidePhoneNumberPublic ? (
                  <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-xs font-bold block">
                    Hide Phone Number Public
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {hidePhoneNumberPublic
                      ? 'Your phone number is hidden from public visitors on your profile.'
                      : 'Your phone number is currently visible on your public profile.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="phone-visibility-option-public-btn"
                  type="button"
                  onClick={() => handleToggleHidePhonePublic(false)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                    !hidePhoneNumberPublic
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Show Public</span>
                </button>
                <button
                  id="phone-visibility-option-hide-btn"
                  type="button"
                  onClick={() => handleToggleHidePhonePublic(true)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                    hidePhoneNumberPublic
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Hide Public</span>
                </button>
              </div>
            </div>
          </div>

          {/* About / Biography Input Row */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText style={{ color: primaryColor }} className="w-3 h-3" />
              <span>About & Biography</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="settings-user-about-input"
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Write about yourself..."
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-purple-500'
                }`}
              />
              <button
                id="settings-save-user-about-btn"
                type="button"
                onClick={async () => {
                  const cleanAbout = editBio.trim() || 'WeedChat Official Administration & User Support Desk';
                  setEditBio(cleanAbout);
                  const updated: UserProfile = {
                    ...currentUser,
                    bio: cleanAbout,
                  };
                  onUpdateCurrentUser(updated);
                  try {
                    localStorage.setItem(
                      `freedom_user_bio_${updated.id || 'admin_mobilephonesky'}`,
                      cleanAbout
                    );
                  } catch {}
                  try {
                    await saveUserProfileToDb({
                      id: updated.id,
                      name: updated.name,
                      avatar: updated.avatar,
                      bio: cleanAbout,
                    });
                  } catch {}
                  setUploadStatusMsg(`📝 About & Biography updated!`);
                  setTimeout(() => setUploadStatusMsg(null), 2800);
                }}
                style={{ backgroundColor: primaryColor }}
                className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save About</span>
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Section in App Settings */}
        <div
          id="app-settings-privacy-section"
          className={`p-4 rounded-2xl border space-y-3.5 ${
            isDark ? 'bg-[#1A202C] border-slate-800' : 'bg-slate-50 border-slate-200/70'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
              >
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">Privacy</h3>
                <p className="text-[10px] text-slate-400">
                  Manage your online presence visibility & Firebase profile privacy
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                currentUser.hideOnlineStatus
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              }`}
            >
              {currentUser.hideOnlineStatus ? 'Status Hidden' : 'Status Visible'}
            </span>
          </div>

          {/* Hide Online Status Toggle Row */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
              isDark
                ? 'bg-slate-900/75 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  currentUser.hideOnlineStatus
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-500'
                }`}
              >
                {currentUser.hideOnlineStatus ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold">Hide online status</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 font-bold">
                    Firebase Synced
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {currentUser.hideOnlineStatus
                    ? 'Your online indicator is hidden from contacts and groups in Firebase.'
                    : 'Contacts and group members can see when you are active online.'}
                </p>
              </div>
            </div>

            <button
              id="privacy-hide-online-status-toggle"
              type="button"
              role="switch"
              aria-checked={Boolean(currentUser.hideOnlineStatus)}
              aria-label="Hide online status"
              onClick={async () => {
                const nextHide = !Boolean(currentUser.hideOnlineStatus);
                const updatedProfile: UserProfile = {
                  ...currentUser,
                  hideOnlineStatus: nextHide,
                  isOnline: !nextHide,
                  status: nextHide ? 'offline' : 'active',
                  statusText: nextHide ? 'Online status hidden' : 'Online',
                };
                onUpdateCurrentUser(updatedProfile);
                setUploadStatusMsg(
                  nextHide
                    ? '🔒 Privacy updated: Online status hidden in Firebase!'
                    : '🟢 Privacy updated: Online status visible in Firebase!'
                );
                await updateUserOnlinePrivacyInDb(
                  currentUser.id || 'user_abdullah',
                  nextHide,
                  currentUser.name,
                  currentUser.avatar
                );
                setTimeout(() => setUploadStatusMsg(null), 3200);
              }}
              style={
                currentUser.hideOnlineStatus
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                currentUser.hideOnlineStatus
                  ? ''
                  : isDark
                  ? 'bg-slate-700'
                  : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  currentUser.hideOnlineStatus ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Hide Phone Number Public Toggle Row */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
              isDark
                ? 'bg-slate-900/75 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  hidePhoneNumberPublic
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-500'
                }`}
              >
                {hidePhoneNumberPublic ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold">Hide phone number public</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 font-bold">
                    Public Privacy
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {hidePhoneNumberPublic
                    ? 'Your phone number is hidden from public visitors on your user profile.'
                    : 'Your phone number is visible to users visiting your public profile.'}
                </p>
              </div>
            </div>

            <button
              id="privacy-hide-phone-public-toggle"
              type="button"
              role="switch"
              aria-checked={Boolean(hidePhoneNumberPublic)}
              aria-label="Hide phone number public"
              onClick={() => handleToggleHidePhonePublic()}
              style={
                hidePhoneNumberPublic
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hidePhoneNumberPublic
                  ? ''
                  : isDark
                  ? 'bg-slate-700'
                  : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  hidePhoneNumberPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Hide Adult Media Files with Nudity Toggle Row */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
              isDark
                ? 'bg-slate-900/75 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  hideAdultNudityMedia
                    ? 'bg-rose-500/15 text-rose-500'
                    : 'bg-slate-500/15 text-slate-400'
                }`}
              >
                {hideAdultNudityMedia ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold">
                    Hide adult media files with nudity
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 font-bold">
                    18+ Safe Filter
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {hideAdultNudityMedia
                    ? 'Adult photos and videos with nudity are automatically hidden or blurred in your gallery.'
                    : 'Adult and nudity media filter is currently turned off.'}
                </p>
              </div>
            </div>

            <button
              id="privacy-hide-adult-nudity-media-toggle"
              type="button"
              role="switch"
              aria-checked={Boolean(hideAdultNudityMedia)}
              aria-label="Hide adult media files with nudity"
              onClick={() => {
                const nextVal = !hideAdultNudityMedia;
                setHideAdultNudityMedia(nextVal);
                setHideAdultNuditySetting(nextVal);
                setUploadStatusMsg(
                  nextVal
                    ? '🔞 Safe Filter Enabled: Adult media files with nudity are now hidden!'
                    : '👁️ Safe Filter Disabled: Adult media files with nudity are now visible.'
                );
                setTimeout(() => setUploadStatusMsg(null), 3000);
              }}
              style={
                hideAdultNudityMedia
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hideAdultNudityMedia
                  ? ''
                  : isDark
                  ? 'bg-slate-700'
                  : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  hideAdultNudityMedia ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Quick Admin Moderation & Reported Media Panel Access Card */}
          <div
            onClick={() => onNavigate('admin')}
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              isDark
                ? 'bg-slate-900/75 border-amber-500/30 hover:border-amber-500/60'
                : 'bg-amber-50/50 border-amber-200 hover:border-amber-400 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold">
                    Admin Panel • Reported Media Moderation
                  </span>
                  {pendingMediaReportsCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black">
                      {pendingMediaReportsCount} Pending
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Review reported gallery photos & videos and remove forbidden platform content.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
          </div>

          {/* Live Podcast Studio & Audience Chat Shortcut Card */}
          <div
            id="profile-open-live-podcast-card"
            onClick={() => onNavigate('podcast')}
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              isDark
                ? 'bg-slate-900/75 border-rose-500/30 hover:border-rose-500/60'
                : 'bg-rose-50/50 border-rose-200 hover:border-rose-400 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold">
                    Live Podcasts • Create or Join Live
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Host or join a live podcast, chat with the audience, and toggle Mic ON/OFF.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-500 shrink-0" />
          </div>
        </div>

        {/* Appearance & Preferences / Profile Page Settings */}
        <div
          id="profile-page-settings-section"
          className={`p-4 rounded-2xl space-y-3.5 ${
            isDark ? 'bg-[#1A202C]' : 'bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Profile Page Settings & Preferences
            </h3>
            <span
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            >
              Profile Customize
            </span>
          </div>

          {/* Profile Customize Setting Card with Camera Icon targeting user files */}
          <div
            id="profile-settings-customize-card"
            className={`p-3.5 rounded-2xl border space-y-3 ${
              isDark
                ? 'bg-slate-900/75 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-2xs'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  onClick={() => profileCustomizeInputRef.current?.click()}
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform border border-purple-500/30"
                  title="Target user files to upload custom profile image"
                >
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-extrabold">Profile Customize</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-500 font-bold">
                      Target User Files
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Customize your profile page with an image uploaded from your device files
                  </p>
                </div>
              </div>

              {/* Upload Option with Camera Icon targeting user files */}
              <button
                id="profile-settings-customize-camera-upload-btn"
                type="button"
                onClick={() => profileCustomizeInputRef.current?.click()}
                style={{ backgroundColor: primaryColor }}
                className="px-3 py-2 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-sm"
                title="Upload image from user files to customize profile page"
              >
                <Camera className="w-4 h-4 stroke-[2.3]" />
                <span>Upload Image</span>
              </button>
            </div>

            {/* Target Mode Selector: Wallpaper & Cover / Wallpaper Only / Cover Only */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Apply Uploaded Image To:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setProfileCustomizeTarget('both')}
                  style={profileCustomizeTarget === 'both' ? { backgroundColor: primaryColor } : undefined}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    profileCustomizeTarget === 'both'
                      ? 'text-white shadow-2xs'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Page & Cover
                </button>
                <button
                  type="button"
                  onClick={() => setProfileCustomizeTarget('wallpaper')}
                  style={profileCustomizeTarget === 'wallpaper' ? { backgroundColor: primaryColor } : undefined}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    profileCustomizeTarget === 'wallpaper'
                      ? 'text-white shadow-2xs'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Page Wallpaper
                </button>
                <button
                  type="button"
                  onClick={() => setProfileCustomizeTarget('cover')}
                  style={profileCustomizeTarget === 'cover' ? { backgroundColor: primaryColor } : undefined}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    profileCustomizeTarget === 'cover'
                      ? 'text-white shadow-2xs'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Profile Cover
                </button>
              </div>
            </div>

            {/* Live Preview & Quick Camera File Target Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                onClick={() => {
                  setProfileCustomizeTarget('wallpaper');
                  profileWallpaperInputRef.current?.click();
                }}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  isDark
                    ? 'bg-slate-950/70 border-slate-800 hover:border-purple-500/50'
                    : 'bg-slate-50 border-slate-200 hover:border-purple-400'
                }`}
                title="Target user files for Profile Page Wallpaper"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {profileWallpaperUrl ? (
                    <img
                      src={profileWallpaperUrl}
                      alt="Profile Wallpaper Preview"
                      className="w-9 h-9 rounded-lg object-cover border border-emerald-500/50 shrink-0"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">Profile Page Wallpaper</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {profileCustomizeFileName || (profileWallpaperUrl ? 'Custom image active' : 'Tap camera to upload file')}
                    </p>
                  </div>
                </div>
                <span
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  className="p-2 rounded-lg shrink-0 flex items-center gap-1 text-[10px] font-bold"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </span>
              </div>

              <div
                onClick={() => {
                  setProfileCustomizeTarget('cover');
                  profileCoverInputRef.current?.click();
                }}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  isDark
                    ? 'bg-slate-950/70 border-slate-800 hover:border-purple-500/50'
                    : 'bg-slate-50 border-slate-200 hover:border-purple-400'
                }`}
                title="Target user files for Profile Cover Banner"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {profileCoverUrl ? (
                    <img
                      src={profileCoverUrl}
                      alt="Profile Cover Preview"
                      className="w-9 h-9 rounded-lg object-cover border border-purple-500/50 shrink-0"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    >
                      <Camera className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">Profile Cover Banner</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {profileCoverUrl ? 'Custom cover active' : 'Tap camera to upload file'}
                    </p>
                  </div>
                </div>
                <span
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  className="p-2 rounded-lg shrink-0 flex items-center gap-1 text-[10px] font-bold"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </span>
              </div>
            </div>
          </div>

          <div
            onClick={onToggleTheme}
            className="flex items-center justify-between cursor-pointer py-1"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold">App Appearance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 capitalize">{theme} Mode</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">End-to-End Encryption</span>
            </div>
            <span
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            >
              Active
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block">Official Notification Bell Ringtone</span>
                <span className="text-[10px] text-emerald-500 font-semibold block truncate">
                  WeedChat Official Bell Ringtone • Friend Requests & Welcome
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="profile-test-official-bell-ringtone-btn"
                type="button"
                onClick={() => {
                  playDefaultAppNotificationBell();
                  setUploadStatusMsg('🔔 Playing WeedChat Official Notification Bell Ringtone');
                  setTimeout(() => setUploadStatusMsg(null), 2600);
                }}
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                className="px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                title="Test Official App Notification Bell Ringtone"
              >
                <Bell className="w-3 h-3" />
                <span>Ring Bell</span>
              </button>
              <span className="text-[11px] font-bold text-emerald-500">Official</span>
            </div>
          </div>

          {/* Two-Factor Authentication (2FA) Security Row */}
          <div
            id="profile-2fa-setting-row"
            onClick={() => setShow2FaModal(true)}
            className="flex items-center justify-between py-1 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">Two-Factor Authentication (2FA)</span>
                <span className="text-[10px] text-slate-400">Google Authenticator / TOTP</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor, borderColor: `${primaryColor}30` }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
              >
                Active
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Fingerprint 2FA / MFA Biometric Authentication Row (Set Your Fingerprint - Light_18.webp) */}
          <div
            id="profile-fingerprint-2fa-row"
            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
              isDark
                ? 'bg-slate-900/80 border-[#FF5468]/30'
                : 'bg-[#FDECEF]/55 border-[#FF5468]/30'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#FF5468] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Fingerprint className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold">
                    Fingerprint 2FA Authentication
                  </span>
                  {fingerprintRecord?.enabled && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 font-black">
                      Recorded ✓
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  {fingerprintRecord
                    ? `${fingerprintRecord.fingerLabel} • ${fingerprintRecord.ridgeHash}`
                    : 'Record your fingerprint to use as 2FA / MFA authentication'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {fingerprintRecord && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = setFingerprint2FAEnabled(!fingerprintRecord.enabled);
                    setFingerprintRecord(updated);
                    setUploadStatusMsg(
                      updated?.enabled
                        ? '🔒 Fingerprint 2FA Authentication Enabled!'
                        : '🔓 Fingerprint 2FA Authentication Paused.'
                    );
                    setTimeout(() => setUploadStatusMsg(null), 2600);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                    fingerprintRecord.enabled
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {fingerprintRecord.enabled ? '2FA ON' : '2FA OFF'}
                </button>
              )}

              <button
                id="profile-open-set-fingerprint-btn"
                type="button"
                onClick={() => setIsFingerprintModalOpen(true)}
                className="px-3 py-1.5 rounded-full bg-[#FF5468] hover:bg-[#F24458] text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer active:scale-95"
              >
                {fingerprintRecord ? 'Record Again' : 'Set Fingerprint'}
              </button>
            </div>
          </div>
        </div>

        {/* Log Out */}
        <button
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-xl text-rose-500 hover:bg-rose-500/10 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Account / Sign Out</span>
        </button>

        {/* Delete My Account */}
        <div
          id="profile-delete-my-account-section"
          className={`p-4 rounded-2xl border transition-colors ${
            isDark
              ? 'bg-red-950/20 border-red-900/40'
              : 'bg-red-50/70 border-red-200/80'
          }`}
        >
          {!showDeleteAccountConfirm ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  Delete My Account
                </h4>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Permanently delete your user profile and account from WeedChat.
                </p>
              </div>
              <button
                id="profile-delete-my-account-btn"
                type="button"
                onClick={() => {
                  setDeleteConfirmText('');
                  setShowDeleteAccountConfirm(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete My Account</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    Confirm Account Deletion
                  </h4>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    This will permanently delete your account (<strong>@{(currentUser.username || 'sajol_freedom').replace(/^@+/, '')}</strong>) from WeedChat and Firebase. Type <strong>DELETE</strong> below to confirm.
                  </p>
                </div>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-red-900/60 text-white placeholder-slate-500'
                    : 'bg-white border-red-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountConfirm(false)}
                  disabled={isDeletingAccount}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  onClick={handleDeleteMyAccount}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white shadow-md shadow-red-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete My Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav
        currentScreen="profile"
        onNavigate={onNavigate}
        theme={theme}
        unreadCount={3}
        isAdminVerified={isAdminVerified}
        primaryColor={primaryColor}
        userAvatar={currentUser?.avatar}
      />

      {/* Device Bottom Home Indicator Bar (iOS style) */}
      <div className="w-full flex justify-center pb-2 pt-0.5 bg-white dark:bg-[#181A20] shrink-0 z-30">
        <div className="w-32 h-1 bg-slate-900/25 dark:bg-white/25 rounded-full pointer-events-none" />
      </div>

      {/* 2FA Authenticator Pairing Modal */}
      {show2FaModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Two-Factor Authentication</h3>
                  <p className="text-xs text-slate-400">Google Authenticator / TOTP</p>
                </div>
              </div>
              <button
                onClick={() => setShow2FaModal(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200">
              {qr2FaUrl ? (
                <img
                  src={qr2FaUrl}
                  alt="2FA QR Code"
                  className="w-44 h-44 rounded-xl object-contain"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR Code...
                </div>
              )}
              <span className="text-[11px] text-slate-600 font-semibold mt-2 text-center">
                Scan with Google Authenticator or Authy
              </span>
            </div>

            {/* Secret key copy */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Manual Setup Key
              </span>
              <div className="p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-mono text-xs font-bold flex items-center justify-between">
                <span style={{ color: primaryColor }}>{currentUser.twoFactorSecret || ADMIN_2FA_DEFAULT_SECRET}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.twoFactorSecret || ADMIN_2FA_DEFAULT_SECRET);
                    setCopiedKey('key');
                    setTimeout(() => setCopiedKey(null), 2000);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer ml-2"
                >
                  {copiedKey === 'key' ? <Check style={{ color: primaryColor }} className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Live Token Status */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <RefreshCw style={{ color: primaryColor }} className="w-3.5 h-3.5 animate-spin" />
                <span className="text-slate-400">Current Code:</span>
                <strong style={{ color: primaryColor }} className="font-mono text-sm">{liveTotpCode}</strong>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">Refreshes in {totpCountdown}s</span>
            </div>

            <button
              type="button"
              onClick={() => setShow2FaModal(false)}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:brightness-110 active:scale-95"
            >
              Done & Protected
            </button>
          </div>
        </div>
      )}

      {/* Friendship Modal launched from Profile Page */}
      {profileFriendshipModalContact && (
        <FriendshipModal
          isOpen={Boolean(profileFriendshipModalContact)}
          onClose={() => setProfileFriendshipModalContact(null)}
          contact={profileFriendshipModalContact}
          currentUserAvatar={currentUser.avatar}
          currentUserName={currentUser.name}
          userMotherLanguage={motherLanguage}
          messages={messages}
          theme={theme}
          primaryColor={primaryColor}
        />
      )}

      {/* Set Your Fingerprint Modal (Matching Light_18.webp) */}
      <FingerprintSetupModal
        isOpen={isFingerprintModalOpen}
        mode="record"
        userId={currentUser.id}
        userName={currentUser.name}
        userEmail={currentUser.email}
        onClose={() => setIsFingerprintModalOpen(false)}
        onSkip={() => setIsFingerprintModalOpen(false)}
        onSuccess={(record) => {
          setFingerprintRecord(record);
          setIsFingerprintModalOpen(false);
          onUpdateCurrentUser({
            ...currentUser,
            fingerprintEnabled: true,
            fingerprintCredentialId: record.credentialId,
            fingerprintRecordedAt: record.recordedAt,
          });
          setUploadStatusMsg(
            `🔒 Fingerprint recorded (${record.fingerLabel})! Fingerprint 2FA is now active.`
          );
          setTimeout(() => setUploadStatusMsg(null), 3500);
        }}
      />
    </div>
  );
};
