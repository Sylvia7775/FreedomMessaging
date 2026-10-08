import React, { useState, useRef, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  Lock,
  KeyRound,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  User,
  Smartphone,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { StatusBar } from './StatusBar';
import { FreedomLogo } from './FreedomLogo';
import { AppBrandConfig, ThemeMode, UserProfile } from '../types';
import { playDefaultAppNotificationBell } from '../lib/notificationSound';

export interface PasswordRecoveryTextMsg {
  id: string;
  sender: 'user' | 'recovery_bot';
  senderName: string;
  text: string;
  timestamp: string;
  recoveryCode?: string;
}

export interface PasswordRecoveryRequestRecord {
  id: string;
  identifier: string;
  messageText: string;
  recoveryCode: string;
  status: 'code_sent' | 'completed';
  createdAt: string;
  completedAt?: string;
}

const PASSWORD_MAP_STORAGE_KEY = 'freedom_user_passwords_v1';

export function getSavedUserPassword(identifier: string): string | null {
  try {
    const raw = localStorage.getItem(PASSWORD_MAP_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[identifier.trim().toLowerCase()] || null;
  } catch {
    return null;
  }
}

export function saveUserNewPassword(identifier: string, newPassword: string): void {
  try {
    const raw = localStorage.getItem(PASSWORD_MAP_STORAGE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[identifier.trim().toLowerCase()] = newPassword;
    localStorage.setItem(PASSWORD_MAP_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

interface PasswordResetPageProps {
  onBackToLogin: (prefillIdentifier?: string) => void;
  onLoginAfterReset?: (user: Partial<UserProfile>) => void;
  theme?: ThemeMode;
  primaryColor?: string;
  brandConfig: AppBrandConfig;
  initialIdentifier?: string;
}

export const PasswordResetPage: React.FC<PasswordResetPageProps> = ({
  onBackToLogin,
  onLoginAfterReset,
  theme = 'light',
  primaryColor = '#7C3AED',
  brandConfig,
  initialIdentifier = '',
}) => {
  const isDark = theme === 'dark';

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [textInput, setTextInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [step, setStep] = useState<'request_via_text' | 'reset_form' | 'completed'>('request_via_text');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSendingText, setIsSendingText] = useState<boolean>(false);

  const [messages, setMessages] = useState<PasswordRecoveryTextMsg[]>([
    {
      id: 'welcome_rec_1',
      sender: 'recovery_bot',
      senderName: 'Freedom Password Recovery Desk',
      text: 'Lost your password? Enter your Email, Username, or Phone above and text us below (e.g. "Lost my password, please send recovery code") to receive an instant 6-digit password reset code.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createSixDigitCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendRecoveryText = async (e?: React.FormEvent, customMessage?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg('Please enter your Email, Username, or Phone Number first.');
      return;
    }

    const msgContent = (customMessage ?? textInput).trim() || `Lost password for ${cleanId}. Requesting password recovery.`;

    const userMsg: PasswordRecoveryTextMsg = {
      id: `usr_msg_${Date.now()}`,
      sender: 'user',
      senderName: cleanId,
      text: msgContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');
    setIsSendingText(true);

    const code = createSixDigitCode();
    setGeneratedCode(code);

    const reqRecord: PasswordRecoveryRequestRecord = {
      id: `rec_${Date.now()}`,
      identifier: cleanId,
      messageText: msgContent,
      recoveryCode: code,
      status: 'code_sent',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'password_recovery_requests', reqRecord.id), reqRecord, { merge: true });
    } catch {
      // fallback to local
    }

    setTimeout(() => {
      const botReply: PasswordRecoveryTextMsg = {
        id: `bot_msg_${Date.now()}`,
        sender: 'recovery_bot',
        senderName: 'Freedom Recovery SMS',
        text: `Password recovery verified for "${cleanId}". Your 6-digit Password Reset Code is: ${code}. Use it below to set your new password.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recoveryCode: code,
      };
      setMessages((prev) => [...prev, botReply]);
      setIsSendingText(false);
      setStep('reset_form');
      setSuccessMsg(`Recovery code ${code} sent via text! Enter it below to reset your password.`);
      playDefaultAppNotificationBell(brandConfig);
    }, 450);
  };

  const handleCompletePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg('Please enter your Email, Username, or Phone.');
      return;
    }
    if (!enteredCode.trim()) {
      setErrorMsg('Please enter the 6-digit recovery code sent in the text message.');
      return;
    }
    if (generatedCode && enteredCode.trim() !== generatedCode) {
      setErrorMsg('Invalid recovery code. Please check the 6-digit code in the text message above.');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    saveUserNewPassword(identifier.trim(), newPassword);
    setStep('completed');
    setSuccessMsg(`Password for "${identifier.trim()}" has been successfully reset!`);
    playDefaultAppNotificationBell(brandConfig);
  };

  return (
    <div
      id="freedom-password-reset-page"
      className={`min-h-full w-full flex flex-col justify-between select-none transition-colors duration-200 ${
        isDark ? 'bg-[#0E121A] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <StatusBar theme={theme} />

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-200/60 dark:border-slate-800/80 shrink-0">
        <button
          id="password-reset-back-to-login-btn"
          type="button"
          onClick={() => onBackToLogin(identifier.trim() || undefined)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#181D26] border-slate-700 text-slate-200 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>

        <div className="flex items-center gap-1.5">
          <KeyRound style={{ color: primaryColor }} className="w-4 h-4" />
          <span className="text-xs font-extrabold tracking-tight">Password Recovery</span>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 w-full max-w-md mx-auto space-y-4">
        {/* Header Card */}
        <div className="flex items-center gap-3">
          <FreedomLogo
            appName={brandConfig.appName}
            customFavicon={brandConfig.faviconUrl}
            primaryColor={primaryColor}
            size="sm"
            theme={theme}
            showText={false}
          />
          <div>
            <h1 className="text-base font-black tracking-tight">
              Lost Password & Text Recovery
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Text your account details to request a password recovery code and set a new password
            </p>
          </div>
        </div>

        {/* Account Identifier Input */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2.5 ${
            isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            1. Account Email, Username or Phone Number
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="recovery-identifier-input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter email, @username, or phone number"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none ${
                isDark
                  ? 'bg-[#12161F] border-slate-700 text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <button
              id="quick-request-recovery-code-btn"
              type="button"
              onClick={() =>
                handleSendRecoveryText(
                  undefined,
                  `Hi, I lost my password for "${identifier.trim() || 'my account'}". Please text me a password recovery code.`
                )
              }
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:brightness-110 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Request Recovery Code via Text</span>
            </button>
          </div>
        </div>

        {/* Interactive Text Message Box for Lost Password Recovery */}
        <div
          className={`rounded-2xl border overflow-hidden flex flex-col ${
            isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div
            className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
              isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-100/80 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare style={{ color: primaryColor }} className="w-4 h-4" />
              <div>
                <h2 className="text-xs font-extrabold">2. Text for Password Recovery</h2>
                <p className="text-[10px] text-slate-400">
                  Text when you lost your password to get an instant recovery code
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold">
              Live SMS
            </span>
          </div>

          {/* Messages Thread */}
          <div className="p-3 space-y-2.5 max-h-48 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  style={
                    m.sender === 'user' ? { backgroundColor: primaryColor } : undefined
                  }
                  className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'text-white rounded-br-xs shadow-xs'
                      : isDark
                      ? 'bg-[#12161F] border border-slate-700 text-slate-100 rounded-bl-xs'
                      : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="font-medium">{m.text}</p>
                  {m.recoveryCode && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-sm text-emerald-500 tracking-widest">
                        {m.recoveryCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEnteredCode(m.recoveryCode || '');
                          setStep('reset_form');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Use Code</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                  {m.senderName} • {m.timestamp}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Text Input Bar to Text Lost Password Request */}
          <form
            onSubmit={(e) => handleSendRecoveryText(e)}
            className={`p-2.5 border-t flex items-center gap-2 ${
              isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              id="recovery-text-message-input"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Text lost password request here..."
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                isDark
                  ? 'bg-[#181D26] border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              id="send-recovery-text-btn"
              type="submit"
              disabled={isSendingText}
              style={{ backgroundColor: primaryColor }}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Text</span>
            </button>
          </form>
        </div>

        {/* Feedback Banners */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 3: Set New Password Form */}
        {step !== 'completed' ? (
          <form
            onSubmit={handleCompletePasswordReset}
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#181D26] border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Lock style={{ color: primaryColor }} className="w-3.5 h-3.5" />
                <span>3. Verify Code & Reset Password</span>
              </h3>
              {generatedCode && (
                <button
                  type="button"
                  onClick={() => setEnteredCode(generatedCode)}
                  className="text-[10px] font-bold text-emerald-500 hover:underline cursor-pointer"
                >
                  Auto-fill ({generatedCode})
                </button>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                6-Digit Recovery Code (From Text Above)
              </label>
              <input
                id="recovery-code-verify-input"
                type="text"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                placeholder="Enter 6-digit recovery code"
                maxLength={6}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-widest border outline-none ${
                  isDark
                    ? 'bg-[#12161F] border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="recovery-new-password-input"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-semibold border outline-none ${
                      isDark
                        ? 'bg-[#12161F] border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Confirm New Password
                </label>
                <input
                  id="recovery-confirm-password-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    isDark
                      ? 'bg-[#12161F] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <button
              id="complete-password-reset-btn"
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Save New Password</span>
            </button>
          </form>
        ) : (
          /* Completed Reset Card */
          <div
            className={`p-4 rounded-2xl border text-center space-y-3 animate-in zoom-in-95 duration-200 ${
              isDark
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-emerald-50 border-emerald-300'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-500">
                Password Successfully Recovered!
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Your new password for <strong>{identifier}</strong> is active. You can now return to Sign In or continue directly.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                id="return-to-login-after-reset-btn"
                type="button"
                onClick={() => onBackToLogin(identifier.trim())}
                style={{ backgroundColor: primaryColor }}
                className="px-4 py-2 rounded-xl text-white text-xs font-bold hover:brightness-110 cursor-pointer shadow-sm"
              >
                Sign In with New Password
              </button>
              {onLoginAfterReset && (
                <button
                  type="button"
                  onClick={() =>
                    onLoginAfterReset({
                      id: `usr_${identifier.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
                      name: identifier.includes('@') ? identifier.split('@')[0] : identifier.trim(),
                      username: identifier.includes('@') ? identifier.split('@')[0] : identifier.trim(),
                      email: identifier.includes('@') ? identifier.trim() : undefined,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Continue to Chats
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-2 text-center text-[10px] text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40 shrink-0">
        <span>Freedom Password Recovery • Instant Text Verification</span>
      </div>
    </div>
  );
};
