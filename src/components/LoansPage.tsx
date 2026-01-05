import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanApi, Loan, exchangeRateApi } from '../services/api';
import Modal from './Modal';

const LoansPage: React.FC = () => {
	const navigate = useNavigate();
	const [loans, setLoans] = useState<Loan[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [sortBy, setSortBy] = useState('created_at');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
	const [showAllAccounts, setShowAllAccounts] = useState(false);
	const [bdtToCADRate, setBdtToCADRate] = useState<number>(0);
	const [exchangeRateLoading, setExchangeRateLoading] = useState(true);

	const fetchLoans = async () => {
		try {
			setLoading(true);
			const response = await loanApi.getAll({
				page: currentPage,
				per_page: 10,
				sort_by: sortBy,
				sort_direction: sortDirection,
			});
			setLoans(response.data.data);
			setTotalPages(response.data.last_page);
			setTotalItems(response.data.total);
		} catch (error) {
			console.error('Error fetching loans:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchExchangeRate = async () => {
		try {
			setExchangeRateLoading(true);
			const rate = await exchangeRateApi.getRate('BDT', 'CAD');
			setBdtToCADRate(rate);
		} catch (error) {
			console.error('Error fetching exchange rate:', error);
		} finally {
			setExchangeRateLoading(false);
		}
	};

	useEffect(() => {
		fetchLoans();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, sortBy, sortDirection]);

	useEffect(() => {
		fetchExchangeRate();
	}, []);

	const handleAddNew = () => {
		navigate('/accounting/loan-accounts/new');
	};

	const handleView = (loan: Loan) => {
		navigate(`/accounting/loan-accounts/${loan.id}/view`);
	};

	const handleEdit = (loan: Loan) => {
		navigate(`/accounting/loan-accounts/${loan.id}/edit`);
	};

	const handleDeleteClick = (loan: Loan) => {
		setLoanToDelete(loan);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!loanToDelete) return;
		try {
			setDeleting(true);
			await loanApi.delete(loanToDelete.id);
			fetchLoans();
			setDeleteModalOpen(false);
			setLoanToDelete(null);
		} catch (error) {
			console.error('Error deleting loan:', error);
		} finally {
			setDeleting(false);
		}
	};

	const handleCancelDelete = () => {
		setDeleteModalOpen(false);
		setLoanToDelete(null);
	};

	const handleSort = (field: string) => {
		if (sortBy === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(field);
			setSortDirection('asc');
		}
	};

	const getSortIcon = (field: string) => {
		if (sortBy !== field) return null;
		return sortDirection === 'asc' ? '↑' : '↓';
	};

	const formatCurrency = (amount: string, currency: string = 'CAD') => {
		const numAmount = parseFloat(amount);
		const symbol = currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'BDT' ? '৳' : currency;
		return `${symbol}${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const calculateTotalBDT = (): number => {
		return loans
			.filter(loan => loan.currency === 'BDT')
			.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
	};

	const calculateTotalCAD = (): number => {
		return loans
			.filter(loan => loan.currency === 'CAD')
			.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
	};

	// Filter loans based on showAllAccounts checkbox
	const filteredLoans = showAllAccounts
		? loans
		: loans.filter(loan => parseFloat(loan.amount) !== 0);

	const convertBDTToCAD = (bdtAmount: number): number => {
		return bdtAmount * bdtToCADRate;
	};

	if (loading && loans.length === 0) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				{/* Header */}
				<div className="mb-6 flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Loan Accounts</h1>
						<p className="mt-1 text-sm text-gray-600">
							Manage loan accounts and track outstanding balances
						</p>
					</div>
					<div className="flex items-center space-x-4">
						{/* Show All Accounts Checkbox */}
						<label className="flex items-center text-sm text-gray-600">
							<input
								type="checkbox"
								checked={showAllAccounts}
								onChange={(e) => setShowAllAccounts(e.target.checked)}
								className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							Show accounts with zero balance
						</label>

						<button
							onClick={handleAddNew}
							className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							Add New Loan
						</button>
					</div>
				</div>

				{/* Summary Card */}
				<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-6 border border-blue-100">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center mb-4">
								<svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<h2 className="text-lg font-semibold text-gray-900">Total Loan Amounts</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* BDT Section */}
								<div className="bg-white rounded-lg p-4 shadow-sm">
									<div className="space-y-3">
										<div>
											<p className="text-sm text-gray-600 mb-1 font-medium">BDT Loans</p>
											<p className="text-2xl font-bold text-blue-600">
												{loading ? (
													<span className="text-base text-gray-400">Loading...</span>
												) : (
													formatCurrency(calculateTotalBDT().toString(), 'BDT')
												)}
											</p>
										</div>

										<div className="pt-3 border-t border-gray-200">
											<div className="flex items-center justify-between mb-1">
												<p className="text-xs text-gray-600 font-medium">CAD Equivalent</p>
												{!exchangeRateLoading && bdtToCADRate > 0 && (
													<p className="text-xs text-gray-500">
														1 BDT = {bdtToCADRate.toFixed(4)} CAD
													</p>
												)}
											</div>
											<p className="text-xl font-bold text-green-600">
												{exchangeRateLoading ? (
													<span className="text-base text-gray-400">Loading rate...</span>
												) : bdtToCADRate === 0 ? (
													<span className="text-base text-red-500">Rate unavailable</span>
												) : loading ? (
													<span className="text-base text-gray-400">Loading...</span>
												) : (
													formatCurrency(convertBDTToCAD(calculateTotalBDT()).toString(), 'CAD')
												)}
											</p>
										</div>
									</div>
								</div>

								{/* CAD Section */}
								<div className="bg-white rounded-lg p-4 shadow-sm">
									<div className="space-y-3">
										<div>
											<p className="text-sm text-gray-600 mb-1 font-medium">CAD Loans</p>
											<p className="text-2xl font-bold text-green-600">
												{loading ? (
													<span className="text-base text-gray-400">Loading...</span>
												) : (
													formatCurrency(calculateTotalCAD().toString(), 'CAD')
												)}
											</p>
										</div>

										<div className="pt-3 border-t border-gray-200">
											<p className="text-xs text-gray-600 font-medium mb-1">Total in CAD</p>
											<p className="text-xl font-bold text-indigo-600">
												{exchangeRateLoading || bdtToCADRate === 0 ? (
													<span className="text-base text-gray-400">Calculating...</span>
												) : loading ? (
													<span className="text-base text-gray-400">Loading...</span>
												) : (
													formatCurrency((calculateTotalCAD() + convertBDTToCAD(calculateTotalBDT())).toString(), 'CAD')
												)}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="ml-4">
							<div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
								<svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Table */}
				<div className="bg-white rounded-lg shadow-md">
					{/* Results Summary */}
					<div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
						<p className="text-sm text-gray-600">
							Showing {filteredLoans.length} of {totalItems} loan accounts
							{!showAllAccounts && filteredLoans.length < loans.length && (
								<span className="text-blue-600 ml-1">
									({loans.length - filteredLoans.length} with zero balance hidden)
								</span>
							)}
						</p>
					</div>

					{/* Table */}
					<div className="overflow-x-auto">
						<table className="min-w-full bg-white border border-gray-200 rounded-lg">
							<thead className="bg-gray-50">
								<tr>
									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
										onClick={() => handleSort('name')}
									>
										<div className="flex items-center space-x-1">
											<span>Loan Name</span>
											<span className="text-blue-600">{getSortIcon('name')}</span>
										</div>
									</th>

									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
										onClick={() => handleSort('amount')}
									>
										<div className="flex items-center space-x-1">
											<span>Amount</span>
											<span className="text-blue-600">{getSortIcon('amount')}</span>
										</div>
									</th>

									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
										onClick={() => handleSort('currency')}
									>
										<div className="flex items-center space-x-1">
											<span>Currency</span>
											<span className="text-blue-600">{getSortIcon('currency')}</span>
										</div>
									</th>

									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Notes
									</th>

									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
										onClick={() => handleSort('created_at')}
									>
										<div className="flex items-center space-x-1">
											<span>Created</span>
											<span className="text-blue-600">{getSortIcon('created_at')}</span>
										</div>
									</th>

									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{filteredLoans.length === 0 ? (
									<tr>
										<td colSpan={6} className="px-6 py-12 text-center text-gray-500">
											{!showAllAccounts && loans.length > 0 ? (
												<>
													All accounts with non-zero balance are shown.
													<br />
													<button
														onClick={() => setShowAllAccounts(true)}
														className="text-blue-600 hover:text-blue-800 font-medium mt-2"
													>
														Click here to show accounts with zero balance
													</button>
												</>
											) : (
												'No loan accounts found. Click "Add New Loan" to create one.'
											)}
										</td>
									</tr>
								) : (
									filteredLoans.map((loan) => (
										<tr key={loan.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 text-sm text-gray-900">
												<div className="font-medium">{loan.name}</div>
											</td>

											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												<div className="font-semibold text-green-600">
													{formatCurrency(loan.amount, loan.currency)}
												</div>
											</td>

											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
													{loan.currency}
												</span>
											</td>

											<td className="px-6 py-4 text-sm text-gray-900">
												<div className="max-w-xs truncate" title={loan.notes || ''}>
													{loan.notes || '-'}
												</div>
											</td>

											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDate(loan.created_at)}
											</td>

											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												<div className="flex justify-end space-x-2">
													<button
														onClick={() => handleView(loan)}
														className="text-gray-600 hover:text-gray-900"
													>
														View
													</button>
													<button
														onClick={() => handleEdit(loan)}
														className="text-blue-600 hover:text-blue-900"
													>
														Edit
													</button>
													<button
														onClick={() => handleDeleteClick(loan)}
														className="text-red-600 hover:text-red-900"
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
							<div className="flex items-center justify-between">
								<div className="text-sm text-gray-700">
									Page {currentPage} of {totalPages}
								</div>
								<div className="flex space-x-2">
									<button
										onClick={() => setCurrentPage(currentPage - 1)}
										disabled={currentPage === 1}
										className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Previous
									</button>
									<button
										onClick={() => setCurrentPage(currentPage + 1)}
										disabled={currentPage === totalPages}
										className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Next
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={deleteModalOpen}
				title="Delete Loan Account"
				onClose={handleCancelDelete}
				onConfirm={handleConfirmDelete}
				confirmText="Delete"
				cancelText="Cancel"
				loading={deleting}
			>
				Are you sure you want to delete the loan account <b>{loanToDelete?.name}</b>?
				<br />
				Amount: <b>{loanToDelete && formatCurrency(loanToDelete.amount, loanToDelete.currency)}</b>
			</Modal>
		</div>
	);
};

export default LoansPage;
