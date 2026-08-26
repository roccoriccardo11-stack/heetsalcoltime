import React from 'react';

/**
 * Neon Iceberg Cocktail Glass Logo Component
 * Matches the neon electric blue / cyan iceberg cocktail glass visual identity.
 */
export const IcebergLogoIcon = ({ className = "w-6 h-6", glow = true }) => {
  return (
    <svg
      viewBox="0 0 100 125"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.75)]' : ''}`}
    >
      <defs>
        <filter id="iceGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g stroke="#00f0ff" strokeLinecap="round" strokeLinejoin="round" filter="url(#iceGlow)">
        {/* Iceberg Top Peaks above rim */}
        <path d="M50 18 L58 36 L67 48 L50 48 L33 48 L42 34 Z" strokeWidth="2.4" fill="rgba(0, 240, 255, 0.05)" />
        <path d="M50 18 L49 30 L55 40 L50 48" strokeWidth="1.8" />
        <path d="M42 34 L46 26 L50 30" strokeWidth="1.5" />
        <path d="M58 36 L55 27" strokeWidth="1.5" />

        {/* Iceberg Submerged below rim */}
        <path d="M33 48 L40 62 L50 70 L60 62 L67 48" strokeWidth="2.2" fill="rgba(0, 240, 255, 0.08)" />
        <path d="M50 48 L48 56 L52 64 L50 70" strokeWidth="1.6" />
        <path d="M40 62 L45 55" strokeWidth="1.4" />
        <path d="M60 62 L55 55" strokeWidth="1.4" />

        {/* Cocktail Glass Rim */}
        <ellipse cx="50" cy="48" rx="34" ry="7.5" strokeWidth="2.5" fill="none" />

        {/* Glass Bowl Curves */}
        <path d="M16 48 C17 70, 42 78, 47 90 L47 98" strokeWidth="2.6" />
        <path d="M84 48 C83 70, 58 78, 53 90 L53 98" strokeWidth="2.6" />

        {/* Glass Base */}
        <ellipse cx="50" cy="98" rx="19" ry="3.8" strokeWidth="2.6" />
        <ellipse cx="50" cy="97" rx="14" ry="2.2" strokeWidth="1.2" opacity="0.6" />
      </g>
    </svg>
  );
};

export const BrandLogo = ({ size = "md", showText = true, className = "" }) => {
  const sizeMap = {
    sm: { box: "w-8 h-8", img: "w-7 h-7", text: "text-base", sub: "text-[9px]" },
    md: { box: "w-10 h-10", img: "w-9 h-9", text: "text-lg", sub: "text-[10px]" },
    lg: { box: "w-14 h-14", img: "w-12 h-12", text: "text-2xl", sub: "text-xs" },
    xl: { box: "w-20 h-20 sm:w-24 sm:h-24", img: "w-16 h-16 sm:w-20 sm:h-20", text: "text-3xl", sub: "text-sm" },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 group ${className}`}>
      {/* Glowing Neon Emblem */}
      <div className={`relative ${current.box} rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-blue-600 p-[1.5px] shadow-glow-cyan group-hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] group-hover:scale-105 transition-all duration-300`}>
        <div className="w-full h-full bg-[#040b19] rounded-[14px] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.18)_0%,transparent_70%)]"></div>
          <img
            src="/logo.png"
            alt="Heets Alcol Time Logo"
            className={`${current.img} object-contain filter drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]`}
            onError={(e) => {
              // Fallback to SVG if image fails to load
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-display font-black ${current.text} tracking-wider text-white uppercase group-hover:text-cyan-300 transition-colors`}>
            HEETS <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent font-extrabold">ALCOL TIME</span>
          </span>
          <span className={`${current.sub} tracking-[0.25em] text-cyan-400/80 font-mono uppercase -mt-0.5`}>
            PINZOLO · CAMPIGLIO
          </span>
        </div>
      )}
    </div>
  );
};
