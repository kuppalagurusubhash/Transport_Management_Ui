import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { formatINR } from '../utils/helpers';
import { CreateOrderModal } from '../components/ui/CreateOrderModal';
import {
  orderTotal,
  orderSqft,
  orderLineAmount,
  orderLineTotalSqft,
  type OrderStatus,
  type TripStatus
} from
  '../data/types';
import { useOrders } from '../store/OrdersContext';
import { PageHeader } from '../components/layout/PageHeader';
import { OrderStatusBadge } from '../components/ui/Badge';
import { TruckIcon, UserIcon, CheckIcon, XIcon, PlusIcon, ChevronDown, ChevronUp, Filter, ChevronLeft, ChevronRight, PackageOpenIcon, Trash2, AlertTriangle, GitMerge, ArrowRight, Sparkles, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

const CORRIDOR_CLUSTERS: Record<string, string[]> = {
  'North Malabar': ['Kasaragod', 'Kannur', 'Wayanad'],
  'Central Malabar': ['Kozhikode', 'Malappuram', 'Palakkad'],
  'Cochin / Central': ['Thrissur', 'Ernakulam', 'Idukki'],
  'Mid-South': ['Kottayam', 'Alappuzha', 'Pathanamthitta'],
  'South Coast': ['Kollam', 'Thiruvananthapuram']
};

export const getCorridorForDistrict = (district: string): string => {
  for (const [corridor, districts] of Object.entries(CORRIDOR_CLUSTERS)) {
    if (districts.some((d) => d.toLowerCase() === district.toLowerCase())) {
      return corridor;
    }
  }
  return district;
};

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
  const navigate = useNavigate();
  const { orders, setOrderStatus, assignOrderToLorry, mergeOrdersToFleet, lorries, drivers, unloadingParties, trips, deleteOrder } = useOrders();
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Consolidation / Load Merge State
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [selectedMergeOrderIds, setSelectedMergeOrderIds] = useState<string[]>([]);
  const [mergeLorryId, setMergeLorryId] = useState<string>('');
  const [mergeDriverId, setMergeDriverId] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);

  // Unassigned / Pending Fleet Assignment Orders
  const pendingOrders = React.useMemo(() => {
    return orders.filter((o) => {
      const orderTrips = trips.filter((t) => t.orderId === o.id || (t.orderIds && t.orderIds.includes(o.id)));
      return (o.status === 'placed' || o.status === 'confirmed') && orderTrips.length === 0;
    });
  }, [orders, trips]);

  // Group pending orders by Corridor / Nearby City
  const mergeableGroups = React.useMemo(() => {
    const groups: Record<string, typeof orders> = {};
    pendingOrders.forEach((ord) => {
      const corridor = getCorridorForDistrict(ord.district);
      if (!groups[corridor]) groups[corridor] = [];
      groups[corridor].push(ord);
    });

    return Object.entries(groups)
      .filter(([_, ords]) => ords.length >= 2)
      .map(([corridor, ords]) => ({
        corridor,
        orders: ords,
        totalSqft: ords.reduce((sum, o) => sum + orderSqft(o), 0),
        totalValue: ords.reduce((sum, o) => sum + orderTotal(o), 0)
      }));
  }, [pendingOrders]);

  const openMergeModal = (preselectedIds?: string[]) => {
    setMergeError('');
    setMergeSuccess(null);
    if (preselectedIds && preselectedIds.length > 0) {
      setSelectedMergeOrderIds(preselectedIds);
    } else if (mergeableGroups.length > 0) {
      setSelectedMergeOrderIds(mergeableGroups[0].orders.map((o) => o.id));
    } else {
      setSelectedMergeOrderIds(pendingOrders.slice(0, 2).map((o) => o.id));
    }

    const availableLorry = lorries.find((l) => l.status === 'idle') || lorries[0];
    if (availableLorry) {
      setMergeLorryId(availableLorry.id);
      const matchedDriver = drivers.find((d) => d.id === availableLorry.driverId || d.lorryId === availableLorry.id);
      setMergeDriverId(matchedDriver?.id || drivers[0]?.id || '');
    }
    setIsMergeModalOpen(true);
  };

  const handleMergeLorryChange = (lorryId: string) => {
    setMergeLorryId(lorryId);
    const lorry = lorries.find((l) => l.id === lorryId);
    if (lorry && lorry.driverId) {
      setMergeDriverId(lorry.driverId);
    } else {
      const matchedDriver = drivers.find((d) => d.lorryId === lorryId || d.id === lorry?.driverId);
      if (matchedDriver) {
        setMergeDriverId(matchedDriver.id);
      }
    }
  };

  const handleConfirmMerge = async () => {
    if (selectedMergeOrderIds.length < 2) {
      setMergeError('Please select at least 2 orders to merge into a single fleet load.');
      return;
    }
    if (!mergeLorryId || !mergeDriverId) {
      setMergeError('Please select a destination lorry and driver for this fleet route.');
      return;
    }

    try {
      setIsMerging(true);
      setMergeError('');
      const res = await mergeOrdersToFleet(selectedMergeOrderIds, mergeLorryId, mergeDriverId);
      setMergeSuccess(`Successfully created Consolidated Trip #${res.tripCode}! Merged ${selectedMergeOrderIds.length} orders into a single fleet.`);
      setTimeout(() => {
        setIsMergeModalOpen(false);
        navigate(`/loading?lorryId=${mergeLorryId}`);
      }, 1500);
    } catch (err: any) {
      setMergeError(err.message || 'Failed to merge orders to fleet');
    } finally {
      setIsMerging(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      setIsDeleting(true);
      await deleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    } catch (err) {
      console.error('Failed to delete order:', err);
    } finally {
      setIsDeleting(false);
    }
  };

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
      const matchedDriver = drivers.find((d) => d.lorryId === lorryId || d.id === lorry?.driverId);
      if (matchedDriver) {
        setSelectedDriverId(matchedDriver.id);
      } else {
        setSelectedDriverId('');
      }
    }
  };

  const handleAssignSubmit = (orderId: string) => {
    if (!selectedLorryId || !selectedDriverId) return;
    const targetLorry = selectedLorryId;
    assignOrderToLorry(orderId, selectedLorryId, selectedDriverId);
    setAssigningOrderId(null);
    setSelectedLorryId('');
    setSelectedDriverId('');
    navigate(`/loading?lorryId=${targetLorry}`);
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
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-6 text-neutral-400">
                    <div className="rounded-lg border border-ink-800 bg-ink-900/60 p-2 sm:p-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:border-r sm:border-ink-700 sm:pr-6">
                      <span className="block text-[9.5px] sm:text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Total Orders</span>
                      <span className="font-bold text-white text-xs sm:text-sm font-mono">{orders.length}</span>
                    </div>
                      <div className="rounded-lg border border-ink-800 bg-ink-900/60 p-2 sm:p-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:border-r sm:border-ink-700 sm:pr-6">
                        <span className="block text-[9.5px] sm:text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Total Value</span>
                        <span className="font-bold text-gold text-xs sm:text-sm font-mono">{formatINR(totalValue)}</span>
                      </div>
                        <div className="rounded-lg border border-ink-800 bg-ink-900/60 p-2 sm:p-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:border-r sm:border-ink-700 sm:pr-6">
                          <span className="block text-[9.5px] sm:text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Active Orders</span>
                          <span className="font-bold text-amber-400 text-xs sm:text-sm font-mono">{activeOrders.length}</span>
                        </div>
                          <div className="rounded-lg border border-ink-800 bg-ink-900/60 p-2 sm:p-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:border-r sm:border-ink-700 sm:pr-6">
                            <span className="block text-[9.5px] sm:text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Active Value</span>
                            <span className="font-bold text-white text-xs sm:text-sm font-mono">{formatINR(activeValue)}</span>
                          </div>
                        </div>

                        {/* Merge Load Button & Create Order CTA */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => openMergeModal()}
                            className="w-full sm:w-auto justify-center rounded-xl sm:rounded-md bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            title="Combine multiple orders for the same city/corridor into a single fleet load"
                          >
                            <GitMerge className="h-4 w-4" />
                            <span>Merge Load</span>
                            {mergeableGroups.length > 0 && (
                              <span className="rounded-full bg-emerald-400 text-black px-1.5 py-0.2 text-[10px] font-black">
                                {mergeableGroups.reduce((acc, g) => acc + g.orders.length, 0)}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => setIsCreateOrderOpen(true)}
                            className="w-full sm:w-auto justify-center rounded-xl sm:rounded-md bg-gold px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-400 transition-colors shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <PlusIcon className="h-4 w-4" /> Create Order
                          </button>
                        </div>
                      </div>
        }
      />

      <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Smart Load Consolidation Recommendation Banner */}
        {mergeableGroups.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#0A1218] to-emerald-500/5 p-4 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <GitMerge className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Corridor Optimization
                  </span>
                  <span className="text-xs font-bold text-white">
                    {mergeableGroups.length} Load Merge {mergeableGroups.length === 1 ? 'Opportunity' : 'Opportunities'} Detected
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  Orders found for <strong className="text-white">{mergeableGroups.map((g) => `${g.corridor} (${g.orders.length} orders, ${g.totalSqft.toLocaleString()} sqft)`).join('; ')}</strong>. Merge into a single lorry to maximize capacity and minimize toll &amp; fuel costs.
                </p>
              </div>
            </div>
            <button
              onClick={() => openMergeModal(mergeableGroups[0].orders.map((o) => o.id))}
              className="rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold px-4 py-2 text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Combine {mergeableGroups[0].corridor} Load</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {/* Status Tabs with counts */}
          <div className="border-b border-ink-800">
            <div className="flex overflow-x-auto no-scrollbar -mb-px gap-1 sm:gap-2">
              {filters.map((f) => {
                const count = f.key === 'all'
                  ? orders.length
                  : orders.filter((o) => o.status === f.key).length;

                const isActive = filter === f.key;

                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`flex items-center gap-2 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold border-b-2 transition-all shrink-0 ${
                      isActive
                        ? 'border-gold text-gold bg-gold/5'
                        : 'border-transparent text-neutral-400 hover:border-ink-700 hover:text-white'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-gold text-ink-950' : 'bg-ink-800 text-neutral-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter fields bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-ink-950 p-2.5 sm:p-3 rounded-xl border border-ink-800">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
              <Filter className="h-3.5 w-3.5 text-gold" />
              <span className="font-bold uppercase tracking-wider">Filter:</span>
            </div>

            {/* Buyer Filter */}
            <div className="flex-1 sm:flex-initial min-w-[130px]">
              <select
                value={filterBuyerId}
                onChange={(e) => setFilterBuyerId(e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5 sm:py-1 text-xs text-white focus:border-gold focus:outline-none"
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
            <div className="flex-1 sm:flex-initial min-w-[115px]">
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5 sm:py-1 text-xs text-white focus:border-gold focus:outline-none"
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

            const orderTrips = trips.filter((t) => t.orderId === order.id || (t.orderIds && t.orderIds.includes(order.id)));
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">
                        {order.code}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      {orderTrips.some((t) => t.isConsolidated) && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          Consolidated Load
                        </span>
                      )}
                      {order.status === 'placed' && (() => {
                        const corridor = getCorridorForDistrict(order.district);
                        const otherMergeable = pendingOrders.filter(
                          (o) => o.id !== order.id && getCorridorForDistrict(o.district) === corridor
                        );
                        if (otherMergeable.length === 0) return null;
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMergeModal([order.id, ...otherMergeable.map((o) => o.id)]);
                            }}
                            className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-gold hover:bg-amber-500/20 hover:border-gold transition-all"
                            title={`Merge with ${otherMergeable.length} other pending order(s) in ${corridor}`}
                          >
                            <GitMerge className="h-2.5 w-2.5" />
                            Merge Load (+{otherMergeable.length})
                          </button>
                        );
                      })()}
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
                      <p className={`text - xs font - bold ${ loadedPercentage === 100 ? 'text-green-400' : 'text-amber-400' } `}>
                        {loadedPercentage}% Loaded
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderToDelete(order);
                        }}
                        className="p-1 rounded-md text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Order"
                        aria-label="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gold" />
                        ) : (
                          <ChevronDown className="h-5 w-5 hover:text-white transition-colors" />
                        )}
                      </div>
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

                          {orderTrips.length > 0 && orderTrips.some(t => t.status === 'loading') && (
                            <Link
                              to={`/ loading ? tripId = ${ orderTrips.find(t => t.status === 'loading')?.id }& lorryId=${ orderTrips.find(t => t.status === 'loading')?.lorryId }`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-md bg-amber-500/20 border border-amber-400/40 px-3 py-1.5 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/30 flex items-center gap-1.5"
                            >
                              <PackageOpenIcon className="h-3.5 w-3.5" />
                              Fill Loading Details
                            </Link>
                          )}

                          {order.status === 'confirmed' && hasRemaining && !isAssigning && orderTrips.length === 0 && (
                            <span className="text-xs text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 rounded-md font-semibold">
                              Awaiting Loading in Ramapuram
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

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderToDelete(order);
                            }}
                            className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Order</span>
                          </button>
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
                                  {lorries.filter((l) => l.status !== 'sold').map((l) => {
                                    const activeTripsCount = trips.filter((t) => (t.lorryId === l.id || t.lorryId === l.plate) && (t.status === 'loading' || t.status === 'in-transit')).length;
                                    const assignedDriver = drivers.find((d) => d.id === l.driverId || d.lorryId === l.id);
                                    return (
                                      <option key={l.id} value={l.id}>
                                        {l.plate} {activeTripsCount > 0 ? `(${ activeTripsCount } active load${ activeTripsCount > 1 ? 's' : ''})` : `(${l.status})`} - Cap: {l.capacitySqft.toLocaleString('en-IN')} sqft {assignedDriver ? `(${assignedDriver.name})` : ''}
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
                                  {drivers.filter((d) => d.status !== 'off-duty').map((d) => {
                                    const assignedLorry = lorries.find((l) => l.driverId === d.id || l.id === d.lorryId);
                                    return (
                                      <option key={d.id} value={d.id}>
                                        {d.name} ({d.status}) {assignedLorry ? `· ${assignedLorry.plate}` : ''}
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
                                const statusColors: Partial<Record<TripStatus, string>> = {
                                  loading: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
                                  loaded: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
                                  'in-transit': 'bg-blue-400/10 text-blue-300 border-blue-400/25',
                                  arrived_kerala: 'bg-purple-400/10 text-purple-300 border-purple-400/25',
                                  return_sand_loading: 'bg-orange-400/10 text-orange-300 border-orange-400/25',
                                  returning: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/25',
                                  returned_to_base: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                                  completed: 'bg-green-500/15 text-green-300 border-green-500/30',
                                  delivered: 'bg-gold/10 text-gold border-gold/25',
                                  paid: 'bg-green-400/10 text-green-300 border-green-400/25'
                                };
                                return (
                                  <Link
                                    key={t.id}
                                    to={t.status === 'loading' ? `/loading?tripId=${t.id}&lorryId=${l?.id || t.lorryId}` : `/trips/${t.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-semibold border transition-all hover:scale-[1.03] ${statusColors[t.status] || 'bg-gold/10 text-gold border-gold/25'}`}
                                    title={t.status === 'loading' ? 'Click to record multi-quarry stones and labour details' : 'View Trip Details'}
                                  >
                                    <span>{l?.plate || 'Lorry'}</span>
                                    {t.isConsolidated && (
                                      <span className="rounded bg-emerald-500/25 px-1 py-0.5 text-[9px] text-emerald-300 font-bold border border-emerald-500/30">
                                        Multi-Drop
                                      </span>
                                    )}
                                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                                    <span className="capitalize">{t.status.replace('-', ' ')}</span>
                                    {t.status === 'loading' && (
                                      <span className="ml-1 text-[9px] underline font-bold">Load →</span>
                                    )}
                                  </Link>
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

              {/* Delete Order Confirmation Modal */}
              <AnimatePresence>
                {orderToDelete && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#0E141C] p-6 shadow-2xl backdrop-blur-2xl text-neutral-100"
                    >
                      <div className="flex items-center gap-3 text-red-400 mb-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/30">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">Delete Order?</h3>
                          <p className="text-xs text-neutral-400 font-mono">#{orderToDelete.code}</p>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed mb-5">
                        Are you sure you want to permanently delete order <strong className="text-white font-mono">{orderToDelete.code}</strong>
                        {unloadingParties.find((up) => up.id === orderToDelete.unloadingPartyId) && (
                          <span> for <strong className="text-white">{unloadingParties.find((up) => up.id === orderToDelete.unloadingPartyId)?.name}</strong></span>
                        )}? This will remove the consignment and its allocation records from the system.
                      </p>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setOrderToDelete(null)}
                          className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={handleConfirmDelete}
                          className="rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {isDeleting ? (
                            <>
                              <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Order</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Consolidate Load & Merge Fleet Modal */}
              <AnimatePresence>
                {isMergeModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="relative w-full max-w-3xl my-auto rounded-2xl border border-white/[0.12] bg-[#0C1117] p-5 sm:p-7 shadow-2xl backdrop-blur-2xl text-neutral-100 space-y-6 max-h-[92vh] flex flex-col"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between border-b border-white/[0.08] pb-4 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/30 text-gold shadow-lg shadow-gold/10">
                            <GitMerge className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-bold text-white tracking-tight">Consolidate Load & Merge Fleet</h2>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                                Multi-Drop Route
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              Combine pending orders for the same corridor into a single fleet vehicle for shared transit and reduced trip costs.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsMergeModalOpen(false)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          <XIcon className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Modal Body - Scrollable */}
                      <div className="overflow-y-auto ti-scroll space-y-5 pr-1 flex-1">
                        {/* Messages */}
                        {mergeError && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{mergeError}</span>
                          </div>
                        )}
                        {mergeSuccess && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>{mergeSuccess}</span>
                          </div>
                        )}

                        {/* Step 1: Select Orders to Merge */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                              <Layers className="h-3.5 w-3.5 text-gold" />
                              1. Select Orders to Consolidate ({selectedMergeOrderIds.length} selected)
                            </label>
                            <span className="text-[11px] text-neutral-500">
                              Click card to include / exclude order
                            </span>
                          </div>

                          {pendingOrders.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-ink-700 p-6 text-center text-xs text-neutral-500">
                              No pending unassigned orders available to merge.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {pendingOrders.map((ord) => {
                                const isChecked = selectedMergeOrderIds.includes(ord.id);
                                const bParty = unloadingParties.find((up) => up.id === ord.unloadingPartyId);
                                const corridor = getCorridorForDistrict(ord.district);
                                const sqft = orderSqft(ord);
                                const val = orderTotal(ord);

                                return (
                                  <div
                                    key={ord.id}
                                    onClick={() => {
                                      if (isChecked) {
                                        setSelectedMergeOrderIds(selectedMergeOrderIds.filter((id) => id !== ord.id));
                                      } else {
                                        setSelectedMergeOrderIds([...selectedMergeOrderIds, ord.id]);
                                      }
                                    }}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-gold/[0.08] border-gold/40 text-white shadow-sm ring-1 ring-gold/20'
                                        : 'bg-ink-900/60 border-ink-750 text-neutral-400 hover:border-ink-650 hover:bg-ink-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}} // handled by parent div
                                        className="h-4 w-4 rounded border-ink-600 bg-ink-950 text-gold focus:ring-gold pointer-events-none"
                                      />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-xs text-white">#{ord.code}</span>
                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
                                            {corridor}
                                          </span>
                                        </div>
                                        <p className="text-xs text-neutral-400 mt-0.5">
                                          {bParty?.name || 'Customer'} · <span className="text-neutral-300 font-medium">{ord.district}</span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <p className="text-xs font-bold text-white">
                                        {sqft.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-neutral-400">sqft</span>
                                      </p>
                                      <p className="text-[11px] font-mono text-gold">
                                        {formatINR(val)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Step 2: Fleet & Driver Assignment */}
                        <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                          <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                            <TruckIcon className="h-3.5 w-3.5 text-gold" />
                            2. Assign Fleet Vehicle & Driver
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] text-neutral-400 mb-1">Select Lorry</label>
                              <select
                                value={mergeLorryId}
                                onChange={(e) => handleMergeLorryChange(e.target.value)}
                                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                              >
                                <option value="">-- Choose Lorry --</option>
                                {lorries.filter((l) => l.status !== 'sold').map((l) => {
                                  const activeTripsCount = trips.filter(
                                    (t) => (t.lorryId === l.id || t.lorryId === l.plate) && (t.status === 'loading' || t.status === 'in-transit')
                                  ).length;
                                  return (
                                    <option key={l.id} value={l.id}>
                                      {l.plate} · Cap: {l.capacitySqft.toLocaleString('en-IN')} sqft {activeTripsCount > 0 ? `(${activeTripsCount} active)` : `(${l.status})`}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] text-neutral-400 mb-1">Select Driver</label>
                              <select
                                value={mergeDriverId}
                                onChange={(e) => setMergeDriverId(e.target.value)}
                                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                              >
                                <option value="">-- Choose Driver --</option>
                                {drivers.filter((d) => d.status !== 'off-duty').map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} ({d.phone}) - {d.status}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Live Vehicle Capacity Gauge */}
                          {(() => {
                            const selectedOrders = orders.filter((o) => selectedMergeOrderIds.includes(o.id));
                            const totalSqft = selectedOrders.reduce((sum, o) => sum + orderSqft(o), 0);
                            const totalVal = selectedOrders.reduce((sum, o) => sum + orderTotal(o), 0);
                            const chosenLorry = lorries.find((l) => l.id === mergeLorryId);
                            const maxCapacity = chosenLorry ? chosenLorry.capacitySqft : 1805;
                            const utilPercent = Math.round((totalSqft / maxCapacity) * 100);
                            const isOverload = totalSqft > maxCapacity;

                            return (
                              <div className="rounded-xl border border-ink-750 bg-ink-950/80 p-4 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-neutral-300">Fleet Capacity Utilization</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-white">
                                      {totalSqft.toLocaleString('en-IN')} / {maxCapacity.toLocaleString('en-IN')} sqft
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        isOverload
                                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                          : utilPercent >= 80
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-amber-500/20 text-gold border border-amber-500/30'
                                      }`}
                                    >
                                      {utilPercent}% {isOverload ? 'OVERLOAD' : 'OPTIMAL'}
                                    </span>
                                  </div>
                                </div>

                                <div className="h-2 w-full bg-ink-850 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${Math.min(100, utilPercent)}%` }}
                                    className={`h-full transition-all duration-300 ${
                                      isOverload ? 'bg-red-500' : utilPercent >= 80 ? 'bg-emerald-500' : 'bg-gold'
                                    }`}
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                                  <div className="p-2 rounded-lg bg-ink-900/60 border border-ink-800">
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Merged Orders</p>
                                    <p className="text-sm font-bold text-white">{selectedMergeOrderIds.length}</p>
                                  </div>
                                  <div className="p-2 rounded-lg bg-ink-900/60 border border-ink-800">
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Total Value</p>
                                    <p className="text-sm font-bold text-gold font-mono">{formatINR(totalVal)}</p>
                                  </div>
                                  <div className="p-2 rounded-lg bg-ink-900/60 border border-ink-800">
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Drop Stops</p>
                                    <p className="text-sm font-bold text-white">{selectedMergeOrderIds.length} Points</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Multi-Drop Route Preview */}
                        {selectedMergeOrderIds.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <ArrowRight className="h-3.5 w-3.5 text-gold" />
                              Multi-Drop Delivery Itinerary
                            </label>
                            <div className="p-3 rounded-xl bg-ink-900/40 border border-ink-800 space-y-2 text-xs">
                              <div className="flex items-center gap-2 text-gold">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-[10px] font-bold">1</span>
                                <span className="font-semibold text-white">Ramapuram Quarry Cluster</span>
                                <span className="text-[10px] text-neutral-500">(Origin Loading Base)</span>
                              </div>
                              {selectedMergeOrderIds.map((id, idx) => {
                                const o = orders.find((ord) => ord.id === id);
                                if (!o) return null;
                                const p = unloadingParties.find((up) => up.id === o.unloadingPartyId);
                                return (
                                  <div key={id} className="flex items-center gap-2 pl-2 border-l-2 border-gold/30 ml-2.5 py-0.5 text-neutral-300">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.1] text-[9px] font-bold text-white">{idx + 2}</span>
                                    <span className="font-medium text-white">{p?.name || 'Buyer'}</span>
                                    <span className="text-neutral-500">·</span>
                                    <span className="text-neutral-300 font-semibold">{o.district}</span>
                                    <span className="text-neutral-500">·</span>
                                    <span className="text-[11px] text-gold font-mono">{orderSqft(o).toLocaleString('en-IN')} sqft</span>
                                    <span className="text-[10px] text-neutral-500 font-mono">(#{o.code})</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08] shrink-0">
                        <button
                          type="button"
                          disabled={isMerging}
                          onClick={() => setIsMergeModalOpen(false)}
                          className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isMerging || selectedMergeOrderIds.length < 2 || !mergeLorryId || !mergeDriverId}
                          onClick={handleConfirmMerge}
                          className="rounded-xl bg-gold hover:bg-gold-400 active:scale-95 px-5 py-2.5 text-xs font-bold text-ink-950 shadow-lg shadow-gold/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isMerging ? (
                            <>
                              <span className="h-3.5 w-3.5 rounded-full border-2 border-ink-950 border-t-transparent animate-spin" />
                              <span>Consolidating Fleet...</span>
                            </>
                          ) : (
                            <>
                              <GitMerge className="h-4 w-4" />
                              <span>Merge & Dispatch Fleet ({selectedMergeOrderIds.length} Orders)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
            );
}