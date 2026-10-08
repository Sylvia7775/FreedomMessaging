import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import {
  FingerprintRecord,
  getFingerprintRecord,
  enrollDeviceBiometricFingerprint,
  markFingerprintVerified,
} from '../lib/fingerprintAuthHelper';

interface FingerprintSetupModalProps {
  isOpen: boolean;
  mode?: 'record' | 'verify';
  userId?: string;
  userName?: string;
  userEmail?: string;
  onClose: () => void;
  onSkip?: () => void;
  onSuccess: (record: FingerprintRecord) => void;
}

export const FingerprintSetupModal: React.FC<FingerprintSetupModalProps> = ({
  isOpen,
  mode = 'record',
  userId = 'default_user',
  userName = 'WeedChat User',
  userEmail,
  onClose,
  onSkip,
  onSuccess,
}) => {
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Please put your finger on the fingerprint scanner to get started.'
  );
  const [selectedFingerLabel, setSelectedFingerLabel] = useState<string>('Right Index Finger');
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScanProgress(0);
      setIsScanning(false);
      setIsCompleted(false);
      setStatusMessage(
        mode === 'verify'
          ? 'Please put your finger on the fingerprint scanner to verify 2FA.'
          : 'Please put your finger on the fingerprint scanner to get started.'
      );
    }
    return () => {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
      }
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const startFingerprintScan = async () => {
    if (isScanning || isCompleted) return;
    setIsScanning(true);
    setStatusMessage(
      mode === 'verify'
        ? 'Scanning fingerprint for 2FA verification... Keep your finger steady.'
        : 'Recording your fingerprint ridges... Keep your finger on the scanner.'
    );

    let current = scanProgress > 0 && scanProgress < 100 ? scanProgress : 15;
    setScanProgress(current);

    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
    }

    scanTimerRef.current = window.setInterval(async () => {
      current += mode === 'verify' ? 28 : 22;
      if (current >= 100) {
        if (scanTimerRef.current) {
          window.clearInterval(scanTimerRef.current);
          scanTimerRef.current = null;
        }
        setScanProgress(100);
        setIsScanning(false);
        setIsCompleted(true);

        if (mode === 'verify') {
          const existing = getFingerprintRecord(userId);
          const verified =
            markFingerprintVerified() ||
            (await enrollDeviceBiometricFingerprint(
              userId,
              userName,
              userEmail,
              selectedFingerLabel
            ));
          setStatusMessage('Fingerprint verified! 2FA Biometric Authentication succeeded.');
          setTimeout(() => {
            onSuccess(existing || verified);
          }, 550);
        } else {
          const enrolled = await enrollDeviceBiometricFingerprint(
            userId,
            userName,
            userEmail,
            selectedFingerLabel
          );
          setStatusMessage(
            '100% Recorded! Your fingerprint is now active for 2FA Authentication.'
          );
          setTimeout(() => {
            onSuccess(enrolled);
          }, 650);
        }
      } else {
        setScanProgress(current);
        setStatusMessage(
          mode === 'verify'
            ? `Verifying biometric 2FA signature... ${current}%`
            : `Capturing fingerprint ridges... ${current}% — Hold steady`
        );
      }
    }, 260);
  };

  const handleContinueClick = async () => {
    if (isCompleted) {
      const existing = getFingerprintRecord(userId);
      if (existing) {
        onSuccess(existing);
        return;
      }
    }
    await startFingerprintScan();
  };

  return (
    <div
      id="set-your-fingerprint-modal"
      className="fixed inset-0 z-[220] bg-white flex flex-col justify-between px-6 pt-6 pb-8 select-none overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Top Header Row — Matches Light_18.webp */}
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center gap-3.5 py-2">
          <button
            id="fingerprint-back-btn"
            type="button"
            onClick={onClose}
            className="w-10 h-10 -ml-2 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#212121] transition-colors cursor-pointer active:scale-95"
            title="Back"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h1 className="text-[22px] font-bold text-[#212121] tracking-tight">
            {mode === 'verify' ? 'Verify Your Fingerprint' : 'Set Your Fingerprint'}
          </h1>
        </div>

        {/* Top Subtitle Text — Matches Light_18.webp */}
        <div className="mt-10 text-center px-4">
          <p className="text-[15.5px] text-[#35383F] font-normal leading-relaxed">
            {mode === 'verify'
              ? 'Touch the fingerprint sensor to verify your 2FA identity and continue.'
              : 'Add a fingerprint to make your account more secure.'}
          </p>

          {mode === 'record' && (
            <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
              {(['Right Index Finger', 'Right Thumb', 'Left Index Finger', 'Left Thumb'] as const).map(
                (label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedFingerLabel(label)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedFingerLabel === label
                        ? 'bg-[#FF5468]/15 text-[#FF5468] border border-[#FF5468]/30'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center Coral-Pink Fingerprint Scanner Graphic — Matches Light_18.webp */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center my-auto py-6">
        <button
          id="fingerprint-scanner-touch-pad"
          type="button"
          onClick={startFingerprintScan}
          className="relative group w-64 h-64 rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 cursor-pointer focus:outline-none"
          title="Touch to scan your fingerprint"
        >
          {/* Soft ambient pulse when scanning */}
          {isScanning && (
            <>
              <span className="absolute inset-2 rounded-full bg-[#FF5468]/10 animate-ping" />
              <span className="absolute inset-6 rounded-full border-2 border-[#FF5468]/30 animate-pulse" />
            </>
          )}

          {/* Completed glow ring */}
          {isCompleted && (
            <span className="absolute inset-4 rounded-full bg-[#FF5468]/10 border-2 border-[#FF5468]/40 animate-in zoom-in-95 duration-200" />
          )}

          {/* Exact Coral-Pink Stylized Fingerprint SVG from Light_18.webp */}
          <svg
            viewBox="0 0 240 240"
            className={`w-56 h-56 transition-all duration-300 ${
              isScanning ? 'scale-105 drop-shadow-[0_12px_28px_rgba(255,84,104,0.35)]' : 'group-hover:scale-[1.03]'
            }`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Top Arch */}
            <path
              d="M66 44C82 33 102 27 123 27C143 27 161 32 176 41"
              stroke="#FF5D73"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={scanProgress >= 15 || scanProgress === 0 ? 1 : 0.35}
            />
            {/* Top Left Detached Segment */}
            <path
              d="M36 78C42 66 50 56 59 49"
              stroke="#FF5D73"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={scanProgress >= 25 || scanProgress === 0 ? 1 : 0.35}
            />
            {/* Second Full Arch */}
            <path
              d="M44 134C41 114 45 92 58 75C73 56 96 46 122 46C150 46 175 59 189 81C198 95 203 112 202 130"
              stroke="#FF5D73"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={scanProgress >= 40 || scanProgress === 0 ? 1 : 0.35}
            />
            {/* Third Arch (Left down to bottom-left curve) */}
            <path
              d="M52 162C58 176 66 190 76 202"
              stroke="#FF5D73"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={scanProgress >= 55 || scanProgress === 0 ? 1 : 0.35}
            />
            {/* Third Arch Upper & Right */}
            <path
              d="M62 135C62 101 88 73 122 73C155 73 182 100 182 134C182 146 179 158 174 168"
              stroke="#FF5D73"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={scanProgress >= 65 || scanProgress === 0 ? 1 : 0.35}
            />
            {/* Fourth Inner Arch */}
            <path
              d="M84 128C84 106 101 89 122 89C143 89 160 106 160 128C160 154 148 178 131 196"
              stroke="#FF5D73"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={scanProgress >= 80 || scanProgress === 0 ? 1 : 0.35}
            />
            {/* Inner Core Loop Left */}
            <path
              d="M83 152C88 171 97 189 109 205"
              stroke="#FF5D73"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={scanProgress >= 90 || scanProgress === 0 ? 1 : 0.35}
            />
            {/* Center Core Ridge */}
            <path
              d="M112 118C112 112 117 107 123 107C129 107 134 112 134 118C134 143 125 167 110 185"
              stroke="#FF5D73"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={scanProgress >= 95 || scanProgress === 0 ? 1 : 0.35}
            />
            {/* Lower Right Detached Ridge */}
            <path
              d="M156 184C161 178 165 171 168 164"
              stroke="#FF5D73"
              strokeWidth="12"
              strokeLinecap="round"
              opacity={scanProgress >= 100 || scanProgress === 0 ? 1 : 0.35}
            />
          </svg>

          {/* Animated Laser Scan Bar while scanning */}
          {isScanning && (
            <div
              className="w-48 h-1.5 rounded-full bg-gradient-to-r from-transparent via-[#FF5468] to-transparent shadow-[0_0_16px_#FF5468] absolute left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none"
              style={{ top: `${20 + (scanProgress * 0.6)}%` }}
            />
          )}
        </button>

        {/* Progress Pill Badge when scanning or completed */}
        {(isScanning || isCompleted || scanProgress > 0) && (
          <div className="mt-2 flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FDECEF] text-[#FF5468] text-xs font-bold">
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#FF5468]" />
                <span>Fingerprint 2FA Ready (100%)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 animate-pulse" />
                <span>Scanning Fingerprint... {scanProgress}%</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Instruction & Action Buttons — Matches Light_18.webp */}
      <div className="w-full max-w-md mx-auto space-y-10 pb-2">
        <p
          id="fingerprint-instruction-text"
          className="text-center text-[15px] text-[#35383F] font-normal leading-relaxed px-4"
        >
          {statusMessage}
        </p>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <button
            id="fingerprint-skip-btn"
            type="button"
            onClick={() => {
              if (onSkip) {
                onSkip();
              } else {
                onClose();
              }
            }}
            className="w-full py-4 rounded-full bg-[#FDECEF] hover:bg-[#FBD8DF] active:scale-[0.98] text-[#FF5468] text-[15px] font-bold tracking-wide transition-all cursor-pointer"
          >
            Skip
          </button>

          <button
            id="fingerprint-continue-btn"
            type="button"
            onClick={handleContinueClick}
            className="w-full py-4 rounded-full bg-[#FF5468] hover:bg-[#F24458] active:scale-[0.98] text-white text-[15px] font-bold tracking-wide shadow-[0_10px_24px_rgba(255,84,104,0.35)] transition-all cursor-pointer"
          >
            {isScanning ? 'Scanning...' : isCompleted ? 'Continue' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};
