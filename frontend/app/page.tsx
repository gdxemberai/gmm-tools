"use client";

import { useState } from "react";
import { analyzeListing, ApiRequestError } from "@/lib/api";
import { AnalyzeResponse, ParsedCardData } from "@/types/analysis";

export default function Home() {
  const [title, setTitle] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [showJsonView, setShowJsonView] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setError("Please enter a listing title");
      return;
    }
    
    const price = parseFloat(listingPrice);
    if (!listingPrice || isNaN(price) || price <= 0) {
      setError("Please enter a valid listing price");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeListing({
        title: title.trim(),
        listing_price: price,
      });
      setResult(response);
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

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getVerdictStyle = (profitLoss: number | null) => {
    if (profitLoss === null) return { bg: "bg-gray-100", text: "text-gray-800", icon: "≈" };
    
    const percentChange = result?.estimated_value 
      ? (profitLoss / result.estimated_value) * 100 
      : 0;
    
    if (Math.abs(percentChange) <= 5) {
      return { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800", icon: "≈", label: "FAIR PRICE" };
    } else if (profitLoss > 0) {
      return { bg: "bg-green-50 border-green-200", text: "text-green-800", icon: "✓", label: "PROFITABLE BUY" };
    } else {
      return { bg: "bg-red-50 border-red-200", text: "text-red-800", icon: "✗", label: "OVERPRICED" };
    }
  };

  const renderBadge = (label: string, value: boolean, trueColor = "bg-blue-100 text-blue-800") => {
    if (!value) return null;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trueColor}`}>
        {label}
      </span>
    );
  };

  const renderParsedData = (data: ParsedCardData) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Parsed Card Details</h2>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Player Name</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{data.player_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Brand</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{data.brand}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Year</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{data.year || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Variation</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{data.variation || "Base"}</p>
            </div>
          </div>

          {/* Card Details */}
          {(data.card_type || data.card_number || data.serial_numbered) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              {data.card_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Card Type</label>
                  <p className="mt-1 text-sm text-gray-900">{data.card_type}</p>
                </div>
              )}
              {data.card_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Card Number</label>
                  <p className="mt-1 text-sm text-gray-900">{data.card_number}</p>
                </div>
              )}
              {data.serial_numbered && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Serial Numbered</label>
                  <p className="mt-1 text-sm text-gray-900">/{data.serial_numbered}</p>
                </div>
              )}
            </div>
          )}

          {/* Grading Info */}
          {data.is_graded && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-600 mb-2">Grading</label>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {data.grading_company || "Unknown"} {data.grade || ""}
                </span>
                {data.has_perfect_subgrade && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Perfect Subgrade
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Attributes */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-600 mb-2">Attributes</label>
            <div className="flex flex-wrap gap-2">
              {renderBadge("Rookie", data.is_rookie, "bg-green-100 text-green-800")}
              {renderBadge("Prospect", data.is_prospect, "bg-blue-100 text-blue-800")}
              {renderBadge("1st Bowman", data.is_first_bowman, "bg-indigo-100 text-indigo-800")}
              {renderBadge("Autograph", data.is_autograph, "bg-purple-100 text-purple-800")}
              {renderBadge("Patch", data.has_patch, "bg-orange-100 text-orange-800")}
              {renderBadge("Reprint", data.is_reprint, "bg-gray-100 text-gray-800")}
              {renderBadge("Redemption", data.is_redemption, "bg-red-100 text-red-800")}
              {data.sport && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {data.sport}
                </span>
              )}
            </div>
          </div>

          {/* Confidence & Warnings */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-600">Confidence</label>
                <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">{data.confidence}</p>
              </div>
              <button
                onClick={() => setShowJsonView(!showJsonView)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showJsonView ? "Hide" : "Show"} JSON
              </button>
            </div>
            
            {data.warnings.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {data.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* JSON View */}
          {showJsonView && (
            <div className="pt-4 border-t border-gray-200">
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-xs text-gray-800">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderValuation = () => {
    if (!result) return null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Market Analysis</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Estimated Market Value</label>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {formatCurrency(result.estimated_value)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-600">Match Tier</label>
              <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                {result.match_tier.replace("_", " ")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Sales Count</label>
              <p className="mt-1 text-sm font-semibold text-gray-900">{result.sales_count}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Data Source</label>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {result.cached ? "Cached" : "Fresh"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVerdict = () => {
    if (!result) return null;

    const verdictStyle = getVerdictStyle(result.profit_loss);
    const percentChange = result.estimated_value && result.profit_loss
      ? ((result.profit_loss / result.estimated_value) * 100).toFixed(1)
      : "0";

    return (
      <div className={`rounded-lg shadow-md p-6 border-2 ${verdictStyle.bg}`}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Investment Analysis</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Listed Price</label>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(parseFloat(listingPrice))}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Estimated Value</label>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(result.estimated_value)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-600">Profit/Loss</label>
              <span className={`text-sm font-semibold ${verdictStyle.text}`}>
                {parseFloat(percentChange) > 0 ? "+" : ""}{percentChange}%
              </span>
            </div>
            <p className={`text-3xl font-bold ${verdictStyle.text}`}>
              {result.profit_loss !== null && result.profit_loss > 0 ? "+" : ""}
              {formatCurrency(result.profit_loss)}
            </p>
          </div>

          <div className={`mt-4 p-4 rounded-lg border-2 ${verdictStyle.bg}`}>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-3xl ${verdictStyle.text}`}>{verdictStyle.icon}</span>
              <span className={`text-2xl font-bold ${verdictStyle.text}`}>
                {verdictStyle.label || result.verdict}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sports Card Arbitrage Tool
          </h1>
          <p className="text-lg text-gray-600">
            Analyze eBay listings to find profitable card deals
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                eBay Listing Title
              </label>
              <textarea
                id="title"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
                placeholder="e.g., 2023 Panini Prizm Victor Wembanyama Silver Prizm PSA 10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                aria-label="eBay listing title"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Listed Price (USD)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                placeholder="e.g., 1500.00"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                disabled={loading}
                aria-label="Listed price in USD"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Analyze listing"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "Analyze Listing"
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" role="alert">
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
                aria-label="Dismiss error"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            {renderVerdict()}
            {renderValuation()}
            {renderParsedData(result.parsed_data)}
          </div>
        )}
      </div>
    </div>
  );
}
