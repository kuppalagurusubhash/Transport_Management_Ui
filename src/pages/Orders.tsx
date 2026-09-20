import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { formatINR } from '../utils/helpers';
import { CreateOrderModal } from '../components/ui/CreateOrderModal';
import {
  orderTotal,
  orderSqft,
  orderLineAmount,
  orderLineTotalSqft,
  type OrderStatus } from
'../data/types';
import { useOrders } from '../store/OrdersContext';
import { PageHeader } from '../components/layout/PageHeader';
import { OrderStatusBadge } from '../components/ui/Badge';
import { TruckIcon, UserIcon, CheckIcon, XIcon, PlusIcon, ChevronDown, ChevronUp, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const statusFlow: OrderStatus[] = [
  'placed',
  'confirmed',
  'dispatched',
  'delivered',
  'paid'
];

const filters: Array<{
  key: 'all' | OrderStatus;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'paid', label: 'Paid' }
];

export function Orders() {
  const { orders, setOrderStatus, assignOrderToLorry, lorries, drivers, unloadingParties, trips } = useOrders();
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  
  // Local state for tracking which order is currently being assigned a lorry
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedLorryId, setSelectedLorryId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  // Expand and collapse states for order cards
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  // Additional filters state
  const [filterBuyerId, setFilterBuyerId] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, filterBuyerId, filterDistrict, pageSize]);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const nextStatus = (s: OrderStatus): OrderStatus | null => {
    const i = statusFlow.indexOf(s);
    return i < statusFlow.length - 1 ? statusFlow[i + 1] : null;
  };

  const handleLorryChange = (lorryId: string) => {
    setSelectedLorryId(lorryId);
    const lorry = lorries.find((l) => l.id === lorryId);
    if (lorry && lorry.driverId) {
      setSelectedDriverId(lorry.driverId);
    } else {
      setSelectedDriverId('');
    }
  };

  const handleAssignSubmit = (orderId: string) => {
    if (!selectedLorryId || !selectedDriverId) return;
    assignOrderToLorry(orderId, selectedLorryId, selectedDriverId);
    setAssigningOrderId(null);
    setSelectedLorryId('');
    setSelectedDriverId('');
  };

  const totalValue = orders.reduce((sum, o) => sum + orderTotal(o), 0);
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'paid');
  const activeValue = activeOrders.reduce((sum, o) => sum + orderTotal(o), 0);

  // Compute filter values
  const uniqueDistricts = Array.from(new Set(orders.map((o) => o.district))).sort();

  const filteredOrders = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (filterBuyerId && o.unloadingPartyId !== filterBuyerId) return false;
    if (filterDistrict && o.district !== filterDistrict) return false;
    return true;
  });

  const totalFiltered = filteredOrders.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const visible = filteredOrders.slice(startIndex, endIndex);

  return (
    <div className="min-h-full">
      <PageHeader
        title="Orders"
        subtitle=""
        action={
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-neutral-400">
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Total Orders</span>
                <span className="font-bold text-white text-xs sm:text-sm">{orders.length}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Total Value</span>
                <span className="font-bold text-gold text-xs sm:text-sm">{formatINR(totalValue)}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Active Orders</span>
                <span className="font-bold text-amber-400 text-xs sm:text-sm">{activeOrders.length}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Active Value</span>
                <span className="font-bold text-white text-xs sm:text-sm">{formatINR(activeValue)}</span>
              </div>
            </div>
            <button
              onClick={() => setIsCreateOrderOpen(true)}
              className="rounded-md bg-gold px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-400 transition-colors shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            >
              <PlusIcon className="h-4 w-4" /> Create Order
            </button>
          </div>
        }
      />
      
      <div className="p-6 sm:p-8 space-y-6">
        <div className="space-y-4">
          {/* Status Tabs with counts */}
          <div className="border-b border-ink-800">
            <div className="flex flex-wrap -mb-px gap-2">
              {filters.map((f) => {
                const count = f.key === 'all'
                  ? orders.length
                  : orders.filter((o) => o.status === f.key).length;

                const isActive = filter === f.key;

                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? 'border-gold text-gold bg-gold/5'
                        : 'border-transparent text-neutral-400 hover:border-ink-700 hover:text-white'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-gold text-ink-950' : 'bg-ink-800 text-neutral-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter fields bar */}
          <div className="flex flex-wrap items-center gap-3 bg-ink-950 p-3 rounded-lg border border-ink-800">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
              <Filter className="h-3.5 w-3.5 text-gold" />
              <span className="font-bold uppercase tracking-wider">Filter:</span>
            </div>

            {/* Buyer Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={filterBuyerId}
                onChange={(e) => setFilterBuyerId(e.target.value)}
                className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none min-w-[140px]"
              >
                <option value="">All Buyers</option>
                {unloadingParties.map((up) => (
                  <option key={up.id} value={up.id}>
                    {up.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none min-w-[120px]"
              >
                <option value="">All Districts</option>
                {uniqueDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Size Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">Limit</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(filterBuyerId || filterDistrict || filter !== 'all') && (
              <button
                onClick={() => {
                  setFilterBuyerId('');
                  setFilterDistrict('');
                  setFilter('all');
                }}
                className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2 py-1 text-[10px] text-red-400 font-semibold hover:bg-red-500/20"
              >
                <XIcon className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {visible.length === 0 && (
            <p className="text-sm text-neutral-600">No orders match the active filters.</p>
          )}
          {visible.map((order, i) => {
            const buyer = unloadingParties.find((up) => up.id === order.unloadingPartyId);
            const next = nextStatus(order.status);
            const isAssigning = assigningOrderId === order.id;

            const orderTrips = trips.filter((t) => t.orderId === order.id);
            const totalOrderedPieces = order.lines.reduce((sum, line) => sum + line.pieces, 0);
            const totalOrderedSqft = order.lines.reduce((sum, line) => sum + orderLineTotalSqft(line), 0);
            
            const totalLoadedPieces = orderTrips.reduce((sum, t) => {
              return sum + t.stoneLines.reduce((s, line) => s + line.pieces, 0);
            }, 0);
            const totalLoadedSqft = orderTrips.reduce((sum, t) => {
              return sum + t.stoneLines.reduce((s, line) => s + line.sqftPerPiece * line.pieces, 0);
            }, 0);

            const hasRemaining = totalLoadedPieces < totalOrderedPieces;
            const loadedPercentage = totalOrderedSqft > 0 ? Math.min(100, Math.round((totalLoadedSqft / totalOrderedSqft) * 100)) : 0;

            const isExpanded = !!expandedOrderIds[order.id];

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="overflow-hidden rounded-lg border border-ink-700 bg-ink-950"
              >
                {/* Collapsible Card Header */}
                <div
                  onClick={() => toggleOrderExpand(order.id)}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 bg-ink-900/50 px-4 py-3.5 cursor-pointer hover:bg-ink-900 transition-colors select-none"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {order.code}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      {order.status === 'dispatched' && hasRemaining && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 animate-pulse">
                          Partially Dispatched
                        </span>
                      )}
                      {order.status === 'confirmed' && hasRemaining && orderTrips.length > 0 && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                          Split Sourcing
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {buyer?.name} · {order.district} ·{' '}
                      {formatDistanceToNow(new Date(order.placedAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Order Value
                      </p>
                      <p className="text-xs sm:text-sm font-black text-gold">
                        {formatINR(orderTotal(order))}
                      </p>
                    </div>

                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Fulfillment
                      </p>
                      <p className={`text-xs font-bold ${loadedPercentage === 100 ? 'text-green-400' : 'text-amber-400'}`}>
                        {loadedPercentage}% Loaded
                      </p>
                    </div>

                    <div className="text-neutral-500">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gold" />
                      ) : (
                        <ChevronDown className="h-5 w-5 hover:text-white transition-colors" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Collapsible Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Action buttons bar inside collapsible content */}
                      <div className="flex items-center justify-between border-b border-ink-800 bg-ink-950/60 px-4 py-3">
                        <div className="text-xs text-neutral-400">
                          Total Volume: <strong className="text-white font-medium">{orderSqft(order).toLocaleString('en-IN')} sqft</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          {((order.status === 'placed' || order.status === 'confirmed' || order.status === 'dispatched') && hasRemaining) && !isAssigning ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssigningOrderId(order.id);
                                const firstLorry = lorries.find(l => l.status === 'idle');
                                if (firstLorry) {
                                  handleLorryChange(firstLorry.id);
                                }
                              }}
                              className="rounded-md bg-gold px-3.5 py-1.5 text-xs font-bold text-ink-950 transition-colors hover:bg-gold-400 flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <TruckIcon className="h-3.5 w-3.5" />
                              {orderTrips.length > 0 ? 'Assign Addl Lorry' : 'Assign Lorry'}
                            </button>
                          ) : null}

                          {order.status === 'confirmed' && !hasRemaining && (
                            <span className="text-xs text-green-300 bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 rounded-md font-semibold">
                              Awaiting Dispatch (Fully Loaded)
                            </span>
                          )}

                          {order.status === 'confirmed' && hasRemaining && !isAssigning && orderTrips.length === 0 && (
                            <span className="text-xs text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 rounded-md font-semibold">
                              Awaiting Loading in Ramapuram
                            </span>
                          )}

                          {order.status === 'confirmed' && hasRemaining && !isAssigning && orderTrips.length > 0 && (
                            <span className="text-xs text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 rounded-md font-semibold">
                              Loading in Progress
                            </span>
                          )}
                          
                          {next && order.status !== 'placed' && order.status !== 'confirmed' && !hasRemaining && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderStatus(order.id, next);
                              }}
                              className="rounded bg-gold px-3 py-1.5 text-xs font-bold text-ink-950 transition-colors hover:bg-gold-400"
                            >
                              Mark {next}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Assignment Form */}
                      <AnimatePresence>
                        {isAssigning && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-b border-ink-700 bg-ink-900/30 px-4 py-4"
                          >
                            <div className="flex flex-wrap items-end gap-4">
                              <div className="w-full sm:w-64">
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                                  <TruckIcon className="h-3.5 w-3.5 text-gold" />
                                  Select Lorry
                                </label>
                                <select
                                  value={selectedLorryId}
                                  onChange={(e) => handleLorryChange(e.target.value)}
                                  className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                                >
                                  <option value="">-- Choose Lorry --</option>
                                  {lorries.filter((l) => 
                                    l.status === 'idle' || 
                                    trips.some((t) => t.lorryId === l.id && t.status === 'loading') || 
                                    l.id === selectedLorryId
                                  ).map((l) => {
                                    const activeTripsCount = trips.filter((t) => t.lorryId === l.id && t.status === 'loading').length;
                                    return (
                                      <option key={l.id} value={l.id}>
                                        {l.plate} {activeTripsCount > 0 ? `(Loading ${activeTripsCount} orders)` : `(${l.status})`} - Cap: {l.capacitySqft} sqft
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <div className="w-full sm:w-64">
                                <label className="mb-1.5 block text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                                  <UserIcon className="h-3.5 w-3.5 text-gold" />
                                  Select Driver
                                </label>
                                <select
                                  value={selectedDriverId}
                                  onChange={(e) => setSelectedDriverId(e.target.value)}
                                  className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                                >
                                  <option value="">-- Choose Driver --</option>
                                  {drivers.filter((d) => 
                                    d.status === 'idle' || 
                                    trips.some((t) => t.driverId === d.id && t.status === 'loading') || 
                                    d.id === selectedDriverId
                                  ).map((d) => {
                                    const activeTripsCount = trips.filter((t) => t.driverId === d.id && t.status === 'loading').length;
                                    return (
                                      <option key={d.id} value={d.id}>
                                        {d.name} {activeTripsCount > 0 ? `(Loading ${activeTripsCount} orders)` : `(${d.status})`}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAssignSubmit(order.id)}
                                  disabled={!selectedLorryId || !selectedDriverId}
                                  className="rounded-md bg-green-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                  Confirm
                                </button>
                                <button
                                  onClick={() => {
                                    setAssigningOrderId(null);
                                    setSelectedLorryId('');
                                    setSelectedDriverId('');
                                  }}
                                  className="rounded-md border border-ink-650 px-4 py-2 text-xs font-semibold text-neutral-350 transition-colors hover:text-white flex items-center gap-1"
                                >
                                  <XIcon className="h-4 w-4" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="ti-scroll overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-xs sm:text-sm">
                          <thead>
                            <tr className="text-xs uppercase tracking-wide text-neutral-600 bg-ink-900/10">
                              <th className="px-4 py-2 font-medium">Stone</th>
                              <th className="px-4 py-2 font-medium">Calculation</th>
                              <th className="px-4 py-2 text-right font-medium">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.lines.map((line) => (
                              <tr key={line.id} className="border-t border-ink-800">
                                <td className="px-4 py-2.5">
                                  <span className="text-white font-medium">
                                    {line.size} · {line.thickness}
                                  </span>
                                  <span className="ml-2 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] capitalize text-neutral-400 font-mono">
                                    {line.finish}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-xs text-neutral-400">
                                  {line.sqftPerPiece} sqft × {line.pieces} pcs ={' '}
                                  {orderLineTotalSqft(line)} sqft × ₹
                                  {line.ratePerSqft}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-gold">
                                  {formatINR(orderLineAmount(line))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="border-t border-ink-700 px-4 py-3 bg-ink-950/40 space-y-3">
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <span className="font-semibold">Fulfillment Progress:</span>
                          <span className={loadedPercentage === 100 ? "text-green-400 font-bold" : "text-gold font-bold"}>
                            {totalLoadedSqft.toLocaleString('en-IN')} / {totalOrderedSqft.toLocaleString('en-IN')} SQFT ({loadedPercentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-ink-850 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${loadedPercentage}%` }}
                            className={`h-full transition-all duration-300 ${loadedPercentage === 100 ? "bg-green-500" : "bg-gold"}`}
                          />
                        </div>

                        {orderTrips.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink-800/40 text-xs">
                            <span className="text-neutral-500">Assigned Lorries:</span>
                            {orderTrips.map((t) => {
                              const l = lorries.find((lorry) => lorry.id === t.lorryId);
                              const statusColors: Record<typeof t.status, string> = {
                                loading: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
                                'in-transit': 'bg-blue-400/10 text-blue-300 border-blue-400/25',
                                delivered: 'bg-gold/10 text-gold border-gold/25',
                                paid: 'bg-green-400/10 text-green-300 border-green-400/25'
                              };
                              return (
                                <span
                                  key={t.id}
                                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[10px] font-semibold border ${statusColors[t.status]}`}
                                >
                                  <span>{l?.plate || 'Lorry'}</span>
                                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                                  <span className="capitalize">{t.status.replace('-', ' ')}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-ink-700 px-4 py-2.5 text-xs text-neutral-500 bg-ink-950/20">
                        <span className="font-semibold text-neutral-400">
                          {orderSqft(order).toLocaleString('en-IN')} sqft total
                        </span>
                        <Link
                          to={`/unloading-parties/${order.unloadingPartyId}`}
                          className="text-gold hover:underline font-bold"
                        >
                          View buyer
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-800 pt-4 text-xs text-neutral-400">
            <span>
              Showing <strong className="text-white font-medium">{startIndex + 1}</strong> to <strong className="text-white font-medium">{endIndex}</strong> of{' '}
              <strong className="text-gold font-semibold">{totalFiltered}</strong> order{totalFiltered !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={activePage === 1}
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[11px] text-neutral-500 font-medium px-2">
                Page {activePage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={activePage === totalPages}
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
      />
    </div>
  );
}