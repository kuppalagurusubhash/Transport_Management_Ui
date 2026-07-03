import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, FlagIcon } from 'lucide-react';
import {
  trips,
  lorries,
  driverById,
  loadingPartyById,
  unloadingPartyById,
  formatINR } from
'../data/mockData';
import {
  lineTotalSqft,
  lineAmount,
  tripRevenue,
  tripWorkerTotal,
  tripExpenseTotal,
  tripNet,
  type ExpenseReview,
  type ExpenseLine } from
'../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionLabel, Card } from '../components/ui/Card';
import { TripStatusBadge, ReviewBadge } from '../components/ui/Badge';
export function TripDetail() {
  const { tripId } = useParams();
  const trip = trips.find((t) => t.id === tripId);
  const [expenses, setExpenses] = useState<ExpenseLine[]>(
    trip ? trip.expenses : []
  );
  if (!trip) {
    return (
      <div className="p-8">
        <p className="text-neutral-400">Trip not found.</p>
        <Link
          to="/trips"
          className="mt-2 inline-block text-gold hover:underline">
          
          Back to trips
        </Link>
      </div>);

  }
  const lorry = lorries.find((l) => l.id === trip.lorryId);
  const driver = driverById(trip.driverId);
  const dest = unloadingPartyById(trip.unloadingPartyId);
  const setReview = (id: string, review: ExpenseReview) =>
  setExpenses((prev) =>
  prev.map((e) =>
  e.id === id ?
  {
    ...e,
    review
  } :
  e
  )
  );
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const revenue = tripRevenue(trip);
  const workers = tripWorkerTotal(trip);
  const net = revenue - workers - expenseTotal;
  // group stone lines + worker payments by loading party
  const partyIds = Array.from(
    new Set([
    ...trip.stoneLines.map((l) => l.loadingPartyId),
    ...trip.workerPayments.map((w) => w.loadingPartyId)]
    )
  );
  return (
    <div className="min-h-full">
      <PageHeader
        title={trip.code}
        subtitle={`${trip.origin} → ${dest?.name} · ${dest?.district}`}
        action={<TripStatusBadge status={trip.status} />} />
      

      <div className="p-6 sm:p-8">
        <Link
          to="/trips"
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
          
          <ArrowLeftIcon className="h-4 w-4" /> All trips
        </Link>

        {/* Assignment */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <SectionLabel>Lorry</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white">
              {lorry?.plate}
            </p>
            <p className="text-xs text-neutral-500">{lorry?.location}</p>
          </Card>
          <Card className="p-4">
            <SectionLabel>Driver</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white">
              {driver?.name}
            </p>
            <p className="text-xs text-neutral-500">{driver?.phone}</p>
          </Card>
          <Card className="p-4">
            <SectionLabel>Buyer</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white">
              {dest?.name}
            </p>
            <p className="text-xs text-neutral-500">{dest?.district}</p>
          </Card>
        </div>

        {/* Stone lines grouped by loading party */}
        <div className="mb-6">
          <SectionLabel>Load Breakdown</SectionLabel>
          <div className="mt-4 space-y-5">
            {partyIds.map((pid) => {
              const party = loadingPartyById(pid);
              const lines = trip.stoneLines.filter(
                (l) => l.loadingPartyId === pid
              );
              const worker = trip.workerPayments.find(
                (w) => w.loadingPartyId === pid
              );
              return (
                <Card key={pid} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {party?.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {party?.location}
                      </p>
                    </div>
                    {worker &&
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                          Worker payment
                        </p>
                        <p className="text-sm font-semibold text-gold">
                          {formatINR(worker.amount)}
                        </p>
                      </div>
                    }
                  </div>
                  <div className="ti-scroll overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-neutral-600">
                          <th className="px-4 py-2 font-medium">Stone</th>
                          <th className="px-4 py-2 font-medium">Calculation</th>
                          <th className="px-4 py-2 text-right font-medium">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line) =>
                        <tr key={line.id} className="border-t border-ink-800">
                            <td className="px-4 py-3">
                              <span className="text-white">
                                {line.size} · {line.thickness}
                              </span>
                              <span className="ml-2 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] capitalize text-neutral-400">
                                {line.finish}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                              {line.sqftPerPiece} sqft × {line.pieces} pcs ={' '}
                              {lineTotalSqft(line)} sqft × ₹{line.ratePerSqft}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gold">
                              {formatINR(lineAmount(line))}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>);

            })}
          </div>
        </div>

        {/* Expenses with review actions */}
        <div className="mb-6">
          <SectionLabel>Expenses &amp; Maintenance</SectionLabel>
          <Card className="mt-4 overflow-hidden">
            <ul className="divide-y divide-ink-800">
              {expenses.map((e) =>
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3">
                
                  <span className="flex-1 text-sm text-white">{e.label}</span>
                  <span className="text-sm font-semibold text-neutral-200">
                    {formatINR(e.amount)}
                  </span>
                  <ReviewBadge review={e.review} />
                  <div className="flex gap-1">
                    <button
                    onClick={() => setReview(e.id, 'approved')}
                    className="flex h-7 w-7 items-center justify-center rounded border border-ink-700 text-green-400 transition-colors hover:bg-green-400/10"
                    aria-label={`Approve ${e.label}`}>
                    
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                    onClick={() => setReview(e.id, 'flagged')}
                    className="flex h-7 w-7 items-center justify-center rounded border border-ink-700 text-red-400 transition-colors hover:bg-red-500/10"
                    aria-label={`Flag ${e.label}`}>
                    
                      <FlagIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </Card>
        </div>

        {/* Financial summary */}
        <div>
          <SectionLabel>Trip Summary</SectionLabel>
          <Card className="mt-4 p-5">
            <dl className="space-y-3 text-sm">
              <Row label="Stone revenue" value={formatINR(revenue)} />
              <Row
                label="Worker payments"
                value={`− ${formatINR(workers)}`}
                muted />
              
              <Row
                label="Expenses"
                value={`− ${formatINR(expenseTotal)}`}
                muted />
              
              <div className="border-t border-ink-700 pt-3">
                <Row label="Net profit" value={formatINR(net)} emphasize />
              </div>
              <div className="border-t border-ink-700 pt-3">
                <Row
                  label="Collected from buyer"
                  value={formatINR(trip.amountPaid)} />
                
                <Row
                  label="Pending from buyer"
                  value={formatINR(Math.max(0, revenue - trip.amountPaid))} />
                
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>);

}
function Row({
  label,
  value,
  muted,
  emphasize





}: {label: string;value: string;muted?: boolean;emphasize?: boolean;}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-neutral-500">{label}</dt>
      <dd
        className={
        emphasize ?
        'text-lg font-extrabold text-gold' :
        muted ?
        'text-neutral-400' :
        'font-semibold text-white'
        }>
        
        {value}
      </dd>
    </div>);

}