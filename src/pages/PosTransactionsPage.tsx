import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { posTransactionsApi, PosTransaction } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

const PosTransactionsPage: React.FC = () => {
	usePageTitle('POS Transactions');
	const navigate = useNavigate();

	const [transactions, setTransactions] = useState<PosTransaction[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);

	const today = new Date().toISOString().split('T')[0];
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

	const [fromDate, setFromDate] = useState(thirtyDaysAgo);
	const [toDate, setToDate] = useState(today);
	const [registerId, setRegisterId] = useState('');
	const [cashierId, setCashierId] = useState('');

	const [appliedFrom, setAppliedFrom] = useState(thirtyDaysAgo);
	const [appliedTo, setAppliedTo] = useState(today);
	const [appliedRegister, setAppliedRegister] = useState('');
	const [appliedCashier, setAppliedCashier] = useState('');

	const fetchTransactions = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await posTransactionsApi.getAll({
				page: currentPage,
				per_page: 50,
				from: appliedFrom,
				to: appliedTo,
				...(appliedRegister ? { register_id: appliedRegister } : {}),
				...(appliedCashier ? { cashier_id: appliedCashier } : {}),
			});
			setTransactions(response.data.data || []);
			setTotalPages(response.data.last_page || 1);
			setTotal(response.data.total || 0);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch transactions');
		} finally {
			setLoading(false);
		}
	}, [currentPage, appliedFrom, appliedTo, appliedRegister, appliedCashier]);

	useEffect(() => {
		fetchTransactions();
	}, [fetchTransactions]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		setAppliedFrom(fromDate);
		setAppliedTo(toDate);
		setAppliedRegister(registerId);
		setAppliedCashier(cashierId);
	};

	const handleClear = () => {
		setFromDate(thirtyDaysAgo);
		setToDate(today);
		setRegisterId('');
		setCashierId('');
		setCurrentPage(1);
		setAppliedFrom(thirtyDaysAgo);
		setAppliedTo(today);
		setAppliedRegister('');
		setAppliedCashier('');
	};

	const formatDate = (dateStr: string) => {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: '2-digit',
		});
	};

	const formatTime = (dateTimeStr: string | null) => {
		if (!dateTimeStr) return '—';
		return new Date(dateTimeStr).toLocaleTimeString('en-CA', {
			timeZone: 'America/Edmonton',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	};

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="space-y-6">
				<div className="flex flex-wrap justify-between items-center gap-4">
					<h1 className="text-2xl font-bold text-gray-900">POS Transactions</h1>
					<span className="text-sm text-gray-500">{total.toLocaleString()} total</span>
				</div>

				{/* Filters */}
				<form onSubmit={handleSearch} className="flex flex-wrap gap-2">
					<div className="flex items-center gap-1">
						<label className="text-xs text-gray-500 whitespace-nowrap">From</label>
						<input
							type="date"
							value={fromDate}
							onChange={(e) => setFromDate(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div className="flex items-center gap-1">
						<label className="text-xs text-gray-500 whitespace-nowrap">To</label>
						<input
							type="date"
							value={toDate}
							onChange={(e) => setToDate(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<input
						type="text"
						placeholder="Register #"
						value={registerId}
						onChange={(e) => setRegisterId(e.target.value)}
						className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<input
						type="text"
						placeholder="Cashier ID"
						value={cashierId}
						onChange={(e) => setCashierId(e.target.value)}
						className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
					>
						Search
					</button>
					<button
						type="button"
						onClick={handleClear}
						className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
					>
						Clear
					</button>
				</form>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
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
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
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
											<td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
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
												<td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
													{formatDate(txn.business_date)}
												</td>
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
							<div className="flex justify-center items-center gap-2">
								<button
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
								>
									Previous
								</button>
								<span className="text-sm text-gray-700">
									Page {currentPage} of {totalPages}
								</span>
								<button
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									disabled={currentPage === totalPages}
									className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
								>
									Next
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default PosTransactionsPage;
