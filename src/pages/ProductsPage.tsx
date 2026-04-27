import React, { useState, useEffect, useCallback } from 'react';
import { productsApi, departmentsApi, Product, Department } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

const ProductsPage: React.FC = () => {
	usePageTitle('Products');

	const [products, setProducts] = useState<Product[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState('');
	const [searchInput, setSearchInput] = useState('');
	const [departmentFilter, setDepartmentFilter] = useState('');

	useEffect(() => {
		departmentsApi
			.getAll({ per_page: 200, sort_by: 'department_number', sort_direction: 'asc' })
			.then((res) => setDepartments(res.data.data || []))
			.catch(() => {});
	}, []);

	const fetchProducts = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await productsApi.getAll({
				page: currentPage,
				per_page: 50,
				sort_by: 'item_number',
				sort_direction: 'asc',
				...(search ? { search } : {}),
				...(departmentFilter ? { department_number: departmentFilter } : {}),
			});
			setProducts(response.data.data || []);
			setTotalPages(response.data.last_page || 1);
			setTotal(response.data.total || 0);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch products');
		} finally {
			setLoading(false);
		}
	}, [currentPage, search, departmentFilter]);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		setSearch(searchInput);
	};

	const handleClearSearch = () => {
		setSearchInput('');
		setSearch('');
		setDepartmentFilter('');
		setCurrentPage(1);
	};

	const handleDepartmentChange = (value: string) => {
		setDepartmentFilter(value);
		setCurrentPage(1);
	};

	return (
		<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="space-y-6">
				<div className="flex flex-wrap justify-between items-center gap-4">
					<h1 className="text-2xl font-bold text-gray-900">Products</h1>
					<span className="text-sm text-gray-500">{total} total</span>
				</div>

				{/* Filters */}
				<form onSubmit={handleSearch} className="flex flex-wrap gap-2">
					<input
						type="text"
						placeholder="Search by name or item #..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
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
					<button
						type="submit"
						className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
					>
						Search
					</button>
					{(search || departmentFilter) && (
						<button
							type="button"
							onClick={handleClearSearch}
							className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
						>
							Clear
						</button>
					)}
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
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Item #
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Name
										</th>
										<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
											Price
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Department
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{products.length === 0 ? (
										<tr>
											<td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
												No products found
											</td>
										</tr>
									) : (
										products.map((product) => (
											<tr key={product.id} className="hover:bg-gray-50">
												<td className="px-4 py-3 text-xs font-mono text-gray-700 whitespace-nowrap">
													{product.item_number}
												</td>
												<td className="px-4 py-3 text-sm text-gray-900">
													{product.name}
												</td>
												<td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
													${Number(product.price).toFixed(2)}
												</td>
												<td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
													{product.department
														? `${product.department.department_number} — ${product.department.name}`
														: product.department_number}
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

export default ProductsPage;
