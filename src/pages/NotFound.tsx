import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CompassIcon,
  ArrowLeftIcon,
  LayoutDashboardIcon,
  RouteIcon,
  TruckIcon,
  AlertTriangleIcon,
  ShoppingBagIcon
} from 'lucide-react';

export function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#05090D] px-4 py-10 text-white pt-safe pb-safe select-none">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-[#F5B82E]/10 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 h-[340px] w-[340px] rounded-full bg-amber-600/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-b from-[#0E141D]/95 via-[#090E14]/95 to-[#06090D]/95 p-6 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-center"
      >
        {/* Top Glowing Accent Bar */}
        <div className="absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#F5B82E] to-transparent" />

        {/* Logo + Radar Badge */}
        <div className="relative mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-[#F5B82E]/20 blur-xl animate-pulse" />
          <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border-2 border-[#F5B82E]/60 bg-[#070B10] p-2 shadow-[0_8px_30px_rgba(245,184,46,0.35)]">
            <img
              src="/app-logo.png"
              alt="SGSP Trans IA Logo"
              className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,184,46,0.4)]"
            />
          </div>
          <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/50 bg-[#0B1017] text-[#F5B82E] shadow-lg">
            <CompassIcon className="h-4 w-4 animate-spin" style={{ animationDuration: '8s' }} />
          </span>
        </div>

        {/* Status Pill */}
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F5B82E]">
          <AlertTriangleIcon className="h-3.5 w-3.5" />
          <span>GPS WAYPOINT NOT FOUND</span>
        </div>

        {/* 404 Hero Number */}
        <h1 className="mt-2 font-mono text-6xl sm:text-7xl font-black tracking-tighter bg-gradient-to-b from-white via-[#FCE8A6] to-[#F5B82E] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(245,184,46,0.25)]">
          404
        </h1>

        <h2 className="mt-1 text-lg sm:text-xl font-black tracking-tight text-white">
          Convoy Off-Route — Page Not Found
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md mx-auto">
          The logistics route or module you requested doesn&apos;t exist or has been relocated in the{' '}
          <strong className="text-neutral-200">SGSP — Sri Sai Baba Transport &amp; Logistics</strong> command center.
        </p>

        {/* Requested Route Readout Box */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/50 p-3 text-left font-mono text-xs">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
            <span className="flex items-center gap-1.5 text-[#F5B82E]">
              <TruckIcon className="h-3.5 w-3.5" />
              Route Telemetry Diagnostic
            </span>
            <span className="text-red-400 font-bold">HTTP 404</span>
          </div>
          <p className="truncate text-neutral-300">
            <span className="text-neutral-500">Requested URL: </span>
            <span className="text-amber-300 font-bold">{location.pathname || '/unknown'}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Link
            to={isAuthenticated ? '/' : '/login'}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F5B82E] to-amber-500 px-4 py-3 text-xs sm:text-sm font-black text-black shadow-[0_6px_25px_rgba(245,184,46,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <LayoutDashboardIcon className="h-4 w-4" />
            <span>{isAuthenticated ? 'Back to Dashboard' : 'Go to Login'}</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-xs sm:text-sm font-bold text-neutral-200 hover:border-[#F5B82E]/50 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Quick Shortcut Pills when logged in */}
        {isAuthenticated && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mr-1">
              Quick Jump:
            </span>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:border-[#F5B82E]/40 hover:text-[#F5B82E] transition-colors"
            >
              <ShoppingBagIcon className="h-3 w-3" />
              Orders
            </Link>
            <Link
              to="/trips"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:border-[#F5B82E]/40 hover:text-[#F5B82E] transition-colors"
            >
              <RouteIcon className="h-3 w-3" />
              Trips
            </Link>
            <Link
              to="/fleet"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:border-[#F5B82E]/40 hover:text-[#F5B82E] transition-colors"
            >
              <TruckIcon className="h-3 w-3" />
              Fleet
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

