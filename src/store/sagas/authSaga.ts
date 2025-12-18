import { call, put, takeLatest, CallEffect, PutEffect } from 'redux-saga/effects';
import { loginStart, loginSuccess, loginFailure } from '../slices/authSlice';
import { authApi } from '../../services/api';
import { LoginCredentials } from '../../types';

interface LoginAction {
  type: string;
  payload: LoginCredentials;
}

function* loginSaga(action: LoginAction): Generator<CallEffect | PutEffect, void, any> {
  try {
    const { email, password } = action.payload;
    const response: any = yield call(authApi.login, email, password);
    yield put(loginSuccess(response.data));
  } catch (error: any) {
    yield put(loginFailure(error.response?.data?.message || 'Login failed'));
  }
}

export default function* authSaga(): Generator<any, void, any> {
  yield takeLatest(loginStart.type, loginSaga);
} 