import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { posTransactionsApi, PosTransaction, PosTransactionDateSummary } from '../services/api';
import { Pagination } from '../components/common/Pagination';
import { usePageTitle } from '../hooks/usePageTitle';

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const PosTransactionsPage: React.FC = () => {
	usePageTitle('POS Transactions');
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	// Derive all view state from URL
	const selectedDate = searchParams.get('date') || '';
	const fromParam    = searchParams.get('from') || thirtyDaysAgo;
	const toParam      = searchParams.get('to') || today;
	const pageParam    = parseInt(searchParams.get('page') || '1');
	const perPageParam = parseInt(searchParams.get('perPage') || '50');
	const cashierParam   = searchParams.get('cashier') || '';
	const registerParam  = searchParams.get('register') || '';
	const timeFromParam  = searchParams.get('timeFrom') || '';
	const timeToParam    = searchParams.get('timeTo') || '';
	const minTotalParam  = searchParams.get('minTotal') || '';
	const maxTotalParam  = searchParams.get('maxTotal') || '';

	// Data state
	const [dates, setDates] = useState<PosTransactionDateSummary[]>([]);
	const [transactions, setTransactions] = useState<PosTransaction[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);

	// Draft state for transaction filters (held locally until Search is submitted)
	const [draftCashier,  setDraftCashier]  = useState(cashierParam);
	const [draftRegister, setDraftRegister] = useState(registerParam);
	const [draftTimeFrom, setDraftTimeFrom] = useState(timeFromParam);
	const [draftTimeTo,   setDraftTimeTo]   = useState(timeToParam);
	const [draftMinTotal, setDraftMinTotal] = useState(minTotalParam);
	const [draftMaxTotal, setDraftMaxTotal] = useState(maxTotalParam);

	// Sync drafts from URL whenever selected date changes (clean state when jumping dates)
	useEffect(() => {
		setDraftCashier(cashierParam);
		setDraftRegister(registerParam);
		setDraftTimeFrom(timeFromParam);
		setDraftTimeTo(timeToParam);
		setDraftMinTotal(minTotalParam);
		setDraftMaxTotal(maxTotalParam);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedDate]);

	const updateParams = (updates: Record<string, string>) => {
		const next = new URLSearchParams(searchParams);
		Object.entries(updates).forEach(([k, v]) => {
			if (v === '') next.delete(k);
			else next.set(k, v);
		});
		setSearchParams(next);
	};

	// Fetch distinct business dates
	const fetchDates = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await posTransactionsApi.getDates({ from: fromParam, to: toParam });
			setDates(res.data || []);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch dates');
		} finally {
			setLoading(false);
		}
	}, [fromParam, toParam]);

	useEffect(() => {
		if (!selectedDate) fetchDates();
	}, [selectedDate, fetchDates]);

	// Fetch transactions for the selected date
	const fetchTransactions = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await posTransactionsApi.getAll({
				date: selectedDate,
				page: pageParam,
				per_page: perPageParam,
				...(cashierParam  ? { cashier_id: cashierParam }  : {}),
				...(registerParam ? { register_id: registerParam } : {}),
				...(timeFromParam ? { time_from: timeFromParam }   : {}),
				...(timeToParam   ? { time_to: timeToParam }       : {}),
				...(minTotalParam ? { min_total: minTotalParam }   : {}),
				...(maxTotalParam ? { max_total: maxTotalParam }   : {}),
			});
			setTransactions(res.data.data || []);
			setTotalPages(res.data.last_page || 1);
			setTotalItems(res.data.total || 0);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch transactions');
		} finally {
			setLoading(false);
		}
	}, [selectedDate, pageParam, perPageParam, cashierParam, registerParam, timeFromParam, timeToParam, minTotalParam, maxTotalParam]);

	useEffect(() => {
		if (selectedDate) fetchTransactions();
	}, [selectedDate, fetchTransactions]);

	// Navigation handlers
	const handleDateClick = (date: string) => {
		updateParams({ date, page: '1' });
	};

	const handleBackToDates = () => {
		updateParams({ date: '', page: '', perPage: '', cashier: '', register: '', timeFrom: '', timeTo: '', minTotal: '', maxTotal: '' });
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		updateParams({
			cashier:  draftCashier,
			register: draftRegister,
			timeFrom: draftTimeFrom,
			timeTo:   draftTimeTo,
			minTotal: draftMinTotal,
			maxTotal: draftMaxTotal,
			page:     '1',
		});
	};

	const handleClearFilters = () => {
		setDraftCashier('');
		setDraftRegister('');
		setDraftTimeFrom('');
		setDraftTimeTo('');
		setDraftMinTotal('');
		setDraftMaxTotal('');
		updateParams({ cashier: '', register: '', timeFrom: '', timeTo: '', minTotal: '', maxTotal: '', page: '1' });
	};

	const handlePageChange = (page: number) => updateParams({ page: page.toString() });
	const handlePerPageChange = (pp: number) => updateParams({ perPage: pp.toString(), page: '1' });

	// Format helpers
	const formatDate = (dateStr: string) => {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
			day: 'numeric', month: 'short', year: '2-digit',
		});
	};

	const formatTime = (dateTimeStr: string | null) => {
		if (!dateTimeStr) return '—';
		return new Date(dateTimeStr).toLocaleTimeString('en-CA', {
			timeZone: 'America/Edmonton',
			hour: 'numeric', minute: '2-digit', hour12: true,
		});
	};

	const hasActiveFilters = cashierParam || registerParam || timeFromParam || timeToParam || minTotalParam || maxTotalParam;

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="space-y-6">

				{!selectedDate ? (
					// ── DATE LIST VIEW ──────────────────────────────────────────
					<>
						<div className="flex flex-wrap justify-between items-center gap-4">
							<h1 className="text-2xl font-bold text-gray-900">POS Transactions</h1>
							<span className="text-sm text-gray-500">{dates.length} date{dates.length !== 1 ? 's' : ''}</span>
						</div>

						{/* Date range filter */}
						<div className="flex flex-wrap items-center gap-2">
							<div className="flex items-center gap-1">
								<label className="text-xs text-gray-500 whitespace-nowrap">From</label>
								<input
									type="date"
									value={fromParam}
									onChange={(e) => updateParams({ from: e.target.value, to: toParam })}
									className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div className="flex items-center gap-1">
								<label className="text-xs text-gray-500 whitespace-nowrap">To</label>
								<input
									type="date"
									value={toParam}
									onChange={(e) => updateParams({ from: fromParam, to: e.target.value })}
									className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
						)}

						{loading ? (
							<div className="flex justify-center items-center py-12">
								<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
							</div>
						) : (
							<div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{dates.length === 0 ? (
											<tr>
												<td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
													No dates found
												</td>
											</tr>
										) : (
											dates.map((d) => (
												<tr
													key={d.date}
													onClick={() => handleDateClick(d.date)}
													className="hover:bg-blue-50 cursor-pointer"
												>
													<td className="px-4 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">
														{formatDate(d.date)}
													</td>
													<td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
														{d.transaction_count.toLocaleString()}
													</td>
													<td className="px-4 py-3 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
														${Number(d.total_grand_amount).toFixed(2)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						)}
					</>
				) : (
					// ── TRANSACTION VIEW ────────────────────────────────────────
					<>
						<div className="flex flex-wrap items-center gap-3">
							<button
								onClick={handleBackToDates}
								className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
							>
								← All Dates
							</button>
							<h1 className="text-2xl font-bold text-gray-900">{formatDate(selectedDate)}</h1>
							{!loading && (
								<span className="text-sm text-gray-500">{totalItems.toLocaleString()} transaction{totalItems !== 1 ? 's' : ''}</span>
							)}
						</div>

						{/* Transaction filters */}
						<form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-end">
							<div className="flex items-center gap-1">
								<label className="text-xs text-gray-500 whitespace-nowrap">Date</label>
								<input
									type="date"
									value={selectedDate}
									onChange={(e) => updateParams({ date: e.target.value, page: '1' })}
									className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<input
								type="text"
								placeholder="Cashier ID"
								value={draftCashier}
								onChange={(e) => setDraftCashier(e.target.value)}
								className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<input
								type="text"
								placeholder="Register #"
								value={draftRegister}
								onChange={(e) => setDraftRegister(e.target.value)}
								className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<div className="flex items-center gap-1">
								<label className="text-xs text-gray-500 whitespace-nowrap">Time</label>
								<input
									type="time"
									value={draftTimeFrom}
									onChange={(e) => setDraftTimeFrom(e.target.value)}
									className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<span className="text-xs text-gray-400">–</span>
								<input
									type="time"
									value={draftTimeTo}
									onChange={(e) => setDraftTimeTo(e.target.value)}
									className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div className="flex items-center gap-1">
								<label className="text-xs text-gray-500 whitespace-nowrap">Total $</label>
								<input
									type="number"
									placeholder="Min"
									value={draftMinTotal}
									onChange={(e) => setDraftMinTotal(e.target.value)}
									min="0"
									step="0.01"
									className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<span className="text-xs text-gray-400">–</span>
								<input
									type="number"
									placeholder="Max"
									value={draftMaxTotal}
									onChange={(e) => setDraftMaxTotal(e.target.value)}
									min="0"
									step="0.01"
									className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<button
								type="submit"
								className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
							>
								Search
							</button>
							{hasActiveFilters && (
								<button
									type="button"
									onClick={handleClearFilters}
									className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
								>
									Clear
								</button>
							)}
						</form>

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
						)}

						{loading ? (
							<div className="flex justify-center items-center py-12">
								<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
							</div>
						) : (
							<>
								<div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Register</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
												<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
												<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
												<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flags</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{transactions.length === 0 ? (
												<tr>
													<td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
														No transactions found
													</td>
												</tr>
											) : (
												transactions.map((txn) => (
													<tr
														key={txn.id}
														onClick={() => navigate(`/tools/pos-transactions/${txn.id}`)}
														className="hover:bg-blue-50 cursor-pointer"
													>
														<td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
															{formatTime(txn.started_at)}
														</td>
														<td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
															{txn.register_id}
														</td>
														<td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
															{txn.cashier_id}
														</td>
														<td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
															{txn.items_count ?? 0}
														</td>
														<td className="px-4 py-3 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
															${Number(txn.total_grand_amount).toFixed(2)}
														</td>
														<td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
															{txn.is_training && <span className="mr-1 text-yellow-600 font-medium">TRAIN</span>}
															{txn.is_offline && <span className="mr-1 text-orange-600 font-medium">OFFLN</span>}
															{txn.is_suspended && <span className="text-red-600 font-medium">SUSP</span>}
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>

								{totalPages > 1 && (
									<Pagination
										currentPage={pageParam}
										totalPages={totalPages}
										totalItems={totalItems}
										perPage={perPageParam}
										onPageChange={handlePageChange}
										onPerPageChange={handlePerPageChange}
									/>
								)}
							</>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default PosTransactionsPage;
