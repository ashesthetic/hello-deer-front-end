import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vendor, CreateVendorData, UpdateVendorData } from '../../types';

interface VendorState {
  vendors: Vendor[];
  currentVendor: Vendor | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

const initialState: VendorState = {
  vendors: [],
  currentVendor: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
};

const vendorSlice = createSlice({
  name: 'vendor',
  initialState,
  reducers: {
    // Fetch vendors
    fetchVendorsStart: (state, action: PayloadAction<any>) => {
      state.loading = true;
      state.error = null;
    },
    fetchVendorsSuccess: (state, action: PayloadAction<{ data: Vendor[]; meta: any }>) => {
      state.loading = false;
      state.vendors = action.payload.data;
      state.totalPages = action.payload.meta.last_page;
      state.currentPage = action.payload.meta.current_page;
      state.totalItems = action.payload.meta.total;
      state.error = null;
    },
    fetchVendorsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Fetch single vendor
    fetchVendorStart: (state, action: PayloadAction<number>) => {
      state.loading = true;
      state.error = null;
    },
    fetchVendorSuccess: (state, action: PayloadAction<Vendor>) => {
      state.loading = false;
      state.currentVendor = action.payload;
      state.error = null;
    },
    fetchVendorFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create vendor
    createVendorStart: (state, action: PayloadAction<CreateVendorData>) => {
      state.loading = true;
      state.error = null;
    },
    createVendorSuccess: (state, action: PayloadAction<Vendor>) => {
      state.loading = false;
      state.vendors.unshift(action.payload);
      state.error = null;
    },
    createVendorFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update vendor
    updateVendorStart: (state, action: PayloadAction<{ id: number; data: UpdateVendorData }>) => {
      state.loading = true;
      state.error = null;
    },
    updateVendorSuccess: (state, action: PayloadAction<Vendor>) => {
      state.loading = false;
      const index = state.vendors.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.vendors[index] = action.payload;
      }
      if (state.currentVendor?.id === action.payload.id) {
        state.currentVendor = action.payload;
      }
      state.error = null;
    },
    updateVendorFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete vendor
    deleteVendorStart: (state, action: PayloadAction<number>) => {
      state.loading = true;
      state.error = null;
    },
    deleteVendorSuccess: (state, action: PayloadAction<number>) => {
      state.loading = false;
      state.vendors = state.vendors.filter(v => v.id !== action.payload);
      if (state.currentVendor?.id === action.payload) {
        state.currentVendor = null;
      }
      state.error = null;
    },
    deleteVendorFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Clear current vendor
    clearCurrentVendor: (state) => {
      state.currentVendor = null;
    },

    // Clear error
    clearVendorError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchVendorsStart,
  fetchVendorsSuccess,
  fetchVendorsFailure,
  fetchVendorStart,
  fetchVendorSuccess,
  fetchVendorFailure,
  createVendorStart,
  createVendorSuccess,
  createVendorFailure,
  updateVendorStart,
  updateVendorSuccess,
  updateVendorFailure,
  deleteVendorStart,
  deleteVendorSuccess,
  deleteVendorFailure,
  clearCurrentVendor,
  clearVendorError,
} = vendorSlice.actions;

export default vendorSlice.reducer; 