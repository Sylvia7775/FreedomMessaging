import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

interface StatusBarProps {
  time?: string;
  theme?: 'dark' | 'light' | 'green';
  className?: string;
  showNotch?: boolean;
}

const getDeviceRealTimeClock = (): string => {
  const now = new Date();
  try {
    return now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
};

interface DeviceNetworkState {
  online: boolean;
  bars: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const getDeviceRealNetworkState = (): DeviceNetworkState => {
  if (typeof navigator === 'undefined') {
    return { online: true, bars: 4, label: 'Online' };
  }

  const isOnline = navigator.onLine !== false;
  if (!isOnline) {
    return { online: false, bars: 0, label: 'No Network Connection (Offline)' };
  }

  const conn =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!conn) {
    return { online: true, bars: 4, label: 'Online • Connected' };
  }

  const effectiveType = String(conn.effectiveType || '').toLowerCase();
  const downlink = typeof conn.downlink === 'number' ? conn.downlink : null;
  const rtt = typeof conn.rtt === 'number' ? conn.rtt : null;

  let bars: 0 | 1 | 2 | 3 | 4 = 4;

  if (effectiveType === 'slow-2g' || (downlink !== null && downlink > 0 && downlink < 0.4) || (rtt !== null && rtt > 600)) {
    bars = 1;
  } else if (effectiveType === '2g' || (downlink !== null && downlink > 0 && downlink < 1.5) || (rtt !== null && rtt > 300)) {
    bars = 2;
  } else if (effectiveType === '3g' || (downlink !== null && downlink > 0 && downlink < 5) || (rtt !== null && rtt > 140)) {
    bars = 3;
  } else {
    bars = 4;
  }

  const details: string[] = [];
  if (effectiveType) details.push(effectiveType.toUpperCase());
  if (downlink !== null && downlink > 0) details.push(`${downlink} Mbps`);
  if (rtt !== null && rtt > 0) details.push(`${rtt}ms`);

  return {
    online: true,
    bars,
    label: details.length > 0 ? `Network: ${details.join(' • ')}` : 'Network: Connected',
  };
};

export const StatusBar: React.FC<StatusBarProps> = ({
  theme = 'green',
  className = '',
  showNotch = false,
}) => {
  const [liveTime, setLiveTime] = useState<string>(() => getDeviceRealTimeClock());
  const [networkState, setNetworkState] = useState<DeviceNetworkState>(() =>
    getDeviceRealNetworkState()
  );

  useEffect(() => {
    setLiveTime(getDeviceRealTimeClock());
    const interval = setInterval(() => {
      setLiveTime(getDeviceRealTimeClock());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateNetwork = () => {
      setNetworkState(getDeviceRealNetworkState());
    };
    updateNetwork();

    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);

    const conn =
      typeof navigator !== 'undefined'
        ? (navigator as any).connection ||
          (navigator as any).mozConnection ||
          (navigator as any).webkitConnection
        : null;

    if (conn && typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', updateNetwork);
    }

    const netInterval = setInterval(updateNetwork, 3000);

    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      if (conn && typeof conn.removeEventListener === 'function') {
        conn.removeEventListener('change', updateNetwork);
      }
      clearInterval(netInterval);
    };
  }, []);

  const isLightText = theme === 'green' || theme === 'dark';
  const textColor = isLightText ? 'text-white' : 'text-slate-900';
  const activeBarColor = isLightText ? 'bg-white' : 'bg-slate-900';
  const inactiveBarColor = isLightText ? 'bg-white/25' : 'bg-slate-900/25';

  return (
    <div
      className={`w-full px-5 pt-2 pb-1 flex items-center justify-between text-xs font-semibold select-none z-30 ${textColor} ${className}`}
    >
      {/* Real-Time User Device Clock */}
      <span className="tracking-tight text-[13px] font-bold">{liveTime}</span>

      {/* Notch / Speaker cutout */}
      {showNotch && (
        <div className="w-24 sm:w-28 h-4.5 bg-black/85 rounded-full flex items-center justify-center -mt-1 shadow-inner">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
          <div className="w-2.5 h-2.5 ml-2 rounded-full bg-slate-900 border border-slate-700/60" />
        </div>
      )}

      {/* Signal, WiFi, Battery */}
      <div className="flex items-center gap-1.5">
        {/* Real-Time Device Network Signal Bars (growing from bottom) */}
        <div
          className="flex items-end gap-[1.5px] h-3"
          title={networkState.label}
          aria-label={networkState.label}
        >
          <div
            className={`w-[2.5px] h-1 rounded-xs transition-all duration-300 origin-bottom ${
              networkState.bars >= 1 ? activeBarColor : inactiveBarColor
            }`}
          />
          <div
            className={`w-[2.5px] h-1.5 rounded-xs transition-all duration-300 origin-bottom ${
              networkState.bars >= 2 ? activeBarColor : inactiveBarColor
            }`}
          />
          <div
            className={`w-[2.5px] h-2 rounded-xs transition-all duration-300 origin-bottom ${
              networkState.bars >= 3 ? activeBarColor : inactiveBarColor
            }`}
          />
          <div
            className={`w-[2.5px] h-2.5 rounded-xs transition-all duration-300 origin-bottom ${
              networkState.bars >= 4 ? activeBarColor : inactiveBarColor
            }`}
          />
        </div>

        <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />

        <div className="flex items-center">
          <Battery className="w-4 h-4 stroke-[2]" />
        </div>
      </div>
    </div>
  );
};
