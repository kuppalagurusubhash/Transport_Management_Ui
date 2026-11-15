import React from 'react';
import type { TripStatus, ExpenseReview, OrderStatus } from '../../data/types';
const tripStyles: Record<TripStatus, string> = {
  assigned: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/30',
  loading: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  loaded: 'bg-amber-500/15 text-amber-200 border-amber-500/40',
  'in-transit': 'bg-blue-400/10 text-blue-300 border-blue-400/30',
  arrived_kerala: 'bg-purple-400/10 text-purple-300 border-purple-400/30',
  stone_unloading: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/30',
  stone_unloaded: 'bg-teal-400/10 text-teal-300 border-teal-400/30',
  return_decision_pending: 'bg-amber-400/15 text-amber-300 border-amber-400/40',
  return_sand_loading: 'bg-orange-400/10 text-orange-300 border-orange-400/30',
  return_loaded: 'bg-orange-500/15 text-orange-200 border-orange-500/40',
  returning: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/30',
  arrived_lt_factory: 'bg-purple-400/10 text-purple-300 border-purple-400/30',
  sand_unloaded: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  direct_return: 'bg-blue-400/10 text-blue-300 border-blue-400/30',
  returned_to_base: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40',
  final_audit_pending: 'bg-gold/15 text-gold border-gold/40',
  completed: 'bg-green-500/15 text-green-300 border-green-500/40',
  delivered: 'bg-gold/10 text-gold border-gold/30',
  paid: 'bg-green-400/10 text-green-300 border-green-400/30'
};

const tripText: Record<TripStatus, string> = {
  assigned: 'Assigned',
  loading: 'Loading Quarry',
  loaded: 'Quarry Loaded',
  'in-transit': 'In Transit (Kerala)',
  arrived_kerala: 'Arrived at Kerala',
  stone_unloading: 'Stone Unloading',
  stone_unloaded: 'Stone Unloaded',
  return_decision_pending: 'Return Plan Pending',
  return_sand_loading: 'Return Sand Loading',
  return_loaded: 'Return Sand Loaded',
  returning: 'Returning (Transit)',
  arrived_lt_factory: 'Arrived at L&T Factory',
  sand_unloaded: 'Sand Unloaded (L&T)',
  direct_return: 'Direct Return (Base)',
  returned_to_base: 'Returned to Base',
  final_audit_pending: 'Final Audit Pending',
  completed: 'Trip Completed',
  delivered: 'Delivered',
  paid: 'Paid'
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        tripStyles[status] || 'bg-neutral-500/10 text-neutral-300 border-neutral-500/30'
      }`}
    >
      {tripText[status] || status}
    </span>
  );
}
const reviewStyles: Record<ExpenseReview, string> = {
  pending: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/30',
  approved: 'bg-green-400/10 text-green-300 border-green-400/30',
  flagged: 'bg-red-500/10 text-red-300 border-red-500/30'
};
export function ReviewBadge({ review }: {review: ExpenseReview;}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${reviewStyles[review]}`}>
      
      {review}
    </span>);

}
const orderStyles: Record<OrderStatus, string> = {
  placed: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  confirmed: 'bg-blue-400/10 text-blue-300 border-blue-400/30',
  dispatched: 'bg-purple-400/10 text-purple-300 border-purple-400/30',
  delivered: 'bg-gold/10 text-gold border-gold/30',
  paid: 'bg-green-400/10 text-green-300 border-green-400/30'
};
export function OrderStatusBadge({ status }: {status: OrderStatus;}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${orderStyles[status]}`}>
      
      {status}
    </span>);

}