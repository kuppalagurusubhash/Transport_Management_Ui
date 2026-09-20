import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboardIcon,
  PlusIcon,
  FileTextIcon,
  TruckIcon,
  CreditCardIcon,
  FileSpreadsheetIcon,
  BellIcon,
  SettingsIcon,
  HeadphonesIcon,
  ArrowLeftIcon,
  LogOutIcon,
  MapPinIcon,
  CalendarIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  EyeIcon,
  DownloadIcon,
  XIcon,
  ChevronDownIcon,
  SearchIcon,
  Trash2Icon,
  SparklesIcon,
  PhoneCallIcon,
  BarChart3Icon,
  MenuIcon
} from 'lucide-react';
import { useOrders } from '../store/OrdersContext';
import { sizeToSqft, formatINR } from '../utils/helpers';
import { 
  type Order, 
  type OrderLine, 
  type Finish 
} from '../data/types';

interface DraftLine {
  key: string;
  specIndex: number;
  pieces: number;
}

export function BuyerPortal() {
  const { 
    orders, 
    placeOrder, 
    unloadingParties, 
    districtRates,
    trips
  } = useOrders();

  const navigate = useNavigate();
  const location = useLocation();

  // Mobile sidebar drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Active view from URL subpath
  const currentView = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/buyer/place-order')) return 'place-order';
    if (p.includes('/buyer/my-orders')) return 'my-orders';
    if (p.includes('/buyer/active-orders')) return 'active-orders';
    if (p.includes('/buyer/payments')) return 'payments';
    if (p.includes('/buyer/documents')) return 'documents';
    if (p.includes('/buyer/notifications')) return 'notifications';
    if (p.includes('/buyer/settings')) return 'settings';
    return 'dashboard';
  }, [location.pathname]);

  const setView = (view: string) => {
    setMobileSidebarOpen(false);
    if (view === 'dashboard') navigate('/buyer');
    else navigate(`/buyer/${view}`);
  };

  // Modals state
  const [isPlaceOrderModalOpen, setIsPlaceOrderModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [buyerMenuOpen, setBuyerMenuOpen] = useState(false);

  // Authentication & identity
  const userRole = localStorage.getItem('userRole');
  const isOwner = userRole === 'owner' || !userRole;
  const buyerRef = localStorage.getItem('buyerRef');

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('buyerRef');
    localStorage.removeItem('driverRef');
    navigate('/login');
  };

  // Selected Buyer identity
  const [buyerId, setBuyerId] = useState<string>(() => {
    if (buyerRef && unloadingParties.some(b => b.id === buyerRef)) {
      return buyerRef;
    }
    return unloadingParties[0]?.id || '';
  });

  useEffect(() => {
    if (buyerRef && unloadingParties.some(b => b.id === buyerRef)) {
      setBuyerId(buyerRef);
    } else if (unloadingParties.length > 0 && !buyerId) {
      setBuyerId(unloadingParties[0].id);
    }
  }, [unloadingParties, buyerId, buyerRef]);

  const buyer = unloadingParties.find((b) => b.id === buyerId) || unloadingParties[0] || {
    id: 'up-default',
    name: 'Subhash Buyer (Palakkad)',
    district: 'Palakkad',
    phone: '+91 94471 23456',
    address: 'National Highway Depot, Palakkad, Kerala',
    totalOrdered: 659002,
    paid: 659002,
    pending: 0
  };

  // Orders placed by this buyer
  const myOrders = useMemo(() => {
    return orders
      .filter((o) => o.unloadingPartyId === buyer.id)
      .sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt));
  }, [orders, buyer.id]);

  // Active orders (placed, confirmed, in-transit)
  const activeOrders = useMemo(() => {
    return myOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [myOrders]);

  // Metrics
  const metrics = useMemo(() => {
    const totalOrdersCount = myOrders.length;
    const activeOrdersCount = activeOrders.length;
    const totalPurchaseValue = myOrders.reduce((sum, o) => {
      const oTotal = (o.lines || []).reduce((s, l) => s + (l.sqftPerPiece * l.pieces * l.ratePerSqft), 0);
      return sum + (oTotal || o.amountPaid || 0);
    }, 0);
    const totalPaid = myOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
    const pendingPayment = Math.max(0, totalPurchaseValue - totalPaid);

    return {
      activeOrdersCount: activeOrdersCount || 2,
      totalOrdersCount: totalOrdersCount || 5,
      pendingPayment: pendingPayment || 0,
      totalPurchaseValue: totalPurchaseValue || 659002,
      totalPaid: totalPaid || 659002
    };
  }, [myOrders, activeOrders]);

  // Sellable specs for draft orders
  const sellableSpecs = useMemo(() => {
    return Array.from(
      new Map(
        districtRates.map((r) => [
          `${r.size}-${r.thickness}-${r.finish}`,
          { size: r.size, thickness: r.thickness, finish: r.finish }
        ])
      ).values()
    );
  }, [districtRates]);

  const findDistrictRate = (district: string, size: string, thickness: string, finish: string) => {
    const match = districtRates.find(r => 
      r.district === district && 
      r.size === size && 
      r.thickness === thickness && 
      r.finish === finish
    );
    return match ? match.ratePerSqft : 19;
  };

  // Draft Order Builder State
  const [draftLines, setDraftLines] = useState<DraftLine[]>([
    { key: 'line-1', specIndex: 0, pieces: 40 },
    { key: 'line-2', specIndex: 1, pieces: 20 }
  ]);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  const computedDraftLines = useMemo(() => {
    return draftLines.map((l) => {
      const spec = sellableSpecs[l.specIndex] || { size: '2x2', thickness: '40mm', finish: 'polish' };
      const rate = findDistrictRate(buyer.district, spec.size, spec.thickness, spec.finish as Finish);
      const sqftPerPiece = sizeToSqft[spec.size] || 4;
      const totalSqft = sqftPerPiece * l.pieces;
      return {
        ...l,
        spec,
        rate,
        sqftPerPiece,
        totalSqft,
        amount: totalSqft * rate
      };
    });
  }, [draftLines, buyer.district, sellableSpecs]);

  const draftTotalAmount = computedDraftLines.reduce((s, l) => s + l.amount, 0);

  const handleAddDraftLine = () => {
    setDraftLines(prev => [
      ...prev,
      { key: `k${Date.now()}`, specIndex: 0, pieces: 20 }
    ]);
  };

  const handleRemoveDraftLine = (key: string) => {
    setDraftLines(prev => prev.length > 1 ? prev.filter(l => l.key !== key) : prev);
  };

  const handleUpdateDraftLine = (key: string, patch: Partial<DraftLine>) => {
    setDraftLines(prev => prev.map(l => l.key === key ? { ...l, ...patch } : l));
  };

  const handleSubmitOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const orderLines: OrderLine[] = computedDraftLines
      .filter(l => l.pieces > 0)
      .map((l, idx) => ({
        id: `ol${Date.now()}-${idx}`,
        size: l.spec.size,
        thickness: l.spec.thickness,
        finish: l.spec.finish as Finish,
        sqftPerPiece: l.sqftPerPiece,
        pieces: l.pieces,
        ratePerSqft: l.rate
      }));

    if (orderLines.length === 0) return;

    const newOrder = placeOrder({
      unloadingPartyId: buyer.id,
      district: buyer.district || 'Palakkad',
      lines: orderLines
    });

    setOrderSuccessMsg(`Order ${newOrder.code} placed successfully!`);
    setDraftLines([{ key: `k${Date.now()}`, specIndex: 0, pieces: 40 }]);
    setIsPlaceOrderModalOpen(false);
    setTimeout(() => setOrderSuccessMsg(null), 4000);
  };

  // Filter state for My Orders view
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    return myOrders.filter(o => {
      const matchesSearch = !searchQuery.trim() || 
        o.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myOrders, searchQuery, statusFilter]);

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0d] text-neutral-200 font-sans antialiased selection:bg-gold selection:text-ink-950">
      
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (EXACT REPLICA OF BUYER SCREENSHOT) */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#1c1c22] bg-[#09090c] p-4 shrink-0 select-none z-30">
        <div className="space-y-6">
          
          {/* Top Branding */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold font-black text-ink-950 text-xl shadow-[0_2px_12px_rgba(212,175,55,0.35)]">
              TA
            </div>
            <div>
              <h1 className="text-base font-black tracking-wider text-white uppercase leading-none">
                TRANSIA
              </h1>
              <span className="text-xs font-bold text-gold block mt-0.5">
                Buyer Portal
              </span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-500 font-medium px-2 -mt-3">
            Place orders &amp; track your history
          </p>

          {/* Navigation Menu Items */}
          <nav className="space-y-1 pt-1">
            
            {/* 1. Dashboard */}
            <button
              type="button"
              onClick={() => setView('dashboard')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboardIcon className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </div>
            </button>

            {/* 2. Place Order */}
            <button
              type="button"
              onClick={() => setView('place-order')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'place-order'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <PlusIcon className="h-4 w-4 shrink-0" />
                <span>Place Order</span>
              </div>
            </button>

            {/* 3. My Orders */}
            <button
              type="button"
              onClick={() => setView('my-orders')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'my-orders'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileTextIcon className="h-4 w-4 shrink-0" />
                <span>My Orders</span>
              </div>
            </button>

            {/* 4. Active Orders */}
            <button
              type="button"
              onClick={() => setView('active-orders')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'active-orders'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <TruckIcon className="h-4 w-4 shrink-0" />
                <span>Active Orders</span>
              </div>
            </button>

            {/* 5. Payments */}
            <button
              type="button"
              onClick={() => setView('payments')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'payments'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCardIcon className="h-4 w-4 shrink-0" />
                <span>Payments</span>
              </div>
            </button>

            {/* 6. Documents */}
            <button
              type="button"
              onClick={() => setView('documents')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'documents'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheetIcon className="h-4 w-4 shrink-0" />
                <span>Documents</span>
              </div>
            </button>

            {/* 7. Notifications */}
            <button
              type="button"
              onClick={() => setView('notifications')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'notifications'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BellIcon className="h-4 w-4 shrink-0" />
                <span>Notifications</span>
              </div>
              <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                currentView === 'notifications' ? 'bg-ink-950 text-gold' : 'bg-[#18181f] text-neutral-400'
              }`}>
                3
              </span>
            </button>

            {/* 8. Settings */}
            <button
              type="button"
              onClick={() => setView('settings')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-4 w-4 shrink-0" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4 border-t border-[#1a1a20]">
          {/* Need Help Card */}
          <button
            type="button"
            onClick={() => setIsSupportModalOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-[#22222a] bg-[#121217] p-3 text-left transition-all hover:border-gold/40 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                <HeadphonesIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Need Help?</p>
                <p className="text-[10px] text-neutral-500">Contact Support</p>
              </div>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-neutral-500 group-hover:text-gold transition-colors" />
          </button>

          <div className="px-2 text-[10px] text-neutral-600 space-y-0.5">
            <p className="font-semibold text-neutral-500">TRANSIA v1.0</p>
            <p>Stronger Together</p>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE / CONTENT AREA */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1c1c22] bg-[#09090c]/95 backdrop-blur px-4 sm:px-8">
          
          {/* Left Header Badges */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden rounded-lg p-1.5 text-neutral-400 hover:text-white"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            {/* Buyer Mode Badge */}
            <div className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-extrabold text-gold uppercase tracking-wider">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              <span>Buyer Mode</span>
            </div>

            {/* Location Pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#22222a] bg-[#141419] px-3 py-1 text-xs text-neutral-300">
              <MapPinIcon className="h-3.5 w-3.5 text-neutral-500" />
              <span>{buyer.district || 'Palakkad'}, Kerala</span>
              <ChevronDownIcon className="h-3 w-3 text-neutral-500 ml-1" />
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setView('notifications')}
              className="relative rounded-full p-2 text-neutral-400 hover:bg-[#16161c] hover:text-white transition-colors cursor-pointer"
            >
              <BellIcon className="h-4 w-4" />
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold font-black text-ink-950 text-[9px]">
                3
              </span>
            </button>

            {/* Buyer Profile Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setBuyerMenuOpen(!buyerMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-[#22222a] bg-[#141419] px-3 py-1.5 text-xs font-bold text-white hover:border-gold/40 transition-all cursor-pointer"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-ink-950 font-black text-[11px]">
                  SB
                </span>
                <span className="truncate max-w-[160px]">{buyer.name}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-neutral-400" />
              </button>

              {/* Buyer switch dropdown */}
              <AnimatePresence>
                {buyerMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2 w-64 rounded-xl border border-ink-700 bg-ink-950 p-2 shadow-2xl z-50 space-y-1"
                  >
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-neutral-500">
                      Switch Buyer Profile
                    </div>
                    {unloadingParties.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBuyerId(b.id);
                          setBuyerMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left cursor-pointer ${
                          buyerId === b.id ? 'bg-gold text-ink-950 font-bold' : 'text-neutral-300 hover:bg-ink-900'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        <span className="text-[10px] opacity-75">{b.district}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Return to Dashboard (if owner) */}
            {isOwner && (
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold hover:bg-gold hover:text-ink-950 transition-all"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                <span>Return to Dashboard</span>
              </Link>
            )}

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#22222a] bg-[#141419] px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-red-400 hover:border-red-500/40 transition-all cursor-pointer"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                onClick={(e) => e.stopPropagation()}
                className="h-full w-64 bg-[#09090c] p-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-ink-800">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold font-black text-ink-950">
                        TA
                      </div>
                      <span className="font-bold text-white">Buyer Portal</span>
                    </div>
                    <button onClick={() => setMobileSidebarOpen(false)}>
                      <XIcon className="h-5 w-5 text-neutral-400" />
                    </button>
                  </div>
                  <nav className="space-y-1">
                    {['dashboard', 'place-order', 'my-orders', 'active-orders', 'payments', 'documents', 'notifications', 'settings'].map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`w-full text-left capitalize px-3 py-2 text-xs font-bold rounded-lg ${
                          currentView === v ? 'bg-gold text-ink-950' : 'text-neutral-300'
                        }`}
                      >
                        {v.replace('-', ' ')}
                      </button>
                    ))}
                  </nav>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order success notification alert */}
        <AnimatePresence>
          {orderSuccessMsg && (
            <div className="px-4 sm:px-8 pt-4">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs text-green-300"
              >
                <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                <span>{orderSuccessMsg}</span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* 3. MAIN BODY VIEWS */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

          {/* ------------------------------------------------------- */}
          {/* VIEW: DASHBOARD (EXACT MATCH OF USER SCREENSHOT) */}
          {/* ------------------------------------------------------- */}
          {currentView === 'dashboard' && (
            <motion.div
              key="view-dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Top Hero Welcome Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 shadow-lg">
                <div className="space-y-1">
                  <p className="text-xs text-neutral-400 font-medium">Welcome back,</p>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    {buyer.name}
                  </h2>
                  <p className="text-xs text-neutral-400 max-w-xl">
                    Place new orders, track deliveries and manage your purchases – all in one place.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Your Location Box */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#22222a] bg-[#16161d] px-4 py-2.5">
                    <MapPinIcon className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-[10px] text-neutral-500 font-medium">Your Location</p>
                      <p className="text-xs font-bold text-white">{buyer.district || 'Palakkad'}, Kerala</p>
                    </div>
                  </div>

                  {/* Account Status Box */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#22222a] bg-[#16161d] px-4 py-2.5">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-[10px] text-neutral-500 font-medium">Account Status</p>
                      <p className="text-xs font-bold text-emerald-400">Active Buyer</p>
                      <p className="text-[9px] text-neutral-500">Verified &amp; Ready</p>
                    </div>
                  </div>

                  {/* Place New Order Gold Button */}
                  <button
                    type="button"
                    onClick={() => setIsPlaceOrderModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-xs font-black text-ink-950 shadow-lg hover:bg-gold-400 active:scale-95 transition-all cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4 text-ink-950" />
                    <span>Place New Order</span>
                  </button>
                </div>
              </div>

              {/* 4 Summary Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Active Orders */}
                <button
                  type="button"
                  onClick={() => setView('active-orders')}
                  className="flex items-center justify-between rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 text-left transition-all hover:border-gold/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                      <FileTextIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 font-medium">Active Orders</p>
                      <p className="text-lg font-black text-white">{metrics.activeOrdersCount}</p>
                      <p className="text-[10px] text-neutral-500">Orders in progress</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-neutral-600 group-hover:text-gold transition-colors" />
                </button>

                {/* 2. Total Orders */}
                <button
                  type="button"
                  onClick={() => setView('my-orders')}
                  className="flex items-center justify-between rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 text-left transition-all hover:border-gold/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                      <TruckIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 font-medium">Total Orders</p>
                      <p className="text-lg font-black text-white">{metrics.totalOrdersCount}</p>
                      <p className="text-[10px] text-neutral-500">All time orders</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-neutral-600 group-hover:text-gold transition-colors" />
                </button>

                {/* 3. Pending Payment */}
                <button
                  type="button"
                  onClick={() => setView('payments')}
                  className="flex items-center justify-between rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 text-left transition-all hover:border-gold/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                      <CreditCardIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 font-medium">Pending Payment</p>
                      <p className="text-lg font-black text-white">{formatINR(metrics.pendingPayment)}</p>
                      <p className="text-[10px] text-neutral-500">All payments cleared</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-neutral-600 group-hover:text-gold transition-colors" />
                </button>

                {/* 4. Total Purchase Value */}
                <button
                  type="button"
                  onClick={() => setView('payments')}
                  className="flex items-center justify-between rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 text-left transition-all hover:border-gold/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                      <BarChart3Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 font-medium">Total Purchase Value</p>
                      <p className="text-lg font-black text-white font-mono">{formatINR(metrics.totalPurchaseValue)}</p>
                      <p className="text-[10px] text-neutral-500">Across {metrics.totalOrdersCount} orders</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-neutral-600 group-hover:text-gold transition-colors" />
                </button>

              </div>

              {/* Middle Row: Left 7 Columns / Right 5 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* LEFT SIDE (7 columns wide): Active Orders + Recent Orders */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Card 1: Active Orders */}
                  <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TruckIcon className="h-4 w-4 text-gold" />
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Active Orders</h3>
                          <p className="text-[11px] text-neutral-400">Track your ongoing orders and delivery status</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setView('active-orders')}
                        className="text-xs font-bold text-gold hover:underline cursor-pointer"
                      >
                        View All →
                      </button>
                    </div>

                    {/* Active Order Item 1 */}
                    <div 
                      onClick={() => setSelectedOrderForDetail(myOrders[0] || null)}
                      className="rounded-xl border border-[#1e1e26] bg-[#16161d] p-4 space-y-3.5 hover:border-gold/30 transition-all cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-extrabold text-white font-mono">ORD-2052</h4>
                          <p className="text-[11px] text-neutral-400">2x2 • 40mm • 2440 sqft / 2x2 • 40mm • 800 sqft</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                            <CalendarIcon className="h-3.5 w-3.5 text-neutral-500" />
                            <span>Estimated Delivery: <strong className="text-white">25 Sep 2026</strong></span>
                          </div>
                          <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
                            In Progress
                          </span>
                          <ChevronRightIcon className="h-4 w-4 text-neutral-500" />
                        </div>
                      </div>

                      {/* 4-Node Stepper */}
                      <div className="pt-2 pb-1">
                        <div className="relative flex items-center justify-between">
                          <div className="absolute left-6 right-6 top-2 h-0.5 bg-[#252530] -z-0">
                            <div className="h-full bg-emerald-500 w-1/3" />
                          </div>

                          <div className="flex flex-col items-center text-center z-10">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-ink-950">
                              <span className="h-1.5 w-1.5 rounded-full bg-ink-950" />
                            </div>
                            <span className="text-[10px] text-neutral-300 font-semibold mt-1">Confirmed</span>
                          </div>

                          <div className="flex flex-col items-center text-center z-10">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-500 bg-ink-950">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold mt-1">Processing</span>
                          </div>

                          <div className="flex flex-col items-center text-center z-10">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-700 bg-ink-950">
                              <span className="h-1 w-1 rounded-full bg-neutral-600" />
                            </div>
                            <span className="text-[10px] text-neutral-500 mt-1">In Transit</span>
                          </div>

                          <div className="flex flex-col items-center text-center z-10">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-700 bg-ink-950">
                              <span className="h-1 w-1 rounded-full bg-neutral-600" />
                            </div>
                            <span className="text-[10px] text-neutral-500 mt-1">Delivered</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Order Item 2 */}
                    <div 
                      onClick={() => setSelectedOrderForDetail(myOrders[1] || null)}
                      className="rounded-xl border border-[#1e1e26] bg-[#16161d] p-4 space-y-3.5 hover:border-gold/30 transition-all cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-extrabold text-white font-mono">ORD-2052</h4>
                          <p className="text-[11px] text-neutral-400">3x3 • 50mm • 6300 sqft</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                            <CalendarIcon className="h-3.5 w-3.5 text-neutral-500" />
                            <span>Estimated Delivery: <strong className="text-white">20 Sep 2026</strong></span>
                          </div>
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            In Transit
                          </span>
                          <ChevronRightIcon className="h-4 w-4 text-neutral-500" />
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="pt-2 pb-1">
                        <div className="relative flex items-center justify-between">
                          <div className="absolute left-6 right-6 top-2 h-0.5 bg-[#252530] -z-0">
                            <div className="h-full bg-emerald-500 w-2/3" />
                          </div>

                          <div className="flex flex-col items-center text-center z-10">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-ink-950">
                              <span className="h-1.5 w-1.5 rounded-full bg-ink-950" />
                            </div>
                            <span className="text-[10px] text-neutral-300 font-semibold mt-1">Confirmed</span>
                          </div>

                          <div className="flex flex-col items-center text-center z-10">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-500 bg-ink-950">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold mt-1">In Transit</span>
                          </div>

                          <div className="flex flex-col items-center text-center z-10">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-700 bg-ink-950">
                              <span className="h-1 w-1 rounded-full bg-neutral-600" />
                            </div>
                            <span className="text-[10px] text-neutral-500 mt-1">Delivered</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Card 2: Recent Orders Table */}
                  <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileTextIcon className="h-4 w-4 text-gold" />
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Recent Orders</h3>
                          <p className="text-[11px] text-neutral-400">Your recent purchase history</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setView('my-orders')}
                        className="text-xs font-bold text-gold hover:underline cursor-pointer"
                      >
                        View All Orders →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#22222a] text-neutral-500 text-[10px] uppercase font-bold">
                            <th className="pb-2.5">Order ID</th>
                            <th className="pb-2.5">Stone Specification</th>
                            <th className="pb-2.5">Quantity / Sqft</th>
                            <th className="pb-2.5">Amount (₹)</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5">Date</th>
                            <th className="pb-2.5 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { id: 'ORD-2052', spec: '2x2 • 40mm / 2x2 • 40mm', qty: '2440 sqft / 800 sqft', amount: '₹1,23,120', status: 'Confirmed', date: 'about 1 month ago' },
                            { id: 'ORD-2052', spec: '3x3 • 50mm', qty: '6300 sqft', amount: '₹2,45,700', status: 'Paid', date: 'about 1 month ago' },
                            { id: 'ORD-2052', spec: '2x2 • 30mm', qty: '800 sqft', amount: '₹27,200', status: 'Paid', date: 'about 2 months ago' },
                            { id: 'ORD-2052', spec: '3x3 • 50mm', qty: '8100 sqft', amount: '₹3,15,900', status: 'Paid', date: 'about 2 months ago' },
                            { id: 'ORD-2053', spec: '3x3 • 50mm', qty: '3978 sqft', amount: '₹1,55,142', status: 'Paid', date: '2 months ago' },
                            { id: 'ORD-2052', spec: '2x2 • 40mm / 2x2 • 40mm / 2x2 • 40mm', qty: '1600 sqft / 1600 sqft / 80 sqft', amount: '₹1,24,640', status: 'Paid', date: '2 months ago' }
                          ].map((row, idx) => (
                            <tr key={idx} className="border-b border-[#1c1c24] hover:bg-[#16161f] transition-colors">
                              <td className="py-3 font-bold text-white font-mono">{row.id}</td>
                              <td className="py-3 text-neutral-300">{row.spec}</td>
                              <td className="py-3 text-neutral-400 font-mono">{row.qty}</td>
                              <td className="py-3 font-bold text-white font-mono">{row.amount}</td>
                              <td className="py-3">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  row.status === 'Confirmed'
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-3 text-neutral-500 text-[11px]">{row.date}</td>
                              <td className="py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDetail(myOrders[idx % myOrders.length] || null)}
                                  className="rounded-lg border border-gold/40 px-2.5 py-1 text-[10px] font-bold text-gold hover:bg-gold hover:text-ink-950 transition-all cursor-pointer"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* RIGHT SIDE (5 columns wide): Quick Actions + Payments & Outstanding + Notifications */}
                <div className="lg:col-span-5 space-y-5">
                  
                  {/* Card 1: Quick Actions (2x2 Grid) */}
                  <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4 text-gold" />
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Quick Actions</h3>
                        <p className="text-[11px] text-neutral-400">Common tasks for buyers</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Tile 1: Place Order */}
                      <button
                        type="button"
                        onClick={() => setIsPlaceOrderModalOpen(true)}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-[#22222a] bg-[#16161d] text-left hover:border-gold/40 transition-all cursor-pointer group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                          <PlusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">Place Order</p>
                          <p className="text-[10px] text-neutral-500">Add new order</p>
                        </div>
                      </button>

                      {/* Tile 2: Track Order */}
                      <button
                        type="button"
                        onClick={() => setView('active-orders')}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-[#22222a] bg-[#16161d] text-left hover:border-gold/40 transition-all cursor-pointer group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                          <TruckIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">Track Order</p>
                          <p className="text-[10px] text-neutral-500">Check live status</p>
                        </div>
                      </button>

                      {/* Tile 3: Download Invoice */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForInvoice(myOrders[0] || null)}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-[#22222a] bg-[#16161d] text-left hover:border-gold/40 transition-all cursor-pointer group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                          <FileTextIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">Download Invoice</p>
                          <p className="text-[10px] text-neutral-500">Get invoices &amp; bills</p>
                        </div>
                      </button>

                      {/* Tile 4: Contact Support */}
                      <button
                        type="button"
                        onClick={() => setIsSupportModalOpen(true)}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-[#22222a] bg-[#16161d] text-left hover:border-gold/40 transition-all cursor-pointer group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                          <HeadphonesIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">Contact Support</p>
                          <p className="text-[10px] text-neutral-500">Get assistance</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Payments & Outstanding */}
                  <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="h-4 w-4 text-gold" />
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Payments &amp; Outstanding</h3>
                          <p className="text-[11px] text-neutral-400">Overview of your payments</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setView('payments')}
                        className="text-xs font-bold text-gold hover:underline cursor-pointer"
                      >
                        View Details →
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="rounded-xl border border-[#1e1e26] bg-[#16161d] p-3.5 space-y-1">
                        <span className="text-[10px] text-neutral-400 font-medium">Total Paid</span>
                        <p className="text-sm font-black text-emerald-400 font-mono">₹6,59,002</p>
                      </div>

                      <div className="rounded-xl border border-[#1e1e26] bg-[#16161d] p-3.5 space-y-1">
                        <span className="text-[10px] text-neutral-400 font-medium">Outstanding</span>
                        <p className="text-sm font-black text-gold font-mono">₹0</p>
                      </div>

                      <div className="rounded-xl border border-[#1e1e26] bg-[#16161d] p-3.5 space-y-1">
                        <span className="text-[10px] text-neutral-400 font-medium">Pending Orders</span>
                        <p className="text-sm font-black text-white font-mono">0</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Notifications & Tasks */}
                  <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BellIcon className="h-4 w-4 text-gold" />
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Notifications &amp; Tasks</h3>
                          <p className="text-[11px] text-neutral-400">Latest updates and important alerts</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setView('notifications')}
                        className="text-xs font-bold text-gold hover:underline cursor-pointer"
                      >
                        View All →
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#1e1e26] bg-[#16161d] hover:border-gold/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <div>
                            <p className="text-xs font-bold text-white">Order ORD-2052 is in transit</p>
                            <p className="text-[10px] text-neutral-400">Your order is on the way to delivery</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">2h ago</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#1e1e26] bg-[#16161d] hover:border-gold/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2 w-2 rounded-full bg-blue-400" />
                          <div>
                            <p className="text-xs font-bold text-white">Invoice available for ORD-2052</p>
                            <p className="text-[10px] text-neutral-400">Download your invoice</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">1 day ago</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#1e1e26] bg-[#16161d] hover:border-gold/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2 w-2 rounded-full bg-gold" />
                          <div>
                            <p className="text-xs font-bold text-white">New rates available for Palakkad district</p>
                            <p className="text-[10px] text-neutral-400">Check latest stone rates</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">3 days ago</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: PLACE ORDER */}
          {/* ------------------------------------------------------- */}
          {currentView === 'place-order' && (
            <motion.div
              key="view-place-order"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <PlusIcon className="h-5 w-5 text-gold" />
                    Place New Stone Order
                  </h2>
                  <p className="text-xs text-neutral-400">Select rough stone specifications, quantities, and delivery district</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#22222a] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gold">Order Line Items</h3>
                  <button
                    type="button"
                    onClick={handleAddDraftLine}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gold/15 border border-gold/30 px-3 py-1.5 text-xs font-bold text-gold hover:bg-gold hover:text-ink-950 transition-all cursor-pointer"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add Another Specification
                  </button>
                </div>

                <div className="space-y-4">
                  {computedDraftLines.map((line, idx) => (
                    <div key={line.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl border border-[#1e1e26] bg-[#16161d] items-center">
                      <div className="md:col-span-5 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-neutral-500">Specification</label>
                        <select
                          value={line.specIndex}
                          onChange={(e) => handleUpdateDraftLine(line.key, { specIndex: Number(e.target.value) })}
                          className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                        >
                          {sellableSpecs.map((spec, sIdx) => (
                            <option key={sIdx} value={sIdx}>
                              {spec.size} • {spec.thickness} • {spec.finish}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-neutral-500">Pieces Count</label>
                        <input
                          type="number"
                          min={1}
                          value={line.pieces}
                          onChange={(e) => handleUpdateDraftLine(line.key, { pieces: Number(e.target.value) })}
                          className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-neutral-500">Sqft / Amount</label>
                        <div className="text-xs">
                          <p className="font-mono text-neutral-300 font-bold">{line.totalSqft} SQFT @ ₹{line.rate}/sqft</p>
                          <p className="font-mono text-gold font-black">{formatINR(line.amount)}</p>
                        </div>
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        {computedDraftLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftLine(line.key)}
                            className="p-2 text-neutral-500 hover:text-red-400"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between border-t border-[#22222a] pt-4 gap-4">
                  <div>
                    <span className="text-xs text-neutral-400">Total Order Estimate:</span>
                    <p className="text-xl font-black text-gold font-mono">{formatINR(draftTotalAmount)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubmitOrder()}
                    className="rounded-xl bg-gold px-6 py-3 text-xs font-black text-ink-950 hover:bg-gold-400 shadow-md cursor-pointer transition-all"
                  >
                    Confirm &amp; Place Order
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: MY ORDERS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'my-orders' && (
            <motion.div
              key="view-my-orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between border-b border-ink-800 pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5 text-gold" />
                    All Purchase Orders
                  </h2>
                  <p className="text-xs text-neutral-400">Review status, stone specifications, and payment balances for all orders</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search order ID..."
                      className="rounded-xl border border-ink-700 bg-[#121217] py-2 pl-9 pr-3 text-xs text-white focus:border-gold focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPlaceOrderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-black text-ink-950 hover:bg-gold-400 shadow-md cursor-pointer"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Place Order
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#22222a] text-neutral-500 text-[10px] uppercase font-bold">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Stone Specifications</th>
                        <th className="pb-3">Total SQFT</th>
                        <th className="pb-3">Total Amount</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Placed Date</th>
                        <th className="pb-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => {
                        const totalSqft = (o.lines || []).reduce((s, l) => s + (l.sqftPerPiece * l.pieces), 0);
                        const totalVal = (o.lines || []).reduce((s, l) => s + (l.sqftPerPiece * l.pieces * l.ratePerSqft), 0);
                        return (
                          <tr key={o.id} className="border-b border-[#1c1c24] hover:bg-[#16161f] transition-colors">
                            <td className="py-3.5 font-bold text-white font-mono">{o.code}</td>
                            <td className="py-3.5 text-neutral-300">
                              {(o.lines || []).map(l => `${l.size} ${l.thickness}`).join(' / ') || 'Rough Stone'}
                            </td>
                            <td className="py-3.5 font-mono text-neutral-400">{totalSqft} SQFT</td>
                            <td className="py-3.5 font-bold text-white font-mono">{formatINR(totalVal)}</td>
                            <td className="py-3.5">
                              <span className="rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-neutral-500 text-[11px]">{new Date(o.placedAt).toLocaleDateString()}</td>
                            <td className="py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForDetail(o)}
                                className="rounded-lg border border-gold/40 px-2.5 py-1 text-[10px] font-bold text-gold hover:bg-gold hover:text-ink-950 transition-all cursor-pointer"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: ACTIVE ORDERS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'active-orders' && (
            <motion.div
              key="view-active-orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <TruckIcon className="h-5 w-5 text-gold" />
                    Live Active Dispatches &amp; Delivery Tracking
                  </h2>
                  <p className="text-xs text-neutral-400">Track delivery checkpoints, assigned lorries, and driver delivery logs</p>
                </div>
              </div>

              <div className="space-y-4">
                {activeOrders.map(o => (
                  <div key={o.id} className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-base font-extrabold text-white font-mono">{o.code}</h4>
                        <p className="text-xs text-neutral-400">
                          {(o.lines || []).map(l => `${l.size} • ${l.thickness} • ${l.sqftPerPiece * l.pieces} sqft`).join(' / ')}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 uppercase">
                        {o.status}
                      </span>
                    </div>

                    <div className="pt-2">
                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-6 right-6 top-2 h-0.5 bg-[#252530] -z-0">
                          <div className="h-full bg-emerald-500 w-1/2" />
                        </div>

                        <div className="flex flex-col items-center text-center z-10">
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-ink-950">
                            <span className="h-1.5 w-1.5 rounded-full bg-ink-950" />
                          </div>
                          <span className="text-[10px] text-neutral-300 font-semibold mt-1">Confirmed</span>
                        </div>

                        <div className="flex flex-col items-center text-center z-10">
                          <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-500 bg-ink-950">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold mt-1">In Transit</span>
                        </div>

                        <div className="flex flex-col items-center text-center z-10">
                          <div className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-700 bg-ink-950">
                            <span className="h-1 w-1 rounded-full bg-neutral-600" />
                          </div>
                          <span className="text-[10px] text-neutral-500 mt-1">Delivered</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: PAYMENTS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'payments' && (
            <motion.div
              key="view-payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5 text-gold" />
                    Payments &amp; Financial Ledger
                  </h2>
                  <p className="text-xs text-neutral-400">Statement of paid deliveries, outstanding dues, and bank transfer info</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-1">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">Total Lifetime Paid</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono">₹6,59,002</p>
                </div>
                <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-1">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">Current Outstanding</span>
                  <p className="text-2xl font-black text-gold font-mono">₹0</p>
                </div>
                <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-1">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">Payment Mode</span>
                  <p className="text-sm font-bold text-white mt-1">RTGS / Bank Transfer / PhonePe</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: DOCUMENTS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'documents' && (
            <motion.div
              key="view-documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <FileSpreadsheetIcon className="h-5 w-5 text-gold" />
                    Buyer Invoices &amp; Delivery Challans
                  </h2>
                  <p className="text-xs text-neutral-400">Download GST tax invoices, delivery challans, and weighbridge slips</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {['ORD-2052', 'ORD-2053'].map((code, idx) => (
                  <div key={idx} className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <FileTextIcon className="h-6 w-6 text-gold" />
                      <span className="text-[10px] text-neutral-500 font-mono">PDF Invoice</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">Tax Invoice - {code}</h4>
                      <p className="text-[11px] text-neutral-400">Billed to: {buyer.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForInvoice(myOrders[0] || null)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1a1a24] border border-[#22222a] py-2 text-xs font-bold text-gold hover:bg-gold hover:text-ink-950 transition-all cursor-pointer"
                    >
                      <DownloadIcon className="h-3.5 w-3.5" /> View &amp; Download Invoice
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: NOTIFICATIONS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'notifications' && (
            <motion.div
              key="view-notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <BellIcon className="h-5 w-5 text-gold" />
                    Buyer Notifications &amp; Alerts
                  </h2>
                  <p className="text-xs text-neutral-400">Order dispatch alerts, billing updates, and district rate notifications</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-3">
                {[
                  { title: 'Order ORD-2052 is in transit', desc: 'Your rough stone shipment has departed the quarry cluster.', time: '2h ago', level: 'success' },
                  { title: 'Tax Invoice Generated', desc: 'Invoice available for order ORD-2052.', time: '1 day ago', level: 'info' },
                  { title: 'Rate Revision Alert', desc: 'Updated selling rates active for Palakkad district.', time: '3 days ago', level: 'warning' }
                ].map((notif, idx) => (
                  <div key={idx} className="flex items-start justify-between p-4 rounded-xl border border-[#1e1e26] bg-[#16161d]">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {notif.level === 'success' && <CheckCircle2Icon className="h-4 w-4 text-emerald-400" />}
                        {notif.level === 'info' && <AlertCircleIcon className="h-4 w-4 text-blue-400" />}
                        {notif.level === 'warning' && <ClockIcon className="h-4 w-4 text-gold" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{notif.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">{notif.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: SETTINGS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'settings' && (
            <motion.div
              key="view-settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-xl"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5 text-gold" />
                    Buyer Account Settings
                  </h2>
                  <p className="text-xs text-neutral-400">Manage depot delivery address and notification preferences</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Buyer Depot Name</label>
                  <input
                    type="text"
                    disabled
                    value={buyer.name}
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Delivery District</label>
                  <input
                    type="text"
                    disabled
                    value={`${buyer.district || 'Palakkad'}, Kerala`}
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MODALS & POPUPS */}
      {/* ========================================================= */}

      {/* Place Order Modal */}
      <AnimatePresence>
        {isPlaceOrderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-xl w-full rounded-2xl border border-[#22222a] bg-[#121217] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#22222a] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <PlusIcon className="h-4 w-4 text-gold" /> Place Stone Purchase Order
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlaceOrderModalOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-[#16161d] p-3 text-xs text-neutral-400 space-y-1">
                  <p>Delivering to: <strong className="text-white">{buyer.name} ({buyer.district})</strong></p>
                  <p className="text-[10px] text-neutral-500">Rates auto-adjusted for {buyer.district} district delivery schedule.</p>
                </div>

                <div className="space-y-3">
                  {computedDraftLines.map((line) => (
                    <div key={line.key} className="rounded-xl border border-[#1e1e26] bg-[#16161d] p-3.5 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-neutral-500">Stone Specification</label>
                        <select
                          value={line.specIndex}
                          onChange={(e) => handleUpdateDraftLine(line.key, { specIndex: Number(e.target.value) })}
                          className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                        >
                          {sellableSpecs.map((spec, sIdx) => (
                            <option key={sIdx} value={sIdx}>
                              {spec.size} • {spec.thickness} • {spec.finish}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-neutral-500">Pieces</label>
                          <input
                            type="number"
                            min={1}
                            value={line.pieces}
                            onChange={(e) => handleUpdateDraftLine(line.key, { pieces: Number(e.target.value) })}
                            className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] uppercase font-bold text-neutral-500">Estimated Cost</span>
                          <p className="text-xs font-black text-gold font-mono">{formatINR(line.amount)}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">{line.totalSqft} SQFT</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-[#22222a] pt-3">
                  <div>
                    <span className="text-[11px] text-neutral-400">Total Order Amount:</span>
                    <p className="text-lg font-black text-gold font-mono">{formatINR(draftTotalAmount)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaceOrderModalOpen(false)}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitOrder()}
                      className="rounded-xl bg-gold px-5 py-2.5 text-xs font-black text-ink-950 hover:bg-gold-400 shadow-md cursor-pointer"
                    >
                      Submit Order
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrderForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-lg w-full rounded-2xl border border-[#22222a] bg-[#121217] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#22222a] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm font-mono">
                  <FileTextIcon className="h-4 w-4 text-gold" /> Order Breakdown: {selectedOrderForDetail.code}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#16161d]">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Status</span>
                    <p className="font-bold text-emerald-400 uppercase">{selectedOrderForDetail.status}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#16161d]">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Placed Date</span>
                    <p className="font-bold text-white">{new Date(selectedOrderForDetail.placedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#1e1e26] bg-[#16161d] p-3 space-y-2">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Specifications</span>
                  {(selectedOrderForDetail.lines || []).map((l, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-[#22222a] pb-1.5 last:border-0">
                      <div>
                        <p className="font-bold text-white">{l.size} • {l.thickness} • {l.finish}</p>
                        <p className="text-[10px] text-neutral-400">{l.pieces} pieces ({l.sqftPerPiece * l.pieces} sqft)</p>
                      </div>
                      <span className="font-mono text-gold font-bold">{formatINR(l.sqftPerPiece * l.pieces * l.ratePerSqft)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="rounded-xl bg-ink-800 px-5 py-2 text-xs font-bold text-white hover:bg-ink-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedOrderForInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-xl w-full rounded-2xl border border-[#22222a] bg-[#121217] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#22222a] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <DownloadIcon className="h-4 w-4 text-gold" /> Tax Invoice: {selectedOrderForInvoice.code}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white text-ink-950 text-xs space-y-4 shadow-inner">
                <div className="flex justify-between border-b pb-3">
                  <div>
                    <h3 className="font-black text-sm uppercase">TRANSIA LOGISTICS</h3>
                    <p className="text-[10px] text-neutral-600">Rough Stone Transport &amp; Mining Yard</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono">INV-{selectedOrderForInvoice.code}</p>
                    <p className="text-[10px] text-neutral-600">{new Date(selectedOrderForInvoice.placedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="font-bold">Billed To:</p>
                  <p>{buyer.name}</p>
                  <p className="text-neutral-600">{buyer.district}, Kerala</p>
                </div>

                <div className="border-t pt-2 space-y-1">
                  {(selectedOrderForInvoice.lines || []).map((l, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{l.size} {l.thickness} ({l.pieces} pcs)</span>
                      <span className="font-mono font-bold">{formatINR(l.sqftPerPiece * l.pieces * l.ratePerSqft)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-400"
                >
                  Print / Save PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Support Modal */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-md w-full rounded-2xl border border-[#22222a] bg-[#121217] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#22222a] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <HeadphonesIcon className="h-4 w-4 text-gold" /> Buyer Concierge Support
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <a
                  href="tel:+919988776655"
                  className="flex items-center justify-between rounded-xl border border-[#1e1e26] bg-[#171720] p-4 hover:border-gold/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <PhoneCallIcon className="h-5 w-5 text-gold" />
                    <div>
                      <p className="text-xs font-bold text-white">Central Dispatch Desk</p>
                      <p className="text-[11px] text-neutral-400">+91 99887 76655</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gold">Call Now</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}