'use client';

import { useState, useEffect } from 'react';
import { getSalesHistory } from '@/lib/api';
import { SalesRecord, SalesHistoryFilters } from '@/types/database';

export default function DatabasePage() {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage, setPerPage] = useState(50);
  
  // Filter state
  const [filters, setFilters] = useState<SalesHistoryFilters>({
    page: 1,
    per_page: 50,
    sort_by: 'sold_at',
    sort_order: 'desc',
  });
  
  // Filter form state
  const [playerIdFilter, setPlayerIdFilter] = useState('');
  const [brandIdFilter, setBrandIdFilter] = useState('');
  const [graderFilter, setGraderFilter] = useState('');
  const [minGradeFilter, setMinGradeFilter] = useState('');
  const [maxGradeFilter, setMaxGradeFilter] = useState('');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getSalesHistory(filters);
        setRecords(response.data);
        setTotalPages(response.pagination.total_pages);
        setTotalRecords(response.pagination.total);
        setCurrentPage(response.pagination.page);
        setPerPage(response.pagination.per_page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sales history');
        console.error('Error fetching sales history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Apply filters
  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      page: 1, // Reset to first page when applying filters
      player_id: playerIdFilter || undefined,
      brand_id: brandIdFilter || undefined,
      grader: graderFilter || undefined,
      min_grade: minGradeFilter ? parseFloat(minGradeFilter) : undefined,
      max_grade: maxGradeFilter ? parseFloat(maxGradeFilter) : undefined,
    });
  };

  // Clear filters
  const handleClearFilters = () => {
    setPlayerIdFilter('');
    setBrandIdFilter('');
    setGraderFilter('');
    setMinGradeFilter('');
    setMaxGradeFilter('');
    setFilters({
      page: 1,
      per_page: 50,
      sort_by: 'sold_at',
      sort_order: 'desc',
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  // Sorting handler
  const handleSort = (column: 'sold_at' | 'price' | 'grade' | 'player_id') => {
    const newOrder = filters.sort_by === column && filters.sort_order === 'desc' ? 'asc' : 'desc';
    setFilters({ ...filters, sort_by: column, sort_order: newOrder });
  };

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
    });
  };

  // Get grade color
  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500';
    if (grade === 10) return 'text-yellow-600 font-bold';
    if (grade >= 9) return 'text-gray-400 font-semibold';
    if (grade >= 8) return 'text-orange-600';
    return 'text-gray-600';
  };

  // Get sort indicator
  const getSortIndicator = (column: string) => {
    if (filters.sort_by !== column) return '⇅';
    return filters.sort_order === 'desc' ? '↓' : '↑';
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Sales History Database</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Browse and filter {totalRecords.toLocaleString()} sales records
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-neutral-200/80">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Player ID
              </label>
              <input
                type="text"
                value={playerIdFilter}
                onChange={(e) => setPlayerIdFilter(e.target.value)}
                placeholder="e.g., victor-wembanyama"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] bg-white hover:border-neutral-300 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Brand ID
              </label>
              <input
                type="text"
                value={brandIdFilter}
                onChange={(e) => setBrandIdFilter(e.target.value)}
                placeholder="e.g., panini-prizm"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] bg-white hover:border-neutral-300 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Grader
              </label>
              <select
                value={graderFilter}
                onChange={(e) => setGraderFilter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] bg-white hover:border-neutral-300 transition-colors"
              >
                <option value="">All Graders</option>
                <option value="PSA">PSA</option>
                <option value="BGS">BGS</option>
                <option value="SGC">SGC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Min Grade
              </label>
              <input
                type="number"
                value={minGradeFilter}
                onChange={(e) => setMinGradeFilter(e.target.value)}
                placeholder="0"
                min="0"
                max="10"
                step="0.5"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] bg-white hover:border-neutral-300 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Max Grade
              </label>
              <input
                type="number"
                value={maxGradeFilter}
                onChange={(e) => setMaxGradeFilter(e.target.value)}
                placeholder="10"
                min="0"
                max="10"
                step="0.5"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] bg-white hover:border-neutral-300 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Records per page
              </label>
              <select
                value={filters.per_page}
                onChange={(e) => setFilters({ ...filters, per_page: parseInt(e.target.value), page: 1 })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5E00] focus:border-[#FF5E00] bg-white hover:border-neutral-300 transition-colors"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-[#FF5E00] text-white rounded-lg hover:bg-[#FF5E00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF5E00] font-medium text-sm shadow-[0_2px_10px_rgba(255,94,0,0.2)] transition-all"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 font-medium text-sm transition-all"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-neutral-200/80">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5E00]"></div>
            <p className="mt-4 text-neutral-600">Loading sales records...</p>
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
                        ID
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={() => handleSort('player_id')}
                      >
                        Player {getSortIndicator('player_id')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Variation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={() => handleSort('grade')}
                      >
                        Grade {getSortIndicator('grade')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Grader
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={() => handleSort('price')}
                      >
                        Price {getSortIndicator('price')}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors"
                        onClick={() => handleSort('sold_at')}
                      >
                        Sold Date {getSortIndicator('sold_at')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-100">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                          No records found. Try adjusting your filters.
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr key={record.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {record.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {record.player_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {record.brand_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {record.variation_id || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {record.year}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${getGradeColor(record.grade)}`}>
                            {record.grade !== null ? record.grade : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {record.grader}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {formatPrice(record.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {formatDate(record.sold_at)}
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
                    {' '}({totalRecords.toLocaleString()} total records)
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
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
                          onClick={() => handlePageChange(pageNum)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
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
