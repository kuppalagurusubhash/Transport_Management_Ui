import React, { useState } from 'react';
import { Truck, CheckCircle2, Gauge, Fuel, Wrench, ShieldCheck, Clock, Calendar } from 'lucide-react';
import type { Trip, VehicleReturnDetails } from '../../data/types';

interface VehicleReturnFormProps {
  trip: Trip;
  onSave: (data: VehicleReturnDetails) => Promise<void>;
  disabled?: boolean;
}

export function VehicleReturnForm({ trip, onSave, disabled }: VehicleReturnFormProps) {
  const existing = trip.vehicleReturnDetails;

  const [returnDate, setReturnDate] = useState<string>(existing?.returnDate || new Date().toISOString().split('T')[0]);
  const [returnTime, setReturnTime] = useState<string>(existing?.returnTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [finalOdometerKm, setFinalOdometerKm] = useState<string>(existing?.finalOdometerKm ? String(existing.finalOdometerKm) : '');
  const [fuelRemainingLiters, setFuelRemainingLiters] = useState<string>(existing?.fuelRemainingLiters !== undefined ? String(existing.fuelRemainingLiters) : '35');
  const [driverConfirmation, setDriverConfirmation] = useState<boolean>(existing?.driverConfirmation ?? true);
  const [vehicleCondition, setVehicleCondition] = useState<string>(existing?.vehicleCondition || 'good');
  const [remarks, setRemarks] = useState<string>(existing?.remarks || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverConfirmation) {
      alert('Please confirm driver arrival.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: VehicleReturnDetails = {
        returnDate,
        returnTime,
        finalOdometerKm: finalOdometerKm ? Number(finalOdometerKm) : undefined,
        fuelRemainingLiters: fuelRemainingLiters ? Number(fuelRemainingLiters) : undefined,
        driverConfirmation,
        vehicleCondition,
        remarks: remarks.trim() || undefined,
        returnedToBaseAt: new Date().toISOString()
      };
      await onSave(data);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Failed to save vehicle base return:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-700 bg-gradient-to-b from-ink-900 to-ink-950 p-6 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Truck className="h-5 w-5" />
            <h3 className="text-base font-black uppercase tracking-wider">
              VEHICLE RETURNED TO BASE (KADAPA)
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Record vehicle arrival at home depot and prepare for Final Journey Audit
          </p>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-mono px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold self-start">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Depot Location: Kadapa Base
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Return Date */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Return Date *
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Return Time */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Return Time
            </label>
            <input
              type="time"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Final Odometer */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Final Odometer (km)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={finalOdometerKm}
                onChange={(e) => setFinalOdometerKm(e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
                placeholder="e.g. 149450"
              />
              <span className="absolute right-3 top-2 text-xs text-neutral-500 font-bold">km</span>
            </div>
          </div>

          {/* Fuel Remaining */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Fuel Remaining (Liters)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={fuelRemainingLiters}
                onChange={(e) => setFuelRemainingLiters(e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
                placeholder="35"
              />
              <span className="absolute right-3 top-2 text-xs text-neutral-500 font-bold">L</span>
            </div>
          </div>

          {/* Vehicle Condition */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Vehicle Condition
            </label>
            <select
              value={vehicleCondition}
              onChange={(e) => setVehicleCondition(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            >
              <option value="excellent">Excellent — Ready for next trip</option>
              <option value="good">Good Condition</option>
              <option value="needs_service">Needs Maintenance / Service</option>
              <option value="damaged">Minor Repair / Tyre issue</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Vehicle Return Remarks / Depot Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              placeholder="e.g. Vehicle safely parked at Kadapa yard, driver keys handed over"
            />
          </div>
        </div>

        {/* Driver Confirmation Check */}
        <div className="rounded-xl bg-black/40 border border-white/5 p-4 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={driverConfirmation}
              onChange={(e) => setDriverConfirmation(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-ink-700 bg-ink-900 text-gold focus:ring-gold"
            />
            <span className="text-xs text-neutral-300 font-medium">
              Driver <strong className="text-white">{trip.driverId}</strong> has returned and verified the vehicle status
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs text-neutral-500">
            Records status as <strong className="text-emerald-400">Returned to Base</strong> · Final Trip Audit becomes active.
          </span>

          <div className="flex items-center gap-3">
            {successMsg && (
              <span className="text-xs text-green-400 font-bold">
                ✓ Base Arrival Recorded!
              </span>
            )}
            <button
              type="submit"
              disabled={disabled || isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : existing ? 'Update Base Arrival' : 'Confirm Base Return'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
