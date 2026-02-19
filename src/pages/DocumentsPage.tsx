import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi, Document } from '../services/api';
import Modal from '../components/Modal';

const DocumentsPage: React.FC = () => {
	const navigate = useNavigate();
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [sortBy, setSortBy] = useState('created_at');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

	const fetchDocuments = async () => {
		try {
			setLoading(true);
			const response = await documentApi.getAll({
				page: currentPage,
				per_page: 15,
				sort_by: sortBy,
				sort_direction: sortDirection,
			});
			setDocuments(response.data.data);
			setTotalPages(response.data.last_page);
			setTotalItems(response.data.total);
		} catch (error) {
			console.error('Error fetching documents:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDocuments();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, sortBy, sortDirection]);

	const handleAddNew = () => {
		navigate('/entry/documents/new');
	};

	const handleEdit = (document: Document) => {
		navigate(`/entry/documents/${document.id}/edit`);
	};

	const handleDeleteClick = (document: Document) => {
		setDocumentToDelete(document);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!documentToDelete) return;
		try {
			setDeleting(true);
			await documentApi.delete(documentToDelete.id);
			fetchDocuments();
			setDeleteModalOpen(false);
			setDocumentToDelete(null);
		} catch (error: any) {
			console.error('Error deleting document:', error);
			alert(error.response?.data?.message || 'Error deleting document');
		} finally {
			setDeleting(false);
		}
	};

	const handleCancelDelete = () => {
		setDeleteModalOpen(false);
		setDocumentToDelete(null);
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

	const handleViewDocument = async (document: Document) => {
		if (document.document) {
			try {
				const response = await documentApi.downloadFile(document.id);
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
				<div className="mb-6 flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Documents</h1>
						<p className="mt-1 text-sm text-gray-600">
							Manage employee documents
						</p>
					</div>
					<button
						onClick={handleAddNew}
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Add Document
					</button>
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
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Employee
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										File
									</th>
									<th
										onClick={() => handleSort('created_at')}
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									>
										Created At {getSortIcon('created_at')}
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{documents.length === 0 ? (
									<tr>
										<td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
											No documents found. Click "Add Document" to create one.
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
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{document.employee?.preferred_name || document.employee?.full_legal_name}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												<button
													onClick={() => handleViewDocument(document)}
													className="text-blue-600 hover:text-blue-800 underline"
												>
													View File
												</button>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDate(document.created_at)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<button
													onClick={() => handleEdit(document)}
													className="text-blue-600 hover:text-blue-900 mr-4"
													title="Edit"
												>
													<svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
													</svg>
												</button>
												<button
													onClick={() => handleDeleteClick(document)}
													className="text-red-600 hover:text-red-900"
													title="Delete"
												>
													<svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
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

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={deleteModalOpen}
				onClose={handleCancelDelete}
				title="Delete Document"
			>
				<div className="mt-2">
					<p className="text-sm text-gray-500">
						Are you sure you want to delete the document "{documentToDelete?.name}"? This action cannot be undone.
					</p>
				</div>
				<div className="mt-4 flex justify-end space-x-3">
					<button
						type="button"
						onClick={handleCancelDelete}
						className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
						disabled={deleting}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirmDelete}
						className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
						disabled={deleting}
					>
						{deleting ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</Modal>
		</div>
	);
};

export default DocumentsPage;
