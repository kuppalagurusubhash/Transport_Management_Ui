import React, { useState } from 'react';
import { XIcon, CreditCardIcon, CheckCircle2Icon } from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { LoadingParty, UnloadingParty, Trip } from '../../data/types';
import { paymentsApi } from '../../api';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPartyId?: string;
  defaultRole?: 'supplier' | 'customer';
  loadingParties: LoadingParty[];
  unloadingParties: UnloadingParty[];
  trips?: Trip[];
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultPartyId,
  defaultRole = 'customer',
  loadingParties,
  unloadingParties,
  trips = []
}: RecordPaymentModalProps) {
  if (!isOpen) return null;

  const [role, setRole] = useState<'supplier' | 'customer'>(defaultRole);
  const [selectedPartyId, setSelectedPartyId] = useState(defaultPartyId || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<'phonepe' | 'cash' | 'bank_transfer' | 'cheque'>('phonepe');
  const [reference, setReference] = useState('');
  const [selectedTripId, setSelectedTripId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partiesList = role === 'supplier' ? loadingParties : unloadingParties;
  const selectedParty = partiesList.find(p => p.id === selectedPartyId);

  const relevantTrips = trips.filter(t => {
    if (role === 'supplier') {
      return (t.stoneLines || []).some(l => l.loadingPartyId === selectedPartyId) ||
        (t.loadingEntries || []).some(e => e.loadingPartyId === selectedPartyId);
    } else {
      return t.unloadingPartyId === selectedPartyId ||
        (t.unloadingPartyIds || []).includes(selectedPartyId) ||
        (t.unloadingEntries || []).some(e => e.unloadingPartyId === selectedPartyId);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPartyId) {
      setError('Please select a party account.');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    setLoading(true);
    try {
      const allocations = selectedTripId ? [{
        tripId: selectedTripId,
        allocatedAmount: numAmount,
        note: `Allocated payment against trip ${selectedTripId}`
      }] : [];

      await paymentsApi.create({
        partyId: selectedPartyId,
        partyType: role,
        partyName: selectedParty?.name || selectedPartyId,
        direction: role === 'supplier' ? 'payable_out' : 'receivable_in',
        amount: numAmount,
        date: paymentDate,
        method: paymentMode,
        reference: reference.trim(),
        notes: notes.trim(),
        allocations
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#161821] p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CreditCardIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Record Party Payment / Settlement</h2>
            <p className="text-xs text-neutral-400">
              Support partial settlements, PhonePe/Cash vouchers, and trip ledger allocation
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Role Toggle */}
        <div className="mt-4 flex rounded-xl bg-[#0e1017] p-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => { setRole('customer'); setSelectedPartyId(''); }}
            className={`flex-1 rounded-lg py-2 font-bold transition-colors ${role === 'customer' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            Kerala Buyer / Customer Receipt
          </button>
          <button
            type="button"
            onClick={() => { setRole('supplier'); setSelectedPartyId(''); }}
            className={`flex-1 rounded-lg py-2 font-bold transition-colors ${role === 'supplier' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            Quarry Supplier Payment
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Party Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
              Select {role === 'supplier' ? 'Quarry / Supplier' : 'Buyer / Customer'} <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Party --</option>
              {partiesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.pending > 0 ? `(Pending: ₹${p.pending.toLocaleString('en-IN')})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Payment Amount (₹) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-base font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Payment Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Mode & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="phonepe">PhonePe / UPI</option>
                <option value="cash">Cash in Hand</option>
                <option value="bank_transfer">NEFT / RTGS Bank Transfer</option>
                <option value="cheque">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                UTR / Reference / Bill #
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-98231012, Cash-01"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Optional Trip Allocation */}
          {relevantTrips.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Allocate to Specific Trip (Optional)
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Apply to General Account Balance --</option>
                {relevantTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} ({t.date}) - Lorry {t.lorryId}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
              Remarks &amp; Settlement Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Advance paid before lorry dispatch, partial milestone clearance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
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
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              <CheckCircle2Icon className="h-4 w-4" />
              {loading ? 'Recording...' : 'Save Payment Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
