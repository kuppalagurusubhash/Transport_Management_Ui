import React, { useState } from 'react';
import { Scale, AlertTriangle, CheckCircle2, ShieldCheck, MapPin, DollarSign, Clock, Calendar } from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { Trip, ReturnSandUnload } from '../../data/types';

interface ReturnUnloadingFormProps {
  trip: Trip;
  onSave: (data: ReturnSandUnload) => Promise<void>;
  disabled?: boolean;
}

export function ReturnUnloadingForm({ trip, onSave, disabled }: ReturnUnloadingFormProps) {
  const loadedWeight = trip.returnSandLoad?.weightTons || 0;
  const existing = trip.returnSandUnload;

  const [arrivalDate, setArrivalDate] = useState<string>(existing?.arrivalDate || new Date().toISOString().split('T')[0]);
  const [arrivalTime, setArrivalTime] = useState<string>(existing?.arrivalTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [sandType, setSandType] = useState<string>(existing?.sandType || trip.returnSandLoad?.sandType || 'River Sand');
  const [receivedQuantity, setReceivedQuantity] = useState<string>(existing?.receivedQuantity ? String(existing.receivedQuantity) : '');
  const [receivedWeightTons, setReceivedWeightTons] = useState<string>(
    existing?.receivedWeightTons !== undefined ? String(existing.receivedWeightTons) : (loadedWeight ? String(loadedWeight) : '24.20')
  );
  const [unloadingLabour, setUnloadingLabour] = useState<string>(existing?.unloadingLabour !== undefined ? String(existing.unloadingLabour) : '800');
  const [hamali, setHamali] = useState<string>(existing?.hamali !== undefined ? String(existing.hamali) : '400');
  const [mamulu, setMamulu] = useState<string>(existing?.mamulu !== undefined ? String(existing.mamulu) : '300');
  const [deductionsOrDifferenceCost, setDeductionsOrDifferenceCost] = useState<string>(
    existing?.deductionsOrDifferenceCost !== undefined ? String(existing.deductionsOrDifferenceCost) : '0'
  );
  const [remarks, setRemarks] = useState<string>(existing?.remarks || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const numReceivedWeight = parseFloat(receivedWeightTons) || 0;
  const numUnloadLabour = parseFloat(unloadingLabour) || 0;
  const numHamali = parseFloat(hamali) || 0;
  const numMamulu = parseFloat(mamulu) || 0;
  const numDeductions = parseFloat(deductionsOrDifferenceCost) || 0;

  // Weight Difference Calculation
  const weightDiff = Math.max(0, parseFloat((loadedWeight - numReceivedWeight).toFixed(2)));
  const ratePerTon = trip.returnSandLoad?.ratePerTon || 0;
  const calculatedReturnRev = Math.round(numReceivedWeight * ratePerTon);
  const totalUnloadExpenses = numUnloadLabour + numHamali + numMamulu + numDeductions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numReceivedWeight || numReceivedWeight <= 0) {
      alert('Please enter valid received sand weight in tons.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: ReturnSandUnload = {
        arrivalDate,
        arrivalTime,
        sandType,
        receivedQuantity: receivedQuantity ? Number(receivedQuantity) : undefined,
        receivedWeightTons: numReceivedWeight,
        weightDifferenceTons: weightDiff,
        unloadingLabour: numUnloadLabour,
        hamali: numHamali,
        mamulu: numMamulu,
        deductionsOrDifferenceCost: numDeductions,
        remarks: remarks.trim() || undefined,
        unloadedAt: 'L&T Factory Site'
      };
      await onSave(data);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Failed to save return sand unloading:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-700 bg-gradient-to-b from-ink-900 to-ink-950 p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-gold">
            <Scale className="h-5 w-5" />
            <h3 className="text-base font-black uppercase tracking-wider">
              RETURN SAND UNLOADING — L&amp;T FACTORY
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit received weight and finalize unloading at L&amp;T Factory
          </p>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold self-start">
          Destination: L&amp;T Factory Site
        </span>
      </div>

      {/* Loaded Weight vs Received Weight Comparison Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-black/50 border border-white/10 p-4">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
            01. Loaded at {trip.returnSandLoad?.loadingLocation || 'Mangalore'}
          </span>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-xl font-black text-white">{loadedWeight.toFixed(2)}</span>
            <span className="text-xs text-neutral-400 font-bold">Ton</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1 font-mono">
            @ ₹{ratePerTon}/Ton ({trip.returnSandLoad?.sandType || 'Sand'})
          </span>
        </div>

        <div className="rounded-xl bg-purple-950/20 border border-purple-500/30 p-4">
          <span className="text-[10px] uppercase font-semibold text-purple-300 block mb-1">
            02. Received at L&amp;T Factory
          </span>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-xl font-black text-purple-200">{numReceivedWeight.toFixed(2)}</span>
            <span className="text-xs text-purple-400 font-bold">Ton</span>
          </div>
          <span className="text-[10px] text-purple-400 block mt-1 font-mono">
            Net Value: {formatINR(calculatedReturnRev)}
          </span>
        </div>

        <div className={`rounded-xl p-4 border transition-all ${
          weightDiff > 0
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-semibold block">
              03. Weight Difference
            </span>
            {weightDiff > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-xl font-black">{weightDiff > 0 ? `− ${weightDiff.toFixed(2)}` : '0.00'}</span>
            <span className="text-xs font-bold">Ton</span>
          </div>
          <span className="text-[10px] block mt-1 font-mono">
            {weightDiff > 0 ? `Shortage: ₹${Math.round(weightDiff * ratePerTon).toLocaleString('en-IN')}` : 'Exact match — No shortage'}
          </span>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Arrival Date */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Arrival Date *
            </label>
            <input
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Arrival Time */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Arrival Time
            </label>
            <input
              type="time"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Received Weight in Tons */}
          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1">
              Received Weight (Ton) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={receivedWeightTons}
                onChange={(e) => setReceivedWeightTons(e.target.value)}
                disabled={disabled}
                required
                className="w-full rounded-lg border border-purple-500/50 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
                placeholder="24.20"
              />
              <span className="absolute right-3 top-2 text-xs text-neutral-500 font-bold">Ton</span>
            </div>
          </div>

          {/* Sand Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Sand Type
            </label>
            <input
              type="text"
              value={sandType}
              onChange={(e) => setSandType(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Unloading Labour */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Unloading Labour (₹)
            </label>
            <input
              type="number"
              min="0"
              value={unloadingLabour}
              onChange={(e) => setUnloadingLabour(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
              placeholder="800"
            />
          </div>

          {/* Hamali */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Hamali (₹)
            </label>
            <input
              type="number"
              min="0"
              value={hamali}
              onChange={(e) => setHamali(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
              placeholder="400"
            />
          </div>

          {/* Mamulu */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Mamulu (₹)
            </label>
            <input
              type="number"
              min="0"
              value={mamulu}
              onChange={(e) => setMamulu(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
              placeholder="300"
            />
          </div>

          {/* Deduction / Difference Cost */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Deductions / Shortage Cut (₹)
            </label>
            <input
              type="number"
              min="0"
              value={deductionsOrDifferenceCost}
              onChange={(e) => setDeductionsOrDifferenceCost(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
              placeholder="0"
            />
          </div>

          {/* Remarks */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Unloading Remarks / Weighbridge Chit Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              placeholder="e.g. Weighbridge slip verified at L&T gate"
            />
          </div>
        </div>

        {/* Expenses Summary & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
          <div className="text-xs space-y-1">
            <span className="text-neutral-400 block font-sans">
              Total Unloading Expenses: <strong className="text-white font-mono">₹{totalUnloadExpenses.toLocaleString('en-IN')}</strong>
            </span>
            <span className="text-neutral-500 block font-sans text-[11px]">
              Next Step: Return fleet to Kadapa Home Base for Final Trip Audit.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {successMsg && (
              <span className="text-xs text-green-400 font-bold">
                ✓ L&amp;T Unloading Saved!
              </span>
            )}

            <button
              type="submit"
              disabled={disabled || isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-2.5 text-xs font-black text-white shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : existing ? 'Update L&T Unloading' : 'Confirm L&T Factory Unloading'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
