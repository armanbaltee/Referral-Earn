import mongoose from 'mongoose';
import { Product, ProductStatus, type IProductDocument } from './product.model.js';
import {
  Order,
  OrderStatus,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  type IOrderDocument,
  type IShippingAddress,
} from './order.model.js';
import { AuditLog, AuditAction } from '../admin/auditLog.model.js';
import { NotFoundError, BadRequestError } from '../../common/errors.js';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function createMeta(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export class ProductService {
  // ─── 1. Admin: Product Creation ───────────────────────────────────────────────
  public static async createProduct(
    data: {
      name: string;
      description: string;
      images?: string[];
      price: number; // in paisa
      compareAtPrice?: number;
      sku?: string;
      stock?: number;
      trackInventory?: boolean;
      category: string;
      tags?: string[];
      level?: number;
      dailyIncome?: number;
      referralCommission?: number;
    },
    adminId: string
  ): Promise<IProductDocument> {
    let slug = slugify(data.name);
    const existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = await Product.create({
      name: data.name.trim(),
      slug,
      description: data.description.trim(),
      images: data.images || [],
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      sku: data.sku?.trim(),
      stock: data.stock !== undefined ? data.stock : 100,
      trackInventory: data.trackInventory !== undefined ? data.trackInventory : true,
      category: data.category.trim(),
      tags: data.tags || [],
      level: data.level || 1,
      dailyIncome: data.dailyIncome || 0,
      referralCommission: data.referralCommission || 0,
      status: ProductStatus.ACTIVE,
      isArchived: false,
      createdBy: new mongoose.Types.ObjectId(adminId),
    });

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.PRODUCT_CREATED,
      target: product._id,
      targetModel: 'Product',
      description: `Product created: ${product.name} (Rs. ${product.price / 100})`,
    });

    return product;
  }

  // ─── 2. Admin: Product Edit ───────────────────────────────────────────────────
  public static async updateProduct(
    productId: string,
    data: Partial<{
      name: string;
      description: string;
      images: string[];
      price: number;
      compareAtPrice: number;
      sku: string;
      stock: number;
      trackInventory: boolean;
      status: ProductStatus;
      category: string;
      tags: string[];
      level: number;
      dailyIncome: number;
      referralCommission: number;
    }>,
    adminId: string
  ): Promise<IProductDocument> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    if (data.name && data.name !== product.name) {
      product.name = data.name.trim();
      let newSlug = slugify(data.name);
      const conflict = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
      if (conflict) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
      product.slug = newSlug;
    }

    if (data.description !== undefined) product.description = data.description.trim();
    if (data.images !== undefined) product.images = data.images;
    if (data.price !== undefined) product.price = data.price;
    if (data.compareAtPrice !== undefined) product.compareAtPrice = data.compareAtPrice;
    if (data.sku !== undefined) product.sku = data.sku;
    if (data.stock !== undefined) {
      product.stock = Math.max(0, data.stock);
      if (product.stock === 0 && product.trackInventory) {
        product.status = ProductStatus.OUT_OF_STOCK;
      }
    }
    if (data.trackInventory !== undefined) product.trackInventory = data.trackInventory;
    if (data.status !== undefined) product.status = data.status;
    if (data.category !== undefined) product.category = data.category.trim();
    if (data.tags !== undefined) product.tags = data.tags;
    if (data.level !== undefined) product.level = data.level;
    if (data.dailyIncome !== undefined) product.dailyIncome = data.dailyIncome;
    if (data.referralCommission !== undefined) product.referralCommission = data.referralCommission;

    await product.save();

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.PRODUCT_UPDATED,
      target: product._id,
      targetModel: 'Product',
      description: `Product updated: ${product.name}`,
    });

    return product;
  }

  // ─── 3. Admin: Archive Product ────────────────────────────────────────────────
  public static async archiveProduct(productId: string, adminId: string): Promise<IProductDocument> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    product.isArchived = true;
    product.status = ProductStatus.ARCHIVED;
    await product.save();

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.PRODUCT_DELETED,
      target: product._id,
      targetModel: 'Product',
      description: `Product archived: ${product.name}`,
    });

    return product;
  }

  // ─── 4. Admin: Toggle Product Active Status ───────────────────────────────────
  public static async toggleProductStatus(productId: string, adminId: string): Promise<IProductDocument> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    product.status =
      product.status === ProductStatus.ACTIVE ? ProductStatus.INACTIVE : ProductStatus.ACTIVE;
    await product.save();

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.PRODUCT_UPDATED,
      target: product._id,
      targetModel: 'Product',
      description: `Product status changed to ${product.status}: ${product.name}`,
    });

    return product;
  }

  // ─── 5. Public / User: Browse Products with Filters ───────────────────────────
  public static async getProductsPublic(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(60, Math.max(1, Number(query.limit || 12)));
    const filter: Record<string, unknown> = {
      isArchived: false,
      status: { $in: [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK] },
    };

    if (query.category && query.category !== 'all') {
      filter.category = query.category;
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined) priceFilter.$gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) priceFilter.$lte = Number(query.maxPrice);
      filter.price = priceFilter;
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === 'price_asc') sortOption = { price: 1 };
    else if (query.sort === 'price_desc') sortOption = { price: -1 };
    else if (query.sort === 'popular') sortOption = { totalPurchases: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Distinct categories for client navigation pills
    const categories = await Product.distinct('category', { isArchived: false });

    return {
      products,
      categories,
      meta: createMeta(page, limit, total),
    };
  }

  // ─── 6. Public / User: Product Details by Slug or ID ──────────────────────────
  public static async getProductDetails(slugOrId: string): Promise<IProductDocument> {
    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
    const filter = isObjectId ? { _id: slugOrId } : { slug: slugOrId };

    const product = await Product.findOne({ ...filter, isArchived: false });
    if (!product) {
      throw new NotFoundError('Product not found.');
    }
    return product;
  }

  // ─── 7. Admin: Get Products (Includes Archived & Inactive) ────────────────────
  public static async getProductsAdmin(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.category && query.category !== 'all') {
      filter.category = query.category;
    }
    if (query.search) {
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      meta: createMeta(page, limit, total),
    };
  }

  // ─── 8. User: Place Product Order ─────────────────────────────────────────────
  public static async placeOrder(
    userId: string,
    data: {
      productId: string;
      quantity?: number;
      paymentMethod?: 'wallet' | 'easypaisa' | 'jazzcash' | 'manual';
      paymentReference?: string;
      shippingAddress?: IShippingAddress;
      notes?: string;
    }
  ): Promise<IOrderDocument> {
    const product = await Product.findById(data.productId);
    if (!product || product.isArchived) {
      throw new NotFoundError('Product is no longer available.');
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestError('This product is currently inactive or out of stock.');
    }

    const quantity = Math.max(1, data.quantity || 1);

    if (product.trackInventory && product.stock < quantity) {
      throw new BadRequestError(`Insufficient stock. Only ${product.stock} items remaining.`);
    }

    const totalAmount = product.price * quantity;
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Deduct stock if inventory tracking is enabled
    if (product.trackInventory) {
      product.stock -= quantity;
      if (product.stock === 0) {
        product.status = ProductStatus.OUT_OF_STOCK;
      }
    }
    product.totalPurchases += quantity;
    await product.save();

    const order = await Order.create({
      orderNumber,
      user: new mongoose.Types.ObjectId(userId),
      product: product._id,
      productSnapshot: {
        name: product.name,
        price: product.price,
        image: product.images[0] || '',
        category: product.category,
      },
      quantity,
      totalAmount,
      amountPaid: totalAmount,
      paymentMethod: data.paymentMethod || 'wallet',
      paymentStatus:
        data.paymentMethod === 'wallet' ? OrderPaymentStatus.PAID : OrderPaymentStatus.PENDING,
      fulfillmentStatus: OrderFulfillmentStatus.PROCESSING,
      status: OrderStatus.PROCESSING,
      shippingAddress: data.shippingAddress,
      paymentReference: data.paymentReference,
      notes: data.notes,
      dailyIncome: product.dailyIncome,
      referralCommission: product.referralCommission,
      durationDays: 365,
      activatedAt: new Date(),
    });

    return order;
  }

  // ─── 9. User: Get Order History ───────────────────────────────────────────────
  public static async getUserOrders(
    userId: string,
    query: { page?: number; limit?: number; status?: string }
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 10)));
    const filter: Record<string, unknown> = { user: new mongoose.Types.ObjectId(userId) };

    if (query.status && query.status !== 'all') {
      filter.fulfillmentStatus = query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('product', 'name images slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      meta: createMeta(page, limit, total),
    };
  }

  // ─── 10. Admin: Get All Product Orders ─────────────────────────────────────────
  public static async getOrdersAdmin(query: {
    page?: number;
    limit?: number;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    search?: string;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (query.paymentStatus && query.paymentStatus !== 'all') {
      filter.paymentStatus = query.paymentStatus;
    }
    if (query.fulfillmentStatus && query.fulfillmentStatus !== 'all') {
      filter.fulfillmentStatus = query.fulfillmentStatus;
    }
    if (query.search) {
      filter.orderNumber = { $regex: query.search.trim(), $options: 'i' };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .populate('product', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      meta: createMeta(page, limit, total),
    };
  }

  // ─── 11. Admin: Update Order Fulfillment Status ───────────────────────────────
  public static async updateOrderFulfillment(
    orderId: string,
    status: OrderFulfillmentStatus,
    trackingNumber?: string,
    adminId?: string
  ): Promise<IOrderDocument> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found.');
    }

    order.fulfillmentStatus = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber.trim();
    }
    if (status === OrderFulfillmentStatus.DELIVERED) {
      order.status = OrderStatus.COMPLETED;
    } else if (status === OrderFulfillmentStatus.CANCELLED) {
      order.status = OrderStatus.CANCELLED;
    }

    await order.save();

    if (adminId) {
      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(adminId),
        action: AuditAction.PRODUCT_UPDATED,
        target: order._id,
        targetModel: 'Order',
        description: `Order ${order.orderNumber} fulfillment updated to ${status}. Tracking: ${trackingNumber || 'None'}`,
      });
    }

    return order;
  }
}
