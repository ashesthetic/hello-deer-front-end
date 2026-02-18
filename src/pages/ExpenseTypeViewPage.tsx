import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { expenseTypeApi, ExpenseType } from '../services/api';

const ExpenseTypeViewPage: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [expenseType, setExpenseType] = useState<ExpenseType | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (id) {
			fetchExpenseType();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const fetchExpenseType = async () => {
		try {
			setLoading(true);
			const response = await expenseTypeApi.getById(Number(id));
			setExpenseType(response.data.data);
		} catch (error) {
			console.error('Error fetching expense type:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = () => {
		navigate(`/accounting/expense-types/${id}/edit`);
	};

	const handleBack = () => {
		navigate('/accounting/expense-types');
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (!expenseType) {
		return (
			<div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="text-center py-12">
					<p className="text-gray-500">Expense type not found</p>
					<button
						onClick={handleBack}
						className="mt-4 text-blue-600 hover:text-blue-800"
					>
						Go back to list
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				{/* Header */}
				<div className="mb-6 flex justify-between items-start">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Expense Type Details</h1>
						<p className="mt-1 text-sm text-gray-600">View expense type information</p>
					</div>
					<div className="flex space-x-3">
						<button
							onClick={handleBack}
							className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
						>
							Back to List
						</button>
						<button
							onClick={handleEdit}
							className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
						>
							Edit
						</button>
					</div>
				</div>

				{/* Details Card */}
				<div className="bg-white shadow overflow-hidden sm:rounded-lg">
					<div className="px-4 py-5 sm:px-6 bg-gray-50">
						<h3 className="text-lg leading-6 font-medium text-gray-900">
							Information
						</h3>
					</div>
					<div className="border-t border-gray-200">
						<dl>
							<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">ID</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{expenseType.id}
								</dd>
							</div>
							<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Expense Type Name</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
									{expenseType.expense_type}
								</dd>
							</div>
							<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Parent Expense Type</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{expenseType.parent_expense_type ? (
										<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
											{expenseType.parent_expense_type.expense_type}
										</span>
									) : (
										<span className="text-gray-400">None (Root Category)</span>
									)}
								</dd>
							</div>
							<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Created At</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{formatDate(expenseType.created_at)}
								</dd>
							</div>
							<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Updated At</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{formatDate(expenseType.updated_at)}
								</dd>
							</div>
						</dl>
					</div>
				</div>

				{/* Child Expense Types */}
				{expenseType.child_expense_types && expenseType.child_expense_types.length > 0 && (
					<div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
						<div className="px-4 py-5 sm:px-6 bg-gray-50">
							<h3 className="text-lg leading-6 font-medium text-gray-900">
								Sub-Categories ({expenseType.child_expense_types.length})
							</h3>
						</div>
						<div className="border-t border-gray-200">
							<ul className="divide-y divide-gray-200">
								{expenseType.child_expense_types.map((child) => (
									<li key={child.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
										<div className="flex items-center justify-between">
											<div className="flex items-center">
												<svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
												</svg>
												<span className="text-sm font-medium text-gray-900">
													{child.expense_type}
												</span>
											</div>
											<button
												onClick={() => navigate(`/accounting/expense-types/${child.id}`)}
												className="text-sm text-blue-600 hover:text-blue-800"
											>
												View
											</button>
										</div>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ExpenseTypeViewPage;
