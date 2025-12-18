import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { sftUploadsApi, SftFile } from '../services/api/sftUploadsApi';

interface SftUpload {
  id: number;
  upload_date: string;
  file_name: string;
  file_path: string;
  uploaded_by: number;
  uploader?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

const DataUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => (state as any).auth.user);
  const [uploadDate, setUploadDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  const [recentUploads, setRecentUploads] = useState<SftUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [importing, setImporting] = useState<number | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [sftFiles, setSftFiles] = useState<{ [key: number]: SftFile[] }>({});

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  const fetchRecentUploads = async () => {
    try {
      const response = await sftUploadsApi.getAll({ page: 1, per_page: 10 });
      setRecentUploads(response.data);
    } catch (error: any) {
      console.error('Error fetching recent uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
      if (file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
        setUploadStatus({
          type: 'error',
          message: 'Only ZIP files are allowed.'
        });
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus({ type: null, message: '' });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadDate) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a date.'
      });
      return;
    }

    if (!selectedFile) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a ZIP file.'
      });
      return;
    }

    setUploading(true);
    setUploadStatus({
      type: 'info',
      message: 'Uploading file...'
    });

    try {
      const response = await sftUploadsApi.upload(uploadDate, selectedFile);
      
      setUploadStatus({
        type: 'success',
        message: response.message
      });
      
      // Reset form
      setUploadDate('');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Refresh recent uploads
      fetchRecentUploads();
      
    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to upload file. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this upload?')) {
      return;
    }

    try {
      await sftUploadsApi.delete(id);
      setUploadStatus({
        type: 'success',
        message: 'Upload deleted successfully.'
      });
      fetchRecentUploads();
    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete upload.'
      });
    }
  };

  const handleProcess = async (id: number, uploadDate: string) => {
    setProcessing(id);
    setUploadStatus({
      type: 'info',
      message: 'Extracting and listing SFT files...'
    });

    try {
      const response = await sftUploadsApi.extractAndListFiles(id);
      
      if (response.success) {
        // Store the SFT files for this upload
        setSftFiles(prev => ({
          ...prev,
          [id]: response.data.sft_files
        }));
        
        // Expand the row to show files
        setExpandedRow(id);
        
        setUploadStatus({
          type: 'success',
          message: `Found ${response.data.total_files} SFT file(s) in logs folder.`
        });
      }
    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to extract SFT files.'
      });
    } finally {
      setProcessing(null);
    }
  };

  const toggleExpandRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleImport = async (id: number) => {
    if (!window.confirm('This will import all SFT files from this ZIP into the file imports system. Continue?')) {
      return;
    }

    setImporting(id);
    setUploadStatus({
      type: 'info',
      message: 'Importing SFT files...'
    });

    try {
      const response = await sftUploadsApi.importFiles(id);
      
      if (response.success) {
        const { total_imported, total_skipped, total_errors } = response.data;
        
        let message = `Successfully imported ${total_imported} file(s).`;
        if (total_skipped > 0) {
          message += ` ${total_skipped} file(s) were skipped (already imported).`;
        }
        if (total_errors > 0) {
          message += ` ${total_errors} file(s) had errors.`;
        }
        
        setUploadStatus({
          type: total_errors > 0 ? 'error' : 'success',
          message: message
        });
      }
    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to import SFT files.'
      });
    } finally {
      setImporting(null);
    }
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Upload</h1>
        <p className="text-gray-600 mt-1">Upload SFT data ZIP files</p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New File</h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Date Field */}
          <div>
            <label htmlFor="upload_date" className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="upload_date"
              name="upload_date"
              value={uploadDate}
              onChange={(e) => setUploadDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* File Upload Field */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              ZIP File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="file"
              name="file"
              accept=".zip"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Only ZIP files are accepted. The file will be renamed to: DD-MMM-YYYY-sft.zip
            </p>
            {selectedFile && (
              <p className="mt-2 text-sm text-green-600">
                Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {/* Status Message */}
          {uploadStatus.type && (
            <div
              className={`p-4 rounded-md ${
                uploadStatus.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : uploadStatus.type === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              {uploadStatus.message}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/entry')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !uploadDate || !selectedFile}
              className={`px-4 py-2 rounded-md text-white ${
                uploading || !uploadDate || !selectedFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h2>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : recentUploads.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No uploads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUploads.map((upload) => (
                  <React.Fragment key={upload.id}>
                    <tr className={expandedRow === upload.id ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(upload.upload_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {upload.file_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {upload.uploader?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(upload.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleDelete(upload.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                          {isAdmin() && (
                            <button
                              onClick={() => handleProcess(upload.id, upload.upload_date)}
                              disabled={processing === upload.id}
                              className={`${
                                processing === upload.id
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-blue-600 hover:text-blue-900'
                              }`}
                            >
                              {processing === upload.id ? 'Processing...' : 'Process'}
                            </button>
                          )}
                          {sftFiles[upload.id] && sftFiles[upload.id].length > 0 && (
                            <button
                              onClick={() => toggleExpandRow(upload.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              {expandedRow === upload.id ? 'Hide Files' : 'Show Files'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded row showing SFT files */}
                    {expandedRow === upload.id && sftFiles[upload.id] && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="ml-8">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-semibold text-gray-900">
                                SFT Files in logs folder ({sftFiles[upload.id].length})
                              </h4>
                              {isAdmin() && (
                                <button
                                  onClick={() => handleImport(upload.id)}
                                  disabled={importing === upload.id}
                                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    importing === upload.id
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {importing === upload.id ? 'Importing...' : 'Import These Files'}
                                </button>
                              )}
                            </div>
                            <div className="bg-white rounded-md border border-gray-200">
                              <table className="min-w-full">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                      File Name
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                      Size
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                      Path
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {sftFiles[upload.id].map((file, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        {file.name}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-600">
                                        {formatFileSize(file.size)}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500">
                                        {file.path}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataUploadPage;
