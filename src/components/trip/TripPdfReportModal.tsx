import React, { useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  Calendar, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Scale,
  Package,
  Layers,
  Building2,
  Phone,
  UserCheck
} from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import {
  tripWorkerTotal,
  tripExpenseTotal,
  tripReturnRevenue,
  tripReturnExpenses,
  type Trip,
  type Lorry,
  type Driver,
  type LoadingParty,
  type UnloadingParty,
  type DistrictRate
} from '../../data/types';

interface TripPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  lorries?: Lorry[];
  drivers?: Driver[];
  loadingParties?: LoadingParty[];
  unloadingParties?: UnloadingParty[];
  districtRates?: DistrictRate[];
}

export function TripPdfReportModal({
  isOpen,
  onClose,
  trip,
  lorries = [],
  drivers = [],
  loadingParties = [],
  unloadingParties = [],
  districtRates = []
}: TripPdfReportModalProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Resolve Vehicle & Driver
  const lorry = lorries.find((l) => l.id === trip.lorryId || l.plate === trip.lorryId);
  const driver = drivers.find((d) => d.id === trip.driverId);
  const buyer = unloadingParties.find((u) => u.id === trip.unloadingPartyId);
  const firstStoneLine = trip.stoneLines?.[0];
  const quarry = loadingParties.find((lp) => lp.id === firstStoneLine?.loadingPartyId);

  // Outbound Financial Calculations
  const buyerDistrict = buyer?.district;
  const outboundStoneRevenue = (trip.stoneLines || []).reduce((sum, line) => {
    const matchRate = districtRates.find(
      (r) =>
        r.district === buyerDistrict &&
        r.size === line.size &&
        r.thickness === line.thickness &&
        r.finish === line.finish
    );
    const rate = matchRate ? matchRate.ratePerSqft : line.ratePerSqft;
    return sum + (line.sqftPerPiece * line.pieces * rate);
  }, 0);

  const stoneBuyingCost = (trip.stoneLines || []).reduce((sum, line) => {
    return sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft);
  }, 0);

  const outboundHamali = tripWorkerTotal(trip);
  const outboundGeneralExpenses = (trip.expenses || []).reduce((sum, e) => {
    const lbl = (e.label || '').toLowerCase();
    if (
      lbl.includes('return') ||
      lbl.includes('sand') ||
      lbl.includes('l&t') ||
      lbl.includes('mangalore') ||
      lbl.includes('kanaya')
    ) {
      return sum;
    }
    return sum + (Number(e.amount) || 0);
  }, 0);
  const totalOutboundExpenses = outboundHamali + outboundGeneralExpenses;

  // Return Journey Financials
  const isSand = trip.returnPlan === 'sand_return' || trip.returnSandLoad !== undefined;
  const isDirect = trip.returnPlan === 'direct_return' || trip.directReturnDetails !== undefined;
  const returnRevenue = tripReturnRevenue(trip);
  const returnExpenses = tripReturnExpenses(trip);

  // Overall Financial Totals
  const totalJourneyRevenue = outboundStoneRevenue + returnRevenue;
  const totalJourneyExpenses = totalOutboundExpenses + returnExpenses;
  const netTripProfit = totalJourneyRevenue - totalJourneyExpenses - stoneBuyingCost;

  // Total Loaded Pieces and Sqft
  const totalStonePieces = (trip.stoneLines || []).reduce((sum, l) => sum + (Number(l.pieces) || 0), 0);
  const totalStoneSqft = (trip.stoneLines || []).reduce(
    (sum, l) => sum + (Number(l.sqftPerPiece) || 0) * (Number(l.pieces) || 0),
    0
  );

  // Driver Cash Settlement Calculations
  const driverOpeningBalance = Number(trip.driverOpeningBalance || trip.finalAudit?.driverOpeningBalance || 0);
  const cashCollectedByDriver = Number(trip.partyToDriverCash || 0);
  const expensesPaidByDriver = (trip.expenses || []).reduce((sum, e) => {
    if ((e as any).paidBy === 'driver' || (e as any).paid_by === 'driver') {
      return sum + (Number(e.amount) || 0);
    }
    return sum;
  }, 0);
  const quarryPaidByDriver = (trip.loadingPartyPayments || []).reduce((sum, lp) => {
    if (lp.paidBy === 'driver') return sum + (Number(lp.amountPaid) || 0);
    return sum;
  }, 0);
  const workerPaidByDriver = (trip.workerPayments || []).reduce((sum, wp: any) => {
    if (wp.paidBy === 'driver') return sum + (Number(wp.amount) || 0);
    return sum;
  }, 0);
  const totalDriverDisbursements = expensesPaidByDriver + quarryPaidByDriver + workerPaidByDriver;
  const netDriverInHand = driverOpeningBalance + cashCollectedByDriver - totalDriverDisbursements;

  const cashHandedToOwner = Number(
    trip.driverCashHandoverToOwner ?? trip.finalAudit?.driverCashHandedToOwner ?? 0
  );
  const closingBalanceForwarded = Number(
    trip.driverClosingBalanceForwarded ?? trip.finalAudit?.driverClosingBalanceForwarded ?? (netDriverInHand - cashHandedToOwner)
  );

  // Print Handler
  const handlePrint = () => {
    const printContent = printContainerRef.current;
    if (!printContent) return;

    // Collect all stylesheets and style rules from current page
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=1000,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trip_${trip.code}_Full_Journey_Audit_Report</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 8mm 8mm 8mm;
            }
            * {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              color: #0f172a !important;
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              font-size: 11px !important;
              line-height: 1.35 !important;
            }
            .page-container {
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            /* Explicit fallback layouts for print rendering */
            .grid { display: grid !important; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .flex { display: flex !important; }
            .flex-row { flex-direction: row !important; }
            .flex-col { flex-direction: column !important; }
            .items-center { align-items: center !important; }
            .justify-between { justify-content: space-between !important; }
            .gap-2 { gap: 0.5rem !important; }
            .gap-3 { gap: 0.75rem !important; }
            .gap-4 { gap: 1rem !important; }
            .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem !important; }
            .p-1\\.5 { padding: 0.375rem !important; }
            .p-2 { padding: 0.5rem !important; }
            .p-2\\.5 { padding: 0.625rem !important; }
            .p-3 { padding: 0.75rem !important; }
            .p-4 { padding: 1rem !important; }
            .p-6 { padding: 1.5rem !important; }
            .p-8 { padding: 2rem !important; }
            .pb-1 { padding-bottom: 0.25rem !important; }
            .pb-3 { padding-bottom: 0.75rem !important; }
            .mb-1 { margin-bottom: 0.25rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .mb-3 { margin-bottom: 0.75rem !important; }
            .my-1\\.5 { margin-top: 0.375rem !important; margin-bottom: 0.375rem !important; }
            .my-3 { margin-top: 0.75rem !important; margin-bottom: 0.75rem !important; }
            .border { border: 1px solid #cbd5e1 !important; }
            .border-2 { border: 2px solid #0f172a !important; }
            .border-b { border-bottom: 1px solid #cbd5e1 !important; }
            .border-b-2 { border-bottom: 2px solid #0f172a !important; }
            .border-slate-200 { border-color: #e2e8f0 !important; }
            .border-slate-300 { border-color: #cbd5e1 !important; }
            .border-slate-900 { border-color: #0f172a !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-amber-50 { background-color: #fffbeb !important; }
            .rounded { border-radius: 0.25rem !important; }
            .rounded-lg { border-radius: 0.5rem !important; }
            .rounded-xl { border-radius: 0.75rem !important; }
            .text-slate-900 { color: #0f172a !important; }
            .text-slate-800 { color: #1e293b !important; }
            .text-slate-700 { color: #334155 !important; }
            .text-slate-600 { color: #475569 !important; }
            .text-slate-500 { color: #64748b !important; }
            .text-emerald-800 { color: #065f46 !important; }
            .text-amber-700 { color: #b45309 !important; }
            .text-amber-800 { color: #92400e !important; }
            .text-amber-900 { color: #78350f !important; }
            .text-red-700 { color: #b91c1c !important; }
            .font-mono { font-family: 'JetBrains Mono', monospace !important; }
            .font-bold { font-weight: 700 !important; }
            .font-black { font-weight: 900 !important; }
            .font-semibold { font-weight: 600 !important; }
            .font-medium { font-weight: 500 !important; }
            .uppercase { text-transform: uppercase !important; }
            .tracking-wider { letter-spacing: 0.05em !important; }
            .tracking-widest { letter-spacing: 0.1em !important; }
            .tracking-tight { letter-spacing: -0.025em !important; }
            .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
            .block { display: block !important; }
            .inline-block { display: inline-block !important; }
            .text-right { text-align: right !important; }
            .text-center { text-align: center !important; }
            .w-full { width: 100% !important; }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 10px !important;
              margin: 4px 0 !important;
            }
            th, td {
              border: 1px solid #e2e8f0 !important;
              padding: 4px 6px !important;
            }
            th {
              background-color: #f1f5f9 !important;
              color: #334155 !important;
              font-weight: 700 !important;
            }
            @media print {
              body {
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            ${printContent.innerHTML}
          </div>
          <script>
            // Allow Tailwind CDN and styles to parse DOM before triggering print
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 400);
            });
            // Fallback trigger
            setTimeout(() => {
              window.focus();
              window.print();
            }, 700);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative max-w-4xl w-full my-auto rounded-2xl border border-gold/40 bg-ink-950 shadow-[0_0_60px_rgba(245,184,46,0.2)] flex flex-col max-h-[92vh]">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-ink-900/90 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gold/20 text-gold border border-gold/40">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Trip Journey &amp; Audit PDF Report</span>
                <span className="font-mono text-gold text-xs bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                  #{trip.code}
                </span>
              </h2>
              <p className="text-[10px] text-neutral-400">
                Official statement covering Outbound Consignment, Kerala Delivery, Return Journey &amp; Executive P&amp;L
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-4 py-2 text-xs font-black text-ink-950 shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-neutral-400 hover:text-white hover:bg-ink-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-900/60">
          <div
            ref={printContainerRef}
            className="max-w-[780px] mx-auto bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-2xl font-sans text-xs border border-slate-200 print:border-none print:shadow-none print:p-0"
          >
            {/* 1. Header Banner */}
            <div className="border-b-2 border-slate-900 pb-3 mb-3 flex flex-wrap justify-between items-start gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight m-0">
                  SRI SAI BABA
                </h1>
                <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-amber-700">
                  Transport &amp; Stone Logistics
                </p>
                <p className="text-[9.5px] text-slate-600 font-medium">
                  Ramapuram Quarry Yard, Kadapa, Andhra Pradesh | Phone: +91 98480 22338
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-slate-900 text-amber-400 text-[10px] font-black uppercase px-2.5 py-1 rounded tracking-wider">
                  Full Round-Trip Audit Statement
                </span>
                <p className="font-mono text-xs font-black text-slate-900 mt-1">
                  TRIP CODE: #{trip.code}
                </p>
                <p className="text-[9px] text-slate-500 font-medium">
                  Date: {trip.date || new Date().toISOString().split('T')[0]}
                </p>
              </div>
            </div>

            {/* 2. Vehicle, Driver & Operational Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <div className="border border-slate-200 rounded p-2 bg-slate-50">
                <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Vehicle / Lorry</span>
                <strong className="font-mono text-[11px] font-black text-slate-900 block">
                  {lorry?.plate || trip.lorryId}
                </strong>
                <span className="text-[9px] text-slate-600">Ashok Leyland 4825</span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-slate-50">
                <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Assigned Driver</span>
                <strong className="text-[11px] font-bold text-slate-900 block capitalize">
                  {driver?.name || 'Driver / Subhash'}
                </strong>
                <span className="text-[9px] text-slate-600">Ph: {driver?.phone || '+91 94401 55667'}</span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-slate-50">
                <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Journey Route</span>
                <strong className="text-[10px] font-bold text-slate-900 block truncate">
                  Kadapa → {buyer?.district || 'Kerala'} → {isSand ? 'L&T Factory' : 'Kadapa Base'}
                </strong>
                <span className="text-[9px] text-emerald-700 font-semibold">
                  {isSand ? '🔄 2-Way Round Trip' : 'Direct Return'}
                </span>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-slate-50">
                <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Trip Lifecycle</span>
                <strong className="text-[10.5px] font-black text-emerald-800 uppercase block">
                  {trip.status === 'completed' ? '✓ Completed & Audited' : (trip.status || 'Delivered').replace(/_/g, ' ')}
                </strong>
                <span className="text-[9px] text-slate-500">Audit: {trip.auditStatus || 'Verified'}</span>
              </div>
            </div>

            {/* 3. Leg 1: Outbound Stone Consignment Table */}
            <div className="mb-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex justify-between items-center">
                <span>1. Outbound Leg: Kadapa Quarry Loading → Stone Consignment</span>
                <span className="text-slate-600 font-mono text-[9.5px]">
                  Origin: {quarry?.name || 'Ramapuram Quarry'}
                </span>
              </div>
              <table className="w-full text-left border-collapse border border-slate-200 my-1 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[8.5px]">
                    <th className="border border-slate-200 p-1.5">Size / Finish</th>
                    <th className="border border-slate-200 p-1.5">Thickness</th>
                    <th className="border border-slate-200 p-1.5 text-right">Pieces</th>
                    <th className="border border-slate-200 p-1.5 text-right">Sqft / Pc</th>
                    <th className="border border-slate-200 p-1.5 text-right">Total Sqft</th>
                    <th className="border border-slate-200 p-1.5 text-right">Rate / Sqft</th>
                    <th className="border border-slate-200 p-1.5 text-right">Load Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(trip.stoneLines || []).map((line, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="border border-slate-200 p-1.5 font-semibold text-slate-900">
                        {line.size} ({line.finish})
                      </td>
                      <td className="border border-slate-200 p-1.5 text-slate-700">{line.thickness}</td>
                      <td className="border border-slate-200 p-1.5 text-right font-mono font-bold text-slate-900">
                        {line.pieces} pcs
                      </td>
                      <td className="border border-slate-200 p-1.5 text-right font-mono text-slate-700">
                        {line.sqftPerPiece}
                      </td>
                      <td className="border border-slate-200 p-1.5 text-right font-mono font-bold text-slate-900">
                        {(line.sqftPerPiece * line.pieces).toLocaleString('en-IN')} sqft
                      </td>
                      <td className="border border-slate-200 p-1.5 text-right font-mono text-slate-700">
                        ₹{line.ratePerSqft}
                      </td>
                      <td className="border border-slate-200 p-1.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(line.sqftPerPiece * line.pieces * line.ratePerSqft)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="border border-slate-200 p-1.5 uppercase text-slate-800">
                      Total Loaded Stone Consignment:
                    </td>
                    <td className="border border-slate-200 p-1.5 text-right font-mono font-black text-slate-900">
                      {totalStonePieces} pcs
                    </td>
                    <td className="border border-slate-200 p-1.5"></td>
                    <td className="border border-slate-200 p-1.5 text-right font-mono font-black text-slate-900">
                      {totalStoneSqft.toLocaleString('en-IN')} sqft
                    </td>
                    <td className="border border-slate-200 p-1.5 text-right font-mono text-slate-600">Outbound Rev:</td>
                    <td className="border border-slate-200 p-1.5 text-right font-mono font-black text-emerald-800">
                      {formatINR(outboundStoneRevenue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Leg 2: Kerala Delivery, Unloading & Buyer Audit */}
            <div className="mb-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex justify-between items-center">
                <span>2. Kerala Delivery &amp; Unloading Audit</span>
                <span className="text-slate-600 font-mono text-[9.5px]">
                  Buyer: {buyer?.name || 'Kerala Stone Dealer'} ({buyer?.district || 'Palakkad'})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1.5 text-[9.5px]">
                <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                  <span className="text-slate-500 font-bold uppercase block text-[8px]">Unloaded vs Damaged</span>
                  <span className="font-mono font-bold text-slate-900 text-[10.5px]">
                    {trip.unloadedPieces || totalStonePieces} sound / {trip.damagedPieces || 0} broken
                  </span>
                </div>
                <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                  <span className="text-slate-500 font-bold uppercase block text-[8px]">Cash to Driver</span>
                  <span className="font-mono font-bold text-slate-900 text-[10.5px]">
                    {formatINR(trip.partyToDriverCash || 0)}
                  </span>
                </div>
                <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                  <span className="text-slate-500 font-bold uppercase block text-[8px]">PhonePe to Owner</span>
                  <span className="font-mono font-bold text-slate-900 text-[10.5px]">
                    {formatINR(trip.partyToOwnerPhonePe || 0)}
                  </span>
                </div>
                <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                  <span className="text-slate-500 font-bold uppercase block text-[8px]">Amount Lessened</span>
                  <span className="font-mono font-bold text-red-700 text-[10.5px]">
                    − {formatINR((trip.damageDeduction || 0) + (trip.shortageDeduction || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Leg 3: Return Journey Details */}
            <div className="mb-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex justify-between items-center">
                <span>
                  3. Return Journey Leg:{' '}
                  {isSand ? 'Option A: Mangalore/Kanaya Sand → L&T Factory Delivery' : 'Option B: Direct Empty Return to Kadapa Base'}
                </span>
                <span className="font-mono text-emerald-800 font-bold text-[9.5px]">
                  {isSand ? `Freight Bill: ${formatINR(returnRevenue)}` : 'Empty Leg'}
                </span>
              </div>
              {isSand && trip.returnSandLoad ? (
                <div className="space-y-2 my-1.5 text-[9.5px]">
                  {/* Sand Loading & Material Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                      <span className="text-slate-500 font-bold uppercase block text-[8px]">Sand Loading Quarry</span>
                      <strong className="text-slate-900 truncate block font-bold">
                        {trip.returnSandLoad.loadingLocation || 'Mangalore / Kanaya Yard'}
                      </strong>
                      <span className="text-[8px] text-slate-500">
                        Date: {trip.returnSandLoad.loadingDate} {trip.returnSandLoad.loadingTime || ''}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                      <span className="text-slate-500 font-bold uppercase block text-[8px]">Loaded Material &amp; Weight</span>
                      <strong className="font-mono text-slate-900 block font-bold">
                        {trip.returnSandLoad.weightTons} Tons ({trip.returnSandLoad.sandType || 'River Sand'})
                      </strong>
                      <span className="text-[8px] text-slate-500">Destination: {trip.returnSandLoad.destination || 'L&T Factory'}</span>
                    </div>
                    <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                      <span className="text-slate-500 font-bold uppercase block text-[8px]">Freight Rate &amp; Hamali</span>
                      <strong className="font-mono text-slate-900 block font-bold">
                        Rate: ₹{trip.returnSandLoad.ratePerTon || 0}/T | Hamali: ₹{trip.returnSandLoad.labourCost || 0}
                      </strong>
                      <span className="text-[8px] text-slate-500">Mamulu / Expenses: ₹{(trip.returnSandLoad.mamulu || 0) + (trip.returnSandLoad.otherExpenses || 0)}</span>
                    </div>
                    <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                      <span className="text-slate-500 font-bold uppercase block text-[8px]">Return Gross Freight</span>
                      <strong className="font-mono text-emerald-800 block font-bold">
                        {formatINR(returnRevenue)}
                      </strong>
                      <span className="text-[8px] text-slate-500 truncate block">{trip.returnSandLoad.remarks || 'Standard Sand Load'}</span>
                    </div>
                  </div>

                  {/* Sand Unloading & Delivery Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                      <span className="text-slate-500 font-bold uppercase block text-[8px]">Factory Delivery</span>
                      <strong className="text-slate-900 truncate block font-bold">
                        {trip.returnSandLoad.destination || 'L&T Factory Plant'}
                      </strong>
                      <span className="text-[8px] text-slate-500">
                        Arrival: {trip.returnSandUnload?.arrivalDate || trip.returnSandLoad.loadingDate} {trip.returnSandUnload?.arrivalTime || ''}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                      <span className="text-slate-500 font-bold uppercase block text-[8px]">Weighbridge Received Weight</span>
                      <strong className="font-mono text-slate-900 block font-bold">
                        {trip.returnSandUnload?.receivedWeightTons || trip.returnSandLoad.weightTons} Tons
                        {trip.returnSandUnload?.weightDifferenceTons ? (
                          <span className="text-red-700 font-normal ml-1">
                            (Diff: −{trip.returnSandUnload.weightDifferenceTons}T)
                          </span>
                        ) : null}
                      </strong>
                      <span className="text-[8px] text-slate-500">Material: {trip.returnSandUnload?.sandType || trip.returnSandLoad.sandType}</span>
                    </div>
                    <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                      <span className="text-slate-500 font-bold uppercase block text-[8px]">Unloading Hamali &amp; Deductions</span>
                      <strong className="font-mono text-slate-900 block font-bold">
                        Hamali: ₹{(trip.returnSandUnload?.unloadingLabour || 0) + (trip.returnSandUnload?.hamali || 0)}
                      </strong>
                      <span className="text-[8px] text-red-700 font-semibold">
                        Deductions: − ₹{trip.returnSandUnload?.deductionsOrDifferenceCost || 0}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                      <span className="text-slate-500 font-bold uppercase block text-[8px]">Net Return Revenue</span>
                      <strong className="font-mono text-emerald-800 block font-bold">
                        {formatINR(returnRevenue)}
                      </strong>
                      <span className="text-[8px] text-slate-500 truncate block">
                        {trip.returnSandUnload?.remarks || 'Unloaded & Verified'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1.5 text-[9.5px]">
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Route &amp; Destination</span>
                    <strong className="text-slate-900 block font-bold">
                      {trip.directReturnDetails?.origin || 'Kerala Yard'} → {trip.directReturnDetails?.destination || 'Kadapa Depot Base'}
                    </strong>
                    <span className="text-[8px] text-slate-500">
                      Departed: {trip.directReturnDetails?.departureDate || trip.date} {trip.directReturnDetails?.departureTime || ''}
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Transit Odometer</span>
                    <strong className="font-mono text-slate-900 block font-bold">
                      {trip.directReturnDetails?.odometerKm || trip.vehicleReturnDetails?.finalOdometerKm || 'Recorded'} KM
                    </strong>
                    <span className="text-[8px] text-slate-500">Empty Return Leg</span>
                  </div>
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Fuel Consumption</span>
                    <strong className="font-mono text-slate-900 block font-bold">
                      {trip.directReturnDetails?.fuelLiters ? `${trip.directReturnDetails.fuelLiters} Litres` : 'Normal Transit'}
                    </strong>
                    <span className="text-[8px] text-slate-500">En-route Return</span>
                  </div>
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Return Remarks</span>
                    <strong className="text-slate-900 block font-semibold truncate">
                      {trip.directReturnDetails?.remarks || 'Direct Return Completed'}
                    </strong>
                    <span className="text-[8px] text-slate-500">Empty Lorry Run</span>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Base Return & Inspection Details */}
            {trip.vehicleReturnDetails && (
              <div className="mb-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex justify-between items-center">
                  <span>Vehicle Depot Return &amp; Base Inspection</span>
                  <span className="font-mono text-emerald-800 font-bold text-[9.5px]">
                    ✓ Parked &amp; Verified at Base
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1.5 text-[9.5px]">
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Check-In Date &amp; Time</span>
                    <strong className="text-slate-900 block font-bold">
                      {trip.vehicleReturnDetails.returnDate} {trip.vehicleReturnDetails.returnTime || ''}
                    </strong>
                    <span className="text-[8px] text-slate-500">Base: Depot — Kadapa</span>
                  </div>
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Final Odometer Reading</span>
                    <strong className="font-mono text-slate-900 block font-bold">
                      {(trip.vehicleReturnDetails.finalOdometerKm || 0).toLocaleString('en-IN')} KM
                    </strong>
                    <span className="text-[8px] text-slate-500">
                      Fuel Left: {trip.vehicleReturnDetails.fuelRemainingLiters ? `${trip.vehicleReturnDetails.fuelRemainingLiters}L` : 'Normal'}
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Vehicle Condition</span>
                    <strong className="text-emerald-800 block font-bold capitalize">
                      {trip.vehicleReturnDetails.vehicleCondition || 'Good / Normal'}
                    </strong>
                    <span className="text-[8px] text-slate-500">Tires &amp; Mechanicals Checked</span>
                  </div>
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Driver Handover</span>
                    <strong className="text-slate-900 block font-bold">
                      {trip.vehicleReturnDetails.driverConfirmation ? '✓ Driver Signed Off' : 'Pending Sign-off'}
                    </strong>
                    <span className="text-[8px] text-slate-500 truncate block">
                      {trip.vehicleReturnDetails.remarks || 'Keys deposited to depot'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Itemized Journey Expenses & Financial Breakdown */}
            <div className="mb-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex justify-between items-center">
                <span>4. Itemized Running Expenses Ledger</span>
                <span className="font-mono font-black text-red-700 text-[9.5px]">
                  Total Expenses: − {formatINR(totalJourneyExpenses)}
                </span>
              </div>
              <table className="w-full text-left border-collapse border border-slate-200 my-1 text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[8px]">
                    <th className="border border-slate-200 p-1.5">Expense Category / Description</th>
                    <th className="border border-slate-200 p-1.5 text-center">Paid By</th>
                    <th className="border border-slate-200 p-1.5 text-center">Payment Mode</th>
                    <th className="border border-slate-200 p-1.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(trip.expenses || []).map((exp, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="border border-slate-200 p-1.5 font-medium text-slate-900">
                        {exp.label} ({exp.category || 'General'})
                      </td>
                      <td className="border border-slate-200 p-1.5 text-center capitalize font-semibold text-slate-700">
                        {(exp as any).paidBy || (exp as any).paid_by || 'Owner'}
                      </td>
                      <td className="border border-slate-200 p-1.5 text-center text-slate-600">
                        {(exp as any).paymentMode || 'Cash / UPI'}
                      </td>
                      <td className="border border-slate-200 p-1.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(exp.amount || 0)}
                      </td>
                    </tr>
                  ))}
                  {outboundHamali > 0 && (
                    <tr className="border-b border-slate-100">
                      <td className="border border-slate-200 p-1.5 font-medium text-slate-900">
                        Quarry Loading Hamali &amp; Laborers
                      </td>
                      <td className="border border-slate-200 p-1.5 text-center font-semibold text-slate-700">Owner</td>
                      <td className="border border-slate-200 p-1.5 text-center text-slate-600">Cash</td>
                      <td className="border border-slate-200 p-1.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(outboundHamali)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="border border-slate-200 p-1.5 uppercase text-slate-800">
                      Total Journey Expenses (Fuel, Tolls, Hamali, Bata, Repairs):
                    </td>
                    <td className="border border-slate-200 p-1.5 text-right font-mono font-black text-red-700">
                      − {formatINR(totalJourneyExpenses)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 7. Executive Profit & Loss Summary */}
            <div className="border-2 border-slate-900 bg-slate-50 rounded-lg p-3 my-3">
              <div className="text-center font-black uppercase text-[11px] text-slate-900 tracking-wider mb-2 border-b border-slate-300 pb-1">
                Executive Journey Profit &amp; Loss Statement (P&amp;L)
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border border-slate-200 rounded p-2 bg-white">
                  <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Total Gross Revenue</span>
                  <span className="font-mono text-sm sm:text-base font-black text-emerald-800">
                    {formatINR(totalJourneyRevenue)}
                  </span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">
                    Stone: {formatINR(outboundStoneRevenue)} | Sand: {formatINR(returnRevenue)}
                  </span>
                </div>
                <div className="border border-slate-200 rounded p-2 bg-white">
                  <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Total Cost &amp; Expenses</span>
                  <span className="font-mono text-sm sm:text-base font-black text-red-700">
                    {formatINR(totalJourneyExpenses + stoneBuyingCost)}
                  </span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">
                    Stone Cost: {formatINR(stoneBuyingCost)} | Exp: {formatINR(totalJourneyExpenses)}
                  </span>
                </div>
                <div className="border-2 border-amber-600 rounded p-2 bg-amber-50">
                  <span className="text-[8.5px] font-black text-amber-900 uppercase block">Net Trip Profit (ROI)</span>
                  <span className={`font-mono text-base sm:text-lg font-black ${netTripProfit >= 0 ? 'text-amber-900' : 'text-red-700'}`}>
                    {formatINR(netTripProfit)}
                  </span>
                  <span className="text-[8px] text-amber-800 font-bold block mt-0.5">
                    {netTripProfit >= 0 ? '✓ Net Journey Gain' : 'Deficit / Loss'}
                  </span>
                </div>
              </div>
            </div>

            {/* 8. Driver Cash Handover & Next Trip Carry Forward Settlement */}
            <div className="border border-slate-300 rounded p-2.5 bg-slate-50 mb-3 text-[9.5px]">
              <div className="flex justify-between items-center font-bold text-slate-900 mb-1.5 border-b border-slate-200 pb-1">
                <span className="uppercase text-[9.5px] font-black text-slate-900">
                  Driver Cash Float &amp; Next Trip Rollover Ledger
                </span>
                <span className="font-mono text-[9px] text-slate-600 font-bold">
                  {trip.driverSettlementType === 'handed_over'
                    ? '💵 Fully Handed to Owner'
                    : trip.driverSettlementType === 'partial_handover'
                    ? '✂ Partial Handover'
                    : '🔄 Carried Forward to Next Trip'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center my-1">
                <div className="bg-white border border-slate-200 rounded p-1.5">
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">Opening Float</span>
                  <span className="font-mono text-[10.5px] font-bold text-slate-900 block">{formatINR(driverOpeningBalance)}</span>
                  <span className="text-[7.5px] text-slate-400">Prior trip balance</span>
                </div>
                <div className="bg-white border border-slate-200 rounded p-1.5">
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">+ Buyer Cash</span>
                  <span className="font-mono text-[10.5px] font-bold text-emerald-800 block">{formatINR(cashCollectedByDriver)}</span>
                  <span className="text-[7.5px] text-slate-400">Kerala collections</span>
                </div>
                <div className="bg-white border border-slate-200 rounded p-1.5">
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">− Driver Spent</span>
                  <span className="font-mono text-[10.5px] font-bold text-red-700 block">− {formatINR(totalDriverDisbursements)}</span>
                  <span className="text-[7.5px] text-slate-400">Fuel, hamali, quarry</span>
                </div>
                <div className="bg-white border border-slate-200 rounded p-1.5">
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">− Handed to Owner</span>
                  <span className="font-mono text-[10.5px] font-bold text-slate-900 block">− {formatINR(cashHandedToOwner)}</span>
                  <span className="text-[7.5px] text-slate-400">Deposited to owner</span>
                </div>
              </div>
              <div className="pt-1.5 mt-1 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-700 font-bold">
                  Net Driver Cash Balance Forwarded into Next Trip:
                </span>
                <strong className={`font-mono text-xs font-black ${closingBalanceForwarded >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                  {formatINR(closingBalanceForwarded)}
                </strong>
              </div>
            </div>

            {/* 9. Signatures & Official Audit Authorization */}
            <div className="grid grid-cols-3 gap-6 pt-5 mt-4 border-t-2 border-dashed border-slate-400">
              <div className="text-center">
                <div className="h-10 flex items-end justify-center">
                  <span className="font-mono text-[10px] text-slate-500 italic">Subhash (Owner)</span>
                </div>
                <div className="border-t border-slate-800 pt-1 text-[9px] font-bold text-slate-800 uppercase">
                  Managing Partner / Owner
                </div>
              </div>

              <div className="text-center">
                <div className="h-10 flex items-end justify-center">
                  <span className="font-mono text-[10px] text-slate-500 italic">{driver?.name || 'Driver'}</span>
                </div>
                <div className="border-t border-slate-800 pt-1 text-[9px] font-bold text-slate-800 uppercase">
                  Assigned Driver Signature
                </div>
              </div>

              <div className="text-center">
                <div className="h-10 flex items-end justify-center">
                  <span className="font-mono text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    SEAL &amp; VERIFIED
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-1 text-[9px] font-bold text-slate-800 uppercase">
                  Authorized Audit Stamp
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-ink-900 rounded-b-2xl">
          <span className="text-[11px] text-neutral-400 font-mono">
            Sri Sai Baba Logistics • Complete Audit System • ISO 9001 Compliant
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-5 py-2 text-xs font-black text-ink-950 shadow-xl hover:scale-105 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download / Print Trip PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}
