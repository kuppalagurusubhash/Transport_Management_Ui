import React, { useCallback, useState, createContext, useContext } from 'react';
import {
  seedOrders,
  seedNotifications,
  unloadingPartyById } from
'../data/mockData';
import {
  orderTotal,
  type Order,
  type OrderStatus,
  type AppNotification } from
'../data/types';
interface OrdersContextValue {
  orders: Order[];
  notifications: AppNotification[];
  unreadCount: number;
  placeOrder: (
  order: Omit<Order, 'id' | 'code' | 'placedAt' | 'status' | 'amountPaid'>)
  => Order;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
}
const OrdersContext = createContext<OrdersContextValue | null>(null);
let orderSeq = 2052;
let notifSeq = 100;
export function OrdersProvider({ children }: {children: React.ReactNode;}) {
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [notifications, setNotifications] =
  useState<AppNotification[]>(seedNotifications);
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
    setOrders((prev) => [order, ...prev]);
    const buyer = unloadingPartyById(order.unloadingPartyId);
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
      prev.map((o) =>
      o.id === orderId ?
      {
        ...o,
        status,
        amountPaid: status === 'paid' ? orderTotal(o) : o.amountPaid
      } :
      o
      )
      );
    },
    []
  );
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
    prev.map((n) =>
    n.id === id ?
    {
      ...n,
      read: true
    } :
    n
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
  }, []);
  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <OrdersContext.Provider
      value={{
        orders,
        notifications,
        unreadCount,
        placeOrder,
        setOrderStatus,
        markNotificationRead,
        markAllRead
      }}>
      
      {children}
    </OrdersContext.Provider>);

}
export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}