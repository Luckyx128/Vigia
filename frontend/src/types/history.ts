export interface HistoryRecord {
  id?: number | null;
  scraped_at: string;
  store_name: string;
  price_cash?: number | null;
  price_installment?: number | null;
  in_stock: boolean;
}

export interface ProductHistoryResponse {
  product_id: number;
  product_name: string;
  stores: string[];
  records: HistoryRecord[];
}
