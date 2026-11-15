import React, { useState, useEffect } from 'react';
import { XIcon, DownloadIcon, FileTextIcon, FilterIcon, CalendarIcon, RefreshCwIcon, ExternalLinkIcon } from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { PartyLedgerData } from '../../data/types';
import { ledgerApi } from '../../api';

interface PartyStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyId: string;
  partyName: string;
  role: 'supplier' | 'customer';
}

export function PartyStatementModal({
  isOpen,
  onClose,
  partyId,
  partyName,
  role
}: PartyStatementModalProps) {
  if (!isOpen) return null;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<PartyLedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ledgerApi.getPartyLedger(partyId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        role,
        search: search || undefined
      });
      if (res?.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch party statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [partyId, role, startDate, endDate]);

  const pdfUrl = ledgerApi.getStatementPdfUrl(partyId, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    role,
    search: search || undefined
  });

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#161821] p-4 sm:p-6 shadow-2xl text-white max-h-[90dvh] flex flex-col">
            {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 pb-3.5 sm:pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${role === 'supplier' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                    <FileTextIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{partyName}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role === 'supplier' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {role === 'supplier' ? 'Loading Supplier' : 'Kerala Customer'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Authoritative financial ledger &amp; GST-ready PDF statement
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-black hover:bg-gold/90 transition-colors shadow-lg"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download Statement PDF
                  </a>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Date Filters & Search */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-[#0d0f14] p-3 rounded-xl border border-white/5 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 text-[11px]">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#161821] px-2.5 py-1.5 text-neutral-300 focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 text-[11px]">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#161821] px-2.5 py-1.5 text-neutral-300 focus:outline-none focus:border-gold"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="text-[11px] text-neutral-400 hover:text-white underline"
                    >
                      Clear Range
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search item, trip, UTR..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchLedger()}
                    className="rounded-lg border border-white/10 bg-[#161821] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold placeholder-neutral-600 w-48"
                  />
                  <button
                    onClick={fetchLedger}
                    className="rounded-lg bg-white/10 p-2 text-neutral-300 hover:text-white hover:bg-white/20"
                  >
                    <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* KPI Financial Cards */}
              {data && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-white/5 bg-[#1a1d27] p-3">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Opening Balance</span>
                    <span className="font-mono text-sm font-bold text-neutral-300">{formatINR(data.summary.openingBalance)}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#1a1d27] p-3">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                      {role === 'supplier' ? 'Total Purchases' : 'Total Invoiced'}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {formatINR(role === 'supplier' ? data.summary.totalPurchases || 0 : data.summary.totalInvoiced || 0)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#1a1d27] p-3">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                      {role === 'supplier' ? 'Paid to Supplier' : 'Collected from Customer'}
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {formatINR(role === 'supplier' ? data.summary.totalPaid || 0 : data.summary.totalReceived || 0)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">Closing Balance Due</span>
                    <span className="font-mono text-base font-extrabold text-amber-300">
                      {formatINR(data.summary.closingBalance)}
                    </span>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#0d0f14]">
                {loading ? (
                  <div className="p-8 text-center text-xs text-neutral-400">Loading authoritative ledger entries...</div>
                ) : error ? (
                  <div className="p-8 text-center text-xs text-red-400">{error}</div>
                ) : !data || data.transactions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400">No matching transactions found in this period.</div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#161821] text-[10px] uppercase font-bold text-neutral-400 tracking-wider sticky top-0 z-10">
                        <th className="p-3">Date</th>
                        <th className="p-3">Trip / Ref</th>
                        <th className="p-3">Lorry</th>
                        <th className="p-3">{role === 'supplier' ? 'Stone Item / Quarry' : 'Stone Item / Delivery'}</th>
                        <th className="p-3 text-right">Pieces</th>
                        <th className="p-3 text-right">{role === 'supplier' ? 'Purchase Amount' : 'Invoice Amount'}</th>
                        <th className="p-3 text-right">{role === 'supplier' ? 'Paid' : 'Received'}</th>
                        <th className="p-3 text-right">Balance Due</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.transactions.map((t, idx) => {
                        const gross = role === 'supplier' ? (t.purchaseAmount || 0) : (t.invoiceAmount || 0);
                        const paid = role === 'supplier' ? (t.paidAmount || 0) : (t.amountReceived || 0);
                        const bal = t.balance !== undefined ? t.balance : ((gross - paid) || 0);

                        return (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 text-neutral-300 font-mono text-[11px]">{t.date}</td>
                            <td className="p-3 font-semibold text-white">{t.tripCode || t.reference || '-'}</td>
                            <td className="p-3 text-neutral-400 font-mono">{t.lorryPlate || '-'}</td>
                            <td className="p-3 text-neutral-300 max-w-xs truncate" title={t.stoneItem}>
                              {t.stoneItem}
                            </td>
                            <td className="p-3 text-right font-mono text-neutral-300">{t.pieces}</td>
                            <td className="p-3 text-right font-mono font-medium text-white">{formatINR(gross)}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">{formatINR(paid)}</td>
                            <td className="p-3 text-right font-mono font-bold text-amber-400">{formatINR(bal)}</td>
                            <td className="p-3 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${bal === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {bal === 0 ? 'Cleared' : 'Due'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          );
}
