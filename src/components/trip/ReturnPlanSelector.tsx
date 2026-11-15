import React from 'react';
import { Layers, ArrowRight, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Trip, ReturnPlanType } from '../../data/types';

interface ReturnPlanSelectorProps {
  trip: Trip;
  currentPlan?: ReturnPlanType;
  onSelectPlan: (plan: ReturnPlanType) => void;
  disabled?: boolean;
}

export function ReturnPlanSelector({ trip, currentPlan, onSelectPlan, disabled }: ReturnPlanSelectorProps) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-gradient-to-b from-ink-900 via-ink-950 to-ink-900 p-6 shadow-2xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-gold">
            <Layers className="h-5 w-5" />
            <h3 className="text-base font-black uppercase tracking-wider">
              RETURN JOURNEY DECISION
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Kerala stone unloading is complete. What is the return plan for vehicle <strong className="text-white font-mono">{trip.lorryId}</strong>?
          </p>
        </div>

        {currentPlan && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold self-start">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Selected: {currentPlan === 'sand_return' ? 'Load Sand (L&T)' : 'Direct Return (Base)'}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OPTION A: LOAD SAND */}
        <div
          onClick={() => !disabled && onSelectPlan('sand_return')}
          className={`rounded-xl border p-5 transition-all cursor-pointer relative overflow-hidden group ${
            currentPlan === 'sand_return'
              ? 'border-gold bg-gradient-to-br from-gold/15 via-ink-900 to-black ring-1 ring-gold/40 shadow-xl'
              : 'border-ink-700 bg-ink-900/60 hover:border-gold/60 hover:bg-ink-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold/20 text-gold text-xs font-black font-mono">
                A
              </span>
              <span className="text-sm font-black text-white group-hover:text-gold transition-colors">
                LOAD SAND
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              High Revenue Leg
            </span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed mb-4">
            Pick up sand from <strong className="text-white">Mangalore</strong> or <strong className="text-white">Kanaya</strong> and transport to <strong className="text-white">L&T Factory</strong> before returning to Kadapa base.
          </p>

          <div className="rounded-lg bg-black/40 border border-white/5 p-3 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-neutral-400 text-[11px]">
              <span>Loading Source:</span>
              <span className="text-white font-semibold">Mangalore / Kanaya</span>
            </div>
            <div className="flex justify-between text-neutral-400 text-[11px]">
              <span>Destination:</span>
              <span className="text-gold font-semibold">L&T Factory</span>
            </div>
            <div className="flex justify-between text-neutral-400 text-[11px]">
              <span>Cargo Type:</span>
              <span className="text-cyan-300">River Sand / M-Sand</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs font-semibold text-neutral-400">
              {currentPlan === 'sand_return' ? 'Active Plan' : 'Select Option A'}
            </span>
            <button
              type="button"
              disabled={disabled}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                currentPlan === 'sand_return'
                  ? 'bg-gold text-ink-950 shadow-md'
                  : 'bg-ink-800 text-white hover:bg-gold hover:text-ink-950'
              }`}
            >
              <span>{currentPlan === 'sand_return' ? 'Selected ✓' : 'Load Sand'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* OPTION B: DIRECT RETURN */}
        <div
          onClick={() => !disabled && onSelectPlan('direct_return')}
          className={`rounded-xl border p-5 transition-all cursor-pointer relative overflow-hidden group ${
            currentPlan === 'direct_return'
              ? 'border-blue-400 bg-gradient-to-br from-blue-500/15 via-ink-900 to-black ring-1 ring-blue-400/40 shadow-xl'
              : 'border-ink-700 bg-ink-900/60 hover:border-blue-400/60 hover:bg-ink-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 text-xs font-black font-mono">
                B
              </span>
              <span className="text-sm font-black text-white group-hover:text-blue-300 transition-colors">
                DIRECT RETURN
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              Empty Return
            </span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed mb-4">
            Return vehicle directly from <strong className="text-white">Kerala</strong> back to home base <strong className="text-white">Kadapa</strong> with empty cargo.
          </p>

          <div className="rounded-lg bg-black/40 border border-white/5 p-3 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-neutral-400 text-[11px]">
              <span>Origin:</span>
              <span className="text-white font-semibold">Kerala Site</span>
            </div>
            <div className="flex justify-between text-neutral-400 text-[11px]">
              <span>Destination:</span>
              <span className="text-blue-300 font-semibold">Kadapa / Home Base</span>
            </div>
            <div className="flex justify-between text-neutral-400 text-[11px]">
              <span>Cargo Status:</span>
              <span className="text-neutral-400">Empty (No Cargo)</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs font-semibold text-neutral-400">
              {currentPlan === 'direct_return' ? 'Active Plan' : 'Select Option B'}
            </span>
            <button
              type="button"
              disabled={disabled}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                currentPlan === 'direct_return'
                  ? 'bg-blue-400 text-ink-950 shadow-md'
                  : 'bg-ink-800 text-white hover:bg-blue-400 hover:text-ink-950'
              }`}
            >
              <span>{currentPlan === 'direct_return' ? 'Selected ✓' : 'Direct Return'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
