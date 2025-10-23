import { SftProcessResult } from '../services/api/fileImportsApi';
import { DailySale, DailyFuel } from '../types';
import { SftToFormMapping } from '../types/sftMapping';

/**
 * Maps SFT processing results to DailySale and DailyFuel form data
 */
export function mapSftDataToForms(sftData: SftProcessResult['data'], date: string): SftToFormMapping {
  if (!sftData) {
    return {
      salesData: { date },
      fuelData: { date, regular_quantity: 0, regular_total_sale: 0, plus_quantity: 0, plus_total_sale: 0, sup_plus_quantity: 0, sup_plus_total_sale: 0, diesel_quantity: 0, diesel_total_sale: 0 }
    };
  }

  // Map to DailySale structure
  const salesData: Partial<DailySale> = {
    date,
    // Daily Total Section
    fuel_sale: sftData.fuel_sales || 0,
    store_sale: sftData.item_sales || 0,
    gst: sftData.gst || 0,
    penny_rounding: sftData.penny_rounding || 0,
    
    // Breakdown Section (use total_pos as card for now)
    card: sftData.total_pos || 0,
    cash: sftData.canadian_cash || 0,
    lottery_payout: sftData.payouts || 0,
    
    // General Section
    reported_total: sftData.total_sales || 0,
    number_of_safedrops: sftData.safedrops_count || 0,
    safedrops_amount: sftData.safedrops_amount || 0,
    cash_on_hand: sftData.cash_on_hand || 0,
    
    // POS Transaction Details
    pos_visa: sftData.pos_visa || 0,
    pos_mastercard: sftData.pos_mastercard || 0,
    pos_amex: sftData.pos_amex || 0,
    pos_commercial: sftData.pos_commercial || 0,
    pos_up_credit: sftData.pos_up_credit || 0,
    pos_discover: sftData.pos_discover || 0,
    pos_interac_debit: sftData.pos_interac_debit || 0,
    pos_debit_transaction_count: sftData.pos_debit_transaction_count || 0,
    
    // AFD Transaction Details
    afd_visa: sftData.afd_visa || 0,
    afd_mastercard: sftData.afd_mastercard || 0,
    afd_amex: sftData.afd_amex || 0,
    afd_commercial: sftData.afd_commercial || 0,
    afd_up_credit: sftData.afd_up_credit || 0,
    afd_discover: sftData.afd_discover || 0,
    afd_interac_debit: sftData.afd_interac_debit || 0,
    afd_debit_transaction_count: sftData.afd_debit_transaction_count || 0,
    
    // Loyalty Discounts
    journey_discount: sftData.journey_discount || 0,
    aeroplan_discount: sftData.aeroplan_discount || 0,
    
    // Low Margin Items (using department totals)
    tobacco_25: sftData.tobacco_25 || 0,
    tobacco_20: sftData.tobacco_20 || 0,
    lottery: sftData.lottery_total || 0,
    prepay: sftData.prepay_total || 0,
    
    // Default values for other fields
    store_discount: 0,
    coupon: (sftData.journey_discount || 0) + (sftData.aeroplan_discount || 0), // Loyalty Coupon = Journey + Aeroplan
    delivery: 0,
    notes: `Auto-imported from SFT files on ${new Date().toLocaleDateString()}`
  };

  // Map to DailyFuel structure
  const fuelData: Partial<DailyFuel> = {
    date,
    regular_quantity: sftData.regular_volume || 0,
    regular_total_sale: sftData.regular_total || 0,
    plus_quantity: sftData.plus_volume || 0,
    plus_total_sale: sftData.plus_total || 0,
    sup_plus_quantity: sftData.sup_plus_volume || 0,
    sup_plus_total_sale: sftData.sup_plus_total || 0,
    diesel_quantity: sftData.diesel_volume || 0,
    diesel_total_sale: sftData.diesel_total || 0,
    notes: `Auto-imported from SFT files on ${new Date().toLocaleDateString()}`
  };

  return {
    salesData,
    fuelData
  };
}

/**
 * Validates that mapped data is reasonable
 */
export function validateMappedData(mapping: SftToFormMapping): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate sales data
  const { salesData } = mapping;
  if (!salesData.date) {
    errors.push('Date is required');
  }
  
  if ((salesData.fuel_sale || 0) < 0) {
    errors.push('Fuel sale cannot be negative');
  }
  
  if ((salesData.store_sale || 0) < 0) {
    errors.push('Store sale cannot be negative');
  }

  // Validate fuel data
  const { fuelData } = mapping;
  if (!fuelData.date) {
    errors.push('Fuel date is required');
  }

  if ((fuelData.regular_quantity || 0) < 0 || 
      (fuelData.plus_quantity || 0) < 0 || 
      (fuelData.sup_plus_quantity || 0) < 0 || 
      (fuelData.diesel_quantity || 0) < 0) {
    errors.push('Fuel quantities cannot be negative');
  }

  if ((fuelData.regular_total_sale || 0) < 0 || 
      (fuelData.plus_total_sale || 0) < 0 || 
      (fuelData.sup_plus_total_sale || 0) < 0 || 
      (fuelData.diesel_total_sale || 0) < 0) {
    errors.push('Fuel total sales cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if daily sales/fuels records already exist for the given date
 */
export async function checkExistingRecords(date: string) {
  try {
    // This would need to be implemented with actual API calls
    // For now, return false to let the API handle the duplicate check
    return {
      salesExists: false,
      fuelsExists: false
    };
  } catch (error) {
    console.error('Error checking existing records:', error);
    return {
      salesExists: false,
      fuelsExists: false
    };
  }
}
