import React, { useState, useEffect } from 'react';
import { documentApi, Document } from '../services/api';

const StaffDocumentsPage: React.FC = () => {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [sortBy, setSortBy] = useState('created_at');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

	const fetchDocuments = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await documentApi.getAllForStaff({
				page: currentPage,
				per_page: 15,
				sort_by: sortBy,
				sort_direction: sortDirection,
			});
			
			// Handle both standard pagination and custom response formats
			if (response.data.data) {
				setDocuments(response.data.data);
				setTotalPages(response.data.last_page || 1);
				setTotalItems(response.data.total || 0);
			} else if (Array.isArray(response.data)) {
				setDocuments(response.data);
				setTotalPages(1);
				setTotalItems(response.data.length);
			} else {
				setDocuments([]);
				setTotalPages(1);
				setTotalItems(0);
			}
		} catch (error: any) {
			console.error('Error fetching documents:', error);
			setError(error.response?.data?.message || 'Failed to load documents');
			setDocuments([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDocuments();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, sortBy, sortDirection]);

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

	const handleDownload = async (document: Document) => {
		if (document.document) {
			try {
				const response = await documentApi.downloadFileForStaff(document.id);
				const blob = new Blob([response.data]);
				const url = window.URL.createObjectURL(blob);
				const link = window.document.createElement('a');
				link.href = url;
				link.download = document.name;
				window.document.body.appendChild(link);
				link.click();
				window.document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
			} catch (error) {
				console.error('Error downloading document:', error);
				alert('Failed to download document');
			}
		}
	};

	const handleView = async (document: Document) => {
		if (document.document) {
			try {
				const response = await documentApi.downloadFileForStaff(document.id);
				const blob = new Blob([response.data]);
				const url = window.URL.createObjectURL(blob);
				window.open(url, '_blank');
				// Clean up the URL after a delay
				setTimeout(() => window.URL.revokeObjectURL(url), 100);
			} catch (error) {
				console.error('Error viewing document:', error);
				alert('Failed to view document');
			}
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="py-6">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
					<p className="mt-1 text-sm text-gray-600">
						View and download documents shared with you
					</p>
				</div>

				{/* Stats */}
				<div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div className="flex items-center">
						<svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<span className="text-sm font-medium text-blue-900">
							Total Documents: {totalItems}
						</span>
					</div>
				</div>

				{/* Error Message */}
				{error && (
					<div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
						<div className="flex items-center">
							<svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span className="text-sm font-medium text-red-900">{error}</span>
						</div>
					</div>
				)}

				{/* Table */}
				<div className="bg-white shadow-md rounded-lg overflow-hidden">
					<div className="overflow-x-auto">
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
										onClick={() => handleSort('name')}
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									>
										Document Name {getSortIcon('name')}
									</th>
									<th
										onClick={() => handleSort('created_at')}
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									>
										Uploaded On {getSortIcon('created_at')}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{documents.length === 0 ? (
									<tr>
										<td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
											No documents found. You don't have any documents yet.
										</td>
									</tr>
								) : (
									documents.map((document) => (
										<tr key={document.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{document.id}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{document.name}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDate(document.created_at)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
												<button
													onClick={() => handleView(document)}
													className="inline-flex items-center text-blue-600 hover:text-blue-900"
													title="View"
												>
													<svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
													</svg>
													View
												</button>
												<button
													onClick={() => handleDownload(document)}
													className="inline-flex items-center text-green-600 hover:text-green-900"
													title="Download"
												>
													<svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
													</svg>
													Download
												</button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
							<div className="flex-1 flex justify-between sm:hidden">
								<button
									onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
									disabled={currentPage === 1}
									className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
								>
									Previous
								</button>
								<button
									onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
									disabled={currentPage === totalPages}
									className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
								>
									Next
								</button>
							</div>
							<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
								<div>
									<p className="text-sm text-gray-700">
										Showing page <span className="font-medium">{currentPage}</span> of{' '}
										<span className="font-medium">{totalPages}</span>
									</p>
								</div>
								<div>
									<nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
										<button
											onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
											disabled={currentPage === 1}
											className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
										>
											Previous
										</button>
										<button
											onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
											disabled={currentPage === totalPages}
											className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
										>
											Next
										</button>
									</nav>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default StaffDocumentsPage;
