import React from 'react';
import type { TripStatus, ExpenseReview, OrderStatus } from '../../data/types';
const tripStyles: Record<TripStatus, string> = {
  loading: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  'in-transit': 'bg-blue-400/10 text-blue-300 border-blue-400/30',
  delivered: 'bg-gold/10 text-gold border-gold/30',
  paid: 'bg-green-400/10 text-green-300 border-green-400/30'
};
const tripText: Record<TripStatus, string> = {
  loading: 'Loading',
  'in-transit': 'In Transit',
  delivered: 'Delivered',
  paid: 'Paid'
};
export function TripStatusBadge({ status }: {status: TripStatus;}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tripStyles[status]}`}>
      
      {tripText[status]}
    </span>);

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