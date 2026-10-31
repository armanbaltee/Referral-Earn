import type { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../common/response.js';
import { ProductService } from './product.service.js';
import type { AuthenticatedRequest } from '../../types/index.js';
import { OrderFulfillmentStatus } from './order.model.js';

export class ProductController {
  // ─── Public / User Endpoints ──────────────────────────────────────────────────
  public static async getProducts(req: Request, res: Response): Promise<void> {
    const result = await ProductService.getProductsPublic(req.query as never);
    sendPaginated(res, result.products, result.meta, 'Products retrieved successfully.');
  }

  public static async getProductDetails(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;
    const product = await ProductService.getProductDetails(slug as string);
    sendSuccess(res, product, 'Product details retrieved.');
  }

  public static async placeOrder(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const order = await ProductService.placeOrder(userId, req.body);
    sendSuccess(res, order, 'Order placed successfully.', 201);
  }

  public static async getUserOrders(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthenticatedRequest).user.userId;
    const result = await ProductService.getUserOrders(userId, req.query as never);
    sendPaginated(res, result.orders, result.meta, 'Orders retrieved successfully.');
  }

  // ─── Admin Endpoints ──────────────────────────────────────────────────────────
  public static async adminGetProducts(req: Request, res: Response): Promise<void> {
    const result = await ProductService.getProductsAdmin(req.query as never);
    sendPaginated(res, result.products, result.meta, 'Admin products retrieved.');
  }

  public static async adminCreateProduct(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const product = await ProductService.createProduct(req.body, adminId);
    sendSuccess(res, product, 'Product created successfully.', 201);
  }

  public static async adminUpdateProduct(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const { id } = req.params;
    const product = await ProductService.updateProduct(id as string, req.body, adminId);
    sendSuccess(res, product, 'Product updated successfully.');
  }

  public static async adminArchiveProduct(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const { id } = req.params;
    const product = await ProductService.archiveProduct(id as string, adminId);
    sendSuccess(res, product, 'Product archived successfully.');
  }

  public static async adminToggleStatus(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const { id } = req.params;
    const product = await ProductService.toggleProductStatus(id as string, adminId);
    sendSuccess(res, product, `Product status toggled to ${product.status}.`);
  }

  public static async adminGetOrders(req: Request, res: Response): Promise<void> {
    const result = await ProductService.getOrdersAdmin(req.query as never);
    sendPaginated(res, result.orders, result.meta, 'Admin orders retrieved.');
  }

  public static async adminUpdateOrderFulfillment(req: Request, res: Response): Promise<void> {
    const adminId = (req as AuthenticatedRequest).user.userId;
    const { id } = req.params;
    const { status, trackingNumber } = req.body;
    const order = await ProductService.updateOrderFulfillment(
      id as string,
      status as OrderFulfillmentStatus,
      trackingNumber,
      adminId
    );
    sendSuccess(res, order, 'Order fulfillment status updated successfully.');
  }
}
