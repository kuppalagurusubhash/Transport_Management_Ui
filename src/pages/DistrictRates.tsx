import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { districts } from '../utils/helpers';
import type { DistrictRate } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { useOrders } from '../store/OrdersContext';
import { AddDistrictRateModal } from '../components/ui/AddDistrictRateModal';

export function DistrictRates() {
  const { districtRates, updateDistrictRate, stoneSpecs } = useOrders();
  const [rates, setRates] = useState<DistrictRate[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  useEffect(() => {
    setRates(districtRates || []);
  }, [districtRates]);

  const getRamapuramPrice = (size: string, thickness: string, finish: string) => {
    const s = (stoneSpecs || []).find(
      (spec) => spec.size === size && spec.thickness === thickness && spec.finish === finish
    );
    return s?.ratePerSqft ?? 0;
  };


  const rateFor = (
    district: string,
    size: string,
    thickness: string,
    finish: string
  ) =>
    rates.find(
      (r) =>
        r.district === district &&
        r.size === size &&
        r.thickness === thickness &&
        r.finish === finish
    );

  const updateRate = (id: string, value: number) => {
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ratePerSqft: value } : r))
    );
    setIsModified(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find rates that differ from original context rates
      const modified = rates.filter((r) => {
        const original = districtRates.find((orig) => orig.id === r.id);
        return original && original.ratePerSqft !== r.ratePerSqft;
      });

      for (const r of modified) {
        await updateDistrictRate(r.id, r.ratePerSqft);
      }
      setIsModified(false);
    } catch (err) {
      console.error('Failed to save district rates:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="District & Ramapuram Stone Rates"
        subtitle="Manage our procurement rate at Ramapuram Quarry vs selling order rates across Kerala destination districts"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-gold px-3.5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
            >
              <PlusIcon className="h-4 w-4" /> Add District Rate
            </button>
            {isModified && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-md border border-ink-700 bg-ink-950 px-3.5 py-2 text-sm font-semibold text-neutral-350 transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        }
      />
      
      <div className="p-6 sm:p-8 space-y-6">
        {/* Comparison Callout */}
        <div className="rounded-2xl border border-[#F5B82E]/25 bg-[#F5B82E]/5 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5B82E]">
              Rate Matrix Architecture
            </h4>
            <p className="text-xs text-neutral-300">
              <strong className="text-white">Our Price in Ramapuram:</strong> Base quarry procurement cost per sqft.
              <br />
              <strong className="text-white">District Order Price:</strong> Selling rate applied automatically to buyer consignments according to delivery district.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-center">
              <span className="text-[10px] text-neutral-400 block uppercase">Base Quarry</span>
              <span className="font-mono font-bold text-amber-400">Ramapuram</span>
            </div>
            <div className="rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-center">
              <span className="text-[10px] text-neutral-400 block uppercase">Destination</span>
              <span className="font-mono font-bold text-emerald-400">Kerala Districts</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-ink-700">
          <div className="ti-scroll overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-950 text-xs uppercase tracking-[0.08em] text-neutral-500">
                  <th className="sticky left-0 z-10 bg-ink-950 px-4 py-3 font-medium">
                    Stone Spec
                  </th>
                  <th className="px-4 py-3 font-bold text-amber-400 border-r border-ink-800 bg-amber-500/5">
                    Our Price (Ramapuram)
                  </th>
                  {districts.map((d) => (
                    <th key={d} className="px-4 py-3 text-right font-medium">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sellableSpecs.length === 0 && (
                  <tr>
                    <td colSpan={districts.length + 2} className="px-4 py-10 text-center text-sm text-neutral-500">
                      No district rates configured in database. Click "Add District Rate" to create one.
                    </td>
                  </tr>
                )}
                {sellableSpecs.map((spec, i) => {
                  const ramapuramCost = getRamapuramPrice(spec.size, spec.thickness, spec.finish);
                  return (
                    <motion.tr
                      key={`${spec.size}-${spec.thickness}-${spec.finish}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-ink-800 bg-ink-900 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="sticky left-0 z-10 bg-ink-900 px-4 py-3">
                        <span className="font-semibold text-white">
                          {spec.size} · {spec.thickness}
                        </span>
                        <span className="ml-2 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] capitalize text-neutral-400">
                          {spec.finish}
                        </span>
                      </td>

                      {/* Ramapuram Our Price */}
                      <td className="px-4 py-3 font-mono font-bold text-amber-400 border-r border-ink-800 bg-amber-500/5">
                        ₹{ramapuramCost} <span className="text-[10px] text-neutral-400 font-sans">/sqft</span>
                      </td>

                      {districts.map((d) => {
                        const r = rateFor(d, spec.size, spec.thickness, spec.finish);
                        const margin = r ? r.ratePerSqft - ramapuramCost : null;
                        return (
                          <td key={d} className="px-4 py-3 text-right">
                            {r ? (
                              <div className="inline-flex flex-col items-end">
                                <span className="inline-flex items-center gap-1">
                                  <span className="text-neutral-600">₹</span>
                                  <input
                                    type="number"
                                    value={r.ratePerSqft}
                                    onChange={(e) => updateRate(r.id, Number(e.target.value))}
                                    className="w-16 rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-right font-semibold text-gold focus:border-gold focus:outline-none"
                                    aria-label={`Rate for ${spec.size} ${spec.thickness} ${spec.finish} in ${d}`}
                                  />
                                </span>
                                {margin !== null && (
                                  <span className={`text-[10px] font-mono mt-0.5 ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {margin >= 0 ? `+₹${margin}` : `-₹${Math.abs(margin)}`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-neutral-700">—</span>
                            )}
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 text-xs text-neutral-600">
          Example: 2x2 · 50mm polish sells at ₹40 in Palakkad, ₹49 in Wayanad,
          ₹50 in Kannur.
        </p>
      </div>

      <AddDistrictRateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>);

}