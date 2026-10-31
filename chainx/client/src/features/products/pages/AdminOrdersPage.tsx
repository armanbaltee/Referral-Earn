import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Edit2,
  X,
} from 'lucide-react';

import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { FormField } from '@components/ui/label';
import { productApi, type Order } from '../product.api';

export default function AdminOrdersPage(): React.ReactElement {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('processing');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productApi.adminGetOrders({
        search: search.trim() || undefined,
        fulfillmentStatus: fulfillmentFilter === 'all' ? undefined : fulfillmentFilter,
      });
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, fulfillmentFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.fulfillmentStatus);
    setTrackingNumber(order.trackingNumber || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      await productApi.adminUpdateOrderFulfillment(selectedOrder._id, {
        status: newStatus,
        trackingNumber: trackingNumber.trim() || undefined,
      });
      setSelectedOrder(null);
      loadOrders();
    } catch {
      alert('Failed to update order fulfillment.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Product Orders</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View all customer package and node purchases, verify payment status, and update courier fulfillment.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="text-muted-foreground">Fulfillment:</span>
          <select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="unfulfilled">Unfulfilled</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Order #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Item / Quantity</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Fulfillment</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    No orders matching your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const amount = (o.totalAmount || o.amountPaid) / 100;
                  return (
                    <tr key={o._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-foreground">
                        {o.orderNumber}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-foreground block">{o.user?.name || 'Customer'}</span>
                        <span className="text-[10px] text-muted-foreground">{o.user?.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-foreground block">
                          {o.productSnapshot?.name || o.product?.name || 'Product'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Qty: {o.quantity}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-foreground">Rs. {amount.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        {o.paymentStatus === 'paid' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="capitalize">
                          {o.fulfillmentStatus}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => openStatusModal(o)}
                        >
                          <Edit2 className="h-3 w-3" /> Update
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Update Fulfillment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="text-base font-bold text-foreground">Update Order Fulfillment</h3>
                <span className="font-mono text-xs text-muted-foreground">{selectedOrder.orderNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <FormField label="Fulfillment Status">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="unfulfilled">Unfulfilled</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </FormField>

              <FormField label="Courier Tracking Number" hint="e.g. TCS, Leopards, M&P, or digital access key">
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TCS-99881122"
                  disabled={isUpdating}
                />
              </FormField>

              {selectedOrder.shippingAddress && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1 text-[11px]">
                  <span className="font-semibold block text-foreground">Delivery Address:</span>
                  <p className="text-muted-foreground">
                    {selectedOrder.shippingAddress.fullName} ({selectedOrder.shippingAddress.phone})
                  </p>
                  <p className="text-muted-foreground">
                    {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Update Status'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
