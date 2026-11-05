import type { StoreLinkWithLatestPrice } from './product';

export interface LinkCreate {
  store_name: string;
  url: string;
}

export type StoreLinkResponse = StoreLinkWithLatestPrice;
