export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'staff';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  canCreate?: () => boolean;
  canUpdate?: () => boolean;
  canDelete?: () => boolean;
  canManageUsers?: () => boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

// User management types
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer' | 'staff';
}

export interface UpdateUserData {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor' | 'viewer' | 'staff';
}

export interface DailySale {
  id?: number;
  date: string;
  
  // Daily Total Section
  fuel_sale: number | undefined;
  store_sale: number | undefined;
  store_discount: number | undefined;
  gst: number | undefined;
  penny_rounding: number | undefined;
  daily_total?: number;
  
  // Breakdown Section
  card: number | undefined;
  cash: number | undefined;
  coupon: number | undefined;
  delivery: number | undefined;
  lottery_payout: number | undefined;
  breakdown_total?: number;
  
  // General Section
  reported_total: number | undefined;
  number_of_safedrops: number | undefined;
  safedrops_amount: number | undefined;
  cash_on_hand: number | undefined;
  
  // Card Transactions - POS Transaction
  pos_visa: number | undefined;
  pos_mastercard: number | undefined;
  pos_amex: number | undefined;
  pos_commercial: number | undefined;
  pos_up_credit: number | undefined;
  pos_discover: number | undefined;
  pos_interac_debit: number | undefined;
  pos_debit_transaction_count: number | undefined;
  
  // Card Transactions - AFD Transaction
  afd_visa: number | undefined;
  afd_mastercard: number | undefined;
  afd_amex: number | undefined;
  afd_commercial: number | undefined;
  afd_up_credit: number | undefined;
  afd_discover: number | undefined;
  afd_interac_debit: number | undefined;
  afd_debit_transaction_count: number | undefined;
  
  // Loyalty Section
  journey_discount: number | undefined;
  aeroplan_discount: number | undefined;
  
  // Low Margin Items Section
  tobacco_25: number | undefined;
  tobacco_20: number | undefined;
  tobacco_30: number | undefined;
  tobacco_35: number | undefined;
  tobacco_40: number | undefined;
  tobacco_45: number | undefined;
  tobacco_50: number | undefined;
  tobacco_55: number | undefined;
  tobacco_60: number | undefined;
  tobacco_65: number | undefined;
  tobacco_70: number | undefined;
  tobacco_75: number | undefined;
  tobacco_80: number | undefined;
  tobacco_85: number | undefined;
  tobacco_90: number | undefined;
  tobacco_95: number | undefined;
  tobacco_100: number | undefined;
  lottery: number | undefined;
  prepay: number | undefined;
  
  // Calculated totals
  total_pos_transactions?: number;
  total_afd_transactions?: number;
  total_loyalty_discounts?: number;
  total_low_margin_items?: number;
  store_sale_calculated?: number;
  approximate_profit?: number;
  
  // Legacy fields for backward compatibility
  total_product_sale?: number;
  total_counter_sale?: number;
  grand_total?: number;
  
  notes?: string;
  user_id?: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
}

export interface DailyFuel {
  id?: number;
  date: string;
  regular_quantity: number;
  regular_total_sale: number;
  plus_quantity: number;
  plus_total_sale: number;
  sup_plus_quantity: number;
  sup_plus_total_sale: number;
  diesel_quantity: number;
  diesel_total_sale: number;
  notes?: string;
  user_id?: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
  total_quantity?: number;
  total_amount?: number;
  average_price?: number;
  regular_price_per_liter?: number;
  plus_price_per_liter?: number;
  sup_plus_price_per_liter?: number;
  diesel_price_per_liter?: number;
}

export interface FuelVolume {
  id?: number;
  date: string;
  shift: 'morning' | 'evening';
  regular_tc_volume: number | null;
  regular_product_height: number | null;
  premium_tc_volume: number | null;
  premium_product_height: number | null;
  diesel_tc_volume: number | null;
  diesel_product_height: number | null;
  added_regular: number | null;
  added_premium: number | null;
  added_diesel: number | null;
  user_id?: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
  volume_end_of_day?: {
    regular: number | null;
    premium: number | null;
    diesel: number | null;
  };
  evening_shift?: FuelVolume;
  morning_shift?: FuelVolume;
}

export interface Vendor {
  id?: number;
  name: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  contact_person_title?: string;
  possible_products: string;
  payment_method: 'PAD' | 'Credit Card' | 'E-transfer' | 'Direct Deposit';
  etransfer_email?: string;
  bank_name?: string;
  transit_number?: string;
  institute_number?: string;
  account_number?: string;
  void_check_path?: string;
  notes?: string;
  user_id?: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
  canBeUpdatedBy?: (user: User) => boolean;
  canBeDeletedBy?: (user: User) => boolean;
}

export interface CreateVendorData {
  name: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  contact_person_title?: string;
  possible_products: string;
  payment_method: 'PAD' | 'Credit Card' | 'E-transfer' | 'Direct Deposit';
  etransfer_email?: string;
  bank_name?: string;
  transit_number?: string;
  institute_number?: string;
  account_number?: string;
  void_check?: File;
  notes?: string;
}

export interface UpdateVendorData {
  name: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  contact_person_title?: string;
  possible_products: string;
  payment_method: 'PAD' | 'Credit Card' | 'E-transfer' | 'Direct Deposit';
  etransfer_email?: string;
  bank_name?: string;
  transit_number?: string;
  institute_number?: string;
  account_number?: string;
  void_check?: File;
  notes?: string;
}

// Owner types
export interface Owner {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  ownership_percentage: number;
  notes?: string;
  is_active: boolean;
  user_id?: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
  total_equity?: number;
  total_contributions?: number;
  total_withdrawals?: number;
  total_distributions?: number;
  equity_transactions?: OwnerEquity[];
  canBeUpdatedBy?: (user: User) => boolean;
  canBeDeletedBy?: (user: User) => boolean;
}

export interface CreateOwnerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  ownership_percentage: number;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateOwnerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  ownership_percentage: number;
  notes?: string;
  is_active?: boolean;
}

// Owner Equity types
export interface OwnerEquity {
  id?: number;
  owner_id: number;
  transaction_type: 'contribution' | 'withdrawal' | 'distribution' | 'adjustment';
  amount: number;
  transaction_date: string;
  reference_number?: string;
  payment_method?: string;
  description?: string;
  notes?: string;
  user_id?: number;
  owner?: Owner;
  user?: User;
  created_at?: string;
  updated_at?: string;
  formatted_transaction_date?: string;
  formatted_amount?: string;
  transaction_type_display?: string;
  is_positive?: boolean;
  is_negative?: boolean;
  canBeUpdatedBy?: (user: User) => boolean;
  canBeDeletedBy?: (user: User) => boolean;
}

export interface CreateOwnerEquityData {
  owner_id: number;
  transaction_type: 'contribution' | 'withdrawal' | 'distribution' | 'adjustment';
  amount: number;
  transaction_date: string;
  reference_number?: string;
  payment_method?: string;
  description?: string;
  notes?: string;
}

export interface UpdateOwnerEquityData {
  owner_id: number;
  transaction_type: 'contribution' | 'withdrawal' | 'distribution' | 'adjustment';
  amount: number;
  transaction_date: string;
  reference_number?: string;
  payment_method?: string;
  description?: string;
  notes?: string;
}

export interface OwnerEquitySummary {
  total_owners: number;
  active_owners: number;
  total_equity: number;
  total_contributions: number;
  total_withdrawals: number;
  total_distributions: number;
  owners: Array<{
    id: number;
    name: string;
    ownership_percentage: number;
    total_equity: number;
    is_active: boolean;
  }>;
}

export interface OwnerSummary {
  owner: Owner;
  total_equity: number;
  total_contributions: number;
  total_withdrawals: number;
  total_distributions: number;
  recent_transactions: OwnerEquity[];
}

// Bank Account types
export interface BankAccount {
  id?: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: 'Checking' | 'Savings' | 'Business' | 'Credit' | 'Investment';
  routing_number?: string;
  swift_code?: string;
  currency: string;
  balance: number | string;
  is_active: boolean;
  notes?: string;
  user_id?: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
  formatted_balance?: string;
  masked_account_number?: string;
  canBeUpdatedBy?: (user: User) => boolean;
  canBeDeletedBy?: (user: User) => boolean;
}

export interface CreateBankAccountData {
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: 'Checking' | 'Savings' | 'Business' | 'Credit' | 'Investment';
  routing_number?: string;
  swift_code?: string;
  currency?: string;
  balance?: number;
  is_active?: boolean;
  notes?: string;
}

export interface UpdateBankAccountData {
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: 'Checking' | 'Savings' | 'Business' | 'Credit' | 'Investment';
  routing_number?: string;
  swift_code?: string;
  currency?: string;
  balance?: number;
  is_active?: boolean;
  notes?: string;
}

export interface BankAccountSummary {
  total_accounts: number;
  active_accounts: number;
  inactive_accounts: number;
  total_balance: number;
  formatted_total_balance: string;
  accounts_by_type: Array<{
    account_type: string;
    count: number;
    total_balance: number;
  }>;
}

// Safedrop Resolution types
export interface SafedropResolution {
  id: number;
  daily_sale_id: number;
  bank_account_id: number;
  user_id: number;
  amount: number | string;
  type: 'safedrops' | 'cash_in_hand';
  notes?: string;
  daily_sale?: DailySale;
  bank_account?: BankAccount;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface PendingItem {
  id: number;
  date: string;
  user?: User;
  safedrops: {
    total_amount: number | string;
    resolved_amount: number | string;
    pending_amount: number | string;
  };
  cash_in_hand: {
    total_amount: number | string;
    resolved_amount: number | string;
    pending_amount: number | string;
  };
}

export interface ResolutionData {
  bank_account_id: number;
  amount: number;
  notes?: string;
}

export interface CreateResolutionData {
  daily_sale_id: number;
  type: 'safedrops' | 'cash_in_hand';
  resolutions: ResolutionData[];
}

// Transaction types
export interface Transaction {
  id?: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number | string;
  description: string;
  bank_account_id: number;
  to_bank_account_id?: number;
  reference_number?: string;
  vendor_invoice_id?: number;
  transfer_transaction_id?: number;
  user_id?: number;
  bank_account?: BankAccount;
  to_bank_account?: BankAccount;
  vendor_invoice?: VendorInvoice;
  transfer_transaction?: Transaction;
  user?: User;
  created_at?: string;
  updated_at?: string;
  formatted_amount?: string;
  formatted_created_at?: string;
  transaction_type_display?: string;
  is_credit?: boolean;
  is_debit?: boolean;
  canBeViewedBy?: (user: User) => boolean;
  canBeUpdatedBy?: (user: User) => boolean;
  canBeDeletedBy?: (user: User) => boolean;
}

export interface CreateTransactionData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  bank_account_id: number;
  to_bank_account_id?: number;
  reference_number?: string;
  vendor_invoice_id?: number;
}

export interface UpdateTransactionData {
  description?: string;
  reference_number?: string;
}

export interface TransactionFilters {
  type?: 'all' | 'income' | 'expense' | 'transfer';
  bank_account_id?: number | 'all';
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
  sort_by?: 'created_at' | 'amount' | 'type' | 'description';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

export interface TransactionSummary {
  total_income: number | string;
  total_expenses: number | string;
  total_transfers: number | string;
  net_amount: number | string;
  transaction_count: number;
}

// Bank Transfer types
export interface BankTransfer {
  id?: number;
  from_bank_account_id: number;
  to_bank_account_id: number;
  amount: number | string;
  description: string;
  reference_number?: string;
  from_bank_account?: BankAccount;
  to_bank_account?: BankAccount;
  user?: User;
  created_at?: string;
  updated_at?: string;
  formatted_amount?: string;
  formatted_created_at?: string;
}

export interface CreateBankTransferData {
  from_bank_account_id: number;
  to_bank_account_id: number;
  amount: number;
  description: string;
  reference_number?: string;
}

export interface BankTransferFilters {
  bank_account_id?: number | 'all';
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
  sort_by?: 'created_at' | 'amount' | 'description';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

export interface BankTransferSummary {
  total_transfers: number;
  total_amount: number | string;
  avg_amount: number | string;
  largest_transfer: number | string;
  smallest_transfer: number | string;
}

// Vendor Invoice types (adding to existing types)
export interface VendorInvoice {
  id?: number;
  vendor_id: number;
  invoice_number: string;
  invoice_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  type: 'invoice' | 'credit_note' | 'receipt';
  reference?: string;
  payment_date?: string;
  payment_method?: string;
  invoice_file_path?: string;
  subtotal: number | string;
  gst: number | string;
  total: number | string;
  notes?: string;
  description?: string;
  bank_account_id?: number;
  user_id?: number;
  vendor?: Vendor;
  bank_account?: BankAccount;
  user?: User;
  transactions?: Transaction[];
  created_at?: string;
  updated_at?: string;
  formatted_total?: string;
  formatted_invoice_date?: string;
  formatted_payment_date?: string;
  canBeUpdatedBy?: (user: User) => boolean;
  canBeDeletedBy?: (user: User) => boolean;
} 