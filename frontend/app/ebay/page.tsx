"use client";

import { useState } from "react";
import { searchEbay, analyzeListing, ApiRequestError } from "@/lib/api";
import { EbaySearchResponse, EbayListing } from "@/types/ebay";
import { AnalyzeResponse } from "@/types/analysis";

export default function EbaySearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<EbaySearchResponse | null>(null);
  const [analyzingItems, setAnalyzingItems] = useState<Set<string>>(new Set());
  const [analyzedResults, setAnalyzedResults] = useState<Map<string, AnalyzeResponse>>(new Map());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await searchEbay(query.trim(), 20);
      setResults(response);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.details || err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (listing: EbayListing) => {
    if (!listing.price) return;
    
    const itemId = listing.itemId;
    setAnalyzingItems(prev => new Set(prev).add(itemId));
    
    try {
      const response = await analyzeListing({
        title: listing.title,
        listing_price: parseFloat(listing.price.value),
      });
      
      setAnalyzedResults(prev => new Map(prev).set(itemId, response));
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setAnalyzingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const formatPrice = (listing: EbayListing): string => {
    if (!listing.price) return "N/A";
    return `$${listing.price.value} ${listing.price.currency}`;
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getVerdictStyle = (profitLoss: number | null) => {
    if (profitLoss === null) return { bg: "bg-gray-100", text: "text-gray-800", icon: "≈" };
    if (profitLoss > 0) {
      return { bg: "bg-green-50", text: "text-green-800", icon: "✓" };
    } else {
      return { bg: "bg-red-50", text: "text-red-800", icon: "✗" };
    }
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            eBay Search
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Search for sports cards on eBay
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-neutral-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-neutral-700 mb-2">
                Search Query
              </label>
              <input
                id="query"
                type="text"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] text-neutral-900 bg-white hover:border-neutral-300 transition-colors"
                placeholder="e.g., 2023 Topps Chrome Baseball"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF5E00] text-white py-3 px-6 rounded-lg font-medium text-sm hover:bg-[#FF5E00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF5E00] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_10px_rgba(255,94,0,0.2)] hover:shadow-[0_4px_16px_rgba(255,94,0,0.3)] hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                "Search eBay"
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200/80">
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Search Results</h2>
              <p className="text-sm text-neutral-600">
                Found {results.total} listings, showing {results.itemSummaries.length}
              </p>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.itemSummaries.map((listing) => (
                <div
                  key={listing.itemId}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200/80 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  {listing.image && (
                    <div className="aspect-square bg-neutral-100 relative">
                      <img
                        src={listing.image.imageUrl}
                        alt={listing.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-medium text-neutral-900 text-sm mb-2 line-clamp-2" title={listing.title}>
                      {listing.title}
                    </h3>

                    <div className="space-y-2">
                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Price</span>
                        <span className="text-lg font-bold text-[#FF5E00]">
                          {formatPrice(listing)}
                        </span>
                      </div>

                      {/* Condition */}
                      {listing.condition && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">Condition</span>
                          <span className="text-xs font-medium text-neutral-700">
                            {listing.condition}
                          </span>
                        </div>
                      )}

                      {/* Shipping */}
                      {listing.shippingOptions && listing.shippingOptions.length > 0 && listing.shippingOptions[0].shippingCost && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">Shipping</span>
                          <span className="text-xs font-medium text-neutral-700">
                            ${listing.shippingOptions[0].shippingCost.value}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 space-y-2">
                      {/* Check Now Button */}
                      <button
                        onClick={() => handleAnalyze(listing)}
                        disabled={analyzingItems.has(listing.itemId) || !listing.price}
                        className="w-full bg-[#FF5E00] text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-[#FF5E00]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                      >
                        {analyzingItems.has(listing.itemId) ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                          </span>
                        ) : (
                          "Check Now"
                        )}
                      </button>

                      {/* View on eBay Button */}
                      {listing.itemWebUrl && (
                        <a
                          href={listing.itemWebUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-2 px-4 rounded-lg font-medium text-sm transition-colors"
                        >
                          View on eBay
                        </a>
                      )}
                    </div>

                    {/* Analysis Result */}
                    {analyzedResults.has(listing.itemId) && (
                      <div className="mt-4 pt-4 border-t border-neutral-200">
                        {(() => {
                          const analysis = analyzedResults.get(listing.itemId)!;
                          const verdictStyle = getVerdictStyle(analysis.profit_loss);
                          
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-500">Est. Value</span>
                                <span className="font-semibold text-neutral-900">
                                  {formatCurrency(analysis.estimated_value)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-500">Profit/Loss</span>
                                <span className={`font-semibold ${verdictStyle.text}`}>
                                  {analysis.profit_loss !== null && analysis.profit_loss > 0 ? "+" : ""}
                                  {formatCurrency(analysis.profit_loss)}
                                </span>
                              </div>
                              <div className={`mt-2 p-2 rounded-lg ${verdictStyle.bg} flex items-center justify-center gap-2`}>
                                <span className={verdictStyle.text}>{verdictStyle.icon}</span>
                                <span className={`text-xs font-semibold ${verdictStyle.text}`}>
                                  {analysis.verdict}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {results.itemSummaries.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 border border-neutral-200/80 text-center">
                <p className="text-neutral-500">No listings found for your search query.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
