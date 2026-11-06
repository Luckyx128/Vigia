import { API_BASE, handleResponse } from './client';
import type { SearchResponse } from '@/types';

export const searchService = {
  search: async (query: string, store = 'Kabum', productId?: number): Promise<SearchResponse> => {
    const params = new URLSearchParams({ q: query, store });
    if (productId !== undefined) params.set('product_id', String(productId));
    const res = await fetch(`${API_BASE}/search?${params}`, { cache: 'no-store' });
    return handleResponse<SearchResponse>(res);
  },
};
