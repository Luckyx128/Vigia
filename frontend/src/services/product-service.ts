import { API_BASE, handleResponse } from './client';
import type {
  ProductWithStats,
  ProductCreate,
  ProductDetailResponse,
} from '@/types';

export const productService = {
  list: async (): Promise<ProductWithStats[]> => {
    const res = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
    return handleResponse<ProductWithStats[]>(res);
  },

  getById: async (id: number): Promise<ProductDetailResponse> => {
    const res = await fetch(`${API_BASE}/products/${id}`, { cache: 'no-store' });
    return handleResponse<ProductDetailResponse>(res);
  },

  create: async (data: ProductCreate): Promise<ProductWithStats> => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<ProductWithStats>(res);
  },

  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
};
