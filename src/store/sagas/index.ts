import { all } from 'redux-saga/effects';
import authSaga from './authSaga';
import vendorSaga from './vendorSaga';

export default function* rootSaga() {
  yield all([
    authSaga(),
    vendorSaga(),
  ]);
} 