import { api } from './apiClient';
import type { Driver, Lorry, Order, OrderStatus, Trip, AppNotification, LoadingParty, UnloadingParty, StoneSpec, DistrictRate } from '../data/types';

// ─── Drivers ────────────────────────────────────────────────────────────────
export const driversApi = {
  getAll: () => api.get<Driver[]>('/drivers'),
  getById: (id: string) => api.get<Driver>(`/drivers/${id}`),
  create: (data: Partial<Driver>) => api.post<Driver>('/drivers', data),
  update: (id: string, data: Partial<Driver>) => api.put<Driver>(`/drivers/${id}`, data)
};

// ─── Lorries ─────────────────────────────────────────────────────────────────
export const lorriesApi = {
  getAll: () => api.get<Lorry[]>('/lorries'),
  getById: (id: string) => api.get<Lorry>(`/lorries/${id}`),
  create: (data: Partial<Lorry>) => api.post<Lorry>('/lorries', data),
  update: (id: string, data: Partial<Lorry>) => api.put<Lorry>(`/lorries/${id}`, data)
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: () => api.get<Order[]>('/orders'),
  create: (data: Partial<Order>) => api.post<Order>('/orders', data),
  updateStatus: (id: string, status: OrderStatus, amountPaid?: number) =>
    api.put<Order>(`/orders/${id}/status`, { status, amountPaid })
};

// ─── Trips ───────────────────────────────────────────────────────────────────
export const tripsApi = {
  getAll: () => api.get<Trip[]>('/trips'),
  getById: (id: string) => api.get<Trip>(`/trips/${id}`),
  create: (data: Partial<Trip>) => api.post<Trip>('/trips', data),
  update: (id: string, data: Partial<Trip>) => api.put<Trip>(`/trips/${id}`, data)
};

// ─── Loading Parties ──────────────────────────────────────────────────────────
export const loadingPartiesApi = {
  getAll: () => api.get<LoadingParty[]>('/loading-parties'),
  getById: (id: string) => api.get<LoadingParty>(`/loading-parties/${id}`),
  create: (data: Partial<LoadingParty> & { supervisorUsername?: string }) => 
    api.post<{ success: boolean; data: LoadingParty }>('/loading-parties', data),
  update: (id: string, data: Partial<LoadingParty>) => api.put<LoadingParty>(`/loading-parties/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/loading-parties/${id}`)
};

// ─── Unloading Parties ────────────────────────────────────────────────────────
export const unloadingPartiesApi = {
  getAll: () => api.get<UnloadingParty[]>('/unloading-parties'),
  create: (data: Partial<UnloadingParty> & { supervisorUsername?: string }) =>
    api.post<{ success: boolean; data: UnloadingParty }>('/unloading-parties', data)
};

// ─── Stone Rates ─────────────────────────────────────────────────────────────
export const stoneRatesApi = {
  getAll: () => api.get<StoneSpec[]>('/stone-rates'),
  create: (data: Partial<StoneSpec>) => api.post<{ success: boolean; data: StoneSpec }>('/stone-rates', data),
  update: (id: string, ratePerSqft: number) => api.put<{ success: boolean; data: StoneSpec }>(`/stone-rates/${id}`, { ratePerSqft })
};

// ─── District Rates ──────────────────────────────────────────────────────────
export const districtRatesApi = {
  getAll: () => api.get<DistrictRate[]>('/district-rates'),
  create: (data: Partial<DistrictRate>) => api.post<{ success: boolean; data: DistrictRate }>('/district-rates', data),
  update: (id: string, ratePerSqft: number) => api.put<{ success: boolean; data: DistrictRate }>(`/district-rates/${id}`, { ratePerSqft })
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get<AppNotification[]>('/notifications'),
  markAllRead: () => api.put<{ message: string }>('/notifications/read-all', {})
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
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

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (credentials: any) => api.post<any>('/auth/login', credentials),
  register: (data: any) => api.post<any>('/auth/register', data),
  refresh: (token: string) => api.post<any>('/auth/refresh', { refreshToken: token }),
  getMe: () => api.get<{ success: boolean; user: any }>('/auth/me'),
  updateProfile: (data: { name: string; phone?: string }) => api.put<{ success: boolean; user: any }>('/auth/profile', data),
  changePassword: (data: any) => api.put<{ success: boolean; message?: string }>('/auth/change-password', data)
};
