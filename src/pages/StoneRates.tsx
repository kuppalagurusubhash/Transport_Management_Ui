import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import type { StoneSpec } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { useOrders } from '../store/OrdersContext';
import { AddStoneRateModal } from '../components/ui/AddStoneRateModal';

export function StoneRates() {
  const { stoneSpecs, updateStoneRate } = useOrders();
  const [specs, setSpecs] = useState<StoneSpec[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    setSpecs(stoneSpecs || []);
  }, [stoneSpecs]);

  const updateRate = (id: string, rate: number) => {
    setSpecs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ratePerSqft: rate } : s))
    );
    setIsModified(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const modified = specs.filter((s) => {
        const original = stoneSpecs.find((orig) => orig.id === s.id);
        return original && original.ratePerSqft !== s.ratePerSqft;
      });

      for (const s of modified) {
        await updateStoneRate(s.id, s.ratePerSqft);
      }
      setIsModified(false);
    } catch (err) {
      console.error('Failed to save stone rates:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="Stone Rates"
        subtitle="Rate per square foot by size, thickness & finish"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-gold px-3.5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
            >
              <PlusIcon className="h-4 w-4" /> Add Stone Rate
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
      
      <div className="p-6 sm:p-8">
        <div className="overflow-hidden rounded-lg border border-ink-700">
          <div className="ti-scroll overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-950 text-xs uppercase tracking-[0.08em] text-neutral-500">
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Thickness</th>
                  <th className="px-4 py-3 font-medium">Finish</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Rate / sqft (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {specs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-neutral-500">
                      No stone rates configured in database. Click "Add Stone Rate" to create one.
                    </td>
                  </tr>
                )}
                {specs.map((s, i) =>
                <motion.tr
                  key={s.id}
                  initial={{
                    opacity: 0
                  }}
                  animate={{
                    opacity: 1
                  }}
                  transition={{
                    delay: i * 0.04
                  }}
                  className="border-b border-ink-800 bg-ink-900 last:border-0">
                  
                    <td className="px-4 py-4 font-semibold text-white">
                      {s.size}
                    </td>
                    <td className="px-4 py-4 text-neutral-300">
                      {s.thickness}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded bg-ink-800 px-2 py-0.5 text-xs capitalize text-neutral-300">
                        {s.finish}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <input
                      type="number"
                      value={s.ratePerSqft}
                      onChange={(e) =>
                      updateRate(s.id, Number(e.target.value))
                      }
                      className="w-20 rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-right font-semibold text-gold focus:border-gold focus:outline-none"
                      aria-label={`Rate for ${s.size} ${s.thickness} ${s.finish}`} />
                    
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 text-xs text-neutral-600">
          Edit any rate inline — changes apply to new load calculations.
        </p>
      </div>

      <AddStoneRateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>);

}