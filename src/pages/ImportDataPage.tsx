import React, { useState, useRef } from 'react';
import { fileImportsApi, UploadResponse } from '../services/api/fileImportsApi';

const ImportDataPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: UploadResponse;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
    setUploadStatus(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      setUploadStatus(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (!selectedDate) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a date first.'
      });
      return;
    }

    if (selectedFiles.length === 0) {
      setUploadStatus({
        type: 'error',
        message: 'Please select at least one file.'
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({
      type: 'info',
      message: 'Uploading files...'
    });

    try {
      const response = await fileImportsApi.uploadFiles(selectedDate, selectedFiles);
      
      if (response.success) {
        setUploadStatus({
          type: 'success',
          message: response.message,
          details: response
        });
        
        // Clear files after successful upload
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Upload failed. Please try again.'
        });
      }
    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Upload failed. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Data</h1>
          <p className="text-gray-600">
            Upload multiple files for data import. Files will be organized by date and stored for processing.
          </p>
        </div>

        {/* Import Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">File Upload</h2>
          
          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <label htmlFor="import-date" className="block text-sm font-medium text-gray-700 mb-2">
                Import Date *
              </label>
              <input
                id="import-date"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Files will be organized in a folder named after this date
              </p>
            </div>

            {/* File Selection */}
            <div>
              <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                Select Files *
              </label>
              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                You can select multiple files from different locations. Maximum 10MB per file.
              </p>
            </div>

            {/* Selected Files Display */}
            {selectedFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Selected Files ({selectedFiles.length})
                </h3>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 p-1 text-red-600 hover:text-red-800"
                        title="Remove file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear All Files
                  </button>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div>
              <button
                onClick={handleUpload}
                disabled={!selectedDate || selectedFiles.length === 0 || isUploading}
                className={`px-6 py-3 rounded-md text-sm font-medium ${
                  !selectedDate || selectedFiles.length === 0 || isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
              </button>
            </div>

            {/* Status Message */}
            {uploadStatus && (
              <div className={`p-4 rounded-md ${
                uploadStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                uploadStatus.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                <div className="font-medium">{uploadStatus.message}</div>
                
                {/* Show upload details for successful uploads */}
                {uploadStatus.type === 'success' && uploadStatus.details && (
                  <div className="mt-3 text-sm">
                    <div className="font-medium mb-2">Upload Summary:</div>
                    <div className="space-y-1">
                      <div>✅ Successfully uploaded: {uploadStatus.details.uploaded_files.length} files</div>
                      {uploadStatus.details.errors.length > 0 && (
                        <div>❌ Errors: {uploadStatus.details.errors.length} files</div>
                      )}
                      <div>📁 Folder: {uploadStatus.details.folder_path}</div>
                    </div>
                    
                    {/* Show error details if any */}
                    {uploadStatus.details.errors.length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium text-red-700">Files with errors:</div>
                        <ul className="list-disc list-inside text-red-600">
                          {uploadStatus.details.errors.map((error, index) => (
                            <li key={index}>{error.file}: {error.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">How It Works</h2>
            <a
              href="/file-imports"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              View All Files
            </a>
          </div>
          <div className="space-y-4 text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">File Organization:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Select a date for your import</li>
                <li>Choose multiple files from any location on your computer</li>
                <li>Files will be uploaded to a folder named after the selected date</li>
                <li>Each file is stored with a unique identifier</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Processing Status:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Files are initially marked as "Not Processed" (0)</li>
                <li>After processing, files are marked as "Processed" (1)</li>
                <li>You can track the status of each uploaded file</li>
                <li>Processed files can be reviewed and managed</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Supported Features:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Multiple file selection from different locations</li>
                <li>Automatic file organization by date</li>
                <li>File size and type validation</li>
                <li>Progress tracking and error reporting</li>
                <li>Database storage for file management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportDataPage;
