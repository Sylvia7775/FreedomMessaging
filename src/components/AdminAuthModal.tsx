import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  X,
  ArrowRight,
  UserCheck,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { ThemeMode } from '../types';
import { ADMIN_EMAIL, ADMIN_PASSWORD, signInWithGoogleAuth } from '../lib/firebase';
import {
  verifyTwoFactorCode,
  generateTotpCode,
  getRemainingSeconds,
  ADMIN_2FA_DEFAULT_SECRET,
  ADMIN_2FA_DEFAULT_BACKUP_CODES,
  getAdminTwoFactorConfig,
} from '../lib/twoFactorAuth';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
  adminEmail?: string;
  theme?: ThemeMode;
  primaryColor?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onVerifySuccess,
  adminEmail = ADMIN_EMAIL,
  theme = 'light',
  primaryColor = '#7C3AED',
}) => {
  const isDark = theme === 'dark';
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // 2FA state
  const [twoFactorDigits, setTwoFactorDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [currentTotpHint, setCurrentTotpHint] = useState('');
  const [adminSecret, setAdminSecret] = useState(ADMIN_2FA_DEFAULT_SECRET);
  const [adminBackupCodes, setAdminBackupCodes] = useState(ADMIN_2FA_DEFAULT_BACKUP_CODES);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Load config on open
  useEffect(() => {
    if (isOpen) {
      getAdminTwoFactorConfig().then((cfg) => {
        setAdminSecret(cfg.secret || ADMIN_2FA_DEFAULT_SECRET);
        setAdminBackupCodes(cfg.backupCodes || ADMIN_2FA_DEFAULT_BACKUP_CODES);
      });
      setStep('credentials');
      setPassword('');
      setErrorMsg(null);
      setTwoFactorDigits(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  // Live TOTP timer
  useEffect(() => {
    if (!isOpen || step !== '2fa') return;
    const update = async () => {
      setRemainingSeconds(getRemainingSeconds());
      const code = await generateTotpCode(adminSecret);
      setCurrentTotpHint(code);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isOpen, step, adminSecret]);

  if (!isOpen) return null;

  // Handle Admin Password verification: "B45$y5via"
  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter the admin password');
      return;
    }

    if (password.trim() === ADMIN_PASSWORD || password.trim() === 'B45$y5via') {
      setIsVerifying(true);
      setErrorMsg(null);
      setTimeout(() => {
        setIsVerifying(false);
        setStep('2fa');
        setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
      }, 350);
    } else {
      setErrorMsg('Invalid admin credentials. Please enter the correct password.');
    }
  };

  // Google Sign-In as Admin
  const handleGoogleAdminSignIn = async () => {
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const { user, isAdmin } = await signInWithGoogleAuth();
      if (isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setStep('2fa');
        setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
      } else {
        setErrorMsg(`Signed in as ${user.email}, but this account is not the authorized Super Admin (${ADMIN_EMAIL}).`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // 2FA Verification Handler
  const handleVerify2FaCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const inputCode = useBackup ? backupCode.trim() : twoFactorDigits.join('');

    if (!inputCode) {
      setErrorMsg(useBackup ? 'Enter emergency backup code' : 'Enter 6-digit TOTP code');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const result = await verifyTwoFactorCode(adminSecret, inputCode, adminBackupCodes);
      if (result.valid) {
        setTimeout(() => {
          setIsVerifying(false);
          onVerifySuccess();
          onClose();
        }, 300);
      } else {
        setIsVerifying(false);
        setErrorMsg(result.message || 'Invalid 2FA code. Please check your authenticator.');
      }
    } catch {
      setIsVerifying(false);
      setErrorMsg('Error verifying 2FA. Please try again.');
    }
  };

  const handleOtpInput = (index: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const updated = [...twoFactorDigits];
      digits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      setTwoFactorDigits(updated);
      otpInputsRef.current[Math.min(digits.length, 5)]?.focus();
      if (digits.length === 6) {
        setTimeout(() => handleVerify2FaCode(), 100);
      }
      return;
    }

    const digit = val.replace(/\D/g, '');
    const updated = [...twoFactorDigits];
    updated[index] = digit;
    setTwoFactorDigits(updated);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
    if (digit && index === 5 && updated.every((d) => d !== '')) {
      setTimeout(() => handleVerify2FaCode(), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !twoFactorDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border space-y-5 ${
          isDark ? 'bg-[#181D26] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {step === '2fa' ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {step === '2fa' ? '2FA Security Verification' : 'Admin Authorization'}
              </h3>
              <p className="text-xs text-slate-400">
                {step === '2fa' ? 'Step 2: Authenticator App Code' : 'Freedom Control Panel Gate'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Info Card */}
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-slate-200 dark:text-slate-100">
              Super Administrator Account
            </span>
            <span className="text-slate-400">
              Designated Admin: <span className="font-mono text-emerald-400 font-bold">{adminEmail}</span>
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: PASSWORD / GOOGLE */}
        {step === 'credentials' ? (
          <>
            {/* Google Admin Sign-in Button */}
            <button
              type="button"
              id="admin-google-auth-btn"
              onClick={handleGoogleAdminSignIn}
              disabled={isVerifying}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12161F] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Verify with Google ({adminEmail})</span>
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
              <span className="text-[11px] text-slate-400 font-bold uppercase">or enter admin password</span>
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Enter Admin Password Form */}
            <form onSubmit={handleVerifyPassword} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Admin Password</span>
                  <span className="text-[10px] text-slate-400">Account: {adminEmail}</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="admin-passcode-input"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Enter password"
                    autoFocus
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono font-semibold border focus:outline-none focus:ring-2 ${
                      isDark
                        ? 'bg-[#12161F] border-slate-700 text-white focus:ring-emerald-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <button
                id="admin-verify-btn"
                type="submit"
                disabled={isVerifying}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isVerifying ? 'Checking password...' : 'Proceed to 2FA Step'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          /* STEP 2: 2FA TOTP VERIFICATION */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Time Remaining:{' '}
                <strong className="text-emerald-400 font-mono">{remainingSeconds}s</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                Change Password
              </button>
            </div>

            {!useBackup ? (
              <form onSubmit={handleVerify2FaCode} className="space-y-3.5">
                <div className="flex items-center justify-center gap-2">
                  {twoFactorDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpInput(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-14 text-center text-lg font-mono font-bold rounded-xl border-2 outline-none transition-all ${
                        digit
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : isDark
                          ? 'bg-[#12161F] border-slate-700 text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  ))}
                </div>

                {/* Quick live code fill button */}
                {currentTotpHint && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorDigits(currentTotpHint.split(''));
                        setErrorMsg(null);
                        setTimeout(() => handleVerify2FaCode(), 100);
                      }}
                      className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Quick Test: Fill Live TOTP ({currentTotpHint})</span>
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isVerifying ? 'Verifying 2FA...' : 'Unlock Admin Control Panel'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify2FaCode} className="space-y-3">
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="e.g. SKY987-2FA-2026"
                  autoFocus
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold border ${
                    isDark ? 'bg-[#12161F] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isVerifying}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isVerifying ? 'Verifying...' : 'Verify Backup Code'}</span>
                </button>
              </form>
            )}

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setUseBackup(!useBackup);
                  setErrorMsg(null);
                }}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                {useBackup ? 'Use 6-digit Authenticator code' : 'Use emergency recovery code instead'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
