import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { documentApi, Document, employeesApi, Employee } from '../services/api';

const DocumentFormPage: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const isEditMode = Boolean(id);

	const [formData, setFormData] = useState({
		name: '',
		to: 0,
		document: null as File | null,
	});
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadingData, setLoadingData] = useState(isEditMode);
	const [errors, setErrors] = useState<any>({});

	useEffect(() => {
		fetchEmployees();
		if (isEditMode && id) {
			fetchDocument();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const fetchEmployees = async () => {
		try {
			const response = await employeesApi.getAll({ per_page: 1000 });
			setEmployees(response.data.data);
		} catch (error) {
			console.error('Error fetching employees:', error);
		}
	};

	const fetchDocument = async () => {
		try {
			setLoadingData(true);
			const response = await documentApi.getById(Number(id));
			const doc = response.data.data;
			setCurrentDocument(doc);
			setFormData({
				name: doc.name,
				to: doc.to,
				document: null,
			});
		} catch (error) {
			console.error('Error fetching document:', error);
		} finally {
			setLoadingData(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: name === 'to' ? Number(value) : value
		}));
		if (errors[name]) {
			setErrors((prev: any) => ({ ...prev, [name]: '' }));
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
			if (!allowedTypes.includes(file.type)) {
				setErrors((prev: any) => ({
					...prev,
					document: 'Only PDF, JPG, and PNG files are allowed'
				}));
				e.target.value = '';
				return;
			}

			// Validate file size (10MB max)
			if (file.size > 10 * 1024 * 1024) {
				setErrors((prev: any) => ({
					...prev,
					document: 'File size must be less than 10MB'
				}));
				e.target.value = '';
				return;
			}

			setFormData(prev => ({ ...prev, document: file }));
			if (errors.document) {
				setErrors((prev: any) => ({ ...prev, document: '' }));
			}
		}
	};

	const validate = () => {
		const newErrors: any = {};

		if (!formData.name.trim()) {
			newErrors.name = 'Document name is required';
		}

		if (!formData.to) {
			newErrors.to = 'Employee is required';
		}

		if (!isEditMode && !formData.document) {
			newErrors.document = 'Document file is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		try {
			setLoading(true);

			// Create FormData for file upload
			const data = new FormData();
			data.append('name', formData.name);
			data.append('to', formData.to.toString());

			if (formData.document) {
				data.append('document', formData.document);
			}

			// For edit mode, Laravel expects _method field for PUT
			if (isEditMode && id) {
				data.append('_method', 'PUT');
				await documentApi.update(Number(id), data);
			} else {
				await documentApi.create(data);
			}

			navigate('/entry/documents');
		} catch (error: any) {
			console.error('Error saving document:', error);
			if (error.response?.data?.errors) {
				setErrors(error.response.data.errors);
			} else {
				alert(error.response?.data?.message || 'Error saving document');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		navigate('/entry/documents');
	};

	const getFileUrl = (filePath: string) => {
		return `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/storage/${filePath}`;
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
						{isEditMode ? 'Edit Document' : 'Add New Document'}
					</h1>
					<p className="mt-1 text-sm text-gray-600">
						{isEditMode ? 'Update the document details' : 'Upload a new document for an employee'}
					</p>
				</div>

				<div className="bg-white shadow rounded-lg">
					<form onSubmit={handleSubmit} className="space-y-6 p-6">
						{/* Document Name */}
						<div>
							<label htmlFor="name" className="block text-sm font-medium text-gray-700">
								Document Name <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="name"
								name="name"
								value={formData.name}
								onChange={handleChange}
								className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.name
										? 'border-red-300 focus:ring-red-500 focus:border-red-500'
										: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
									}`}
								placeholder="e.g., Employment Contract, Tax Form, etc."
							/>
							{errors.name && (
								<p className="mt-1 text-sm text-red-600">{errors.name}</p>
							)}
						</div>

						{/* Employee Selection */}
						<div>
							<label htmlFor="to" className="block text-sm font-medium text-gray-700">
								Employee <span className="text-red-500">*</span>
							</label>
							<select
								id="to"
								name="to"
								value={formData.to}
								onChange={handleChange}
								className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.to
										? 'border-red-300 focus:ring-red-500 focus:border-red-500'
										: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
									}`}
							>
								<option value="">Select an employee</option>
								{employees.map((employee) => (
									<option key={employee.id} value={employee.id}>
										{employee.preferred_name || employee.full_legal_name} - {employee.position}
									</option>
								))}
							</select>
							{errors.to && (
								<p className="mt-1 text-sm text-red-600">{errors.to}</p>
							)}
						</div>

						{/* File Upload */}
						<div>
							<label htmlFor="document" className="block text-sm font-medium text-gray-700">
								Document File {!isEditMode && <span className="text-red-500">*</span>}
							</label>
							{isEditMode && currentDocument?.document && (
								<div className="mt-1 mb-2 p-3 bg-gray-50 rounded-md">
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-700">Current file:</span>
										<button
											type="button"
											onClick={() => window.open(getFileUrl(currentDocument.document), '_blank')}
											className="text-blue-600 hover:text-blue-800 text-sm underline"
										>
											View Current File
										</button>
									</div>
								</div>
							)}
							<input
								type="file"
								id="document"
								name="document"
								accept=".pdf,.jpg,.jpeg,.png"
								onChange={handleFileChange}
								className={`mt-1 block w-full text-sm text-gray-500
									file:mr-4 file:py-2 file:px-4
									file:rounded-md file:border-0
									file:text-sm file:font-medium
									file:bg-blue-50 file:text-blue-700
									hover:file:bg-blue-100
									${errors.document ? 'border-red-300' : ''}
								`}
							/>
							<p className="mt-1 text-xs text-gray-500">
								Allowed formats: PDF, JPG, PNG (Max size: 10MB)
							</p>
							{isEditMode && (
								<p className="mt-1 text-xs text-gray-500">
									Leave empty to keep the current file
								</p>
							)}
							{errors.document && (
								<p className="mt-1 text-sm text-red-600">{errors.document}</p>
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
								{loading ? 'Saving...' : isEditMode ? 'Update Document' : 'Create Document'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default DocumentFormPage;
