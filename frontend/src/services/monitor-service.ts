import { API_BASE, handleResponse } from './client';
import type {
  StatsOverviewResponse,
  ScrapeSummaryResponse,
  NotifyTestRequest,
  NotifyResponse,
} from '@/types';

export const monitorService = {
  getOverview: async (): Promise<StatsOverviewResponse> => {
    const res = await fetch(`${API_BASE}/stats/overview`, { cache: 'no-store' });
    return handleResponse<StatsOverviewResponse>(res);
  },

  scrapeAll: async (): Promise<ScrapeSummaryResponse> => {
    const res = await fetch(`${API_BASE}/scrape/all`, {
      method: 'POST',
    });
    return handleResponse<ScrapeSummaryResponse>(res);
  },

  scrapeProduct: async (productId: number): Promise<ScrapeSummaryResponse> => {
    const res = await fetch(`${API_BASE}/scrape/${productId}`, {
      method: 'POST',
    });
    return handleResponse<ScrapeSummaryResponse>(res);
  },

  testNotify: async (data?: NotifyTestRequest): Promise<NotifyResponse> => {
    const res = await fetch(`${API_BASE}/notify/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    return handleResponse<NotifyResponse>(res);
  },
};
