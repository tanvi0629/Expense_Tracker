// src/components/common/SpendlyLogo.jsx
import React from "react";

// ── Icon only (for favicon, app icon, sidebar) ─────────────────────────────
export function SpendlyIcon({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#534AB7" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id="iconGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#534AB7" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect width="64" height="64" rx="16" fill="url(#iconGrad)" />

      {/* Wallet base */}
      <rect
        x="13"
        y="24"
        width="38"
        height="24"
        rx="5"
        fill="white"
        fillOpacity="0.18"
      />
      {/* Wallet top flap */}
      <rect
        x="13"
        y="24"
        width="38"
        height="10"
        rx="4"
        fill="white"
        fillOpacity="0.28"
      />
      {/* Coin slot */}
      <rect
        x="38"
        y="30"
        width="9"
        height="9"
        rx="4.5"
        fill="white"
        fillOpacity="0.32"
      />

      {/* Rising graph line — the S flow */}
      <path
        d="M17 46 C21 46 23 38 27 35 C31 32 33 27 37 24 C39 22 41 20 47 17"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Data points */}
      <circle cx="17" cy="46" r="3" fill="#22C55E" />
      <circle cx="32" cy="30" r="2.5" fill="white" fillOpacity="0.8" />
      <circle cx="47" cy="17" r="3" fill="#22C55E" />

      {/* Arrow tip */}
      <path
        d="M42 14 L47 17 L50 12"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Currency flow particles */}
      <circle cx="22" cy="13" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="30" cy="8" r="1.8" fill="white" fillOpacity="0.25" />
    </svg>
  );
}

// ── Full horizontal lockup (icon + wordmark) ────────────────────────────────
export function SpendlyLogo({ size = "md", dark = false, className = "" }) {
  const sizes = {
    sm: { icon: 28, font: 18, gap: 8 },
    md: { icon: 36, font: 22, gap: 10 },
    lg: { icon: 48, font: 30, gap: 14 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${className}`} style={{ gap: s.gap }}>
      <SpendlyIcon size={s.icon} />
      <span
        style={{
          fontFamily: "'Syne', 'DM Sans', sans-serif",
          fontSize: s.font,
          fontWeight: 800,
          letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, #534AB7 0%, #22C55E 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        Spendly
      </span>
    </div>
  );
}

// ── Default export = full lockup ─────────────────────────────────────────────
export default SpendlyLogo;
