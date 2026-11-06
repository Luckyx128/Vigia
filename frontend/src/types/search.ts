export interface SearchCandidate {
  store_name: string;
  title: string;
  url: string;
  image?: string | null;
  price_cash?: number | null;
  price_installment?: number | null;
  installments_text?: string | null;
  in_stock: boolean;
  seller?: string | null;
  is_marketplace: boolean;
  offer_name?: string | null;
  /** Semelhança com a busca, de 0 a 100 */
  score: number;
  /** Diferenças relevantes, ex: "XT", "Kit", "PC completo" */
  differences: string[];
  already_added: boolean;
}

export interface SearchResponse {
  store: string;
  query: string;
  results: SearchCandidate[];
}
