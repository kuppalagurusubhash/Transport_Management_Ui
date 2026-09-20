import React, { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import type { Lorry, LorryStatus } from '../../data/types';
import { useOrders } from '../../store/OrdersContext';

interface LorryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lorryToEdit?: Lorry; // If provided, we are editing; otherwise, adding.
}

export function LorryModal({ isOpen, onClose, lorryToEdit }: LorryModalProps) {
  const { addLorry, updateLorry, drivers, lorries } = useOrders();

  const [plate, setPlate] = useState('');
  const [driverId, setDriverId] = useState<string>('');
  const [capacitySqft, setCapacitySqft] = useState<number>(1800);
  const [location, setLocation] = useState('Depot — Ramapuram');
  const [status, setStatus] = useState<LorryStatus>('idle');

  useEffect(() => {
    if (lorryToEdit) {
      setPlate(lorryToEdit.plate);
      setDriverId(lorryToEdit.driverId || '');
      setCapacitySqft(lorryToEdit.capacitySqft);
      setLocation(lorryToEdit.location);
      setStatus(lorryToEdit.status);
    } else {
      setPlate('');
      setDriverId('');
      setCapacitySqft(1800);
      setLocation('Depot — Ramapuram');
      setStatus('idle');
    }
  }, [lorryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    const data = {
      plate: plate.trim().toUpperCase(),
      driverId: driverId ? driverId : null,
      capacitySqft,
      location: location.trim(),
      status
    };

    if (lorryToEdit) {
      updateLorry(lorryToEdit.id, data);
    } else {
      addLorry(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-ink-700 bg-ink-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
          <h3 className="text-base font-extrabold text-white">
            {lorryToEdit ? `Edit Lorry · ${lorryToEdit.plate}` : 'Add New Lorry'}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Plate */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Plate Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. KL-07 AB 4521"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Driver */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Assign Driver
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
              aria-label="Assign driver to lorry"
            >
              <option value="">No Driver Assigned</option>
              {drivers.map((d) => {
                // Find if driver is already assigned to a lorry other than lorryToEdit
                const assignedLorry = lorries.find((l) => l.driverId === d.id && (!lorryToEdit || l.id !== lorryToEdit.id));
                const label = assignedLorry 
                  ? `${d.name} (Assigned to ${assignedLorry.plate})`
                  : `${d.name} (Available)`;
                return (
                  <option key={d.id} value={d.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Capacity & Initial Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
                Capacity (sqft)
              </label>
              <input
                type="number"
                min={0}
                required
                value={capacitySqft}
                onChange={(e) => setCapacitySqft(Number(e.target.value))}
                className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LorryStatus)}
                className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                aria-label="Lorry status"
              >
                <option value="idle">Idle</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="sold">Sold / Retired</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Current Location
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Depot — Ramapuram"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-ink-700 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-400 transition-colors"
            >
              {lorryToEdit ? 'Save Changes' : 'Add Lorry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
