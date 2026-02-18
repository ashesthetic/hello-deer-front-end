import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { expenseBreakdownApi, ExpenseBreakdown } from '../services/api';

const ExpenseBreakdownViewPage: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (id) {
			fetchExpenseBreakdown();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const fetchExpenseBreakdown = async () => {
		try {
			setLoading(true);
			const response = await expenseBreakdownApi.getById(Number(id));
			setExpenseBreakdown(response.data.data);
		} catch (error) {
			console.error('Error fetching expense breakdown:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = () => {
		navigate(`/accounting/expense-breakdowns/${id}/edit`);
	};

	const handleBack = () => {
		navigate('/accounting/expense-breakdowns');
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatCurrency = (amount: string | number) => {
		const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
		return `C$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (!expenseBreakdown) {
		return (
			<div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="text-center py-12">
					<p className="text-gray-500">Expense breakdown not found</p>
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
						<h1 className="text-3xl font-bold text-gray-900">Expense Breakdown Details</h1>
						<p className="mt-1 text-sm text-gray-600">View expense breakdown information</p>
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
									{expenseBreakdown.id}
								</dd>
							</div>
							<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Date</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
									{formatDate(expenseBreakdown.date)}
								</dd>
							</div>
							<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Expense Type</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
										{expenseBreakdown.expense_type?.expense_type || 'N/A'}
									</span>
									{expenseBreakdown.expense_type?.parent_expense_type && (
										<div className="mt-2 text-xs text-gray-500">
											Parent: {expenseBreakdown.expense_type.parent_expense_type.expense_type}
										</div>
									)}
								</dd>
							</div>
							<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Amount</dt>
								<dd className="mt-1 text-2xl font-bold text-gray-900 sm:mt-0 sm:col-span-2">
									{formatCurrency(expenseBreakdown.amount)}
								</dd>
							</div>
					<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Notes</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
							{expenseBreakdown.notes || "-"}
						</dd>
					</div>
							<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Created At</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{formatDateTime(expenseBreakdown.created_at)}
								</dd>
							</div>
							<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Updated At</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{formatDateTime(expenseBreakdown.updated_at)}
								</dd>
							</div>
						</dl>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ExpenseBreakdownViewPage;
