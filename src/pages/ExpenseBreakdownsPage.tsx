import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { expenseBreakdownApi, ExpenseBreakdown, ExpenseType } from '../services/api';
import Modal from '../components/Modal';

const ExpenseBreakdownsPage: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const expenseTypeDropdownRef = useRef<HTMLDivElement>(null);
	const [expenseBreakdowns, setExpenseBreakdowns] = useState<ExpenseBreakdown[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [expenseBreakdownToDelete, setExpenseBreakdownToDelete] = useState<ExpenseBreakdown | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'date');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>((searchParams.get('sort_direction') as 'asc' | 'desc') || 'desc');
	const [perPage, setPerPage] = useState<string>(searchParams.get('per_page') || '15');
	const [selectedExpenseTypes, setSelectedExpenseTypes] = useState<string[]>(() => {
		const types = searchParams.get('expense_types');
		return types ? types.split(',') : [];
	});
	const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
	const [expenseTypesLoaded, setExpenseTypesLoaded] = useState(false);
	const [startDate, setStartDate] = useState(searchParams.get('start_date') || '');
	const [endDate, setEndDate] = useState(searchParams.get('end_date') || '');
	const [showExpenseTypeDropdown, setShowExpenseTypeDropdown] = useState(false);

	// Update URL when filters change
	useEffect(() => {
		const params: any = {
			page: currentPage.toString(),
			per_page: perPage,
			sort_by: sortBy,
			sort_direction: sortDirection,
		};
		if (selectedExpenseTypes.length > 0) params.expense_types = selectedExpenseTypes.join(',');
		if (startDate) params.start_date = startDate;
		if (endDate) params.end_date = endDate;

		setSearchParams(params);
	}, [currentPage, perPage, sortBy, sortDirection, selectedExpenseTypes, startDate, endDate, setSearchParams]);

	// Fetch expense types on mount
	useEffect(() => {
		const fetchExpenseTypes = async () => {
			try {
				const response = await expenseBreakdownApi.getExpenseTypes();
				// Handle different response structures
				const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
				setExpenseTypes(data);
				setExpenseTypesLoaded(true);
			} catch (error) {
				console.error('Error fetching expense types:', error);
				setExpenseTypesLoaded(true); // Set to true even on error to prevent blocking
			}
		};
		fetchExpenseTypes();
	}, []);

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (expenseTypeDropdownRef.current && !expenseTypeDropdownRef.current.contains(event.target as Node)) {
				setShowExpenseTypeDropdown(false);
			}
		};

		if (showExpenseTypeDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showExpenseTypeDropdown]);

	const fetchExpenseBreakdowns = async () => {
		try {
			setLoading(true);
			const params: any = {
				page: currentPage,
				sort_by: sortBy,
				sort_direction: sortDirection,
			};
			
			// Handle per_page - if ALL, send a large number
			if (perPage === 'ALL') {
				params.per_page = 999999;
			} else {
				params.per_page = Number(perPage);
			}
			
			// Get expanded expense type IDs (including children)
			if (selectedExpenseTypes.length > 0) {
				const expandedIds = getExpandedExpenseTypeIds();
				params.expense_type_ids = expandedIds.join(',');
			}
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
		// Only fetch expense breakdowns after expense types are loaded
		if (expenseTypesLoaded) {
			fetchExpenseBreakdowns();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, sortBy, sortDirection, perPage, selectedExpenseTypes, startDate, endDate, expenseTypesLoaded]);

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
		setSelectedExpenseTypes([]);
		setStartDate('');
		setEndDate('');
		setPerPage('15');
		setCurrentPage(1);
	};

	const handleExpenseTypeToggle = (typeId: string) => {
		setSelectedExpenseTypes(prev => {
			if (prev.includes(typeId)) {
				return prev.filter(id => id !== typeId);
			} else {
				return [...prev, typeId];
			}
		});
		setCurrentPage(1);
	};

	// Get all child expense type IDs recursively
	const getChildExpenseTypeIds = (typeId: number): number[] => {
		const type = expenseTypes.find(t => t.id === typeId);
		if (!type) {
			return [];
		}
		
		// Check both naming conventions (snake_case and camelCase)
		const children = (type.child_expense_types || (type as any).childExpenseTypes || []) as ExpenseType[];
		
		if (children.length === 0) {
			return [];
		}
		
		const childIds: number[] = [];
		children.forEach(child => {
			childIds.push(child.id);
			// Recursively get children of children
			childIds.push(...getChildExpenseTypeIds(child.id));
		});
		
		return childIds;
	};

	// Get expanded expense type IDs including children
	const getExpandedExpenseTypeIds = (): string[] => {
		const allIds = new Set<number>();
		
		selectedExpenseTypes.forEach(typeId => {
			const numId = Number(typeId);
			allIds.add(numId);
			// Add all children recursively
			const childIds = getChildExpenseTypeIds(numId);
			childIds.forEach(childId => allIds.add(childId));
		});
		
		return Array.from(allIds).map(id => id.toString());
	};

	const getTotalAmount = () => {
		return expenseBreakdowns.reduce((sum, item) => {
			const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
			return sum + amount;
		}, 0);
	};

	const handleDownloadCSV = () => {
		// Aggregate expenses by type
		const aggregated: { [key: string]: number } = {};
		
		expenseBreakdowns.forEach((item) => {
			const expenseType = item.expense_type?.expense_type || 'Unknown';
			const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
			
			if (aggregated[expenseType]) {
				aggregated[expenseType] += amount;
			} else {
				aggregated[expenseType] = amount;
			}
		});

		// Create CSV content
		let csvContent = 'Expense Type,Amount\n';
		
		// Sort by expense type name for consistent output
		let total = 0;
		Object.keys(aggregated).sort().forEach((expenseType) => {
			const amount = aggregated[expenseType].toFixed(2);
			csvContent += `"${expenseType}",${amount}\n`;
			total += aggregated[expenseType];
		});
		
		// Add total row
		csvContent += `\n"TOTAL",${total.toFixed(2)}\n`;

		// Create a Blob and trigger download
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		
		// Generate filename with date range if applicable
		let filename = 'expense-breakdowns';
		if (startDate && endDate) {
			filename += `_${startDate}_to_${endDate}`;
		} else if (startDate) {
			filename += `_from_${startDate}`;
		} else if (endDate) {
			filename += `_until_${endDate}`;
		}
		filename += '.csv';
		
		link.href = url;
		link.setAttribute('download', filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
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
					<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
							<select
								value={perPage}
								onChange={(e) => {
									setPerPage(e.target.value);
									setCurrentPage(1);
								}}
								className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							>
								<option value="15">15</option>
								<option value="30">30</option>
								<option value="50">50</option>
								<option value="100">100</option>
								<option value="ALL">ALL</option>
							</select>
						</div>
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
						<div className="relative" ref={expenseTypeDropdownRef}>
							<label className="block text-sm font-medium text-gray-700 mb-1">Expense Types</label>
							<button
								onClick={() => setShowExpenseTypeDropdown(!showExpenseTypeDropdown)}
								className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							>
								{selectedExpenseTypes.length === 0 ? 'All Types' : `${selectedExpenseTypes.length} selected`}
							</button>
							{showExpenseTypeDropdown && (
								<div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
									{expenseTypes.map((type) => (
										<label
											key={type.id}
											className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
										>
											<input
												type="checkbox"
												checked={selectedExpenseTypes.includes(type.id.toString())}
												onChange={() => handleExpenseTypeToggle(type.id.toString())}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<span className="ml-2 text-sm text-gray-900">{type.expense_type}</span>
										</label>
									))}
									{expenseTypes.length === 0 && (
										<div className="px-3 py-2 text-sm text-gray-500">No expense types available</div>
									)}
								</div>
							)}
						</div>
						<div className="flex items-end">
							<button
								onClick={handleClearFilters}
								className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
							>
								Clear Filters
							</button>
						</div>
					</div>
				</div>

				{/* Summary and Download */}
				{totalItems > 0 && (
					<div className="mb-4 flex justify-between items-center">
						<div className="text-sm text-gray-600">
							Showing {expenseBreakdowns.length} of {totalItems} expense breakdowns
						</div>
						<button
							onClick={handleDownloadCSV}
							className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
							Download CSV
						</button>
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
						{expenseBreakdowns.length > 0 && (
							<tfoot className="bg-gray-100">
								<tr>
									<td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
										Total:
									</td>
									<td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
										{formatCurrency(getTotalAmount())}
									</td>
									<td colSpan={2}></td>
								</tr>
							</tfoot>
						)}
					</table>

					{expenseBreakdowns.length === 0 && !loading && (
						<div className="text-center py-12">
							<p className="text-gray-500">No expense breakdowns found. Create one to get started!</p>
						</div>
					)}
				</div>

				{/* Pagination */}
				{totalPages > 1 && perPage !== 'ALL' && (
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
