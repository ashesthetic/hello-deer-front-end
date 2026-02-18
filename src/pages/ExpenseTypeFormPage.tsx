import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { expenseTypeApi, ExpenseType, ExpenseTypeFormData } from '../services/api';

const ExpenseTypeFormPage: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const isEditMode = Boolean(id);

	const [formData, setFormData] = useState<ExpenseTypeFormData>({
		expense_type: '',
		parent_expense_type_id: null,
	});
	const [allExpenseTypes, setAllExpenseTypes] = useState<ExpenseType[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingData, setLoadingData] = useState(isEditMode);
	const [errors, setErrors] = useState<any>({});

	useEffect(() => {
		fetchAllExpenseTypes();
		if (isEditMode && id) {
			fetchExpenseType();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const fetchAllExpenseTypes = async () => {
		try {
			const response = await expenseTypeApi.getAll({ per_page: 1000 });
			setAllExpenseTypes(response.data.data);
		} catch (error) {
			console.error('Error fetching expense types:', error);
		}
	};

	const fetchExpenseType = async () => {
		try {
			setLoadingData(true);
			const response = await expenseTypeApi.getById(Number(id));
			const expenseType = response.data.data;
			setFormData({
				expense_type: expenseType.expense_type,
				parent_expense_type_id: expenseType.parent_expense_type_id,
			});
		} catch (error) {
			console.error('Error fetching expense type:', error);
		} finally {
			setLoadingData(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: name === 'parent_expense_type_id' ? (value === '' ? null : Number(value)) : value
		}));
		if (errors[name]) {
			setErrors((prev: any) => ({ ...prev, [name]: '' }));
		}
	};

	const validate = () => {
		const newErrors: any = {};
		if (!formData.expense_type.trim()) {
			newErrors.expense_type = 'Expense type name is required';
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
				await expenseTypeApi.update(Number(id), formData);
			} else {
				await expenseTypeApi.create(formData);
			}
			navigate('/accounting/expense-types');
		} catch (error: any) {
			console.error('Error saving expense type:', error);
			if (error.response?.data?.errors) {
				setErrors(error.response.data.errors);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		navigate('/accounting/expense-types');
	};

	if (loadingData) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	// Filter out current expense type from parent options to prevent circular reference
	const parentOptions = allExpenseTypes.filter(et => !isEditMode || et.id !== Number(id));

	return (
		<div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900">
						{isEditMode ? 'Edit Expense Type' : 'Add New Expense Type'}
					</h1>
					<p className="mt-1 text-sm text-gray-600">
						{isEditMode ? 'Update the expense type details' : 'Create a new expense type category'}
					</p>
				</div>

				<div className="bg-white shadow rounded-lg">
					<form onSubmit={handleSubmit} className="space-y-6 p-6">
						{/* Expense Type Name */}
						<div>
							<label htmlFor="expense_type" className="block text-sm font-medium text-gray-700">
								Expense Type Name <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="expense_type"
								name="expense_type"
								value={formData.expense_type}
								onChange={handleChange}
								className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
									errors.expense_type
										? 'border-red-300 focus:ring-red-500 focus:border-red-500'
										: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
								}`}
								placeholder="e.g., Office Supplies, Utilities, etc."
							/>
							{errors.expense_type && (
								<p className="mt-1 text-sm text-red-600">{errors.expense_type}</p>
							)}
						</div>

						{/* Parent Expense Type */}
						<div>
							<label htmlFor="parent_expense_type_id" className="block text-sm font-medium text-gray-700">
								Parent Expense Type (Optional)
							</label>
							<select
								id="parent_expense_type_id"
								name="parent_expense_type_id"
								value={formData.parent_expense_type_id || ''}
								onChange={handleChange}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							>
								<option value="">None (Root Category)</option>
								{parentOptions.map((expenseType) => (
									<option key={expenseType.id} value={expenseType.id}>
										{expenseType.expense_type}
									</option>
								))}
							</select>
							<p className="mt-1 text-xs text-gray-500">
								Select a parent category to create a sub-category
							</p>
							{errors.parent_expense_type_id && (
								<p className="mt-1 text-sm text-red-600">{errors.parent_expense_type_id}</p>
							)}
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
								{loading ? 'Saving...' : isEditMode ? 'Update Expense Type' : 'Create Expense Type'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default ExpenseTypeFormPage;
