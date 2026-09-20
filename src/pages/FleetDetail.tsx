import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, Filter, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatINR } from '../utils/helpers';
import { type Trip } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, SectionLabel } from '../components/ui/Card';
import { StatusDot, statusLabel } from '../components/ui/StatusDot';
import { TripStatusBadge } from '../components/ui/Badge';
import { useOrders } from '../store/OrdersContext';
import { LorryModal } from '../components/ui/LorryModal';

export function FleetDetail() {
  const { lorryId } = useParams();
  const { lorries, trips, drivers, unloadingParties, districtRates } = useOrders();
  const lorry = lorries.find((l) => l.id === lorryId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Expand/collapse and filter/pagination state for trip history
  const [showAllTrips, setShowAllTrips] = useState(false);
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [tripPartyId, setTripPartyId] = useState('');
  const [tripPage, setTripPage] = useState(1);
  const [tripPageSize, setTripPageSize] = useState(5);

  // Reset page number on filter/page size changes
  useEffect(() => {
    setTripPage(1);
  }, [tripStartDate, tripEndDate, tripPartyId, tripPageSize]);

  if (!lorry) {
    return (
      <div className="p-8">
        <p className="text-neutral-400">Lorry not found.</p>
        <Link
          to="/fleet"
          className="mt-2 inline-block text-gold hover:underline">
          Back to fleet
        </Link>
      </div>
    );
  }

  const getTripRevenue = (t: Trip) => {
    const dest = unloadingParties.find((p) => p.id === t.unloadingPartyId);
    const buyerDistrict = dest?.district;
    return (t.stoneLines || []).reduce((sum, line) => {
      const matchRate = districtRates.find(r => 
        r.district === buyerDistrict &&
        r.size === line.size &&
        r.thickness === line.thickness &&
        r.finish === line.finish
      );
      const rate = matchRate ? matchRate.ratePerSqft : line.ratePerSqft;
      return sum + (line.sqftPerPiece * line.pieces * rate);
    }, 0);
  };

  const getTripPending = (t: Trip) => {
    const rev = getTripRevenue(t);
    return Math.max(0, rev - t.amountPaid - (t.damageDeduction || 0));
  };

  const driver = drivers.find((d) => d.id === lorry.driverId);
  const lorryTrips = trips.filter((t) => t.lorryId === lorry.id);
  const maintenance = lorryTrips.flatMap((t) =>
    t.expenses
      .filter((e) => /repair|tyre|service|maintenance/i.test(e.label))
      .map((e) => ({
        ...e,
        tripCode: t.code,
        date: t.date
      }))
  );

  // Financial aggregates for this lorry
  const totalEarned = lorryTrips.reduce((sum, t) => sum + getTripRevenue(t), 0);
  const totalPending = lorryTrips.reduce((sum, t) => sum + getTripPending(t), 0);
  const totalExpenses = lorryTrips.reduce((sum, t) => 
    sum + (t.expenses || []).reduce((eSum, e) => eSum + e.amount, 0), 0
  );

  // Filtered trips for this lorry
  const filteredLorryTrips = lorryTrips.filter((t) => {
    if (showAllTrips) {
      if (tripStartDate && t.date < tripStartDate) return false;
      if (tripEndDate && t.date > tripEndDate) return false;
      if (tripPartyId && t.unloadingPartyId !== tripPartyId) return false;
    }
    return true;
  });

  const totalFilteredTrips = filteredLorryTrips.length;
  const totalPages = Math.ceil(totalFilteredTrips / tripPageSize) || 1;
  const activePage = Math.min(tripPage, totalPages);

  const startIndex = (activePage - 1) * tripPageSize;
  const endIndex = Math.min(startIndex + tripPageSize, totalFilteredTrips);

  const displayTrips = showAllTrips
    ? filteredLorryTrips.slice(startIndex, endIndex)
    : lorryTrips.slice(0, 3);

  return (
    <div className="min-h-full">
      <PageHeader
        title={lorry.plate}
        subtitle={`Depot — ${lorry.location}`}
        action={
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-neutral-400">
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Driver</span>
                <span className="font-bold text-white text-xs sm:text-sm">{driver?.name ?? '—'}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Status</span>
                <div className="flex items-center gap-1.5">
                  <StatusDot status={lorry.status} />
                  <span className="font-bold text-white text-xs sm:text-sm capitalize">{statusLabel(lorry.status)}</span>
                </div>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Capacity</span>
                <span className="font-bold text-white text-xs sm:text-sm">{lorry.capacitySqft.toLocaleString('en-IN')} sqft</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Total Trips</span>
                <span className="font-bold text-white text-xs sm:text-sm">{lorryTrips.length}</span>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-md border border-ink-700 bg-ink-950 px-3.5 py-1.5 text-xs font-semibold text-neutral-350 transition-colors hover:border-gold hover:text-gold"
            >
              Edit Lorry
            </button>
          </div>
        }
      />
      
      <div className="p-6 sm:p-8">
        <Link
          to="/fleet"
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" /> All lorries
        </Link>

        {/* Financial Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4 bg-ink-950 border border-ink-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Total Earned</span>
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-400">
              {formatINR(totalEarned)}
            </p>
            <p className="text-[10px] text-neutral-600 mt-1">Gross revenue from completed runs</p>
          </Card>
          
          <Card className="p-4 bg-ink-950 border border-ink-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Pending Amount</span>
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-400">
              {formatINR(totalPending)}
            </p>
            <p className="text-[10px] text-neutral-600 mt-1">Outstanding payments to collect</p>
          </Card>

          <Card className="p-4 bg-ink-950 border border-ink-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Total Expenses</span>
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
            </div>
            <p className="mt-2 text-2xl font-bold text-red-400">
              {formatINR(totalExpenses)}
            </p>
            <p className="text-[10px] text-neutral-600 mt-1">Wages, fuel, and maintenance costs</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <SectionLabel>Trip History ({lorryTrips.length})</SectionLabel>
              {lorryTrips.length > 3 && (
                <button
                  onClick={() => {
                    setShowAllTrips(!showAllTrips);
                    setTripPage(1);
                  }}
                  className="text-xs font-bold text-gold hover:underline"
                >
                  {showAllTrips ? 'Show Less' : `See More (${lorryTrips.length - 3} more)`}
                </button>
              )}
            </div>

            {/* Filter Bar (Visible in Expanded Mode) */}
            {showAllTrips && (
              <div className="mt-4 space-y-2 bg-ink-950 p-3 rounded-lg border border-ink-800">
                <div className="flex flex-wrap items-center gap-3">
                  {/* From Date */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">From</span>
                    <input
                      type="date"
                      value={tripStartDate}
                      onChange={(e) => setTripStartDate(e.target.value)}
                      className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                    />
                  </div>
                  {/* To Date */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">To</span>
                    <input
                      type="date"
                      value={tripEndDate}
                      onChange={(e) => setTripEndDate(e.target.value)}
                      className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                    />
                  </div>
                  {/* Party Dropdown */}
                  <select
                    value={tripPartyId}
                    onChange={(e) => setTripPartyId(e.target.value)}
                    className="rounded border border-ink-700 bg-ink-900 px-2.5 py-1 text-xs text-white focus:border-gold focus:outline-none min-w-[120px]"
                  >
                    <option value="">All Parties</option>
                    {unloadingParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {/* Limit Selection */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Limit</span>
                    <select
                      value={tripPageSize}
                      onChange={(e) => setTripPageSize(Number(e.target.value))}
                      className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  {/* Clear Button */}
                  {(tripStartDate || tripEndDate || tripPartyId) && (
                    <button
                      onClick={() => {
                        setTripStartDate('');
                        setTripEndDate('');
                        setTripPartyId('');
                      }}
                      className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2 py-1 text-[10px] text-red-400 font-semibold hover:bg-red-500/20"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {displayTrips.length === 0 && (
                <p className="text-sm text-neutral-600">No trips match the active filters or found.</p>
              )}
              {displayTrips.map((t) => {
                const dest = unloadingParties.find((p) => p.id === t.unloadingPartyId);
                return (
                  <Link key={t.id} to={`/trips/${t.id}`}>
                    <Card className="p-4 transition-colors hover:border-gold">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {t.code}
                        </span>
                        <TripStatusBadge status={t.status} />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {t.origin} → {dest?.district || '—'} · {t.date}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gold">
                        {formatINR(getTripRevenue(t))}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls for Expanded View */}
            {showAllTrips && totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 mt-4 text-xs text-neutral-400">
                <span>
                  Showing <strong className="text-white font-medium">{totalFilteredTrips === 0 ? 0 : startIndex + 1}</strong> to{' '}
                  <strong className="text-white font-medium">{endIndex}</strong> of{' '}
                  <strong className="text-gold font-semibold">{totalFilteredTrips}</strong> trip{totalFilteredTrips !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTripPage((p) => Math.max(p - 1, 1))}
                    disabled={activePage === 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] text-neutral-500 font-medium px-2">
                    Page {activePage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setTripPage((p) => Math.min(p + 1, totalPages))}
                    disabled={activePage === totalPages}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <SectionLabel>Maintenance Cost History</SectionLabel>
            <Card className="mt-4 overflow-hidden">
              {maintenance.length === 0 ?
              <p className="px-4 py-6 text-sm text-neutral-600">
                  No maintenance costs logged.
                </p> :

              <ul className="divide-y divide-ink-800">
                  {maintenance.map((m) =>
                <li
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3">
                  
                      <div>
                        <p className="text-sm text-white">{m.label}</p>
                        <p className="text-xs text-neutral-600">
                          {m.tripCode} · {m.date}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-neutral-200">
                        {formatINR(m.amount)}
                      </span>
                    </li>
                )}
                </ul>
              }
            </Card>
          </div>
        </div>
      </div>

      <LorryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lorryToEdit={lorry}
      />
    </div>
  );
}