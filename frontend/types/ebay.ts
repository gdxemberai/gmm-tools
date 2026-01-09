/**
 * TypeScript types for eBay API integration
 */

export interface EbayPrice {
  value: string;
  currency: string;
}

export interface EbayImage {
  imageUrl: string;
}

export interface EbayShippingOption {
  shippingCost?: {
    value: string;
    currency: string;
  };
  shippingCostType?: string;
}

export interface EbayListing {
  itemId: string;
  title: string;
  price?: EbayPrice;
  itemWebUrl?: string;
  image?: EbayImage;
  condition?: string;
  conditionId?: string;
  seller?: {
    username?: string;
    feedbackPercentage?: string;
    feedbackScore?: number;
  };
  shippingOptions?: EbayShippingOption[];
  buyingOptions?: string[];
  itemLocation?: {
    city?: string;
    stateOrProvince?: string;
    country?: string;
  };
  categories?: Array<{
    categoryId?: string;
    categoryName?: string;
  }>;
}

export interface EbaySearchResponse {
  href?: string;
  total: number;
  next?: string;
  prev?: string;
  limit: number;
  offset: number;
  itemSummaries: EbayListing[];
  warnings?: Array<{
    category?: string;
    message?: string;
  }>;
}

export interface EbaySearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  category_ids?: string;
  filter_params?: string;
  sort?: string;
}
