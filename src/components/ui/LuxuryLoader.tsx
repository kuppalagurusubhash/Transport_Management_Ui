import React, { useEffect, useState } from 'react';
import { TruckIcon, ShieldCheckIcon, SparklesIcon } from 'lucide-react';

interface LuxuryLoaderProps {
  fullScreen?: boolean;
  label?: string;
}

const LOADING_MESSAGES = [
  'Initializing Trans IA Fleet Telemetry...',
  'Syncing Kadapa to Kerala Route Ledgers...',
  'Connecting to Live Logistics Cloud...',
  'Preparing 3D Fleet Showroom & Consignments...'
];

export function LuxuryLoader({ fullScreen = false, label }: LuxuryLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden px-4 select-none ${
        fullScreen
          ? 'min-h-[100dvh] bg-[#05090D] text-white pt-safe pb-safe'
          : 'min-h-[62vh] rounded-2xl bg-gradient-to-b from-[#080D12]/60 to-[#05090D]/60 text-white py-12'
      }`}
    >
      {/* Ambient Radial Gold Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#F5B82E]/10 blur-[110px] animate-pulse" />
      </div>

      {/* Central Orbital Logo Emblem */}
      <div className="relative flex items-center justify-center">
        {/* Outer rotating dashed gold ring */}
        <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border border-dashed border-[#F5B82E]/35 animate-[spin_10s_linear_infinite]" />

        {/* Middle counter-rotating gradient arc */}
        <div className="absolute h-24 w-24 sm:h-28 sm:w-28 rounded-full border-2 border-transparent border-t-[#F5B82E] border-r-[#F5B82E]/40 animate-[spin_1.6s_cubic-bezier(0.55,0.15,0.45,0.85)_infinite] shadow-[0_0_25px_rgba(245,184,46,0.25)]" />

        {/* Inner pulse ring */}
        <div className="absolute h-20 w-20 sm:h-22 sm:w-22 rounded-2xl bg-[#F5B82E]/15 animate-ping opacity-30" />

        {/* App Logo */}
        <div className="absolute flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border-2 border-[#F5B82E]/60 bg-[#070B10] p-1.5 shadow-[0_0_35px_rgba(245,184,46,0.35)] overflow-hidden">
          <img
            src="/app-logo.png"
            alt="SGSP Trans IA Logo"
            className="h-full w-full object-contain filter drop-shadow-[0_2px_10px_rgba(245,184,46,0.45)]"
          />
        </div>
      </div>

      {/* Brand Title & Subtitle */}
      <div className="relative z-10 mt-6 text-center space-y-1.5 max-w-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F5B82E]/30 bg-[#F5B82E]/10 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#F5B82E]">
          <SparklesIcon className="h-3 w-3" />
          <span>SRI SAI BABA • SGSP LOGISTICS</span>
        </div>

        <h2 className="text-lg sm:text-xl font-black tracking-wide text-white">
          <span className="text-white">SG</span><span className="text-[#F5B82E]">SP</span> TRANS <span className="text-[#F5B82E]">IA</span>
        </h2>

        <p className="text-xs font-medium text-neutral-400 min-h-[1.25rem] transition-all duration-300">
          {label || LOADING_MESSAGES[msgIndex]}
        </p>
      </div>

      {/* Highway Truck Progress Track */}
      <div className="relative z-10 mt-6 w-64 sm:w-72 space-y-2">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 border border-white/5">
          <div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#F5B82E] to-amber-300 shadow-[0_0_12px_#F5B82E]"
            style={{
              animation: 'transIaSlide 1.4s ease-in-out infinite'
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span className="flex items-center gap-1 text-[#F5B82E]/90 font-semibold">
            <TruckIcon className="h-3 w-3" />
            AP • KA • KL CORRIDOR
          </span>
          <span className="flex items-center gap-1 text-emerald-400/90 font-semibold">
            <ShieldCheckIcon className="h-3 w-3" />
            ENCRYPTED
          </span>
        </div>
      </div>

      <style>{`
        @keyframes transIaSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

