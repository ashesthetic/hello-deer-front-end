import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseTypeApi, ExpenseType } from '../services/api';
import Modal from '../components/Modal';

const ExpenseTypesPage: React.FC = () => {
	const navigate = useNavigate();
	const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [expenseTypeToDelete, setExpenseTypeToDelete] = useState<ExpenseType | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [sortBy, setSortBy] = useState('created_at');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

	const fetchExpenseTypes = async () => {
		try {
			setLoading(true);
			const response = await expenseTypeApi.getAll({
				page: currentPage,
				per_page: 15,
				sort_by: sortBy,
				sort_direction: sortDirection,
			});
			setExpenseTypes(response.data.data);
			setTotalPages(response.data.last_page);
			setTotalItems(response.data.total);
		} catch (error) {
			console.error('Error fetching expense types:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchExpenseTypes();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, sortBy, sortDirection]);

	const handleAddNew = () => {
		navigate('/accounting/expense-types/new');
	};

	const handleView = (expenseType: ExpenseType) => {
		navigate(`/accounting/expense-types/${expenseType.id}`);
	};

	const handleEdit = (expenseType: ExpenseType) => {
		navigate(`/accounting/expense-types/${expenseType.id}/edit`);
	};

	const handleDeleteClick = (expenseType: ExpenseType) => {
		setExpenseTypeToDelete(expenseType);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!expenseTypeToDelete) return;
		try {
			setDeleting(true);
			await expenseTypeApi.delete(expenseTypeToDelete.id);
			fetchExpenseTypes();
			setDeleteModalOpen(false);
			setExpenseTypeToDelete(null);
		} catch (error: any) {
			console.error('Error deleting expense type:', error);
			alert(error.response?.data?.message || 'Error deleting expense type');
		} finally {
			setDeleting(false);
		}
	};

	const handleCancelDelete = () => {
		setDeleteModalOpen(false);
		setExpenseTypeToDelete(null);
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

	if (loading && expenseTypes.length === 0) {
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
						<h1 className="text-3xl font-bold text-gray-900">Expense Types</h1>
						<p className="mt-1 text-sm text-gray-600">
							Manage expense type categories with parent-child relationships
						</p>
					</div>
					<button
						onClick={handleAddNew}
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						<svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						Add New Expense Type
					</button>
				</div>

				{/* Summary */}
				{totalItems > 0 && (
					<div className="mb-4 text-sm text-gray-600">
						Showing {expenseTypes.length} of {totalItems} expense types
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
									onClick={() => handleSort('expense_type')}
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
								>
									Expense Type {getSortIcon('expense_type')}
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Parent Expense Type
								</th>
								<th
									onClick={() => handleSort('created_at')}
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
								>
									Created {getSortIcon('created_at')}
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{expenseTypes.map((expenseType) => (
								<tr key={expenseType.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{expenseType.id}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">
											{expenseType.expense_type}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{expenseType.parent_expense_type?.expense_type || '-'}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{formatDate(expenseType.created_at)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<button
											onClick={() => handleView(expenseType)}
											className="text-blue-600 hover:text-blue-900 mr-4"
										>
											View
										</button>
										<button
											onClick={() => handleEdit(expenseType)}
											className="text-indigo-600 hover:text-indigo-900 mr-4"
										>
											Edit
										</button>
										<button
											onClick={() => handleDeleteClick(expenseType)}
											className="text-red-600 hover:text-red-900"
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{expenseTypes.length === 0 && !loading && (
						<div className="text-center py-12">
							<p className="text-gray-500">No expense types found. Create one to get started!</p>
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
				title="Delete Expense Type"
			>
				<div className="mt-2">
					<p className="text-sm text-gray-500">
						Are you sure you want to delete "{expenseTypeToDelete?.expense_type}"? This action cannot be undone.
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

export default ExpenseTypesPage;
