import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseBreakdownApi, ExpenseBreakdown } from '../services/api';
import Modal from '../components/Modal';

const ExpenseBreakdownsPage: React.FC = () => {
	const navigate = useNavigate();
	const [expenseBreakdowns, setExpenseBreakdowns] = useState<ExpenseBreakdown[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [expenseBreakdownToDelete, setExpenseBreakdownToDelete] = useState<ExpenseBreakdown | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [sortBy, setSortBy] = useState('date');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
	const [filterExpenseTypeId, setFilterExpenseTypeId] = useState<string>('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const fetchExpenseBreakdowns = async () => {
		try {
			setLoading(true);
			const params: any = {
				page: currentPage,
				per_page: 15,
				sort_by: sortBy,
				sort_direction: sortDirection,
			};
			if (filterExpenseTypeId) params.expense_type_id = filterExpenseTypeId;
			if (startDate) params.start_date = startDate;
			if (endDate) params.end_date = endDate;

			const response = await expenseBreakdownApi.getAll(params);
			setExpenseBreakdowns(response.data.data);
			setTotalPages(response.data.last_page);
			setTotalItems(response.data.total);
		} catch (error) {
			console.error('Error fetching expense breakdowns:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchExpenseBreakdowns();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, sortBy, sortDirection, filterExpenseTypeId, startDate, endDate]);

	const handleAddNew = () => {
		navigate('/accounting/expense-breakdowns/new');
	};

	const handleView = (expenseBreakdown: ExpenseBreakdown) => {
		navigate(`/accounting/expense-breakdowns/${expenseBreakdown.id}`);
	};

	const handleEdit = (expenseBreakdown: ExpenseBreakdown) => {
		navigate(`/accounting/expense-breakdowns/${expenseBreakdown.id}/edit`);
	};

	const handleDeleteClick = (expenseBreakdown: ExpenseBreakdown) => {
		setExpenseBreakdownToDelete(expenseBreakdown);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!expenseBreakdownToDelete) return;
		try {
			setDeleting(true);
			await expenseBreakdownApi.delete(expenseBreakdownToDelete.id);
			fetchExpenseBreakdowns();
			setDeleteModalOpen(false);
			setExpenseBreakdownToDelete(null);
		} catch (error: any) {
			console.error('Error deleting expense breakdown:', error);
			alert(error.response?.data?.message || 'Error deleting expense breakdown');
		} finally {
			setDeleting(false);
		}
	};

	const handleCancelDelete = () => {
		setDeleteModalOpen(false);
		setExpenseBreakdownToDelete(null);
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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const formatCurrency = (amount: string | number) => {
		const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
		return `C$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const handleClearFilters = () => {
		setFilterExpenseTypeId('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	if (loading && expenseBreakdowns.length === 0) {
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
						<h1 className="text-3xl font-bold text-gray-900">Expense Breakdowns</h1>
						<p className="mt-1 text-sm text-gray-600">
							Track and manage expense breakdowns by type and date
						</p>
					</div>
					<button
						onClick={handleAddNew}
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						<svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						Add New Expense
					</button>
				</div>

				{/* Filters */}
				<div className="mb-4 bg-white p-4 rounded-lg shadow">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) => {
									setStartDate(e.target.value);
									setCurrentPage(1);
								}}
								className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
							<input
								type="date"
								value={endDate}
								onChange={(e) => {
									setEndDate(e.target.value);
									setCurrentPage(1);
								}}
								className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
						</div>
						<div className="md:col-span-2 flex items-end">
							<button
								onClick={handleClearFilters}
								className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
							>
								Clear Filters
							</button>
						</div>
					</div>
				</div>

				{/* Summary */}
				{totalItems > 0 && (
					<div className="mb-4 text-sm text-gray-600">
						Showing {expenseBreakdowns.length} of {totalItems} expense breakdowns
					</div>
				)}

				{/* Table */}
				<div className="bg-white shadow overflow-hidden sm:rounded-lg">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th
									onClick={() => handleSort('id')}
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
								>
									ID {getSortIcon('id')}
								</th>
								<th
									onClick={() => handleSort('date')}
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
								>
									Date {getSortIcon('date')}
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Expense Type
								</th>
								<th
									onClick={() => handleSort('amount')}
									className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
								>
									Amount {getSortIcon('amount')}
								</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Notes
						</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{expenseBreakdowns.map((expenseBreakdown) => (
								<tr key={expenseBreakdown.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{expenseBreakdown.id}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDate(expenseBreakdown.date)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
											{expenseBreakdown.expense_type?.expense_type || 'N/A'}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
										{formatCurrency(expenseBreakdown.amount)}
									</td>
						<td className="px-6 py-4 text-sm text-gray-500">
							{expenseBreakdown.notes || "-"}
						</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<button
											onClick={() => handleView(expenseBreakdown)}
											className="text-blue-600 hover:text-blue-900 mr-4"
										>
											View
										</button>
										<button
											onClick={() => handleEdit(expenseBreakdown)}
											className="text-indigo-600 hover:text-indigo-900 mr-4"
										>
											Edit
										</button>
										<button
											onClick={() => handleDeleteClick(expenseBreakdown)}
											className="text-red-600 hover:text-red-900"
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{expenseBreakdowns.length === 0 && !loading && (
						<div className="text-center py-12">
							<p className="text-gray-500">No expense breakdowns found. Create one to get started!</p>
						</div>
					)}
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="mt-4 flex items-center justify-between">
						<button
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<span className="text-sm text-gray-700">
							Page {currentPage} of {totalPages}
						</span>
						<button
							onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
							disabled={currentPage === totalPages}
							className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				)}
			</div>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={deleteModalOpen}
				onClose={handleCancelDelete}
				title="Delete Expense Breakdown"
			>
				<div className="mt-2">
					<p className="text-sm text-gray-500">
						Are you sure you want to delete this expense breakdown? This action cannot be undone.
					</p>
				</div>
				<div className="mt-4 flex justify-end space-x-3">
					<button
						onClick={handleCancelDelete}
						className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						onClick={handleConfirmDelete}
						disabled={deleting}
						className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
					>
						{deleting ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</Modal>
		</div>
	);
};

export default ExpenseBreakdownsPage;
