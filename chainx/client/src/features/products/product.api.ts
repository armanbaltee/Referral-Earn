import { apiClient } from '@lib/axios';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number; // in paisa
  compareAtPrice?: number | undefined;
  sku?: string | undefined;
  dailyIncome: number;
  referralCommission: number;
  level: number;
  stock: number;
  trackInventory: boolean;
  status: 'active' | 'inactive' | 'out_of_stock' | 'archived';
  isArchived: boolean;
  category: string;
  tags: string[];
  totalPurchases: number;
  createdAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string | undefined;
  };
  product: Product;
  productSnapshot: {
    name: string;
    price: number;
    image?: string | undefined;
    category?: string | undefined;
  };
  quantity: number;
  totalAmount: number; // in paisa
  amountPaid: number;
  paymentMethod: 'wallet' | 'easypaisa' | 'jazzcash' | 'manual';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillmentStatus: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  status: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string | undefined;
  } | undefined;
  trackingNumber?: string | undefined;
  notes?: string | undefined;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const productApi = {
  getProducts: async (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    category?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    sort?: string | undefined;
  }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Product[];
      meta: PaginationMeta;
    }>('/products', { params });
    return res.data;
  },

  getProductDetails: async (slug: string) => {
    const res = await apiClient.get<{ success: boolean; data: Product }>(`/products/${slug}`);
    return res.data.data;
  },

  placeOrder: async (data: {
    productId: string;
    quantity?: number | undefined;
    paymentMethod?: 'wallet' | 'easypaisa' | 'jazzcash' | 'manual' | undefined;
    paymentReference?: string | undefined;
    shippingAddress?: {
      fullName: string;
      phone: string;
      address: string;
      city: string;
      postalCode?: string | undefined;
    } | undefined;
    notes?: string | undefined;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: Order }>('/products/orders', data);
    return res.data.data;
  },

  getUserOrders: async (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    status?: string | undefined;
  }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Order[];
      meta: PaginationMeta;
    }>('/products/orders/my-orders', { params });
    return res.data;
  },

  // ─── Admin Endpoints ────────────────────────────────────────────────────────
  adminGetProducts: async (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    category?: string | undefined;
    status?: string | undefined;
  }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Product[];
      meta: PaginationMeta;
    }>('/products/admin/all', { params });
    return res.data;
  },

  adminCreateProduct: async (data: Partial<Product>) => {
    const res = await apiClient.post<{ success: boolean; data: Product }>('/products/admin', data);
    return res.data.data;
  },

  adminUpdateProduct: async (id: string, data: Partial<Product>) => {
    const res = await apiClient.put<{ success: boolean; data: Product }>(`/products/admin/${id}`, data);
    return res.data.data;
  },

  adminArchiveProduct: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; data: Product }>(`/products/admin/${id}`);
    return res.data.data;
  },

  adminToggleStatus: async (id: string) => {
    const res = await apiClient.patch<{ success: boolean; data: Product }>(
      `/products/admin/${id}/toggle-status`
    );
    return res.data.data;
  },

  adminGetOrders: async (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    paymentStatus?: string | undefined;
    fulfillmentStatus?: string | undefined;
  }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Order[];
      meta: PaginationMeta;
    }>('/products/admin/orders/all', { params });
    return res.data;
  },

  adminUpdateOrderFulfillment: async (
    id: string,
    data: { status: string; trackingNumber?: string | undefined }
  ) => {
    const res = await apiClient.patch<{ success: boolean; data: Order }>(
      `/products/admin/orders/${id}/fulfillment`,
      data
    );
    return res.data.data;
  },
};
