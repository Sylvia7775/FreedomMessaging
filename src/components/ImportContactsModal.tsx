import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Upload,
  UserCheck,
  Search,
  CheckSquare,
  Square,
  Phone,
  Globe,
  FileText,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { UserContact, ThemeMode, ImportedMobileContact } from '../types';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportContacts: (contacts: UserContact[]) => void;
  existingContacts: UserContact[];
  theme?: ThemeMode;
  primaryColor?: string;
}

// Curated realistic mobile phonebook contacts to import
const DEFAULT_PHONE_CONTACTS: ImportedMobileContact[] = [
  {
    id: 'mob-1',
    name: 'Elena Rostova',
    phoneNumber: '+7 912 345-67-89',
    email: 'elena.rostova@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    nativeLanguage: 'Russian',
    selected: true,
  },
  {
    id: 'mob-2',
    name: 'Fatima Al-Mansoor',
    phoneNumber: '+971 50 123 4567',
    email: 'fatima.almansoor@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    nativeLanguage: 'Arabic',
    selected: true,
  },
  {
    id: 'mob-3',
    name: 'Kenji Takahashi',
    phoneNumber: '+81 90-1234-5678',
    email: 'kenji.takahashi@yahoo.co.jp',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    nativeLanguage: 'Japanese',
    selected: true,
  },
  {
    id: 'mob-4',
    name: 'Mateo Silva',
    phoneNumber: '+55 11 98765-4321',
    email: 'mateo.silva@uol.com.br',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    nativeLanguage: 'Portuguese',
    selected: true,
  },
  {
    id: 'mob-5',
    name: 'Dr. Aisha Bello',
    phoneNumber: '+234 803 123 4567',
    email: 'aisha.bello@lagoshealth.org',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    nativeLanguage: 'Hausa',
    selected: true,
  },
  {
    id: 'mob-6',
    name: 'Oliver Davies',
    phoneNumber: '+44 7700 900123',
    email: 'oliver.davies@btinternet.co.uk',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    nativeLanguage: 'English',
    selected: true,
  },
  {
    id: 'mob-7',
    name: 'Chiara Moretti',
    phoneNumber: '+39 340 123 4567',
    email: 'chiara.moretti@virgilio.it',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    nativeLanguage: 'Italian',
    selected: false,
  },
  {
    id: 'mob-8',
    name: 'Arjun Kapoor',
    phoneNumber: '+91 98200 12345',
    email: 'arjun.kapoor@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    nativeLanguage: 'Hindi',
    selected: false,
  },
];

export const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
  isOpen,
  onClose,
  onImportContacts,
  existingContacts,
  theme = 'light',
  primaryColor = '#7C3AED',
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'phonebook' | 'upload' | 'manual'>('phonebook');
  const [phoneContacts, setPhoneContacts] = useState<ImportedMobileContact[]>(DEFAULT_PHONE_CONTACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Manual contact creation fields
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualLanguage, setManualLanguage] = useState('Spanish');
  const [manualEmail, setManualEmail] = useState('');

  if (!isOpen) return null;

  // Filter contacts by search query
  const filteredContacts = phoneContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery) ||
      c.nativeLanguage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = phoneContacts.filter((c) => c.selected).length;

  // Toggle selection
  const handleToggleContact = (id: string) => {
    setPhoneContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setPhoneContacts((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  // Try Web Contact Picker API if supported on device
  const handleNativeContactPicker = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        setIsSyncing(true);
        const props = ['name', 'tel', 'email', 'icon'];
        const opts = { multiple: true };
        // @ts-ignore
        const selected = await navigator.contacts.select(props, opts);
        if (selected && selected.length > 0) {
          const newImports: ImportedMobileContact[] = selected.map((c: any, i: number) => ({
            id: `native-${Date.now()}-${i}`,
            name: (c.name && c.name[0]) || 'Mobile Contact',
            phoneNumber: (c.tel && c.tel[0]) || '+1 (555) 000-0000',
            email: (c.email && c.email[0]) || '',
            avatar:
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            nativeLanguage: 'English',
            selected: true,
          }));
          setPhoneContacts((prev) => [...newImports, ...prev]);
          setStatusMessage({
            type: 'success',
            text: `Successfully synced ${selected.length} contacts from device address book!`,
          });
        }
      } catch (err) {
        setStatusMessage({
          type: 'info',
          text: 'Device address book picker was cancelled or requires mobile permissions. You can use the phonebook list or upload a .vcf file.',
        });
      } finally {
        setIsSyncing(false);
      }
    } else {
      setStatusMessage({
        type: 'info',
        text: 'Web Contact Picker API is active on mobile devices. You can import using the pre-scanned mobile contacts below or upload a .vcf/.csv phone export file!',
      });
    }
  };

  // Parse vCard (.vcf) or CSV file
  const handleFileUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsed: ImportedMobileContact[] = [];

      // Check if vCard format (.vcf)
      if (file.name.endsWith('.vcf') || content.includes('BEGIN:VCARD')) {
        const cards = content.split('BEGIN:VCARD');
        cards.forEach((card, idx) => {
          if (!card.trim()) return;
          const fnMatch = card.match(/FN:(.*)/i) || card.match(/N:.*;(.*);;;/i);
          const telMatch = card.match(/TEL.*:(.*)/i);
          const emailMatch = card.match(/EMAIL.*:(.*)/i);

          const name = fnMatch ? fnMatch[1].trim() : `Contact ${idx + 1}`;
          const tel = telMatch ? telMatch[1].trim() : '+1 (555) 123-4567';
          const email = emailMatch ? emailMatch[1].trim() : '';

          parsed.push({
            id: `vcf-${Date.now()}-${idx}`,
            name,
            phoneNumber: tel,
            email,
            avatar: `https://images.unsplash.com/photo-${1500000000000 + (idx % 10) * 100000}?w=150&auto=format&fit=crop&q=80`,
            nativeLanguage: 'English',
            selected: true,
          });
        });
      } else {
        // Assume CSV format (Name, Phone, Language, Email)
        const lines = content.split('\n');
        lines.slice(1).forEach((line, idx) => {
          const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
          if (parts[0]) {
            parsed.push({
              id: `csv-${Date.now()}-${idx}`,
              name: parts[0],
              phoneNumber: parts[1] || '+1 555-0100',
              nativeLanguage: parts[2] || 'English',
              email: parts[3] || '',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              selected: true,
            });
          }
        });
      }

      if (parsed.length > 0) {
        setPhoneContacts((prev) => [...parsed, ...prev]);
        setStatusMessage({
          type: 'success',
          text: `Parsed and ready to import ${parsed.length} contacts from ${file.name}!`,
        });
        setActiveTab('phonebook');
      } else {
        setStatusMessage({
          type: 'error',
          text: 'No contacts could be recognized in this file. Please ensure it is a valid .vcf or .csv.',
        });
      }
    };
    reader.readAsText(file);
  };

  // Add a manual contact
  const handleAddManualContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim()) {
      setStatusMessage({ type: 'error', text: 'Name and Phone Number are required.' });
      return;
    }

    const newContact: ImportedMobileContact = {
      id: `manual-${Date.now()}`,
      name: manualName.trim(),
      phoneNumber: manualPhone.trim(),
      nativeLanguage: manualLanguage,
      email: manualEmail.trim(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      selected: true,
    };

    setPhoneContacts((prev) => [newContact, ...prev]);
    setManualName('');
    setManualPhone('');
    setManualEmail('');
    setStatusMessage({
      type: 'success',
      text: `Added ${newContact.name} to import list!`,
    });
    setActiveTab('phonebook');
  };

  // Execute import of selected contacts into Freedom
  const handleExecuteImport = () => {
    const selected = phoneContacts.filter((c) => c.selected);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least 1 contact to import.' });
      return;
    }

    // Convert to UserContact model
    const contactsToImport: UserContact[] = selected.map((item) => {
      // Check if contact already exists by name or phone
      const existing = existingContacts.find(
        (ec) => ec.name.toLowerCase() === item.name.toLowerCase() || (ec.phoneNumber && ec.phoneNumber === item.phoneNumber)
      );

      return {
        id: existing ? existing.id : `user_${item.id}`,
        name: item.name,
        avatar: item.avatar,
        lastMessage: `Connected via mobile phone contact (${item.phoneNumber})`,
        time: 'Just now',
        online: true,
        unreadCount: 0,
        nativeLanguage: item.nativeLanguage || 'English',
        statusText: `Mobile contact • ${item.phoneNumber}`,
        phoneNumber: item.phoneNumber,
        email: item.email,
        isImported: true,
        importedFrom: 'mobile',
        lastMessageStatus: 'read',
      };
    });

    onImportContacts(contactsToImport);
    onClose();
  };

  return (
    <div
      id="import-contacts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="import-contacts-modal-card"
        className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] transition-colors ${
          isDark
            ? 'bg-[#181C26] text-white border-slate-700/80 shadow-black/80'
            : 'bg-white text-slate-900 border-slate-200 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                Import Mobile Contacts
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Sync phonebook with Freedom translation & calls
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

        {/* Tab Navigation */}
        <div
          className={`flex items-center border-b px-4 pt-2 gap-2 text-xs font-semibold ${
            isDark ? 'border-slate-800 bg-[#141720]' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <button
            onClick={() => setActiveTab('phonebook')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'phonebook'
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone Contacts ({phoneContacts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload .VCF / .CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Single Contact</span>
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`mx-4 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
            }`}
          >
            {statusMessage.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
            <span className="flex-1 font-medium">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tab 1: Phonebook List View */}
        {activeTab === 'phonebook' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
            {/* Native device picker banner & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search contacts by name, phone or language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-2 pl-8 pr-3 rounded-xl text-xs font-medium border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <button
                type="button"
                onClick={handleNativeContactPicker}
                disabled={isSyncing}
                className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Scan device contacts via Web Contacts API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Device Scan</span>
              </button>
            </div>

            {/* Selection Toolbar */}
            <div className="flex items-center justify-between text-xs py-1 px-1 mb-2 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
              <span>
                {selectedCount} of {phoneContacts.length} selected
              </span>
            </div>

            {/* Contacts Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70 pr-1 space-y-1">
              {filteredContacts.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-xs">No contacts match "{searchQuery}"</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleToggleContact(contact.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      contact.selected
                        ? isDark
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'bg-emerald-50 border border-emerald-100'
                        : isDark
                        ? 'hover:bg-slate-800/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        {contact.selected ? (
                          <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                              isDark ? 'border-slate-600' : 'border-slate-300'
                            }`}
                          />
                        )}
                      </div>

                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs sm:text-sm truncate">{contact.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                            {contact.nativeLanguage}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                          <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{contact.phoneNumber}</span>
                          {contact.email && (
                            <>
                              <span>•</span>
                              <span className="truncate">{contact.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-emerald-500 font-semibold text-xs ml-2">
                      {contact.selected && <UserCheck className="w-4 h-4" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Upload VCF / CSV */}
        {activeTab === 'upload' && (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDark
                  ? 'border-slate-700 hover:border-emerald-500 bg-slate-800/30'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-sm sm:text-base">Upload Phone Contacts File</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Import exported Android / iPhone vCard (<strong>.vcf</strong>) or <strong>.csv</strong> contacts list directly.
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-md hover:bg-emerald-600 cursor-pointer transition-transform active:scale-95"
              >
                Choose .VCF / .CSV File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".vcf,.csv,text/vcard,text/csv"
                className="hidden"
                onChange={handleFileUploaded}
              />
            </div>

            <div className="text-[11px] text-slate-400 text-left w-full space-y-1 bg-slate-100 dark:bg-slate-800/40 p-3 rounded-2xl">
              <p className="font-semibold text-slate-600 dark:text-slate-300">How to export from phone:</p>
              <p>• <strong>Android</strong>: Contacts app → Settings → Export to .vcf file</p>
              <p>• <strong>iPhone / iCloud</strong>: Contacts → Export vCard (.vcf)</p>
            </div>
          </div>
        )}

        {/* Tab 3: Manual Add Single Contact */}
        {activeTab === 'manual' && (
          <form onSubmit={handleAddManualContact} className="p-5 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Maria Gonzalez"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                required
                className={`w-full py-2 px-3 rounded-xl text-xs font-medium border focus:outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                placeholder="e.g. +1 555-234-5678"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                required
                className={`w-full py-2 px-3 rounded-xl text-xs font-medium border focus:outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Mother Tongue Language
                </label>
                <select
                  value={manualLanguage}
                  onChange={(e) => setManualLanguage(e.target.value)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-medium border focus:outline-none cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Arabic">Arabic</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Russian">Russian</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Bengali">Bengali</option>
                  <option value="English">English</option>
                  <option value="Italian">Italian</option>
                  <option value="Hausa">Hausa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="contact@email.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-medium border focus:outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md hover:bg-emerald-600 transition-colors cursor-pointer mt-2"
            >
              Add to Import List
            </button>
          </form>
        )}

        {/* Footer actions */}
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

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={selectedCount === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              selectedCount > 0
                ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Import {selectedCount} {selectedCount === 1 ? 'Contact' : 'Contacts'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
