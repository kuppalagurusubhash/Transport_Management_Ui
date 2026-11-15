import React, { useState, useEffect } from 'react';
import {
  Building2Icon,
  PlusIcon,
  Edit2Icon,
  Trash2Icon,
  CheckCircle2Icon,
  LayersIcon,
  CoinsIcon,
  FileTextIcon,
  ClockIcon,
  XIcon
} from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { Trip, LoadingParty, LoadingEntry, Finish } from '../../data/types';
import { tripLoadingApi } from '../../api';

interface MultiQuarryLoadingCardProps {
  trip: Trip;
  loadingParties: LoadingParty[];
  onTripUpdated: () => void;
}

export function MultiQuarryLoadingCard({
  trip,
  loadingParties,
  onTripUpdated
}: MultiQuarryLoadingCardProps) {
  const [entries, setEntries] = useState<LoadingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LoadingEntry | null>(null);
  const [selectedQuarryId, setSelectedQuarryId] = useState('');
  const [quarryName, setQuarryName] = useState('');
  const [quarryLocation, setQuarryLocation] = useState('Ramapuram');
  const [stoneType, setStoneType] = useState('Kadapa Black Stone');
  const [size, setSize] = useState('2x2');
  const [thickness, setThickness] = useState('40mm');
  const [finish, setFinish] = useState<Finish>('rough');
  const [pieces, setPieces] = useState('');
  const [ratePerSqft, setRatePerSqft] = useState('18');
  const [hamaliAmount, setHamaliAmount] = useState('0');
  const [otherExpenses, setOtherExpenses] = useState('0');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [editReason, setEditReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLoadingData = async () => {
    setLoading(true);
    try {
      const res = await tripLoadingApi.getEntries(trip.id);
      if (res?.loadingEntries) {
        setEntries(res.loadingEntries);
      }
    } catch (err: any) {
      console.error('Failed to load quarry entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoadingData();
  }, [trip.id]);

  const openAddModal = () => {
    setEditingEntry(null);
    setSelectedQuarryId(loadingParties[0]?.id || '');
    setQuarryName(loadingParties[0]?.name || 'Ramapuram Quarry');
    setQuarryLocation('Ramapuram');
    setPieces('');
    setRatePerSqft('18');
    setHamaliAmount('0');
    setOtherExpenses('0');
    setBillNumber('');
    setNotes('');
    setEditReason('');
    setIsModalOpen(true);
  };

  const openEditModal = (entry: LoadingEntry) => {
    setEditingEntry(entry);
    setSelectedQuarryId(entry.loadingPartyId || '');
    setQuarryName(entry.quarryName);
    setQuarryLocation(entry.quarryLocation || 'Ramapuram');
    setStoneType(entry.stoneType || 'Kadapa Black Stone');
    setSize(entry.size || '2x2');
    setThickness(entry.thickness || '40mm');
    setFinish(entry.finish || 'rough');
    setPieces(String(entry.pieces));
    setRatePerSqft(String(entry.ratePerSqft || 18));
    setHamaliAmount(String(entry.hamaliAmount || 0));
    setOtherExpenses(String(entry.otherExpenses || 0));
    setBillNumber(entry.billNumber || '');
    setNotes(entry.notes || '');
    setEditReason('');
    setIsModalOpen(true);
  };

  const handleQuarrySelect = (qId: string) => {
    setSelectedQuarryId(qId);
    const match = loadingParties.find(p => p.id === qId);
    if (match) {
      setQuarryName(match.name);
      setQuarryLocation(match.location || 'Ramapuram');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numPieces = Number(pieces);
    if (!numPieces || numPieces <= 0) {
      setError('Please enter a valid piece count.');
      return;
    }

    const sqftPerPiece = size === '3x3' ? 9 : 4;
    const totalSqft = numPieces * sqftPerPiece;
    const rate = Number(ratePerSqft) || 18;
    const totalLoadingValue = totalSqft * rate;

    setSaving(true);
    try {
      if (editingEntry) {
        await tripLoadingApi.updateEntry(trip.id, editingEntry.id, {
          quarryName,
          quarryLocation,
          loadingPartyId: selectedQuarryId,
          stoneType,
          size,
          thickness,
          finish,
          pieces: numPieces,
          sqftPerPiece,
          totalSqft,
          ratePerSqft: rate,
          totalLoadingValue,
          hamaliAmount: Number(hamaliAmount) || 0,
          otherExpenses: Number(otherExpenses) || 0,
          billNumber,
          notes,
          editReason: editReason.trim() || 'Entry updated by user'
        });
      } else {
        await tripLoadingApi.addEntry(trip.id, {
          loadingDate: trip.date,
          quarryName,
          quarryLocation,
          loadingPartyId: selectedQuarryId,
          stoneType,
          size,
          thickness,
          finish,
          pieces: numPieces,
          sqftPerPiece,
          totalSqft,
          ratePerSqft: rate,
          totalLoadingValue,
          hamaliAmount: Number(hamaliAmount) || 0,
          otherExpenses: Number(otherExpenses) || 0,
          billNumber,
          notes
        });
      }

      setIsModalOpen(false);
      await fetchLoadingData();
      onTripUpdated();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save loading entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this quarry loading operation?')) return;
    try {
      await tripLoadingApi.deleteEntry(trip.id, entryId);
      await fetchLoadingData();
      onTripUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Cannot delete entry.');
    }
  };

  // Dynamic calculations
  const totalPiecesLoaded = entries.reduce((s, e) => s + (Number(e.pieces) || 0), 0);
  const totalSqftLoaded = entries.reduce((s, e) => s + (Number(e.totalSqft) || (e.pieces * (e.size === '3x3' ? 9 : 4))), 0);
  const totalStoneCost = entries.reduce((s, e) => s + (Number(e.totalLoadingValue) || 0), 0);
  const totalHamaliCharges = entries.reduce((s, e) => s + (Number(e.hamaliAmount) || 0), 0);
  const totalOtherExpenses = entries.reduce((s, e) => s + (Number(e.otherExpenses) || 0), 0);
  const totalQuarryLoadingCost = totalStoneCost + totalHamaliCharges + totalOtherExpenses;

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2Icon className="h-5 w-5 text-gold" />
          <h3 className="text-base font-extrabold text-white">Multi-Quarry Loading Management</h3>
          <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
            {entries.length} {entries.length === 1 ? 'Quarry' : 'Quarries'} Loaded
          </span>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-gold px-3.5 py-2 text-xs font-bold text-black hover:bg-gold/90 transition-colors shadow-md"
        >
          <PlusIcon className="h-4 w-4" />
          <span>+ Add Quarry Loading Operation</span>
        </button>
      </div>

      {/* Consolidated Loading Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="rounded-xl border border-white/10 bg-[#161821] p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Pieces Loaded</span>
          <span className="font-mono text-base font-black text-white mt-1 block">
            {totalPiecesLoaded.toLocaleString('en-IN')} pcs
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {totalSqftLoaded.toLocaleString('en-IN')} sqft
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161821] p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Stone Purchase Cost</span>
          <span className="font-mono text-base font-black text-amber-400 mt-1 block">
            {formatINR(totalStoneCost)}
          </span>
          <span className="text-[10px] text-neutral-500">Base Quarry Value</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161821] p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Hamali Labour</span>
          <span className="font-mono text-base font-black text-neutral-200 mt-1 block">
            {formatINR(totalHamaliCharges)}
          </span>
          <span className="text-[10px] text-neutral-500">Quarry Workers</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161821] p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Other Loading Exp.</span>
          <span className="font-mono text-base font-black text-neutral-200 mt-1 block">
            {formatINR(totalOtherExpenses)}
          </span>
          <span className="text-[10px] text-neutral-500">Mamullu / Handling</span>
        </div>

        <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-gold block">Total Loading Cost</span>
          <span className="font-mono text-base font-black text-gold mt-1 block">
            {formatINR(totalQuarryLoadingCost)}
          </span>
          <span className="text-[10px] text-gold/70">Consolidated Loading Total</span>
        </div>
      </div>

      {/* Loading Entries Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12141c] shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[#171924] text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              <th className="p-3">Quarry &amp; Location</th>
              <th className="p-3">Stone Item &amp; Size</th>
              <th className="p-3 text-right">Pieces</th>
              <th className="p-3 text-right">Total Sqft</th>
              <th className="p-3 text-right">Rate (₹/sqft)</th>
              <th className="p-3 text-right">Stone Value</th>
              <th className="p-3 text-right">Hamali</th>
              <th className="p-3 text-right">Total Cost</th>
              <th className="p-3">Bill / Ref</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-neutral-400">
                  No quarry loading entries recorded yet. Click &quot;+ Add Quarry Loading Operation&quot; to add quarry entries.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const sqft = entry.totalSqft || (entry.pieces * (entry.size === '3x3' ? 9 : 4));
                const entryCost = (Number(entry.totalLoadingValue) || 0) + (Number(entry.hamaliAmount) || 0) + (Number(entry.otherExpenses) || 0);

                return (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      <div>{entry.quarryName}</div>
                      <div className="text-[10px] text-neutral-500">{entry.quarryLocation || 'Ramapuram'}</div>
                    </td>
                    <td className="p-3 text-neutral-300">
                      <div>{entry.stoneType || 'Kadapa Stone'}</div>
                      <div className="text-[10px] text-neutral-400">
                        {entry.size} {entry.thickness} ({entry.finish})
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">{entry.pieces} pcs</td>
                    <td className="p-3 text-right font-mono text-neutral-300">{sqft} sqft</td>
                    <td className="p-3 text-right font-mono text-neutral-300">₹{entry.ratePerSqft || 18}</td>
                    <td className="p-3 text-right font-mono font-medium text-amber-400">
                      {formatINR(entry.totalLoadingValue)}
                    </td>
                    <td className="p-3 text-right font-mono text-neutral-300">
                      {formatINR(entry.hamaliAmount || 0)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-gold">
                      {formatINR(entryCost)}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-neutral-400">
                      {entry.billNumber || '-'}
                      {entry.auditTrail && entry.auditTrail.length > 1 && (
                        <span className="block text-[9px] text-amber-400 font-sans" title="Has been corrected with audit trail">
                          ✏ Audited ({entry.auditTrail.length})
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="rounded-lg bg-white/5 p-1.5 text-neutral-300 hover:bg-white/10 hover:text-white"
                          title="Edit / Correct Quarry Entry"
                        >
                          <Edit2Icon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
                          title="Delete Entry"
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Loading Operation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#161821] p-6 shadow-2xl text-white">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
                <Building2Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {editingEntry ? 'Edit / Correct Loading Operation' : 'Add Quarry Loading Operation'}
                </h2>
                <p className="text-xs text-neutral-400">
                  Track individual quarry stones loaded, rates, hamali charges, and bill references
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              {/* Quarry Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Select Quarry (Loading Party) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedQuarryId}
                    onChange={(e) => handleQuarrySelect(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-gold focus:outline-none"
                  >
                    {loadingParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.location})
                      </option>
                    ))}
                    <option value="custom">Other / Custom Quarry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Quarry Name &amp; Location <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quarryName}
                    onChange={(e) => setQuarryName(e.target.value)}
                    placeholder="e.g. Quarry A - Ramapuram"
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Stone Spec: Size, Thickness, Finish */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2 text-white focus:border-gold focus:outline-none"
                  >
                    <option value="2x2">2x2 (4 sqft)</option>
                    <option value="3x3">3x3 (9 sqft)</option>
                    <option value="2x1">2x1 (2 sqft)</option>
                    <option value="4x2">4x2 (8 sqft)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Thickness</label>
                  <select
                    value={thickness}
                    onChange={(e) => setThickness(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2 text-white focus:border-gold focus:outline-none"
                  >
                    <option value="30mm">30mm</option>
                    <option value="40mm">40mm</option>
                    <option value="50mm">50mm</option>
                    <option value="60mm">60mm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Finish</label>
                  <select
                    value={finish}
                    onChange={(e) => setFinish(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2 text-white focus:border-gold focus:outline-none"
                  >
                    <option value="rough">Rough</option>
                    <option value="polish">Polish</option>
                  </select>
                </div>
              </div>

              {/* Pieces and Purchase Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Pieces Loaded <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 100"
                    value={pieces}
                    onChange={(e) => setPieces(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Purchase Rate (₹/sqft) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ratePerSqft}
                    onChange={(e) => setRatePerSqft(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Hamali & Bill # */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Hamali (Labour Charges ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hamaliAmount}
                    onChange={(e) => setHamaliAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2 font-mono text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Other Expenses (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={otherExpenses}
                    onChange={(e) => setOtherExpenses(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2 font-mono text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Quarry Bill # / Receipt
                  </label>
                  <input
                    type="text"
                    placeholder="BILL-001"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2 text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {editingEntry && (
                <div>
                  <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                    Audit Trail: Reason for Correction <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weighbridge piece count reconciled with quarry invoice"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/40 bg-[#0d0f14] px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Supporting notes for this quarry loading..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2 text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="rounded-xl px-4 py-2 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2 font-bold text-black hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2Icon className="h-4 w-4" />
                  {saving ? 'Saving...' : editingEntry ? 'Save Correction' : 'Save Loading Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
