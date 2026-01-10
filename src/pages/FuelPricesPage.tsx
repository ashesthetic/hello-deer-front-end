import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fuelPriceApi } from '../services/api';
import { canCreate, isStaff } from '../utils/permissions';
import { FuelPrice } from '../types';
import { formatDateTimeForDisplay } from '../utils/dateUtils';
import { usePageTitle } from '../hooks/usePageTitle';

interface FuelPriceForm {
	regular_87: string;
	midgrade_91: string;
	premium_94: string;
	diesel: string;
}

const FuelPricesPage: React.FC = () => {
	usePageTitle('Fuel Prices');
	const currentUser = useSelector((state: RootState) => (state as any).auth.user);
	const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showAddModal, setShowAddModal] = useState(false);
	const [submitLoading, setSubmitLoading] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [formData, setFormData] = useState<FuelPriceForm>({
		regular_87: '',
		midgrade_91: '',
		premium_94: '',
		diesel: '',
	});
	const [filters, setFilters] = useState({
		sort_by: 'created_at',
		sort_direction: 'desc',
		per_page: 50
	});
	const [pagination, setPagination] = useState({
		current_page: 1,
		last_page: 1,
		total: 0,
		per_page: 50
	});

	const fetchFuelPrices = useCallback(async () => {
		// Don't fetch if user is not loaded yet
		if (!currentUser) {
			return;
		}

		try {
			setLoading(true);

			// Fetch paginated data for display
			const params = new URLSearchParams();
			Object.entries(filters).forEach(([key, value]) => {
				if (value) {
					params.append(key, value.toString());
				}
			});

			const response = isStaff(currentUser)
				? await fuelPriceApi.getAllForStaff(params.toString())
				: await fuelPriceApi.index(params.toString());

			setFuelPrices(response.data.data);
			setPagination({
				current_page: response.data.current_page,
				last_page: response.data.last_page,
				total: response.data.total,
				per_page: response.data.per_page
			});
			setError(null);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch fuel prices');
			setFuelPrices([]);
		} finally {
			setLoading(false);
		}
	}, [filters, currentUser]);

	useEffect(() => {
		fetchFuelPrices();
	}, [fetchFuelPrices]);

	const handleSort = (field: string) => {
		setFilters(prev => ({
			...prev,
			sort_by: field,
			sort_direction: prev.sort_by === field && prev.sort_direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	const formatPrice = (value: number | null | undefined) => {
		if (value === null || value === undefined || isNaN(value)) {
			return '0.000';
		}
		return Number(value).toFixed(3);
	};

	const formatDate = (dateString: string) => {
		return formatDateTimeForDisplay(dateString);
	};

	const handleInputChange = (field: keyof FuelPriceForm, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleAddFuelPrice = () => {
		setFormData({
			regular_87: '',
			midgrade_91: '',
			premium_94: '',
			diesel: '',
		});
		setSubmitError(null);
		setShowAddModal(true);
	};

	const handleSubmitForm = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError(null);

		// Validate form data
		const regular87 = parseFloat(formData.regular_87);
		const midgrade91 = parseFloat(formData.midgrade_91);
		const premium94 = parseFloat(formData.premium_94);
		const diesel = parseFloat(formData.diesel);

		if (isNaN(regular87) || regular87 < 0) {
			setSubmitError('Regular (87) price must be a valid positive number');
			return;
		}
		if (isNaN(midgrade91) || midgrade91 < 0) {
			setSubmitError('Midgrade (91) price must be a valid positive number');
			return;
		}
		if (isNaN(premium94) || premium94 < 0) {
			setSubmitError('Premium (94) price must be a valid positive number');
			return;
		}
		if (isNaN(diesel) || diesel < 0) {
			setSubmitError('Diesel price must be a valid positive number');
			return;
		}

		const submitData = {
			regular_87: regular87,
			midgrade_91: midgrade91,
			premium_94: premium94,
			diesel: diesel,
		};

		try {
			setSubmitLoading(true);

			if (isStaff(currentUser)) {
				await fuelPriceApi.createForStaff(submitData);
			} else {
				await fuelPriceApi.store(submitData);
			}

			setShowAddModal(false);
			fetchFuelPrices(); // Refresh the list
		} catch (err: any) {
			setSubmitError(err.response?.data?.message || 'Failed to create fuel price');
		} finally {
			setSubmitLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<div className="flex">
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">Error loading fuel prices</h3>
							<div className="mt-2 text-sm text-red-700">
								{error}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="sm:flex sm:items-center">
				<div className="sm:flex-auto">
					<h1 className="text-2xl font-semibold text-gray-900">Fuel Prices</h1>
					<p className="mt-2 text-sm text-gray-700">
						Manage fuel prices for all fuel types
					</p>
				</div>
				<div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
					{(canCreate(currentUser) || isStaff(currentUser)) && (
						<button
							onClick={handleAddFuelPrice}
							className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
						>
							Add Fuel Price
						</button>
					)}
				</div>
			</div>

			{/* Table */}
			<div className="mt-8 flex flex-col">
				<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
					<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
						<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
							<table className="min-w-full divide-y divide-gray-300">
								<thead className="bg-gray-50">
									<tr>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
											onClick={() => handleSort('created_at')}
										>
											Date Created
											{filters.sort_by === 'created_at' && (
												<span className="ml-1">
													{filters.sort_direction === 'asc' ? '↑' : '↓'}
												</span>
											)}
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Regular (87)
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Midgrade (91)
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Premium (94)
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Diesel
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Created By
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{fuelPrices.map((fuelPrice) => (
										<tr key={fuelPrice.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{formatDate(fuelPrice.created_at || '')}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												<span className="font-mono text-green-600">${formatPrice(fuelPrice.regular_87)}</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												<span className="font-mono text-blue-600">${formatPrice(fuelPrice.midgrade_91)}</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												<span className="font-mono text-purple-600">${formatPrice(fuelPrice.premium_94)}</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												<span className="font-mono text-orange-600">${formatPrice(fuelPrice.diesel)}</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{fuelPrice.user?.name || 'Unknown'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			{/* Pagination */}
			{pagination.last_page > 1 && (
				<div className="mt-6 flex items-center justify-between">
					<div className="flex-1 flex justify-between sm:hidden">
						<button
							onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, pagination.current_page - 1) }))}
							disabled={pagination.current_page === 1}
							className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
						>
							Previous
						</button>
						<button
							onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.last_page, pagination.current_page + 1) }))}
							disabled={pagination.current_page === pagination.last_page}
							className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
						>
							Next
						</button>
					</div>
					<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
						<div>
							<p className="text-sm text-gray-700">
								Showing <span className="font-medium">{Math.max(1, (pagination.current_page - 1) * pagination.per_page + 1)}</span> to{' '}
								<span className="font-medium">
									{Math.min(pagination.total, pagination.current_page * pagination.per_page)}
								</span> of <span className="font-medium">{pagination.total}</span> results
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Add Fuel Price Modal */}
			{showAddModal && (
				<div className="fixed inset-0 z-50 overflow-y-auto">
					<div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
						<div className="fixed inset-0 transition-opacity" aria-hidden="true">
							<div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAddModal(false)}></div>
						</div>

						<span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

						<div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
							<form onSubmit={handleSubmitForm}>
								<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
									<div className="sm:flex sm:items-start">
										<div className="w-full">
											<h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
												Add New Fuel Price
											</h3>

											{submitError && (
												<div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
													<div className="flex">
														<div className="ml-3">
															<h3 className="text-sm font-medium text-red-800">Error</h3>
															<div className="mt-2 text-sm text-red-700">{submitError}</div>
														</div>
													</div>
												</div>
											)}

											<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
												<div>
													<label htmlFor="regular_87" className="block text-sm font-medium text-gray-700">
														Regular (87) - $/L
													</label>
													<input
														type="number"
														step="0.001"
														min="0"
														max="999.999"
														id="regular_87"
														value={formData.regular_87}
														onChange={(e) => handleInputChange('regular_87', e.target.value)}
														className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
														placeholder="e.g., 1.459"
														required
													/>
												</div>

												<div>
													<label htmlFor="midgrade_91" className="block text-sm font-medium text-gray-700">
														Midgrade (91) - $/L
													</label>
													<input
														type="number"
														step="0.001"
														min="0"
														max="999.999"
														id="midgrade_91"
														value={formData.midgrade_91}
														onChange={(e) => handleInputChange('midgrade_91', e.target.value)}
														className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
														placeholder="e.g., 1.559"
														required
													/>
												</div>

												<div>
													<label htmlFor="premium_94" className="block text-sm font-medium text-gray-700">
														Premium (94) - $/L
													</label>
													<input
														type="number"
														step="0.001"
														min="0"
														max="999.999"
														id="premium_94"
														value={formData.premium_94}
														onChange={(e) => handleInputChange('premium_94', e.target.value)}
														className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
														placeholder="e.g., 1.659"
														required
													/>
												</div>

												<div>
													<label htmlFor="diesel" className="block text-sm font-medium text-gray-700">
														Diesel - $/L
													</label>
													<input
														type="number"
														step="0.001"
														min="0"
														max="999.999"
														id="diesel"
														value={formData.diesel}
														onChange={(e) => handleInputChange('diesel', e.target.value)}
														className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
														placeholder="e.g., 1.759"
														required
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
									<button
										type="submit"
										disabled={submitLoading}
										className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
									>
										{submitLoading ? (
											<>
												<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Creating...
											</>
										) : (
											'Create Fuel Price'
										)}
									</button>
									<button
										type="button"
										onClick={() => setShowAddModal(false)}
										className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default FuelPricesPage;