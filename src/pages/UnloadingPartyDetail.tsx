import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { unloadingPartyById, formatINR } from '../data/mockData';
import {
  orderTotal,
  orderPending,
  orderSqft,
  orderLineAmount,
  orderLineTotalSqft } from
'../data/types';
import { useOrders } from '../store/OrdersContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, SectionLabel } from '../components/ui/Card';
import { OrderStatusBadge } from '../components/ui/Badge';
export function UnloadingPartyDetail() {
  const { partyId } = useParams();
  const party = unloadingPartyById(partyId ?? '');
  const { orders } = useOrders();
  if (!party) {
    return (
      <div className="p-8">
        <p className="text-neutral-400">Buyer not found.</p>
        <Link
          to="/unloading-parties"
          className="mt-2 inline-block text-gold hover:underline">
          
          Back to buyers
        </Link>
      </div>);

  }
  const partyOrders = orders.filter((o) => o.unloadingPartyId === party.id);
  const ordered = partyOrders.reduce((s, o) => s + orderTotal(o), 0);
  const pending = partyOrders.reduce((s, o) => s + orderPending(o), 0);
  const sqft = partyOrders.reduce((s, o) => s + orderSqft(o), 0);
  return (
    <div className="min-h-full">
      <PageHeader
        title={party.name}
        subtitle={`Kerala buyer · ${party.district}`} />
      
      <div className="p-6 sm:p-8">
        <Link
          to="/unloading-parties"
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
          
          <ArrowLeftIcon className="h-4 w-4" /> All buyers
        </Link>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <SectionLabel>Orders</SectionLabel>
            <p className="mt-2 text-lg font-extrabold text-white">
              {partyOrders.length}
            </p>
          </Card>
          <Card className="p-4">
            <SectionLabel>Ordered Value</SectionLabel>
            <p className="mt-2 text-lg font-extrabold text-gold">
              {formatINR(ordered)}
            </p>
          </Card>
          <Card className="p-4">
            <SectionLabel>Pending</SectionLabel>
            <p className="mt-2 text-lg font-extrabold text-white">
              {formatINR(pending)}
            </p>
          </Card>
          <Card className="p-4">
            <SectionLabel>Total Sqft</SectionLabel>
            <p className="mt-2 text-lg font-extrabold text-white">
              {sqft.toLocaleString('en-IN')}
            </p>
          </Card>
        </div>

        <SectionLabel>Order History</SectionLabel>
        <div className="mt-4 space-y-4">
          {partyOrders.length === 0 &&
          <p className="text-sm text-neutral-600">No orders yet.</p>
          }
          {partyOrders.map((order) =>
          <Card key={order.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 bg-ink-900/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{order.code}</span>
                  <OrderStatusBadge status={order.status} />
                  <span className="text-xs text-neutral-500">
                    {formatDistanceToNow(new Date(order.placedAt), {
                    addSuffix: true
                  })}
                  </span>
                </div>
                <span className="text-sm font-bold text-gold">
                  {formatINR(orderTotal(order))}
                </span>
              </div>
              <div className="ti-scroll overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <tbody>
                    {order.lines.map((line) =>
                  <tr
                    key={line.id}
                    className="border-b border-ink-800 last:border-0">
                    
                        <td className="px-4 py-3 text-white">
                          {line.size} · {line.thickness}{' '}
                          <span className="capitalize text-neutral-500">
                            ({line.finish})
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                          {orderLineTotalSqft(line)} sqft × ₹{line.ratePerSqft}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gold">
                          {formatINR(orderLineAmount(line))}
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>);

}