export interface PriceRecordOut {
  id?: number | null;
  store_link_id: number;
  product_id: number;
  store_name: string;
  price_cash?: number | null;
  price_installment?: number | null;
  installments_text?: string | null;
  in_stock: boolean;
  scraped_at: string;
}

export interface StoreLinkWithLatestPrice {
  id: number;
  product_id: number;
  store_name: string;
  url: string;
  is_active: number;
  created_at: string;
  latest_price?: PriceRecordOut | null;
}

export interface ProductCreate {
  name: string;
  category?: string | null;
  specs?: string | null;
  target_price?: number | null;
}

export interface ProductWithStats {
  id: number;
  name: string;
  category?: string | null;
  specs?: string | null;
  target_price?: number | null;
  lowest_price_now?: number | null;
  lowest_store_now?: string | null;
  all_time_low?: number | null;
  all_time_low_store?: string | null;
  avg_price_30d?: number | null;
  discount_vs_avg?: number | null;
  is_real_discount: boolean;
  links_count: number;
}

export interface ProductDetailResponse {
  id: number;
  name: string;
  category?: string | null;
  specs?: string | null;
  target_price?: number | null;
  created_at: string;
  links: StoreLinkWithLatestPrice[];
}
