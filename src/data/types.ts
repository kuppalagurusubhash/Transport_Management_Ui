// Domain types for TRANS IA — black-stone transport business.
// Structured so a driver-facing app can be layered on later without rework.

export type LorryStatus = 'active' | 'idle' | 'maintenance' | 'sold';
export type TripStatus = 'loading' | 'in-transit' | 'delivered' | 'paid';
export type Finish = 'polish' | 'rough';
export type ExpenseReview = 'pending' | 'approved' | 'flagged';
export type OrderStatus =
'placed' |
'confirmed' |
'dispatched' |
'delivered' |
'paid';

export interface StoneSpec {
  id: string;
  size: string; // e.g. "2x2", "3x3"
  thickness: string; // e.g. "40mm"
  finish: Finish;
  ratePerSqft: number; // e.g. 17, 18, 19, 20
}

export interface Driver {
  id: string;
  name: string;
  email?: string;
  password?: string;
  phone: string;
  lorryId: string | null;
  status: 'active' | 'idle' | 'off-duty';
  joinedOn: string;
  tripsCompleted: number;
}

export interface Lorry {
  id: string;
  plate: string; // e.g. "KL-07 AB 4521"
  driverId: string | null;
  status: LorryStatus;
  location: string; // mock/static text — no real GPS in this pass
  capacitySqft: number;
  addedOn: string;
}

export interface LoadingParty {
  id: string;
  name: string;
  location: string; // sourced around Ramapuram
  totalPurchased: number;
  paid: number;
  pending: number;
}

export interface UnloadingParty {
  id: string;
  name: string;
  district: string; // Kerala district
  totalOrdered: number;
  paid: number;
  pending: number;
}

// A single stone line item within a trip, carrying the full sqft calculation.
export interface StoneLine {
  id: string;
  loadingPartyId: string;
  size: string; // "2x2"
  thickness: string; // "40mm"
  finish: Finish;
  sqftPerPiece: number; // 2x2 => 4
  pieces: number; // 40
  ratePerSqft: number; // 19
  // totalSqft = sqftPerPiece * pieces ; amount = totalSqft * ratePerSqft
}

// Flexible worker payment given per loading party per trip (not formula-based).
export interface WorkerPayment {
  id: string;
  loadingPartyId: string;
  amount: number;
  note?: string;
}

export type ExpenseCategory =
  | 'fuel'
  | 'toll'
  | 'maintenance'
  | 'police_rto'
  | 'worker_hamali'
  | 'bata_food'
  | 'other';

// Flexible expense/maintenance line item — label + amount, owner-reviewable.
export interface ExpenseLine {
  id: string;
  label: string;
  amount: number;
  review: ExpenseReview;
  category?: ExpenseCategory;
  receiptUrl?: string; // photo/thumbnail of driver's handwritten paper
  notes?: string;
  recordedAt?: string;
}

export interface LoadingPartyPayment {
  id: string;
  loadingPartyId: string;
  amountPaid: number;
  paidBy: 'owner' | 'driver';
  status: 'paid' | 'pending';
  paymentMode?: 'cash' | 'phonepe' | 'bank_transfer' | 'unspecified';
}

export interface Trip {
  id: string;
  code: string; // human-readable, e.g. "TRP-1042"
  lorryId: string;
  driverId: string;
  origin: string; // e.g. "Ramapuram"
  unloadingPartyId: string;
  status: TripStatus;
  date: string;
  stoneLines: StoneLine[];
  workerPayments: WorkerPayment[];
  expenses: ExpenseLine[];
  loadingPartyPayments?: LoadingPartyPayment[];
  amountPaid: number; // by the unloading party so far
  partyToDriverCash?: number;
  partyToOwnerPhonePe?: number;
  damagedPieces?: number;
  damageDeduction?: number;
  orderId?: string;
}

export interface ActivityEvent {
  id: string;
  kind: 'trip' | 'payment' | 'fleet' | 'expense';
  message: string;
  time: string;
}

// District-based selling rate: the same stone spec sells at a different
// rate per sqft depending on the destination Kerala district.
// e.g. 2x2 50mm -> Palakkad ₹40, Wayanad ₹49, Kannur ₹50.
export interface DistrictRate {
  id: string;
  district: string;
  size: string; // "2x2"
  thickness: string; // "50mm"
  finish: Finish;
  ratePerSqft: number; // selling rate to the buyer
}

// A single stone line inside a buyer's order, carrying the sqft calculation
// at the district selling rate.
export interface OrderLine {
  id: string;
  size: string; // "2x2"
  thickness: string; // "50mm"
  finish: Finish;
  sqftPerPiece: number; // 2x2 => 4
  pieces: number; // 40
  ratePerSqft: number; // district sell rate, e.g. 40
}

// An order placed by a Kerala (unloading) party through the buyer portal.
export interface Order {
  id: string;
  code: string; // "ORD-2051"
  unloadingPartyId: string;
  district: string;
  status: OrderStatus;
  placedAt: string; // ISO
  lines: OrderLine[];
  amountPaid: number;
}

// In-app owner notification (e.g. a new order arrived).
export interface AppNotification {
  id: string;
  kind: 'order' | 'payment';
  title: string;
  body: string;
  time: string;
  read: boolean;
  orderId?: string;
}

// ---- Derived calculation helpers ----

export function lineTotalSqft(line: StoneLine): number {
  return line.sqftPerPiece * line.pieces;
}

export function lineAmount(line: StoneLine): number {
  return lineTotalSqft(line) * line.ratePerSqft;
}

export function tripRevenue(trip: Trip): number {
  return (trip.stoneLines || []).reduce((sum, l) => sum + lineAmount(l), 0);
}

export function tripWorkerTotal(trip: Trip): number {
  return (trip.workerPayments || []).reduce((sum, w) => sum + w.amount, 0);
}

export function tripExpenseTotal(trip: Trip): number {
  return (trip.expenses || []).reduce((sum, e) => sum + e.amount, 0);
}

export function tripNet(trip: Trip): number {
  return tripRevenue(trip) - tripWorkerTotal(trip) - tripExpenseTotal(trip);
}

export function tripSqft(trip: Trip): number {
  return (trip.stoneLines || []).reduce((sum, l) => sum + lineTotalSqft(l), 0);
}

export function tripPending(trip: Trip): number {
  return Math.max(0, tripRevenue(trip) - trip.amountPaid);
}

// ---- Order calculation helpers ----

export function orderLineTotalSqft(line: OrderLine): number {
  return line.sqftPerPiece * line.pieces;
}

export function orderLineAmount(line: OrderLine): number {
  return orderLineTotalSqft(line) * line.ratePerSqft;
}

export function orderTotal(order: Order): number {
  return (order.lines || []).reduce((sum, l) => sum + orderLineAmount(l), 0);
}

export function orderSqft(order: Order): number {
  return (order.lines || []).reduce((sum, l) => sum + orderLineTotalSqft(l), 0);
}

export function orderPending(order: Order): number {
  return Math.max(0, orderTotal(order) - order.amountPaid);
}