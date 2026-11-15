import React, { useState, useEffect } from 'react';
import { useOrders } from '../store/OrdersContext';
import { formatINR } from '../utils/helpers';
import {
  CreditCardIcon,
  CheckCircle2Icon,
  ClockIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  PlusIcon,
  FileTextIcon,
  DownloadIcon,
  FilterIcon,
  RefreshCwIcon,
  SearchIcon,
  Building2Icon,
  UsersIcon,
  ReceiptIcon
} from 'lucide-react';
import { paymentsApi, ledgerApi } from '../api';
import type { PaymentRecord } from '../data/types';
import { RecordPaymentModal } from '../components/ui/RecordPaymentModal';
import { PartyStatementModal } from '../components/ui/PartyStatementModal';

export function Payments() {
  const { loadingParties, unloadingParties, trips, syncDatabase } = useOrders();

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'register'>('customers');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordDefaultRole, setRecordDefaultRole] = useState<'supplier' | 'customer'>('customer');
  const [recordDefaultPartyId, setRecordDefaultPartyId] = useState('');

  const [statementParty, setStatementParty] = useState<{ id: string; name: string; role: 'supplier' | 'customer' } | null>(null);

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await paymentsApi.getAll();
      if (res?.data) {
        setPayments(res.data);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalCustomerReceivable = unloadingParties.reduce((sum, u) => sum + (u.pending || 0), 0);
  const totalCustomerCollected = unloadingParties.reduce((sum, u) => sum + (u.paid || 0), 0);
  const totalSupplierPayable = loadingParties.reduce((sum, l) => sum + (l.pending || 0), 0);
  const totalSupplierPaid = loadingParties.reduce((sum, l) => sum + (l.paid || 0), 0);

  const filteredCustomers = unloadingParties.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.district && p.district.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSuppliers = loadingParties.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.location && p.location.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredPayments = payments.filter(
    (p) => !search || (p.partyName && p.partyName.toLowerCase().includes(search.toLowerCase())) || (p.reference && p.reference.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl flex items-center gap-2">
            <span>Party Ledgers &amp; Settlements</span>
            <span className="text-xs bg-gold/15 text-gold px-2.5 py-0.5 rounded-full font-bold border border-gold/30">
              Authoritative
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Authoritative financial ledger for Kerala customer receivables and Ramapuram quarry supplier payables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRecordDefaultRole(activeTab === 'suppliers' ? 'supplier' : 'customer');
              setRecordDefaultPartyId('');
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-black hover:bg-gold/90 transition-colors shadow-lg"
          >
            <PlusIcon className="h-4 w-4" />
            Record Payment / Voucher
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-blue-500/20 bg-[#121622] p-4 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Buyer Receivables Due</span>
          <span className="font-mono text-xl font-black text-amber-400 block mt-1">
            {formatINR(totalCustomerReceivable)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">From Kerala Customers</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#121c16] p-4 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Buyer Receipts</span>
          <span className="font-mono text-xl font-black text-emerald-400 block mt-1">
            {formatINR(totalCustomerCollected)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Collected to Date</span>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-[#1f1910] p-4 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Quarry Supplier Due</span>
          <span className="font-mono text-xl font-black text-red-400 block mt-1">
            {formatINR(totalSupplierPayable)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Pending to Quarries</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#13151a] p-4 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Supplier Paid</span>
          <span className="font-mono text-xl font-black text-neutral-200 block mt-1">
            {formatINR(totalSupplierPaid)}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">Paid to Quarries</span>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'customers' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
          >
            <UsersIcon className="h-4 w-4" />
            Kerala Customer Ledgers ({unloadingParties.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'suppliers' ? 'bg-amber-600 text-white shadow-md' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
          >
            <Building2Icon className="h-4 w-4" />
            Quarry Supplier Ledgers ({loadingParties.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'register' ? 'bg-emerald-600 text-white shadow-md' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
          >
            <ReceiptIcon className="h-4 w-4" />
            Payment Vouchers Register ({payments.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by party or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-xl border border-white/10 bg-[#13151a] py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-gold focus:outline-none"
            />
          </div>
          <button
            onClick={() => { fetchPayments(); syncDatabase(); }}
            className="rounded-xl border border-white/10 bg-[#13151a] p-2 text-neutral-400 hover:text-white hover:bg-white/10"
            title="Refresh Ledger"
          >
            <RefreshCwIcon className={`h-4 w-4 ${loadingPayments ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab 1: Kerala Customers */}
      {activeTab === 'customers' && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#13151a] shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#181a22] text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                <th className="p-4">Party Name</th>
                <th className="p-4">Kerala District</th>
                <th className="p-4 text-right">Total Invoiced</th>
                <th className="p-4 text-right">Total Received</th>
                <th className="p-4 text-right">Outstanding Balance</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    No matching Kerala customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div>{p.name}</div>
                      <div className="text-[10px] font-mono text-neutral-500">{p.id}</div>
                    </td>
                    <td className="p-4 text-neutral-300">{p.district || 'Kerala'}</td>
                    <td className="p-4 text-right font-mono text-neutral-200">{formatINR(p.totalOrdered || 0)}</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400">{formatINR(p.paid || 0)}</td>
                    <td className="p-4 text-right font-mono font-extrabold text-amber-400">
                      {formatINR(p.pending || 0)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${p.pending === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {p.pending === 0 ? 'Fully Cleared' : 'Payment Due'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setRecordDefaultRole('customer');
                            setRecordDefaultPartyId(p.id);
                            setIsRecordModalOpen(true);
                          }}
                          className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                        >
                          + Receive
                        </button>
                        <button
                          onClick={() => setStatementParty({ id: p.id, name: p.name, role: 'customer' })}
                          className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10"
                        >
                          <FileTextIcon className="h-3 w-3" />
                          Ledger
                        </button>
                        <a
                          href={ledgerApi.getStatementPdfUrl(p.id, { role: 'customer' })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-gold/10 p-1.5 text-gold hover:bg-gold/20 border border-gold/30"
                          title="Download PDF Statement"
                        >
                          <DownloadIcon className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Quarry Suppliers (e.g. Venu) */}
      {activeTab === 'suppliers' && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#13151a] shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#181a22] text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                <th className="p-4">Quarry Supplier</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-right">Total Purchased</th>
                <th className="p-4 text-right">Total Paid</th>
                <th className="p-4 text-right">Outstanding Balance</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    No matching quarry suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div>{p.name}</div>
                      <div className="text-[10px] font-mono text-neutral-500">{p.id}</div>
                    </td>
                    <td className="p-4 text-neutral-300">{p.location || 'Ramapuram'}</td>
                    <td className="p-4 text-right font-mono text-neutral-200">{formatINR(p.totalPurchased || 0)}</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400">{formatINR(p.paid || 0)}</td>
                    <td className="p-4 text-right font-mono font-extrabold text-amber-400">
                      {formatINR(p.pending || 0)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${p.pending === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {p.pending === 0 ? 'Fully Paid' : 'Payable Due'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setRecordDefaultRole('supplier');
                            setRecordDefaultPartyId(p.id);
                            setIsRecordModalOpen(true);
                          }}
                          className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                        >
                          + Pay Quarry
                        </button>
                        <button
                          onClick={() => setStatementParty({ id: p.id, name: p.name, role: 'supplier' })}
                          className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10"
                        >
                          <FileTextIcon className="h-3 w-3" />
                          Ledger
                        </button>
                        <a
                          href={ledgerApi.getStatementPdfUrl(p.id, { role: 'supplier' })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-gold/10 p-1.5 text-gold hover:bg-gold/20 border border-gold/30"
                          title="Download PDF Statement"
                        >
                          <DownloadIcon className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Payment Register */}
      {activeTab === 'register' && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#13151a] shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#181a22] text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                <th className="p-4">Date</th>
                <th className="p-4">Party Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Reference / UTR</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    No payments recorded yet. Click &quot;Record Payment / Voucher&quot; to create the first voucher.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-neutral-300">{p.date}</td>
                    <td className="p-4 font-semibold text-white">
                      <div>{p.partyName || p.partyId}</div>
                      {p.notes && <div className="text-[10px] text-neutral-500 italic">{p.notes}</div>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.direction === 'receivable_in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {p.direction === 'receivable_in' ? <ArrowDownLeftIcon className="h-3 w-3" /> : <ArrowUpRightIcon className="h-3 w-3" />}
                        {p.direction === 'receivable_in' ? 'Customer Receipt' : 'Supplier Payment'}
                      </span>
                    </td>
                    <td className="p-4 uppercase text-[10px] font-bold text-neutral-300 tracking-wider">{p.method}</td>
                    <td className="p-4 font-mono text-[11px] text-neutral-400">{p.reference || '-'}</td>
                    <td className="p-4 text-right font-mono font-black text-sm text-white">
                      {formatINR(p.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => {
          fetchPayments();
          syncDatabase();
        }}
        defaultPartyId={recordDefaultPartyId}
        defaultRole={recordDefaultRole}
        loadingParties={loadingParties}
        unloadingParties={unloadingParties}
        trips={trips}
      />

      {/* Party Statement Modal */}
      {statementParty && (
        <PartyStatementModal
          isOpen={true}
          onClose={() => setStatementParty(null)}
          partyId={statementParty.id}
          partyName={statementParty.name}
          role={statementParty.role}
        />
      )}
    </div>
  );
}
