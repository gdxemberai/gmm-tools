/**
 * API client for Sports Card Arbitrage Tool backend
 */

import {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiError,
  BulkAnalyzeRequest,
  BulkAnalyzeResponse
} from "@/types/analysis";
import {
  SalesHistoryResponse,
  SalesHistoryFilters
} from "@/types/database";
import {
  EbaySearchResponse,
  EbaySearchRequest
} from "@/types/ebay";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Log API configuration on module load
console.log("=== API Client Configuration ===");
console.log("API_BASE_URL:", API_BASE_URL);
console.log("NEXT_PUBLIC_API_URL env:", process.env.NEXT_PUBLIC_API_URL);
console.log("Running in browser:", typeof window !== "undefined");
console.log("================================");

/**
 * Custom error class for API errors
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/**
 * Analyze an eBay listing to determine if it's a good deal
 * 
 * @param request - Analysis request with title and listing price
 * @returns Analysis response with verdict and pricing data
 * @throws ApiRequestError if the request fails
 */
export async function analyzeListing(
  request: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const url = `${API_BASE_URL}/analyze`;
  
  console.log("=== analyzeListing Request ===");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log("Headers:", { "Content-Type": "application/json" });
  console.log("Request Body:", JSON.stringify(request, null, 2));
  console.log("==============================");
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    console.log("=== analyzeListing Response ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("OK:", response.ok);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    console.log("===============================");

    if (!response.ok) {
      // Try to parse error details from response
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorData: ApiError = await response.json();
        console.log("Error Response Body:", errorData);
        errorDetail = errorData.detail || errorDetail;
      } catch (parseError) {
        // If JSON parsing fails, use status text
        console.log("Failed to parse error response:", parseError);
        errorDetail = response.statusText || errorDetail;
      }

      console.error("=== API Request Failed ===");
      console.error("Error Detail:", errorDetail);
      console.error("==========================");

      throw new ApiRequestError(
        "Failed to analyze listing",
        response.status,
        errorDetail
      );
    }

    const data: AnalyzeResponse = await response.json();
    console.log("=== Success Response Data ===");
    console.log("Data:", JSON.stringify(data, null, 2));
    console.log("=============================");
    return data;
  } catch (error) {
    console.error("=== analyzeListing Error ===");
    console.error("Error Type:", error?.constructor?.name);
    console.error("Error Message:", error instanceof Error ? error.message : String(error));
    console.error("Full Error:", error);
    console.error("============================");
    
    // Re-throw ApiRequestError as-is
    if (error instanceof ApiRequestError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiRequestError(
        "Network error - unable to connect to backend",
        undefined,
        "Make sure the backend server is running at " + API_BASE_URL
      );
    }

    // Handle other errors
    throw new ApiRequestError(
      "An unexpected error occurred",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Analyze multiple eBay listings in a single request
 *
 * @param request - Bulk analysis request with array of listings
 * @returns Bulk analysis response with results for each listing
 * @throws ApiRequestError if the request fails
 */
export async function analyzeBulkListings(
  request: BulkAnalyzeRequest
): Promise<BulkAnalyzeResponse> {
  const url = `${API_BASE_URL}/analyze/bulk`;
  
  console.log("=== analyzeBulkListings Request ===");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log("Headers:", { "Content-Type": "application/json" });
  console.log("Request Body:", JSON.stringify(request, null, 2));
  console.log("===================================");
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    console.log("=== analyzeBulkListings Response ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("OK:", response.ok);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    console.log("====================================");

    if (!response.ok) {
      // Try to parse error details from response
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorData: ApiError = await response.json();
        console.log("Error Response Body:", errorData);
        errorDetail = errorData.detail || errorDetail;
      } catch (parseError) {
        // If JSON parsing fails, use status text
        console.log("Failed to parse error response:", parseError);
        errorDetail = response.statusText || errorDetail;
      }

      console.error("=== API Request Failed ===");
      console.error("Error Detail:", errorDetail);
      console.error("==========================");

      throw new ApiRequestError(
        "Failed to analyze bulk listings",
        response.status,
        errorDetail
      );
    }

    const data: BulkAnalyzeResponse = await response.json();
    console.log("=== Success Response Data ===");
    console.log("Data:", JSON.stringify(data, null, 2));
    console.log("=============================");
    return data;
  } catch (error) {
    console.error("=== analyzeBulkListings Error ===");
    console.error("Error Type:", error?.constructor?.name);
    console.error("Error Message:", error instanceof Error ? error.message : String(error));
    console.error("Full Error:", error);
    console.error("=================================");
    
    // Re-throw ApiRequestError as-is
    if (error instanceof ApiRequestError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiRequestError(
        "Network error - unable to connect to backend",
        undefined,
        "Make sure the backend server is running at " + API_BASE_URL
      );
    }

    // Handle other errors
    throw new ApiRequestError(
      "An unexpected error occurred",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Get sales history records with filtering, sorting, and pagination
 *
 * @param filters - Optional filters for querying sales history
 * @returns Sales history response with data and pagination info
 * @throws ApiRequestError if the request fails
 */
export async function getSalesHistory(
  filters?: SalesHistoryFilters
): Promise<SalesHistoryResponse> {
  // Build query parameters
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.player_id) params.append('player_id', filters.player_id);
    if (filters.brand_id) params.append('brand_id', filters.brand_id);
    if (filters.grader) params.append('grader', filters.grader);
    if (filters.min_grade !== undefined) params.append('min_grade', filters.min_grade.toString());
    if (filters.max_grade !== undefined) params.append('max_grade', filters.max_grade.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
  }
  
  const url = `${API_BASE_URL}/database/sales${params.toString() ? '?' + params.toString() : ''}`;
  
  console.log("=== getSalesHistory Request ===");
  console.log("URL:", url);
  console.log("Method: GET");
  console.log("Filters:", filters);
  console.log("===============================");
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("=== getSalesHistory Response ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("OK:", response.ok);
    console.log("================================");

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorData: ApiError = await response.json();
        console.log("Error Response Body:", errorData);
        errorDetail = errorData.detail || errorDetail;
      } catch (parseError) {
        console.log("Failed to parse error response:", parseError);
        errorDetail = response.statusText || errorDetail;
      }

      console.error("=== API Request Failed ===");
      console.error("Error Detail:", errorDetail);
      console.error("==========================");

      throw new ApiRequestError(
        "Failed to fetch sales history",
        response.status,
        errorDetail
      );
    }

    const data: SalesHistoryResponse = await response.json();
    console.log("=== Success Response Data ===");
    console.log("Total Records:", data.pagination.total);
    console.log("Current Page:", data.pagination.page);
    console.log("Records Returned:", data.data.length);
    console.log("=============================");
    return data;
  } catch (error) {
    console.error("=== getSalesHistory Error ===");
    console.error("Error Type:", error?.constructor?.name);
    console.error("Error Message:", error instanceof Error ? error.message : String(error));
    console.error("=============================");
    
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiRequestError(
        "Network error - unable to connect to backend",
        undefined,
        "Make sure the backend server is running at " + API_BASE_URL
      );
    }

    throw new ApiRequestError(
      "An unexpected error occurred",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Check if the backend API is healthy
 *
 * @returns True if backend is healthy, false otherwise
 */
export async function checkBackendHealth(): Promise<boolean> {
  const url = `${API_BASE_URL}/health`;
  
  console.log("=== checkBackendHealth Request ===");
  console.log("URL:", url);
  console.log("Method: GET");
  console.log("==================================");
  
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    
    console.log("=== checkBackendHealth Response ===");
    console.log("Status:", response.status);
    console.log("OK:", response.ok);
    console.log("===================================");
    
    return response.ok;
  } catch (error) {
    console.error("=== checkBackendHealth Error ===");
    console.error("Error:", error);
    console.error("================================");
    return false;
  }
}

/**
 * Clear all Redis cache entries
 *
 * @returns Success message and status
 * @throws ApiRequestError if the request fails
 */
export async function clearCache(): Promise<{ message: string; success: boolean }> {
  const url = `${API_BASE_URL}/cache/clear`;
  
  console.log("=== clearCache Request ===");
  console.log("URL:", url);
  console.log("Method: DELETE");
  console.log("==========================");
  
  try {
    const response = await fetch(url, {
      method: "DELETE",
    });

    console.log("=== clearCache Response ===");
    console.log("Status:", response.status);
    console.log("OK:", response.ok);
    console.log("===========================");

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorData: ApiError = await response.json();
        console.log("Error Response Body:", errorData);
        errorDetail = errorData.detail || errorDetail;
      } catch (parseError) {
        console.log("Failed to parse error response:", parseError);
        errorDetail = response.statusText || errorDetail;
      }

      console.error("=== API Request Failed ===");
      console.error("Error Detail:", errorDetail);
      console.error("==========================");

      throw new ApiRequestError(
        "Failed to clear cache",
        response.status,
        errorDetail
      );
    }

    const data = await response.json();
    console.log("=== Success Response Data ===");
    console.log("Data:", JSON.stringify(data, null, 2));
    console.log("=============================");
    return data;
  } catch (error) {
    console.error("=== clearCache Error ===");
    console.error("Error Type:", error?.constructor?.name);
    console.error("Error Message:", error instanceof Error ? error.message : String(error));
    console.error("========================");
    
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiRequestError(
        "Network error - unable to connect to backend",
        undefined,
        "Make sure the backend server is running at " + API_BASE_URL
      );
    }

    throw new ApiRequestError(
      "An unexpected error occurred",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Record a purchase in the database
 *
 * @param purchaseData - Purchase data to record
 * @returns Success message and purchase ID
 * @throws ApiRequestError if the request fails
 */
export async function recordPurchase(purchaseData: any): Promise<{ message: string; id: number }> {
  const url = `${API_BASE_URL}/purchases/`;
  
  console.log("=== recordPurchase Request ===");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log("Request Body:", JSON.stringify(purchaseData, null, 2));
  console.log("==============================");
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(purchaseData),
    });

    console.log("=== recordPurchase Response ===");
    console.log("Status:", response.status);
    console.log("OK:", response.ok);
    console.log("===============================");

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorData: ApiError = await response.json();
        console.log("Error Response Body:", errorData);
        errorDetail = errorData.detail || errorDetail;
      } catch (parseError) {
        console.log("Failed to parse error response:", parseError);
        errorDetail = response.statusText || errorDetail;
      }

      console.error("=== API Request Failed ===");
      console.error("Error Detail:", errorDetail);
      console.error("==========================");

      throw new ApiRequestError(
        "Failed to record purchase",
        response.status,
        errorDetail
      );
    }

    const data = await response.json();
    console.log("=== Success Response Data ===");
    console.log("Data:", JSON.stringify(data, null, 2));
    console.log("=============================");
    return data;
  } catch (error) {
    console.error("=== recordPurchase Error ===");
    console.error("Error Type:", error?.constructor?.name);
    console.error("Error Message:", error instanceof Error ? error.message : String(error));
    console.error("============================");
    
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiRequestError(
        "Network error - unable to connect to backend",
        undefined,
        "Make sure the backend server is running at " + API_BASE_URL
      );
    }

    throw new ApiRequestError(
      "An unexpected error occurred",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Get all purchases with pagination
 *
 * @param skip - Number of records to skip
 * @param limit - Maximum number of records to return
 * @returns Purchase history data
 * @throws ApiRequestError if the request fails
 */
export async function getPurchases(skip: number = 0, limit: number = 100): Promise<any> {
  const url = `${API_BASE_URL}/purchases/?skip=${skip}&limit=${limit}`;
  
  console.log("=== getPurchases Request ===");
  console.log("URL:", url);
  console.log("Method: GET");
  console.log("============================");
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("=== getPurchases Response ===");
    console.log("Status:", response.status);
    console.log("OK:", response.ok);
    console.log("=============================");

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorData: ApiError = await response.json();
        console.log("Error Response Body:", errorData);
        errorDetail = errorData.detail || errorDetail;
      } catch (parseError) {
        console.log("Failed to parse error response:", parseError);
        errorDetail = response.statusText || errorDetail;
      }

      console.error("=== API Request Failed ===");
      console.error("Error Detail:", errorDetail);
      console.error("==========================");

      throw new ApiRequestError(
        "Failed to fetch purchases",
        response.status,
        errorDetail
      );
    }

    const data = await response.json();
    console.log("=== Success Response Data ===");
    console.log("Total Purchases:", data.total);
    console.log("Purchases Returned:", data.purchases.length);
    console.log("=============================");
    return data;
  } catch (error) {
    console.error("=== getPurchases Error ===");
    console.error("Error Type:", error?.constructor?.name);
    console.error("Error Message:", error instanceof Error ? error.message : String(error));
    console.error("==========================");
    
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiRequestError(
        "Network error - unable to connect to backend",
        undefined,
        "Make sure the backend server is running at " + API_BASE_URL
      );
    }

    throw new ApiRequestError(
      "An unexpected error occurred",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Search eBay for sports card listings
 *
 * @param query - Search query string
 * @param limit - Number of results to return (default 50)
 * @returns eBay search results
 * @throws ApiRequestError if the request fails
 */
export async function searchEbay(
  query: string,
  limit: number = 50
): Promise<EbaySearchResponse> {
  const params = new URLSearchParams();
  params.append('q', query);
  params.append('limit', limit.toString());
  
  const url = `${API_BASE_URL}/ebay/search?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorData: ApiError = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (parseError) {
        errorDetail = response.statusText || errorDetail;
      }

      throw new ApiRequestError(
        "Failed to search eBay",
        response.status,
        errorDetail
      );
    }

    const data: EbaySearchResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiRequestError(
        "Network error - unable to connect to backend",
        undefined,
        "Make sure the backend server is running at " + API_BASE_URL
      );
    }

    throw new ApiRequestError(
      "An unexpected error occurred",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}
