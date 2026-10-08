import React, { useState } from 'react';
import {
  X,
  Search,
  Forward,
  Check,
  Send,
  MessageSquare,
  Mic,
  Image as ImageIcon,
  FileText,
  Phone,
  Video,
  Smile,
  Users,
  Shield,
} from 'lucide-react';
import { ChatMessage, UserContact, GroupParticipant } from '../types';

interface ForwardMessageModalProps {
  isOpen: boolean;
  message: ChatMessage | null;
  contacts: UserContact[];
  currentContactId: string;
  onClose: () => void;
  onForward: (targetContactIds: string[], message: ChatMessage, note?: string) => void;
  isDark: boolean;
  isGroupChat?: boolean;
  groupName?: string;
  groupParticipants?: GroupParticipant[];
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  message,
  contacts,
  currentContactId,
  onClose,
  onForward,
  isDark,
  isGroupChat = false,
  groupName = 'Group',
  groupParticipants = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [forwardNote, setForwardNote] = useState('');

  if (!isOpen || !message) return null;

  // When forwarding from a group, restrict recipients to other group members only
  const groupMemberAsContacts: UserContact[] = groupParticipants
    .filter((p) => p.id !== 'me')
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      lastMessage: p.role === 'admin' ? 'Group Admin' : 'Group Member',
      time: '',
      online: p.online !== false,
      nativeLanguage: p.nativeLanguage || 'English',
      statusText: 'Group Member',
    }));

  const availableContacts =
    isGroupChat && groupMemberAsContacts.length > 0
      ? groupMemberAsContacts
      : contacts.filter((c) => !c.isBlocked && !c.isDeleted);

  const filteredContacts = availableContacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phoneNumber && c.phoneNumber.includes(searchQuery)) ||
    (c.nativeLanguage && c.nativeLanguage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map((c) => c.id));
    }
  };

  const handleSendForward = () => {
    if (selectedContactIds.length === 0) return;
    onForward(selectedContactIds, message, forwardNote.trim());
    setSelectedContactIds([]);
    setForwardNote('');
    onClose();
  };

  // Preview format helper
  const renderMessageContentPreview = () => {
    switch (message.type) {
      case 'text':
        return (
          <p className="text-xs italic truncate line-clamp-2 text-slate-300">
            "{message.text}"
          </p>
        );
      case 'audio':
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Note ({message.audioDuration || '0:30'})</span>
          </div>
        );
      case 'image':
        return (
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300">Photo attachment</span>
          </div>
        );
      case 'sticker':
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Smile className="w-4 h-4" />
            <span>Sticker: {message.stickerName || message.text || 'Sticker'}</span>
          </div>
        );
      case 'call':
        return (
          <div className="flex items-center gap-1.5 text-xs text-purple-400">
            {message.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            <span>{message.callType === 'video' ? 'Video' : 'Audio'} Call log</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <FileText className="w-3.5 h-3.5" />
            <span>{message.text || 'Message attachment'}</span>
          </div>
        );
    }
  };

  return (
    <div
      id="forward-message-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="forward-message-modal-container"
        className={`w-full max-w-md rounded-3xl border shadow-2xl flex flex-col overflow-hidden max-h-[90vh] transition-all ${
          isDark ? 'bg-[#18202E] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              {isGroupChat ? <Users className="w-4 h-4" /> : <Forward className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {isGroupChat ? 'Share to Group Members Only' : 'Forward Message'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isGroupChat
                  ? `Share exclusively with other members of ${groupName}`
                  : 'Share this message with your contacts'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isGroupChat && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Restricted to other members of this group only.</span>
          </div>
        )}

        {/* Message preview snippet */}
        <div className={`p-3 mx-4 mt-3 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold mb-1">
            <Forward className="w-3 h-3" />
            <span>Forwarding message</span>
          </div>
          {renderMessageContentPreview()}
        </div>

        {/* Search bar & Select All */}
        <div className="p-4 pb-2 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border transition-colors ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span>
              {selectedContactIds.length > 0 ? (
                <span className="text-emerald-500 font-bold">
                  {selectedContactIds.length} contact{selectedContactIds.length > 1 ? 's' : ''} selected
                </span>
              ) : (
                'Select recipients'
              )}
            </span>
            {filteredContacts.length > 1 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-emerald-500 hover:underline font-semibold cursor-pointer text-[11px]"
              >
                {selectedContactIds.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1.5 min-h-[180px] max-h-[280px]">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No contacts found matching "{searchQuery}"
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = selectedContactIds.includes(contact.id);
              const isCurrent = contact.id === currentContactId;
              return (
                <div
                  key={contact.id}
                  onClick={() => toggleContactSelection(contact.id)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? isDark
                        ? 'bg-emerald-500/20 border-emerald-500/80 text-white'
                        : 'bg-emerald-50 border-emerald-400 text-slate-900'
                      : isDark
                      ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                      />
                      {contact.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#18202E]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate">{contact.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-700 text-slate-300 font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {contact.nativeLanguage || 'English'} • {contact.statusText || 'Available'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-500 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Optional Add Note Input */}
        <div className="p-4 border-t border-slate-700/40 space-y-3">
          <input
            type="text"
            value={forwardNote}
            onChange={(e) => setForwardNote(e.target.value)}
            placeholder="Add an optional comment or note..."
            className={`w-full px-3.5 py-2 rounded-xl text-xs border transition-colors ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedContactIds.length === 0}
              onClick={handleSendForward}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                selectedContactIds.length > 0
                  ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                Forward{selectedContactIds.length > 0 ? ` (${selectedContactIds.length})` : ''}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
