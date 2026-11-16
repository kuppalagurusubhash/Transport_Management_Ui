import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TruckIcon,
  UserIcon,
  MapPinIcon,
  ActivityIcon,
  CarIcon,
  BoxIcon,
  ArrowRightIcon,
  CheckCircle2Icon
} from 'lucide-react';
import { showcaseFleetData, type ShowcaseFleetItem } from '../../data/fleetShowcase';
import { useOrders } from '../../store/OrdersContext';

interface FleetShowcaseCarouselProps {
  onSelectLorry?: (item: ShowcaseFleetItem) => void;
}

export function FleetShowcaseCarousel({ onSelectLorry }: FleetShowcaseCarouselProps) {
  const { lorries, drivers, trips, unloadingParties, loadingParties } = useOrders();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Sync directly with live database lorries
  const enrichedFleet = useMemo(() => {
    const activeLorries = lorries.filter((l) => l.status !== 'sold');
    if (activeLorries.length > 0) {
      return activeLorries.map((l, idx) => {
        const driver = drivers.find((d) => d.id === l.driverId);
        const activeTrip = trips.find(
          (t) =>
            t.lorryId === l.id &&
            (t.status === 'in-transit' || t.status === 'loading' || (t.status as string) === 'dispatched')
        );
        const buyer = activeTrip ? unloadingParties.find((u) => u.id === activeTrip.unloadingPartyId) : null;

        let statusLabel = 'Available';
        let statusColor = '#6366f1';

        if (l.status === 'active' || (l.status as string) === 'on_trip' || activeTrip) {
          statusLabel = 'On Trip';
          statusColor = '#10b981';
        } else if (l.status === 'idle') {
          statusLabel = 'Idle';
          statusColor = '#06b6d4';
        } else if (l.status === 'maintenance') {
          statusLabel = 'Under Maintenance';
          statusColor = '#f59e0b';
        }

        const route = buyer
          ? `Kadapa → ${buyer.district || buyer.name}`
          : (l.location || 'Depot — Ramapuram');

        return {
          id: l.id || String(idx + 1),
          vehicleNumber: l.plate,
          plate: l.plate,
          model: 'Ashok Leyland 4825',
          status: l.status,
          statusLabel,
          statusColor,
          image: '/fleet/ashok_leyland_hd.png?v=angle90_clean',
          sideImage: '/fleet/ashok_leyland_hd.png?v=angle90_clean',
          driver: driver?.name || (l.plate.includes('3666') ? 'subhash' : 'Ramesh'),
          route,
          capacity: `${(l.capacitySqft || 0).toLocaleString('en-IN')} sqft`
        };
      });
    }

    return showcaseFleetData;
  }, [lorries, drivers, trips, unloadingParties]);

  const len = enrichedFleet.length;
  const currentVehicle = enrichedFleet[activeIndex] || enrichedFleet[0] || showcaseFleetData[0];

  // Active / Assigned Trip for current vehicle (only matches active in-progress trips)
  const activeVehicleTrip = useMemo(() => {
    const cleanPlate = (currentVehicle.plate || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const matchedLorry = lorries.find(
      (l) => (l.plate || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanPlate
    );
    const lorryId = matchedLorry?.id || currentVehicle.id;

    const activeStages = [
      'loading',
      'loaded',
      'in-transit',
      'dispatched',
      'arrived_kerala',
      'stone_unloading',
      'return_decision_pending',
      'return_sand_loading',
      'return_loaded',
      'returning',
      'arrived_lt_factory',
      'sand_unloaded',
      'direct_return',
      'final_audit_pending'
    ];

    // Look ONLY for active in-progress trip
    const active = trips.find(
      (t) =>
        (t.lorryId === lorryId || t.lorryId === currentVehicle.plate) &&
        activeStages.includes(t.status as string)
    );
    return active || null;
  }, [currentVehicle, lorries, trips]);

  // Comprehensive Stone Load Details
  const loadSummary = useMemo(() => {
    if (!activeVehicleTrip) return null;
    const buyer = unloadingParties.find((up) => up.id === activeVehicleTrip.unloadingPartyId);
    const firstLine = activeVehicleTrip.stoneLines?.[0];
    const quarry = loadingParties.find((lp) => lp.id === firstLine?.loadingPartyId);

    const totalPieces = (activeVehicleTrip.stoneLines || []).reduce(
      (sum, l) => sum + (Number(l.pieces) || 0),
      0
    );
    const totalSqft = (activeVehicleTrip.stoneLines || []).reduce(
      (sum, l) => sum + (Number(l.sqftPerPiece) || 0) * (Number(l.pieces) || 0),
      0
    );
    const hamali = (activeVehicleTrip.workerPayments || []).reduce(
      (sum, w) => sum + (Number(w.amount) || 0),
      0
    );
    const fuelExpense = (activeVehicleTrip.expenses || []).reduce((sum, e) => {
      const lbl = (e.label || '').toLowerCase();
      const cat = e.category || '';
      if (
        cat === 'fuel' ||
        lbl.includes('fuel') ||
        lbl.includes('diesel') ||
        lbl.includes('diseal') ||
        lbl.includes('disel') ||
        lbl.includes('deisel')
      ) {
        return sum + (Number(e.amount) || 0);
      }
      return sum;
    }, 0);

    let statusLabel = 'Loading at Yard';
    let statusColor = '#f59e0b';
    if (activeVehicleTrip.status === 'in-transit' || (activeVehicleTrip.status as string) === 'dispatched') {
      statusLabel = 'In Transit';
      statusColor = '#10b981';
    } else if (activeVehicleTrip.status === 'delivered') {
      statusLabel = 'Delivered';
      statusColor = '#3b82f6';
    }

    return {
      tripCode: activeVehicleTrip.code,
      tripDate: activeVehicleTrip.date,
      statusLabel,
      statusColor,
      origin: quarry?.name || quarry?.location || activeVehicleTrip.origin || 'Ramapuram Quarry',
      destination: buyer?.name
        ? `${buyer.name} (${buyer.district || 'Kerala'})`
        : (activeVehicleTrip.unloadingPartyId || 'Palakkad Yard'),
      totalPieces,
      totalSqft,
      stoneLines: activeVehicleTrip.stoneLines || [],
      hamali,
      fuelExpense
    };
  }, [activeVehicleTrip, unloadingParties, loadingParties]);

  const selectIndex = useCallback(
    (idx: number) => {
      const newIdx = (idx + len) % len;
      setActiveIndex(newIdx);
      if (onSelectLorry && enrichedFleet[newIdx]) {
        onSelectLorry(enrichedFleet[newIdx]);
      }
    },
    [len, onSelectLorry, enrichedFleet]
  );

  // Automatically inform parent whenever the active vehicle changes or on initial mount
  useEffect(() => {
    if (onSelectLorry && currentVehicle) {
      onSelectLorry(currentVehicle);
    }
  }, [activeIndex, currentVehicle?.plate, onSelectLorry]);

  const handlePrev = useCallback(() => {
    selectIndex(activeIndex - 1);
  }, [activeIndex, selectIndex]);

  const handleNext = useCallback(() => {
    selectIndex(activeIndex + 1);
  }, [activeIndex, selectIndex]);

  // Keyboard navigation for carousel (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Mobile Swipe for Carousel Navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart !== null) {
      const touchEnd = e.changedTouches[0].clientX;
      const totalDiff = touchStart - touchEnd;
      if (totalDiff > 45) {
        handleNext();
      } else if (totalDiff < -45) {
        handlePrev();
      }
    }
    setTouchStart(null);
  };

        return (
        <section
          aria-label="Our Fleet Showroom"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative isolate overflow-hidden rounded-2xl border border-[#F5B82E]/25 bg-gradient-to-b from-[#0F141A]/90 via-[#0B0F14]/90 to-[#07090C]/95 shadow-[0_10px_35px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
        >
          {/* 1. Compact Header Bar */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-3.5 pt-2.5 pb-1 sm:px-5 sm:pt-3 sm:pb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B82E] shadow-[0_0_8px_#F5B82E]" />
                <span className="text-[9.5px] font-black tracking-[0.2em] text-[#F5B82E] uppercase">
                  OUR FLEET
                </span>
              </div>
              <span className="text-white/15 text-xs shrink-0">|</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-xs font-black tracking-wider text-white truncate">
                  {currentVehicle.vehicleNumber}
                </span>
                <span className="hidden sm:inline-block rounded-md bg-white/[0.07] border border-white/10 px-1.5 py-0.5 text-[9.5px] font-medium text-neutral-300 truncate">
                  {currentVehicle.model}
                </span>
              </div>
            </div>

            {/* Status Pill & Assigned Trip Badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-white/[0.05] border border-white/10 backdrop-blur-xl">
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: currentVehicle.statusColor }}
                />
                <span className="text-[10px] font-bold" style={{ color: currentVehicle.statusColor }}>
                  {currentVehicle.statusLabel}
                </span>
              </div>

              {loadSummary?.tripCode && (
                <div className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-[#F5B82E]/10 border border-[#F5B82E]/30 text-[#F5B82E] text-[10px] font-bold">
                  <BoxIcon className="h-2.5 w-2.5" />
                  <span>{loadSummary.tripCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Sleek Compact Center Stage: Reduced Lorry Image Size */}
          <div className="relative min-h-[115px] sm:min-h-[140px] md:min-h-[155px] w-full overflow-hidden select-none flex flex-col items-center justify-center px-11 sm:px-14 py-1.5 sm:py-2">
            {/* Layer 1: Dark Cinematic Mountain Pass Sunset Backdrop */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <img
                src="/fleet_stage_backdrop.jpg"
                alt="Scenic mountain pass highway at sunset"
                className="h-full w-full object-cover object-bottom filter brightness-[0.42] contrast-[1.15]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/fleet_showcase_bg.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090C] via-[#07090C]/65 to-[#07090C]/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07090C]/90 via-transparent to-[#07090C]/90" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-[480px] bg-[radial-gradient(ellipse_at_top,rgba(245,184,46,0.16)_0%,transparent_70%)] blur-2xl" />
            </div>

            {/* Center Stage Vehicle */}
            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentVehicle.vehicleNumber}
                  initial={{ opacity: 0, scale: 0.98, x: 16 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98, x: -16 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full flex flex-col items-center justify-center"
                >
                  {/* Reduced-Size HD Vehicle Side Profile */}
                  <div className="relative w-full flex items-center justify-center py-0.5">
                    <img
                      src={currentVehicle.sideImage || currentVehicle.image}
                      alt={`Sri Sai Baba Transport Lorry - ${currentVehicle.vehicleNumber}`}
                      className="max-h-[82px] sm:max-h-[105px] md:max-h-[120px] w-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)] select-none transition-transform duration-300 hover:scale-[1.01]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/fleet/ashok_leyland_hd.png';
                      }}
                    />
                  </div>

                  {/* Showroom Ground Reflection Stage */}
                  <div className="w-full max-w-lg h-3 -mt-1 relative flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-1.5 rounded-full bg-gradient-to-r from-transparent via-[#F5B82E]/35 to-transparent blur-md" />
                    <div className="absolute inset-x-12 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-[#F5B82E]/50 to-transparent" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Circular Left Navigation Arrow */}
            {len > 1 && (
              <button
                onClick={handlePrev}
                aria-label="Previous fleet vehicle"
                className="group absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-[#F5B82E]/60 hover:bg-[#F5B82E]/20 hover:text-[#F5B82E] cursor-pointer"
              >
                <ChevronLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>
            )}

            {/* Circular Right Navigation Arrow */}
            {len > 1 && (
              <button
                onClick={handleNext}
                aria-label="Next fleet vehicle"
                className="group absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-[#F5B82E]/60 hover:bg-[#F5B82E]/20 hover:text-[#F5B82E] cursor-pointer"
              >
                <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Pagination Indicators */}
            {len > 1 && (
              <div className="relative z-20 flex items-center justify-center gap-1.5 pt-1.5">
                {enrichedFleet.map((item: ShowcaseFleetItem, i: number) => {
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => selectIndex(i)}
                      aria-label={`Select vehicle ${item.vehicleNumber}`}
                      className={`transition-all duration-300 cursor-pointer rounded-full ${
                        isActive
                          ? 'h-1 w-5 bg-[#F5B82E] shadow-[0_0_8px_#F5B82E]'
                          : 'h-1 w-1.5 bg-white/25 hover:bg-white/50'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Aesthetic Glassmorphism Telemetry Cards Below Fleet */}
          <div className="relative z-10 border-t border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-black/50 backdrop-blur-2xl p-2.5 sm:p-3.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentVehicle.vehicleNumber}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5"
              >
                {/* Glass Card 1: Vehicle & Driver */}
                <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-transparent p-2.5 sm:p-3 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_6px_20px_rgba(0,0,0,0.4)] hover:border-[#F5B82E]/35 transition-all min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 truncate">
                      Vehicle &amp; Driver
                    </span>
                    <TruckIcon className="h-3.5 w-3.5 shrink-0 text-[#F5B82E]" />
                  </div>
                  <p className="font-mono text-xs font-black text-white truncate">{currentVehicle.vehicleNumber}</p>
                  <div className="mt-1 flex items-center justify-between gap-1 text-[10.5px] text-neutral-400">
                    <span className="capitalize text-neutral-200 font-semibold truncate">{currentVehicle.driver}</span>
                    <span className="font-mono text-[10px] font-bold text-amber-400 shrink-0">{currentVehicle.capacity || '1,805 sqft'}</span>
                  </div>
                </div>

                {/* Glass Card 2: Status & Route */}
                <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-transparent p-2.5 sm:p-3 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_6px_20px_rgba(0,0,0,0.4)] hover:border-emerald-400/35 transition-all min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 truncate">
                      Route &amp; Status
                    </span>
                    <ActivityIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full animate-pulse"
                      style={{ backgroundColor: currentVehicle.statusColor }}
                    />
                    <span className="font-bold text-xs truncate" style={{ color: currentVehicle.statusColor }}>
                      {currentVehicle.statusLabel}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10.5px] text-neutral-300">
                    <MapPinIcon className="h-3 w-3 text-[#F5B82E] shrink-0" />
                    <span className="truncate">{currentVehicle.route}</span>
                  </div>
                </div>

                {/* Glass Card 3: Stone Cargo */}
                <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-transparent p-2.5 sm:p-3 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_6px_20px_rgba(0,0,0,0.4)] hover:border-cyan-400/35 transition-all min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 truncate">
                      Stone Cargo
                    </span>
                    <BoxIcon className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                  </div>
                  {loadSummary && loadSummary.stoneLines.length > 0 ? (
                    <>
                      <p className="font-mono text-xs font-black text-emerald-400 truncate">
                        {loadSummary.totalSqft > 0
                          ? `${loadSummary.totalSqft.toLocaleString('en-IN')} sqft`
                          : `${loadSummary.totalPieces} pcs`}
                      </p>
                      <p className="mt-1 text-[10.5px] text-neutral-300 truncate">
                        {loadSummary.stoneLines[0].size} ({loadSummary.stoneLines[0].pieces}p)
                        {loadSummary.stoneLines.length > 1 ? ` +${loadSummary.stoneLines.length - 1}` : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-neutral-300 truncate">Depot Standby</p>
                      <p className="mt-1 text-[10.5px] text-neutral-500 truncate">Ready for next load</p>
                    </>
                  )}
                </div>

                {/* Glass Card 4: Trip & Costs */}
                <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-transparent p-2.5 sm:p-3 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_6px_20px_rgba(0,0,0,0.4)] hover:border-[#F5B82E]/35 transition-all min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 truncate">
                      Trip &amp; Costs
                    </span>
                    {loadSummary?.tripCode ? (
                      <span className="font-mono text-[10px] font-black text-[#F5B82E] shrink-0">
                        #{loadSummary.tripCode}
                      </span>
                    ) : (
                      <Link to="/trips" className="text-[10px] font-bold text-[#F5B82E] hover:underline shrink-0">
                        Assign →
                      </Link>
                    )}
                  </div>
                  {loadSummary ? (
                    <>
                      <div className="flex items-center justify-between gap-1 text-[10.5px]">
                        <span className="text-neutral-400">Hamali:</span>
                        <span className="font-mono font-bold text-amber-400">₹{loadSummary.hamali.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-1 text-[10.5px]">
                        <span className="text-neutral-400">Diesel:</span>
                        <span className="font-mono font-bold text-yellow-400">₹{loadSummary.fuelExpense.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-neutral-400 truncate">No Active Trip</p>
                      <p className="mt-1 text-[10.5px] text-neutral-500 truncate">Tap Assign to dispatch</p>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      );
}

