import { api } from './apiClient';
import type {
  Driver,
  Lorry,
  Order,
  OrderStatus,
  Trip,
  AppNotification,
  LoadingParty,
  UnloadingParty,
  StoneSpec,
  DistrictRate,
  LoadingEntry,
  UnloadingAllocation,
  PaymentRecord,
  PartyLedgerData,
  OrderReassignmentRecord
} from '../data/types';

// â”€â”€â”€ Drivers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const driversApi = {
  getAll: () => api.get<Driver[]>('/drivers'),
  getById: (id: string) => api.get<Driver>(`/drivers/${id}`),
  create: (data: Partial<Driver>) => api.post<Driver>('/drivers', data),
  update: (id: string, data: Partial<Driver>) => api.put<Driver>(`/drivers/${id}`, data),
  delete: (id: string, customToken?: string) =>
    api.delete<{ success: boolean; message: string }>(`/drivers/${id}`, {
      ...(customToken ? { headers: { Authorization: `Bearer ${customToken}` } } : {})
    })
};

export interface LorryStatsData {
  lorry: {
    id: string;
    plate: string;
    status: string;
    location: string;
    capacitySqft: number;
    driverId: string | null;
    driverName: string | null;
    addedOn: string;
  };
  summary: {
    totalTrips: number;
    activeTrips: number;
    deliveredTrips: number;
    totalRevenue: number;
    totalExpenses: number;
    totalWages: number;
    netProfit: number;
    totalFuelAmount: number;
    totalFuelLiters: number;
    capacitySqft: number;
  };
  expenseCategories: Array<{ label: string; amount: number }>;
  activeTrip: {
    id: string;
    code: string;
    status: string;
    date: string;
    origin: string;
  } | null;
  recentTrips: Array<{
    id: string;
    code: string;
    status: string;
    date: string;
    origin: string;
    unloadingPartyId: string;
    amountPaid: number;
  }>;
}

export const lorriesApi = {
  getAll: () => api.get<Lorry[]>('/lorries'),
  getById: (id: string) => api.get<Lorry>(`/lorries/${id}`),
  getStats: (id: string) => api.get<{ success: boolean; data: LorryStatsData }>(`/lorries/${id}/stats`),
  create: (data: Partial<Lorry>) => api.post<Lorry>('/lorries', data),
  update: (id: string, data: Partial<Lorry>) => api.put<Lorry>(`/lorries/${id}`, data)
};

// â”€â”€â”€ Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ordersApi = {
  getAll: () => api.get<Order[]>('/orders'),
  create: (data: Partial<Order>) => api.post<Order>('/orders', data),
  updateStatus: (id: string, status: OrderStatus, amountPaid?: number) =>
    api.put<Order>(`/orders/${id}/status`, { status, amountPaid }),
  delete: (id: string, customToken?: string) =>
    api.delete<{ success: boolean; message: string }>(`/orders/${id}`, {
      ...(customToken ? { headers: { Authorization: `Bearer ${customToken}` } } : {})
    })
};

// â”€â”€â”€ Trips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const tripsApi = {
  getAll: () => api.get<Trip[]>('/trips'),
  getById: (id: string) => api.get<Trip>(`/trips/${id}`),
  create: (data: Partial<Trip>) => api.post<Trip>('/trips', data),
  update: (id: string, data: Partial<Trip>) => api.put<Trip>(`/trips/${id}`, data)
};

// â”€â”€â”€ Loading Parties â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const loadingPartiesApi = {
  getAll: () => api.get<LoadingParty[]>('/loading-parties'),
  getById: (id: string) => api.get<LoadingParty>(`/loading-parties/${id}`),
  create: (data: Partial<LoadingParty> & { supervisorUsername?: string }) => 
    api.post<{ success: boolean; data: LoadingParty }>('/loading-parties', data),
  update: (id: string, data: Partial<LoadingParty>) => api.put<LoadingParty>(`/loading-parties/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/loading-parties/${id}`)
};

// â”€â”€â”€ Unloading Parties â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const unloadingPartiesApi = {
  getAll: () => api.get<UnloadingParty[]>('/unloading-parties'),
  create: (data: Partial<UnloadingParty> & { supervisorUsername?: string }) =>
    api.post<{ success: boolean; data: UnloadingParty }>('/unloading-parties', data)
};

// â”€â”€â”€ Stone Rates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const stoneRatesApi = {
  getAll: () => api.get<StoneSpec[]>('/stone-rates'),
  create: (data: Partial<StoneSpec>) => api.post<{ success: boolean; data: StoneSpec }>('/stone-rates', data),
  update: (id: string, ratePerSqft: number) => api.put<{ success: boolean; data: StoneSpec }>(`/stone-rates/${id}`, { ratePerSqft })
};

// â”€â”€â”€ District Rates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const districtRatesApi = {
  getAll: () => api.get<DistrictRate[]>('/district-rates'),
  create: (data: Partial<DistrictRate>) => api.post<{ success: boolean; data: DistrictRate }>('/district-rates', data),
  update: (id: string, ratePerSqft: number) => api.put<{ success: boolean; data: DistrictRate }>(`/district-rates/${id}`, { ratePerSqft })
};

// ─── Stone Catalog ────────────────────────────────────────────────────────
export const catalogApi = {
  getAll: () => api.get<{ success: boolean; data: any[] }>('/catalog'),
  getByCode: (code: string) => api.get<{ success: boolean; data: any }>(`/catalog/${code}`)
};

// â”€â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const notificationsApi = {
  getAll: () => api.get<AppNotification[]>('/notifications'),
  markAllRead: () => api.put<{ message: string }>('/notifications/read-all', {})
};

// â”€â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface OwnerDashboardData {
  summary: {
    totalTrips: number;
    activeDrivers: number;
    activeLorries: number;
    pendingOrders: number;
    totalRevenue: number;
    pendingPayments: number;
    totalExpenses: number;
    totalWages: number;
    netRevenue: number;
  };
  fleetBreakdown: {
    active: number;
    idle: number;
    maintenance: number;
    loading: number;
    inTransit: number;
  };
  recentTrips: Array<{
    id: string;
    code: string;
    lorryId: string;
    driverId: string;
    status: string;
    date: string;
    revenue: number;
  }>;
  loadingPartyBalances: Array<{
    id: string;
    name: string;
    location: string;
    totalPurchased: number;
    paid: number;
    pending: number;
  }>;
  unloadingPartyBalances: Array<{
    id: string;
    name: string;
    district: string;
    totalOrdered: number;
    paid: number;
    pending: number;
    ordersCount: number;
  }>;
}

export const dashboardApi = {
  getOwner: () => api.get<{ success: boolean; data: OwnerDashboardData; message?: string }>('/dashboard/owner'),
  getBuyer: (buyerId?: string) => api.get<{ success: boolean; data: any }>(`/dashboard/buyer${buyerId ? `?buyerId=${buyerId}` : ''}`)
};

// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const authApi = {
  login: (credentials: any) => api.post<any>('/auth/login', credentials),
  register: (data: any) => api.post<any>('/auth/register', data),
  refresh: (token: string) => api.post<any>('/auth/refresh', { refreshToken: token }),
  getMe: () => api.get<{ success: boolean; user: any }>('/auth/me'),
  updateProfile: (data: { name: string; phone?: string }) => api.put<{ success: boolean; user: any }>('/auth/profile', data),
  changePassword: (data: any) => api.put<{ success: boolean; message?: string }>('/auth/change-password', data)
};

// ─── Multi-Quarry Loading Operations ─────────────────────────────────────────
export const tripLoadingApi = {
  getEntries: (tripId: string) =>
    api.get<{
      success: boolean;
      tripId: string;
      tripCode: string;
      summary: {
        totalPieces: number;
        totalSqft: number;
        totalLoadingValue: number;
        totalHamali: number;
        totalOtherExpenses: number;
        totalLoadingCost: number;
        quarriesCount: number;
      };
      quarryWiseSummary: Array<{
        quarryName: string;
        quarryLocation: string;
        loadingPartyId: string;
        pieces: number;
        sqft: number;
        value: number;
        hamali: number;
        otherExpenses: number;
        entriesCount: number;
      }>;
      loadingEntries: LoadingEntry[];
    }>(`/trips/${tripId}/loading-entries`),

  addEntry: (tripId: string, data: Partial<LoadingEntry>) =>
    api.post<{ success: boolean; message: string; data: LoadingEntry; loadingEntries: LoadingEntry[] }>(
      `/trips/${tripId}/loading-entries`,
      data
    ),

  updateEntry: (tripId: string, entryId: string, data: Partial<LoadingEntry> & { editReason?: string }) =>
    api.patch<{ success: boolean; message: string; data: LoadingEntry }>(
      `/trips/${tripId}/loading-entries/${entryId}`,
      data
    ),

  deleteEntry: (tripId: string, entryId: string) =>
    api.delete<{ success: boolean; message: string; loadingEntries: LoadingEntry[] }>(
      `/trips/${tripId}/loading-entries/${entryId}`
    )
};

// ─── Multiple Unloading Parties & Allocations ────────────────────────────────
export const tripUnloadingApi = {
  getAllocations: (tripId: string) =>
    api.get<{
      success: boolean;
      tripId: string;
      tripCode: string;
      summary: {
        totalAllocations: number;
        totalAssignedPieces: number;
        totalDeliveredPieces: number;
        totalBilled: number;
        totalReceived: number;
        totalOutstanding: number;
      };
      allocations: UnloadingAllocation[];
    }>(`/trips/${tripId}/unloading-allocations`),

  addAllocation: (tripId: string, data: Partial<UnloadingAllocation>) =>
    api.post<{ success: boolean; message: string; data: UnloadingAllocation }>(
      `/trips/${tripId}/unloading-allocations`,
      data
    ),

  updateAllocation: (tripId: string, allocationId: string, data: Partial<UnloadingAllocation> & { editReason?: string }) =>
    api.patch<{ success: boolean; message: string; data: UnloadingAllocation }>(
      `/trips/${tripId}/unloading-allocations/${allocationId}`,
      data
    ),

  recordDelivery: (
    tripId: string,
    allocationId: string,
    data: {
      piecesDelivered: number;
      piecesDamaged?: number;
      piecesRejected?: number;
      damageReason?: string;
      amountReceived?: number;
      proofOfDelivery?: string;
      deliveryNotes?: string;
    }
  ) =>
    api.post<{ success: boolean; message: string; data: UnloadingAllocation }>(
      `/trips/${tripId}/unloading-allocations/${allocationId}/deliveries`,
      data
    ),

  cancelAllocation: (tripId: string, allocationId: string, cancellationReason: string) =>
    api.post<{
      success: boolean;
      message: string;
      availablePiecesForReassignment: number;
      data: UnloadingAllocation;
    }>(`/trips/${tripId}/unloading-allocations/${allocationId}/cancel`, { cancellationReason }),

  reassignOrder: (
    tripId: string,
    data: {
      originalAllocationId: string;
      cancellationReason: string;
      alternativePartyId: string;
      alternativePartyName?: string;
      newDeliveryLocation: string;
      newAgreedRate: number;
      reassignedQuantityPieces: number;
      extraTransportCost?: number;
      extraHamaliCost?: number;
      notes?: string;
    }
  ) =>
    api.post<{
      success: boolean;
      message: string;
      reassignment: OrderReassignmentRecord;
      newAllocation: UnloadingAllocation;
      originalAllocation: UnloadingAllocation;
    }>(`/trips/${tripId}/reassign-unloaded-order`, data),

  getAllocationHistory: (tripId: string) =>
    api.get<{
      success: boolean;
      tripId: string;
      tripCode: string;
      allocations: UnloadingAllocation[];
      reassignments: OrderReassignmentRecord[];
    }>(`/trips/${tripId}/allocation-history`)
};

// ─── Authoritative Party Ledgers & Statements ────────────────────────────────
export const ledgerApi = {
  getPartyLedger: (
    partyId: string,
    params?: { startDate?: string; endDate?: string; tripId?: string; lorryId?: string; role?: 'supplier' | 'customer'; search?: string }
  ) =>
    api.get<{ success: boolean; data: PartyLedgerData }>(
      `/parties/${partyId}/ledger${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
    ),

  getPartyStatement: (
    partyId: string,
    params?: { startDate?: string; endDate?: string; role?: 'supplier' | 'customer' }
  ) =>
    api.get<{ success: boolean; data: PartyLedgerData }>(
      `/parties/${partyId}/statement${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
    ),

  getPartyOutstanding: (partyId: string, role?: 'supplier' | 'customer') =>
    api.get<{ success: boolean; party: any; outstandingBalance: number; summary: any }>(
      `/parties/${partyId}/outstanding${role ? `?role=${role}` : ''}`
    ),

  getStatementPdfUrl: (
    partyId: string,
    params?: { startDate?: string; endDate?: string; role?: 'supplier' | 'customer'; search?: string }
  ) => {
    const base = (import.meta.env.VITE_API_URL || 'https://transport-management-backend-xmzn.onrender.com/api').replace(/\/+$/, '');
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return `${base}/parties/${partyId}/statement.pdf${qs}`;
  }
};

// ─── Payments & Financial Settlements ────────────────────────────────────────
export const paymentsApi = {
  getAll: (params?: { partyId?: string; partyType?: 'supplier' | 'customer'; startDate?: string; endDate?: string; tripId?: string }) =>
    api.get<{ success: boolean; count: number; data: PaymentRecord[] }>(
      `/payments${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
    ),

  getById: (paymentId: string) =>
    api.get<{ success: boolean; data: PaymentRecord }>(`/payments/${paymentId}`),

  create: (data: Partial<PaymentRecord>) =>
    api.post<{ success: boolean; message: string; data: PaymentRecord }>('/payments', data),

  updateStatus: (paymentId: string, data: { status?: 'completed' | 'reversed'; notes?: string; reference?: string }) =>
    api.patch<{ success: boolean; message: string; data: PaymentRecord }>(`/payments/${paymentId}`, data)
};


