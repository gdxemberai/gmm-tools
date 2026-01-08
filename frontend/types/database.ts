/**
 * TypeScript types for database viewer functionality
 */

export interface SalesRecord {
  id: number;
  player_id: string;
  brand_id: string;
  variation_id: string | null;
  year: number;
  grade: number | null;
  grader: string;
  price: number | null;
  sold_at: string | null;
}

export interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SalesHistoryResponse {
  data: SalesRecord[];
  pagination: PaginationInfo;
}

export interface SalesHistoryFilters {
  page?: number;
  per_page?: number;
  player_id?: string;
  brand_id?: string;
  grader?: string;
  min_grade?: number;
  max_grade?: number;
  sort_by?: 'sold_at' | 'price' | 'grade' | 'player_id';
  sort_order?: 'asc' | 'desc';
}
