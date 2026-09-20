import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCwIcon, Filter, Truck, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatINR } from '../utils/helpers';
import { tripSqft, type Trip, type UnloadingParty, type DistrictRate } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { TripStatusBadge } from '../components/ui/Badge';
import { tripsApi, lorriesApi, driversApi, unloadingPartiesApi, districtRatesApi } from '../api/index';
import type { Lorry, Driver } from '../data/types';

export function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [lorries, setLorries] = useState<Lorry[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [unloadingParties, setUnloadingParties] = useState<UnloadingParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [districtRates, setDistrictRates] = useState<DistrictRate[]>([]);

  // Filter and pagination state
  const [selectedLorryId, setSelectedLorryId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page number on filter/page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLorryId, startDate, endDate, pageSize]);

  // Derived filtered trips
  const filteredTrips = trips.filter((trip) => {
    if (selectedLorryId && trip.lorryId !== selectedLorryId) {
      return false;
    }
    if (startDate && trip.date < startDate) {
      return false;
    }
    if (endDate && trip.date > endDate) {
      return false;
    }
    return true;
  });

  const totalItems = filteredTrips.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTrips = filteredTrips.slice(startIndex, endIndex);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [apiTrips, apiLorries, apiDrivers, apiUnloadingParties, apiDistrictRates] = await Promise.all([
        tripsApi.getAll(),
        lorriesApi.getAll(),
        driversApi.getAll(),
        unloadingPartiesApi.getAll().catch(() => []),
        districtRatesApi.getAll().catch(() => [])
      ]);
      if (Array.isArray(apiTrips)) setTrips(apiTrips);
      if (Array.isArray(apiLorries)) setLorries(apiLorries);
      if (Array.isArray(apiDrivers)) setDrivers(apiDrivers);
      if (Array.isArray(apiUnloadingParties)) setUnloadingParties(apiUnloadingParties);
      if (Array.isArray(apiDistrictRates)) setDistrictRates(apiDistrictRates);
    } catch (err: any) {
      setError('Failed to load trips. Please check your connection.');
      console.error('Trips fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTripRevenue = (trip: Trip) => {
    const dest = unloadingParties.find((p) => p.id === trip.unloadingPartyId);
    const buyerDistrict = dest?.district;
    return (trip.stoneLines || []).reduce((sum, line) => {
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

  const getTripPending = (trip: Trip) => {
    const rev = getTripRevenue(trip);
    return Math.max(0, rev - trip.amountPaid - (trip.damageDeduction || 0));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-full">
      <PageHeader
        title="Trips"
        subtitle="Every load from Ramapuram to Kerala buyers"
      />

      <div className="p-6 sm:p-8">
        {/* Compact Filters Row */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-ink-950 p-3 rounded-lg border border-ink-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
              <Filter className="h-3.5 w-3.5 text-gold" />
              <span className="font-bold uppercase tracking-wider">Filter:</span>
            </div>

            {/* Lorry Selector */}
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-neutral-500" />
              <select
                value={selectedLorryId}
                onChange={(e) => setSelectedLorryId(e.target.value)}
                className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white placeholder-neutral-600 transition-colors hover:border-ink-600 focus:border-gold focus:outline-none min-w-[120px]"
              >
                <option value="">All Vehicles</option>
                {lorries.map((lorry) => (
                  <option key={lorry.id} value={lorry.id}>
                    {lorry.plate}
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white transition-colors hover:border-ink-600 focus:border-gold focus:outline-none"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white transition-colors hover:border-ink-600 focus:border-gold focus:outline-none"
              />
            </div>

            {/* Clear Button */}
            {(selectedLorryId || startDate || endDate) && (
              <button
                onClick={() => {
                  setSelectedLorryId('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2 py-1 text-[10px] text-red-400 font-semibold transition-colors hover:bg-red-500/20"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Header row with refresh */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            {loading
              ? 'Fetching trips…'
              : selectedLorryId || startDate || endDate
              ? `${filteredTrips.length} of ${trips.length} trip${trips.length !== 1 ? 's' : ''} filtered`
              : `${trips.length} trip${trips.length !== 1 ? 's' : ''} found`}
          </p>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
          >
            <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="overflow-hidden rounded-lg border border-ink-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-ink-800 px-4 py-4 last:border-0">
                <div className="h-4 w-20 animate-pulse rounded bg-ink-700" />
                <div className="h-4 w-28 animate-pulse rounded bg-ink-700" />
                <div className="h-4 w-40 animate-pulse rounded bg-ink-700 flex-1" />
                <div className="h-4 w-12 animate-pulse rounded bg-ink-700" />
                <div className="h-4 w-16 animate-pulse rounded bg-ink-700" />
                <div className="h-4 w-16 animate-pulse rounded bg-ink-700" />
                <div className="h-6 w-20 animate-pulse rounded bg-ink-700" />
              </div>
            ))}
          </div>
        )}

        {/* Data table */}
        {!loading && (
          <div className="overflow-hidden rounded-lg border border-ink-700 bg-ink-900">
            <div className="ti-scroll overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-700 bg-ink-950 text-xs uppercase tracking-[0.08em] text-neutral-500">
                    <th className="px-4 py-3 font-medium">Trip</th>
                    <th className="px-4 py-3 font-medium">Lorry / Driver</th>
                    <th className="px-4 py-3 font-medium">Route</th>
                    <th className="px-4 py-3 font-medium">Sqft</th>
                    <th className="px-4 py-3 text-right font-medium">Revenue</th>
                    <th className="px-4 py-3 text-right font-medium">Pending</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-500">
                        No trips match the active filters or found in the database.
                      </td>
                    </tr>
                  )}
                  {paginatedTrips.map((trip, i) => {
                    const lorry = lorries.find((l) => l.id === trip.lorryId);
                    const driver = drivers.find((d) => d.id === trip.driverId);
                    const dest = unloadingParties.find((p) => p.id === trip.unloadingPartyId);
                    return (
                      <motion.tr
                        key={trip.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-ink-800 bg-ink-900 transition-colors last:border-0 hover:bg-ink-850"
                      >
                        <td className="px-4 py-4">
                          <Link
                            to={`/trips/${trip.id}`}
                            className="font-semibold text-white hover:text-gold"
                          >
                            {trip.code}
                          </Link>
                          <p className="text-xs text-neutral-600">{trip.date}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-white">{lorry?.plate ?? trip.lorryId}</p>
                          <p className="text-xs text-neutral-500">{driver?.name ?? trip.driverId}</p>
                        </td>
                        <td className="px-4 py-4 text-neutral-400">
                          {trip.origin} → {dest?.name ?? trip.unloadingPartyId}
                          <p className="text-xs text-neutral-600">{dest?.district}</p>
                        </td>
                        <td className="px-4 py-4 text-neutral-300">
                          {tripSqft(trip).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-gold">
                          {formatINR(getTripRevenue(trip))}
                        </td>
                        <td className="px-4 py-4 text-right text-neutral-350">
                          {getTripPending(trip) > 0 ? formatINR(getTripPending(trip)) : '—'}
                        </td>
                        <td className="px-4 py-4">
                          <TripStatusBadge status={trip.status} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-ink-700 bg-ink-950 px-4 py-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                <span>
                  Showing <strong className="text-white font-medium">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
                  <strong className="text-white font-medium">{endIndex}</strong> of{' '}
                  <strong className="text-gold font-semibold">{totalItems}</strong> trip{totalItems !== 1 ? 's' : ''}
                </span>

                <div className="flex items-center gap-2 border-l border-ink-800 pl-4">
                  <span className="text-neutral-500">Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none font-medium"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-neutral-500">per page</span>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={activePage === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30 disabled:hover:border-ink-700 disabled:hover:text-neutral-400"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded text-xs font-semibold transition-colors ${
                        page === activePage
                          ? 'bg-gold text-ink-950 shadow-md'
                          : 'border border-ink-700 bg-ink-900 text-neutral-400 hover:border-gold hover:text-gold'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={activePage === totalPages}
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30 disabled:hover:border-ink-700 disabled:hover:text-neutral-400"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}