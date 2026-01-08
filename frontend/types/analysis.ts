/**
 * TypeScript interfaces for Sports Card Arbitrage Tool
 * Matches backend Pydantic models
 */

export interface ParsedCardData {
  player_name: string;
  year: number | null;
  brand: string;
  card_number: string | null;
  card_type: string | null;
  variation: string | null;
  serial_numbered: number | null;
  
  is_rookie: boolean;
  is_prospect: boolean;
  is_first_bowman: boolean;
  
  is_autograph: boolean;
  has_patch: boolean;
  
  is_graded: boolean;
  grading_company: string | null;
  grade: number | null;
  has_perfect_subgrade: boolean;
  
  is_reprint: boolean;
  is_redemption: boolean;
  
  sport: string | null;
  confidence: string;
  warnings: string[];
}

export interface AnalyzeRequest {
  title: string;
  listing_price: number;
}

export interface AnalyzeResponse {
  parsed_data: ParsedCardData;
  estimated_value: number | null;
  profit_loss: number | null;
  verdict: string;
  match_tier: string;
  sales_count: number;
  cached: boolean;
}

export interface ApiError {
  detail: string;
}
