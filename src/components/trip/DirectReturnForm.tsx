import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, MapPin, Gauge, Fuel, Calendar, Clock, ShieldCheck } from 'lucide-react';
import type { Trip, DirectReturnDetails } from '../../data/types';

interface DirectReturnFormProps {
  trip: Trip;
  onSave: (data: DirectReturnDetails) => Promise<void>;
  disabled?: boolean;
}

export function DirectReturnForm({ trip, onSave, disabled }: DirectReturnFormProps) {
  const existing = trip.directReturnDetails;

  const [origin, setOrigin] = useState<string>(existing?.origin || trip.unloadingLocation || 'Kerala Site');
  const [destination, setDestination] = useState<string>(existing?.destination || 'Kadapa / Home Base');
  const [departureDate, setDepartureDate] = useState<string>(existing?.departureDate || new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState<string>(existing?.departureTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [odometerKm, setOdometerKm] = useState<string>(existing?.odometerKm ? String(existing.odometerKm) : '');
  const [fuelLiters, setFuelLiters] = useState<string>(existing?.fuelLiters ? String(existing.fuelLiters) : '');
  const [remarks, setRemarks] = useState<string>(existing?.remarks || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data: DirectReturnDetails = {
        origin,
        destination,
        cargo: 'Empty',
        departureDate,
        departureTime,
        odometerKm: odometerKm ? Number(odometerKm) : undefined,
        fuelLiters: fuelLiters ? Number(fuelLiters) : undefined,
        remarks: remarks.trim() || undefined
      };
      await onSave(data);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Failed to save direct return details:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-700 bg-gradient-to-b from-ink-900 to-ink-950 p-6 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400">
            <ArrowLeftRight className="h-5 w-5" />
            <h3 className="text-base font-black uppercase tracking-wider">
              DIRECT RETURN — EMPTY CARGO
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Vehicle returning directly from Kerala to Kadapa Base without return cargo
          </p>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-mono px-3 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold self-start">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          No Return Cargo (Direct Return)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Origin */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Departure Origin *
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Base Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Cargo Status */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Cargo Status
            </label>
            <input
              type="text"
              readOnly
              value="Empty (No Return Cargo)"
              className="w-full rounded-lg border border-ink-700 bg-black/40 px-3 py-2 text-xs text-neutral-400 font-mono"
            />
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Departure Date *
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Departure Time */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Departure Time
            </label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Departure Odometer */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Odometer at Departure (km)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
                placeholder="e.g. 148200"
              />
              <span className="absolute right-3 top-2 text-xs text-neutral-500 font-bold">km</span>
            </div>
          </div>

          {/* Fuel liters */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Fuel Loaded for Return (Liters)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
                placeholder="e.g. 150"
              />
              <span className="absolute right-3 top-2 text-xs text-neutral-500 font-bold">L</span>
            </div>
          </div>

          {/* Remarks */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Direct Return Remarks / Driver Instructions
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              placeholder="e.g. Driver instructed to return via Salem-Kadapa highway"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs text-neutral-400">
            Records vehicle as <strong className="text-blue-300">Direct Return (Empty)</strong> to Base.
          </span>

          <div className="flex items-center gap-3">
            {successMsg && (
              <span className="text-xs text-green-400 font-bold">
                ✓ Direct Return Recorded
              </span>
            )}
            <button
              type="submit"
              disabled={disabled || isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-xs font-black text-white shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : existing ? 'Update Direct Return' : 'Confirm Direct Return'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
