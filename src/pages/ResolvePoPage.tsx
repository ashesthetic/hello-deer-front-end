import React, { useState, useEffect } from 'react';
import { dailyPosApi, bankAccountsApi } from '../services/api';
import { formatDateForDisplay } from '../utils/dateUtils';

interface DailyPo {
	id: number;
	date: string;
	amount: string;
	resolved: boolean;
	notes?: string;
	created_at: string;
	updated_at: string;
}

interface BankAccount {
	id: number;
	account_name: string;
	bank_name: string;
	balance: string;
	currency: string;
	is_active: boolean;
}

const ResolvePoPage: React.FC = () => {
	const [unresolvedPos, setUnresolvedPos] = useState<DailyPo[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showResolveModal, setShowResolveModal] = useState(false);
	const [selectedPo, setSelectedPo] = useState<DailyPo | null>(null);
	const [selectedBankAccount, setSelectedBankAccount] = useState<number | null>(null);
	const [resolveAmount, setResolveAmount] = useState('');
	const [notes, setNotes] = useState('');
	const [resolving, setResolving] = useState(false);

	useEffect(() => {
		fetchUnresolvedPos();
		fetchBankAccounts();
	}, []);

	const fetchUnresolvedPos = async () => {
		try {
			setLoading(true);
			const response = await dailyPosApi.index('per_page=1000');
			const allPos = response.data.data;
			const unresolved = allPos.filter((po: DailyPo) => !po.resolved);
			setUnresolvedPos(unresolved);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch POS records');
		} finally {
			setLoading(false);
		}
	};

	const fetchBankAccounts = async () => {
		try {
			const response = await bankAccountsApi.getAll({ per_page: 1000 });
			const accounts = response.data.data || response.data;
			setBankAccounts(Array.isArray(accounts) ? accounts.filter((account: BankAccount) => account.is_active) : []);
		} catch (err: any) {
			console.error('Failed to fetch bank accounts:', err);
		}
	};

	const handleResolveClick = (po: DailyPo) => {
		setSelectedPo(po);
		setResolveAmount(parseFloat(po.amount).toFixed(2));
		setShowResolveModal(true);
		setSelectedBankAccount(null);
		setNotes('');
	};

	const handleCloseModal = () => {
		setShowResolveModal(false);
		setSelectedPo(null);
		setSelectedBankAccount(null);
		setResolveAmount('');
		setNotes('');
	};

	const handleResolveSubmit = async () => {
		if (!selectedPo || !selectedBankAccount || !resolveAmount) return;

		try {
			setResolving(true);
			setError(null);

			await dailyPosApi.resolve(selectedPo.id, {
				bank_account_id: selectedBankAccount,
				amount: parseFloat(resolveAmount),
				notes: notes || undefined,
			});

			await fetchUnresolvedPos();
			handleCloseModal();
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to resolve POS record');
		} finally {
			setResolving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-gray-600">Loading...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-900">Resolve POS</h1>
			</div>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{error}
				</div>
			)}

			{unresolvedPos.length === 0 ? (
				<div className="bg-white rounded-lg shadow p-8 text-center">
					<svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<h3 className="text-lg font-medium text-gray-900 mb-2">All POS Records Resolved</h3>
					<p className="text-gray-600">There are no pending POS records to resolve.</p>
				</div>
			) : (
				<div className="bg-white rounded-lg shadow overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Amount
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Notes
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Action
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{unresolvedPos.map((po) => (
									<tr key={po.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{formatDateForDisplay(po.date)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
											${parseFloat(po.amount).toFixed(2)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-600">
											{po.notes || '—'}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<button
												onClick={() => handleResolveClick(po)}
												className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
											>
												Resolve
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Resolve Modal */}
			{showResolveModal && selectedPo && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
						<h2 className="text-xl font-bold text-gray-900 mb-4">Resolve POS</h2>

						<div className="mb-4 p-4 bg-gray-50 rounded-lg">
							<div className="flex justify-between mb-2">
								<span className="text-sm text-gray-600">Date:</span>
								<span className="text-sm font-medium text-gray-900">
									{formatDateForDisplay(selectedPo.date)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-gray-600">Amount:</span>
								<span className="text-sm font-bold text-green-600">
									${parseFloat(selectedPo.amount).toFixed(2)}
								</span>
							</div>
						</div>

						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Select Bank Account <span className="text-red-500">*</span>
							</label>
							<select
								value={selectedBankAccount || ''}
								onChange={(e) => setSelectedBankAccount(Number(e.target.value))}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
								required
							>
								<option value="">-- Select Bank Account --</option>
								{bankAccounts.map((account) => (
									<option key={account.id} value={account.id}>
										{account.bank_name} - {account.account_name} ({account.currency} ${parseFloat(account.balance).toFixed(2)})
									</option>
								))}
							</select>
						</div>

						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Amount <span className="text-red-500">*</span>
							</label>
							<input
								type="number"
								min="0"
								step="0.01"
								value={resolveAmount}
								onChange={(e) => setResolveAmount(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="0.00"
								required
							/>
						</div>

						<div className="mb-6">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Notes (Optional)
							</label>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Add any notes about this resolution..."
							/>
						</div>

						<div className="flex justify-end space-x-3">
							<button
								onClick={handleCloseModal}
								className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
								disabled={resolving}
							>
								Cancel
							</button>
							<button
								onClick={handleResolveSubmit}
								disabled={!selectedBankAccount || !resolveAmount || resolving}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{resolving ? 'Resolving...' : 'Confirm Resolution'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ResolvePoPage;
