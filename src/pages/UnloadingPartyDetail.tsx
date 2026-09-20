import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, Download, Filter, Calendar, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatINR } from '../utils/helpers';
import {
  orderTotal,
  orderPending,
  orderSqft,
  orderLineAmount,
  orderLineTotalSqft,
  type OrderStatus } from
'../data/types';
import { useOrders } from '../store/OrdersContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, SectionLabel } from '../components/ui/Card';
import { OrderStatusBadge } from '../components/ui/Badge';
export function UnloadingPartyDetail() {
  const { partyId } = useParams();
  const { orders, trips, lorries, drivers, unloadingParties } = useOrders();
  const party = unloadingParties.find((p) => p.id === partyId);

  // Tab control state
  const [activeTab, setActiveTab] = useState<'orders' | 'trips'>('orders');

  // Order history filters and pagination state
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(5);

  // Sourcing trips filters and pagination state
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [tripLorryId, setTripLorryId] = useState('');
  const [tripPage, setTripPage] = useState(1);
  const [tripPageSize, setTripPageSize] = useState(5);

  // Reset page numbers on filters changes
  useEffect(() => {
    setOrderPage(1);
  }, [orderFilter, orderPageSize]);

  useEffect(() => {
    setTripPage(1);
  }, [tripStartDate, tripEndDate, tripLorryId, tripPageSize]);
  
  if (!party) {
    return (
      <div className="p-8">
        <p className="text-neutral-400">Buyer not found.</p>
        <Link
          to="/unloading-parties"
          className="mt-2 inline-block text-gold hover:underline">
          Back to buyers
        </Link>
      </div>
    );
  }

  const partyOrders = orders.filter((o) => o.unloadingPartyId === party.id);
  const partyTrips = trips.filter((t) => t.unloadingPartyId === party.id);

  const getDriverName = (driverId: string) => {
    return drivers.find(d => d.id === driverId)?.name || 'Unknown Driver';
  };
  const getLorryPlate = (lorryId: string) => {
    return lorries.find(l => l.id === lorryId)?.plate || 'Unknown Lorry';
  };

  const ordered = partyOrders.reduce((s, o) => s + orderTotal(o), 0);
  const pending = partyOrders.reduce((s, o) => s + orderPending(o), 0);
  const sqft = partyOrders.reduce((s, o) => s + orderSqft(o), 0);

  // Filtered orders
  const filteredOrders = partyOrders.filter((o) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    return true;
  });

  const totalFilteredOrders = filteredOrders.length;
  const totalOrderPages = Math.ceil(totalFilteredOrders / orderPageSize) || 1;
  const activeOrderPage = Math.min(orderPage, totalOrderPages);
  
  const orderStartIndex = (activeOrderPage - 1) * orderPageSize;
  const orderEndIndex = Math.min(orderStartIndex + orderPageSize, totalFilteredOrders);
  
  const displayOrders = filteredOrders.slice(orderStartIndex, orderEndIndex);

  // Filtered trips
  const filteredTrips = partyTrips.filter((t) => {
    if (tripStartDate && t.date < tripStartDate) return false;
    if (tripEndDate && t.date > tripEndDate) return false;
    if (tripLorryId && t.lorryId !== tripLorryId) return false;
    return true;
  });

  const totalFilteredTrips = filteredTrips.length;
  const totalTripPages = Math.ceil(totalFilteredTrips / tripPageSize) || 1;
  const activeTripPage = Math.min(tripPage, totalTripPages);

  const tripStartIndex = (activeTripPage - 1) * tripPageSize;
  const tripEndIndex = Math.min(tripStartIndex + tripPageSize, totalFilteredTrips);

  const displayTrips = filteredTrips.slice(tripStartIndex, tripEndIndex);

  return (
    <div className="min-h-full">
      <PageHeader
        title={party.name}
        subtitle={`Kerala buyer · ${party.district}`}
        action={
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-neutral-400">
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Orders</span>
                <span className="font-bold text-white text-xs sm:text-sm">{partyOrders.length}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Ordered Value</span>
                <span className="font-bold text-gold text-xs sm:text-sm">{formatINR(ordered)}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Pending</span>
                <span className="font-bold text-white text-xs sm:text-sm">{formatINR(pending)}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Total Sqft</span>
                <span className="font-bold text-white text-xs sm:text-sm">{sqft.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button
              onClick={() => alert("Statement exported successfully!")}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-950 px-3.5 py-1.5 text-xs font-semibold text-neutral-350 transition-colors hover:border-gold hover:text-gold"
            >
              <Download className="h-3.5 w-3.5" />
              Export statement
            </button>
          </div>
        }
      />
      
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <Link
            to="/unloading-parties"
            className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
            <ArrowLeftIcon className="h-4 w-4" /> All buyers
          </Link>

          {/* View Mode Tabs */}
          <div className="flex border-b border-ink-800 mb-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 text-sm font-semibold transition-colors relative px-4 flex items-center gap-2 ${
                activeTab === 'orders' ? 'text-gold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Order history</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeTab === 'orders' ? 'bg-gold/10 text-gold' : 'bg-ink-800 text-neutral-500'
              }`}>
                {partyOrders.length}
              </span>
              {activeTab === 'orders' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('trips')}
              className={`pb-3 text-sm font-semibold transition-colors relative px-4 flex items-center gap-2 ${
                activeTab === 'trips' ? 'text-gold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Sourcing trips &amp; logistics</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeTab === 'trips' ? 'bg-gold/10 text-gold' : 'bg-ink-800 text-neutral-500'
              }`}>
                {partyTrips.length}
              </span>
              {activeTab === 'trips' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Order History */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Order status filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-ink-950 p-3 rounded-lg border border-ink-800">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-neutral-500 text-xs mr-2">
                  <Filter className="h-3.5 w-3.5 text-gold" />
                  <span className="font-semibold uppercase tracking-wider">Status:</span>
                </div>
                {(['all', 'placed', 'confirmed', 'dispatched', 'delivered', 'paid'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderFilter(status)}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors border ${
                      orderFilter === status
                        ? 'border-gold bg-gold/10 text-gold font-bold'
                        : 'border-ink-700 bg-ink-900 text-neutral-400 hover:text-white font-medium'
                    }`}
                  >
                    <span className="capitalize">{status}</span>
                  </button>
                ))}
              </div>

              {/* Limit selector */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <span className="text-neutral-500">Show</span>
                <select
                  value={orderPageSize}
                  onChange={(e) => setOrderPageSize(Number(e.target.value))}
                  className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span className="text-neutral-500">orders</span>
              </div>
            </div>

            <div className="space-y-4">
              {displayOrders.length === 0 && (
                <p className="text-sm text-neutral-600">No orders match the active filters.</p>
              )}
              {displayOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <Card key={order.id} className="overflow-hidden border border-ink-700 bg-ink-950">
                    <div 
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 bg-ink-900/50 px-4 py-3 cursor-pointer hover:bg-ink-850 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-500" />
                        )}
                        <span className="font-semibold text-white">{order.code}</span>
                        <OrderStatusBadge status={order.status} />
                        <span className="text-xs text-neutral-500">
                          {formatDistanceToNow(new Date(order.placedAt), {
                            addSuffix: true
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-neutral-400">
                          {order.lines.length} item{order.lines.length !== 1 ? 's' : ''} · {orderSqft(order).toLocaleString('en-IN')} sqft
                        </span>
                        <span className="text-sm font-bold text-gold">
                          {formatINR(orderTotal(order))}
                        </span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="ti-scroll overflow-x-auto border-t border-ink-850">
                        <table className="w-full min-w-[520px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-ink-850 bg-ink-950/20 text-xs uppercase tracking-wider text-neutral-500">
                              <th className="px-4 py-2 font-medium">Stone Specification</th>
                              <th className="px-4 py-2 font-medium">Calculation Details</th>
                              <th className="px-4 py-2 text-right font-medium">Total Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.lines.map((line) => (
                              <tr
                                key={line.id}
                                className="border-b border-ink-800 last:border-0 hover:bg-ink-900/30"
                              >
                                <td className="px-4 py-3 text-white">
                                  {line.size} · {line.thickness}{' '}
                                  <span className="capitalize text-neutral-500">
                                    ({line.finish})
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                                  {orderLineTotalSqft(line)} sqft × ₹{line.ratePerSqft}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-gold">
                                  {formatINR(orderLineAmount(line))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {totalOrderPages > 1 && (
              <div className="flex items-center justify-between gap-2 mt-4 text-xs text-neutral-400">
                <span>
                  Showing <strong className="text-white font-medium">{orderStartIndex + 1}</strong> to{' '}
                  <strong className="text-white font-medium">{orderEndIndex}</strong> of{' '}
                  <strong className="text-gold font-semibold">{totalFilteredOrders}</strong> order{totalFilteredOrders !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOrderPage((p) => Math.max(p - 1, 1))}
                    disabled={activeOrderPage === 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] text-neutral-500 font-medium px-2">
                    Page {activeOrderPage} of {totalOrderPages}
                  </span>
                  <button
                    onClick={() => setOrderPage((p) => Math.min(p + 1, totalOrderPages))}
                    disabled={activeOrderPage === totalOrderPages}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sourcing Trips & Logistics Logs */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            {/* Trips filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4 bg-ink-950 p-3 rounded-lg border border-ink-800">
              <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                <Filter className="h-3.5 w-3.5 text-gold" />
                <span className="font-bold uppercase tracking-wider">Filter:</span>
              </div>

              {/* Lorry Selector */}
              <div className="flex items-center gap-1.5">
                <select
                  value={tripLorryId}
                  onChange={(e) => setTripLorryId(e.target.value)}
                  className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none min-w-[120px]"
                >
                  <option value="">All Vehicles</option>
                  {lorries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.plate}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Date */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">From</span>
                <input
                  type="date"
                  value={tripStartDate}
                  onChange={(e) => setTripStartDate(e.target.value)}
                  className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                />
              </div>

              {/* To Date */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">To</span>
                <input
                  type="date"
                  value={tripEndDate}
                  onChange={(e) => setTripEndDate(e.target.value)}
                  className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                />
              </div>

              {/* Limit Select */}
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

              {/* Clear button */}
              {(tripStartDate || tripEndDate || tripLorryId) && (
                <button
                  onClick={() => {
                    setTripStartDate('');
                    setTripEndDate('');
                    setTripLorryId('');
                  }}
                  className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2 py-1 text-[10px] text-red-400 font-semibold hover:bg-red-500/20"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-4">
              {displayTrips.length === 0 && (
                <p className="text-sm text-neutral-600">No trips match the active filters or found.</p>
              )}
              {displayTrips.map((trip) => {
                const totalExpenses = (trip.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
                const totalLoadedSqft = (trip.stoneLines || []).reduce((sum, line) => sum + (line.sqftPerPiece * line.pieces), 0);
                const driverName = getDriverName(trip.driverId);
                const lorryPlate = getLorryPlate(trip.lorryId);

                return (
                  <Card key={trip.id} className="p-5 border border-ink-700 bg-ink-950/40 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-850 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/trips/${trip.id}`} className="text-sm font-extrabold text-white hover:text-gold transition-colors">
                            {trip.code}
                          </Link>
                          <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                            trip.status === 'loading'
                              ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                              : trip.status === 'in-transit'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-green-500/10 text-green-300 border border-green-500/20'
                          }`}>
                            {trip.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">Date: {trip.date}</span>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] uppercase text-neutral-500 font-semibold">Driver &amp; Vehicle</span>
                        <span className="text-xs font-bold text-neutral-300">{driverName} · {lorryPlate}</span>
                      </div>
                    </div>

                    {/* Loaded Stones Specs & Quantities */}
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                        Loaded Quarry Slices ({totalLoadedSqft} Total Sqft)
                      </p>
                      {(!trip.stoneLines || trip.stoneLines.length === 0) ? (
                        <p className="text-xs text-neutral-600 italic">No loads registered on this trip.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(trip.stoneLines || []).map((line, idx) => (
                            <div key={idx} className="bg-ink-900 border border-ink-850/80 rounded p-2.5 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-bold text-neutral-200">{line.size} · {line.thickness} ({line.finish})</p>
                                <p className="text-[9px] text-neutral-500">Loaded: {line.pieces} pcs</p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-neutral-400">{line.sqftPerPiece * line.pieces} sqft</p>
                                <p className="font-bold text-gold">{formatINR(line.sqftPerPiece * line.pieces * line.ratePerSqft)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Trip Expenses */}
                    <div className="border-t border-ink-850 pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                          Trip Expenses
                        </p>
                        <span className="text-xs font-bold text-red-400">Total: {formatINR(totalExpenses)}</span>
                      </div>
                      
                      {(!trip.expenses || trip.expenses.length === 0) ? (
                        <p className="text-xs text-neutral-600 italic">No expenses logged.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(trip.expenses || []).map((exp) => (
                            <div key={exp.id} className="bg-ink-900 border border-ink-850 px-3 py-1.5 rounded-full text-[11px] flex items-center gap-2">
                              <span className="text-neutral-400">{exp.label}:</span>
                              <span className="font-bold text-neutral-200">{formatINR(exp.amount)}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                exp.review === 'approved' 
                                  ? 'bg-green-500/10 text-green-400' 
                                  : exp.review === 'flagged' 
                                  ? 'bg-red-500/10 text-red-400' 
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {exp.review}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {totalFilteredTrips > tripPageSize && (
              <div className="flex items-center justify-between gap-2 mt-4 text-xs text-neutral-400">
                <span>
                  Showing <strong className="text-white font-medium">{tripStartIndex + 1}</strong> to{' '}
                  <strong className="text-white font-medium">{tripEndIndex}</strong> of{' '}
                  <strong className="text-gold font-semibold">{totalFilteredTrips}</strong> trip{totalFilteredTrips !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTripPage((p) => Math.max(p - 1, 1))}
                    disabled={activeTripPage === 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] text-neutral-500 font-medium px-2">
                    Page {activeTripPage} of {totalTripPages}
                  </span>
                  <button
                    onClick={() => setTripPage((p) => Math.min(p + 1, totalTripPages))}
                    disabled={activeTripPage === totalTripPages}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}