import React, { useState, useEffect } from 'react';
import { DailySale } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

interface DailySalesFormProps {
  initialData?: DailySale;
  onSubmit: (data: DailySale) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const DailySalesForm: React.FC<DailySalesFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<DailySale>({
    date: new Date().toISOString().split('T')[0], // Set today's date as default
    fuel_sale: undefined,
    store_sale: undefined,
    store_discount: undefined,
    gst: undefined,
    penny_rounding: undefined,
    card: undefined,
    cash: undefined,
    coupon: undefined,
    delivery: undefined,
    lottery_payout: undefined,
    reported_total: undefined,
    number_of_safedrops: undefined,
    safedrops_amount: undefined,
    cash_on_hand: undefined,
    pos_visa: undefined,
    pos_mastercard: undefined,
    pos_amex: undefined,
    pos_commercial: undefined,
    pos_up_credit: undefined,
    pos_discover: undefined,
    pos_interac_debit: undefined,
    pos_debit_transaction_count: undefined,
    afd_visa: undefined,
    afd_mastercard: undefined,
    afd_amex: undefined,
    afd_commercial: undefined,
    afd_up_credit: undefined,
    afd_discover: undefined,
    afd_interac_debit: undefined,
    afd_debit_transaction_count: undefined,
    journey_discount: undefined,
    aeroplan_discount: undefined,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date.split('T')[0], // Convert to YYYY-MM-DD format
        // Use the values as they come from the backend (they should already be in the correct format)
        fuel_sale: initialData.fuel_sale,
        store_sale: initialData.store_sale,
        store_discount: initialData.store_discount,
        gst: initialData.gst,
        penny_rounding: initialData.penny_rounding,
        card: initialData.card,
        cash: initialData.cash,
        coupon: initialData.coupon,
        delivery: initialData.delivery,
        lottery_payout: initialData.lottery_payout,
        reported_total: initialData.reported_total,
        safedrops_amount: initialData.safedrops_amount,
        cash_on_hand: initialData.cash_on_hand,
        pos_visa: initialData.pos_visa,
        pos_mastercard: initialData.pos_mastercard,
        pos_amex: initialData.pos_amex,
        pos_commercial: initialData.pos_commercial,
        pos_up_credit: initialData.pos_up_credit,
        pos_discover: initialData.pos_discover,
        pos_interac_debit: initialData.pos_interac_debit,
        pos_debit_transaction_count: initialData.pos_debit_transaction_count,
        afd_visa: initialData.afd_visa,
        afd_mastercard: initialData.afd_mastercard,
        afd_amex: initialData.afd_amex,
        afd_commercial: initialData.afd_commercial,
        afd_up_credit: initialData.afd_up_credit,
        afd_discover: initialData.afd_discover,
        afd_interac_debit: initialData.afd_interac_debit,
        afd_debit_transaction_count: initialData.afd_debit_transaction_count,
        journey_discount: initialData.journey_discount,
        aeroplan_discount: initialData.aeroplan_discount,
      });
    }
  }, [initialData]);

  const handleInputChange = (field: keyof DailySale, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCurrencyInputChange = (field: keyof DailySale, value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (!numericValue) {
      setFormData(prev => ({
        ...prev,
        [field]: undefined
      }));
      return;
    }
    
    // Convert to decimal by dividing by 100
    const decimalValue = parseInt(numericValue, 10) / 100;
    
    setFormData(prev => ({
      ...prev,
      [field]: decimalValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure all monetary values are properly formatted for submission
    const submitData = {
      ...formData,
      fuel_sale: formData.fuel_sale || 0,
      store_sale: formData.store_sale || 0,
      store_discount: formData.store_discount || 0,
      gst: formData.gst || 0,
      penny_rounding: formData.penny_rounding || 0,
      card: formData.card || 0,
      cash: formData.cash || 0,
      coupon: formData.coupon || 0,
      delivery: formData.delivery || 0,
      reported_total: formData.reported_total || 0,
      safedrops_amount: formData.safedrops_amount || 0,
      cash_on_hand: formData.cash_on_hand || 0,
      pos_visa: formData.pos_visa || 0,
      pos_mastercard: formData.pos_mastercard || 0,
      pos_amex: formData.pos_amex || 0,
      pos_commercial: formData.pos_commercial || 0,
      pos_up_credit: formData.pos_up_credit || 0,
      pos_discover: formData.pos_discover || 0,
      pos_interac_debit: formData.pos_interac_debit || 0,
      pos_debit_transaction_count: formData.pos_debit_transaction_count || 0,
      afd_visa: formData.afd_visa || 0,
      afd_mastercard: formData.afd_mastercard || 0,
      afd_amex: formData.afd_amex || 0,
      afd_commercial: formData.afd_commercial || 0,
      afd_up_credit: formData.afd_up_credit || 0,
      afd_discover: formData.afd_discover || 0,
      afd_interac_debit: formData.afd_interac_debit || 0,
      afd_debit_transaction_count: formData.afd_debit_transaction_count || 0,
      journey_discount: formData.journey_discount || 0,
      aeroplan_discount: formData.aeroplan_discount || 0,
    };
    
    await onSubmit(submitData);
  };

  const handleCancel = () => {
    onCancel();
  };

  // Calculate totals
  const dailyTotal = (Number(formData.fuel_sale) || 0) + (Number(formData.store_sale) || 0) + 
                     (Number(formData.store_discount) || 0) + (Number(formData.gst) || 0) + 
                     (Number(formData.penny_rounding) || 0);
  
  const breakdownTotal = (Number(formData.card) || 0) + (Number(formData.cash) || 0) + 
                         (Number(formData.coupon) || 0) + (Number(formData.delivery) || 0) + 
                         (Number(formData.lottery_payout) || 0);
  
  const totalPosTransactions = (Number(formData.pos_visa) || 0) + (Number(formData.pos_mastercard) || 0) + 
                              (Number(formData.pos_amex) || 0) + (Number(formData.pos_commercial) || 0) + 
                              (Number(formData.pos_up_credit) || 0) + (Number(formData.pos_discover) || 0) + 
                              (Number(formData.pos_interac_debit) || 0);
  
  const totalAfdTransactions = (Number(formData.afd_visa) || 0) + (Number(formData.afd_mastercard) || 0) + 
                               (Number(formData.afd_amex) || 0) + (Number(formData.afd_commercial) || 0) + 
                               (Number(formData.afd_up_credit) || 0) + (Number(formData.afd_discover) || 0) + 
                               (Number(formData.afd_interac_debit) || 0);
  
  const totalLoyaltyDiscounts = (Number(formData.journey_discount) || 0) + (Number(formData.aeroplan_discount) || 0);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {initialData ? 'Edit Daily Sale' : 'Add New Daily Sale'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            onFocus={(e) => e.target.showPicker?.()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* General Section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reported Total (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.reported_total !== undefined ? Number(formData.reported_total).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('reported_total', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Safedrops *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.number_of_safedrops ?? ''}
                onChange={(e) => handleInputChange('number_of_safedrops', e.target.value === '' ? undefined : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safedrops Amount (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.safedrops_amount !== undefined ? Number(formData.safedrops_amount).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('safedrops_amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash on Hand (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.cash_on_hand !== undefined ? Number(formData.cash_on_hand).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('cash_on_hand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Daily Total Section */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Daily Total</h3>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(dailyTotal)}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-3">
            Total = Fuel Sales + Item Sales + Store Discount + GST + Penny Rounding
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Sales (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.fuel_sale !== undefined ? Number(formData.fuel_sale).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('fuel_sale', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Sales (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.store_sale !== undefined ? Number(formData.store_sale).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('store_sale', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Discount (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.store_discount !== undefined ? Number(formData.store_discount).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('store_discount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.gst !== undefined ? Number(formData.gst).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('gst', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Penny Rounding (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.penny_rounding !== undefined ? Number(formData.penny_rounding).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('penny_rounding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Breakdown Section */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Breakdown</h3>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-bold text-yellow-600">
                {formatCurrency(breakdownTotal)}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-3">
            Total = POS Sale + Cash + Loyalty Coupon + Delivery + Lottery Payout
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                POS Sale (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.card !== undefined ? Number(formData.card).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('card', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.cash !== undefined ? Number(formData.cash).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('cash', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loyalty Coupon (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.coupon !== undefined ? Number(formData.coupon).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('coupon', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.delivery !== undefined ? Number(formData.delivery).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('delivery', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lottery Payout (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.lottery_payout !== undefined ? Number(formData.lottery_payout).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('lottery_payout', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Card Transactions Section */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Card Transactions</h3>
          
          {/* POS Transaction Sub-section */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3 text-gray-700">POS Transaction</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VISA</label>
                <input
                  type="text"
                  required
                  value={formData.pos_visa !== undefined ? Number(formData.pos_visa).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('pos_visa', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MASTERCARD</label>
                <input
                  type="text"
                  required
                  value={formData.pos_mastercard !== undefined ? Number(formData.pos_mastercard).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('pos_mastercard', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AMEX</label>
                <input
                  type="text"
                  required
                  value={formData.pos_amex !== undefined ? Number(formData.pos_amex).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('pos_amex', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">COMMERCIAL</label>
                <input
                  type="text"
                  required
                  value={formData.pos_commercial !== undefined ? Number(formData.pos_commercial).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('pos_commercial', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UP CREDIT</label>
                <input
                  type="text"
                  required
                  value={formData.pos_up_credit !== undefined ? Number(formData.pos_up_credit).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('pos_up_credit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DISCOVER</label>
                <input
                  type="text"
                  required
                  value={formData.pos_discover !== undefined ? Number(formData.pos_discover).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('pos_discover', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">INTERAC DEBIT</label>
                <input
                  type="text"
                  required
                  value={formData.pos_interac_debit !== undefined ? Number(formData.pos_interac_debit).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('pos_interac_debit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NUMBER OF DEBIT TRANSACTION</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.pos_debit_transaction_count ?? ''}
                  onChange={(e) => handleInputChange('pos_debit_transaction_count', e.target.value === '' ? undefined : parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">VISA</label>
                <input
                  type="text"
                  required
                  value={formData.afd_visa !== undefined ? Number(formData.afd_visa).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('afd_visa', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MASTERCARD</label>
                <input
                  type="text"
                  required
                  value={formData.afd_mastercard !== undefined ? Number(formData.afd_mastercard).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('afd_mastercard', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AMEX</label>
                <input
                  type="text"
                  required
                  value={formData.afd_amex !== undefined ? Number(formData.afd_amex).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('afd_amex', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">COMMERCIAL</label>
                <input
                  type="text"
                  required
                  value={formData.afd_commercial !== undefined ? Number(formData.afd_commercial).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('afd_commercial', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UP CREDIT</label>
                <input
                  type="text"
                  required
                  value={formData.afd_up_credit !== undefined ? Number(formData.afd_up_credit).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('afd_up_credit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DISCOVER</label>
                <input
                  type="text"
                  required
                  value={formData.afd_discover !== undefined ? Number(formData.afd_discover).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('afd_discover', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">INTERAC DEBIT</label>
                <input
                  type="text"
                  required
                  value={formData.afd_interac_debit !== undefined ? Number(formData.afd_interac_debit).toFixed(2) : ''}
                  onChange={(e) => handleCurrencyInputChange('afd_interac_debit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NUMBER OF DEBIT TRANSACTION</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.afd_debit_transaction_count ?? ''}
                  onChange={(e) => handleInputChange('afd_debit_transaction_count', e.target.value === '' ? undefined : parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="mt-2 text-right">
              <span className="text-sm text-gray-600">AFD Total: {formatCurrency(totalAfdTransactions)}</span>
            </div>
          </div>
        </div>

        {/* Loyalty Section */}
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Loyalty</h3>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Discounts</div>
              <div className="text-xl font-bold text-indigo-600">
                {formatCurrency(totalLoyaltyDiscounts)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Journey Discount (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.journey_discount !== undefined ? Number(formData.journey_discount).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('journey_discount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aeroplan Discount (CAD) *
              </label>
              <input
                type="text"
                required
                value={formData.aeroplan_discount !== undefined ? Number(formData.aeroplan_discount).toFixed(2) : ''}
                onChange={(e) => handleCurrencyInputChange('aeroplan_discount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            placeholder="Enter any additional notes or comments..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (initialData ? 'Update' : 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailySalesForm; 