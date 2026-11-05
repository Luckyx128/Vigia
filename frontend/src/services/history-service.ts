import { API_BASE, handleResponse } from './client';
import type { ProductHistoryResponse } from '@/types';

export const historyService = {
  getByProductId: async (productId: number): Promise<ProductHistoryResponse> => {
    const res = await fetch(`${API_BASE}/products/${productId}/history`, { cache: 'no-store' });
    return handleResponse<ProductHistoryResponse>(res);
  },

  deleteRecord: async (recordId: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/records/${recordId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  resetProduct: async (productId: number): Promise<{ success: boolean; deleted_count: number; message: string }> => {
    const res = await fetch(`${API_BASE}/products/${productId}/reset-history`, {
      method: 'POST',
    });
    return handleResponse<{ success: boolean; deleted_count: number; message: string }>(res);
  },
};
