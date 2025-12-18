import { call, put, takeLatest, CallEffect, PutEffect } from 'redux-saga/effects';
import {
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
} from '../slices/vendorSlice';
import { vendorsApi } from '../../services/api';
import { CreateVendorData, UpdateVendorData } from '../../types';

interface FetchVendorsAction {
  type: string;
  payload: any;
}

interface FetchVendorAction {
  type: string;
  payload: number;
}

interface CreateVendorAction {
  type: string;
  payload: CreateVendorData;
}

interface UpdateVendorAction {
  type: string;
  payload: { id: number; data: UpdateVendorData };
}

interface DeleteVendorAction {
  type: string;
  payload: number;
}

function* fetchVendorsSaga(action: FetchVendorsAction): Generator<CallEffect | PutEffect, void, any> {
  try {
    const response: any = yield call(vendorsApi.getAll, action.payload);
    // Extract data and meta from the paginated response
    const { data, meta } = response.data;
    yield put(fetchVendorsSuccess({ data, meta }));
  } catch (error: any) {
    console.error('Vendor fetch error:', error);
    yield put(fetchVendorsFailure(error.response?.data?.message || 'Failed to fetch vendors'));
  }
}

function* fetchVendorSaga(action: FetchVendorAction): Generator<CallEffect | PutEffect, void, any> {
  try {
    const response: any = yield call(vendorsApi.getById, action.payload);
    yield put(fetchVendorSuccess(response.data));
  } catch (error: any) {
    yield put(fetchVendorFailure(error.response?.data?.message || 'Failed to fetch vendor'));
  }
}

function* createVendorSaga(action: CreateVendorAction): Generator<CallEffect | PutEffect, void, any> {
  try {
    const response: any = yield call(vendorsApi.create, action.payload);
    yield put(createVendorSuccess(response.data.data));
  } catch (error: any) {
    yield put(createVendorFailure(error.response?.data?.message || 'Failed to create vendor'));
  }
}

function* updateVendorSaga(action: UpdateVendorAction): Generator<CallEffect | PutEffect, void, any> {
  try {
    const response: any = yield call(vendorsApi.update, action.payload.id, action.payload.data);
    yield put(updateVendorSuccess(response.data.data));
  } catch (error: any) {
    yield put(updateVendorFailure(error.response?.data?.message || 'Failed to update vendor'));
  }
}

function* deleteVendorSaga(action: DeleteVendorAction): Generator<CallEffect | PutEffect, void, any> {
  try {
    yield call(vendorsApi.delete, action.payload);
    yield put(deleteVendorSuccess(action.payload));
  } catch (error: any) {
    yield put(deleteVendorFailure(error.response?.data?.message || 'Failed to delete vendor'));
  }
}

export default function* vendorSaga(): Generator<any, void, any> {
  yield takeLatest(fetchVendorsStart.type, fetchVendorsSaga);
  yield takeLatest(fetchVendorStart.type, fetchVendorSaga);
  yield takeLatest(createVendorStart.type, createVendorSaga);
  yield takeLatest(updateVendorStart.type, updateVendorSaga);
  yield takeLatest(deleteVendorStart.type, deleteVendorSaga);
} 