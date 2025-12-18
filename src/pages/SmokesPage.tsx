import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { smokesApi, Smokes } from '../services/api';
import { canCreate, canDelete } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

const SmokesPage: React.FC = () => {
  usePageTitle('Smokes');
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [smokes, setSmokes] = useState<Smokes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dailySales, setDailySales] = useState<any[]>([]);

  useEffect(() => {
    fetchSmokes();
    // eslint-disable-next-line
  }, [currentPage]);

  const calculateDailySales = (allSmokes: Smokes[]) => {
    // Group by date and shift
    const groupedData: { [key: string]: { [shift: string]: { [item: string]: Smokes } } } = {};
    
    allSmokes.forEach(smoke => {
      const dateKey = smoke.date;
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { Morning: {}, Evening: {} };
      }
      groupedData[dateKey][smoke.shift][smoke.item] = smoke;
    });

    // Get sorted dates
    const dates = Object.keys(groupedData).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Calculate sales for last 7 days
    const sales = [];
    for (let i = 0; i < Math.min(dates.length - 1, 7); i++) {
      const currentDate = dates[i];
      const previousDate = dates[i + 1];
      
      const currentMorning = groupedData[currentDate]?.Morning || {};
      const previousMorning = groupedData[previousDate]?.Morning || {};
      const previousEvening = groupedData[previousDate]?.Evening || {};
      
      // Calculate for each item
      const itemSales: { [item: string]: number } = {};
      const allItems = new Set([
        ...Object.keys(currentMorning),
        ...Object.keys(previousMorning),
        ...Object.keys(previousEvening)
      ]);
      
      allItems.forEach(item => {
        const currentStart = parseFloat(String(currentMorning[item]?.start || 0));
        const previousStart = parseFloat(String(previousMorning[item]?.start || 0));
        const previousAddedMorning = parseFloat(String(previousMorning[item]?.added || 0));
        const previousAddedEvening = parseFloat(String(previousEvening[item]?.added || 0));
        
        // Formula: Previous Morning Start + Previous Day Total Added - Current Morning Start
        const sold = previousStart + previousAddedMorning + previousAddedEvening - currentStart;
        itemSales[item] = sold;
      });
      
      sales.push({
        date: currentDate,
        items: itemSales
      });
    }
    
    setDailySales(sales);
  };

  const fetchSmokes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all records to calculate sales (without pagination for calculation)
      const allResponse = await smokesApi.getAll({ 
        page: 1,
        per_page: 1000, // Get enough data for calculations
        sort_by: 'date',
        sort_direction: 'desc'
      });
      
      // Calculate daily sales from all data
      calculateDailySales(allResponse.data.data || []);
      
      // Fetch paginated data for display
      const response = await smokesApi.getAll({ 
        page: currentPage,
        per_page: 50,
        sort_by: 'date',
        sort_direction: 'desc'
      });
      setSmokes(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch smokes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSmoke = () => {
    navigate('/entry/smokes/add');
  };

  const handleEditSmoke = (smoke: Smokes) => {
    navigate(`/entry/smokes/${smoke.id}/edit`);
  };

  const handleDeleteSmoke = async (smoke: Smokes) => {
    if (!window.confirm(`Are you sure you want to delete this smoke entry?`)) {
      return;
    }

    setLoading(true);
    try {
      await smokesApi.delete(smoke.id);
      await fetchSmokes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete smoke entry');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Smokes</h1>
          {canCreate(currentUser) && (
            <button
              onClick={handleAddSmoke}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Smoke Entry
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Daily Sales Card */}
        {dailySales.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xs font-semibold text-gray-900 mb-4 uppercase">Daily Smokes Sales (Last 7 Days)</h2>
            <div className="space-y-6">
              {dailySales.map((daySale, index) => (
                <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                  <h3 className="text-xs font-medium text-gray-800 mb-2">
                    {new Date(daySale.date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short',
                      year: '2-digit',
                      weekday: 'short'
                    }).replace(/,/g, '')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(daySale.items).map(([item, sold]: [string, any]) => (
                      <div key={item} className="bg-gray-50 rounded px-3 py-2">
                        <span className="text-xs font-medium text-gray-700">{item}:</span>
                        <span className="ml-2 text-xs font-semibold text-blue-600">
                          {sold.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shift
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {smokes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No smoke entries found
                      </td>
                    </tr>
                  ) : (
                    smokes.map((smoke) => (
                      <tr key={smoke.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                          {new Date(smoke.date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short',
                            year: '2-digit',
                            weekday: 'short'
                          }).replace(/,/g, '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                          {smoke.item}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            smoke.shift === 'Morning' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {smoke.shift}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 text-right">
                          {Number(smoke.start).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 text-right">
                          {Number(smoke.end).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 text-right">
                          {Number(smoke.added).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                          <button
                            onClick={() => handleEditSmoke(smoke)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          {canDelete(currentUser) && (
                            <button
                              onClick={() => handleDeleteSmoke(smoke)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SmokesPage;
