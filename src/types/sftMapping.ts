import { DailySale, DailyFuel } from './index';

export interface SftToFormMapping {
  salesData: Partial<DailySale>;
  fuelData: Partial<DailyFuel>;
}

export interface SftProcessResultWithMapping {
  success: boolean;
  message: string;
  data?: {
    // All existing SFT data
    total_sales: number;
    fuel_sales: number;
    item_sales: number;
    gst: number;
    penny_rounding: number;
    total_pos: number;
    canadian_cash: number;
    safedrops_count: number;
    safedrops_amount: number;
    cash_on_hand: number;
    fuel_tax_gst: number;
    payouts: number;
    loyalty_discounts: number;
    // POS Transaction Details
    pos_visa: number;
    pos_mastercard: number;
    pos_amex: number;
    pos_commercial: number;
    pos_up_credit: number;
    pos_discover: number;
    pos_interac_debit: number;
    pos_debit_transaction_count: number;
    // AFD Transaction Details
    afd_visa: number;
    afd_mastercard: number;
    afd_amex: number;
    afd_commercial: number;
    afd_up_credit: number;
    afd_discover: number;
    afd_interac_debit: number;
    afd_debit_transaction_count: number;
    // Department Totals
    tobacco_25: number;
    tobacco_20: number;
    lottery_total: number;
    prepay_total: number;
    // Loyalty Discounts
    journey_discount: number;
    aeroplan_discount: number;
    // Fuel Volume Data
    diesel_volume: number;
    diesel_total: number;
    regular_volume: number;
    regular_total: number;
    plus_volume: number;
    plus_total: number;
    sup_plus_volume: number;
    sup_plus_total: number;
    files_processed: number;
    files_with_errors: number;
    processed_files: Array<any>;
    errors: Array<any>;
  };
  // New mapping data
  mapping?: SftToFormMapping;
}

export interface SaveMappedDataRequest {
  date: string;
  salesData: Partial<DailySale>;
  fuelData: Partial<DailyFuel>;
}

export interface SaveMappedDataResponse {
  success: boolean;
  message: string;
  data?: {
    salesId?: number;
    fuelId?: number;
  };
}
