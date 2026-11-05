import { API_BASE, handleResponse } from './client';
import type { LinkCreate, StoreLinkResponse } from '@/types';

export const storeLinkService = {
  add: async (productId: number, data: LinkCreate): Promise<StoreLinkResponse> => {
    const res = await fetch(`${API_BASE}/products/${productId}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<StoreLinkResponse>(res);
  },

  delete: async (linkId: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/links/${linkId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
};
