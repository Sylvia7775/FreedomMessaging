import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
  tilt?: 'none' | 'left' | 'right';
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  className = '',
  tilt = 'none',
}) => {
  const tiltClasses = {
    none: '',
    left: 'transform -rotate-6 hover:rotate-0 transition-transform duration-300',
    right: 'transform rotate-6 hover:rotate-0 transition-transform duration-300',
  };

  return (
    <div
      className={`relative w-[340px] sm:w-[375px] h-[720px] sm:h-[780px] rounded-[48px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border-4 border-slate-700/80 shrink-0 ${tiltClasses[tilt]} ${className}`}
    >
      {/* Outer subtle reflection / glass highlights */}
      <div className="absolute top-0 left-10 right-10 h-1 bg-white/20 rounded-full blur-[1px]" />

      {/* Screen Inner Container */}
      <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-white shadow-inner flex flex-col">
        {children}

        {/* Bottom Home Indicator Bar (iOS style) */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/30 dark:bg-white/30 rounded-full pointer-events-none z-30" />
      </div>
    </div>
  );
};
