import React from 'react';
import { motion } from 'framer-motion';
interface KpiCardProps {
  label: string;
  value: string;
  subtext: string;
  index?: number;
}
export function KpiCard({ label, value, subtext, index = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.35,
        delay: index * 0.06
      }}
      className="rounded-lg border border-ink-700 bg-ink-950 p-5">
      
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-[28px] font-extrabold leading-none tracking-tight text-gold">
        {value}
      </p>
      <p className="mt-2 text-xs text-neutral-600">{subtext}</p>
    </motion.div>);

}