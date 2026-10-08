import React from 'react';
import { Wifi, Battery } from 'lucide-react';

interface StatusBarProps {
  time?: string;
  theme?: 'dark' | 'light' | 'green';
  className?: string;
  showNotch?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  time = '9:41',
  theme = 'green',
  className = '',
  showNotch = false,
}) => {
  const isLightText = theme === 'green' || theme === 'dark';
  const textColor = isLightText ? 'text-white' : 'text-slate-900';

  return (
    <div
      className={`w-full px-5 pt-2 pb-1 flex items-center justify-between text-xs font-semibold select-none z-30 ${textColor} ${className}`}
    >
      {/* Time */}
      <span className="tracking-tight text-[13px] font-bold">{time}</span>

      {/* Notch / Speaker cutout */}
      {showNotch && (
        <div className="w-24 sm:w-28 h-4.5 bg-black/85 rounded-full flex items-center justify-center -mt-1 shadow-inner">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
          <div className="w-2.5 h-2.5 ml-2 rounded-full bg-slate-900 border border-slate-700/60" />
        </div>
      )}

      {/* Signal, WiFi, Battery */}
      <div className="flex items-center gap-1.5">
        {/* Cellular bars */}
        <div className="flex items-end gap-[1.5px] h-3">
          <div className={`w-[2.5px] h-1 rounded-xs ${isLightText ? 'bg-white' : 'bg-slate-900'}`} />
          <div className={`w-[2.5px] h-1.5 rounded-xs ${isLightText ? 'bg-white' : 'bg-slate-900'}`} />
          <div className={`w-[2.5px] h-2 rounded-xs ${isLightText ? 'bg-white' : 'bg-slate-900'}`} />
          <div className={`w-[2.5px] h-2.5 rounded-xs ${isLightText ? 'bg-white' : 'bg-slate-900'}`} />
        </div>

        <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />

        <div className="flex items-center">
          <Battery className="w-4 h-4 stroke-[2]" />
        </div>
      </div>
    </div>
  );
};
