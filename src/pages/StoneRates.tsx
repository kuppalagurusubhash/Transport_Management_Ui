import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { stoneSpecs as seedSpecs } from '../data/mockData';
import type { StoneSpec } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
export function StoneRates() {
  const [specs, setSpecs] = useState<StoneSpec[]>(seedSpecs);
  const updateRate = (id: string, rate: number) =>
  setSpecs((prev) =>
  prev.map((s) =>
  s.id === id ?
  {
    ...s,
    ratePerSqft: rate
  } :
  s
  )
  );
  return (
    <div className="min-h-full">
      <PageHeader
        title="Stone Rates"
        subtitle="Rate per square foot by size, thickness & finish" />
      
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
    </div>);

}