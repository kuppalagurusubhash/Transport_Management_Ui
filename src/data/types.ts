// Domain types for TRANS IA — black-stone transport business.
// Structured so a driver-facing app can be layered on later without rework.

export type LorryStatus = 'active' | 'idle' | 'maintenance' | 'sold';
export type TripStatus =
  | 'assigned'
  | 'loading'
  | 'loaded'
  | 'in-transit'
  | 'arrived_kerala'
  | 'stone_unloading'
  | 'stone_unloaded'
  | 'return_decision_pending'
  | 'return_sand_loading'
  | 'return_loaded'
  | 'returning'
  | 'arrived_lt_factory'
  | 'sand_unloaded'
  | 'direct_return'
  | 'returned_to_base'
  | 'final_audit_pending'
  | 'completed'
  | 'delivered'
  | 'paid';

export type Finish = 'polish' | 'rough';
export type ExpenseReview = 'pending' | 'approved' | 'flagged';
export type OrderStatus = 'placed' | 'confirmed' | 'dispatched' | 'delivered' | 'paid';

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
  location: string;
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
  phone?: string;
  totalOrdered: number;
  paid: number;
  pending: number;
}

export interface StoneLine {
  id: string;
  loadingPartyId: string;
  size: string; // "2x2"
  thickness: string; // "40mm"
  finish: Finish;
  sqftPerPiece: number; // 2x2 => 4
  pieces: number; // 40
  ratePerSqft: number; // 19
}

export interface WorkerPayment {
  id: string;
  loadingPartyId: string;
  amount: number;
  note?: string;
  type?: 'hamali' | 'mamullu' | 'other';
  labourCount?: number;
  paidBy?: 'owner' | 'driver' | 'quarry';
  paymentMode?: 'cash' | 'phonepe' | 'bank_transfer' | 'unspecified';
}

export type ExpenseCategory =
  | 'fuel'
  | 'toll'
  | 'maintenance'
  | 'police_rto'
  | 'worker_hamali'
  | 'hamali'
  | 'quarry_payment'
  | 'bata_food'
  | 'driver'
  | 'other';

export interface ExpenseLine {
  id: string;
  label: string;
  amount: number;
  review: ExpenseReview;
  category?: ExpenseCategory;
  receiptUrl?: string;
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

export type ReturnPlanType = 'sand_return' | 'direct_return';

export interface ReturnSandLoad {
  loadingLocation: 'Mangalore' | 'Kanaya' | string;
  destination: string; // e.g. "L&T Factory"
  sandType: string; // "River Sand" | "M-Sand" | "P-Sand" | "Crushed Sand" | etc.
  quantityPieces?: number;
  weightTons: number; // e.g. 24.50
  ratePerTon: number; // e.g. 1850
  labourCost: number; // Hamali
  mamulu: number;
  otherExpenses: number;
  loadingDate: string;
  loadingTime: string;
  remarks?: string;
  driverName?: string;
  lorryPlate?: string;
  capacityTons?: number;
}

export interface ReturnSandUnload {
  arrivalDate: string;
  arrivalTime: string;
  sandType: string;
  receivedQuantity?: number;
  receivedWeightTons: number; // e.g. 24.20
  weightDifferenceTons: number; // 0.30 Ton difference
  unloadingLabour: number;
  hamali: number;
  mamulu: number;
  deductionsOrDifferenceCost?: number;
  remarks?: string;
  unloadedAt?: string;
}

export interface DirectReturnDetails {
  origin: string; // "Kerala"
  destination: string; // "Kadapa / Base"
  cargo: 'Empty';
  departureDate: string;
  departureTime: string;
  odometerKm?: number;
  fuelLiters?: number;
  remarks?: string;
}

export interface VehicleReturnDetails {
  returnDate: string;
  returnTime: string;
  finalOdometerKm?: number;
  fuelRemainingLiters?: number;
  driverConfirmation: boolean;
  vehicleCondition: 'excellent' | 'good' | 'needs_service' | 'damaged' | string;
  remarks?: string;
  returnedToBaseAt?: string;
}

export interface FinalTripAuditData {
  stoneLoadingVerified: boolean;
  stoneUnloadingVerified: boolean;
  returnJourneyVerified: boolean;
  returnCargoVerified: boolean;
  sandOrDirectVerified: boolean;
  ltUnloadingVerified: boolean;
  weightDifferenceReviewed: boolean;
  labourHamaliVerified: boolean;
  mamuluVerified: boolean;
  expensesVerified: boolean;
  driverDetailsVerified: boolean;
  vehicleReturnedVerified: boolean;
  finalPaymentVerified: boolean;

  // Driver Cash Balance & Carry-Forward Tracking
  driverOpeningBalance?: number; // Prior trip balance carried forward into this trip
  driverCashCollected?: number; // Total cash collected by driver from party
  driverCashSpent?: number; // Total expenses/hamali paid by driver
  driverNetInHand?: number; // Net total cash remaining with driver
  driverSettlementType?: 'carry_forward' | 'handed_over' | 'partial_handover';
  driverCashHandedToOwner?: number; // Cash physically handed over to owner
  driverClosingBalanceForwarded?: number; // Net balance carried forward to NEXT trip

  auditedBy?: string;
  auditNotes?: string;
  completedAt?: string;
  completedDate?: string;
  completedTime?: string;
}

export interface Trip {
  id: string;
  code: string; // human-readable, e.g. "TRP-1042"
  lorryId: string;
  driverId: string;
  origin: string; // e.g. "Ramapuram" / "Kadapa"
  unloadingPartyId: string;
  unloadingPartyIds?: string[];
  status: TripStatus;
  date: string;
  loadingEntries?: LoadingEntry[];
  unloadingEntries?: UnloadingAllocation[];
  stoneLines: StoneLine[];
  workerPayments: WorkerPayment[];
  expenses: ExpenseLine[];
  loadingPartyPayments?: LoadingPartyPayment[];
  amountPaid: number; // by the unloading party so far
  partyToDriverCash?: number;
  partyToOwnerPhonePe?: number;
  unloadedPieces?: number;
  damagedPieces?: number;
  damageDeduction?: number;
  shortageDeduction?: number;
  unloadingLocation?: string;
  auditNote?: string;
  auditStatus?: 'pending_audit' | 'audited' | 'verified' | 'disputed';
  auditedAt?: string;
  auditedBy?: string;
  orderId?: string;
  orderIds?: string[];
  isConsolidated?: boolean;
  dropStops?: Array<{
    orderId: string;
    unloadingPartyId: string;
    buyerName?: string;
    district: string;
    pieces: number;
    sqft: number;
    status?: string;
  }>;

  // Driver Balance Rollover / Cash Settlement
  driverOpeningBalance?: number;
  driverCashHandoverToOwner?: number;
  driverClosingBalanceForwarded?: number;
  driverSettlementType?: 'carry_forward' | 'handed_over' | 'partial_handover';

  // Round Trip & Return Journey Workflow Extensions
  returnPlan?: ReturnPlanType;
  returnSandLoad?: ReturnSandLoad;
  returnSandUnload?: ReturnSandUnload;
  directReturnDetails?: DirectReturnDetails;
  vehicleReturnDetails?: VehicleReturnDetails;
  finalAudit?: FinalTripAuditData;
  completedDate?: string;
  completedTime?: string;
  completedBy?: string;
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

// An order placed by a Kerala (unloading) party through the buyer portal or manually created by Sri Sai Baba owner.
export interface Order {
  id: string;
  code: string; // "ORD-2051"
  unloadingPartyId: string;
  district: string;
  status: OrderStatus;
  placedAt: string; // ISO
  lines: OrderLine[];
  amountPaid: number;
  source?: 'online' | 'manual';
  notes?: string;
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

// ---- Round-Trip Financial Accounting Helpers ----

export function tripReturnRevenue(trip: Trip): number {
  if (!trip.returnSandLoad) return 0;
  // If unloaded at L&T Factory with received weight, use receivedWeightTons; otherwise use loaded weightTons
  const weight = trip.returnSandUnload?.receivedWeightTons ?? trip.returnSandLoad.weightTons;
  return Math.round(weight * (trip.returnSandLoad.ratePerTon || 0));
}

export function tripReturnExpenses(trip: Trip): number {
  let total = 0;
  if (trip.returnSandLoad) {
    total += (trip.returnSandLoad.labourCost || 0) +
             (trip.returnSandLoad.mamulu || 0) +
             (trip.returnSandLoad.otherExpenses || 0);
  }
  if (trip.returnSandUnload) {
    total += (trip.returnSandUnload.unloadingLabour || 0) +
             (trip.returnSandUnload.hamali || 0) +
             (trip.returnSandUnload.mamulu || 0) +
             (trip.returnSandUnload.deductionsOrDifferenceCost || 0);
  }
  // Add any trip expenses tagged as return category / notes
  (trip.expenses || []).forEach((e) => {
    const lbl = e.label.toLowerCase();
    if (lbl.includes('return') || lbl.includes('sand') || lbl.includes('l&t') || lbl.includes('mangalore') || lbl.includes('kanaya')) {
      total += (e.amount || 0);
    }
  });
  return total;
}

export function tripOutboundExpenses(trip: Trip): number {
  // Outbound expenses = Worker payments (Hamali/Mamulu at quarry) + Outbound general expenses
  const workers = tripWorkerTotal(trip);
  const generalExp = (trip.expenses || []).reduce((sum, e) => {
    const lbl = e.label.toLowerCase();
    if (lbl.includes('return') || lbl.includes('sand') || lbl.includes('l&t') || lbl.includes('mangalore') || lbl.includes('kanaya')) {
      return sum; // skip return expenses
    }
    return sum + (e.amount || 0);
  }, 0);
  return workers + generalExp;
}

export function tripTotalJourneyRevenue(trip: Trip, stoneRevenueOverride?: number): number {
  const outboundRev = stoneRevenueOverride !== undefined ? stoneRevenueOverride : tripRevenue(trip);
  const returnRev = tripReturnRevenue(trip);
  return outboundRev + returnRev;
}

export function tripTotalJourneyExpenses(trip: Trip): number {
  return tripOutboundExpenses(trip) + tripReturnExpenses(trip);
}

export function tripTotalJourneyProfit(trip: Trip, stoneRevenueOverride?: number, buyingCost?: number): number {
  const totalRev = tripTotalJourneyRevenue(trip, stoneRevenueOverride);
  const totalExp = tripTotalJourneyExpenses(trip);
  const stoneCost = buyingCost !== undefined ? buyingCost : (trip.stoneLines || []).reduce((s, l) => s + (l.sqftPerPiece * l.pieces * l.ratePerSqft), 0);
  return totalRev - totalExp - stoneCost;
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

// ---- Multi-Quarry & Multi-Party Delivery Types ----

export interface LoadingEntry {
  id: string;
  loadingDate: string;
  loadingTime?: string;
  quarryName: string;
  quarryLocation: string;
  loadingPartyId: string;
  supplierName?: string;
  stoneType: string;
  size: string;
  thickness: string;
  finish: Finish;
  pieces: number;
  sqftPerPiece: number;
  totalSqft: number;
  ratePerSqft: number;
  ratePerPiece?: number;
  totalLoadingValue: number;
  hamaliAmount: number;
  hamaliRatePerPiece?: number;
  hamaliCalculationMode?: 'lump' | 'per_stone';
  hamaliPaidBy?: string;
  hamaliPaymentMode?: string;
  hamaliStatus?: string;
  mamulluAmount?: number;
  mamulluPaidBy?: string;
  otherExpenses: number;
  notes?: string;
  billNumber?: string;
  supportingDocuments?: string[];
  auditTrail?: Array<{
    editedAt: string;
    editedBy: string;
    reason: string;
    previousValues?: any;
  }>;
}

export type DeliveryStatus = 'pending' | 'partially_delivered' | 'delivered' | 'cancelled' | 'rejected';

export interface UnloadingAllocation {
  id: string;
  unloadingPartyId: string;
  partyName: string;
  contactPhone?: string;
  deliveryLocation: string;
  orderId?: string | null;
  deliveryDate?: string;
  deliveryTime?: string;
  stoneType?: string;
  size?: string;
  thickness?: string;
  finish?: Finish;
  piecesLoaded?: number;
  piecesAssigned: number;
  piecesDelivered: number;
  piecesRejected?: number;
  piecesDamaged?: number;
  piecesReturned?: number;
  sqftDelivered?: number;
  agreedRate: number;
  totalDeliveryAmount: number;
  amountReceived: number;
  amountReceivable: number;
  unloadingLabourCharges?: number;
  proofOfDelivery?: string;
  deliveryNotes?: string;
  invoiceNumber?: string;
  reassignedFromOrderId?: string | null;
  reassignmentId?: string | null;
  cancellationReason?: string;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  damageReason?: string;
  status: DeliveryStatus;
  auditTrail?: Array<{
    editedAt: string;
    editedBy: string;
    reason: string;
    previousValues?: any;
  }>;
}

export interface OrderReassignmentRecord {
  id: string;
  originalOrderId: string;
  originalCustomerId: string;
  originalCustomerName: string;
  alternativeCustomerId: string;
  alternativeCustomerName: string;
  tripId: string;
  lorryPlate: string;
  cancellationReason: string;
  cancellationDate: string;
  reassignmentDate: string;
  reassignedBy: string;
  originalRate: number;
  newAgreedRate: number;
  originalQuantityPieces: number;
  reassignedQuantityPieces: number;
  stoneType: string;
  size: string;
  thickness: string;
  finish: Finish;
  newDeliveryLocation: string;
  priceDifference: number;
  extraTransportCost: number;
  extraHamaliCost: number;
  otherExpenses: number;
  status: 'reassigned' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
}

export interface PaymentAllocationItem {
  tripId?: string;
  orderId?: string;
  loadingEntryId?: string;
  unloadingEntryId?: string;
  allocatedAmount: number;
  note?: string;
}

export interface PaymentRecord {
  id: string;
  partyId: string;
  partyType: 'supplier' | 'customer';
  partyName?: string;
  direction: 'payable_out' | 'receivable_in';
  amount: number;
  date: string;
  method: 'cash' | 'phonepe' | 'bank_transfer' | 'cheque' | 'other';
  reference?: string;
  notes?: string;
  paidBy?: string;
  createdBy?: string;
  allocations?: PaymentAllocationItem[];
  status: 'completed' | 'reversed';
  createdAt?: string;
}

export interface LedgerTransaction {
  id: string;
  type: 'purchase' | 'payment' | 'sale_delivery' | 'order_booking' | 'receipt';
  date: string;
  tripId?: string;
  tripCode?: string;
  lorryPlate?: string;
  quarryName?: string;
  quarryLocation?: string;
  deliveryLocation?: string;
  stoneItem: string;
  pieces: number;
  piecesDamaged?: number;
  sqft: number;
  rate?: number;
  agreedRate?: number;
  purchaseAmount?: number;
  invoiceAmount?: number;
  hamaliAmount?: number;
  otherExpenses?: number;
  damageDeduction?: number;
  grossAmount?: number;
  paidAmount?: number;
  amountReceived?: number;
  balance?: number;
  runningBalance?: number;
  paymentDate?: string;
  paymentMethod?: string;
  reference?: string;
  billNumber?: string;
  invoiceNumber?: string;
  status: string;
  deliveryStatus?: string;
  notes?: string;
}

export interface PartyLedgerData {
  party: {
    id: string;
    name: string;
    role: 'supplier' | 'customer';
    location?: string;
    district?: string;
    phone?: string;
    email?: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    openingBalance: number;
    totalPurchases?: number;
    totalCharges?: number;
    grossTotal?: number;
    totalPaid?: number;
    totalInvoiced?: number;
    totalReceived?: number;
    totalDamages?: number;
    closingBalance: number;
    totalPieces: number;
    transactionCount: number;
    lastTransactionDate: string;
  };
  transactions: LedgerTransaction[];
}