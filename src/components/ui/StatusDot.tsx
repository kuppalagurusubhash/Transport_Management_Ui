import React from 'react';
import type { LorryStatus } from '../../data/types';
const config: Record<
  LorryStatus,
  {
    color: string;
    glow: string;
    label: string;
    pulse: boolean;
  }> =
{
  active: {
    color: 'bg-green-400',
    glow: 'shadow-[0_0_8px_rgba(74,222,128,0.5)]',
    label: 'Active',
    pulse: true
  },
  idle: {
    color: 'bg-amber-400',
    glow: 'shadow-[0_0_8px_rgba(251,191,36,0.4)]',
    label: 'Idle',
    pulse: true
  },
  maintenance: {
    color: 'bg-red-500',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    label: 'Maintenance',
    pulse: false
  },
  sold: {
    color: 'bg-ink-600',
    glow: '',
    label: 'Sold',
    pulse: false
  }
};
interface StatusDotProps {
  status: LorryStatus;
  withLabel?: boolean;
}
export function StatusDot({ status, withLabel = false }: StatusDotProps) {
  const c = config[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-3 w-3 flex-shrink-0 rounded-full ${c.color} ${c.glow} ${c.pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true" />
      
      {withLabel && <span className="text-xs text-neutral-400">{c.label}</span>}
    </span>);

}
export const statusLabel = (status: LorryStatus) => config[status].label;