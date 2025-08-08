import React, { useState, useEffect } from 'react';
import { DailySale } from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import { profitApi, ProfitPercentages } from '../services/api';

interface DailySalesDetailProps {
  sale: DailySale;
  onBack: () => void;
  onEdit: () => void;
}

const DailySalesDetail: React.FC<DailySalesDetailProps> = ({
  sale,
  onBack,
  onEdit
}) => {
  const [profitPercentages, setProfitPercentages] = useState<ProfitPercentages | null>(null);
  const [loadingPercentages, setLoadingPercentages] = useState(true);

  useEffect(() => {
    const fetchProfitPercentages = async () => {
      try {
        const response = await profitApi.getPercentages();
        setProfitPercentages(response.data);
      } catch (error) {
        console.error('Failed to fetch profit percentages:', error);
        // Use default values if API fails
        setProfitPercentages({
          fuel_percentage: 4,
          tobacco_25_percentage: 8,
          tobacco_20_percentage: 8,
          lottery_percentage: 2,
          prepay_percentage: 1,
          store_sale_percentage: 50,
        });
      } finally {
        setLoadingPercentages(false);
      }
    };

    fetchProfitPercentages();
  }, []);
  // Format currency values for display (values are already in decimal format from backend)
  const formatCurrencyValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '$0.00';
    return formatCurrency(value);
  };

  // Helper function to safely convert values to numbers
  const safeNumber = (value: number | undefined | null): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return 0;
    }
    return Number(value);
  };

  // Calculate totals (values are already in decimal format from backend)
  const dailyTotal = safeNumber(sale.fuel_sale) + safeNumber(sale.store_sale) + 
                     safeNumber(sale.store_discount) + safeNumber(sale.gst) + 
                     safeNumber(sale.penny_rounding);
  
  const breakdownTotal = safeNumber(sale.card) + safeNumber(sale.cash) + 
                         safeNumber(sale.coupon) + safeNumber(sale.delivery) + 
                         safeNumber(sale.lottery_payout);
  
  const totalPosTransactions = safeNumber(sale.pos_visa) + safeNumber(sale.pos_mastercard) + 
                              safeNumber(sale.pos_amex) + safeNumber(sale.pos_commercial) + 
                              safeNumber(sale.pos_up_credit) + safeNumber(sale.pos_discover) + 
                              safeNumber(sale.pos_interac_debit);
  
  const totalAfdTransactions = safeNumber(sale.afd_visa) + safeNumber(sale.afd_mastercard) + 
                               safeNumber(sale.afd_amex) + safeNumber(sale.afd_commercial) + 
                               safeNumber(sale.afd_up_credit) + safeNumber(sale.afd_discover) + 
                               safeNumber(sale.afd_interac_debit);
  
  const totalLoyaltyDiscounts = safeNumber(sale.journey_discount) + safeNumber(sale.aeroplan_discount);
  
  const totalLowMarginItems = safeNumber(sale.tobacco_25) + safeNumber(sale.tobacco_20) + safeNumber(sale.lottery) + safeNumber(sale.prepay);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daily Sale Details</h2>
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Date */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Date</h3>
        <p className="text-gray-600">{new Date(sale.date).toLocaleDateString()}</p>
      </div>

      {/* Approximate Profit Section */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Approximate Profit</h3>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Profit</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(sale.approximate_profit ?? 0)}</div>
          </div>
        </div>
        {loadingPercentages ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading profit percentages...</p>
          </div>
        ) : profitPercentages ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fuel Profit ({profitPercentages.fuel_percentage}%)</label>
              <p className="text-sm text-gray-600">Amount: {formatCurrency(safeNumber(sale.fuel_sale))}</p>
              <p className="text-lg font-semibold text-green-600">Profit: {formatCurrency((safeNumber(sale.fuel_sale) * profitPercentages.fuel_percentage) / 100)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tobacco 25 Profit ({profitPercentages.tobacco_25_percentage}%)</label>
              <p className="text-sm text-gray-600">Amount: {formatCurrency(safeNumber(sale.tobacco_25))}</p>
              <p className="text-lg font-semibold text-green-600">Profit: {formatCurrency((safeNumber(sale.tobacco_25) * profitPercentages.tobacco_25_percentage) / 100)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tobacco 20 Profit ({profitPercentages.tobacco_20_percentage}%)</label>
              <p className="text-sm text-gray-600">Amount: {formatCurrency(safeNumber(sale.tobacco_20))}</p>
              <p className="text-lg font-semibold text-green-600">Profit: {formatCurrency((safeNumber(sale.tobacco_20) * profitPercentages.tobacco_20_percentage) / 100)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lottery Profit ({profitPercentages.lottery_percentage}%)</label>
              <p className="text-sm text-gray-600">Amount: {formatCurrency(safeNumber(sale.lottery))}</p>
              <p className="text-lg font-semibold text-green-600">Profit: {formatCurrency((safeNumber(sale.lottery) * profitPercentages.lottery_percentage) / 100)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prepay Profit ({profitPercentages.prepay_percentage}%)</label>
              <p className="text-sm text-gray-600">Amount: {formatCurrency(safeNumber(sale.prepay))}</p>
              <p className="text-lg font-semibold text-green-600">Profit: {formatCurrency((safeNumber(sale.prepay) * profitPercentages.prepay_percentage) / 100)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Store Sale Profit ({profitPercentages.store_sale_percentage}%)</label>
              <p className="text-sm text-gray-600">Amount: {formatCurrency(safeNumber(sale.store_sale_calculated))}</p>
              <p className="text-lg font-semibold text-green-600">Profit: {formatCurrency((safeNumber(sale.store_sale_calculated) * profitPercentages.store_sale_percentage) / 100)}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">Failed to load profit percentages</p>
          </div>
        )}
      </div>

      {/* General Section */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reported Total</label>
            <p className="text-lg font-semibold text-blue-600">{formatCurrencyValue(sale.reported_total)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Safedrops</label>
            <p className="text-lg font-semibold text-blue-600">{sale.number_of_safedrops || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Safedrops Amount</label>
            <p className="text-lg font-semibold text-blue-600">{formatCurrencyValue(sale.safedrops_amount)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cash on Hand</label>
            <p className="text-lg font-semibold text-blue-600">{formatCurrencyValue(sale.cash_on_hand)}</p>
          </div>
        </div>
      </div>

      {/* Daily Total Section */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Daily Total</h3>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(dailyTotal)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fuel Sales</label>
            <p className="text-lg font-semibold text-green-600">{formatCurrencyValue(sale.fuel_sale)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Sales</label>
            <p className="text-lg font-semibold text-green-600">{formatCurrencyValue(sale.store_sale)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Store Discount</label>
            <p className="text-lg font-semibold text-green-600">{formatCurrencyValue(sale.store_discount)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GST</label>
            <p className="text-lg font-semibold text-green-600">{formatCurrencyValue(sale.gst)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Penny Rounding</label>
            <p className="text-lg font-semibold text-green-600">{formatCurrencyValue(sale.penny_rounding)}</p>
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Breakdown</h3>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl font-bold text-yellow-600">{formatCurrency(breakdownTotal)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">POS Sale</label>
            <p className="text-lg font-semibold text-yellow-600">{formatCurrencyValue(sale.card)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cash</label>
            <p className="text-lg font-semibold text-yellow-600">{formatCurrencyValue(sale.cash)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Loyalty Coupon</label>
            <p className="text-lg font-semibold text-yellow-600">{formatCurrencyValue(sale.coupon)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Delivery</label>
            <p className="text-lg font-semibold text-yellow-600">{formatCurrencyValue(sale.delivery)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lottery Payout</label>
            <p className="text-lg font-semibold text-yellow-600">{formatCurrencyValue(sale.lottery_payout)}</p>
          </div>
        </div>
      </div>

      {/* Card Transactions Section */}
      <div className="bg-purple-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Card Transactions</h3>
        
        {/* POS Transaction Sub-section */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3 text-gray-700">POS Transaction</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">VISA</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.pos_visa)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">MASTERCARD</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.pos_mastercard)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">AMEX</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.pos_amex)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">COMMERCIAL</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.pos_commercial)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">UP CREDIT</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.pos_up_credit)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">DISCOVER</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.pos_discover)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">INTERAC DEBIT</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.pos_interac_debit)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">NUMBER OF DEBIT TRANSACTION</label>
              <p className="font-semibold text-purple-600">{sale.pos_debit_transaction_count || 0}</p>
            </div>
          </div>
                      <div className="mt-2 text-right">
            <span className="text-sm text-gray-600">POS Total: {formatCurrency(totalPosTransactions)}</span>
          </div>
        </div>

        {/* AFD Transaction Sub-section */}
        <div>
          <h4 className="text-md font-semibold mb-3 text-gray-700">AFD Transaction</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">VISA</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.afd_visa)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">MASTERCARD</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.afd_mastercard)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">AMEX</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.afd_amex)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">COMMERCIAL</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.afd_commercial)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">UP CREDIT</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.afd_up_credit)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">DISCOVER</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.afd_discover)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">INTERAC DEBIT</label>
              <p className="font-semibold text-purple-600">{formatCurrencyValue(sale.afd_interac_debit)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">NUMBER OF DEBIT TRANSACTION</label>
              <p className="font-semibold text-purple-600">{sale.afd_debit_transaction_count || 0}</p>
            </div>
          </div>
                      <div className="mt-2 text-right">
            <span className="text-sm text-gray-600">AFD Total: {formatCurrency(totalAfdTransactions)}</span>
          </div>
        </div>
      </div>

      {/* Loyalty Section */}
      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Loyalty</h3>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Discounts</div>
            <div className="text-xl font-bold text-indigo-600">{formatCurrency(totalLoyaltyDiscounts / 100)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Journey Discount</label>
            <p className="text-lg font-semibold text-indigo-600">{formatCurrencyValue(sale.journey_discount)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Aeroplan Discount</label>
            <p className="text-lg font-semibold text-indigo-600">{formatCurrencyValue(sale.aeroplan_discount)}</p>
          </div>
        </div>
      </div>

      {/* Low Margin Items Section */}
      <div className="bg-orange-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Low Margin Items</h3>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl font-bold text-orange-600">{formatCurrency(totalLowMarginItems)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tobacco 25</label>
            <p className="text-lg font-semibold text-orange-600">{formatCurrencyValue(sale.tobacco_25)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tobacco 20</label>
            <p className="text-lg font-semibold text-orange-600">{formatCurrencyValue(sale.tobacco_20)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lottery</label>
            <p className="text-lg font-semibold text-orange-600">{formatCurrencyValue(sale.lottery)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prepay</label>
            <p className="text-lg font-semibold text-orange-600">{formatCurrencyValue(sale.prepay)}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {sale.notes && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{sale.notes}</p>
        </div>
      )}

      {/* User Info */}
      {sale.user && (
        <div className="text-sm text-gray-500">
          <p>Created by: {sale.user.name}</p>
          <p>Created at: {new Date(sale.created_at || '').toLocaleString()}</p>
          {sale.updated_at && sale.updated_at !== sale.created_at && (
            <p>Last updated: {new Date(sale.updated_at).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DailySalesDetail; 