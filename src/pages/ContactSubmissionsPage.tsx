import React, { useState, useEffect, useCallback } from 'react';
import { ContactSubmission, ContactSubmissionStats } from '../types';
import { formatDateTimeForDisplay } from '../utils/dateUtils';
import { contactSubmissionApi } from '../services/api';

const ContactSubmissionsPage: React.FC = () => {
	const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
	const [stats, setStats] = useState<ContactSubmissionStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [lastPage, setLastPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
	const [showViewModal, setShowViewModal] = useState(false);

	const fetchSubmissions = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				per_page: '15',
				...(search && { search }),
				...(dateFrom && { date_from: dateFrom }),
				...(dateTo && { date_to: dateTo }),
			});

			const response = await contactSubmissionApi.index(params.toString());

			if (response.data.success) {
				setSubmissions(response.data.data.data || []);
				setCurrentPage(response.data.data.current_page || 1);
				setLastPage(response.data.data.last_page || 1);
				setTotal(response.data.data.total || 0);
			}
		} catch (error) {
			console.error('Error fetching contact submissions:', error);
			alert('Failed to fetch contact submissions');
		} finally {
			setLoading(false);
		}
	}, [currentPage, search, dateFrom, dateTo]);

	const fetchStats = useCallback(async () => {
		try {
			const response = await contactSubmissionApi.stats();

			if (response.data.success) {
				setStats(response.data.data);
			}
		} catch (error) {
			console.error('Error fetching stats:', error);
		}
	}, []);

	useEffect(() => {
		fetchSubmissions();
		fetchStats();
	}, [fetchSubmissions, fetchStats]);

	const handleView = (submission: ContactSubmission) => {
		setSelectedSubmission(submission);
		setShowViewModal(true);
	};

	const handleDelete = async (submission: ContactSubmission) => {
		if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
			return;
		}

		try {
			const response = await contactSubmissionApi.destroy(submission.id);

			if (response.data.success) {
				alert('Contact submission deleted successfully');
				fetchSubmissions();
				fetchStats();
			}
		} catch (error) {
			console.error('Error deleting submission:', error);
			alert('Failed to delete contact submission');
		}
	};

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		fetchSubmissions();
	};

	const formatDate = (dateString: string) => {
		return formatDateTimeForDisplay(dateString);
	};

	const truncateMessage = (message: string, length: number = 100) => {
		return message.length > length ? message.substring(0, length) + '...' : message;
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Submissions</h1>
				<p className="text-gray-600">Manage contact form submissions from your website</p>
			</div>

			{/* Statistics Cards */}
			{stats && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="h-6 w-6 text-gray-400">📧</div>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
										<dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="h-6 w-6 text-green-400">📧</div>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">Today</dt>
										<dd className="text-lg font-medium text-gray-900">{stats.today}</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="h-6 w-6 text-blue-400">📧</div>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
										<dd className="text-lg font-medium text-gray-900">{stats.this_week}</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="h-6 w-6 text-purple-400">📧</div>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
										<dd className="text-lg font-medium text-gray-900">{stats.this_month}</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Filters */}
			<div className="bg-white shadow rounded-lg mb-6">
				<div className="px-6 py-4">
					<form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
								Search
							</label>
							<input
								type="text"
								id="search"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by name, email, or message..."
								className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
								From Date
							</label>
							<input
								type="date"
								id="dateFrom"
								value={dateFrom}
								onChange={(e) => setDateFrom(e.target.value)}
								className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
								To Date
							</label>
							<input
								type="date"
								id="dateTo"
								value={dateTo}
								onChange={(e) => setDateTo(e.target.value)}
								className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
							/>
						</div>
						<div className="flex items-end">
							<button
								type="submit"
								className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								Filter
							</button>
						</div>
					</form>
				</div>
			</div>

			{/* Submissions Table */}
			<div className="bg-white shadow overflow-hidden sm:rounded-md">
				<div className="px-4 py-5 sm:px-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Contact Submissions ({total} total)
					</h3>
				</div>
				<ul className="divide-y divide-gray-200">
					{loading ? (
						<li className="px-4 py-4">
							<div className="flex justify-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
							</div>
						</li>
					) : submissions.length === 0 ? (
						<li className="px-4 py-4">
							<p className="text-center text-gray-500">No contact submissions found.</p>
						</li>
					) : (
						submissions.map((submission) => (
							<li key={submission.id}>
								<div className="px-4 py-4 flex items-center justify-between">
									<div className="flex items-center min-w-0 flex-1">
										<div className="min-w-0 flex-1">
											<div className="flex items-center space-x-3 mb-2">
												<div className="flex items-center space-x-2">
													<span className="text-gray-400">👤</span>
													<span className="text-sm font-medium text-gray-900">{submission.name}</span>
												</div>
												<div className="flex items-center space-x-2">
													<span className="text-gray-400">📧</span>
													<span className="text-sm text-gray-500">{submission.email}</span>
												</div>
												{submission.phone && (
													<div className="flex items-center space-x-2">
														<span className="text-gray-400">📞</span>
														<span className="text-sm text-gray-500">{submission.phone}</span>
													</div>
												)}
											</div>
											<p className="text-sm text-gray-600 mb-1">
												{truncateMessage(submission.message)}
											</p>
											<p className="text-xs text-gray-400">
												Submitted on {formatDate(submission.created_at)}
											</p>
										</div>
									</div>
									<div className="flex space-x-2">
										<button
											onClick={() => handleView(submission)}
											className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
										>
											👁️ View
										</button>
										<button
											onClick={() => handleDelete(submission)}
											className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
										>
											🗑️ Delete
										</button>
									</div>
								</div>
							</li>
						))
					)}
				</ul>
			</div>

			{/* Pagination */}
			{lastPage > 1 && (
				<div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
					<div className="flex-1 flex justify-between sm:hidden">
						<button
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<button
							onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))}
							disabled={currentPage === lastPage}
							className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
					<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
						<div>
							<p className="text-sm text-gray-700">
								Showing page <span className="font-medium">{currentPage}</span> of{' '}
								<span className="font-medium">{lastPage}</span> ({total} total submissions)
							</p>
						</div>
						<div>
							<nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
								<button
									onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
									disabled={currentPage === 1}
									className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Previous
								</button>
								<button
									onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))}
									disabled={currentPage === lastPage}
									className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Next
								</button>
							</nav>
						</div>
					</div>
				</div>
			)}

			{/* View Submission Modal */}
			{showViewModal && selectedSubmission && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
						<div className="mt-3">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-medium text-gray-900">Contact Submission Details</h3>
								<button
									onClick={() => setShowViewModal(false)}
									className="text-gray-400 hover:text-gray-600"
								>
									<span className="sr-only">Close</span>
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700">Name</label>
									<p className="mt-1 text-sm text-gray-900">{selectedSubmission.name}</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">Email</label>
									<p className="mt-1 text-sm text-gray-900">
										<a href={`mailto:${selectedSubmission.email}`} className="text-indigo-600 hover:text-indigo-500">
											{selectedSubmission.email}
										</a>
									</p>
								</div>

								{selectedSubmission.phone && (
									<div>
										<label className="block text-sm font-medium text-gray-700">Phone</label>
										<p className="mt-1 text-sm text-gray-900">
											<a href={`tel:${selectedSubmission.phone}`} className="text-indigo-600 hover:text-indigo-500">
												{selectedSubmission.phone}
											</a>
										</p>
									</div>
								)}

								<div>
									<label className="block text-sm font-medium text-gray-700">Message</label>
									<div className="mt-1 p-3 bg-gray-50 rounded-md">
										<p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedSubmission.message}</p>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">Submission Date</label>
									<p className="mt-1 text-sm text-gray-900">{formatDate(selectedSubmission.created_at)}</p>
								</div>

								{selectedSubmission.ip_address && (
									<div>
										<label className="block text-sm font-medium text-gray-700">IP Address</label>
										<p className="mt-1 text-sm text-gray-900 font-mono">{selectedSubmission.ip_address}</p>
									</div>
								)}
							</div>

							<div className="mt-6 flex space-x-3">
								<a
									href={`mailto:${selectedSubmission.email}?subject=Re: Your Contact Form Submission&body=Hello ${selectedSubmission.name},%0D%0A%0D%0AThank you for contacting us.%0D%0A%0D%0ABest regards,%0D%0AHello Deer Team`}
									className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								>
									Reply via Email
								</a>
								<button
									onClick={() => setShowViewModal(false)}
									className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ContactSubmissionsPage;