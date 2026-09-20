import React, { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import type { LoadingParty } from '../../data/types';
import { useOrders } from '../../store/OrdersContext';

interface LoadingPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyToEdit?: LoadingParty; // If provided, we are editing; otherwise, adding.
}

export function LoadingPartyModal({ isOpen, onClose, partyToEdit }: LoadingPartyModalProps) {
  const { addLoadingParty, updateLoadingParty, trips } = useOrders();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [paid, setPaid] = useState<number | string>('');
  const [supervisorUsername, setSupervisorUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (partyToEdit) {
      setName(partyToEdit.name);
      setLocation(partyToEdit.location);
      
      // Calculate sum of payments recorded on dispatches
      const orderTrips = trips.filter(t => t.stoneLines.some(line => line.loadingPartyId === partyToEdit.id));
      const tripPaymentsSum = orderTrips.reduce((acc, t) => {
        const partyPayments = t.loadingPartyPayments || [];
        const partyPaid = partyPayments
          .filter(p => p.loadingPartyId === partyToEdit.id)
          .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
        return acc + partyPaid;
      }, 0);

      const directPaid = Math.max(0, (partyToEdit.paid || 0) - tripPaymentsSum);
      setPaid(directPaid);
      setSupervisorUsername(''); // supervisor changes aren't directly mutable in this schema unless custom, but keeping it empty or read-only is fine
    } else {
      setName('');
      setLocation('');
      setPaid('');
      setSupervisorUsername('');
    }
  }, [partyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !location.trim()) return;

    if (!location.trim().toLowerCase().startsWith('ramapuram')) {
      setError('Quarry/Shop must be located in Ramapuram only');
      return;
    }

    const data = {
      name: name.trim(),
      location: location.trim(),
      paid: Number(paid || 0),
      supervisorUsername: supervisorUsername.trim() ? supervisorUsername.trim() : undefined
    };

    if (partyToEdit) {
      updateLoadingParty(partyToEdit.id, data as any);
    } else {
      addLoadingParty(data as any);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-ink-700 bg-ink-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
          <h3 className="text-base font-extrabold text-white">
            {partyToEdit ? `Edit Loading Party · ${partyToEdit.name}` : 'Add New Loading Party'}
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
          {error && (
            <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}
          {/* Name */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Party / Quarry Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramapuram Granites"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Location / Area
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramapuram"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Paid amount (Only when editing) */}
          {partyToEdit && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5 flex justify-between">
                <span>Direct / Lump-Sum Paid (₹)</span>
                <span className="text-[10px] text-neutral-400 font-normal normal-case">Excludes trip payments</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 50000"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
              />
              <p className="mt-1.5 text-[10px] text-neutral-500 leading-normal">
                Direct / lump-sum payments paid directly to this quarry. Payments recorded on trip dispatches are tracked and added automatically.
              </p>
            </div>
          )}

          {/* Supervisor Username */}
          {!partyToEdit && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
                Assign Supervisor Username <span className="text-[10px] text-neutral-500 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. supervisor1"
                value={supervisorUsername}
                onChange={(e) => setSupervisorUsername(e.target.value)}
                className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
              />
            </div>
          )}

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
              {partyToEdit ? 'Save Changes' : 'Add Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
