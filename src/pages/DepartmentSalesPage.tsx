import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { departmentSalesApi, departmentsApi, DepartmentSale, Department } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

const DepartmentSalesPage: React.FC = () => {
	usePageTitle('Department Sales');
	const [searchParams] = useSearchParams();
	const showQty = searchParams.get('qty') === '1';

	const [sales, setSales] = useState<DepartmentSale[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [departmentFilter, setDepartmentFilter] = useState('');
	const [dateFilter, setDateFilter] = useState('');

	useEffect(() => {
		departmentsApi
			.getAll({ per_page: 200, sort_by: 'department_number', sort_direction: 'asc' })
			.then((res) => setDepartments(res.data.data || []))
			.catch(() => {});
	}, []);

	const fetchSales = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await departmentSalesApi.getAll({
				page: currentPage,
				per_page: 50,
				sort_by: 'date',
				sort_direction: 'desc',
				...(departmentFilter ? { department_number: departmentFilter } : {}),
				...(dateFilter ? { date: dateFilter } : {}),
			});
			setSales(response.data.data || []);
			setTotalPages(response.data.last_page || 1);
			setTotal(response.data.total || 0);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch department sales');
		} finally {
			setLoading(false);
		}
	}, [currentPage, departmentFilter, dateFilter]);

	useEffect(() => {
		fetchSales();
	}, [fetchSales]);

	const handleDepartmentChange = (value: string) => {
		setDepartmentFilter(value);
		setCurrentPage(1);
	};

	const handleDateChange = (value: string) => {
		setDateFilter(value);
		setCurrentPage(1);
	};

	const handleClearFilters = () => {
		setDepartmentFilter('');
		setDateFilter('');
		setCurrentPage(1);
	};

	const hasFilters = departmentFilter || dateFilter;

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="space-y-6">
				<div className="flex flex-wrap justify-between items-center gap-4">
					<h1 className="text-2xl font-bold text-gray-900">Department Sales</h1>
					<span className="text-sm text-gray-500">{total} total</span>
				</div>

				{/* Filters */}
				<div className="flex flex-wrap gap-2 items-center">
					<select
						value={departmentFilter}
						onChange={(e) => handleDepartmentChange(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">All Departments</option>
						{departments.map((d) => (
							<option key={d.department_number} value={d.department_number}>
								{d.department_number} — {d.name}
							</option>
						))}
					</select>
					<input
						type="date"
						value={dateFilter}
						onChange={(e) => handleDateChange(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					{hasFilters && (
						<button
							onClick={handleClearFilters}
							className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
						>
							Clear
						</button>
					)}
				</div>

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
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Date
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Department
										</th>
										{showQty && (
										<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
											Qty
										</th>
										)}
										<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
											Price
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{sales.length === 0 ? (
										<tr>
											<td colSpan={showQty ? 4 : 3} className="px-4 py-8 text-center text-gray-500 text-sm">
												No department sales found
											</td>
										</tr>
									) : (
										sales.map((sale) => (
											<tr key={sale.id} className="hover:bg-gray-50">
												<td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
													{sale.date ?? '—'}
												</td>
												<td className="px-4 py-3 text-sm text-gray-900">
													{sale.department
														? `${sale.department.department_number} — ${sale.department.description}`
														: sale.department_number}
												</td>
												{showQty && (
												<td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
													{Number(sale.qty).toFixed(2)}
												</td>
												)}
												<td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
													${Number(sale.price).toFixed(2)}
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

export default DepartmentSalesPage;
