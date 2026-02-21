import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { expenseBreakdownApi, ExpenseBreakdownFormData, ExpenseType, expenseTypeApi } from '../services/api';

const ExpenseBreakdownFormPage: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const isEditMode = Boolean(id);

	const [formData, setFormData] = useState<ExpenseBreakdownFormData>({
		date: new Date().toISOString().split('T')[0],
		expense_type_id: 0,
		amount: '',
		notes: '',
	});
	const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingData, setLoadingData] = useState(isEditMode);
	const [errors, setErrors] = useState<any>({});

	useEffect(() => {
		fetchExpenseTypes();
		if (isEditMode && id) {
			fetchExpenseBreakdown();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const fetchExpenseTypes = async () => {
		try {
			const response = await expenseTypeApi.getAll({ per_page: 1000 });
			setExpenseTypes(response.data.data);
		} catch (error) {
			console.error('Error fetching expense types:', error);
		}
	};

	const fetchExpenseBreakdown = async () => {
		try {
			setLoadingData(true);
			const response = await expenseBreakdownApi.getById(Number(id));
			const expenseBreakdown = response.data.data;
			
			// Format date to YYYY-MM-DD for date input
			let formattedDate = expenseBreakdown.date;
			if (formattedDate) {
				// Handle different date formats
				const dateObj = new Date(formattedDate);
				if (!isNaN(dateObj.getTime())) {
					formattedDate = dateObj.toISOString().split('T')[0];
				}
			}
			
			setFormData({
				date: formattedDate,
				expense_type_id: expenseBreakdown.expense_type_id,
				amount: expenseBreakdown.amount,
				notes: expenseBreakdown.notes || '',
			});
		} catch (error) {
			console.error('Error fetching expense breakdown:', error);
		} finally {
			setLoadingData(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: name === 'expense_type_id' ? Number(value) : value
		}));
		if (errors[name]) {
			setErrors((prev: any) => ({ ...prev, [name]: '' }));
		}
	};

	const validate = () => {
		const newErrors: any = {};
		if (!formData.date) {
			newErrors.date = 'Date is required';
		}
		if (!formData.expense_type_id || formData.expense_type_id === 0) {
			newErrors.expense_type_id = 'Expense type is required';
		}
		if (!formData.amount || Number(formData.amount) <= 0) {
			newErrors.amount = 'Amount must be greater than 0';
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		try {
			setLoading(true);
			if (isEditMode && id) {
				await expenseBreakdownApi.update(Number(id), formData);
			} else {
				await expenseBreakdownApi.create(formData);
			}
			navigate('/accounting/expense-breakdowns');
		} catch (error: any) {
			console.error('Error saving expense breakdown:', error);
			if (error.response?.data?.errors) {
				setErrors(error.response.data.errors);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		navigate('/accounting/expense-breakdowns');
	};

	if (loadingData) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900">
						{isEditMode ? 'Edit Expense Breakdown' : 'Add New Expense Breakdown'}
					</h1>
					<p className="mt-1 text-sm text-gray-600">
						{isEditMode ? 'Update the expense breakdown details' : 'Create a new expense breakdown entry'}
					</p>
				</div>

				<div className="bg-white shadow rounded-lg">
					<form onSubmit={handleSubmit} className="space-y-6 p-6">
						{/* Date */}
						<div>
							<label htmlFor="date" className="block text-sm font-medium text-gray-700">
								Date <span className="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="date"
								name="date"
								value={formData.date}
								onChange={handleChange}
								className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.date
										? 'border-red-300 focus:ring-red-500 focus:border-red-500'
										: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
									}`}
							/>
							{errors.date && (
								<p className="mt-1 text-sm text-red-600">{errors.date}</p>
							)}
						</div>

						{/* Expense Type */}
						<div>
							<label htmlFor="expense_type_id" className="block text-sm font-medium text-gray-700">
								Expense Type <span className="text-red-500">*</span>
							</label>
							<select
								id="expense_type_id"
								name="expense_type_id"
								value={formData.expense_type_id}
								onChange={handleChange}
								className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.expense_type_id
										? 'border-red-300 focus:ring-red-500 focus:border-red-500'
										: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
									}`}
							>
								<option value="">Select an expense type</option>
								{expenseTypes.map((expenseType) => (
									<option key={expenseType.id} value={expenseType.id}>
										{expenseType.parent_expense_type
											? `${expenseType.parent_expense_type.expense_type} > ${expenseType.expense_type}`
											: expenseType.expense_type
										}
									</option>
								))}
							</select>
							{errors.expense_type_id && (
								<p className="mt-1 text-sm text-red-600">{errors.expense_type_id}</p>
							)}
						</div>

						{/* Amount */}
						<div>
							<label htmlFor="amount" className="block text-sm font-medium text-gray-700">
								Amount (CAD) <span className="text-red-500">*</span>
							</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<span className="text-gray-500 sm:text-sm">C$</span>
								</div>
								<input
									type="number"
									id="amount"
									name="amount"
									value={formData.amount}
									onChange={handleChange}
									step="0.01"
									min="0"
									className={`block w-full pl-10 rounded-md shadow-sm sm:text-sm ${errors.amount
											? 'border-red-300 focus:ring-red-500 focus:border-red-500'
											: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
										}`}
									placeholder="0.00"
								/>
							</div>
							{errors.amount && (
								<p className="mt-1 text-sm text-red-600">{errors.amount}</p>
							)}
						</div>

						{/* Notes */}
						<div>
							<label htmlFor="notes" className="block text-sm font-medium text-gray-700">
								Notes
							</label>
							<textarea
								id="notes"
								name="notes"
								value={formData.notes}
								onChange={handleChange}
								rows={3}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								placeholder="Optional notes about this expense"
							/>
						</div>

						{/* Form Actions */}
						<div className="flex justify-end space-x-3 pt-4 border-t">
							<button
								type="button"
								onClick={handleCancel}
								className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={loading}
								className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
							>
								{loading ? 'Saving...' : isEditMode ? 'Update Expense' : 'Create Expense'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default ExpenseBreakdownFormPage;
