import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { dailyAtmApi } from '../services/api';
import { isAdmin } from '../utils/permissions';
import { formatDateForDisplay } from '../utils/dateUtils';

interface DailyAtm {
  id: number;
  date: string;
  no_of_transactions: number;
  withdraw: string;
  fee: string;
  resolved: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const DailyAtmViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [atm, setAtm] = useState<DailyAtm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAtm = async () => {
      try {
        const response = await dailyAtmApi.show(parseInt(id!));
        setAtm(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch ATM record');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAtm();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !atm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'ATM record not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/daily-atm')}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to ATM Records
        </button>
        {isAdmin(currentUser) && (
          <button
            onClick={() => navigate(`/daily-atm/${id}/edit`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ATM Record Details</h1>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
            <p className="text-lg text-gray-900">{formatDateForDisplay(atm.date)}</p>
          </div>

          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">No of Transactions</label>
            <p className="text-lg text-gray-900">{atm.no_of_transactions}</p>
          </div>

          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">Withdraw</label>
            <p className="text-lg text-gray-900">${parseFloat(atm.withdraw).toFixed(2)}</p>
          </div>

          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">Fee</label>
            <p className="text-lg text-gray-900">${parseFloat(atm.fee).toFixed(2)}</p>
          </div>

          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              atm.resolved 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {atm.resolved ? 'Resolved' : 'Pending'}
            </span>
          </div>

          {atm.notes && (
            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
              <p className="text-lg text-gray-900 whitespace-pre-wrap">{atm.notes}</p>
            </div>
          )}

          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
            <p className="text-lg text-gray-900">
              {new Date(atm.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="pb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">Updated At</label>
            <p className="text-lg text-gray-900">
              {new Date(atm.updated_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyAtmViewPage;
