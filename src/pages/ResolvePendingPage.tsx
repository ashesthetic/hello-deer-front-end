import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { safedropResolutionApi, bankAccountsApi } from '../services/api';
import { PendingItem, BankAccount, SafedropResolution } from '../types';
import ResolutionModal from '../components/ResolutionModal';

const ResolvePendingPage: React.FC = () => {
	const currentUser = useSelector((state: RootState) => (state as any).auth.user);
	const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [resolutionHistory, setResolutionHistory] = useState<SafedropResolution[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
	const [selectedType, setSelectedType] = useState<'safedrops' | 'cash_in_hand' | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [showBatchModal, setShowBatchModal] = useState(false);
	const [showBatchCashModal, setShowBatchCashModal] = useState(false);
	const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

	// Only admins can access this page
	const canResolve = currentUser?.role === 'admin';

	const fetchData = async () => {
		try {
			setLoading(true);
			const [pendingResponse, bankAccountsResponse, historyResponse] = await Promise.all([
				safedropResolutionApi.getPendingItems(),
				bankAccountsApi.getAll({ per_page: 1000 }),
				safedropResolutionApi.getHistory({ per_page: 20 })
			]);

			setPendingItems(pendingResponse.data.data);
			setBankAccounts(bankAccountsResponse.data.data);
			setResolutionHistory(historyResponse.data.data);
		} catch (err: any) {
			setError(err.response?.data?.message || 'An error occurred while fetching data');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const formatCurrency = (amount: number | string): string => {
		const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
		return new Intl.NumberFormat('en-CA', {
			style: 'currency',
			currency: 'CAD'
		}).format(numAmount || 0);
	};

	const formatDate = (date: string): string => {
		return new Date(date).toLocaleDateString('en-CA');
	};

	const handleResolve = (item: PendingItem, type: 'safedrops' | 'cash_in_hand') => {
		if (!canResolve) return;

		setSelectedItem(item);
		setSelectedType(type);
		setShowModal(true);
	};

	const handleModalClose = () => {
		setShowModal(false);
		setSelectedItem(null);
		setSelectedType(null);
	};

	const handleResolutionSuccess = () => {
		fetchData(); // Refresh the data
		handleModalClose();
	};

	const handleBatchResolveAll = () => {
		setShowBatchModal(true);
	};

	const handleBatchResolveAllCash = () => {
		setShowBatchCashModal(true);
	};

	const handleBatchModalClose = () => {
		setShowBatchModal(false);
	};

	const handleBatchCashModalClose = () => {
		setShowBatchCashModal(false);
	};

	const handleBatchResolutionSuccess = () => {
		fetchData(); // Refresh the data
		handleBatchModalClose();
	};

	const handleBatchCashResolutionSuccess = () => {
		fetchData(); // Refresh the data
		handleBatchCashModalClose();
	};

	const pendingSafedrops = pendingItems.filter(item => parseFloat(item.safedrops.pending_amount.toString()) !== 0);
	const totalPendingSafedrops = pendingSafedrops.reduce((sum, item) =>
		sum + parseFloat(item.safedrops.pending_amount.toString()), 0
	);

	const pendingCashInHand = pendingItems.filter(item => parseFloat(item.cash_in_hand.pending_amount.toString()) !== 0);
	const totalPendingCashInHand = pendingCashInHand.reduce((sum, item) =>
		sum + parseFloat(item.cash_in_hand.pending_amount.toString()), 0
	);

	if (!canResolve) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
					<p className="text-gray-600">Only administrators can access the resolution system.</p>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading pending items...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
					<p className="text-gray-600 mb-4">{error}</p>
					<button
						onClick={fetchData}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-6">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900">Resolve Pending Amounts</h1>
					<p className="mt-2 text-gray-600">
						Resolve safedrops and cash in hand amounts by allocating them to bank accounts.
					</p>
				</div>

				{/* Tab Navigation */}
				<div className="mb-6">
					<nav className="flex space-x-8" aria-label="Tabs">
						<button
							onClick={() => setActiveTab('pending')}
							className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
						>
							Pending Items ({pendingItems.length})
						</button>
						<button
							onClick={() => setActiveTab('history')}
							className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
						>
							Resolution History
						</button>
					</nav>
				</div>

				{/* Tab Content */}
				{activeTab === 'pending' ? (
					// Pending Items Content
					pendingItems.length === 0 ? (
						<div className="bg-white rounded-lg shadow-sm p-8 text-center">
							<div className="text-gray-400 mb-4">
								<svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
							<p className="text-gray-600">There are no pending safedrops or cash in hand amounts to resolve.</p>
						</div>
					) : (
						<>
							{/* Resolve All Buttons */}
							<div className="mb-4 flex justify-end space-x-3">
								{pendingSafedrops.length > 0 && (
									<button
										onClick={handleBatchResolveAll}
										className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
									>
										<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
										</svg>
										Resolve All Safedrops ({pendingSafedrops.length})
									</button>
								)}
								{pendingCashInHand.length > 0 && (
									<button
										onClick={handleBatchResolveAllCash}
										className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
									>
										<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
										Resolve All Cash ({pendingCashInHand.length})
									</button>
								)}
							</div>

							<div className="bg-white rounded-lg shadow-sm overflow-hidden">
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Date
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													User
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Safedrops
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Cash in Hand
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Actions
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{pendingItems.map((item) => (
												<tr key={item.id} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{formatDate(item.date)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{item.user?.name || 'N/A'}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														<div className="space-y-1">
															<div className="flex justify-between">
																<span className="text-gray-600">Total:</span>
																<span className="font-medium">{formatCurrency(item.safedrops.total_amount)}</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">Resolved:</span>
																<span className="text-green-600">{formatCurrency(item.safedrops.resolved_amount)}</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">Pending:</span>
																<span className="font-bold text-orange-600">{formatCurrency(item.safedrops.pending_amount)}</span>
															</div>
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														<div className="space-y-1">
															<div className="flex justify-between">
																<span className="text-gray-600">Total:</span>
																<span className="font-medium">{formatCurrency(item.cash_in_hand.total_amount)}</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">Resolved:</span>
																<span className="text-green-600">{formatCurrency(item.cash_in_hand.resolved_amount)}</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">Pending:</span>
																<span className="font-bold text-orange-600">{formatCurrency(item.cash_in_hand.pending_amount)}</span>
															</div>
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
														{parseFloat(item.safedrops.pending_amount.toString()) !== 0 && (
															<button
																onClick={() => handleResolve(item, 'safedrops')}
																className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
															>
																Resolve Safedrops
															</button>
														)}
														{parseFloat(item.cash_in_hand.pending_amount.toString()) !== 0 && (
															<button
																onClick={() => handleResolve(item, 'cash_in_hand')}
																className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-2"
															>
																Resolve Cash
															</button>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</>
					)
				) : (
					// Resolution History Content
					<div className="bg-white rounded-lg shadow-sm overflow-hidden">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Date Resolved
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Sale Date
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Type
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Amount
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Bank Account
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Resolved By
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{resolutionHistory.map((resolution) => (
										<tr key={resolution.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{formatDate(resolution.created_at)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{resolution.daily_sale ? formatDate(resolution.daily_sale.date) : 'N/A'}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resolution.type === 'safedrops'
														? 'bg-blue-100 text-blue-800'
														: 'bg-green-100 text-green-800'
													}`}>
													{resolution.type === 'safedrops' ? 'Safedrops' : 'Cash in Hand'}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{formatCurrency(resolution.amount)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{resolution.bank_account?.account_name || 'N/A'}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{resolution.user?.name || 'N/A'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{resolutionHistory.length === 0 && (
							<div className="text-center py-8">
								<p className="text-gray-500">No resolution history found.</p>
							</div>
						)}
					</div>
				)}

				{/* Resolution Modal */}
				{showModal && selectedItem && selectedType && (
					<ResolutionModal
						item={selectedItem}
						type={selectedType}
						bankAccounts={bankAccounts}
						onClose={handleModalClose}
						onSuccess={handleResolutionSuccess}
					/>
				)}

				{/* Batch Resolution Modal */}
				{showBatchModal && (
					<BatchSafedropResolutionModal
						items={pendingSafedrops}
						bankAccounts={bankAccounts}
						totalAmount={totalPendingSafedrops}
						onClose={handleBatchModalClose}
						onSuccess={handleBatchResolutionSuccess}
					/>
				)}

				{/* Batch Cash Resolution Modal */}
				{showBatchCashModal && (
					<BatchCashResolutionModal
						items={pendingCashInHand}
						bankAccounts={bankAccounts}
						totalAmount={totalPendingCashInHand}
						onClose={handleBatchCashModalClose}
						onSuccess={handleBatchCashResolutionSuccess}
					/>
				)}
			</div>
		</div>
	);
};

// Batch Safedrop Resolution Modal Component
interface BatchSafedropResolutionModalProps {
	items: PendingItem[];
	bankAccounts: BankAccount[];
	totalAmount: number;
	onClose: () => void;
	onSuccess: () => void;
}

const BatchSafedropResolutionModal: React.FC<BatchSafedropResolutionModalProps> = ({
	items,
	bankAccounts,
	totalAmount,
	onClose,
	onSuccess
}) => {
	const [selectedBankAccount, setSelectedBankAccount] = useState<number>(0);
	const [notes, setNotes] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-CA', {
			style: 'currency',
			currency: 'CAD'
		}).format(amount);
	};

	const formatDate = (date: string): string => {
		return new Date(date).toLocaleDateString('en-CA');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (selectedBankAccount === 0) return;

		try {
			setLoading(true);
			setError(null);

			// Resolve each pending safedrop individually
			for (const item of items) {
				const pendingAmount = parseFloat(item.safedrops.pending_amount.toString());

				if (pendingAmount !== 0) {
					await safedropResolutionApi.resolve({
						daily_sale_id: item.id,
						type: 'safedrops',
						resolutions: [{
							bank_account_id: selectedBankAccount,
							amount: pendingAmount,
							notes: notes || undefined
						}]
					});
				}
			}

			onSuccess();
		} catch (err: any) {
			setError(err.response?.data?.message || 'An error occurred while processing the resolutions');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-lg font-bold text-gray-900">
						Resolve All Pending Safedrops
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Summary */}
				<div className="bg-purple-50 rounded-lg p-4 mb-6">
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
						<div>
							<span className="text-gray-600">Total Transactions:</span>
							<div className="font-bold text-purple-900">{items.length}</div>
						</div>
						<div>
							<span className="text-gray-600">Total Amount:</span>
							<div className="font-bold text-purple-900">{formatCurrency(totalAmount)}</div>
						</div>
						<div className="col-span-2 md:col-span-1">
							<span className="text-gray-600">Date Range:</span>
							<div className="font-medium text-purple-900">
								{items.length > 0 && `${formatDate(items[items.length - 1].date)} - ${formatDate(items[0].date)}`}
							</div>
						</div>
					</div>
				</div>

				{/* Items List */}
				<div className="mb-6 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50 sticky top-0">
							<tr>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
								<th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pending Amount</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{items.map((item) => (
								<tr key={item.id}>
									<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatDate(item.date)}</td>
									<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.user?.name || 'N/A'}</td>
									<td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-orange-600">
										{formatCurrency(parseFloat(item.safedrops.pending_amount.toString()))}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
						<div className="text-sm text-red-700">{error}</div>
					</div>
				)}

				<form onSubmit={handleSubmit}>
					{/* Bank Account Selection */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Select Bank Account * <span className="text-gray-500">(All safedrops will be allocated to this account)</span>
						</label>
						<select
							required
							value={selectedBankAccount}
							onChange={(e) => setSelectedBankAccount(parseInt(e.target.value))}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<option value={0}>Select bank account...</option>
							{bankAccounts
								.filter(account => account.is_active)
								.map((account) => (
									<option key={account.id} value={account.id}>
										{account.account_name} ({account.account_type}) - {formatCurrency(parseFloat(account.balance.toString()))}
									</option>
								))}
						</select>
					</div>

					{/* Notes */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Notes (Optional) <span className="text-gray-500">(Will be applied to all resolutions)</span>
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
							rows={3}
							placeholder="Add any notes about these resolutions..."
						/>
					</div>

					{/* Actions */}
					<div className="flex justify-end space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={selectedBankAccount === 0 || loading}
							className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? `Resolving ${items.length} Transaction(s)...` : `Resolve All (${items.length})`}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// Batch Cash Resolution Modal Component
interface BatchCashResolutionModalProps {
	items: PendingItem[];
	bankAccounts: BankAccount[];
	totalAmount: number;
	onClose: () => void;
	onSuccess: () => void;
}

const BatchCashResolutionModal: React.FC<BatchCashResolutionModalProps> = ({
	items,
	bankAccounts,
	totalAmount,
	onClose,
	onSuccess
}) => {
	const [selectedBankAccount, setSelectedBankAccount] = useState<number>(0);
	const [notes, setNotes] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-CA', {
			style: 'currency',
			currency: 'CAD'
		}).format(amount);
	};

	const formatDate = (date: string): string => {
		return new Date(date).toLocaleDateString('en-CA');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (selectedBankAccount === 0) return;

		try {
			setLoading(true);
			setError(null);

			// Resolve each pending cash in hand individually
			for (const item of items) {
				const pendingAmount = parseFloat(item.cash_in_hand.pending_amount.toString());

				if (pendingAmount !== 0) {
					await safedropResolutionApi.resolve({
						daily_sale_id: item.id,
						type: 'cash_in_hand',
						resolutions: [{
							bank_account_id: selectedBankAccount,
							amount: pendingAmount,
							notes: notes || undefined
						}]
					});
				}
			}

			onSuccess();
		} catch (err: any) {
			setError(err.response?.data?.message || 'An error occurred while processing the resolutions');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-lg font-bold text-gray-900">
						Resolve All Pending Cash in Hand
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Summary */}
				<div className="bg-emerald-50 rounded-lg p-4 mb-6">
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
						<div>
							<span className="text-gray-600">Total Transactions:</span>
							<div className="font-bold text-emerald-900">{items.length}</div>
						</div>
						<div>
							<span className="text-gray-600">Total Amount:</span>
							<div className="font-bold text-emerald-900">{formatCurrency(totalAmount)}</div>
						</div>
						<div className="col-span-2 md:col-span-1">
							<span className="text-gray-600">Date Range:</span>
							<div className="font-medium text-emerald-900">
								{items.length > 0 && `${formatDate(items[items.length - 1].date)} - ${formatDate(items[0].date)}`}
							</div>
						</div>
					</div>
				</div>

				{/* Items List */}
				<div className="mb-6 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50 sticky top-0">
							<tr>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
								<th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pending Amount</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{items.map((item) => (
								<tr key={item.id}>
									<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatDate(item.date)}</td>
									<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.user?.name || 'N/A'}</td>
									<td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
										{formatCurrency(parseFloat(item.cash_in_hand.pending_amount.toString()))}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
						<div className="text-sm text-red-700">{error}</div>
					</div>
				)}

				<form onSubmit={handleSubmit}>
					{/* Bank Account Selection */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Select Bank Account * <span className="text-gray-500">(All cash in hand will be allocated to this account)</span>
						</label>
						<select
							required
							value={selectedBankAccount}
							onChange={(e) => setSelectedBankAccount(parseInt(e.target.value))}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
						>
							<option value={0}>Select bank account...</option>
							{bankAccounts
								.filter(account => account.is_active)
								.map((account) => (
									<option key={account.id} value={account.id}>
										{account.account_name} ({account.account_type}) - {formatCurrency(parseFloat(account.balance.toString()))}
									</option>
								))}
						</select>
					</div>

					{/* Notes */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Notes (Optional) <span className="text-gray-500">(Will be applied to all resolutions)</span>
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
							rows={3}
							placeholder="Add any notes about these resolutions..."
						/>
					</div>

					{/* Actions */}
					<div className="flex justify-end space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={selectedBankAccount === 0 || loading}
							className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? `Resolving ${items.length} Transaction(s)...` : `Resolve All (${items.length})`}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ResolvePendingPage;
