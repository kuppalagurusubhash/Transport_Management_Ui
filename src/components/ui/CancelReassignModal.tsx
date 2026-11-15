import React, { useState } from 'react';
import { XIcon, AlertTriangleIcon, ArrowRightIcon, CheckCircle2Icon } from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { UnloadingAllocation, UnloadingParty } from '../../data/types';
import { tripUnloadingApi } from '../../api';

interface CancelReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tripId: string;
  allocation: UnloadingAllocation | null;
  unloadingParties: UnloadingParty[];
}

export function CancelReassignModal({
  isOpen,
  onClose,
  onSuccess,
  tripId,
  allocation,
  unloadingParties
}: CancelReassignModalProps) {
  if (!isOpen || !allocation) return null;

  const delivered = Number(allocation.piecesDelivered) || 0;
  const assigned = Number(allocation.piecesAssigned || allocation.piecesDelivered) || 0;
  const undeliveredPieces = Math.max(0, assigned - delivered);

  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [newPartyName, setNewPartyName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRate, setNewRate] = useState(String(allocation.agreedRate || 40));
  const [reassignPieces, setReassignPieces] = useState(String(undeliveredPieces));
  const [extraTransport, setExtraTransport] = useState('0');
  const [extraHamali, setExtraHamali] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePartySelect = (partyId: string) => {
    setSelectedPartyId(partyId);
    if (partyId === 'new') {
      setNewPartyName('');
      setNewLocation('');
    } else {
      const match = unloadingParties.find(p => p.id === partyId);
      if (match) {
        setNewPartyName(match.name);
        setNewLocation(match.district || 'Kerala');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cancellationReason.trim()) {
      setError('Please provide a reason for cancellation / re-routing.');
      return;
    }

    const partyIdToUse = selectedPartyId === 'new' ? (`CUST-${Date.now().toString().slice(-5)}`) : selectedPartyId;
    const partyNameToUse = selectedPartyId === 'new' ? newPartyName.trim() : (unloadingParties.find(p => p.id === selectedPartyId)?.name || selectedPartyId);

    if (!partyIdToUse || !partyNameToUse) {
      setError('Please select or specify the alternative Kerala customer.');
      return;
    }

    if (!newLocation.trim()) {
      setError('Please enter the revised delivery location in Kerala.');
      return;
    }

    const pieces = Number(reassignPieces);
    if (!pieces || pieces <= 0 || pieces > undeliveredPieces) {
      setError(`Reassigned pieces must be between 1 and ${undeliveredPieces}.`);
      return;
    }

    const rate = Number(newRate);
    if (!rate || rate <= 0) {
      setError('Please enter a valid agreed selling rate for the new party.');
      return;
    }

    setLoading(true);
    try {
      await tripUnloadingApi.reassignOrder(tripId, {
        originalAllocationId: allocation.id,
        cancellationReason: cancellationReason.trim(),
        alternativePartyId: partyIdToUse,
        alternativePartyName: partyNameToUse,
        newDeliveryLocation: newLocation.trim(),
        newAgreedRate: rate,
        reassignedQuantityPieces: pieces,
        extraTransportCost: Number(extraTransport) || 0,
        extraHamaliCost: Number(extraHamali) || 0,
        notes: notes.trim()
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reassign order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#161821] p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangleIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Cancel Order / Reassign Destination</h2>
            <p className="text-xs text-neutral-400">
              Preserve original order audit trail and divert loaded stones to alternative Kerala customer
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Original Allocation Summary */}
        <div className="mt-4 rounded-xl border border-white/10 bg-[#1e212d] p-4 text-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
            Original Customer Allocation
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-neutral-300">
            <div>
              <span className="text-neutral-500 block">Party</span>
              <span className="font-semibold text-white">{allocation.partyName}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Location</span>
              <span>{allocation.deliveryLocation}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Stones Loaded</span>
              <span className="font-mono">{assigned} pcs</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Already Delivered</span>
              <span className="font-mono text-emerald-400">{delivered} pcs</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-amber-400 font-medium">
              Available Undelivered Stones for Reassignment:
            </span>
            <span className="font-mono text-sm font-bold text-amber-300">
              {undeliveredPieces} pieces ({undeliveredPieces * (allocation.size === '3x3' ? 9 : 4)} sqft)
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Cancellation Reason */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
              Cancellation Reason <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kerala site boundary dispute, customer postponed construction, buyer unreachable"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Alternative Party Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Select Alternative Party <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={selectedPartyId}
                onChange={(e) => handlePartySelect(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Choose Kerala Buyer --</option>
                {unloadingParties
                  .filter((p) => p.id !== allocation.unloadingPartyId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.district})
                    </option>
                  ))}
                <option value="new">+ Create New Kerala Party</option>
              </select>
            </div>

            {selectedPartyId === 'new' && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  New Customer Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Stone Traders"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Destination and Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                New Delivery Location / District <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Palakkad, Thrissur"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Reassigned Pieces <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={undeliveredPieces}
                required
                value={reassignPieces}
                onChange={(e) => setReassignPieces(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                New Agreed Selling Rate (₹/sqft) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Extra Logistics Expenses Incurred by Divert */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Additional Transport / Route Divert Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={extraTransport}
                onChange={(e) => setExtraTransport(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Extra Hamali / Labour Handling (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={extraHamali}
                onChange={(e) => setExtraHamali(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
              Internal Reassignment Notes
            </label>
            <textarea
              rows={2}
              placeholder="Notes on communication with lorry driver and new buyer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2 text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2.5 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              <ArrowRightIcon className="h-4 w-4" />
              {loading ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
