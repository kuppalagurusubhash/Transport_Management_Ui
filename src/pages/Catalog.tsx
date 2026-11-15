import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gem,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Scale,
  Maximize2,
  X,
  PhoneCall,
  Coins,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { catalogItems, CatalogItem } from '../data/catalogData';
import { catalogApi } from '../api/index';
import { formatINR } from '../utils/helpers';

export function Catalog() {
  const [items, setItems] = useState<CatalogItem[]>(catalogItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFinish, setSelectedFinish] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  // Attempt to load live backend catalog items if available
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await catalogApi.getAll();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          // Merge with local static items to ensure full typing and rich subtitles
          const merged = res.data.map((backendItem: any) => {
            const localMatch = catalogItems.find(c => c.code === backendItem.code);
            return {
              ...(localMatch || {}),
              ...backendItem,
              id: backendItem._id || backendItem.id || localMatch?.id,
              subtitle: localMatch?.subtitle || backendItem.description?.slice(0, 60) + '...',
              finish: backendItem.finishes?.[0] || localMatch?.finish || 'rough',
              finishLabel: localMatch?.finishLabel || (backendItem.finishes?.[0] === 'polish' ? 'Polished' : 'Natural Rough'),
              size: backendItem.availableSizes?.[0] || localMatch?.size || '2x2',
              thickness: backendItem.availableThicknesses?.[0] || localMatch?.thickness || '30mm',
              sqftPerPiece: (backendItem.availableSizes?.[0] === '3x3' ? 9 : 4),
              weightPerSqftKg: localMatch?.weightPerSqftKg || 8.0,
              baseRatePerSqft: backendItem.baseRatePerSqft || localMatch?.baseRatePerSqft || 18,
              recommendedDistrictRate: localMatch?.recommendedDistrictRate || (backendItem.baseRatePerSqft + 7),
              imageUrl: backendItem.imageUrl || localMatch?.imageUrl || '/catalog/s2.jpeg',
              inStock: backendItem.inStock ?? true,
              tag: localMatch?.tag || 'Authentic',
              popular: localMatch?.popular ?? true
            } as CatalogItem;
          });
          setItems(merged);
        }
      } catch (err) {
        console.log('[Catalog] Using offline catalog varieties list.');
      }
    };
    fetchCatalog();
  }, []);

  const categories = ['All', 'Black Stone', 'Paving', 'Flooring', 'Slabs'];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchFinish = selectedFinish === 'All' || item.finish === selectedFinish;
      const matchSize = selectedSize === 'All' || item.size === selectedSize;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.color && item.color.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchFinish && matchSize && matchSearch;
    });
  }, [items, selectedCategory, selectedFinish, selectedSize, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 text-gold border border-gold/30">
                <Gem className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-gold">
                Ramapuram Quarry Source
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Authentic Black Stone Catalog
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              High-density authentic Andhra black limestone slabs and tiles calibrated for Kerala courtyards, walkways, resorts, and heavy vehicle parking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-[#16161e] border border-[#22222e] text-xs">
              <span className="block text-[10px] uppercase font-bold text-neutral-500">Available Varieties</span>
              <span className="font-mono font-black text-white text-base">{items.length} SKUs</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#16161e] border border-[#22222e] text-xs">
              <span className="block text-[10px] uppercase font-bold text-neutral-500">Direct Quarry Rate</span>
              <span className="font-mono font-black text-gold text-base">₹17 - ₹20 <span className="text-[10px] text-neutral-400 font-sans">/sqft</span></span>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-6 pt-5 border-t border-[#1e1e26] flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat
                    ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(245,166,35,0.25)]'
                    : 'bg-[#16161e] border-[#22222e] text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Sub-filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="h-3.5 w-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stone variety..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#16161e] border border-[#22222e] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {/* Size Filter */}
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#16161e] border border-[#22222e] text-xs text-neutral-300 focus:outline-none focus:border-gold"
            >
              <option value="All">All Sizes</option>
              <option value="2x2">2x2 (4 sqft)</option>
              <option value="3x3">3x3 (9 sqft)</option>
            </select>

            {/* Finish Filter */}
            <select
              value={selectedFinish}
              onChange={(e) => setSelectedFinish(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#16161e] border border-[#22222e] text-xs text-neutral-300 focus:outline-none focus:border-gold"
            >
              <option value="All">All Finishes</option>
              <option value="rough">Rough Split</option>
              <option value="polish">Mirror / Honed Polish</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="group rounded-2xl border border-[#1e1e26] bg-[#121217] overflow-hidden shadow-xl hover:border-gold/40 transition-all flex flex-col justify-between"
          >
            {/* Image Preview Container */}
            <div className="relative h-56 w-full overflow-hidden bg-neutral-900">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-transparent to-black/30" />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-gold">
                  {item.code}
                </span>
                {item.tag && (
                  <span className="px-2 py-0.5 rounded-md bg-gold/90 text-black text-[10px] font-black uppercase tracking-wider">
                    {item.tag}
                  </span>
                )}
              </div>

              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-black text-neutral-300 hover:text-white backdrop-blur-md border border-white/10 transition-colors"
                  title="Enlarge preview"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Bottom Finish Pill */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-[#16161e]/90 backdrop-blur-md border border-white/10 text-[11px] font-bold text-neutral-200">
                  {item.finishLabel}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-[10px] font-black text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> In Stock
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  {item.category} · {item.color || 'Charcoal Black'}
                </div>
                <h3 className="text-base font-black text-white group-hover:text-gold transition-colors leading-snug">
                  {item.name}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  {item.subtitle}
                </p>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="grid grid-cols-3 gap-2 bg-[#16161e] border border-[#202028] p-3 rounded-xl text-center">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-neutral-500">Dimensions</span>
                  <span className="font-mono font-bold text-white text-xs">{item.size}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-neutral-500">Thickness</span>
                  <span className="font-mono font-bold text-white text-xs">{item.thickness}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-neutral-500">Coverage</span>
                  <span className="font-mono font-bold text-gold text-xs">{item.sqftPerPiece} sqft</span>
                </div>
              </div>

              {/* Rate & Details Footer */}
              <div className="pt-3 border-t border-[#1e1e26] flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-neutral-500">Quarry Rate</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-xl font-black text-gold">₹{item.baseRatePerSqft}</span>
                    <span className="text-[11px] text-neutral-400 font-medium">/sqft</span>
                  </div>
                  {item.recommendedDistrictRate && (
                    <span className="text-[10px] text-neutral-500">Kerala Dist: ₹{item.recommendedDistrictRate}/sqft</span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedItem(item)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold text-gold hover:text-black border border-gold/30 font-bold text-xs transition-all cursor-pointer"
                >
                  Specs & Details <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-2xl bg-[#121217] border border-[#22222e] rounded-2xl overflow-hidden shadow-2xl pointer-events-auto text-neutral-200"
              >
                <div className="relative h-64 w-full bg-neutral-900">
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-transparent to-black/50" />
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-4 left-6">
                    <span className="px-2.5 py-1 rounded-md bg-gold text-black text-[10px] font-black uppercase tracking-wider">
                      {selectedItem.code}
                    </span>
                    <h2 className="text-xl font-black text-white mt-1">
                      {selectedItem.name}
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {selectedItem.description || selectedItem.subtitle}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#16161e] border border-[#202028] p-4 rounded-xl text-center">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-500">Dimensions</span>
                      <span className="font-mono font-bold text-white text-sm">{selectedItem.size}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-500">Thickness</span>
                      <span className="font-mono font-bold text-white text-sm">{selectedItem.thickness}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-500">Unit Weight</span>
                      <span className="font-mono font-bold text-white text-sm">~{selectedItem.weightPerSqftKg} kg/sqft</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-500">Quarry Base</span>
                      <span className="font-mono font-black text-gold text-sm">₹{selectedItem.baseRatePerSqft} / sqft</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-emerald-300 block">Quarry Quality Certified</span>
                      <span className="text-[11px] text-neutral-400">
                        Inspected at Ramapuram weighbridges. 100% genuine Kadapa limestone, weather resistant and non-porous.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e1e26]">
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="px-4 py-2 rounded-xl border border-[#252530] text-neutral-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <a
                      href="tel:+919876543210"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-400 text-black font-black text-xs transition-all shadow-lg shadow-gold/20 cursor-pointer"
                    >
                      <PhoneCall className="h-4 w-4" /> Quarry Dispatch Inquiry
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
