import React, { useState, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Palette,
  Image,
  Upload,
  UserX,
  Users,
  MessageSquare,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Trash2,
  Lock,
  Search,
  Plus,
  Radio,
  FileCheck,
  ExternalLink,
  Sliders,
  Send,
  Sparkles,
  ArrowLeft,
  Eye,
  Check,
  Ban,
  Filter,
  Tag,
  Play,
  Smartphone,
  KeyRound,
  RefreshCw,
  Copy,
  Terminal,
  QrCode,
  FileCode,
  Bell,
  Volume2,
  Music,
  Flag,
  EyeOff,
  Film,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  AppBrandConfig,
  BannedUser,
  ReportedUser,
  UserContact,
  ThemeMode,
  ScreenView,
  AdminStats,
  StickerItem,
  TwoFactorAuthConfig,
} from '../types';
import {
  getAdminTwoFactorConfig,
  saveAdminTwoFactorConfig,
  generateTwoFactorSecret,
  generateOtpAuthUri,
  generateBackupCodes,
  generateTotpCode,
  getRemainingSeconds,
  ADMIN_2FA_DEFAULT_SECRET,
  ADMIN_2FA_DEFAULT_BACKUP_CODES,
} from '../lib/twoFactorAuth';
import { targetAndProcessFaviconFile, saveUserProfileToDb, saveContactOrChannelToDb } from '../lib/firebase';
import {
  VerifiedCheckmarkBadge,
  getAdminVerificationRequirements,
  isAccountProfileValidated,
  rewardUserVerifiedBadgeByAdmin,
  revokeUserVerifiedBadgeByAdmin,
  saveUserIdDocumentLocally,
} from './VerifiedCheckmarkBadge';
import {
  UploadedNotificationTune,
  loadUploadedNotificationTunes,
  saveUploadedNotificationTunes,
  playNotificationTuneUrl,
  playDefaultAppNotificationBell,
} from '../lib/notificationSound';
import { StickerItemCard } from './StickerItemCard';
import { AdminApkGenerator } from './AdminApkGenerator';
import { BottomNav } from './BottomNav';
import {
  ReportedMediaRecord,
  getReportedMediaList,
  getRemovedForbiddenMediaIds,
  getAdultNudityMediaIds,
  removeForbiddenMediaByAdmin,
  restoreRemovedMediaByAdmin,
  dismissReportedMediaByAdmin,
  deleteReportedMediaRecord,
  markMediaAsAdultNudity,
  unmarkMediaAsAdultNudity,
  REPORT_CATEGORY_LABELS,
} from '../lib/mediaModerationHelper';

interface AdminControlPanelProps {
  brandConfig: AppBrandConfig;
  onUpdateBrandConfig: (newConfig: Partial<AppBrandConfig>) => void;
  bannedUsers: BannedUser[];
  onBanUser: (user: Omit<BannedUser, 'id'>) => void;
  onUnbanUser: (banId: string, userId: string) => void;
  reportedUsers: ReportedUser[];
  onUpdateReportStatus: (reportId: string, status: ReportedUser['status'], notes?: string) => void;
  onAddReport: (report: Omit<ReportedUser, 'id' | 'createdAt'>) => void;
  contacts: UserContact[];
  totalMessagesCount: number;
  messageBreakdown: {
    text: number;
    audio: number;
    media: number;
    error: number;
  };
  theme: ThemeMode;
  onNavigate: (screen: ScreenView) => void;
  onLockAdmin: () => void;
  adminEmail?: string;
  customStickers?: StickerItem[];
  onUploadCustomSticker?: (sticker: Omit<StickerItem, 'uploadedAt' | 'uploadDate'>) => Promise<StickerItem>;
  onDeleteCustomSticker?: (stickerId: string) => Promise<void>;
  todayUploadsCount?: number;
  onPreviewLoadingPage?: () => void;
  onToggleBlockUser?: (contactId: string, blocked: boolean) => Promise<void> | void;
  onRemoveForbiddenMediaFile?: (mediaId: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Freedom Purple', hex: '#7c3aed', ring: 'ring-purple-600' },
  { name: 'Freedom Emerald', hex: '#10b981', ring: 'ring-emerald-500' },
  { name: 'Cobalt Cyber', hex: '#2563eb', ring: 'ring-blue-600' },
  { name: 'Royal Violet', hex: '#8b5cf6', ring: 'ring-purple-500' },
  { name: 'Amber Sunset', hex: '#f59e0b', ring: 'ring-amber-500' },
  { name: 'Crimson Flame', hex: '#ef4444', ring: 'ring-rose-500' },
  { name: 'Electric Cyan', hex: '#06b6d4', ring: 'ring-cyan-500' },
  { name: 'Midnight Indigo', hex: '#6366f1', ring: 'ring-indigo-500' },
  { name: 'Fuchsia Neon', hex: '#d946ef', ring: 'ring-fuchsia-500' },
];

const STICKER_GRADIENT_PRESETS = [
  { name: 'Emerald Teal', class: 'from-emerald-400 to-teal-600', bg: 'bg-gradient-to-br from-emerald-400 to-teal-600' },
  { name: 'Violet Indigo', class: 'from-violet-500 to-indigo-600', bg: 'bg-gradient-to-br from-violet-500 to-indigo-600' },
  { name: 'Pink Rose', class: 'from-pink-500 to-rose-600', bg: 'bg-gradient-to-br from-pink-500 to-rose-600' },
  { name: 'Amber Fire', class: 'from-amber-400 to-orange-600', bg: 'bg-gradient-to-br from-amber-400 to-orange-600' },
  { name: 'Cyan Sky', class: 'from-cyan-400 to-blue-600', bg: 'bg-gradient-to-br from-cyan-400 to-blue-600' },
  { name: 'Twilight Noir', class: 'from-slate-700 to-slate-900', bg: 'bg-gradient-to-br from-slate-700 to-slate-900' },
];

const STICKER_PRESET_EMOJIS = ['😻', '🔥', '🏆', '💎', '⚡', '🌟', '🚀', '👑', '🎉', '🍕', '💪', '🕊️'];

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({
  brandConfig,
  onUpdateBrandConfig,
  bannedUsers,
  onBanUser,
  onUnbanUser,
  reportedUsers,
  onUpdateReportStatus,
  onAddReport,
  contacts,
  totalMessagesCount,
  messageBreakdown,
  theme,
  onNavigate,
  onLockAdmin,
  adminEmail = 'MobilePhonesky987@gmail.com',
  customStickers = [],
  onUploadCustomSticker,
  onDeleteCustomSticker,
  todayUploadsCount = 0,
  onPreviewLoadingPage,
  onToggleBlockUser,
  onRemoveForbiddenMediaFile,
}) => {
  const isDark = theme === 'dark';

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    | 'branding'
    | 'stickers'
    | 'apk'
    | 'security'
    | 'contacts'
    | 'metrics'
    | 'banned'
    | 'reported'
    | 'reported_media'
  >('reported_media');

  // Reported Media Files (Gallery Photos & Videos) Moderation State
  const [reportedMediaList, setReportedMediaList] = useState<ReportedMediaRecord[]>(() =>
    getReportedMediaList()
  );
  const [removedForbiddenIds, setRemovedForbiddenIds] = useState<string[]>(() =>
    getRemovedForbiddenMediaIds()
  );
  const [adultNudityIds, setAdultNudityIds] = useState<string[]>(() =>
    getAdultNudityMediaIds()
  );
  const [mediaReportFilter, setMediaReportFilter] = useState<
    'all' | 'pending' | 'removed_forbidden' | 'dismissed' | 'adult_nudity'
  >('all');
  const [revealedAdminPreviewIds, setRevealedAdminPreviewIds] = useState<string[]>([]);

  React.useEffect(() => {
    const syncMediaModeration = () => {
      setReportedMediaList(getReportedMediaList());
      setRemovedForbiddenIds(getRemovedForbiddenMediaIds());
      setAdultNudityIds(getAdultNudityMediaIds());
    };
    window.addEventListener('freedom-media-moderation-updated', syncMediaModeration);
    return () => {
      window.removeEventListener('freedom-media-moderation-updated', syncMediaModeration);
    };
  }, []);

  // 2FA Security Center States
  const [twoFactorConfig, setTwoFactorConfig] = useState<TwoFactorAuthConfig>({
    enabled: true,
    secret: ADMIN_2FA_DEFAULT_SECRET,
    otpauthUrl: generateOtpAuthUri(adminEmail, ADMIN_2FA_DEFAULT_SECRET),
    backupCodes: ADMIN_2FA_DEFAULT_BACKUP_CODES,
    enforceForAdmin: true,
    enforceForAllUsers: false,
    updatedAt: new Date().toISOString(),
  });
  const [twoFactorQrCodeUrl, setTwoFactorQrCodeUrl] = useState<string>('');
  const [liveAdminTotp, setLiveAdminTotp] = useState<string>('');
  const [totpRemainingSecs, setTotpRemainingSecs] = useState<number>(30);

  // Load 2FA Configuration
  React.useEffect(() => {
    getAdminTwoFactorConfig().then(async (cfg) => {
      setTwoFactorConfig(cfg);
      try {
        const qrUrl = await QRCode.toDataURL(cfg.otpauthUrl, {
          width: 256,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
        setTwoFactorQrCodeUrl(qrUrl);
      } catch (err) {
        console.warn('Could not generate 2FA QR code:', err);
      }
    });
  }, [adminEmail]);

  // Live TOTP countdown and code generator
  React.useEffect(() => {
    const updateTotp = async () => {
      setTotpRemainingSecs(getRemainingSeconds());
      if (twoFactorConfig.secret) {
        const code = await generateTotpCode(twoFactorConfig.secret);
        setLiveAdminTotp(code);
      }
    };
    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [twoFactorConfig.secret]);

  // Contact Account Status Filter: 'all', 'active', or 'blocked'
  const [contactStatusFilter, setContactStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [verificationRefreshTick, setVerificationRefreshTick] = useState(0);

  React.useEffect(() => {
    const onValidationUpdated = () => setVerificationRefreshTick((t) => t + 1);
    window.addEventListener('freedom-profile-validation-updated', onValidationUpdated);
    return () => window.removeEventListener('freedom-profile-validation-updated', onValidationUpdated);
  }, []);

  const handleAdminRewardVerifiedBadge = async (targetUser: UserContact) => {
    const reqs = getAdminVerificationRequirements(targetUser);
    if (!reqs.meetsRequirements) {
      showToast(
        `Cannot verify ${targetUser.name}: User must meet requirements (Profile Image or ID Document Picture).`,
        'error'
      );
      return;
    }
    const rewardedAt = rewardUserVerifiedBadgeByAdmin(targetUser.id, adminEmail);
    setVerificationRefreshTick((t) => t + 1);
    try {
      await saveContactOrChannelToDb({
        ...targetUser,
        isVerified: true,
        verifiedByAdmin: true,
        profileValidatedAt: rewardedAt,
        verifiedRewardedAt: rewardedAt,
      });
      await saveUserProfileToDb({
        id: targetUser.id,
        name: targetUser.name,
        avatar: targetUser.avatar,
        isVerified: true,
        profileValidatedAt: rewardedAt,
      });
    } catch {}
    showToast(`Rewarded Verified Badge to ${targetUser.name}! Account is now verified.`);
  };

  const handleAdminRevokeVerifiedBadge = async (targetUser: UserContact) => {
    revokeUserVerifiedBadgeByAdmin(targetUser.id);
    setVerificationRefreshTick((t) => t + 1);
    try {
      await saveContactOrChannelToDb({
        ...targetUser,
        isVerified: false,
        verifiedByAdmin: false,
      });
      await saveUserProfileToDb({
        id: targetUser.id,
        name: targetUser.name,
        avatar: targetUser.avatar,
        isVerified: false,
      });
    } catch {}
    showToast(`Revoked Verified Badge from ${targetUser.name}.`);
  };

  const handleAdminUploadUserIdDocument = (targetUser: UserContact, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      saveUserIdDocumentLocally(targetUser.id, dataUrl, file.name);
      setVerificationRefreshTick((t) => t + 1);
      try {
        await saveContactOrChannelToDb({
          ...targetUser,
          idDocumentUrl: dataUrl,
          idDocumentName: file.name,
        });
      } catch {}
      showToast(`Uploaded ID Document "${file.name}" for ${targetUser.name}. Ready for verification!`);
    };
    reader.readAsDataURL(file);
  };

  // Sticker Upload Studio States
  const [stickerName, setStickerName] = useState('');
  const [stickerCategory, setStickerCategory] = useState<StickerItem['category']>('animals');
  const [stickerEmoji, setStickerEmoji] = useState('😻');
  const [stickerBadge, setStickerBadge] = useState('HOT');
  const [stickerGradient, setStickerGradient] = useState('from-emerald-400 to-teal-600');
  const [stickerImageUrl, setStickerImageUrl] = useState<string | undefined>(undefined);
  const [stickerImageFileName, setStickerImageFileName] = useState<string | undefined>(undefined);
  const [isUploadingStickerImage, setIsUploadingStickerImage] = useState(false);
  const [isSubmittingSticker, setIsSubmittingSticker] = useState(false);
  const [stickerError, setStickerError] = useState<string | null>(null);
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');

  const stickerFileInputRef = useRef<HTMLInputElement>(null);

  // Branding Edit States
  const [editAppName, setEditAppName] = useState(brandConfig.appName);
  const [editAppDescription, setEditAppDescription] = useState(
    brandConfig.appDescription ||
      'Next-generation multilingual messaging with instant mother-tongue translation, AI Voice & 2FA security.'
  );
  const [selectedColor, setSelectedColor] = useState(brandConfig.primaryColor);
  const [selectedColorName, setSelectedColorName] = useState(brandConfig.primaryColorName);
  const [customHex, setCustomHex] = useState(brandConfig.primaryColor);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [brandSaveSuccess, setBrandSaveSuccess] = useState(false);
  const [isFaviconDragging, setIsFaviconDragging] = useState(false);

  const faviconInputRef = useRef<HTMLInputElement>(null);
  const notificationIconInputRef = useRef<HTMLInputElement>(null);
  const notificationSoundInputRef = useRef<HTMLInputElement>(null);

  // Notification Icon, Sound & Upload Notification Bell Settings States
  const [isUploadingNotifIcon, setIsUploadingNotifIcon] = useState(false);
  const [isNotifIconDragging, setIsNotifIconDragging] = useState(false);
  const [isUploadingNotifSound, setIsUploadingNotifSound] = useState(false);
  const [customTuneTitle, setCustomTuneTitle] = useState('');
  const [notificationTunes, setNotificationTunes] = useState<UploadedNotificationTune[]>(() =>
    loadUploadedNotificationTunes()
  );
  const [bellVolume, setBellVolume] = useState<number>(
    brandConfig.notificationBellSettings?.bellVolume ?? 85
  );
  const [bellAlertMode, setBellAlertMode] = useState<
    'sound_and_badge' | 'sound_only' | 'silent_badge'
  >(brandConfig.notificationBellSettings?.bellAlertMode || 'sound_and_badge');
  const [vibrateOnRing, setVibrateOnRing] = useState<boolean>(
    brandConfig.notificationBellSettings?.vibrateOnRing ?? true
  );
  const [ringOnNewMessage, setRingOnNewMessage] = useState<boolean>(
    brandConfig.notificationBellSettings?.ringOnNewMessage ?? true
  );
  const [ringOnFriendInvite, setRingOnFriendInvite] = useState<boolean>(
    brandConfig.notificationBellSettings?.ringOnFriendInvite ?? true
  );

  // User Ban Form State
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedUserToBan, setSelectedUserToBan] = useState<string>('');
  const [banReason, setBanReason] = useState<string>('');
  const [banSearchQuery, setBanSearchQuery] = useState('');

  // Report Filter State
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | ReportedUser['status']>('all');
  const [reportSeverityFilter, setReportSeverityFilter] = useState<'all' | ReportedUser['severity']>('all');
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false);
  const [newReportUser, setNewReportUser] = useState('');
  const [newReportReason, setNewReportReason] = useState('');
  const [newReportSeverity, setNewReportSeverity] = useState<ReportedUser['severity']>('high');

  // Notification Toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Favicon Upload Handler
  const handleFaviconUpload = async (file: File) => {
    try {
      setIsUploadingFavicon(true);
      const result = await targetAndProcessFaviconFile(file);
      onUpdateBrandConfig({
        faviconUrl: result.dataUrl,
        faviconFileName: result.fileName,
      });
      showToast(`Favicon updated: ${result.fileName} (${result.fileSize})`);
    } catch (err: any) {
      showToast(err.message || 'Favicon upload failed. Please choose an image or .ico file.');
    } finally {
      setIsUploadingFavicon(false);
    }
  };

  // Reset Favicon
  const handleResetFavicon = () => {
    onUpdateBrandConfig({
      faviconUrl: '',
      faviconFileName: 'default-favicon.svg',
    });
    showToast('Favicon reset to default application logo');
  };

  // Upload Notification Icon Handler
  const handleNotificationIconUpload = async (file: File) => {
    try {
      setIsUploadingNotifIcon(true);
      const result = await targetAndProcessFaviconFile(file);
      onUpdateBrandConfig({
        notificationIconUrl: result.dataUrl,
        notificationIconFileName: result.fileName,
      });
      showToast(`Notification Icon uploaded: ${result.fileName} (${result.fileSize})`);
    } catch (err: any) {
      showToast(err.message || 'Notification icon upload failed. Please choose a valid image file.');
    } finally {
      setIsUploadingNotifIcon(false);
    }
  };

  // Reset Notification Icon
  const handleResetNotificationIcon = () => {
    onUpdateBrandConfig({
      notificationIconUrl: '',
      notificationIconFileName: '',
    });
    showToast('Notification Icon reset to default Bell icon');
  };

  // Upload Notification Sound / Tune Handler
  const handleNotificationSoundUpload = (file: File) => {
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(file.name)) {
      showToast('Please select a valid audio tune file (.mp3, .wav, .ogg, .m4a)');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showToast('Audio file exceeds 4MB limit. Please choose a shorter notification tune.');
      return;
    }

    setIsUploadingNotifSound(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const cleanName =
        customTuneTitle.trim() ||
        file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const sizeKb = `${Math.max(1, Math.round(file.size / 1024))} KB`;

      const newTune: UploadedNotificationTune = {
        id: `tune_custom_${Date.now()}`,
        name: cleanName,
        fileName: file.name,
        fileSize: sizeKb,
        dataUrl,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDefaultBell: true,
      };

      const updatedTunes = [
        newTune,
        ...notificationTunes.map((t) => ({ ...t, isDefaultBell: false })),
      ];
      setNotificationTunes(updatedTunes);
      saveUploadedNotificationTunes(updatedTunes);
      setCustomTuneTitle('');
      setIsUploadingNotifSound(false);

      // Automatically set as default app notification bell on upload
      onUpdateBrandConfig({
        notificationSoundUrl: dataUrl,
        notificationSoundFileName: file.name,
        notificationTuneName: cleanName,
      });

      playNotificationTuneUrl(dataUrl);
      showToast(`Uploaded "${cleanName}" and set as Default App Notification Bell!`);
    };
    reader.onerror = () => {
      setIsUploadingNotifSound(false);
      showToast('Failed to read audio file');
    };
    reader.readAsDataURL(file);
  };

  // Set any tune as the Default App Notification Bell
  const handleSetAsDefaultNotificationBell = (tune: UploadedNotificationTune) => {
    const updated = notificationTunes.map((t) => ({
      ...t,
      isDefaultBell: t.id === tune.id,
    }));
    setNotificationTunes(updated);
    saveUploadedNotificationTunes(updated);

    onUpdateBrandConfig({
      notificationSoundUrl: tune.dataUrl,
      notificationSoundFileName: tune.fileName,
      notificationTuneName: tune.name,
    });

    playNotificationTuneUrl(tune.dataUrl);
    showToast(`"${tune.name}" is now set as the Default App Notification Bell!`);
  };

  // Delete a custom uploaded notification tune
  const handleDeleteNotificationTune = (tuneId: string) => {
    const remaining = notificationTunes.filter((t) => t.id !== tuneId);
    setNotificationTunes(remaining);
    saveUploadedNotificationTunes(remaining);
    showToast('Custom notification tune removed');
  };

  // Save Branding Name, Description & Color
  const handleSaveBranding = () => {
    if (!editAppName.trim()) {
      showToast('App name cannot be empty');
      return;
    }
    onUpdateBrandConfig({
      appName: editAppName.trim(),
      appDescription: editAppDescription.trim(),
      primaryColor: selectedColor,
      primaryColorName: selectedColorName,
    });
    setBrandSaveSuccess(true);
    showToast('Branding & App Description saved and applied across the app');
    setTimeout(() => setBrandSaveSuccess(false), 3000);
  };

  // Save App Description
  const handleSaveAppDescription = () => {
    if (!editAppDescription.trim()) {
      showToast('App description cannot be empty');
      return;
    }
    onUpdateBrandConfig({
      appDescription: editAppDescription.trim(),
    });
    showToast('App Description updated and saved!');
  };

  // Save Upload Notification Bell Settings & Set as App Default Bell
  const handleSaveNotificationBellSettingsAsDefault = () => {
    const activeDefaultTune =
      notificationTunes.find((t) =>
        brandConfig.notificationSoundUrl
          ? t.dataUrl === brandConfig.notificationSoundUrl
          : t.isDefaultBell
      ) || notificationTunes[0];

    onUpdateBrandConfig({
      notificationIconUrl: brandConfig.notificationIconUrl,
      notificationIconFileName: brandConfig.notificationIconFileName,
      notificationSoundUrl: activeDefaultTune?.dataUrl || brandConfig.notificationSoundUrl,
      notificationSoundFileName:
        activeDefaultTune?.fileName || brandConfig.notificationSoundFileName,
      notificationTuneName: activeDefaultTune?.name || brandConfig.notificationTuneName || 'Crystal Bell Chime',
      notificationBellSettings: {
        bellIconUrl: brandConfig.notificationIconUrl,
        bellIconFileName: brandConfig.notificationIconFileName,
        bellSoundUrl: activeDefaultTune?.dataUrl || brandConfig.notificationSoundUrl,
        bellSoundFileName: activeDefaultTune?.fileName || brandConfig.notificationSoundFileName,
        bellTuneName: activeDefaultTune?.name || brandConfig.notificationTuneName || 'Crystal Bell Chime',
        bellVolume,
        bellAlertMode,
        vibrateOnRing,
        ringOnNewMessage,
        ringOnFriendInvite,
        isAppDefaultBell: true,
      },
    });

    if (bellAlertMode !== 'silent_badge') {
      playDefaultAppNotificationBell(brandConfig);
    }
    showToast(
      `Notification Bell Settings saved & set as App Default Bell (${
        activeDefaultTune?.name || brandConfig.notificationTuneName || 'Crystal Bell Chime'
      })!`
    );
  };

  // Reset Branding Defaults
  const handleResetBrandingDefaults = () => {
    const defaultDesc =
      'Next-generation multilingual messaging with instant mother-tongue translation, AI Voice & 2FA security.';
    setEditAppName('Freedom Messaging');
    setEditAppDescription(defaultDesc);
    setSelectedColor('#7c3aed');
    setSelectedColorName('Freedom Purple');
    setCustomHex('#7c3aed');
    onUpdateBrandConfig({
      appName: 'Freedom Messaging',
      appDescription: defaultDesc,
      primaryColor: '#7c3aed',
      primaryColorName: 'Freedom Purple',
      faviconUrl: '',
      faviconFileName: 'default-favicon.svg',
    });
    showToast('Branding & App Description restored to Freedom defaults');
  };

  // Ban User Execution
  const handleConfirmBan = () => {
    if (!selectedUserToBan) {
      showToast('Please select a user to ban');
      return;
    }
    if (!banReason.trim()) {
      showToast('Please provide a reason for the ban');
      return;
    }
    const targetContact = contacts.find((c) => c.id === selectedUserToBan);
    if (!targetContact) return;

    onBanUser({
      userId: targetContact.id,
      name: targetContact.name,
      avatar: targetContact.avatar,
      reason: banReason.trim(),
      bannedAt: new Date().toISOString(),
      bannedBy: adminEmail,
    });

    setIsBanModalOpen(false);
    setSelectedUserToBan('');
    setBanReason('');
    showToast(`${targetContact.name} has been banned from the app`);
  };

  // Create Report Execution
  const handleConfirmCreateReport = () => {
    if (!newReportUser) {
      showToast('Please select a user to report');
      return;
    }
    if (!newReportReason.trim()) {
      showToast('Please enter report violation reason');
      return;
    }
    const targetContact = contacts.find((c) => c.id === newReportUser);
    if (!targetContact) return;

    onAddReport({
      reportedUserId: targetContact.id,
      reportedUserName: targetContact.name,
      reportedUserAvatar: targetContact.avatar,
      reporterName: 'Admin Desk (' + adminEmail.split('@')[0] + ')',
      reason: newReportReason.trim(),
      severity: newReportSeverity,
      status: 'pending',
    });

    setIsCreateReportModalOpen(false);
    setNewReportUser('');
    setNewReportReason('');
    showToast(`Moderation report filed for ${targetContact.name}`);
  };

  // Filtered Reports
  const filteredReports = reportedUsers.filter((r) => {
    if (reportStatusFilter !== 'all' && r.status !== reportStatusFilter) return false;
    if (reportSeverityFilter !== 'all' && r.severity !== reportSeverityFilter) return false;
    return true;
  });

  // Sticker File Select Handler
  const handleStickerFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStickerError('Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStickerError('Image size exceeds 2MB limit. Please choose a smaller image.');
      return;
    }
    setStickerError(null);
    setIsUploadingStickerImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setStickerImageUrl(dataUrl);
      setStickerImageFileName(file.name);
      setIsUploadingStickerImage(false);
      showToast(`Loaded "${file.name}" for sticker`);
    };
    reader.onerror = () => {
      setStickerError('Failed to read image file');
      setIsUploadingStickerImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Sticker Creation & Upload Execution
  const handleCreateSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (todayUploadsCount >= 10) {
      setStickerError('Daily upload limit of 10 stickers has been reached. Quota resets tomorrow.');
      return;
    }
    if (!stickerName.trim()) {
      setStickerError('Please enter a sticker title or name');
      return;
    }

    try {
      setIsSubmittingSticker(true);
      setStickerError(null);

      const newStickerPayload = {
        id: `custom-stk-${Date.now()}`,
        name: stickerName.trim(),
        category: stickerCategory,
        emoji: stickerEmoji || '✨',
        title: stickerName.trim(),
        bgGradient: stickerGradient,
        badgeText: stickerBadge.trim() || 'CUSTOM',
        imageUrl: stickerImageUrl,
        uploadedBy: adminEmail,
      };

      if (onUploadCustomSticker) {
        await onUploadCustomSticker(newStickerPayload);
      }

      showToast(`Sticker "${stickerName}" published successfully! (${todayUploadsCount + 1}/10 today)`);
      // Reset form
      setStickerName('');
      setStickerImageUrl(undefined);
      setStickerImageFileName(undefined);
      setStickerBadge('HOT');
    } catch (err: any) {
      setStickerError(err?.message || 'Failed to upload sticker');
    } finally {
      setIsSubmittingSticker(false);
    }
  };

  const handleDeleteSticker = async (stickerId: string, stickerTitle: string) => {
    if (onDeleteCustomSticker) {
      try {
        await onDeleteCustomSticker(stickerId);
        showToast(`Sticker "${stickerTitle}" deleted`);
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete sticker');
      }
    }
  };

  const isContactBlocked = (c: UserContact) => Boolean(c.isBlocked || c.status === 'blocked');
  const activeContactsCount = contacts.filter((c) => !isContactBlocked(c)).length;
  const blockedContactsCount = contacts.filter((c) => isContactBlocked(c)).length;

  const filteredContacts = contacts.filter((contact) => {
    const blocked = isContactBlocked(contact);
    if (contactStatusFilter === 'active' && blocked) return false;
    if (contactStatusFilter === 'blocked' && !blocked) return false;
    if (contactSearchQuery.trim()) {
      const q = contactSearchQuery.toLowerCase();
      const matchName = contact.name.toLowerCase().includes(q);
      const matchId = contact.id.toLowerCase().includes(q);
      const matchUsername = contact.username?.toLowerCase().includes(q);
      const matchPhone = contact.phoneNumber?.toLowerCase().includes(q);
      const matchLang = contact.nativeLanguage?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchUsername && !matchPhone && !matchLang) return false;
    }
    return true;
  });

  const handleToggleBlock = async (contactId: string, blocked: boolean) => {
    if (onToggleBlockUser) {
      await onToggleBlockUser(contactId, blocked);
      showToast(blocked ? 'Contact account status set to Blocked' : 'Contact account status set to Active');
    }
  };

  const onlineUsersCount = contacts.filter((c) => c.online && !c.isBanned).length;
  const activeUsersCount = contacts.filter((c) => !c.isBanned).length;

  return (
    <div
      id="admin-control-panel"
      className={`w-full h-full flex flex-col overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-[#0F131A] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Admin Top Header */}
      <div
        style={{ backgroundColor: brandConfig.primaryColor }}
        className="text-white px-5 pt-3 pb-4 rounded-b-[28px] shadow-lg shadow-black/10 z-20 flex-shrink-0 transition-colors duration-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="admin-back-btn"
              onClick={() => onNavigate('chats')}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Return to chats"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-300 fill-amber-300/20" />
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Admin Control Panel
                </h1>
              </div>
              <p className="text-[11px] text-white/80 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>Super Admin: </span>
                <span className="font-semibold underline underline-offset-2">{adminEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="admin-lock-session-btn"
              onClick={onLockAdmin}
              className="px-3 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Lock Admin Session"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Admin</span>
            </button>
          </div>
        </div>

        {/* Main Admin Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1 mt-4 p-1 bg-black/25 backdrop-blur-md rounded-2xl border border-white/10">
          <button
            id="admin-tab-branding"
            onClick={() => setActiveTab('branding')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="truncate">Branding</span>
          </button>

          <button
            id="admin-tab-stickers"
            onClick={() => setActiveTab('stickers')}
            className={`relative py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'stickers'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="truncate">Stickers</span>
            <span
              className={`text-[9px] px-1 rounded-full font-mono ${
                activeTab === 'stickers' ? 'bg-emerald-500 text-white font-bold' : 'bg-white/20 text-white'
              }`}
            >
              {customStickers.length}
            </span>
          </button>

          <button
            id="admin-tab-apk"
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="truncate">APK Builder</span>
          </button>

          <button
            id="admin-tab-security"
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="truncate">2FA & Security</span>
          </button>

          <button
            id="admin-tab-contacts"
            onClick={() => setActiveTab('contacts')}
            className={`relative py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="truncate">Contacts</span>
            <span
              className={`text-[9px] px-1 rounded-full font-mono ${
                activeTab === 'contacts' ? 'bg-emerald-500 text-white font-bold' : 'bg-white/20 text-white'
              }`}
            >
              {contacts.length}
            </span>
          </button>

          <button
            id="admin-tab-metrics"
            onClick={() => setActiveTab('metrics')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'metrics'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="truncate">Metrics</span>
          </button>

          <button
            id="admin-tab-banned"
            onClick={() => setActiveTab('banned')}
            className={`relative py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'banned'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span className="truncate">Banned ({bannedUsers.length})</span>
          </button>

          <button
            id="admin-tab-reported"
            onClick={() => setActiveTab('reported')}
            className={`relative py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'reported'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="truncate">User Reports ({reportedUsers.length})</span>
            {reportedUsers.some((r) => r.status === 'pending') && (
              <span className="w-2 h-2 rounded-full bg-rose-400 absolute top-1.5 right-2 sm:static animate-pulse" />
            )}
          </button>

          <button
            id="admin-tab-reported-media"
            onClick={() => setActiveTab('reported_media')}
            className={`relative py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'reported_media'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="truncate">
              Media Reports ({reportedMediaList.filter((m) => m.status === 'pending').length})
            </span>
            {reportedMediaList.some((m) => m.status === 'pending') && (
              <span className="w-2 h-2 rounded-full bg-rose-400 absolute top-1.5 right-2 sm:static animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {feedbackToast && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl border border-white/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackToast}</span>
          </div>
        </div>
      )}

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* =========================================================================
            TAB 1: APP BRANDING & FAVICON & COLOR CUSTOMIZATION
           ========================================================================= */}
        {activeTab === 'branding' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header info badge */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: brandConfig.primaryColor }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Live App Branding & Identity</h2>
                  <p className="text-xs text-slate-400">
                    Changes here update app titles, browser favicon, and primary theme colors across all screens in real-time.
                  </p>
                </div>
              </div>

              <button
                id="reset-all-branding-btn"
                onClick={handleResetBrandingDefaults}
                className="text-xs font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Defaults</span>
              </button>
            </div>

            {/* 1. App Name Customization */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>App Branding Name</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                      Global
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Controls header brand name, welcome screen, document title, and social metadata.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    id="admin-app-name-input"
                    type="text"
                    value={editAppName}
                    onChange={(e) => setEditAppName(e.target.value)}
                    placeholder="Enter App Name (e.g., Freedom Messaging)"
                    maxLength={50}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all focus:outline-none focus:ring-2 ${
                      isDark
                        ? 'bg-[#12161F] border-slate-700 text-white focus:ring-emerald-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500'
                    }`}
                  />
                  <span className="absolute right-3 top-3 text-[11px] text-slate-400">
                    {editAppName.length}/50
                  </span>
                </div>

                <button
                  id="admin-save-name-btn"
                  onClick={handleSaveBranding}
                  style={{ backgroundColor: selectedColor }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Name</span>
                </button>
              </div>

              {/* Live Preview of App Name */}
              <div
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-[#12161F]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
                  style={{ backgroundColor: selectedColor }}
                >
                  {editAppName.charAt(0) || 'F'}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold">Header Preview: <span className="font-extrabold text-sm">{editAppName || 'App Name'}</span></div>
                  <div className="text-[11px] text-slate-400">Browser Title: {editAppName} - Secure Chat</div>
                </div>
              </div>
            </div>

            {/* 1B. App Description Customization (Admin Editable) */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>App Description</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-semibold">
                      Editable
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Edit the application description displayed on the Login screen, Onboarding, and HTML meta description.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {editAppDescription.length}/220
                </span>
              </div>

              <div className="space-y-3">
                <textarea
                  id="admin-app-description-input"
                  rows={3}
                  maxLength={220}
                  value={editAppDescription}
                  onChange={(e) => setEditAppDescription(e.target.value)}
                  placeholder="Enter the official App Description..."
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium leading-relaxed border transition-all focus:outline-none focus:ring-2 resize-none ${
                    isDark
                      ? 'bg-[#12161F] border-slate-700 text-white focus:ring-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500'
                  }`}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Quick Presets:
                    </span>
                    {[
                      'Next-generation multilingual messaging with instant mother-tongue translation, AI Voice & 2FA security.',
                      'Connect globally in your native language with real-time voice & text translation.',
                      'Private, encrypted multilingual chat and voice messaging for global teams.',
                    ].map((presetDesc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAppDescription(presetDesc)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-[#12161F] border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Preset {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    id="admin-save-app-description-btn"
                    type="button"
                    onClick={handleSaveAppDescription}
                    style={{ backgroundColor: selectedColor }}
                    className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save App Description</span>
                  </button>
                </div>
              </div>

              {/* Live App Description Preview */}
              <div
                className={`p-3 rounded-xl border space-y-1 ${
                  isDark ? 'bg-[#12161F]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Live App Description Preview
                </span>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {editAppDescription || 'No description entered'}
                </p>
              </div>
            </div>

            {/* 2. App Favicon Upload */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span>App Favicon Upload</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                    Live Favicon
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload a custom icon or logo file (.ico, .png, .svg, .webp). Automatically updates browser tab icon and in-app brand avatar.
                </p>
              </div>

              {/* Upload Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsFaviconDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsFaviconDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsFaviconDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFaviconUpload(file);
                }}
                onClick={() => faviconInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isFaviconDragging
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                    : isDark
                    ? 'border-slate-700 hover:border-slate-500 bg-[#12161F]/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/70'
                }`}
              >
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp,image/jpeg,.ico"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFaviconUpload(file);
                    e.target.value = '';
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 overflow-hidden border border-slate-200">
                  {brandConfig.faviconUrl ? (
                    <img
                      src={brandConfig.faviconUrl}
                      alt="Current Favicon"
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: brandConfig.primaryColor }}
                    >
                      <Image className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="text-xs font-bold">
                  {isUploadingFavicon
                    ? 'Processing and optimizing favicon...'
                    : 'Click to select or drag & drop favicon file here'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Supports ICO, PNG, SVG, WEBP, and JPG (Auto-scaled to crisp 64x64)
                </div>

                {brandConfig.faviconFileName && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Active: {brandConfig.faviconFileName}</span>
                  </div>
                )}
              </div>

              {/* Favicon Control Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    id="admin-upload-favicon-btn"
                    onClick={() => faviconInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Icon</span>
                  </button>

                  {brandConfig.faviconUrl && (
                    <button
                      id="admin-reset-favicon-btn"
                      onClick={handleResetFavicon}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Bird Logo</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-400">
                  DOM Hook: &lt;link rel="icon"&gt; Live Bound
                </span>
              </div>
            </div>

            {/* 3. App Colour Customizations */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>App Colour Customizations</span>
                    <span
                      className="w-3 h-3 rounded-full inline-block shadow-sm"
                      style={{ backgroundColor: selectedColor }}
                    />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pick a preset theme palette or enter a custom hex color. Updates buttons, message bubbles, active badges, and banners.
                  </p>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono">
                  {selectedColor.toUpperCase()}
                </span>
              </div>

              {/* Color Preset Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => {
                      setSelectedColor(preset.hex);
                      setSelectedColorName(preset.name);
                      setCustomHex(preset.hex);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                      selectedColor.toLowerCase() === preset.hex.toLowerCase()
                        ? 'border-transparent shadow-md ring-2 ' + preset.ring
                        : isDark
                        ? 'border-slate-800 hover:border-slate-700 bg-[#12161F]'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg shadow-sm flex items-center justify-center text-white"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {selectedColor.toLowerCase() === preset.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{preset.hex}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Hex Picker Input */}
              <div
                className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        setSelectedColorName('Custom Theme');
                        setCustomHex(e.target.value);
                      }}
                      className="w-9 h-9 rounded-xl border-0 p-0 cursor-pointer overflow-hidden shadow-sm"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Custom Color Picker</span>
                    <span className="text-[11px] text-slate-400">Click swatch or type hex code</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        setSelectedColor(e.target.value);
                        setSelectedColorName('Custom Theme');
                      }
                    }}
                    placeholder="#10B981"
                    maxLength={7}
                    className={`w-28 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                      isDark
                        ? 'bg-[#181D26] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    id="admin-apply-color-btn"
                    onClick={handleSaveBranding}
                    style={{ backgroundColor: selectedColor }}
                    className="px-4 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    Save & Apply Color
                  </button>
                </div>
              </div>

              {/* Dynamic Theme Color Live Demo Preview Bar */}
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#12161F]/80 border-slate-800' : 'bg-slate-50/80 border-slate-100'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Color Application Preview
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    style={{ backgroundColor: selectedColor }}
                    className="px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm"
                  >
                    Primary Button
                  </button>

                  <div
                    style={{ color: selectedColor, borderColor: selectedColor }}
                    className="px-3 py-1 rounded-xl text-xs font-bold border bg-white dark:bg-slate-900"
                  >
                    Active Nav Tab
                  </div>

                  <div
                    style={{ backgroundColor: selectedColor }}
                    className="px-3 py-1 rounded-full text-white text-xs font-semibold shadow-sm"
                  >
                    Outgoing Chat Bubble
                  </div>

                  <span
                    style={{ color: selectedColor }}
                    className="text-xs font-extrabold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Read Receipt</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Upload Notification Icon & Notification Sound / Default App Notification Bell */}
            <div
              className={`p-5 rounded-2xl border space-y-5 ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/80 pb-3.5">
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: selectedColor }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden"
                  >
                    {brandConfig.notificationIconUrl ? (
                      <img
                        src={brandConfig.notificationIconUrl}
                        alt="Notification Icon"
                        className="w-7 h-7 object-contain"
                      />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <span>Notification Icon & Sound Upload (Default App Notification Bell)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold">
                        Default Bell Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Upload a custom Notification Icon and upload a Notification Tune to set as the default app notification bell.
                    </p>
                  </div>
                </div>

                <button
                  id="admin-test-default-notification-bell-btn"
                  type="button"
                  onClick={() => {
                    playDefaultAppNotificationBell(brandConfig);
                    showToast(
                      `Ringing Default App Notification Bell: ${
                        brandConfig.notificationTuneName || 'Crystal Bell Chime'
                      }`
                    );
                  }}
                  style={{ backgroundColor: selectedColor }}
                  className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ring Default Bell</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Upload Notification Icon */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Upload Notification Icon</span>
                    </label>
                    {brandConfig.notificationIconFileName && (
                      <span className="text-[10px] text-emerald-500 font-semibold truncate max-w-[140px]">
                        {brandConfig.notificationIconFileName}
                      </span>
                    )}
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsNotifIconDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsNotifIconDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsNotifIconDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleNotificationIconUpload(file);
                    }}
                    onClick={() => notificationIconInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isNotifIconDragging
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark
                        ? 'border-slate-700 hover:border-slate-500 bg-[#12161F]/60'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50/80'
                    }`}
                  >
                    <input
                      ref={notificationIconInputRef}
                      id="admin-notification-icon-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleNotificationIconUpload(file);
                        e.target.value = '';
                      }}
                    />

                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-2.5 overflow-hidden border border-slate-200 dark:border-slate-700">
                      {brandConfig.notificationIconUrl ? (
                        <img
                          src={brandConfig.notificationIconUrl}
                          alt="Uploaded Notification Icon"
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Bell style={{ color: selectedColor }} className="w-7 h-7" />
                      )}
                    </div>

                    <p className="text-xs font-bold">
                      {isUploadingNotifIcon
                        ? 'Uploading Notification Icon...'
                        : 'Click or drag & drop Notification Icon'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PNG, SVG, WEBP, ICO, or JPG (Used on notification banners & bell)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="admin-upload-notification-icon-btn"
                      type="button"
                      onClick={() => notificationIconInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Notification Icon</span>
                    </button>

                    {brandConfig.notificationIconUrl && (
                      <button
                        type="button"
                        onClick={handleResetNotificationIcon}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Icon</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: Upload Notification Sound / Tune & Set as Default Bell */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Upload Notification Sound / Tune</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      MP3, WAV, OGG, M4A
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      id="admin-notification-tune-name-input"
                      type="text"
                      value={customTuneTitle}
                      onChange={(e) => setCustomTuneTitle(e.target.value)}
                      placeholder="Optional custom tune title (e.g. Freedom Chime)"
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                        isDark
                          ? 'bg-[#12161F] border-slate-700 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />

                    <input
                      ref={notificationSoundInputRef}
                      id="admin-notification-sound-file-input"
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleNotificationSoundUpload(file);
                        e.target.value = '';
                      }}
                    />

                    <button
                      id="admin-upload-notification-sound-btn"
                      type="button"
                      disabled={isUploadingNotifSound}
                      onClick={() => notificationSoundInputRef.current?.click()}
                      style={{ backgroundColor: selectedColor }}
                      className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-sm hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {isUploadingNotifSound
                          ? 'Uploading Notification Tune...'
                          : 'Upload Notification Tune & Set as Default Bell'}
                      </span>
                    </button>
                  </div>

                  {/* Tunes List with "Set as Default App Notification Bell" */}
                  <div className="space-y-1.5 pt-1 max-h-52 overflow-y-auto pr-0.5">
                    {notificationTunes.map((tune) => {
                      const isCurrentDefault =
                        brandConfig.notificationSoundUrl
                          ? brandConfig.notificationSoundUrl === tune.dataUrl
                          : Boolean(tune.isDefaultBell);

                      return (
                        <div
                          key={tune.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            isCurrentDefault
                              ? isDark
                                ? 'bg-emerald-950/30 border-emerald-500/40'
                                : 'bg-emerald-50/80 border-emerald-300'
                              : isDark
                              ? 'bg-[#12161F] border-slate-800'
                              : 'bg-slate-50 border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => playNotificationTuneUrl(tune.dataUrl)}
                              className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                              title="Play / Preview Notification Tune"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold truncate">{tune.name}</span>
                                {isCurrentDefault && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-bold shrink-0">
                                    Default Bell
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {tune.fileName} • {tune.fileSize}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!isCurrentDefault ? (
                              <button
                                id={`set-default-bell-${tune.id}`}
                                type="button"
                                onClick={() => handleSetAsDefaultNotificationBell(tune)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Bell className="w-3 h-3" />
                                <span>Set as App Default Bell</span>
                              </button>
                            ) : (
                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>App Default Bell</span>
                              </span>
                            )}

                            {tune.id.startsWith('tune_custom_') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteNotificationTune(tune.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                                title="Delete custom tune"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Upload Notification Bell Settings & Set as App Default Bell */}
              <div
                className={`p-4 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#12161F]/90 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders style={{ color: selectedColor }} className="w-3.5 h-3.5" />
                      <span>Upload Notification Bell Settings</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Configure volume, alert mode, and event triggers for the uploaded notification bell and set as the App Default Bell.
                    </p>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 self-start sm:self-center">
                    Active Bell: {brandConfig.notificationTuneName || 'Crystal Bell Chime'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Volume & Alert Mode */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span>Notification Bell Volume</span>
                        <span style={{ color: selectedColor }} className="font-mono">
                          {bellVolume}%
                        </span>
                      </div>
                      <input
                        id="admin-bell-volume-slider"
                        type="range"
                        min={0}
                        max={100}
                        value={bellVolume}
                        onChange={(e) => setBellVolume(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold block mb-1.5">
                        Notification Bell Alert Mode
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'sound_and_badge', label: 'Sound + Icon' },
                          { id: 'sound_only', label: 'Sound Only' },
                          { id: 'silent_badge', label: 'Icon Only' },
                        ].map((modeOption) => (
                          <button
                            key={modeOption.id}
                            type="button"
                            onClick={() =>
                              setBellAlertMode(
                                modeOption.id as 'sound_and_badge' | 'sound_only' | 'silent_badge'
                              )
                            }
                            style={
                              bellAlertMode === modeOption.id
                                ? { backgroundColor: selectedColor }
                                : undefined
                            }
                            className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                              bellAlertMode === modeOption.id
                                ? 'text-white border-transparent shadow-xs'
                                : isDark
                                ? 'bg-[#181D26] border-slate-700 text-slate-300 hover:bg-slate-800'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {modeOption.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bell Trigger Toggles */}
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200/70 dark:border-slate-800 cursor-pointer">
                      <span className="text-xs font-semibold">Ring on Incoming Messages</span>
                      <input
                        type="checkbox"
                        checked={ringOnNewMessage}
                        onChange={(e) => setRingOnNewMessage(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200/70 dark:border-slate-800 cursor-pointer">
                      <span className="text-xs font-semibold">Ring on Friend Invite Notifications</span>
                      <input
                        type="checkbox"
                        checked={ringOnFriendInvite}
                        onChange={(e) => setRingOnFriendInvite(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200/70 dark:border-slate-800 cursor-pointer">
                      <span className="text-xs font-semibold">Vibrate Device on Bell Ring</span>
                      <input
                        type="checkbox"
                        checked={vibrateOnRing}
                        onChange={(e) => setVibrateOnRing(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Action Row: Set as App Default Bell */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Bell className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      Applies uploaded bell icon, sound tune, and settings globally across all users
                    </span>
                  </div>

                  <button
                    id="admin-set-as-app-default-bell-btn"
                    type="button"
                    onClick={handleSaveNotificationBellSettingsAsDefault}
                    style={{ backgroundColor: selectedColor }}
                    className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Set as App Default Bell</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: APP STICKERS UPLOAD & MANAGEMENT (10 STICKERS / DAY LIMIT)
           ========================================================================= */}
        {activeTab === 'stickers' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Daily Quota Monitor & Upload Rate Limit Banner */}
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                todayUploadsCount >= 10
                  ? isDark
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                  : isDark
                  ? 'bg-[#181D26] border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      todayUploadsCount >= 10
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    <Tag className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                      <span>Admin App Stickers Studio</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                        {customStickers.length} Published
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Upload custom high-definition stickers for all app users. Enforces a strict quota limit of 10 sticker uploads per day.
                    </p>
                  </div>
                </div>

                {/* Quota Progress Pill */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono">
                      <span className={todayUploadsCount >= 10 ? 'text-amber-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
                        {todayUploadsCount}
                      </span>
                      <span className="text-slate-400"> / 10 uploads today</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {Math.max(0, 10 - todayUploadsCount)} slots remaining today
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    todayUploadsCount >= 10
                      ? 'bg-amber-500'
                      : todayUploadsCount >= 7
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (todayUploadsCount / 10) * 100)}%` }}
                />
              </div>

              {todayUploadsCount >= 10 && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Daily upload limit reached (10/10 uploaded today). Quota resets at 00:00 UTC. Existing stickers remain available to all users.
                  </span>
                </div>
              )}
            </div>

            {/* Sticker Upload & Creation Form */}
            <div
              className={`p-5 rounded-2xl border space-y-5 ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Upload & Design New Sticker</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure graphics, badge pill, gradient background, and categorization.
                  </p>
                </div>
              </div>

              {stickerError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between gap-2 text-xs text-rose-300 font-medium">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{stickerError}</span>
                  </div>
                  <button onClick={() => setStickerError(null)} className="text-rose-400 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateSticker} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Form Fields */}
                  <div className="space-y-4">
                    {/* Sticker Name */}
                    <div>
                      <label className="text-xs font-bold block mb-1">
                        Sticker Title / Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="admin-sticker-name-input"
                        type="text"
                        value={stickerName}
                        onChange={(e) => setStickerName(e.target.value)}
                        placeholder="e.g. Cyber Kitty, Victory Trophy, Peace Dove"
                        disabled={todayUploadsCount >= 10 || isSubmittingSticker}
                        className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium border outline-none transition-all ${
                          isDark
                            ? 'bg-[#12161F] border-slate-700 text-white focus:border-emerald-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                        }`}
                      />
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="text-xs font-bold block mb-1">
                        Category Tab
                      </label>
                      <select
                        id="admin-sticker-category-select"
                        value={stickerCategory}
                        onChange={(e) => setStickerCategory(e.target.value as StickerItem['category'])}
                        disabled={todayUploadsCount >= 10 || isSubmittingSticker}
                        className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium border outline-none transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#12161F] border-slate-700 text-white focus:border-emerald-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                        }`}
                      >
                        <option value="animals">Animals (🐱 Cute Animals)</option>
                        <option value="moods">Moods & Memes (😎 Cool Moods)</option>
                        <option value="love">Hearts & Love (❤️ Love)</option>
                        <option value="party">Party & Wins (🎉 Celebration)</option>
                        <option value="freedom">Freedom & Peace (🕊️ Freedom)</option>
                        <option value="custom">Admin Specials (⭐ Custom Exclusive)</option>
                      </select>
                    </div>

                    {/* Badge Ribbon Text */}
                    <div>
                      <label className="text-xs font-bold block mb-1">
                        Badge Pill Text
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="admin-sticker-badge-input"
                          type="text"
                          value={stickerBadge}
                          onChange={(e) => setStickerBadge(e.target.value)}
                          placeholder="HOT, NEW, VIP, WOW..."
                          maxLength={10}
                          disabled={todayUploadsCount >= 10 || isSubmittingSticker}
                          className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-medium border outline-none uppercase font-mono transition-all ${
                            isDark
                              ? 'bg-[#12161F] border-slate-700 text-white focus:border-emerald-500'
                              : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                          }`}
                        />
                        <div className="flex items-center gap-1">
                          {['HOT', 'NEW', 'VIP', 'WIN'].map((quickBadge) => (
                            <button
                              key={quickBadge}
                              type="button"
                              onClick={() => setStickerBadge(quickBadge)}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white cursor-pointer transition-colors"
                            >
                              {quickBadge}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Background Gradient Presets */}
                    <div>
                      <label className="text-xs font-bold block mb-1.5">
                        Card Background Gradient
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {STICKER_GRADIENT_PRESETS.map((preset) => (
                          <button
                            key={preset.class}
                            type="button"
                            onClick={() => setStickerGradient(preset.class)}
                            className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                              stickerGradient === preset.class
                                ? 'border-emerald-400 ring-2 ring-emerald-500/50 shadow-sm'
                                : isDark
                                ? 'border-slate-700 bg-slate-800/40 hover:bg-slate-800'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full shrink-0 ${preset.bg}`} />
                            <span className="text-[11px] font-bold truncate">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Graphic Upload (Image vs Emoji) & Live Preview */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div>
                      <label className="text-xs font-bold block mb-1">
                        Sticker Graphic (Image File or Emoji Emblem)
                      </label>

                      {/* Image Upload Dropzone */}
                      <div
                        onClick={() => stickerFileInputRef.current?.click()}
                        className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          stickerImageUrl
                            ? 'border-emerald-500/60 bg-emerald-500/10'
                            : isDark
                            ? 'border-slate-700 hover:border-emerald-500 bg-slate-800/30 hover:bg-slate-800/50'
                            : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50'
                        }`}
                      >
                        <input
                          ref={stickerFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleStickerFileSelect(file);
                          }}
                        />
                        {isUploadingStickerImage ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <RotateCcw className="w-5 h-5 text-emerald-400 animate-spin" />
                            <span className="text-xs font-semibold">Processing image...</span>
                          </div>
                        ) : stickerImageUrl ? (
                          <div className="flex items-center gap-3 w-full">
                            <img
                              src={stickerImageUrl}
                              alt="Preview"
                              className="w-12 h-12 rounded-xl object-cover shadow-sm border border-emerald-500/40"
                            />
                            <div className="text-left flex-1 min-w-0">
                              <span className="text-xs font-bold text-emerald-400 block truncate">
                                {stickerImageFileName || 'Custom Graphic Loaded'}
                              </span>
                              <span className="text-[11px] text-slate-400">Click to replace photo</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStickerImageUrl(undefined);
                                setStickerImageFileName(undefined);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Remove custom image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 py-1">
                            <Upload className="w-6 h-6 text-slate-400" />
                            <div className="text-xs font-bold">
                              Click to Upload Image File
                            </div>
                            <div className="text-[11px] text-slate-400">
                              PNG with transparent background, SVG, or JPG (max 2MB)
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Or Quick Emoji Selection */}
                      <div className="mt-3">
                        <span className="text-[11px] text-slate-400 block mb-1.5 font-semibold">
                          Or pick symbol / fallback emoji:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {STICKER_PRESET_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setStickerEmoji(emoji);
                                setStickerImageUrl(undefined);
                              }}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                                stickerEmoji === emoji && !stickerImageUrl
                                  ? 'bg-emerald-500/30 border border-emerald-400'
                                  : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Card Box */}
                    <div
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">
                          Live In-Chat Preview
                        </span>
                        <span className="text-xs text-slate-400">
                          Exactly how users will see this sticker
                        </span>
                      </div>

                      <div className="p-1">
                        <StickerItemCard
                          sticker={{
                            id: 'live-preview-sticker',
                            name: stickerName.trim() || 'Preview Sticker',
                            category: stickerCategory,
                            emoji: stickerEmoji || '✨',
                            title: stickerName.trim() || 'Sticker Name',
                            bgGradient: stickerGradient,
                            badgeText: stickerBadge.trim() || 'HOT',
                            imageUrl: stickerImageUrl,
                          }}
                          size="md"
                          interactive={false}
                          showLabel={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Button */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/80">
                  <div className="text-xs text-slate-400">
                    Daily limit: <strong className="text-emerald-400">{todayUploadsCount}/10</strong> today
                  </div>

                  <button
                    id="admin-upload-sticker-btn"
                    type="submit"
                    disabled={todayUploadsCount >= 10 || isSubmittingSticker || !stickerName.trim()}
                    style={{ backgroundColor: brandConfig.primaryColor }}
                    className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                      todayUploadsCount >= 10 || isSubmittingSticker || !stickerName.trim()
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:brightness-110 active:scale-95'
                    }`}
                  >
                    {isSubmittingSticker ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>Publishing to App...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload & Publish Sticker</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Uploaded App Stickers Collection */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span>Admin Published Stickers Library ({customStickers.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All stickers currently uploaded and available in the user emoji & sticker tray.
                  </p>
                </div>

                {/* Search */}
                <div className="relative w-48 hidden sm:block">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stickerSearchQuery}
                    onChange={(e) => setStickerSearchQuery(e.target.value)}
                    placeholder="Search stickers..."
                    className={`w-full py-1.5 pl-8 pr-3 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-[#12161F] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {customStickers.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                    <Tag className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h4 className="text-xs font-bold">No Custom Stickers Uploaded Yet</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Use the form above to upload custom stickers for your community. You can upload up to 10 stickers each day.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {customStickers
                    .filter((stk) =>
                      stickerSearchQuery
                        ? stk.name.toLowerCase().includes(stickerSearchQuery.toLowerCase()) ||
                          stk.category.toLowerCase().includes(stickerSearchQuery.toLowerCase())
                        : true
                    )
                    .map((sticker) => (
                      <div
                        key={sticker.id}
                        id={`admin-sticker-card-${sticker.id}`}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center relative group transition-all ${
                          isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="w-full flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteSticker(sticker.id, sticker.name)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                            title={`Delete sticker "${sticker.name}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="py-1">
                          <StickerItemCard
                            sticker={sticker}
                            size="md"
                            interactive={false}
                            showLabel={false}
                          />
                        </div>

                        <div className="w-full mt-2">
                          <div className="text-xs font-bold truncate">{sticker.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize truncate mt-0.5">
                            {sticker.category} • {sticker.badgeText || 'STICKER'}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: ANDROID APK GENERATOR & BUILD ENGINE
           ========================================================================= */}
        {activeTab === 'apk' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
            <AdminApkGenerator
              brandConfig={brandConfig}
              isDark={isDark}
              adminEmail={adminEmail}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* =========================================================================
            SECURITY & 2FA TAB (TWO-FACTOR AUTHENTICATION & CORDOVA CLI)
           ========================================================================= */}
        {activeTab === 'security' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Top Banner */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark
                  ? 'bg-gradient-to-br from-slate-900/90 via-[#1C2333]/90 to-slate-900/90 border-slate-700/60'
                  : 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/70 border-emerald-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Two-Factor Authentication & Mobile Security Suite
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        TOTP RFC 6238 Active
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Safeguard the Super Admin account and users with cryptographic TOTP 6-digit tokens and Apache Cordova packaging.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Live Code: {liveAdminTotp || '...'} ({totpRemainingSecs}s)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Apache Cordova CLI Global Status Card */}
            <div
              className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <span>Apache Cordova Global CLI Platform</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                        v13.0.0 Global Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cordova packages this web application into native Android APKs with hardware access.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('apk')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all self-start sm:self-auto"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open Cordova APK Builder</span>
                </button>
              </div>

              {/* Command Code Snippet with Copy */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-slate-400 shrink-0 font-semibold">Cordova Terminal Pipeline:</span>
                  <code className="text-emerald-300 font-mono text-[11px] truncate">
                    npm install -g cordova && bash scripts/build-cordova.sh
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('npm install -g cordova && bash scripts/build-cordova.sh');
                    showToast('Copied Cordova build command');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Pipeline</span>
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication Setup & Pairing Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* QR Code and Secret Key Column */}
              <div
                className={`md:col-span-6 p-5 rounded-3xl border shadow-xs space-y-4 ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-3 border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold">1. Pair Authenticator App</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Google Authenticator
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200">
                  {twoFactorQrCodeUrl ? (
                    <img
                      src={twoFactorQrCodeUrl}
                      alt="2FA QR Code"
                      className="w-48 h-48 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                      Generating QR code...
                    </div>
                  )}
                  <p className="text-[11px] text-slate-600 font-medium mt-2 text-center">
                    Scan using Google Authenticator, Authy, or Microsoft Authenticator
                  </p>
                </div>

                {/* Secret Key with 1-click copy */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Base32 Secret Key (Manual Entry):</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-mono text-xs text-emerald-400 font-bold flex items-center justify-between">
                    <span className="truncate">{twoFactorConfig.secret}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(twoFactorConfig.secret);
                        showToast('Secret key copied to clipboard');
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer ml-2"
                      title="Copy Secret"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Policy & Emergency Recovery Codes */}
              <div
                className={`md:col-span-6 p-5 rounded-3xl border shadow-xs space-y-4 flex flex-col justify-between ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-3 border-slate-700/40 mb-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold">2. Security Enforcements</h3>
                    </div>
                  </div>

                  {/* Enforcement Toggles */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold block text-slate-200">
                          Mandatory 2FA for Super Admin
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Requires 6-digit Authenticator code on admin sign in
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={twoFactorConfig.enforceForAdmin}
                        onChange={async (e) => {
                          const updated = { ...twoFactorConfig, enforceForAdmin: e.target.checked };
                          setTwoFactorConfig(updated);
                          await saveAdminTwoFactorConfig(updated);
                          showToast(`Super Admin 2FA enforcement ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                        }}
                        className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-2xl border border-slate-700/60 bg-slate-900/40 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold block text-slate-200">
                          Require 2FA for All Registered Users
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Enforces 2FA verification across standard chat accounts
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={twoFactorConfig.enforceForAllUsers}
                        onChange={async (e) => {
                          const updated = { ...twoFactorConfig, enforceForAllUsers: e.target.checked };
                          setTwoFactorConfig(updated);
                          await saveAdminTwoFactorConfig(updated);
                          showToast(`Global User 2FA enforcement ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                        }}
                        className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Emergency Recovery Codes */}
                  <div className="mt-4 pt-3 border-t border-slate-700/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300">
                        Emergency Backup Codes ({twoFactorConfig.backupCodes.length})
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const newCodes = generateBackupCodes(6);
                          const updated = { ...twoFactorConfig, backupCodes: newCodes };
                          setTwoFactorConfig(updated);
                          await saveAdminTwoFactorConfig(updated);
                          showToast('Generated 6 new emergency backup codes');
                        }}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      {twoFactorConfig.backupCodes.map((code, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono font-semibold text-emerald-400 flex items-center justify-between"
                        >
                          <span>{code}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(twoFactorConfig.backupCodes.join('\n'));
                        showToast('All emergency backup codes copied to clipboard');
                      }}
                      className="w-full mt-3 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Backup Codes</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: CONTACTS DIRECTORY WITH ACCOUNT STATUS FILTER DROPDOWN
           ========================================================================= */}
        {activeTab === 'contacts' && (
          <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
            {/* Header with Title and Filter Dropdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <span>Contacts & Account Status Directory</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Display contacts filtered by account status: active, blocked, or all.
                </p>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label
                  htmlFor="admin-contacts-status-filter"
                  className="text-xs font-bold text-slate-400 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Filter className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Account Status:</span>
                </label>
                <select
                  id="admin-contacts-status-filter"
                  aria-label="Filter contacts by account status: active, blocked, or all"
                  value={contactStatusFilter}
                  onChange={(e) =>
                    setContactStatusFilter(e.target.value as 'all' | 'active' | 'blocked')
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark
                      ? 'bg-[#181D26] border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                  }`}
                >
                  <option value="all">All Contacts ({contacts.length})</option>
                  <option value="active">Active Only ({activeContactsCount})</option>
                  <option value="blocked">Blocked Only ({blockedContactsCount})</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Pill Buttons & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Quick Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="filter-pill-all"
                  onClick={() => setContactStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    contactStatusFilter === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : isDark
                      ? 'bg-[#181D26] text-slate-400 hover:text-white'
                      : 'bg-white border text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>All Contacts</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-500/20 font-mono">
                    {contacts.length}
                  </span>
                </button>

                <button
                  type="button"
                  id="filter-pill-active"
                  onClick={() => setContactStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    contactStatusFilter === 'active'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isDark
                      ? 'bg-[#181D26] text-slate-400 hover:text-emerald-400'
                      : 'bg-white border text-slate-600 hover:text-emerald-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Active</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 font-mono">
                    {activeContactsCount}
                  </span>
                </button>

                <button
                  type="button"
                  id="filter-pill-blocked"
                  onClick={() => setContactStatusFilter('blocked')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    contactStatusFilter === 'blocked'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : isDark
                      ? 'bg-[#181D26] text-slate-400 hover:text-amber-400'
                      : 'bg-white border text-slate-600 hover:text-amber-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Blocked</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 font-mono">
                    {blockedContactsCount}
                  </span>
                </button>
              </div>

              {/* Search contacts input */}
              <div className="relative flex-1 sm:max-w-xs">
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    isDark
                      ? 'bg-[#181D26] border-slate-700 text-white focus:ring-2 focus:ring-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                {contactSearchQuery && (
                  <button
                    onClick={() => setContactSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Contacts Cards Grid */}
            {filteredContacts.length === 0 ? (
              <div
                className={`p-10 rounded-2xl border text-center space-y-2 ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-500/10 text-slate-400 flex items-center justify-center mx-auto">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold">No Contacts Matching Filter</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No contacts found for account status: <span className="font-bold capitalize">{contactStatusFilter}</span>
                  {contactSearchQuery ? ` and search "${contactSearchQuery}"` : ''}.
                </p>
                <button
                  onClick={() => {
                    setContactStatusFilter('all');
                    setContactSearchQuery('');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all cursor-pointer"
                >
                  Show All Contacts
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredContacts.map((contact) => {
                  const isBlocked = isContactBlocked(contact);
                  const isUserBanned =
                    bannedUsers.some((b) => b.userId === contact.id) || contact.isBanned;

                  return (
                    <div
                      key={contact.id}
                      className={`p-4 rounded-2xl border space-y-3 transition-all ${
                        isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className={`w-11 h-11 rounded-full object-cover border-2 ${
                                isBlocked
                                  ? 'border-amber-400/60 opacity-80'
                                  : 'border-emerald-400/60'
                              }`}
                            />
                            {contact.online && !isBlocked && !isUserBanned && (
                              <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#181D26] absolute -bottom-0.5 -right-0.5" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold">{contact.name}</h4>
                              {isAccountProfileValidated(contact) && (
                                <VerifiedCheckmarkBadge
                                  id={`admin-contact-verified-badge-${contact.id}`}
                                  size="sm"
                                  title={`${contact.name} • Verified by Admin`}
                                />
                              )}
                              {/* Account Status Badge */}
                              {isBlocked ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>Blocked</span>
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Active</span>
                                </span>
                              )}
                              {isUserBanned && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 font-bold">
                                  BANNED
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 mt-0.5">
                              ID: <span className="font-mono">{contact.id}</span> • Language:{' '}
                              <span className="font-semibold text-slate-300 dark:text-slate-200">
                                {contact.nativeLanguage || 'English'}
                              </span>
                            </p>

                            {contact.phoneNumber && (
                              <p className="text-[11px] text-slate-400">Phone: {contact.phoneNumber}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio / Last message / Block reason */}
                      {isBlocked && contact.blockedReason ? (
                        <div
                          className={`p-2.5 rounded-xl text-xs ${
                            isDark ? 'bg-[#12161F] text-amber-300/90' : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          <span className="font-bold">Block Note: </span>
                          <span>{contact.blockedReason}</span>
                        </div>
                      ) : (
                        <div
                          className={`p-2 rounded-xl text-[11px] truncate ${
                            isDark ? 'bg-[#12161F] text-slate-400' : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="font-semibold">Last Msg: </span>
                          <span>{contact.lastMessage || 'No recent messages'}</span>
                        </div>
                      )}

                      {/* Admin Verification Requirements & Reward Verified Badge Box */}
                      {(() => {
                        void verificationRefreshTick;
                        const reqs = getAdminVerificationRequirements(contact);
                        const isVerifiedNow = isAccountProfileValidated(contact);
                        return (
                          <div
                            className={`p-3 rounded-xl border space-y-2 text-xs ${
                              isDark
                                ? 'bg-[#12161F]/90 border-slate-800'
                                : 'bg-slate-50 border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-extrabold text-[11px] flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                                <span>Admin Account Verification Requirements</span>
                              </span>
                              {reqs.meetsRequirements ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold">
                                  Meets Requirements ✓
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold">
                                  Missing Profile Image / ID Doc
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-[11px]">
                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                                  reqs.hasProfileImage
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-slate-500/15 text-slate-400'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>Profile Image: {reqs.hasProfileImage ? 'Verified' : 'None'}</span>
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                                  reqs.hasIdDocumentPicture
                                    ? 'bg-sky-500/15 text-sky-400'
                                    : 'bg-slate-500/15 text-slate-400'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>
                                  ID Document:{' '}
                                  {reqs.hasIdDocumentPicture ? reqs.idDocumentName || 'Uploaded' : 'None'}
                                </span>
                              </span>

                              <label
                                className="px-2 py-0.5 rounded-md bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 font-bold cursor-pointer flex items-center gap-1 transition-colors"
                                title="Upload or attach user ID Document Picture for verification"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Upload ID Doc</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleAdminUploadUserIdDocument(contact, file);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              {isVerifiedNow ? (
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                                    <VerifiedCheckmarkBadge size="sm" />
                                    <span>Verified Badge Rewarded by Admin</span>
                                  </span>
                                  <button
                                    id={`admin-revoke-verified-btn-${contact.id}`}
                                    type="button"
                                    onClick={() => handleAdminRevokeVerifiedBadge(contact)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-[11px] font-bold cursor-pointer transition-colors"
                                  >
                                    Revoke Badge
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`admin-reward-verified-btn-${contact.id}`}
                                  type="button"
                                  disabled={!reqs.meetsRequirements}
                                  onClick={() => handleAdminRewardVerifiedBadge(contact)}
                                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                                    reqs.meetsRequirements
                                      ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-xs cursor-pointer active:scale-95'
                                      : 'bg-slate-700/40 text-slate-400 cursor-not-allowed'
                                  }`}
                                  title="Reward user with a Verified Badge if they meet requirements (Profile Image or ID Document Picture)"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Reward Verified Badge</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Admin Contact Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        {/* Toggle Account Status: Block / Unblock */}
                        {isBlocked ? (
                          <button
                            id={`unblock-contact-btn-${contact.id}`}
                            onClick={() => handleToggleBlock(contact.id, false)}
                            className="px-3 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            title="Unblock account status to Active"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Unblock Account</span>
                          </button>
                        ) : (
                          <button
                            id={`block-contact-btn-${contact.id}`}
                            onClick={() => handleToggleBlock(contact.id, true)}
                            className="px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            title="Block account status"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Block Account</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUserToBan(contact.id);
                              setIsBanModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                          >
                            Ban
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: APP METRICS (NUMBER OF APP USERS, NUMBER OF USER MESSAGES)
           ========================================================================= */}
        {activeTab === 'metrics' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Total App Users */}
              <div
                className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total App Users
                  </span>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: brandConfig.primaryColor }}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight">{contacts.length}</div>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {onlineUsersCount} Online
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">{activeContactsCount} Active</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-400">{blockedContactsCount} Blocked</span>
                </div>
              </div>

              {/* Metric 2: Total User Messages */}
              <div
                className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total User Messages
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight">{totalMessagesCount}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span>{messageBreakdown.text} Texts</span>
                  <span>•</span>
                  <span>{messageBreakdown.audio} Voice</span>
                  <span>•</span>
                  <span>{messageBreakdown.media} Media</span>
                </div>
              </div>

              {/* Metric 3: Banned Users */}
              <div
                className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Banned Users
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                    <UserX className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-rose-500">
                  {bannedUsers.length}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Moderated accounts restricted
                </div>
              </div>

              {/* Metric 4: Reported Users */}
              <div
                className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Reports Pending
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-amber-500">
                  {reportedUsers.filter((r) => r.status === 'pending').length}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {reportedUsers.length} total reports filed
                </div>
              </div>
            </div>

            {/* Detailed User Directory & Message Breakdown Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Users Distribution Card with Account Status Filter Dropdown */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>Registered Contacts Directory ({filteredContacts.length}/{contacts.length})</span>
                  </h3>

                  {/* Status Filter Dropdown in Metrics view */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-emerald-500" />
                      <select
                        id="metrics-contact-status-filter"
                        aria-label="Filter contacts by status: active, blocked, or all"
                        value={contactStatusFilter}
                        onChange={(e) =>
                          setContactStatusFilter(e.target.value as 'all' | 'active' | 'blocked')
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#12161F] border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                        }`}
                      >
                        <option value="all">All ({contacts.length})</option>
                        <option value="active">Active ({activeContactsCount})</option>
                        <option value="blocked">Blocked ({blockedContactsCount})</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setIsBanModalOpen(true)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Ban className="w-3 h-3" />
                      <span>Ban</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto pr-1">
                  {filteredContacts.map((user) => {
                    const isUserBanned =
                      bannedUsers.some((b) => b.userId === user.id) || user.isBanned;
                    const isUserBlocked = isContactBlocked(user);

                    return (
                      <div key={user.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            {user.online && !isUserBanned && !isUserBlocked && (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#181D26] absolute -bottom-0.5 -right-0.5" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isAccountProfileValidated(user) && (
                                <VerifiedCheckmarkBadge size="xs" title="Verified by Admin" />
                              )}
                              {isUserBanned && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 font-bold">
                                  BANNED
                                </span>
                              )}
                              {!isUserBanned && isUserBlocked && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 font-bold">
                                  BLOCKED
                                </span>
                              )}
                              {!isUserBanned && !isUserBlocked && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Status: <span className="font-semibold">{isUserBlocked ? 'blocked' : 'active'}</span> • Language: {user.nativeLanguage || 'English'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAccountProfileValidated(user) ? (
                            <button
                              type="button"
                              onClick={() => handleAdminRevokeVerifiedBadge(user)}
                              className="text-[11px] font-bold text-slate-400 hover:text-rose-400 cursor-pointer"
                              title="Revoke Verified Badge"
                            >
                              Unverify
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAdminRewardVerifiedBadge(user)}
                              className="text-[11px] font-bold text-sky-400 hover:underline cursor-pointer"
                              title="Reward User with Verified Badge (if Profile Image or ID Document requirements met)"
                            >
                              Reward Badge
                            </button>
                          )}
                          {isUserBlocked ? (
                            <button
                              onClick={() => handleToggleBlock(user.id, false)}
                              className="text-[11px] font-bold text-emerald-500 hover:underline cursor-pointer"
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleBlock(user.id, true)}
                              className="text-[11px] font-bold text-amber-500 hover:underline cursor-pointer"
                            >
                              Block
                            </button>
                          )}

                          {isUserBanned ? (
                            <button
                              onClick={() => {
                                const banEntry = bannedUsers.find((b) => b.userId === user.id);
                                if (banEntry) onUnbanUser(banEntry.id, user.id);
                              }}
                              className="text-[11px] font-bold text-emerald-500 hover:underline cursor-pointer"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUserToBan(user.id);
                                setIsBanModalOpen(true);
                              }}
                              className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              Moderate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Message Volume & Activity Metrics */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>Message Volume Breakdown</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Standard Text Messages</span>
                      <span className="font-mono">{messageBreakdown.text}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (messageBreakdown.text / Math.max(1, totalMessagesCount)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Audio Voice Notes</span>
                      <span className="font-mono">{messageBreakdown.audio}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (messageBreakdown.audio / Math.max(1, totalMessagesCount)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Media & Image Attachments</span>
                      <span className="font-mono">{messageBreakdown.media}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (messageBreakdown.media / Math.max(1, totalMessagesCount)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {messageBreakdown.error > 0 && (
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Failed / Flagged Deliveries</span>
                        <span className="font-mono text-rose-500">{messageBreakdown.error}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (messageBreakdown.error / Math.max(1, totalMessagesCount)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Firestore Real-Time DB Status Card */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold">Firestore Database:</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      ai-studio-freedommessaging-40ba1d3f-3721-4e80-82b0-a0232b762e35
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-500">Live Sync</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: BANNED USERS LIST & BAN ACTIONS
           ========================================================================= */}
        {activeTab === 'banned' && (
          <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
            {/* Header with Ban User Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-500" />
                  <span>Banned Users Moderation List ({bannedUsers.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Banned users are blocked from sending messages, participating in group calls, and accessing chat channels.
                </p>
              </div>

              <button
                id="admin-open-ban-modal-btn"
                onClick={() => setIsBanModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                <span>Ban a User</span>
              </button>
            </div>

            {/* Banned Users Table / Cards */}
            {bannedUsers.length === 0 ? (
              <div
                className={`p-10 rounded-2xl border text-center space-y-2 ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold">No Users Currently Banned</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All registered members are currently in good standing. Click "Ban a User" to apply manual account restrictions if needed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bannedUsers.map((banned) => (
                  <div
                    key={banned.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                      isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={banned.avatar}
                          alt={banned.name}
                          className="w-11 h-11 rounded-full object-cover grayscale"
                        />
                        <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center absolute -bottom-1 -right-1 border-2 border-white dark:border-[#181D26]">
                          <X className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold">{banned.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-bold uppercase tracking-wider">
                            Banned
                          </span>
                        </div>
                        <p className="text-xs text-rose-400/90 font-medium mt-0.5">
                          Reason: {banned.reason}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Banned on {new Date(banned.bannedAt).toLocaleDateString()} at{' '}
                          {new Date(banned.bannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by{' '}
                          <span className="font-semibold">{banned.bannedBy}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      id={`unban-btn-${banned.userId}`}
                      onClick={() => onUnbanUser(banned.id, banned.userId)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Lift Ban / Unban</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: REPORTED LIST OF USERS & MODERATION
           ========================================================================= */}
        {activeTab === 'reported' && (
          <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <span>Reported Users Moderation Queue ({reportedUsers.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review reported violations submitted by community members. Take instant actions: ban user, dismiss report, or issue warning.
                </p>
              </div>

              <button
                id="admin-create-report-btn"
                onClick={() => setIsCreateReportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>File a Report</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </span>
              {(['all', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setReportStatusFilter(status)}
                  className={`px-3 py-1 rounded-xl font-bold capitalize transition-all cursor-pointer ${
                    reportStatusFilter === status
                      ? 'bg-amber-500 text-white shadow-sm'
                      : isDark
                      ? 'bg-[#181D26] text-slate-400 hover:text-white'
                      : 'bg-white border text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Reported Users Cards */}
            {filteredReports.length === 0 ? (
              <div
                className={`p-10 rounded-2xl border text-center space-y-2 ${
                  isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold">No Reports Matching Filter</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All user reports for this filter criteria have been addressed and cleared by admin moderation.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredReports.map((report) => {
                  const isUserAlreadyBanned = bannedUsers.some(
                    (b) => b.userId === report.reportedUserId
                  );
                  return (
                    <div
                      key={report.id}
                      className={`p-5 rounded-2xl border space-y-3 transition-all ${
                        isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={report.reportedUserAvatar}
                            alt={report.reportedUserName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold">{report.reportedUserName}</h4>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  report.severity === 'critical'
                                    ? 'bg-rose-500/15 text-rose-500'
                                    : report.severity === 'high'
                                    ? 'bg-orange-500/15 text-orange-500'
                                    : report.severity === 'medium'
                                    ? 'bg-amber-500/15 text-amber-500'
                                    : 'bg-blue-500/15 text-blue-500'
                                }`}
                              >
                                {report.severity} Severity
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
                                  report.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : report.status === 'investigating'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : report.status === 'resolved'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-500/20 text-slate-400'
                                }`}
                              >
                                Status: {report.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Reported by: <span className="font-semibold text-slate-300 dark:text-slate-200">{report.reporterName}</span> •{' '}
                              {new Date(report.createdAt).toLocaleDateString()} at{' '}
                              {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {isUserAlreadyBanned && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-500 font-bold flex items-center gap-1">
                            <Ban className="w-3.5 h-3.5" />
                            <span>User Currently Banned</span>
                          </span>
                        )}
                      </div>

                      {/* Reason Box */}
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          isDark ? 'bg-[#12161F] border-slate-800/80' : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <span className="font-bold text-slate-400 block mb-1">Violation Details:</span>
                        <p className="font-medium text-slate-200 dark:text-slate-100">{report.reason}</p>
                      </div>

                      {/* Action Bar for Report */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          {!isUserAlreadyBanned && (
                            <button
                              id={`report-ban-btn-${report.id}`}
                              onClick={() => {
                                onBanUser({
                                  userId: report.reportedUserId,
                                  name: report.reportedUserName,
                                  avatar: report.reportedUserAvatar,
                                  reason: `Banned from Report #${report.id}: ${report.reason}`,
                                  bannedAt: new Date().toISOString(),
                                  bannedBy: adminEmail,
                                });
                                onUpdateReportStatus(report.id, 'resolved', 'User was banned by admin.');
                                showToast(`Banned ${report.reportedUserName} and marked report resolved.`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Ban User</span>
                            </button>
                          )}

                          <button
                            id={`report-resolve-btn-${report.id}`}
                            onClick={() => {
                              onUpdateReportStatus(report.id, 'resolved');
                              showToast('Report marked as Resolved');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </button>

                          <button
                            id={`report-dismiss-btn-${report.id}`}
                            onClick={() => {
                              onUpdateReportStatus(report.id, 'dismissed');
                              showToast('Report dismissed');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Dismiss</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>Status:</span>
                          <select
                            value={report.status}
                            onChange={(e) =>
                              onUpdateReportStatus(
                                report.id,
                                e.target.value as ReportedUser['status']
                              )
                            }
                            className={`px-2 py-1 rounded-lg border text-xs font-semibold ${
                              isDark
                                ? 'bg-[#12161F] border-slate-700 text-white'
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: REPORTED GALLERY MEDIA FILES (PHOTOS & VIDEOS) MODERATION
           ========================================================================= */}
        {activeTab === 'reported_media' && (
          <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
            {/* Header & Summary Banner */}
            <div
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <span>Reported Gallery Media Files (Photos & Videos)</span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-extrabold">
                        {reportedMediaList.filter((m) => m.status === 'pending').length} Pending
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Review reported photos and videos from user galleries. Remove forbidden content against platform rules or mark adult/nudity (18+) media.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold">
                  Removed Forbidden: {removedForbiddenIds.length}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold">
                  18+ Adult/Nudity Flagged: {adultNudityIds.length}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Media Reports:</span>
              </span>
              {(
                [
                  { id: 'all', label: `All (${reportedMediaList.length})` },
                  {
                    id: 'pending',
                    label: `Pending Review (${reportedMediaList.filter((m) => m.status === 'pending').length})`,
                  },
                  {
                    id: 'removed_forbidden',
                    label: `Removed Forbidden (${reportedMediaList.filter((m) => m.status === 'removed_forbidden').length})`,
                  },
                  {
                    id: 'adult_nudity',
                    label: `18+ Adult / Nudity (${reportedMediaList.filter((m) => m.isAdultNudity || m.category === 'adult_nudity').length})`,
                  },
                  {
                    id: 'dismissed',
                    label: `Dismissed (${reportedMediaList.filter((m) => m.status === 'dismissed').length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  id={`admin-media-report-filter-${tab.id}`}
                  onClick={() => setMediaReportFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    mediaReportFilter === tab.id
                      ? 'bg-rose-600 text-white shadow-sm'
                      : isDark
                      ? 'bg-[#181D26] text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Reported Media Cards List */}
            {(() => {
              const filteredMedia = reportedMediaList.filter((item) => {
                if (mediaReportFilter === 'pending') return item.status === 'pending';
                if (mediaReportFilter === 'removed_forbidden')
                  return item.status === 'removed_forbidden' || removedForbiddenIds.includes(item.mediaId);
                if (mediaReportFilter === 'dismissed') return item.status === 'dismissed';
                if (mediaReportFilter === 'adult_nudity')
                  return item.isAdultNudity || item.category === 'adult_nudity' || adultNudityIds.includes(item.mediaId);
                return true;
              });

              if (filteredMedia.length === 0) {
                return (
                  <div
                    className={`p-10 rounded-2xl border text-center space-y-2 ${
                      isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold">No Reported Media Files in This View</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      When users report photos or videos in the gallery for forbidden content or adult nudity, they appear here for immediate admin action.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredMedia.map((report) => {
                    const isRemoved =
                      report.status === 'removed_forbidden' ||
                      removedForbiddenIds.includes(report.mediaId);
                    const isAdultFlagged =
                      adultNudityIds.includes(report.mediaId) || report.isAdultNudity;
                    const isPreviewBlurred =
                      isAdultFlagged && !revealedAdminPreviewIds.includes(report.id);

                    return (
                      <div
                        key={report.id}
                        id={`admin-reported-media-card-${report.id}`}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          isRemoved
                            ? isDark
                              ? 'bg-rose-950/15 border-rose-500/30'
                              : 'bg-rose-50/50 border-rose-200'
                            : isDark
                            ? 'bg-[#181D26] border-slate-800'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Media Thumbnail Preview */}
                          <div className="relative w-full sm:w-40 h-44 sm:h-36 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700/60">
                            <img
                              src={report.thumbnailUrl || report.mediaUrl}
                              alt={report.mediaTitle}
                              className={`w-full h-full object-cover transition-all duration-300 ${
                                isPreviewBlurred ? 'blur-xl scale-110 brightness-75' : ''
                              } ${isRemoved ? 'grayscale opacity-50' : ''}`}
                            />
                            {/* Type Badge */}
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-extrabold uppercase flex items-center gap-1">
                              {report.mediaType === 'video' ? (
                                <>
                                  <Film className="w-3 h-3 text-purple-400" />
                                  <span>Video</span>
                                </>
                              ) : (
                                <>
                                  <Image className="w-3 h-3 text-sky-400" />
                                  <span>Photo</span>
                                </>
                              )}
                            </span>

                            {/* 18+ Badge */}
                            {isAdultFlagged && (
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase shadow">
                                18+ Nudity
                              </span>
                            )}

                            {/* Blur toggle for Admin inspection */}
                            {isAdultFlagged && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedAdminPreviewIds((prev) =>
                                    prev.includes(report.id)
                                      ? prev.filter((id) => id !== report.id)
                                      : [...prev, report.id]
                                  )
                                }
                                className="absolute bottom-2 inset-x-2 py-1 px-2 rounded-lg bg-black/80 hover:bg-black text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {isPreviewBlurred ? (
                                  <>
                                    <Eye className="w-3 h-3 text-amber-400" />
                                    <span>Inspect Preview</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 text-slate-300" />
                                    <span>Blur Preview</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Removed Overlay */}
                            {isRemoved && (
                              <div className="absolute inset-0 bg-rose-950/70 flex flex-col items-center justify-center p-2 text-center">
                                <Trash2 className="w-6 h-6 text-rose-400 mb-1" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-rose-600 px-2 py-0.5 rounded">
                                  Removed by Admin
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Report Info & Controls */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-sm font-extrabold truncate">
                                  {report.mediaTitle}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                                      report.category === 'forbidden_platform_content'
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                        : report.category === 'adult_nudity'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    }`}
                                  >
                                    {REPORT_CATEGORY_LABELS[report.category] || report.category}
                                  </span>

                                  <span
                                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                      isRemoved
                                        ? 'bg-rose-600 text-white'
                                        : report.status === 'pending'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-slate-500/20 text-slate-400'
                                    }`}
                                  >
                                    {isRemoved
                                      ? 'Removed (Forbidden)'
                                      : report.status === 'pending'
                                      ? 'Pending Admin Action'
                                      : 'Dismissed'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                  Media ID: <code className="font-mono text-slate-300">{report.mediaId}</code>
                                </span>
                                <span>•</span>
                                <span>
                                  Uploaded by:{' '}
                                  <strong className="text-slate-300">
                                    {report.uploaderName || report.senderName || 'User'}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Reported by:{' '}
                                  <strong className="text-slate-300">
                                    {report.reporterName || report.reportedBy || 'Community Member'}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(report.createdAt || report.reportedAt || Date.now()).toLocaleDateString()}{' '}
                                  at{' '}
                                  {new Date(report.createdAt || report.reportedAt || Date.now()).toLocaleTimeString(
                                    [],
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )}
                                </span>
                              </div>

                              {/* Violation Reason Box */}
                              <div
                                className={`mt-2.5 p-3 rounded-xl border text-xs ${
                                  isDark
                                    ? 'bg-[#12161F] border-slate-800 text-slate-200'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="font-bold text-slate-400 block mb-0.5">
                                  Reported Violation / Reason:
                                </span>
                                <p className="font-medium leading-relaxed">{report.reason}</p>
                              </div>
                            </div>

                            {/* Admin Action Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                              <div className="flex flex-wrap items-center gap-2">
                                {!isRemoved ? (
                                  <button
                                    id={`admin-remove-forbidden-media-btn-${report.id}`}
                                    type="button"
                                    onClick={() => {
                                      removeForbiddenMediaByAdmin(
                                        report.id,
                                        report.mediaId,
                                        adminEmail,
                                        'Removed by Admin: Forbidden content against platform rules.'
                                      );
                                      if (onRemoveForbiddenMediaFile) {
                                        onRemoveForbiddenMediaFile(report.mediaId);
                                      }
                                      showToast(
                                        `Removed forbidden ${report.mediaType} "${report.mediaTitle}" from platform galleries.`
                                      );
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer active:scale-95"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove Forbidden Media</span>
                                  </button>
                                ) : (
                                  <button
                                    id={`admin-restore-media-btn-${report.id}`}
                                    type="button"
                                    onClick={() => {
                                      restoreRemovedMediaByAdmin(report.id, report.mediaId);
                                      showToast(`Restored "${report.mediaTitle}" back to gallery.`);
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Restore Media File</span>
                                  </button>
                                )}

                                {/* Toggle 18+ Adult / Nudity Flag */}
                                <button
                                  id={`admin-toggle-nudity-flag-btn-${report.id}`}
                                  type="button"
                                  onClick={() => {
                                    if (isAdultFlagged) {
                                      unmarkMediaAsAdultNudity(report.mediaId);
                                      showToast(`Removed 18+ Adult/Nudity tag from "${report.mediaTitle}".`);
                                    } else {
                                      markMediaAsAdultNudity(report.mediaId);
                                      showToast(
                                        `Flagged "${report.mediaTitle}" as 18+ Adult/Nudity (hidden for users with Safe Filter ON).`
                                      );
                                    }
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                    isAdultFlagged
                                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                                      : isDark
                                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>{isAdultFlagged ? '18+ Nudity Flagged ✓' : 'Flag 18+ Nudity'}</span>
                                </button>

                                {report.status !== 'dismissed' && !isRemoved && (
                                  <button
                                    id={`admin-dismiss-media-report-btn-${report.id}`}
                                    type="button"
                                    onClick={() => {
                                      dismissReportedMediaByAdmin(report.id, adminEmail);
                                      showToast(`Report for "${report.mediaTitle}" dismissed.`);
                                    }}
                                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Keep & Dismiss</span>
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  deleteReportedMediaRecord(report.id);
                                  showToast('Report log entry deleted.');
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete report log entry"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: BAN A USER DIALOG
         ========================================================================= */}
      {isBanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border space-y-4 ${
              isDark ? 'bg-[#181D26] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <Ban className="w-5 h-5" />
                <h3 className="text-base font-bold">Ban App User</h3>
              </div>
              <button
                onClick={() => setIsBanModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select the user to ban and specify a reason. The user will be immediately restricted from chat and calling services.
            </p>

            {/* User Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Select User to Ban</label>
              <select
                id="select-user-to-ban"
                value={selectedUserToBan}
                onChange={(e) => setSelectedUserToBan(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                  isDark ? 'bg-[#12161F] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="">-- Choose a contact --</option>
                {contacts
                  .filter((c) => !bannedUsers.some((b) => b.userId === c.id))
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.id})
                    </option>
                  ))}
              </select>
            </div>

            {/* Quick Reason Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Violation Reason</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Spam & Phishing Bot',
                  'Harassment & Abuse',
                  'Inappropriate Media',
                  'Impersonation',
                  'Terms Violation',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setBanReason(reason)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 font-medium transition-all cursor-pointer"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                id="ban-reason-input"
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter detailed reason for banning this account..."
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#12161F] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBanModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-ban-btn"
                type="button"
                onClick={handleConfirmBan}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FILE A REPORT DIALOG
         ========================================================================= */}
      {isCreateReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border space-y-4 ${
              isDark ? 'bg-[#181D26] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold">File User Report</h3>
              </div>
              <button
                onClick={() => setIsCreateReportModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Target User</label>
              <select
                value={newReportUser}
                onChange={(e) => setNewReportUser(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                  isDark ? 'bg-[#12161F] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="">-- Select Contact --</option>
                {contacts.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Severity Level</label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setNewReportSeverity(sev)}
                    className={`py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      newReportSeverity === sev
                        ? 'bg-amber-500 text-white'
                        : isDark
                        ? 'bg-[#12161F] text-slate-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Report Details / Violation</label>
              <textarea
                rows={3}
                value={newReportReason}
                onChange={(e) => setNewReportReason(e.target.value)}
                placeholder="Explain the incident or reason for report..."
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#12161F] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateReportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateReport}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bottom Navigation Menu */}
      <BottomNav
        currentScreen="admin"
        onNavigate={onNavigate}
        theme={theme}
        unreadCount={3}
        isAdminVerified={true}
        primaryColor={brandConfig.primaryColor}
      />

      {/* Device Bottom Home Indicator Bar (iOS style) */}
      <div className="w-full flex justify-center pb-2 pt-0.5 bg-white dark:bg-[#181A20] shrink-0 z-30">
        <div className="w-32 h-1 bg-slate-900/25 dark:bg-white/25 rounded-full pointer-events-none" />
      </div>
    </div>
  );
};
