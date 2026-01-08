'use client';

import { useState, useEffect } from 'react';
import { getPurchases } from '@/lib/api';

interface Purchase {
  id: number;
  listing_title: string;
  listing_price: number;
  player_name: string | null;
  year: number | null;
  brand: string | null;
  variation: string | null;
  grade: number | null;
  grader: string | null;
  estimated_value: number | null;
  profit_loss: number | null;
  purchased_at: string | null;
  confidence: string | null;
  match_tier: string | null;
  sales_count: number | null;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(50);
  
  // Filter state
  const [playerFilter, setPlayerFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const skip = (currentPage - 1) * perPage;
        const response = await getPurchases(skip, perPage);
        setPurchases(response.purchases);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load purchase history');
        console.error('Error fetching purchases:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, perPage]);

  // Apply filters
  useEffect(() => {
    let filtered = purchases;
    
    if (playerFilter) {
      filtered = filtered.filter(p => 
        p.player_name?.toLowerCase().includes(playerFilter.toLowerCase())
      );
    }
    
    if (brandFilter) {
      filtered = filtered.filter(p => 
        p.brand?.toLowerCase().includes(brandFilter.toLowerCase())
      );
    }
    
    setFilteredPurchases(filtered);
  }, [purchases, playerFilter, brandFilter]);

  // Calculate totals
  const totalPurchasePrice = filteredPurchases.reduce((sum, p) => sum + p.listing_price, 0);
  const totalEstimatedValue = filteredPurchases.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  const totalProfitLoss = filteredPurchases.reduce((sum, p) => sum + (p.profit_loss || 0), 0);

  // Format price
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get profit/loss color
  const getProfitLossColor = (profitLoss: number | null) => {
    if (profitLoss === null) return 'text-gray-500';
    if (profitLoss > 0) return 'text-green-600 font-semibold';
    if (profitLoss < 0) return 'text-red-600 font-semibold';
    return 'text-yellow-600 font-semibold';
  };

  // Clear filters
  const handleClearFilters = () => {
    setPlayerFilter('');
    setBrandFilter('');
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Purchase History</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Track your card purchases and potential profits
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200/80">
            <p className="text-sm font-medium text-neutral-600">Total Purchases</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{filteredPurchases.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200/80">
            <p className="text-sm font-medium text-neutral-600">Total Spent</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{formatPrice(totalPurchasePrice)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200/80">
            <p className="text-sm font-medium text-neutral-600">Est. Value</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{formatPrice(totalEstimatedValue)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200/80">
            <p className="text-sm font-medium text-neutral-600">Total Profit/Loss</p>
            <p className={`text-2xl font-bold mt-1 ${getProfitLossColor(totalProfitLoss)}`}>
              {totalProfitLoss > 0 ? '+' : ''}{formatPrice(totalProfitLoss)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-neutral-200/80">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Player Name
              </label>
              <input
                type="text"
                value={playerFilter}
                onChange={(e) => setPlayerFilter(e.target.value)}
                placeholder="e.g., Victor Wembanyama"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] bg-white hover:border-neutral-300 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                placeholder="e.g., Panini Prizm"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] bg-white hover:border-neutral-300 transition-colors"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 font-medium text-sm transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-neutral-200/80">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5E00]"></div>
            <p className="mt-4 text-neutral-600">Loading purchases...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200/80">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Card
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Purchase Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Est. Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Profit/Loss
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Match Tier
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-100">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                          {purchases.length === 0 
                            ? "No purchases yet. Start analyzing cards and click 'Buy This Card' to track them here!"
                            : "No purchases match your filters."}
                        </td>
                      </tr>
                    ) : (
                      filteredPurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {formatDate(purchase.purchased_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-900">
                            <div className="max-w-md">
                              <p className="font-medium">{purchase.player_name || 'Unknown'}</p>
                              <p className="text-neutral-500 text-xs">
                                {purchase.year && `${purchase.year} `}
                                {purchase.brand}
                                {purchase.variation && ` - ${purchase.variation}`}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            {purchase.grader && purchase.grade 
                              ? `${purchase.grader} ${purchase.grade}`
                              : 'Ungraded'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {formatPrice(purchase.listing_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            {formatPrice(purchase.estimated_value)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${getProfitLossColor(purchase.profit_loss)}`}>
                            {purchase.profit_loss !== null && purchase.profit_loss > 0 ? '+' : ''}
                            {formatPrice(purchase.profit_loss)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              purchase.match_tier === 'exact_match' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {purchase.match_tier?.replace('_', ' ') || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm mt-4 px-6 py-4 border border-neutral-200/80">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                    {' '}({total.toLocaleString()} total purchases)
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 border rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#FF5E00] text-white border-[#FF5E00] shadow-sm'
                              : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
