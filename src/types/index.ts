export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
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
  role: 'admin' | 'editor' | 'viewer';
}

export interface UpdateUserData {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface DailySale {
  id?: number;
  date: string;
  fuel_sale: number | undefined;
  store_sale: number | undefined;
  gst: number | undefined;
  card: number | undefined;
  cash: number | undefined;
  coupon: number | undefined;
  delivery: number | undefined;
  reported_total: number | undefined;
  notes?: string;
  user_id?: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
  total_product_sale?: number;
  total_counter_sale?: number;
  grand_total?: number;
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

// Vendor types
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
  order_before_days: string[];
  possible_delivery_days: string[];
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
  order_before_days: string[];
  possible_delivery_days: string[];
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
  order_before_days: string[];
  possible_delivery_days: string[];
  notes?: string;
} 