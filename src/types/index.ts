export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
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
  fuel_sale: number;
  store_sale: number;
  gst: number;
  card: number;
  cash: number;
  coupon: number;
  delivery: number;
  reported_total: number;
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
  fuel_type: string;
  quantity: number;
  price_per_liter: number;
  total_amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
} 