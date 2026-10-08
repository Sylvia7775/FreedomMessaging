import React, { useState } from 'react';
import {
  Info,
  FileText,
  MessageSquarePlus,
  Briefcase,
  ShieldCheck,
  ArrowLeft,
  Globe,
  Lock,
  Sparkles,
  Users,
  Video,
  CheckCircle2,
  Star,
  Send,
  MapPin,
  Clock,
  ChevronRight,
  Heart,
  Smartphone,
  Mail,
  Award,
} from 'lucide-react';
import { AppBrandConfig, FooterPageTab, ScreenView, ThemeMode } from '../types';
import { FreedomLogo } from './FreedomLogo';
import { StatusBar } from './StatusBar';
import { BottomNav } from './BottomNav';

interface FeedbackEntry {
  id: string;
  name: string;
  email: string;
  category: string;
  rating: number;
  message: string;
  createdAt: string;
}

const INITIAL_COMMUNITY_FEEDBACK: FeedbackEntry[] = [
  {
    id: 'fb_1',
    name: 'Kristin Watson',
    email: 'kristin@example.com',
    category: 'Translation Accuracy',
    rating: 5,
    message:
      'Instant mother-language translation inside group chats makes talking with our international team effortless!',
    createdAt: '2 days ago',
  },
  {
    id: 'fb_2',
    name: 'Jacob Jones',
    email: 'jacob@example.com',
    category: 'Feature Request',
    rating: 5,
    message:
      'Love the new video thumbnail generator and full-screen rotatable media player. Super smooth experience.',
    createdAt: '5 days ago',
  },
];

const OPEN_CAREER_ROLES = [
  {
    id: 'role_cordova',
    title: 'Senior Android & Apache Cordova Engineer',
    department: 'Mobile Engineering',
    location: 'Remote (Worldwide)',
    type: 'Full-Time',
    summary:
      'Lead native Android APK packaging, WebRTC audio/video calling optimization, and offline-first storage.',
  },
  {
    id: 'role_translation',
    title: 'Real-Time AI & Multilingual Translation Engineer',
    department: 'AI & Language Systems',
    location: 'Remote (Worldwide)',
    type: 'Full-Time',
    summary:
      'Build low-latency neural translation pipelines and natural AI voice synthesis across 40+ global languages.',
  },
  {
    id: 'role_design',
    title: 'Senior Mobile Product Designer (UI/UX)',
    department: 'Design & Experience',
    location: 'Remote (Europe / Americas / APAC)',
    type: 'Full-Time',
    summary:
      'Craft intuitive, accessible messaging interfaces, custom group themes, and interactive media experiences.',
  },
  {
    id: 'role_trust',
    title: 'Trust, Safety & Community Moderation Specialist',
    department: 'Security & Governance',
    location: 'Remote (Worldwide)',
    type: 'Full-Time',
    summary:
      'Empower group admins with smart moderation tools while safeguarding user privacy and encryption standards.',
  },
];

export interface AppFooterLinksProps {
  onSelectTab: (tab: FooterPageTab) => void;
  activeTab?: FooterPageTab | null;
  appName?: string;
  isDark?: boolean;
  primaryColor?: string;
  compact?: boolean;
}

export const AppFooterLinks: React.FC<AppFooterLinksProps> = ({
  onSelectTab,
  activeTab = null,
  appName = 'WeedChat',
  isDark = true,
  primaryColor = '#7C3AED',
  compact = false,
}) => {
  const currentYear = new Date().getFullYear();

  const links: { id: FooterPageTab; label: string }[] = [
    { id: 'about', label: 'About' },
    { id: 'terms', label: 'Terms and Conditions' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'careers', label: 'Careers' },
    { id: 'policy', label: 'Policy' },
  ];

  return (
    <footer
      id="app-global-footer"
      className={`w-full select-none transition-colors ${
        compact ? 'px-3 py-1.5' : 'px-4 py-3'
      } ${
        isDark
          ? 'bg-[#0E121A]/95 border-t border-slate-800/70 text-slate-400'
          : 'bg-slate-100/90 border-t border-slate-200/80 text-slate-600'
      }`}
    >
      <div className="max-w-md mx-auto flex flex-col items-center gap-1.5 text-center">
        {/* Page Links Row */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] sm:text-[11px] font-semibold">
          {links.map((link, idx) => {
            const isActive = activeTab === link.id;
            return (
              <React.Fragment key={link.id}>
                <button
                  type="button"
                  id={`footer-link-${link.id}`}
                  onClick={() => onSelectTab(link.id)}
                  style={isActive ? { color: primaryColor } : undefined}
                  className={`cursor-pointer transition-colors hover:underline ${
                    isActive
                      ? 'font-extrabold underline'
                      : isDark
                      ? 'text-slate-300 hover:text-emerald-400'
                      : 'text-slate-600 hover:text-emerald-600'
                  }`}
                >
                  {link.label}
                </button>
                {idx < links.length - 1 && (
                  <span className="opacity-40 select-none" aria-hidden="true">
                    •
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Copyright Row with Year */}
        <div className="text-[10px] font-medium opacity-80 flex items-center justify-center gap-1 flex-wrap">
          <span>
            © {currentYear} {appName}. All Rights Reserved.
          </span>
          <span className="hidden sm:inline opacity-50">•</span>
          <span className="hidden sm:inline text-[9px] opacity-75">
             Copy Rights {currentYear}
          </span>
        </div>
      </div>
    </footer>
  );
};

interface AboutAndInfoPagesProps {
  initialTab?: FooterPageTab;
  onBack: () => void;
  onNavigate?: (screen: ScreenView) => void;
  brandConfig: AppBrandConfig;
  theme?: ThemeMode;
  primaryColor?: string;
  showBottomNav?: boolean;
  isAdminVerified?: boolean;
  userAvatar?: string;
}

export const AboutAndInfoPages: React.FC<AboutAndInfoPagesProps> = ({
  initialTab = 'about',
  onBack,
  onNavigate,
  brandConfig,
  theme = 'dark',
  primaryColor = '#7C3AED',
  showBottomNav = false,
  isAdminVerified = false,
  userAvatar,
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<FooterPageTab>(initialTab);

  // Sync when initialTab changes externally
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Feedback form state
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>(() => {
    try {
      const saved = localStorage.getItem('freedom_user_feedback_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_COMMUNITY_FEEDBACK;
  });
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbCategory, setFbCategory] = useState('General Feedback');
  const [fbRating, setFbRating] = useState(5);
  const [fbMessage, setFbMessage] = useState('');
  const [fbSubmittedToast, setFbSubmittedToast] = useState<string | null>(null);

  // Careers application state
  const [applyingRoleId, setApplyingRoleId] = useState<string | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPortfolio, setApplicantPortfolio] = useState('');
  const [applicantNote, setApplicantNote] = useState('');
  const [careerToast, setCareerToast] = useState<string | null>(null);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbMessage.trim()) return;

    const newEntry: FeedbackEntry = {
      id: `fb_${Date.now()}`,
      name: fbName.trim() || 'Community Member',
      email: fbEmail.trim() || 'member@freedom.app',
      category: fbCategory,
      rating: fbRating,
      message: fbMessage.trim(),
      createdAt: 'Just now',
    };

    const updated = [newEntry, ...feedbackList];
    setFeedbackList(updated);
    try {
      localStorage.setItem('freedom_user_feedback_list', JSON.stringify(updated));
    } catch {}

    setFbMessage('');
    setFbSubmittedToast('Thank you! Your feedback has been submitted and saved.');
    setTimeout(() => setFbSubmittedToast(null), 3500);
  };

  const handleCareerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = OPEN_CAREER_ROLES.find((r) => r.id === applyingRoleId);
    setCareerToast(
      `Application received for ${role?.title || 'Open Position'}! Our talent team will contact ${
        applicantEmail || 'you'
      }.`
    );
    setApplyingRoleId(null);
    setApplicantName('');
    setApplicantEmail('');
    setApplicantPortfolio('');
    setApplicantNote('');
    setTimeout(() => setCareerToast(null), 4000);
  };

  const tabs: { id: FooterPageTab; label: string; icon: React.ReactNode }[] = [
    { id: 'about', label: 'About', icon: <Info className="w-3.5 h-3.5" /> },
    { id: 'terms', label: 'Terms & Conditions', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquarePlus className="w-3.5 h-3.5" /> },
    { id: 'careers', label: 'Careers', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'policy', label: 'Policy', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div
      id="about-and-info-pages"
      className={`w-full h-full flex flex-col select-none transition-colors duration-200 overflow-hidden ${
        isDark ? 'bg-[#0E121A] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <StatusBar theme={theme} />

      {/* Top Navigation Bar */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#141923] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            id="about-page-back-btn"
            onClick={onBack}
            className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm sm:text-base truncate flex items-center gap-1.5">
              <span>{brandConfig.appName}</span>
              <span
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              >
                {tabs.find((t) => t.id === activeTab)?.label}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              Official Information, Legal Terms, Feedback & Careers
            </p>
          </div>
        </div>

        <FreedomLogo
          appName={brandConfig.appName}
          customFavicon={brandConfig.faviconUrl}
          primaryColor={primaryColor}
          size="sm"
          theme={theme}
          showText={false}
        />
      </div>

      {/* Horizontal Page Switcher Tabs */}
      <div
        className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 ${
          isDark ? 'bg-[#111620] border-slate-800/80' : 'bg-slate-100 border-slate-200'
        }`}
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`info-tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={isSelected ? { backgroundColor: primaryColor } : undefined}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'text-white shadow-sm'
                  : isDark
                  ? 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 max-w-2xl mx-auto w-full">
        {/* ============================================================== */}
        {/* 1. ABOUT PAGE                                                  */}
        {/* ============================================================== */}
        {activeTab === 'about' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Hero Card */}
            <div
              className={`p-5 rounded-3xl border relative overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-br from-[#181F2E] via-[#151A26] to-[#1E1633] border-slate-800'
                  : 'bg-gradient-to-br from-white via-slate-50 to-purple-50 border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <FreedomLogo
                  appName={brandConfig.appName}
                  customFavicon={brandConfig.faviconUrl}
                  primaryColor={primaryColor}
                  size="lg"
                  theme={theme}
                  showText={false}
                />
                <div className="space-y-1.5 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" />
                    <span>Version 2.5.0 • {currentYear} Official Release</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight">{brandConfig.appName}</h2>
                  <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-300">
                    {brandConfig.appDescription ||
                      'Next-generation multilingual messaging platform engineered to connect people across every language with instant translation, HD voice/video calling, rich group collaboration, and 2FA security.'}
                  </p>
                </div>
              </div>

              {/* Key Highlights Strip */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-700/40 text-center">
                <div className="p-2 rounded-2xl bg-black/20">
                  <p className="text-base font-black text-emerald-400">40+</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Live Languages</p>
                </div>
                <div className="p-2 rounded-2xl bg-black/20">
                  <p className="text-base font-black text-purple-400">E2EE + 2FA</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Protected Auth</p>
                </div>
                <div className="p-2 rounded-2xl bg-black/20">
                  <p className="text-base font-black text-sky-400">HD Media</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Voice & Video</p>
                </div>
              </div>
            </div>

            {/* Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`p-4 rounded-2xl border space-y-1.5 ${
                  isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-extrabold">Real-Time Mother-Language Translation</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Speak and type naturally in your native language while friends and group members read messages translated into theirs automatically.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-1.5 ${
                  isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-extrabold">Community Groups & Media Gallery</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Join vibrant groups, browse shared group media galleries, customize group covers, and manage members with Admin & Moderator controls.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-1.5 ${
                  isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-extrabold">Smart Video Player & Thumbnails</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Share YouTube, Vimeo, TikTok, or direct videos with clean automatic video thumbnails, full-screen playback, 360° rotation, and device downloads.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-1.5 ${
                  isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-extrabold">Apache Cordova & TOTP Security</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Built for mobile reliability with Apache Cordova Android APK support, PIN-locked messages, and 6-digit Authenticator 2FA protection.
                </p>
              </div>
            </div>

            {/* Quick Navigation Cards to Other Info Pages */}
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Explore {brandConfig.appName} Resources
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {tabs
                  .filter((t) => t.id !== 'about')
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isDark
                          ? 'bg-slate-900/70 border-slate-800 hover:border-emerald-500/50 text-slate-200'
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-500 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span style={{ color: primaryColor }}>{item.icon}</span>
                        <span className="text-xs font-bold truncate">{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. TERMS AND CONDITIONS PAGE                                   */}
        {/* ============================================================== */}
        {activeTab === 'terms' && (
          <div
            className={`p-5 rounded-3xl border space-y-4 animate-in fade-in duration-150 ${
              isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700/40">
              <div
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">Terms and Conditions</h2>
                <p className="text-[11px] text-slate-400">
                  Last Updated: October {currentYear} • Applies to all {brandConfig.appName} users
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs leading-relaxed text-slate-300 dark:text-slate-300">
              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                <h3 className="font-extrabold text-white">1. Acceptance of Terms</h3>
                <p className="text-[11px] text-slate-400">
                  By creating an account, signing in, or using {brandConfig.appName}, you agree to abide by these Terms and Conditions and our Community Safety Standards.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                <h3 className="font-extrabold text-white">2. Account Security & Two-Factor Authentication (2FA)</h3>
                <p className="text-[11px] text-slate-400">
                  You are responsible for safeguarding your password, 6-digit TOTP authenticator codes, and emergency recovery tokens. {brandConfig.appName} provides built-in 2FA and message PIN locks to protect your account against unauthorized access.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                <h3 className="font-extrabold text-white">3. Group Administration & Member Conduct</h3>
                <p className="text-[11px] text-slate-400">
                  Group Admins and Moderators are authorized to manage group covers, moderate discussions, temporarily suspend, or permanently ban accounts that violate community guidelines. Media shared inside a Group Gallery may only be shared with fellow members of that group.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                <h3 className="font-extrabold text-white">4. User-Uploaded Avatars, Covers & Media</h3>
                <p className="text-[11px] text-slate-400">
                  You retain ownership of photos, profile avatars, custom wallpapers, voice notes, and videos you upload. By sharing content in chats or groups, you grant recipients permission to view and play that media within the application.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                <h3 className="font-extrabold text-white">5. Intellectual Property & Copyright</h3>
                <p className="text-[11px] text-slate-400">
                  All platform branding, logos, translation workflows, and software architecture are © {currentYear} {brandConfig.appName}. All Rights Reserved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. FEEDBACK PAGE                                               */}
        {/* ============================================================== */}
        {activeTab === 'feedback' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div
              className={`p-5 rounded-3xl border space-y-4 ${
                isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold">Share Your Feedback</h2>
                  <p className="text-[11px] text-slate-400">
                    Help us improve {brandConfig.appName} — report bugs, request features, or rate your experience
                  </p>
                </div>
              </div>

              {fbSubmittedToast && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{fbSubmittedToast}</span>
                </div>
              )}

              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                {/* Star Rating Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Rate Your Experience
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFbRating(star)}
                        className="p-1.5 rounded-xl hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= fbRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-1">
                      {fbRating}.0 / 5.0
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={fbName}
                      onChange={(e) => setFbName(e.target.value)}
                      placeholder="e.g. Abdullah"
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${
                        isDark
                          ? 'bg-[#0E121A] border-slate-700 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Category
                    </label>
                    <select
                      value={fbCategory}
                      onChange={(e) => setFbCategory(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${
                        isDark
                          ? 'bg-[#0E121A] border-slate-700 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="General Feedback">General Feedback</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Translation Accuracy">Translation Accuracy</option>
                      <option value="UI & Experience">UI & Experience</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Feedback Message
                  </label>
                  <textarea
                    rows={3}
                    value={fbMessage}
                    onChange={(e) => setFbMessage(e.target.value)}
                    placeholder="Tell us what you love or what we should build next..."
                    required
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium border resize-none ${
                      isDark
                        ? 'bg-[#0E121A] border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  id="submit-feedback-btn"
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Feedback</span>
                </button>
              </form>
            </div>

            {/* Community Feedback Feed */}
            <div
              className={`p-4 rounded-3xl border space-y-3 ${
                isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Recent Community Feedback ({feedbackList.length})
              </h3>
              <div className="space-y-2.5">
                {feedbackList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border space-y-1 ${
                      isDark ? 'bg-black/25 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{item.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{item.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3 h-3 ${
                            idx < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-300 dark:text-slate-300 pt-0.5">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. CAREERS PAGE                                                */}
        {/* ============================================================== */}
        {activeTab === 'careers' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div
              className={`p-5 rounded-3xl border space-y-3 ${
                isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                >
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold">Careers at {brandConfig.appName}</h2>
                  <p className="text-[11px] text-slate-400">
                    Join our global remote team building the future of borderless human communication
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-center">
                  <Globe className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[11px] font-bold">100% Remote</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-center">
                  <Heart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                  <p className="text-[11px] font-bold">Full Wellness</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-center">
                  <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-[11px] font-bold">Equity Grants</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-center">
                  <Clock className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                  <p className="text-[11px] font-bold">Flexible Hours</p>
                </div>
              </div>
            </div>

            {careerToast && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{careerToast}</span>
              </div>
            )}

            {/* Open Positions List */}
            <div className="space-y-2.5">
              {OPEN_CAREER_ROLES.map((role) => {
                const isApplying = applyingRoleId === role.id;
                return (
                  <div
                    key={role.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {role.department}
                        </span>
                        <h3 className="text-sm font-extrabold mt-0.5">{role.title}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {role.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {role.type}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setApplyingRoleId(isApplying ? null : role.id)}
                        style={{ backgroundColor: isApplying ? undefined : primaryColor }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                          isApplying
                            ? 'bg-slate-800 text-slate-300'
                            : 'text-white shadow-sm hover:brightness-110'
                        }`}
                      >
                        {isApplying ? 'Close Form' : 'Apply Now'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{role.summary}</p>

                    {isApplying && (
                      <form
                        onSubmit={handleCareerSubmit}
                        className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            value={applicantName}
                            onChange={(e) => setApplicantName(e.target.value)}
                            placeholder="Full Name"
                            className="px-3 py-2 rounded-xl text-xs bg-black/30 border border-slate-700 text-white"
                          />
                          <input
                            type="email"
                            required
                            value={applicantEmail}
                            onChange={(e) => setApplicantEmail(e.target.value)}
                            placeholder="Email Address"
                            className="px-3 py-2 rounded-xl text-xs bg-black/30 border border-slate-700 text-white"
                          />
                        </div>
                        <input
                          type="text"
                          value={applicantPortfolio}
                          onChange={(e) => setApplicantPortfolio(e.target.value)}
                          placeholder="GitHub / LinkedIn / Portfolio Link (optional)"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-slate-700 text-white"
                        />
                        <textarea
                          rows={2}
                          value={applicantNote}
                          onChange={(e) => setApplicantNote(e.target.value)}
                          placeholder="Brief introduction..."
                          className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-slate-700 text-white resize-none"
                        />
                        <button
                          type="submit"
                          style={{ backgroundColor: primaryColor }}
                          className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer hover:brightness-110"
                        >
                          Submit Application
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. PRIVACY & SECURITY POLICY PAGE                              */}
        {/* ============================================================== */}
        {activeTab === 'policy' && (
          <div
            className={`p-5 rounded-3xl border space-y-4 animate-in fade-in duration-150 ${
              isDark ? 'bg-[#151A24] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700/40">
              <div
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">Privacy & Security Policy</h2>
                <p className="text-[11px] text-slate-400">
                  How {brandConfig.appName} protects your personal data, avatars, and private conversations
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-emerald-400">
                  <Lock className="w-4 h-4" />
                  <h3>1. End-to-End Privacy & PIN Protection</h3>
                </div>
                <p className="text-[11px] text-slate-400">
                  Private messages, voice notes, and calls are designed for maximum confidentiality. Users can additionally lock sensitive messages or contributions with a personal PIN code.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                <h3 className="font-extrabold text-white">2. Real Avatar & Media Persistence</h3>
                <p className="text-[11px] text-slate-400">
                  When you upload a Profile Avatar, Profile Cover, Custom Wallpaper, or chat image, your uploaded media is compressed and persisted directly to your profile and database record so it displays reliably across sessions without mock placeholders.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                <h3 className="font-extrabold text-white">3. Zero Third-Party Data Selling</h3>
                <p className="text-[11px] text-slate-400">
                  {brandConfig.appName} never sells, rents, or monetizes your personal conversations, contact lists, or media attachments to third-party advertisers.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                <h3 className="font-extrabold text-white">4. Camera, Microphone & Contact Permissions</h3>
                <p className="text-[11px] text-slate-400">
                  Camera and microphone permissions are accessed strictly when you initiate a voice/video call, scan a QR code, or capture media. You can delete your uploaded media or clear your profile data at any time.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-semibold">
                    Privacy Officer Contact: privacy@freedommessaging.app
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">© {currentYear}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Links + Copyright Year inside the About/Info Pages */}
      <AppFooterLinks
        onSelectTab={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
        appName={brandConfig.appName}
        isDark={isDark}
        primaryColor={primaryColor}
      />

      {showBottomNav && onNavigate && (
        <BottomNav
          currentScreen="about"
          onNavigate={onNavigate}
          theme={theme}
          isAdminVerified={isAdminVerified}
          primaryColor={primaryColor}
          userAvatar={userAvatar}
        />
      )}
    </div>
  );
};
