import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShoppingBag,
} from 'lucide-react';

import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { productApi, type Order } from '../product.api';

export default function OrderHistoryPage(): React.ReactElement {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        const res = await productApi.getUserOrders({
          status: selectedStatus === 'all' ? undefined : selectedStatus,
        });
        setOrders(res.data || []);
      } catch {
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [selectedStatus]);

  const getFulfillmentBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Delivered</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Shipped</Badge>;
      case 'processing':
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Processing</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unfulfilled</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</span>;
      case 'pending':
        return <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>;
      default:
        return <span className="text-[11px] font-semibold text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Failed</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your product package purchases, delivery tracking, and yield status.
          </p>
        </div>
        <Link to="/products">
          <Button className="text-xs gap-1.5 font-semibold">
            <ShoppingBag className="h-3.5 w-3.5" /> Explore Catalog
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
              selectedStatus === st
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse border border-border/60" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border bg-card/40 space-y-3">
          <Package className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No orders found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You haven&apos;t placed any product orders yet. Browse our nodes and partner packages to get started.
          </p>
          <Link to="/products">
            <Button size="sm" className="mt-2">
              Browse Products
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const amountPKR = (order.totalAmount || order.amountPaid) / 100;
            return (
              <Card key={order._id} className="border-border/70 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-card">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Product & Info */}
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border/80">
                      <img
                        src={order.productSnapshot?.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'}
                        alt={order.productSnapshot?.name || 'Product'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {order.orderNumber}
                        </span>
                        <span className="text-muted-foreground text-xs">&bull;</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">
                        {order.productSnapshot?.name || 'Affiliate Asset'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Quantity: <span className="font-medium text-foreground">{order.quantity}</span> &bull; Payment: {order.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status and Amount */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50 gap-2">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-foreground block">
                        Rs. {amountPKR.toLocaleString()}
                      </span>
                      {getPaymentBadge(order.paymentStatus)}
                    </div>
                    <div>
                      {getFulfillmentBadge(order.fulfillmentStatus)}
                    </div>
                  </div>
                </div>

                {/* Tracking info if shipped */}
                {order.trackingNumber && (
                  <div className="bg-muted/30 px-5 py-2.5 border-t border-border/40 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-3.5 w-3.5 text-primary" /> Courier Tracking Number:
                    </span>
                    <span className="font-mono font-bold text-foreground">{order.trackingNumber}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
