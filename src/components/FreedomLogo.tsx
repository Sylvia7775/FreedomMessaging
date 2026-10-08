import React from 'react';

interface FreedomLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
  appName?: string;
  customFavicon?: string;
  primaryColor?: string;
}

export const FreedomLogo: React.FC<FreedomLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  theme = 'light',
  appName = 'WeedChat',
  customFavicon,
}) => {
  const sizeMap = {
    sm: { icon: 32, text: 'text-lg' },
    md: { icon: 48, text: 'text-2xl' },
    lg: { icon: 72, text: 'text-3xl' },
    xl: { icon: 96, text: 'text-4xl' },
  };

  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: icon, height: icon }}
      >
        {customFavicon && customFavicon !== '/chat-2.svg' ? (
          <img
            src={customFavicon}
            alt={`${appName} Icon`}
            className="w-full h-full object-contain rounded-full filter drop-shadow-sm"
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="w-full h-full drop-shadow-sm"
          >
            <defs>
              <linearGradient id="freedomChatGrad" x1="12%" y1="12%" x2="88%" y2="88%">
                <stop offset="0%" stopColor="#F700FF" />
                <stop offset="50%" stopColor="#9D00F0" />
                <stop offset="100%" stopColor="#5200D1" />
              </linearGradient>
              <linearGradient id="freedomDotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#AC00F5" />
                <stop offset="100%" stopColor="#7B00DF" />
              </linearGradient>
            </defs>
            <circle cx="256" cy="256" r="252" fill="url(#freedomChatGrad)" />
            <path
              d="M 256 122 C 330 122 390 178 390 248 C 390 318 330 374 256 374 C 239 374 222 371 207 366 L 124 390 L 143 317 C 129 297 122 273 122 248 C 122 178 182 122 256 122 Z"
              fill="#FFFFFF"
            />
            <circle cx="192" cy="254" r="21" fill="url(#freedomDotGrad)" />
            <circle cx="256" cy="254" r="21" fill="url(#freedomDotGrad)" />
            <circle cx="320" cy="254" r="21" fill="url(#freedomDotGrad)" />
          </svg>
        )}
      </div>

      {showText && (
        <span
          className={`font-extrabold tracking-tight mt-3 ${text} ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}
        >
          {appName}
        </span>
      )}
    </div>
  );
};
