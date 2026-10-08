import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  UserPlus,
  Users,
  Camera,
  Check,
  QrCode,
  Search,
  Globe,
  Megaphone,
  Lock,
  Sparkles,
} from 'lucide-react';
import { AVAILABLE_LANGUAGES, INITIAL_CONTACTS } from '../data/mockData';
import { UserContact, GroupParticipant } from '../types';
import { targetAndProcessAvatarFile } from '../lib/firebase';
import { getInitialsAvatar, getCleanAvatar } from '../lib/avatarHelper';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: UserContact) => void;
  onOpenQrScanner?: () => void;
  initialContactData?: Partial<UserContact & { initialMessage?: string }>;
  primaryColor?: string;
  existingContacts?: UserContact[];
  initialMode?: 'individual' | 'group' | 'channel';
}

const CHANNEL_CATEGORIES = [
  'Announcements',
  'Technology',
  'Community',
  'News & Media',
  'Education',
  'Entertainment',
  'Business',
  'Creator',
];

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onAddContact,
  onOpenQrScanner,
  initialContactData,
  primaryColor = '#7C3AED',
  existingContacts,
  initialMode = 'individual',
}) => {
  const [mode, setMode] = useState<'individual' | 'group' | 'channel'>(initialMode);

  // Individual Contact states
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [initialMessage, setInitialMessage] = useState('Hello from WeedChat!');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>('');
  const [avatarFileName, setAvatarFileName] = useState<string>('');
  const [avatarFileSize, setAvatarFileSize] = useState<string>('');
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [isScannedBadge, setIsScannedBadge] = useState(false);

  // Create Group states
  const [groupName, setGroupName] = useState('');
  const [groupTopic, setGroupTopic] = useState('Multilingual team conversation');
  const [groupWelcomeMsg, setGroupWelcomeMsg] = useState(
    'Welcome everyone! Messages translate into each member’s mother language.'
  );
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([
    'admin_mobilephonesky',
  ]);
  const [participantSearch, setParticipantSearch] = useState('');

  // Create Channel states
  const [channelName, setChannelName] = useState('');
  const [channelHandle, setChannelHandle] = useState('');
  const [channelCategory, setChannelCategory] = useState('Announcements');
  const [channelPrivacy, setChannelPrivacy] = useState<'public' | 'private'>('public');
  const [channelDescription, setChannelDescription] = useState(
    'Official broadcast channel for news, updates, and multilingual announcements.'
  );
  const [channelWelcomeBroadcast, setChannelWelcomeBroadcast] = useState(
    '📢 Welcome to our official Freedom Channel! Stay tuned for updates and broadcasts.'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Sync initialContactData if populated from QR scanner
  useEffect(() => {
    if (initialContactData) {
      setMode('individual');
      if (initialContactData.name) setName(initialContactData.name);
      if (initialContactData.nativeLanguage) setLanguage(initialContactData.nativeLanguage);
      if (initialContactData.initialMessage) setInitialMessage(initialContactData.initialMessage);
      if (initialContactData.avatar) setAvatarDataUrl(initialContactData.avatar);
      if (initialContactData.avatarFileName) setAvatarFileName(initialContactData.avatarFileName);
      if (initialContactData.avatarFileSize) setAvatarFileSize(initialContactData.avatarFileSize);
      setIsScannedBadge(true);
    }
  }, [initialContactData]);

  const availableIndividualContacts = useMemo(() => {
    const base = existingContacts && existingContacts.length > 0 ? existingContacts : INITIAL_CONTACTS;
    return base.filter((c) => !c.isGroup && c.entityType !== 'group' && !c.isChannel && c.entityType !== 'channel');
  }, [existingContacts]);

  const filteredParticipants = useMemo(() => {
    if (!participantSearch.trim()) return availableIndividualContacts;
    const q = participantSearch.toLowerCase().trim();
    return availableIndividualContacts.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.nativeLanguage && c.nativeLanguage.toLowerCase().includes(q))
    );
  }, [availableIndividualContacts, participantSearch]);

  if (!isOpen) return null;

  const handleAvatarFileTarget = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    try {
      setIsProcessingAvatar(true);
      const processed = await targetAndProcessAvatarFile(file);
      setAvatarDataUrl(processed.dataUrl);
      setAvatarFileName(processed.fileName);
      setAvatarFileSize(processed.fileSize);
    } catch (err) {
      console.error('Failed to process avatar file:', err);
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const toggleParticipantSelection = (contactId: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleSubmitIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const defaultAvatar = getInitialsAvatar(name.trim());

    const newContact: UserContact = {
      id: `contact_${Date.now()}`,
      name: name.trim(),
      avatar: avatarDataUrl || defaultAvatar,
      lastMessage: initialMessage,
      time: 'Just now',
      online: true,
      unreadCount: 0,
      nativeLanguage: language,
      statusText: 'Online',
      entityType: 'individual',
      isGroup: false,
      avatarFileName: avatarFileName || undefined,
      avatarFileSize: avatarFileSize || undefined,
    };

    onAddContact(newContact);
    setName('');
    setAvatarDataUrl('');
    setAvatarFileName('');
    setAvatarFileSize('');
    onClose();
  };

  const handleSubmitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const chosenContacts = availableIndividualContacts.filter((c) =>
      selectedParticipantIds.includes(c.id)
    );

    const participants: GroupParticipant[] = [
      ...chosenContacts.map((c) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        nativeLanguage: c.nativeLanguage || 'English',
        online: c.online,
        role: 'member' as const,
      })),
      {
        id: 'me',
        name: 'WeedChat Support & Admin (Owner)',
        avatar: getCleanAvatar('WeedChat Support & Admin', undefined, '#7C3AED', 'admin_mobilephonesky'),
        nativeLanguage: 'English',
        online: true,
        role: 'admin' as const,
      },
    ];

    const onlineCount = participants.filter((p) => p.online).length;
    const defaultGroupAvatar = getInitialsAvatar(groupName.trim(), primaryColor);

    const newGroup: UserContact = {
      id: `group_${Date.now()}`,
      name: groupName.trim(),
      avatar: avatarDataUrl || defaultGroupAvatar,
      lastMessage: groupWelcomeMsg.trim() || `Created group "${groupName.trim()}"`,
      time: 'Just now',
      online: true,
      unreadCount: 0,
      nativeLanguage: 'Multilingual',
      statusText: `${participants.length} members • ${onlineCount} online`,
      status: 'active',
      entityType: 'group',
      isGroup: true,
      isJoinedGroup: true,
      groupAdminId: 'admin_mobilephonesky',
      groupTopic: groupTopic.trim() || 'Group conversation',
      participants,
    };

    onAddContact(newGroup);
    setGroupName('');
    setAvatarDataUrl('');
    setAvatarFileName('');
    setAvatarFileSize('');
    onClose();
  };

  const handleSubmitChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    const chosenSubscribers = availableIndividualContacts.filter((c) =>
      selectedParticipantIds.includes(c.id)
    );

    const participants: GroupParticipant[] = [
      {
        id: 'admin_mobilephonesky',
        name: 'WeedChat Support & Admin (Owner)',
        avatar: getCleanAvatar('WeedChat Support & Admin', undefined, '#7C3AED', 'admin_mobilephonesky'),
        nativeLanguage: 'English',
        online: true,
        role: 'admin' as const,
      },
      ...chosenSubscribers
        .filter((c) => c.id !== 'admin_mobilephonesky')
        .map((c) => ({
          id: c.id,
          name: c.name,
          avatar: c.avatar,
          nativeLanguage: c.nativeLanguage || 'English',
          online: c.online,
          role: 'member' as const,
        })),
    ];

    const cleanHandle = (
      channelHandle.trim() ||
      channelName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
    ).replace(/^@/, '');

    const totalSubscribers = Math.max(1, participants.length);
    const defaultChannelAvatar = getInitialsAvatar(channelName.trim(), primaryColor);

    const newChannel: UserContact = {
      id: `channel_${Date.now()}`,
      name: channelName.trim(),
      avatar: avatarDataUrl || defaultChannelAvatar,
      lastMessage:
        channelWelcomeBroadcast.trim() ||
        `📢 Welcome to ${channelName.trim()}! (${channelCategory})`,
      time: 'Just now',
      online: true,
      unreadCount: 0,
      nativeLanguage: 'Multilingual',
      statusText: `${totalSubscribers} ${totalSubscribers === 1 ? 'subscriber' : 'subscribers'} • ${channelCategory}`,
      status: 'active',
      entityType: 'channel',
      isChannel: true,
      isSubscribedChannel: true,
      channelHandle: `@${cleanHandle}`,
      channelDescription:
        channelDescription.trim() || `${channelName.trim()} official broadcast channel.`,
      channelCategory,
      channelPrivacy,
      subscribersCount: totalSubscribers,
      channelAdminId: 'admin_mobilephonesky',
      participants,
      bio: channelDescription.trim() || `${channelName.trim()} official broadcast channel.`,
      avatarFileName: avatarFileName || undefined,
      avatarFileSize: avatarFileSize || undefined,
    };

    onAddContact(newChannel);
    setChannelName('');
    setChannelHandle('');
    setAvatarDataUrl('');
    setAvatarFileName('');
    setAvatarFileSize('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#181A20] text-slate-900 dark:text-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
            >
              {mode === 'channel' ? (
                <Megaphone className="w-4 h-4" />
              ) : mode === 'group' ? (
                <Users className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </div>
            <h3 className="font-bold text-base">
              {mode === 'channel'
                ? 'Create Channel'
                : mode === 'group'
                ? 'Create Group Chat'
                : 'New Conversation'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Mode Switcher: Individual vs Create Group vs Create Channel */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 mb-3.5 text-[11px] font-bold">
          <button
            type="button"
            id="modal-mode-individual-btn"
            onClick={() => setMode('individual')}
            style={mode === 'individual' ? { backgroundColor: primaryColor } : undefined}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mode === 'individual'
                ? 'text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>Direct</span>
          </button>
          <button
            type="button"
            id="modal-mode-group-btn"
            onClick={() => setMode('group')}
            style={mode === 'group' ? { backgroundColor: primaryColor } : undefined}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mode === 'group'
                ? 'text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Group</span>
          </button>
          <button
            type="button"
            id="modal-mode-channel-btn"
            onClick={() => setMode('channel')}
            style={mode === 'channel' ? { backgroundColor: primaryColor } : undefined}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mode === 'channel'
                ? 'text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span>Channel</span>
          </button>
        </div>

        {/* Hidden Avatar File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileTarget}
        />

        {mode === 'individual' ? (
          <>
            {/* Quick QR Scanner Action Banner */}
            {onOpenQrScanner && (
              <div
                style={{
                  backgroundColor: `${primaryColor}12`,
                  borderColor: `${primaryColor}30`,
                }}
                className="mb-3 p-2.5 rounded-2xl border flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {isScannedBadge ? 'QR Code Scanned' : 'Quick Add via QR'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {isScannedBadge
                        ? 'Contact details prefilled'
                        : 'Scan camera code to auto-populate'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQrScanner();
                  }}
                  style={{ color: primaryColor, borderColor: `${primaryColor}30` }}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-[11px] flex items-center gap-1 shadow-xs border transition-all cursor-pointer shrink-0"
                >
                  <Camera className="w-3 h-3" />
                  <span>{isScannedBadge ? 'Rescan' : 'Open Scanner'}</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitIndividual} className="space-y-3">
              {/* Camera Icon Only for Avatar Selection */}
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    borderColor: primaryColor,
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                  }}
                  className="relative w-14 h-14 rounded-full overflow-hidden border-2 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-sm"
                  title="Select photo"
                >
                  {avatarDataUrl ? (
                    <>
                      <img
                        src={avatarDataUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                      <span
                        style={{ backgroundColor: primaryColor }}
                        className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      </span>
                    </>
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                  {isProcessingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Mother Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.name}>
                      {lang.name} ({lang.native})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  First Message
                </label>
                <input
                  type="text"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="w-full py-2.5 mt-2 rounded-xl hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
              >
                Save Contact & Start Chat
              </button>
            </form>
          </>
        ) : mode === 'group' ? (
          /* ================================================================== */
          /* CREATE GROUP CHAT FLOW                                             */
          /* ================================================================== */
          <form onSubmit={handleSubmitGroup} className="space-y-3">
            {/* Camera Icon Only for Group Avatar */}
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  borderColor: primaryColor,
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                }}
                className="relative w-14 h-14 rounded-full overflow-hidden border-2 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-sm"
                title="Select group photo"
              >
                {avatarDataUrl ? (
                  <>
                    <img
                      src={avatarDataUrl}
                      alt="Group Avatar"
                      className="w-full h-full object-cover"
                    />
                    <span
                      style={{ backgroundColor: primaryColor }}
                      className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs"
                    >
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </span>
                  </>
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Group Name
              </label>
              <input
                id="create-group-name-input"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Global Product & Design Team"
                required
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Group Topic / Description
              </label>
              <input
                type="text"
                value={groupTopic}
                onChange={(e) => setGroupTopic(e.target.value)}
                placeholder="e.g. Cross-language collaboration"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
              />
            </div>

            {/* Select Participants Checklist */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Select Participants ({selectedParticipantIds.length} selected)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedParticipantIds.length === availableIndividualContacts.length) {
                      setSelectedParticipantIds([]);
                    } else {
                      setSelectedParticipantIds(availableIndividualContacts.map((c) => c.id));
                    }
                  }}
                  style={{ color: primaryColor }}
                  className="text-[11px] font-bold hover:underline cursor-pointer"
                >
                  {selectedParticipantIds.length === availableIndividualContacts.length
                    ? 'Clear All'
                    : 'Select All'}
                </button>
              </div>

              {/* Search participants */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Search contacts to add..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
                />
              </div>

              {/* Scrollable participant list */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {filteredParticipants.map((contact) => {
                  const isSelected = selectedParticipantIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleParticipantSelection(contact.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/50'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/70 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{contact.name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            <span>{contact.nativeLanguage || 'English'}</span>
                          </p>
                        </div>
                      </div>

                      <div
                        style={isSelected ? { backgroundColor: primaryColor } : undefined}
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                          isSelected
                            ? 'text-white border-transparent'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Welcome Message
              </label>
              <input
                type="text"
                value={groupWelcomeMsg}
                onChange={(e) => setGroupWelcomeMsg(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
              />
            </div>

            <button
              id="create-group-submit-btn"
              type="submit"
              disabled={!groupName.trim()}
              style={{
                backgroundColor: !groupName.trim() ? undefined : primaryColor,
              }}
              className={`w-full py-2.5 mt-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5 ${
                !groupName.trim()
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'hover:brightness-110 active:scale-[0.98] text-white cursor-pointer'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>
                Create Group ({selectedParticipantIds.length + 1} Participants)
              </span>
            </button>
          </form>
        ) : (
          /* CREATE CHANNEL FORM */
          <form onSubmit={handleSubmitChannel} className="space-y-3">
            {/* Channel Icon & Quick Templates */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-dashed border-purple-500/60 flex items-center justify-center bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-all cursor-pointer shrink-0 group"
                title="Upload Channel Icon"
              >
                {avatarDataUrl ? (
                  <img
                    src={avatarDataUrl}
                    alt="Channel Icon"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Megaphone className="w-6 h-6" />
                )}
                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <Camera className="w-4 h-4" />
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Broadcast Channel Identity
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Create a public or private channel to broadcast updates to unlimited subscribers.
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    { name: 'Freedom Official News', cat: 'Announcements' },
                    { name: 'Tech & AI Broadcast', cat: 'Technology' },
                    { name: 'Global Polyglot Hub', cat: 'Education' },
                  ].map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => {
                        setChannelName(tpl.name);
                        setChannelCategory(tpl.cat);
                        setChannelHandle(
                          tpl.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
                        );
                      }}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 hover:bg-purple-500/25 cursor-pointer flex items-center gap-0.5"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{tpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Channel Name *
              </label>
              <input
                id="create-channel-name-input"
                type="text"
                value={channelName}
                onChange={(e) => {
                  const val = e.target.value;
                  setChannelName(val);
                  if (!channelHandle) {
                    setChannelHandle(
                      val.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
                    );
                  }
                }}
                placeholder="e.g. Freedom Announcements Channel"
                required
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Channel Handle
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-400">@</span>
                  <input
                    id="create-channel-handle-input"
                    type="text"
                    value={channelHandle.replace(/^@/, '')}
                    onChange={(e) => setChannelHandle(e.target.value.replace(/^@/, ''))}
                    placeholder="channel_handle"
                    className="w-full pl-7 pr-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  id="create-channel-category-select"
                  value={channelCategory}
                  onChange={(e) => setChannelCategory(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
                >
                  {CHANNEL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Channel Privacy Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Channel Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannelPrivacy('public')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    channelPrivacy === 'public'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold">Public Channel</p>
                    <p className="text-[9px] opacity-80">Anyone can join</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setChannelPrivacy('private')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    channelPrivacy === 'private'
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold">Private Channel</p>
                    <p className="text-[9px] opacity-80">Invite link only</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Channel Description / Bio
              </label>
              <textarea
                id="create-channel-description-input"
                rows={2}
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                placeholder="Describe what your channel broadcasts..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                First Broadcast Post
              </label>
              <input
                id="create-channel-welcome-input"
                type="text"
                value={channelWelcomeBroadcast}
                onChange={(e) => setChannelWelcomeBroadcast(e.target.value)}
                placeholder="Write your first channel broadcast..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-purple-500"
              />
            </div>

            <button
              id="create-channel-submit-btn"
              type="submit"
              disabled={!channelName.trim()}
              style={{
                backgroundColor: !channelName.trim() ? undefined : primaryColor,
              }}
              className={`w-full py-2.5 mt-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5 ${
                !channelName.trim()
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'hover:brightness-110 active:scale-[0.98] text-white cursor-pointer'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Create Channel</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
