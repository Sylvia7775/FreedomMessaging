import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Globe,
  User,
  Users,
} from 'lucide-react';
import { ChatMessage, UserContact, ThemeMode, WhatsAppParsedMessage } from '../types';

interface ImportWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMessages: (messages: ChatMessage[], contactName: string) => void;
  activeContact: UserContact;
  contacts: UserContact[];
  theme?: ThemeMode;
  userMotherLanguage?: string;
  primaryColor?: string;
}

const SAMPLE_WHATSAPP_TRANSCRIPT = `18/09/2026, 09:14 - Messages and calls are end-to-end encrypted.
18/09/2026, 09:15 - Kristin Watson: Hey! Are you free to catch up later today?
18/09/2026, 09:16 - Me: Yes sure! I will finish my call around 2 PM.
18/09/2026, 09:18 - Kristin Watson: Great! I wanted to discuss the new translations in Freedom.
18/09/2026, 09:20 - Me: Sounds awesome. Talk in any person of your mother language is working so well.
18/09/2026, 09:22 - Kristin Watson: Exactly, let me know when you arrive!
18/09/2026, 09:23 - Me: Will do! See you soon.`;

export const ImportWhatsAppModal: React.FC<ImportWhatsAppModalProps> = ({
  isOpen,
  onClose,
  onImportMessages,
  activeContact,
  contacts,
  theme = 'light',
  userMotherLanguage = 'English',
  primaryColor = '#7C3AED',
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState('');
  const [parsedMessages, setParsedMessages] = useState<WhatsAppParsedMessage[]>([]);
  const [detectedSenders, setDetectedSenders] = useState<string[]>([]);
  const [selectedMeSender, setSelectedMeSender] = useState<string>('Me');
  const [selectedTargetContact, setSelectedTargetContact] = useState<string>(
    activeContact?.name || contacts[0]?.name || 'Freedom Support & Admin'
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewStep, setPreviewStep] = useState<'input' | 'preview'>('input');

  if (!isOpen) return null;

  // Robust WhatsApp chat parser
  const parseWhatsAppTranscript = (text: string) => {
    setErrorMsg(null);
    if (!text.trim()) {
      setErrorMsg('Please paste WhatsApp chat text or upload an exported .txt file.');
      return;
    }

    const lines = text.split(/\r?\n/);
    const parsed: WhatsAppParsedMessage[] = [];
    const senders = new Set<string>();

    // Regex 1: Android style: "18/09/2026, 09:15 - Sender: Message" or "9/18/26, 9:15 AM - Sender: Message"
    const androidRegex = /^(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*-\s*([^:]+):\s*(.*)$/;
    // Regex 2: iOS style: "[18/09/2026, 09:15:20] Sender: Message"
    const iosRegex = /^\[(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*([^:]+):\s*(.*)$/;

    let currentMsg: WhatsAppParsedMessage | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip system messages like "Messages and calls are end-to-end encrypted"
      if (line.includes('end-to-end encrypted') || line.includes('created group') || line.includes('added you')) {
        continue;
      }

      const matchAndroid = line.match(androidRegex);
      const matchIos = line.match(iosRegex);
      const match = matchAndroid || matchIos;

      if (match) {
        if (currentMsg) {
          parsed.push(currentMsg);
        }
        const sender = match[3].trim();
        const content = match[4].trim();
        senders.add(sender);

        currentMsg = {
          id: `wa-msg-${parsed.length + 1}`,
          date: match[1],
          time: match[2],
          sender,
          content,
          isMedia: content.includes('<Media omitted>') || content.includes('image omitted'),
        };
      } else if (currentMsg) {
        // Multi-line continuation
        currentMsg.content += '\n' + line;
      }
    }

    if (currentMsg) {
      parsed.push(currentMsg);
    }

    if (parsed.length === 0) {
      setErrorMsg(
        'Could not detect standard WhatsApp message patterns. Please ensure format like: "18/09/2026, 09:15 - Name: Message" or click "Load Sample WhatsApp Chat".'
      );
      return;
    }

    const sendersList = Array.from(senders);
    setDetectedSenders(sendersList);
    setParsedMessages(parsed);

    // Auto-guess "Me"
    const guessedMe = sendersList.find(
      (s) => s.toLowerCase() === 'me' || s.toLowerCase() === 'you' || s.toLowerCase() === 'sajol'
    ) || sendersList[0] || 'Me';
    setSelectedMeSender(guessedMe);

    // Auto-guess target contact
    const otherSender = sendersList.find((s) => s !== guessedMe) || activeContact.name;
    setSelectedTargetContact(otherSender);

    setPreviewStep('preview');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        parseWhatsAppTranscript(content);
      }
    };
    reader.readAsText(file);
  };

  // Load sample transcript
  const handleLoadSample = () => {
    setFileName('WhatsApp Chat with Kristin Watson.txt');
    setRawText(SAMPLE_WHATSAPP_TRANSCRIPT);
    parseWhatsAppTranscript(SAMPLE_WHATSAPP_TRANSCRIPT);
  };

  // Convert parsed messages to ChatMessage[] and trigger onImportMessages
  const handleConfirmImport = () => {
    const targetContactObj =
      contacts.find((c) => c.name.toLowerCase() === selectedTargetContact.toLowerCase()) || activeContact;

    const nativeLang = targetContactObj.nativeLanguage || 'Spanish';

    const converted: ChatMessage[] = parsedMessages.map((msg, idx) => {
      const isMe = msg.sender === selectedMeSender;

      return {
        id: `wa-imported-${Date.now()}-${idx}`,
        senderId: isMe ? 'me' : 'other',
        senderName: isMe ? 'Me' : targetContactObj.name,
        senderAvatar: isMe ? undefined : targetContactObj.avatar,
        text: msg.content,
        type: 'text',
        status: 'read',
        timestamp: msg.time,
        isWhatsAppImported: true,
        whatsappSender: msg.sender,
        translation: {
          original: msg.content,
          translated: isMe
            ? `[${nativeLang}]: ${msg.content}`
            : `[${userMotherLanguage}]: ${msg.content}`,
          language: isMe ? nativeLang : userMotherLanguage,
        },
      };
    });

    onImportMessages(converted, targetContactObj.name);
    onClose();
  };

  return (
    <div
      id="import-whatsapp-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="import-whatsapp-modal-card"
        className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] transition-colors ${
          isDark
            ? 'bg-[#181C26] text-white border-slate-700/80 shadow-black/80'
            : 'bg-white text-slate-900 border-slate-200 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with WhatsApp Green Branding */}
        <div className="p-5 text-white flex items-center justify-between bg-[#25D366] shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                Import WhatsApp Messages
              </h2>
              <p className="text-xs text-white/90 font-medium">
                Translate and archive WhatsApp exported chats
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 font-medium">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="p-0.5 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Step 1: Input / Upload */}
        {previewStep === 'input' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Quick action: Sample WhatsApp Chat */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">Quick Test Sample</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Load sample WhatsApp transcript with Kristin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-xs hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                Load Sample
              </button>
            </div>

            {/* File Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-3xl cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                isDark
                  ? 'border-slate-700 hover:border-[#25D366] bg-slate-800/30'
                  : 'border-slate-300 hover:border-[#25D366] bg-slate-50'
              }`}
            >
              <Upload className="w-8 h-8 text-[#25D366] mb-2" />
              <h4 className="font-bold text-xs sm:text-sm">Upload WhatsApp .txt export file</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Exported from WhatsApp (Chat → More → Export Chat → Without Media)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Direct Paste Area */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Or Paste WhatsApp Chat Text:
              </label>
              <textarea
                rows={5}
                placeholder={`18/09/2026, 09:15 - Kristin: Hey! How are you?\n18/09/2026, 09:16 - Me: Doing great!`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className={`w-full p-3 rounded-2xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-[#25D366] ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => parseWhatsAppTranscript(rawText)}
              disabled={!rawText.trim()}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                rawText.trim()
                  ? 'bg-[#25D366] text-white hover:bg-[#20bd5a] active:scale-95'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Parse & Preview Messages</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Preview & Sender Mapping */}
        {previewStep === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-5">
            {/* Summary Banner */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3 text-xs">
              <div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {parsedMessages.length} Messages Found
                </span>
                <p className="text-[11px] text-slate-400">
                  {fileName || 'Pasted transcript'} • Ready to translate
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewStep('input')}
                className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold cursor-pointer"
              >
                Change Text
              </button>
            </div>

            {/* Sender mapping dropdowns */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 text-[11px] uppercase mb-1">
                  Which sender is You ("Me")?
                </label>
                <select
                  value={selectedMeSender}
                  onChange={(e) => setSelectedMeSender(e.target.value)}
                  className={`w-full py-1.5 px-2.5 rounded-xl border font-medium focus:outline-none cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {detectedSenders.map((sender) => (
                    <option key={sender} value={sender}>
                      {sender}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 text-[11px] uppercase mb-1">
                  Import into Chat With:
                </label>
                <select
                  value={selectedTargetContact}
                  onChange={(e) => setSelectedTargetContact(e.target.value)}
                  className={`w-full py-1.5 px-2.5 rounded-xl border font-medium focus:outline-none cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.nativeLanguage})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages Preview Stream */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 border rounded-2xl p-3 divide-y-0 text-xs bg-slate-950/20">
              {parsedMessages.map((msg) => {
                const isMe = msg.sender === selectedMeSender;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs shadow-xs ${
                        isMe
                          ? 'bg-[#005c4b] text-white rounded-br-xs'
                          : 'bg-[#202c33] text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-0.5 font-semibold">
                        <span>{isMe ? 'You' : msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Translation notice */}
            <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>
                All {parsedMessages.length} messages will automatically receive Mother Tongue translation in Freedom!
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-3 ${
            isDark ? 'border-slate-800 bg-[#12151d]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>

          {previewStep === 'preview' && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Import {parsedMessages.length} Messages</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
