import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { Trip } from '../../data/types';

interface TripCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  trip: Trip;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  isSubmitting?: boolean;
}

export function TripCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  trip,
  totalRevenue,
  totalExpenses,
  totalProfit,
  isSubmitting
}: TripCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative max-w-lg w-full rounded-2xl border border-gold/40 bg-ink-950 p-6 shadow-[0_0_50px_rgba(245,184,46,0.15)] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-gold">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-base font-black uppercase tracking-wider">
              Complete Round Trip?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-ink-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="rounded-xl bg-amber-950/20 border border-amber-500/30 p-3.5 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">Final Audit Closure Notice:</span>
            This will permanently close the complete journey audit for vehicle{' '}
            <strong className="text-gold font-mono">{trip.lorryId}</strong> and release the vehicle to depot base.
          </div>
        </div>

        {/* Financial Summary Breakdown */}
        <div className="rounded-xl bg-black/50 border border-white/10 p-4 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between items-center text-neutral-300">
            <span>Total Journey Revenue:</span>
            <span className="font-bold text-white text-sm">{formatINR(totalRevenue)}</span>
          </div>
          <div className="flex justify-between items-center text-red-300">
            <span>Total Journey Expenses:</span>
            <span className="font-bold text-red-300 text-sm">− {formatINR(totalExpenses)}</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-center">
            <span className="text-xs font-bold text-neutral-200 uppercase font-sans">Final Net Trip Profit:</span>
            <span className={`text-base font-black ${totalProfit >= 0 ? 'text-gold' : 'text-red-400'}`}>
              {formatINR(totalProfit)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl bg-ink-800 px-5 py-2 text-xs font-bold text-neutral-300 hover:bg-ink-700 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-400 px-6 py-2.5 text-xs font-black text-ink-950 shadow-xl hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSubmitting ? 'Closing Trip...' : 'Confirm & Complete Trip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
