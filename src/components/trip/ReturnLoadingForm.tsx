import React, { useState } from 'react';
import { Truck, Scale, DollarSign, Calendar, Clock, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { Trip, ReturnSandLoad, Lorry, Driver } from '../../data/types';

interface ReturnLoadingFormProps {
  trip: Trip;
  lorry?: Lorry;
  driver?: Driver;
  onSave: (data: ReturnSandLoad) => Promise<void>;
  disabled?: boolean;
}

export function ReturnLoadingForm({ trip, lorry, driver, onSave, disabled }: ReturnLoadingFormProps) {
  const existing = trip.returnSandLoad;

  const [loadingLocation, setLoadingLocation] = useState<string>(existing?.loadingLocation || 'Mangalore');
  const [destination, setDestination] = useState<string>(existing?.destination || 'L&T Factory');
  const [sandType, setSandType] = useState<string>(existing?.sandType || 'River Sand');
  const [quantityPieces, setQuantityPieces] = useState<string>(existing?.quantityPieces ? String(existing.quantityPieces) : '');
  const [weightTons, setWeightTons] = useState<string>(existing?.weightTons ? String(existing.weightTons) : '24.50');
  const [ratePerTon, setRatePerTon] = useState<string>(existing?.ratePerTon ? String(existing.ratePerTon) : '1850');
  const [labourCost, setLabourCost] = useState<string>(existing?.labourCost !== undefined ? String(existing.labourCost) : '1500');
  const [mamulu, setMamulu] = useState<string>(existing?.mamulu !== undefined ? String(existing.mamulu) : '500');
  const [otherExpenses, setOtherExpenses] = useState<string>(existing?.otherExpenses !== undefined ? String(existing.otherExpenses) : '0');
  const [loadingDate, setLoadingDate] = useState<string>(existing?.loadingDate || new Date().toISOString().split('T')[0]);
  const [loadingTime, setLoadingTime] = useState<string>(existing?.loadingTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [remarks, setRemarks] = useState<string>(existing?.remarks || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const numWeight = parseFloat(weightTons) || 0;
  const numRate = parseFloat(ratePerTon) || 0;
  const numLabour = parseFloat(labourCost) || 0;
  const numMamulu = parseFloat(mamulu) || 0;
  const numOther = parseFloat(otherExpenses) || 0;

  // Real-time calculations
  const totalReturnLoadValue = Math.round(numWeight * numRate);
  const totalReturnExpenses = numLabour + numMamulu + numOther;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numWeight || numWeight <= 0) {
      alert('Please enter a valid sand weight in tons.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: ReturnSandLoad = {
        loadingLocation,
        destination,
        sandType,
        quantityPieces: quantityPieces ? Number(quantityPieces) : undefined,
        weightTons: numWeight,
        ratePerTon: numRate,
        labourCost: numLabour,
        mamulu: numMamulu,
        otherExpenses: numOther,
        loadingDate,
        loadingTime,
        remarks: remarks.trim() || undefined,
        driverName: driver?.name,
        lorryPlate: lorry?.plate,
        capacityTons: 28
      };
      await onSave(data);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Failed to save return sand loading:', err);
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
              RETURN SAND LOADING
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Record sand loaded during the return journey
          </p>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-300 font-bold self-start">
          Leg 3: {loadingLocation} → {destination}
        </span>
      </div>

      {/* Selected Fleet Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-black/40 rounded-xl p-3.5 border border-white/5 text-xs">
        <div>
          <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Vehicle</span>
          <span className="font-mono font-bold text-white text-sm">{lorry?.plate || trip.lorryId}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Driver</span>
          <span className="font-semibold text-white">{driver?.name || trip.driverId}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Current Location</span>
          <span className="font-semibold text-amber-300">{loadingLocation}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Destination</span>
          <span className="font-semibold text-gold">{destination}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Vehicle Capacity</span>
          <span className="font-mono font-bold text-cyan-300">28.00 Ton</span>
        </div>
      </div>

      {/* Form Details */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Loading Location */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Loading Location *
            </label>
            <select
              value={loadingLocation}
              onChange={(e) => setLoadingLocation(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            >
              <option value="Mangalore">Mangalore</option>
              <option value="Kanaya">Kanaya</option>
              <option value="Udupi">Udupi</option>
              <option value="Other">Other Source</option>
            </select>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              placeholder="e.g. L&T Factory"
            />
          </div>

          {/* Sand Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Sand Type *
            </label>
            <select
              value={sandType}
              onChange={(e) => setSandType(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            >
              <option value="River Sand">River Sand</option>
              <option value="M-Sand">M-Sand (Manufactured Sand)</option>
              <option value="P-Sand">P-Sand (Plastering Sand)</option>
              <option value="Crushed Stone Sand">Crushed Stone Sand</option>
              <option value="Gravel / Aggregate">Gravel / Aggregate</option>
            </select>
          </div>

          {/* Weight in Tons */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Weight (Ton) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={weightTons}
                onChange={(e) => setWeightTons(e.target.value)}
                disabled={disabled}
                required
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
                placeholder="24.50"
              />
              <span className="absolute right-3 top-2 text-xs text-neutral-500 font-bold">Ton</span>
            </div>
          </div>

          {/* Rate per Ton */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Rate / Ton (₹) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                value={ratePerTon}
                onChange={(e) => setRatePerTon(e.target.value)}
                disabled={disabled}
                required
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
                placeholder="1850"
              />
              <span className="absolute right-3 top-2 text-xs text-neutral-500 font-bold">₹/T</span>
            </div>
          </div>

          {/* Labour / Hamali */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Labour / Hamali (₹)
            </label>
            <input
              type="number"
              min="0"
              value={labourCost}
              onChange={(e) => setLabourCost(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
              placeholder="1500"
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
              placeholder="500"
            />
          </div>

          {/* Other Charges */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Other Charges (₹)
            </label>
            <input
              type="number"
              min="0"
              value={otherExpenses}
              onChange={(e) => setOtherExpenses(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
              placeholder="0"
            />
          </div>

          {/* Loading Date */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Loading Date *
            </label>
            <input
              type="date"
              value={loadingDate}
              onChange={(e) => setLoadingDate(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Loading Time */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Loading Time
            </label>
            <input
              type="time"
              value={loadingTime}
              onChange={(e) => setLoadingTime(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Remarks */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Loading Remarks / Note
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              placeholder="e.g. Clean river sand loaded at Mangalore yard"
            />
          </div>
        </div>

        {/* Real-time Calculation Summary Card */}
        <div className="rounded-xl bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 border border-gold/30 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block font-sans">Total Sand Weight</span>
              <span className="text-base font-black text-white">{numWeight.toFixed(2)} Ton</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block font-sans">Rate Applied</span>
              <span className="text-base font-bold text-neutral-300">₹{numRate.toLocaleString('en-IN')}/Ton</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-emerald-400 block font-sans">Total Return Load Value</span>
              <span className="text-base font-black text-emerald-400">{formatINR(totalReturnLoadValue)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-red-400 block font-sans">Total Return Load Expenses</span>
              <span className="text-base font-black text-red-300">− {formatINR(totalReturnExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-between pt-2">
          {successMsg ? (
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/30">
              <CheckCircle2 className="h-4 w-4" /> Return Sand Loading saved successfully.
            </span>
          ) : (
            <span className="text-xs text-neutral-500">
              Confirming moves vehicle status to: <strong className="text-orange-400">Return Sand Loaded (In Transit to L&T)</strong>
            </span>
          )}

          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-400 px-6 py-2.5 text-xs font-black text-ink-950 shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSubmitting ? 'Saving...' : existing ? 'Update Return Load' : 'Confirm Return Load'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
