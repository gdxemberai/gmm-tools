/**
 * API client for Sports Card Arbitrage Tool backend
 */

import { AnalyzeRequest, AnalyzeResponse, ApiError } from "@/types/analysis";

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
