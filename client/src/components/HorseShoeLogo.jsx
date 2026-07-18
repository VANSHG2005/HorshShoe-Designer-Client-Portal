import React from 'react';

/**
 * The Horse Shoe Studio Emblem & Wordmark
 * Multidisciplinary Design Studio Logo Component
 */
export function HorseShoeEmblem({ className = 'w-8 h-8' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="The Horse Shoe Emblem"
    >
      <defs>
        <linearGradient id="horseshoe-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="50%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
      </defs>
      {/* Outer Horseshoe Arc */}
      <path
        d="M26 28 C26 24, 30 20, 36 20 C42 20, 42 26, 38 32 C35 37, 34 44, 34 52 C34 66, 41 74, 50 74 C59 74, 66 66, 66 52 C66 44, 65 37, 62 32 C58 26, 58 20, 64 20 C70 20, 74 24, 74 28 C74 44, 78 54, 78 60 C78 78, 65 88, 50 88 C35 88, 22 78, 22 60 C22 54, 26 44, 26 28 Z"
        fill="url(#horseshoe-grad)"
      />
      {/* Lucky Dots */}
      <circle cx="31" cy="46" r="2.5" fill="#ffffff" opacity="0.9" />
      <circle cx="33" cy="59" r="2.5" fill="#ffffff" opacity="0.9" />
      <circle cx="38" cy="71" r="2.5" fill="#ffffff" opacity="0.9" />
      <circle cx="69" cy="46" r="2.5" fill="#ffffff" opacity="0.9" />
      <circle cx="67" cy="59" r="2.5" fill="#ffffff" opacity="0.9" />
      <circle cx="62" cy="71" r="2.5" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

export default function HorseShoeLogo({
  variant = 'full', // 'full' | 'emblem' | 'wordmark'
  theme = 'dark', // 'light' | 'dark' — default is now dark
  size = 'md', // 'sm' | 'md' | 'lg'
  withSubtitle = true,
  className = '',
}) {
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: { emblem: 'w-6 h-6', title: 'text-sm', subtitle: 'text-[9px]' },
    md: { emblem: 'w-8 h-8', title: 'text-base', subtitle: 'text-[10px]' },
    lg: { emblem: 'w-10 h-10', title: 'text-xl', subtitle: 'text-xs' },
  }[size] || { emblem: 'w-8 h-8', title: 'text-base', subtitle: 'text-[10px]' };

  if (variant === 'emblem') {
    return <HorseShoeEmblem className={`${sizeClasses.emblem} ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative flex items-center justify-center flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-black border border-white/[0.08] flex items-center justify-center shadow-md p-1.5 transition-transform duration-300 hover:scale-105">
          <HorseShoeEmblem className="w-full h-full" />
        </div>
      </div>

      {variant !== 'emblem' && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight leading-none ${sizeClasses.title} ${
                isDark ? 'text-white' : 'text-surface-900'
              }`}
            >
              The Horse Shoe
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Studio
            </span>
          </div>
          {withSubtitle && (
            <span
              className={`font-mono tracking-widest uppercase mt-0.5 ${sizeClasses.subtitle} ${
                isDark ? 'text-surface-600' : 'text-surface-500'
              }`}
            >
              Strategy &bull; Craft &bull; Lucky
            </span>
          )}
        </div>
      )}
    </div>
  );
}
