export interface StatsOverviewResponse {
  total_products: number;
  total_links: number;
  total_records: number;
  all_time_low_deals_count: number;
  active_offers_count: number;
  last_updated?: string | null;
}

export interface ScrapeSummaryResponse {
  total_scraped: number;
  success_count: number;
  failed_count: number;
  alerts_sent: number;
  results: Array<Record<string, unknown>>;
}

export interface NotifyTestRequest {
  message?: string | null;
  kind?: 'success' | 'alert' | 'error' | null;
}

export interface NotifyResponse {
  success: boolean;
  message: string;
  kind: string;
  target_url: string;
}
