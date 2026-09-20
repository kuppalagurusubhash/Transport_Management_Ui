import React, { useCallback, useState, createContext, useContext } from 'react';
import {
  orderTotal,
  type Order,
  type OrderStatus,
  type AppNotification,
  type Trip,
  type Lorry,
  type Driver,
  type StoneLine,
  type WorkerPayment,
  type ExpenseReview,
  type LoadingParty,
  type UnloadingParty,
  type StoneSpec,
  type DistrictRate,
  type LoadingPartyPayment,
  type ExpenseCategory,
  type ExpenseLine
} from '../data/types';
import { ordersApi, tripsApi, lorriesApi, driversApi, notificationsApi, loadingPartiesApi, unloadingPartiesApi, stoneRatesApi, districtRatesApi } from '../api/index';
interface OrdersContextValue {
  orders: Order[];
  notifications: AppNotification[];
  unreadCount: number;
  trips: Trip[];
  lorries: Lorry[];
  drivers: Driver[];
  loadingParties: LoadingParty[];
  unloadingParties: UnloadingParty[];
  stoneSpecs: StoneSpec[];
  districtRates: DistrictRate[];
  placeOrder: (
    order: Omit<Order, 'id' | 'code' | 'placedAt' | 'status' | 'amountPaid'>
  ) => Order;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  assignOrderToLorry: (orderId: string, lorryId: string, driverId: string) => void;
  addLoadToTrip: (
    tripId: string,
    loadingPartyId: string,
    stoneLines: Omit<StoneLine, 'id'>[],
    workerPayments: Omit<WorkerPayment, 'id'>[]
  ) => void;
  dispatchTrip: (tripId: string) => void;
  addLorry: (lorryData: Omit<Lorry, 'id' | 'addedOn'>) => void;
  retireLorry: (id: string) => void;
  updateLorry: (id: string, updates: Partial<Lorry>) => void;
  addDriver: (driverData: Omit<Driver, 'id' | 'tripsCompleted'>) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  addLoadingParty: (partyData: Omit<LoadingParty, 'id' | 'totalPurchased' | 'paid' | 'pending'> & { supervisorUsername?: string }) => void;
  updateLoadingParty: (id: string, updates: Partial<LoadingParty>) => void;
  deleteLoadingParty: (id: string) => void;
  addExpenseToTrip: (tripId: string, label: string, amount: number, category?: ExpenseCategory, receiptUrl?: string, notes?: string) => void;
  addBatchExpensesToTrip: (tripId: string, expenses: Array<{ label: string; amount: number; category?: ExpenseCategory; receiptUrl?: string; notes?: string }>) => void;
  setExpenseReviewStatus: (tripId: string, expenseId: string, review: ExpenseReview) => void;
  updateTripPayments: (tripId: string, partyToDriverCash: number, partyToOwnerPhonePe: number, damagedPieces?: number, damageDeduction?: number) => void;
  updateLoadingPartyPayments: (tripId: string, payments: LoadingPartyPayment[]) => void;
  batchUpdateLoadingPartyPayments: (updates: { tripId: string; payments: LoadingPartyPayment[] }[]) => void;
  updateStoneRate: (id: string, rate: number) => void;
  updateDistrictRate: (id: string, rate: number) => void;
  addStoneRate: (stoneRateData: Omit<StoneSpec, 'id'>) => Promise<void>;
  addDistrictRate: (districtRateData: Omit<DistrictRate, 'id'>) => Promise<void>;
  completeTrip: (tripId: string) => void;
  syncDatabase: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

let orderSeq = 2052;
let notifSeq = 100;

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [lorries, setLorries] = useState<Lorry[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingParties, setLoadingParties] = useState<LoadingParty[]>([]);
  const [unloadingParties, setUnloadingParties] = useState<UnloadingParty[]>([]);
  const [stoneSpecs, setStoneSpecs] = useState<StoneSpec[]>([]);
  const [districtRates, setDistrictRates] = useState<DistrictRate[]>([]);

  // Mount API database Synchronization
  const syncDatabase = useCallback(async () => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) return;

    try {
      console.log("%c[Database Sync] Querying live logistics records from MongoDB...", "color: #d4af37; font-weight: bold;");
      const [
        apiOrders,
        apiTrips,
        apiLorries,
        apiDrivers,
        apiNotifications,
        apiLoadingParties,
        apiUnloadingParties,
        apiStoneSpecs,
        apiDistrictRates
      ] = await Promise.all([
        ordersApi.getAll().catch(() => []),
        tripsApi.getAll().catch(() => []),
        lorriesApi.getAll().catch(() => []),
        driversApi.getAll().catch(() => []),
        notificationsApi.getAll().catch(() => []),
        loadingPartiesApi.getAll().catch(() => []),
        unloadingPartiesApi.getAll().catch(() => []),
        stoneRatesApi.getAll().catch(() => []),
        districtRatesApi.getAll().catch(() => [])
      ]);

      const tripsData = Array.isArray(apiTrips) ? apiTrips : [];
      setTrips(tripsData);

      if (Array.isArray(apiOrders)) {
        const computedOrders = apiOrders.map((order) => {
          const orderTrips = tripsData.filter((t) => t.orderId === order.id);
          const totalPaid = orderTrips.reduce((sum, t) => {
            const cash = t.partyToDriverCash || 0;
            const phonepe = t.partyToOwnerPhonePe || 0;
            const deduction = t.damageDeduction || 0;
            return sum + cash + phonepe + deduction;
          }, 0);
          return {
            ...order,
            amountPaid: totalPaid > 0 ? totalPaid : (order.amountPaid || 0)
          };
        });
        setOrders(computedOrders);
      } else {
        setOrders([]);
      }

      setLorries(Array.isArray(apiLorries) ? apiLorries : []);
      setDrivers(Array.isArray(apiDrivers) ? apiDrivers : []);
      setNotifications(Array.isArray(apiNotifications) ? apiNotifications : []);
      setLoadingParties(Array.isArray(apiLoadingParties) ? apiLoadingParties : []);
      setUnloadingParties(Array.isArray(apiUnloadingParties) ? apiUnloadingParties : []);
      setStoneSpecs(Array.isArray(apiStoneSpecs) ? apiStoneSpecs : []);
      setDistrictRates(Array.isArray(apiDistrictRates) ? apiDistrictRates : []);
      
      console.log("%c[Database Sync] Live state synchronized with database.", "color: #22c55e; font-weight: bold;");
    } catch (err: any) {
      console.warn(`%c[Database Sync] Error during synchronization: ${err.message}`, "color: #ef4444; font-weight: bold;");
    }
  }, []);

  React.useEffect(() => {
    syncDatabase();
  }, [syncDatabase]);

  const placeOrder: OrdersContextValue['placeOrder'] = useCallback((draft) => {
    const id = `o${Date.now()}`;
    const code = `ORD-${orderSeq++}`;
    const order: Order = {
      ...draft,
      id,
      code,
      status: 'placed',
      placedAt: new Date().toISOString(),
      amountPaid: 0
    };
    
    // Optimistic local state update
    setOrders((prev) => [order, ...prev]);

    // Backend database query
    ordersApi.create(order).catch(err => {
      console.warn('[OrdersContext Fallback] Could not persist new order to backend database:', err.message);
    });

    const buyer = unloadingParties.find((up) => up.id === order.unloadingPartyId);
    const notif: AppNotification = {
      id: `n${notifSeq++}`,
      kind: 'order',
      title: `New order · ${code}`,
      body: `${buyer?.name ?? 'A buyer'} (${order.district}) placed an order for ₹${Math.round(orderTotal(order)).toLocaleString('en-IN')}`,
      time: 'just now',
      read: false,
      orderId: id
    };
    setNotifications((prev) => [notif, ...prev]);
    return order;
  }, []);

  const setOrderStatus: OrdersContextValue['setOrderStatus'] = useCallback(
    (orderId, status) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const updatedAmountPaid = status === 'paid' ? orderTotal(o) : o.amountPaid;

          ordersApi.updateStatus(orderId, status, updatedAmountPaid).catch(err => {
            console.warn('[OrdersContext Fallback] Could not update order status in backend database:', err.message);
          });

          return {
            ...o,
            status,
            amountPaid: updatedAmountPaid
          };
        })
      );
    },
    []
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              read: true
            }
          : n
      )
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read: true
      }))
    );

    // Call API to read all notifications on the backend
    notificationsApi.markAllRead().catch(err => {
      console.warn('[OrdersContext Fallback] Could not read all notifications on backend database:', err.message);
    });
  }, []);

  const assignOrderToLorry = useCallback((orderId: string, lorryId: string, driverId: string) => {
    // 1. Update order status to confirmed
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'confirmed' } : o))
    );

    ordersApi.updateStatus(orderId, 'confirmed').catch(err => {
      console.warn('[OrdersContext Fallback] Could not persist order status update to confirmed on database backend:', err.message);
    });

    // 2. Update Lorry
    setLorries((prev) =>
      prev.map((l) =>
        l.id === lorryId
          ? {
              ...l,
              driverId,
              status: 'active',
              location: 'Loading — Ramapuram yard'
            }
          : l
      )
    );

    // 3. Update Driver
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? { ...d, status: 'active', lorryId }
          : d
      )
    );

    // Persist Lorry and Driver updates to backend
    lorriesApi.update(lorryId, {
      driverId,
      status: 'active',
      location: 'Loading — Ramapuram yard'
    }).catch(err => {
      console.warn('[OrdersContext Fallback] Could not update lorry status on backend database:', err.message);
    });

    driversApi.update(driverId, {
      status: 'active',
      lorryId
    }).catch(err => {
      console.warn('[OrdersContext Fallback] Could not update driver status on backend database:', err.message);
    });

    // 4. Create Trip
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setTrips((prev) => {
      const tripCode = `TRP-${1043 + prev.length}`;
      const newTrip: Trip = {
        id: `t-${Date.now()}`,
        code: tripCode,
        lorryId,
        driverId,
        origin: 'Ramapuram',
        unloadingPartyId: order.unloadingPartyId,
        status: 'loading',
        date: new Date().toISOString().split('T')[0],
        stoneLines: [],
        workerPayments: [],
        expenses: [],
        amountPaid: 0,
        orderId
      };

      // Backend database query
      tripsApi.create(newTrip).catch(err => {
        console.warn('[OrdersContext Fallback] Could not persist new trip to backend database:', err.message);
      });

      const buyerName = unloadingParties.find((up) => up.id === order.unloadingPartyId)?.name || 'Buyer';
      const plate = lorries.find((l) => l.id === lorryId)?.plate || 'Lorry';
      const notif: AppNotification = {
        id: `n${notifSeq++}`,
        kind: 'order',
        title: `Lorry ${plate} Assigned`,
        body: `Assigned for ${buyerName} (${order.district}). Pending loading in Ramapuram.`,
        time: 'just now',
        read: false,
        orderId
      };
      setNotifications((prevNotifs) => [notif, ...prevNotifs]);

      return [newTrip, ...prev];
    });
  }, [orders, lorries]);

  const addLoadToTrip = useCallback((
    tripId: string,
    loadingPartyId: string,
    stoneLines: Omit<StoneLine, 'id'>[],
    workerPayments: Omit<WorkerPayment, 'id'>[]
  ) => {
    const linesWithId = stoneLines.map((line, idx) => ({
      ...line,
      id: `sl-${Date.now()}-${idx}`
    }));

    const workersWithId = workerPayments.map((w, idx) => ({
      ...w,
      id: `w-${Date.now()}-${idx}`
    }));

    let updatedTrip: Trip | null = null;

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        
        updatedTrip = {
          ...t,
          stoneLines: [...t.stoneLines, ...linesWithId],
          workerPayments: [...t.workerPayments, ...workersWithId]
        };
        return updatedTrip;
      })
    );

    // Persist changes to backend database
    if (updatedTrip) {
      tripsApi.update(tripId, { 
        stoneLines: (updatedTrip as Trip).stoneLines, 
        workerPayments: (updatedTrip as Trip).workerPayments 
      }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not persist load line updates on database backend:', err.message);
      });
    }

    const loadingPartyName = loadingParties.find((lp) => lp.id === loadingPartyId)?.name || 'Ramapuram Loading Party';
    const notif: AppNotification = {
      id: `n${notifSeq++}`,
      kind: 'order',
      title: `Load Added`,
      body: `${loadingPartyName} loaded stones onto lorry.`,
      time: 'just now',
      read: false
    };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  const dispatchTrip = useCallback((tripId: string) => {
    let orderIdToUpdate: string | undefined;
    let targetTrip: Trip | null = null;
    let nextTrips: Trip[] = [];

    setTrips((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== tripId) return t;
        orderIdToUpdate = t.orderId;

        // Update lorry location locally and on backend
        setLorries((lorriesPrev) =>
          lorriesPrev.map((l) => {
            if (l.id === t.lorryId) {
              lorriesApi.update(l.id, { location: `En route — dispatched from Ramapuram` }).catch(err => {
                console.warn('[OrdersContext Fallback] Could not persist lorry location update to backend database:', err.message);
              });
              return { ...l, location: `En route — dispatched from Ramapuram` };
            }
            return l;
          })
        );

        targetTrip = {
          ...t,
          status: 'in-transit' as const
        };
        return targetTrip;
      });
      nextTrips = updated;
      return updated;
    });

    // Persist status change to backend database
    if (targetTrip) {
      tripsApi.update(tripId, { status: 'in-transit' }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not persist trip status update to in-transit on database backend:', err.message);
      });
    }

    if (orderIdToUpdate) {
      const targetOrderId = orderIdToUpdate;
      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          if (o.id !== targetOrderId) return o;

          const orderTrips = nextTrips.filter((t) => t.orderId === targetOrderId);
          const totalOrdered = o.lines.reduce((sum, line) => sum + line.pieces, 0);
          const totalLoaded = orderTrips.reduce((sum, t) => {
            return sum + t.stoneLines.reduce((s, line) => s + line.pieces, 0);
          }, 0);

          const allTripsDispatchedOrDone = orderTrips.every((t) => t.status !== 'loading');
          const isFullyLoaded = totalLoaded >= totalOrdered;

          let newStatus: OrderStatus = 'confirmed';
          if (isFullyLoaded && allTripsDispatchedOrDone) {
            const allTripsDeliveredOrPaid = orderTrips.every(
              (t) => t.status === 'delivered' || t.status === 'paid'
            );
            newStatus = allTripsDeliveredOrPaid ? 'delivered' : 'dispatched';
          } else {
            newStatus = 'confirmed';
          }

          ordersApi.updateStatus(targetOrderId, newStatus).catch(err => {
            console.warn('[OrdersContext Fallback] Could not persist order status update on database backend:', err.message);
          });
          return { ...o, status: newStatus };
        })
      );
    }

    const notif: AppNotification = {
      id: `n${notifSeq++}`,
      kind: 'order',
      title: `Lorry Dispatched`,
      body: `Loaded lorry has dispatched and is en route to destination.`,
      time: 'just now',
      read: false
    };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  const addLorry = useCallback((lorryData: Omit<Lorry, 'id' | 'addedOn'>) => {
    const lorryId = `l${Date.now()}`;
    const newLorry: Lorry = {
      ...lorryData,
      id: lorryId,
      addedOn: new Date().toISOString().slice(0, 10)
    };
    setLorries((prev) => [newLorry, ...prev]);

    lorriesApi.create(newLorry).catch(err => {
      console.warn('[OrdersContext Fallback] Could not persist new lorry to backend database:', err.message);
    });

    // Sync assigned driver's state
    const driverId = lorryData.driverId;
    if (driverId) {
      // Unassign this driver from any other lorry
      setLorries((prev) =>
        prev.map((l) => {
          if (l.id !== lorryId && l.driverId === driverId) {
            lorriesApi.update(l.id, { driverId: null }).catch(err => {
              console.warn('[OrdersContext Fallback] Could not unassign driver from other lorry on backend:', err.message);
            });
            return { ...l, driverId: null };
          }
          return l;
        })
      );

      // Assign driver to this new lorry
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, lorryId, status: 'active' } : d))
      );
      driversApi.update(driverId, { lorryId, status: 'active' }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not update driver status on backend database:', err.message);
      });
    }
  }, []);

  const retireLorry = useCallback((id: string) => {
    setLorries((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: 'sold' as const,
              driverId: null
            }
          : l
      )
    );

    lorriesApi.update(id, { status: 'sold', driverId: null }).catch(err => {
      console.warn('[OrdersContext Fallback] Could not persist retired lorry status to backend database:', err.message);
    });
  }, []);

  const updateLorry = useCallback((id: string, updates: Partial<Lorry>) => {
    let oldDriverId: string | null = null;
    let newDriverId: string | null | undefined = updates.driverId;

    setLorries((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        oldDriverId = l.driverId;
        return { ...l, ...updates };
      })
    );

    lorriesApi.update(id, updates).catch(err => {
      console.warn('[OrdersContext Fallback] Could not update lorry on backend:', err.message);
    });

    // Sync Driver relations
    if (newDriverId !== undefined && newDriverId !== oldDriverId) {
      // 1. Unassign old driver
      if (oldDriverId) {
        setDrivers((prev) =>
          prev.map((d) => (d.id === oldDriverId ? { ...d, lorryId: null, status: 'idle' } : d))
        );
        driversApi.update(oldDriverId, { lorryId: null, status: 'idle' }).catch(err => {
          console.warn('[OrdersContext Fallback] Could not update old driver state on backend:', err.message);
        });
      }

      // 2. Assign new driver
      if (newDriverId) {
        // Unassign this new driver from any other lorry
        setLorries((prev) =>
          prev.map((l) => {
            if (l.id !== id && l.driverId === newDriverId) {
              lorriesApi.update(l.id, { driverId: null }).catch(err => {
                console.warn('[OrdersContext Fallback] Could not unassign driver from other lorry on backend:', err.message);
              });
              return { ...l, driverId: null };
            }
            return l;
          })
        );

        // Update driver state
        setDrivers((prev) =>
          prev.map((d) => (d.id === newDriverId ? { ...d, lorryId: id, status: 'active' } : d))
        );
        driversApi.update(newDriverId, { lorryId: id, status: 'active' }).catch(err => {
          console.warn('[OrdersContext Fallback] Could not update new driver state on backend:', err.message);
        });
      }
    }
  }, []);

  const addDriver = useCallback((driverData: Omit<Driver, 'id' | 'tripsCompleted'>) => {
    const driverId = `d${Date.now()}`;
    const newDriver: Driver = {
      ...driverData,
      id: driverId,
      tripsCompleted: 0
    };

    setDrivers((prev) => [newDriver, ...prev]);

    driversApi.create(newDriver).catch(err => {
      console.warn('[OrdersContext Fallback] Could not create new driver on backend:', err.message);
    });

    // If a lorry is assigned during driver creation, sync its state
    const lorryId = driverData.lorryId;
    if (lorryId) {
      // 1. Unassign any other driver from this lorry
      setDrivers((prev) =>
        prev.map((d) => {
          if (d.id !== driverId && d.lorryId === lorryId) {
            driversApi.update(d.id, { lorryId: null, status: 'idle' }).catch(err => {
              console.warn('[OrdersContext Fallback] Could not unassign lorry from other driver on backend:', err.message);
            });
            return { ...d, lorryId: null, status: 'idle' as const };
          }
          return d;
        })
      );

      // 2. Assign driver to this lorry
      setLorries((prev) =>
        prev.map((l) => (l.id === lorryId ? { ...l, driverId } : l))
      );
      lorriesApi.update(lorryId, { driverId }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not update lorry driver state on backend:', err.message);
      });
    }
  }, []);

  const updateDriver = useCallback((id: string, updates: Partial<Driver>) => {
    let oldLorryId: string | null = null;
    let newLorryId: string | null | undefined = updates.lorryId;

    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        oldLorryId = d.lorryId;
        return { ...d, ...updates };
      })
    );

    // Call API to update driver on backend
    driversApi.update(id, updates).catch(err => {
      console.warn('[OrdersContext Fallback] Could not update driver on backend:', err.message);
    });

    // Sync Lorry relations
    if (newLorryId !== undefined && newLorryId !== oldLorryId) {
      // 1. Unassign old lorry
      if (oldLorryId) {
        setLorries((prev) =>
          prev.map((l) => (l.id === oldLorryId ? { ...l, driverId: null } : l))
        );
        lorriesApi.update(oldLorryId, { driverId: null }).catch(err => {
          console.warn('[OrdersContext Fallback] Could not update old lorry state on backend:', err.message);
        });
      }

      // 2. Assign new lorry
      if (newLorryId) {
        // Unassign this new lorry from any other driver
        setDrivers((prev) =>
          prev.map((d) => {
            if (d.id !== id && d.lorryId === newLorryId) {
              driversApi.update(d.id, { lorryId: null, status: 'idle' }).catch(err => {
                console.warn('[OrdersContext Fallback] Could not unassign lorry from other driver on backend:', err.message);
              });
              return { ...d, lorryId: null, status: 'idle' as const };
            }
            return d;
          })
        );

        // Update lorry state
        setLorries((prev) =>
          prev.map((l) => (l.id === newLorryId ? { ...l, driverId: id } : l))
        );
        lorriesApi.update(newLorryId, { driverId: id }).catch(err => {
          console.warn('[OrdersContext Fallback] Could not update new lorry driver state on backend:', err.message);
        });
      }
    }
  }, []);

  const addLoadingParty = useCallback((partyData: Omit<LoadingParty, 'id' | 'totalPurchased' | 'paid' | 'pending'> & { supervisorUsername?: string }) => {
    const partyId = `lp${Date.now()}`;
    const newParty: LoadingParty = {
      ...partyData,
      id: partyId,
      totalPurchased: 0,
      paid: 0,
      pending: 0
    };

    setLoadingParties((prev) => [...prev, newParty]);

    loadingPartiesApi.create(newParty).catch(err => {
      console.warn('[OrdersContext Fallback] Could not create loading party on backend:', err.message);
    });
  }, []);

  const updateLoadingParty = useCallback((id: string, updates: Partial<LoadingParty>) => {
    setLoadingParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    loadingPartiesApi.update(id, updates).then((res) => {
      if (res) {
        setLoadingParties((prev) =>
          prev.map((p) => (p.id === id ? res : p))
        );
      }
    }).catch(err => {
      console.warn('[OrdersContext Fallback] Could not update loading party on backend:', err.message);
    });
  }, []);

  const deleteLoadingParty = useCallback((id: string) => {
    setLoadingParties((prev) => prev.filter((p) => p.id !== id));

    loadingPartiesApi.delete(id).catch(err => {
      console.warn('[OrdersContext Fallback] Could not delete loading party on backend:', err.message);
    });
  }, []);

  const updateStoneRate = useCallback((id: string, rate: number) => {
    setStoneSpecs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ratePerSqft: rate } : s))
    );

    stoneRatesApi.update(id, rate).catch(err => {
      console.warn('[OrdersContext Fallback] Could not update stone rate on backend:', err.message);
    });
  }, []);

  const updateDistrictRate = useCallback((id: string, rate: number) => {
    setDistrictRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ratePerSqft: rate } : r))
    );

    districtRatesApi.update(id, rate).catch(err => {
      console.warn('[OrdersContext Fallback] Could not update district rate on backend:', err.message);
    });
  }, []);

  const addStoneRate = useCallback(async (stoneRateData: Omit<StoneSpec, 'id'>) => {
    try {
      const res = await stoneRatesApi.create(stoneRateData);
      if (res && res.success && res.data) {
        setStoneSpecs((prev) => [...prev, res.data]);
      } else {
        const fallbackRate: StoneSpec = {
          ...stoneRateData,
          id: `sp-${Date.now()}`
        };
        setStoneSpecs((prev) => [...prev, fallbackRate]);
      }
    } catch (err: any) {
      console.warn('[OrdersContext Fallback] Could not create stone rate on backend, updating locally:', err.message);
      const fallbackRate: StoneSpec = {
        ...stoneRateData,
        id: `sp-${Date.now()}`
      };
      setStoneSpecs((prev) => [...prev, fallbackRate]);
    }
  }, []);

  const addDistrictRate = useCallback(async (districtRateData: Omit<DistrictRate, 'id'>) => {
    try {
      const res = await districtRatesApi.create(districtRateData);
      if (res && res.success && res.data) {
        setDistrictRates((prev) => [...prev, res.data]);
      } else {
        const fallbackRate: DistrictRate = {
          ...districtRateData,
          id: `dr-${Date.now()}`
        };
        setDistrictRates((prev) => [...prev, fallbackRate]);
      }
    } catch (err: any) {
      console.warn('[OrdersContext Fallback] Could not create district rate on backend, updating locally:', err.message);
      const fallbackRate: DistrictRate = {
        ...districtRateData,
        id: `dr-${Date.now()}`
      };
      setDistrictRates((prev) => [...prev, fallbackRate]);
    }
  }, []);

  const addExpenseToTrip = useCallback((
    tripId: string,
    label: string,
    amount: number,
    category?: ExpenseCategory,
    receiptUrl?: string,
    notes?: string
  ) => {
    let updatedTrip: Trip | null = null;
    
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        
        const newExpense: ExpenseLine = {
          id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          label: label.trim(),
          amount,
          review: 'pending',
          category: category || 'other',
          receiptUrl,
          notes,
          recordedAt: new Date().toISOString()
        };

        updatedTrip = {
          ...t,
          expenses: [...t.expenses, newExpense]
        };
        return updatedTrip;
      })
    );

    // Persist to backend database
    if (updatedTrip) {
      tripsApi.update(tripId, { expenses: (updatedTrip as Trip).expenses }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not save new expense on backend database:', err.message);
      });
    }
  }, []);

  const addBatchExpensesToTrip = useCallback((
    tripId: string,
    newExpenses: Array<{
      label: string;
      amount: number;
      category?: ExpenseCategory;
      receiptUrl?: string;
      notes?: string;
    }>
  ) => {
    if (!newExpenses || newExpenses.length === 0) return;

    let updatedTrip: Trip | null = null;
    const now = new Date().toISOString();

    const preparedExpenses: ExpenseLine[] = newExpenses.map((e, idx) => ({
      id: `e-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      label: e.label.trim(),
      amount: Number(e.amount),
      review: 'pending' as const,
      category: e.category || 'other',
      receiptUrl: e.receiptUrl,
      notes: e.notes || 'Analyzed from driver handwritten paper chit',
      recordedAt: now
    }));

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        
        updatedTrip = {
          ...t,
          expenses: [...t.expenses, ...preparedExpenses]
        };
        return updatedTrip;
      })
    );

    // Persist to backend database
    if (updatedTrip) {
      tripsApi.update(tripId, { expenses: (updatedTrip as Trip).expenses }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not save batch expenses on backend database:', err.message);
      });
    }

    // Add activity notification for owner
    const totalBatchSum = newExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const notif: AppNotification = {
      id: `n${notifSeq++}`,
      kind: 'order',
      title: `Driver Uploaded Handwritten Expenses`,
      body: `${preparedExpenses.length} expense items totaling ₹${totalBatchSum.toLocaleString('en-IN')} extracted from driver paper slip and noted for audit.`,
      time: 'just now',
      read: false
    };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  const setExpenseReviewStatus = useCallback((tripId: string, expenseId: string, review: ExpenseReview) => {
    let updatedTrip: Trip | null = null;
    
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        
        updatedTrip = {
          ...t,
          expenses: t.expenses.map((e) =>
            e.id === expenseId ? { ...e, review } : e
          )
        };
        return updatedTrip;
      })
    );

    // Persist to backend database
    if (updatedTrip) {
      tripsApi.update(tripId, { expenses: (updatedTrip as Trip).expenses }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not update expense review status on backend database:', err.message);
      });
    }
  }, []);

  const updateTripPayments = useCallback((tripId: string, partyToDriverCash: number, partyToOwnerPhonePe: number, damagedPieces = 0, damageDeduction = 0) => {
    let updatedTrip: Trip | null = null;
    let orderIdToUpdate: string | undefined;
    let nextTrips: Trip[] = [];
    
    setTrips((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== tripId) return t;
        orderIdToUpdate = t.orderId;
        
        updatedTrip = {
          ...t,
          partyToDriverCash,
          partyToOwnerPhonePe,
          damagedPieces,
          damageDeduction,
          amountPaid: partyToDriverCash + partyToOwnerPhonePe
        };
        return updatedTrip;
      });
      nextTrips = updated;
      return updated;
    });

    // Persist to backend database
    if (updatedTrip) {
      tripsApi.update(tripId, {
        partyToDriverCash,
        partyToOwnerPhonePe,
        damagedPieces,
        damageDeduction,
        amountPaid: partyToDriverCash + partyToOwnerPhonePe
      }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not update trip payment details on backend database:', err.message);
      });
    }

    // Sync corresponding order's amountPaid
    if (orderIdToUpdate) {
      const targetOrderId = orderIdToUpdate;
      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          if (o.id !== targetOrderId) return o;

          const orderTrips = nextTrips.filter((t) => t.orderId === targetOrderId);
          const totalOrderPaid = orderTrips.reduce((sum, t) => {
            const cash = t.id === tripId ? partyToDriverCash : (t.partyToDriverCash || 0);
            const phonepe = t.id === tripId ? partyToOwnerPhonePe : (t.partyToOwnerPhonePe || 0);
            const deduction = t.id === tripId ? damageDeduction : (t.damageDeduction || 0);
            return sum + cash + phonepe + deduction;
          }, 0);

          const isPaid = totalOrderPaid >= orderTotal(o);
          const newStatus: OrderStatus = isPaid ? 'paid' : o.status;

          ordersApi.updateStatus(targetOrderId, newStatus, totalOrderPaid).catch(err => {
            console.warn('[OrdersContext Fallback] Could not update order payments/status on backend database:', err.message);
          });

          return {
            ...o,
            amountPaid: totalOrderPaid,
            status: newStatus
          };
        })
      );
    }
  }, []);

  const updateLoadingPartyPayments = useCallback((tripId: string, payments: LoadingPartyPayment[]) => {
    let updatedTrip: Trip | null = null;

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;

        updatedTrip = {
          ...t,
          loadingPartyPayments: payments
        };
        return updatedTrip;
      })
    );

    // Persist to backend database
    if (updatedTrip) {
      tripsApi.update(tripId, {
        loadingPartyPayments: payments
      }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not update loading party payments on backend database:', err.message);
      });
    }
  }, []);

  const batchUpdateLoadingPartyPayments = useCallback((updates: { tripId: string; payments: LoadingPartyPayment[] }[]) => {
    setTrips((prev) =>
      prev.map((t) => {
        const update = updates.find((u) => u.tripId === t.id);
        if (!update) return t;
        return {
          ...t,
          loadingPartyPayments: update.payments
        };
      })
    );

    updates.forEach((update) => {
      tripsApi.update(update.tripId, {
        loadingPartyPayments: update.payments
      }).catch((err) => {
        console.warn('[OrdersContext Fallback] Could not update loading party payments in batch on database backend:', err.message);
      });
    });
  }, []);

  const completeTrip = useCallback((tripId: string) => {
    let targetTrip: Trip | null = null;
    let orderIdToUpdate: string | undefined;
    let nextTrips: Trip[] = [];

    setTrips((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== tripId) return t;
        orderIdToUpdate = t.orderId;

        // Check if there are other active trips (status loading or in-transit) for this lorry or driver
        const hasOtherActiveTripsForLorry = prev.some(
          (otherTrip) =>
            otherTrip.id !== tripId &&
            otherTrip.lorryId === t.lorryId &&
            (otherTrip.status === 'loading' || otherTrip.status === 'in-transit')
        );

        const hasOtherActiveTripsForDriver = prev.some(
          (otherTrip) =>
            otherTrip.id !== tripId &&
            otherTrip.driverId === t.driverId &&
            (otherTrip.status === 'loading' || otherTrip.status === 'in-transit')
        );

        // 1. Reset Lorry status to idle and location to depot ONLY if no other active trips exist
        if (!hasOtherActiveTripsForLorry) {
          setLorries((lorriesPrev) =>
            lorriesPrev.map((l) => {
              if (l.id === t.lorryId) {
                lorriesApi.update(l.id, { status: 'idle', location: `Depot — Ramapuram` }).catch(err => {
                  console.warn('[OrdersContext Fallback] Could not update lorry status to idle:', err.message);
                });
                return { ...l, status: 'idle', location: `Depot — Ramapuram` };
              }
              return l;
            })
          );
        }

        // 2. Reset Driver status to idle ONLY if no other active trips exist
        if (!hasOtherActiveTripsForDriver) {
          setDrivers((driversPrev) =>
            driversPrev.map((d) => {
              if (d.id === t.driverId) {
                driversApi.update(d.id, { status: 'idle' }).catch(err => {
                  console.warn('[OrdersContext Fallback] Could not update driver status to idle:', err.message);
                });
                return { ...d, status: 'idle' };
              }
              return d;
            })
          );
        }

        targetTrip = {
          ...t,
          status: 'delivered' as const
        };
        return targetTrip;
      });
      nextTrips = updated;
      return updated;
    });

    // 3. Persist status change to backend database
    if (targetTrip) {
      tripsApi.update(tripId, { status: 'delivered' }).catch(err => {
        console.warn('[OrdersContext Fallback] Could not complete trip:', err.message);
      });
    }

    // 4. Update order status if trip is linked to an order
    if (orderIdToUpdate) {
      const targetOrderId = orderIdToUpdate;
      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          if (o.id !== targetOrderId) return o;

          const orderTrips = nextTrips.filter((t) => t.orderId === targetOrderId);
          const totalOrdered = o.lines.reduce((sum, line) => sum + line.pieces, 0);
          const totalLoaded = orderTrips.reduce((sum, t) => {
            return sum + t.stoneLines.reduce((s, line) => s + line.pieces, 0);
          }, 0);

          const allTripsDispatchedOrDone = orderTrips.every((t) => t.status !== 'loading');
          const isFullyLoaded = totalLoaded >= totalOrdered;

          let newStatus: OrderStatus = 'confirmed';
          if (isFullyLoaded && allTripsDispatchedOrDone) {
            const allTripsDeliveredOrPaid = orderTrips.every(
              (t) => t.status === 'delivered' || t.status === 'paid'
            );
            newStatus = allTripsDeliveredOrPaid ? 'delivered' : 'dispatched';
          } else {
            newStatus = 'confirmed';
          }

          ordersApi.updateStatus(targetOrderId, newStatus).catch(err => {
            console.warn('[OrdersContext Fallback] Could not update order status to delivered:', err.message);
          });
          return { ...o, status: newStatus };
        })
      );
    }

    const notif: AppNotification = {
      id: `n${notifSeq++}`,
      kind: 'order',
      title: `Trip Completed`,
      body: `Trip ${targetTrip ? (targetTrip as Trip).code : ''} has been successfully delivered and completed.`,
      time: 'just now',
      read: false
    };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <OrdersContext.Provider
      value={{
        orders,
        notifications,
        unreadCount,
        trips,
        lorries,
        drivers,
        loadingParties,
        unloadingParties,
        placeOrder,
        setOrderStatus,
        markNotificationRead,
        markAllRead,
        assignOrderToLorry,
        addLoadToTrip,
        dispatchTrip,
        addLorry,
        retireLorry,
        updateLorry,
        addDriver,
        updateDriver,
        addLoadingParty,
        updateLoadingParty,
        deleteLoadingParty,
        addExpenseToTrip,
        addBatchExpensesToTrip,
        setExpenseReviewStatus,
        updateTripPayments,
        updateLoadingPartyPayments,
        batchUpdateLoadingPartyPayments,
        completeTrip,
        stoneSpecs,
        districtRates,
        updateStoneRate,
        updateDistrictRate,
        addStoneRate,
        addDistrictRate,
        syncDatabase
      }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}