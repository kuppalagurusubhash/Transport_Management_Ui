import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { districtRates, districts, sellableSpecs } from '../data/mockData';
import type { DistrictRate } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
export function DistrictRates() {
  const [rates, setRates] = useState<DistrictRate[]>(districtRates);
  const rateFor = (
  district: string,
  size: string,
  thickness: string,
  finish: string) =>

  rates.find(
    (r) =>
    r.district === district &&
    r.size === size &&
    r.thickness === thickness &&
    r.finish === finish
  );
  const updateRate = (id: string, value: number) =>
  setRates((prev) =>
  prev.map((r) =>
  r.id === id ?
  {
    ...r,
    ratePerSqft: value
  } :
  r
  )
  );
  return (
    <div className="min-h-full">
      <PageHeader
        title="District Rates"
        subtitle="Selling rate per sqft by Kerala district — drives buyer order pricing" />
      
      <div className="p-6 sm:p-8">
        <div className="overflow-hidden rounded-lg border border-ink-700">
          <div className="ti-scroll overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-950 text-xs uppercase tracking-[0.08em] text-neutral-500">
                  <th className="sticky left-0 z-10 bg-ink-950 px-4 py-3 font-medium">
                    Stone Spec
                  </th>
                  {districts.map((d) =>
                  <th key={d} className="px-4 py-3 text-right font-medium">
                      {d}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sellableSpecs.map((spec, i) =>
                <motion.tr
                  key={`${spec.size}-${spec.thickness}-${spec.finish}`}
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
                  
                    <td className="sticky left-0 z-10 bg-ink-900 px-4 py-3">
                      <span className="font-semibold text-white">
                        {spec.size} · {spec.thickness}
                      </span>
                      <span className="ml-2 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] capitalize text-neutral-400">
                        {spec.finish}
                      </span>
                    </td>
                    {districts.map((d) => {
                    const r = rateFor(
                      d,
                      spec.size,
                      spec.thickness,
                      spec.finish
                    );
                    return (
                      <td key={d} className="px-4 py-3 text-right">
                          {r ?
                        <span className="inline-flex items-center gap-1">
                              <span className="text-neutral-600">₹</span>
                              <input
                            type="number"
                            value={r.ratePerSqft}
                            onChange={(e) =>
                            updateRate(r.id, Number(e.target.value))
                            }
                            className="w-16 rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-right font-semibold text-gold focus:border-gold focus:outline-none"
                            aria-label={`Rate for ${spec.size} ${spec.thickness} ${spec.finish} in ${d}`} />
                          
                            </span> :

                        <span className="text-neutral-700">—</span>
                        }
                        </td>);

                  })}
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 text-xs text-neutral-600">
          Example: 2x2 · 50mm polish sells at ₹40 in Palakkad, ₹49 in Wayanad,
          ₹50 in Kannur.
        </p>
      </div>
    </div>);

}