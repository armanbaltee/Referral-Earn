import type { Response } from 'express';

import type {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  ValidationError,
} from '../types/index.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = 'Success'
): Response {
  const response: PaginatedResponse<T> = { success: true, message, data, meta };
  return res.status(200).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: ValidationError[]
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  };
  return res.status(statusCode).json(response);
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function parsePaginationQuery(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  order: 'asc' | 'desc';
  search: string;
} {
  const page = Math.max(1, Number(query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(query['limit']) || 20));
  const skip = (page - 1) * limit;
  const sort = typeof query['sort'] === 'string' ? query['sort'] : 'createdAt';
  const order: 'asc' | 'desc' = query['order'] === 'asc' ? 'asc' : 'desc';
  const search = typeof query['search'] === 'string' ? query['search'] : '';

  return { page, limit, skip, sort, order, search };
}
