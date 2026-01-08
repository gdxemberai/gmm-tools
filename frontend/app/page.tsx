"use client";

import { useState } from "react";
import { analyzeListing, analyzeBulkListings, recordPurchase, ApiRequestError } from "@/lib/api";
import { AnalyzeResponse, ParsedCardData, BulkAnalyzeResponse, BulkAnalyzeResultItem, AnalysisStep } from "@/types/analysis";

export default function Home() {
  // Mode state
  const [mode, setMode] = useState<"single" | "bulk">("single");
  
  // Single analysis state
  const [title, setTitle] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [showJsonView, setShowJsonView] = useState(false);
  const [showAnalysisSteps, setShowAnalysisSteps] = useState(false);
  
  // Bulk analysis state
  const [bulkInput, setBulkInput] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkAnalyzeResponse | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [jsonViewRows, setJsonViewRows] = useState<Set<number>>(new Set());
  
  // Purchase tracking state
  const [purchased, setPurchased] = useState(false);
  const [purchasedBulkItems, setPurchasedBulkItems] = useState<Set<number>>(new Set());
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!bulkInput.trim()) {
      setBulkError("Please enter at least one listing");
      return;
    }
    
    // Parse bulk input (format: "title | price" per line)
    const lines = bulkInput.trim().split('\n').filter(line => line.trim());
    const listings = [];
    const parseErrors: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split('|').map(p => p.trim());
      
      if (parts.length !== 2) {
        parseErrors.push(`Line ${i + 1}: Invalid format (expected "title | price")`);
        continue;
      }
      
      const [title, priceStr] = parts;
      const price = parseFloat(priceStr);
      
      if (!title) {
        parseErrors.push(`Line ${i + 1}: Title cannot be empty`);
        continue;
      }
      
      if (isNaN(price) || price <= 0) {
        parseErrors.push(`Line ${i + 1}: Invalid price "${priceStr}"`);
        continue;
      }
      
      listings.push({ title, listing_price: price });
    }
    
    if (parseErrors.length > 0) {
      setBulkError(parseErrors.join('\n'));
      return;
    }
    
    if (listings.length === 0) {
      setBulkError("No valid listings found");
      return;
    }

    setBulkLoading(true);
    setBulkError(null);
    setBulkResults(null);

    try {
      const response = await analyzeBulkListings({ listings });
      setBulkResults(response);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setBulkError(err.details || err.message);
      } else {
        setBulkError("An unexpected error occurred");
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!result) return;
    
    setPurchaseLoading(true);
    setPurchaseMessage(null);
    
    try {
      const purchaseData = {
        listing_title: title,
        listing_price: parseFloat(listingPrice),
        player_name: result.parsed_data.player_name,
        year: result.parsed_data.year,
        brand: result.parsed_data.brand,
        variation: result.parsed_data.variation,
        grade: result.parsed_data.grade,
        grader: result.parsed_data.grading_company,
        estimated_value: result.estimated_value,
        profit_loss: result.profit_loss,
        parsed_data: result.parsed_data,
        confidence: result.parsed_data.confidence,
        match_tier: result.match_tier,
        sales_count: result.sales_count
      };
      
      await recordPurchase(purchaseData);
      setPurchased(true);
      setPurchaseMessage("Purchase recorded successfully!");
      
      // Clear message after 3 seconds
      setTimeout(() => setPurchaseMessage(null), 3000);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setPurchaseMessage(err.details || err.message);
      } else {
        setPurchaseMessage("Failed to record purchase");
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleBulkPurchase = async (resultItem: BulkAnalyzeResultItem) => {
    if (!resultItem.success || !resultItem.data) return;
    
    setPurchaseLoading(true);
    setPurchaseMessage(null);
    
    try {
      const purchaseData = {
        listing_title: resultItem.title,
        listing_price: resultItem.listing_price,
        player_name: resultItem.data.parsed_data.player_name,
        year: resultItem.data.parsed_data.year,
        brand: resultItem.data.parsed_data.brand,
        variation: resultItem.data.parsed_data.variation,
        grade: resultItem.data.parsed_data.grade,
        grader: resultItem.data.parsed_data.grading_company,
        estimated_value: resultItem.data.estimated_value,
        profit_loss: resultItem.data.profit_loss,
        parsed_data: resultItem.data.parsed_data,
        confidence: resultItem.data.parsed_data.confidence,
        match_tier: resultItem.data.match_tier,
        sales_count: resultItem.data.sales_count
      };
      
      await recordPurchase(purchaseData);
      
      const newPurchasedItems = new Set(purchasedBulkItems);
      newPurchasedItems.add(resultItem.index);
      setPurchasedBulkItems(newPurchasedItems);
      
      setPurchaseMessage(`Purchase #${resultItem.index + 1} recorded successfully!`);
      
      // Clear message after 3 seconds
      setTimeout(() => setPurchaseMessage(null), 3000);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setPurchaseMessage(err.details || err.message);
      } else {
        setPurchaseMessage("Failed to record purchase");
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!bulkResults) return;
    
    const headers = ["Index", "Title", "Listed Price", "Estimated Value", "Profit/Loss", "Verdict", "Status"];
    const rows = bulkResults.results.map(r => {
      if (r.success && r.data) {
        return [
          r.index,
          `"${r.title.replace(/"/g, '""')}"`,
          r.listing_price,
          r.data.estimated_value || "N/A",
          r.data.profit_loss || "N/A",
          `"${r.data.verdict}"`,
          "Success"
        ];
      } else {
        return [
          r.index,
          `"${r.title.replace(/"/g, '""')}"`,
          r.listing_price,
          "N/A",
          "N/A",
          "N/A",
          `"Error: ${r.error?.replace(/"/g, '""') || 'Unknown'}"`
        ];
      }
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "✓";
      case "warning":
        return "⚠";
      case "error":
        return "✗";
      default:
        return "•";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: "text-green-600" };
      case "warning":
        return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", icon: "text-yellow-600" };
      case "error":
        return { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "text-red-600" };
      default:
        return { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", icon: "text-gray-600" };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    } catch {
      return timestamp;
    }
  };

  const calculateDuration = (steps: AnalysisStep[], currentIndex: number) => {
    if (currentIndex === 0) return null;
    try {
      const currentTime = new Date(steps[currentIndex].timestamp).getTime();
      const previousTime = new Date(steps[currentIndex - 1].timestamp).getTime();
      const duration = currentTime - previousTime;
      return duration > 0 ? `${duration}ms` : null;
    } catch {
      return null;
    }
  };

  const toggleRowExpansion = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const toggleJsonView = (index: number) => {
    const newJsonViewRows = new Set(jsonViewRows);
    if (newJsonViewRows.has(index)) {
      newJsonViewRows.delete(index);
    } else {
      newJsonViewRows.add(index);
    }
    setJsonViewRows(newJsonViewRows);
  };

  const renderAnalysisStepsTimeline = (steps: AnalysisStep[], compact: boolean = false) => {
    if (!steps || steps.length === 0) return null;

    return (
      <div className="space-y-3">
        {steps.map((step, index) => {
          const colors = getStatusColor(step.status);
          const duration = calculateDuration(steps, index);
          
          return (
            <div key={index} className="relative">
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" style={{ height: 'calc(100% + 0.75rem)' }}></div>
              )}
              
              {/* Step card */}
              <div className={`relative flex gap-4 p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
                {/* Step number badge */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colors.border} bg-white border-2 flex items-center justify-center font-bold ${colors.text} z-10`}>
                  <span className={colors.icon}>{getStatusIcon(step.status)}</span>
                </div>
                
                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${colors.text}`}>{step.name}</h3>
                      <span className="text-xs text-gray-500">Step {step.step}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatTimestamp(step.timestamp)}</span>
                      {duration && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">+{duration}</span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm ${colors.text} mb-2`}>{step.details}</p>
                  
                  {/* Additional data */}
                  {!compact && step.data && Object.keys(step.data).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                        View technical details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto text-gray-700 border border-gray-200">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAnalysisSteps = (steps: AnalysisStep[]) => {
    if (!steps || steps.length === 0) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Analysis Pipeline</h2>
          <button
            onClick={() => setShowAnalysisSteps(!showAnalysisSteps)}
            className="text-sm text-[#FF5E00] hover:text-[#FF5E00]/80 font-medium flex items-center gap-2"
          >
            {showAnalysisSteps ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Hide Steps
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Show Steps ({steps.length})
              </>
            )}
          </button>
        </div>

        {showAnalysisSteps && renderAnalysisStepsTimeline(steps)}
      </div>
    );
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
      <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200/80">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Parsed Card Details</h2>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-500">Player Name</label>
              <p className="mt-1 text-lg font-semibold text-neutral-900">{data.player_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500">Brand</label>
              <p className="mt-1 text-lg font-semibold text-neutral-900">{data.brand}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500">Year</label>
              <p className="mt-1 text-lg font-semibold text-neutral-900">{data.year || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500">Variation</label>
              <p className="mt-1 text-lg font-semibold text-neutral-900">{data.variation || "Base"}</p>
            </div>
          </div>

          {/* Card Details */}
          {(data.card_type || data.card_number || data.serial_numbered) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
              {data.card_type && (
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Card Type</label>
                  <p className="mt-1 text-sm text-neutral-900">{data.card_type}</p>
                </div>
              )}
              {data.card_number && (
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Card Number</label>
                  <p className="mt-1 text-sm text-neutral-900">{data.card_number}</p>
                </div>
              )}
              {data.serial_numbered && (
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Serial Numbered</label>
                  <p className="mt-1 text-sm text-neutral-900">/{data.serial_numbered}</p>
                </div>
              )}
            </div>
          )}

          {/* Grading Info */}
          {data.is_graded && (
            <div className="pt-4 border-t border-neutral-200">
              <label className="block text-sm font-medium text-neutral-500 mb-2">Grading</label>
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
          <div className="pt-4 border-t border-neutral-200">
            <label className="block text-sm font-medium text-neutral-500 mb-2">Attributes</label>
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
          <div className="pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-neutral-500">Confidence</label>
                <p className="mt-1 text-sm font-semibold text-neutral-900 capitalize">{data.confidence}</p>
              </div>
              <button
                onClick={() => setShowJsonView(!showJsonView)}
                className="text-sm text-[#FF5E00] hover:text-[#FF5E00]/80 font-medium"
              >
                {showJsonView ? "Hide" : "Show"} JSON
              </button>
            </div>
            
            {data.warnings.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
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
            <div className="pt-4 border-t border-neutral-200">
              <pre className="bg-neutral-50 p-4 rounded-lg overflow-x-auto text-xs text-neutral-800 border border-neutral-200">
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
      <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200/80">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Market Analysis</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-500">Estimated Market Value</label>
            <p className="mt-1 text-3xl font-bold text-neutral-900">
              {formatCurrency(result.estimated_value)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
            <div>
              <label className="block text-sm font-medium text-neutral-500">Match Tier</label>
              <p className="mt-1 text-sm font-semibold text-neutral-900 capitalize">
                {result.match_tier.replace("_", " ")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500">Sales Count</label>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{result.sales_count}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500">Data Source</label>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
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
      <div className={`rounded-xl shadow-sm p-6 border-2 ${verdictStyle.bg}`}>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Investment Analysis</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-500">Listed Price</label>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {formatCurrency(parseFloat(listingPrice))}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500">Estimated Value</label>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {formatCurrency(result.estimated_value)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-300">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-500">Profit/Loss</label>
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

          {/* BUY Button */}
          <div className="mt-6 pt-6 border-t border-neutral-300">
            <button
              onClick={handlePurchase}
              disabled={purchased || purchaseLoading}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all ${
                purchased
                  ? "bg-green-100 text-green-800 cursor-not-allowed"
                  : "bg-[#FF5E00] text-white hover:bg-[#FF5E00]/90 shadow-[0_2px_10px_rgba(255,94,0,0.2)] hover:shadow-[0_4px_16px_rgba(255,94,0,0.3)] hover:-translate-y-0.5"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {purchaseLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Recording Purchase...
                </span>
              ) : purchased ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Purchased ✓
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Buy This Card
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBulkResults = () => {
    if (!bulkResults) return null;

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900">Bulk Analysis Results</h2>
            <button
              onClick={downloadCSV}
              className="inline-flex items-center px-4 py-2 bg-[#FF5E00] text-white rounded-lg hover:bg-[#FF5E00]/90 font-medium text-sm shadow-[0_2px_10px_rgba(255,94,0,0.2)] hover:shadow-[0_4px_16px_rgba(255,94,0,0.3)] transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm font-medium text-neutral-600">Total Processed</p>
              <p className="text-2xl font-bold text-neutral-900">{bulkResults.total}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-600">Successful</p>
              <p className="text-2xl font-bold text-green-900">{bulkResults.successful}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-600">Failed</p>
              <p className="text-2xl font-bold text-red-900">{bulkResults.failed}</p>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider w-12"></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Listed Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Est. Value</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Profit/Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Verdict</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {bulkResults.results.map((result) => {
                  const verdictStyle = result.success && result.data
                    ? getVerdictStyle(result.data.profit_loss)
                    : { bg: "bg-gray-100", text: "text-gray-800", icon: "?" };
                  const isExpanded = expandedRows.has(result.index);
                  const hasSteps = result.analysis_steps && result.analysis_steps.length > 0;
                  
                  return (
                    <>
                      <tr
                        key={result.index}
                        className={`${result.success ? "" : "bg-red-50"} ${hasSteps ? "cursor-pointer hover:bg-neutral-50" : ""} transition-colors`}
                        onClick={() => hasSteps && toggleRowExpansion(result.index)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {hasSteps && (
                            <svg
                              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={result.title}>
                          {result.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(result.listing_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.success && result.data ? formatCurrency(result.data.estimated_value) : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {result.success && result.data ? (
                            <span className={`font-semibold ${verdictStyle.text}`}>
                              {result.data.profit_loss !== null && result.data.profit_loss > 0 ? "+" : ""}
                              {formatCurrency(result.data.profit_loss)}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {result.success && result.data ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${verdictStyle.bg} ${verdictStyle.text}`}>
                              {verdictStyle.icon} {verdictStyle.label || result.data.verdict}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {result.success ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title={result.error || ""}>
                              ✗ Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {result.success && result.data ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBulkPurchase(result);
                              }}
                              disabled={purchasedBulkItems.has(result.index) || purchaseLoading}
                              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                                purchasedBulkItems.has(result.index)
                                  ? "bg-green-100 text-green-800 cursor-not-allowed"
                                  : "bg-[#FF5E00] text-white hover:bg-[#FF5E00]/90 shadow-sm hover:shadow-md"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {purchasedBulkItems.has(result.index) ? "Purchased ✓" : "Buy"}
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Expanded Analysis Steps Row */}
                      {isExpanded && hasSteps && (
                        <tr key={`${result.index}-expanded`} className="bg-neutral-50/30">
                          <td colSpan={8} className="px-6 py-6">
                            <div className="max-w-5xl mx-auto space-y-6">
                              {/* Analysis Pipeline Section */}
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold text-neutral-900">
                                    Analysis Pipeline - Listing #{result.index + 1}
                                  </h3>
                                  <span className="text-sm text-neutral-500">
                                    {result.analysis_steps.length} steps
                                  </span>
                                </div>
                                {renderAnalysisStepsTimeline(result.analysis_steps, true)}
                              </div>

                              {/* JSON View Section */}
                              {result.success && result.data && result.data.parsed_data && (
                                <div className="pt-6 border-t border-neutral-200">
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-neutral-900">
                                      Parsed Card Data
                                    </h3>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleJsonView(result.index);
                                      }}
                                      className="text-sm text-[#FF5E00] hover:text-[#FF5E00]/80 font-medium flex items-center gap-2"
                                    >
                                      {jsonViewRows.has(result.index) ? (
                                        <>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                          </svg>
                                          Hide JSON
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                          View JSON
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  
                                  {jsonViewRows.has(result.index) && (
                                    <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
                                      <pre className="text-xs text-neutral-800 overflow-x-auto">
                                        {JSON.stringify(result.data.parsed_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
              Sports Card Analysis
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Analyze eBay listings to find profitable card deals
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-neutral-200/80">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setMode("single")}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                mode === "single"
                  ? "bg-[#FF5E00] text-white shadow-[0_2px_10px_rgba(255,94,0,0.2)]"
                  : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Single Analysis
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                mode === "bulk"
                  ? "bg-[#FF5E00] text-white shadow-[0_2px_10px_rgba(255,94,0,0.2)]"
                  : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Bulk Analysis
            </button>
          </div>
        </div>

        {/* Single Analysis Form */}
        {mode === "single" && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-neutral-200/80">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
                eBay Listing Title
              </label>
              <textarea
                id="title"
                rows={3}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] resize-none text-neutral-900 bg-white hover:border-neutral-300 transition-colors"
                placeholder="e.g., 2023 Panini Prizm Victor Wembanyama Silver Prizm PSA 10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                aria-label="eBay listing title"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-2">
                Listed Price (USD)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] text-neutral-900 bg-white hover:border-neutral-300 transition-colors"
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
              className="w-full bg-[#FF5E00] text-white py-3 px-6 rounded-lg font-medium text-sm hover:bg-[#FF5E00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF5E00] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_10px_rgba(255,94,0,0.2)] hover:shadow-[0_4px_16px_rgba(255,94,0,0.3)] hover:-translate-y-0.5"
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
        )}

        {/* Bulk Analysis Form */}
        {mode === "bulk" && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-neutral-200/80">
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label htmlFor="bulkInput" className="block text-sm font-medium text-neutral-700 mb-2">
                  Bulk Listings (one per line: title | price)
                </label>
                <textarea
                  id="bulkInput"
                  rows={10}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] resize-none text-neutral-900 font-mono text-sm bg-white hover:border-neutral-300 transition-colors"
                  placeholder={"2023 Panini Prizm Victor Wembanyama Silver Prizm PSA 10 | 1500\nLeBron James 2003 Topps Chrome Refractor PSA 9 | 2800\nMike Trout 2011 Topps Update Rookie PSA 10 | 5000"}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  disabled={bulkLoading}
                  aria-label="Bulk listings input"
                />
                <p className="mt-2 text-sm text-neutral-500">
                  Format: <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">Title | Price</code> (one listing per line, max 50)
                </p>
              </div>

              <button
                type="submit"
                disabled={bulkLoading}
                className="w-full bg-[#FF5E00] text-white py-3 px-6 rounded-lg font-medium text-sm hover:bg-[#FF5E00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF5E00] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_10px_rgba(255,94,0,0.2)] hover:shadow-[0_4px_16px_rgba(255,94,0,0.3)] hover:-translate-y-0.5"
                aria-label="Analyze bulk listings"
              >
                {bulkLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Bulk Listings...
                  </span>
                ) : (
                  "Analyze Bulk Listings"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Purchase Success Message */}
        {purchaseMessage && (
          <div className={`mb-8 ${purchaseMessage.includes("success") ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"} border-l-4 p-4 rounded-r-lg`} role="alert">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {purchaseMessage.includes("success") ? (
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${purchaseMessage.includes("success") ? "text-green-800" : "text-red-800"}`}>
                  {purchaseMessage}
                </p>
              </div>
              <button
                onClick={() => setPurchaseMessage(null)}
                className={`ml-3 flex-shrink-0 ${purchaseMessage.includes("success") ? "text-green-400 hover:text-green-600" : "text-red-400 hover:text-red-600"}`}
                aria-label="Dismiss message"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Error Display - Single Mode */}
        {mode === "single" && error && (
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

        {/* Error Display - Bulk Mode */}
        {mode === "bulk" && bulkError && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" role="alert">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800 whitespace-pre-line">{bulkError}</p>
              </div>
              <button
                onClick={() => setBulkError(null)}
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

        {/* Results Display - Single Mode */}
        {mode === "single" && result && (
          <div className="space-y-6">
            {renderVerdict()}
            {renderValuation()}
            {result.analysis_steps && result.analysis_steps.length > 0 && renderAnalysisSteps(result.analysis_steps)}
            {renderParsedData(result.parsed_data)}
          </div>
        )}

        {/* Results Display - Bulk Mode */}
        {mode === "bulk" && bulkResults && renderBulkResults()}
      </div>
    </div>
  );
}
