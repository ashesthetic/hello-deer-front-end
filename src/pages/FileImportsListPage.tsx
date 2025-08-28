import React, { useState, useEffect } from 'react';
import { fileImportsApi, FileImport } from '../services/api/fileImportsApi';

interface GroupedFileImports {
  [date: string]: FileImport[];
}

const FileImportsListPage: React.FC = () => {
  const [fileImports, setFileImports] = useState<FileImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFileImports();
    fetchStats();
  }, []);

  const fetchFileImports = async () => {
    try {
      setLoading(true);
      const response = await fileImportsApi.getAll();
      setFileImports(response.data);
    } catch (error) {
      console.error('Error fetching file imports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fileImportsApi.getStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (processed: number) => {
    if (processed === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Processed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const groupFilesByDate = (files: FileImport[]): GroupedFileImports => {
    const grouped: GroupedFileImports = {};
    files.forEach(file => {
      const date = file.import_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(file);
    });
    return grouped;
  };

  const getDateStats = (files: FileImport[]) => {
    const totalFiles = files.length;
    const processedFiles = files.filter(f => f.processed === 1).length;
    const pendingFiles = totalFiles - processedFiles;
    const totalSize = files.reduce((sum, f) => sum + f.file_size, 0);
    
    return { totalFiles, processedFiles, pendingFiles, totalSize };
  };

  const groupedFiles = groupFilesByDate(fileImports);
  const sortedDates = Object.keys(groupedFiles).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading file imports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">File Imports</h1>
          <p className="text-gray-600">
            View and manage all uploaded files for data import, grouped by date.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.total_files}</div>
              <div className="text-sm text-gray-600">Total Files</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-green-600">{stats.processed_files}</div>
              <div className="text-sm text-gray-600">Processed</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_files}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(groupedFiles).length}</div>
              <div className="text-sm text-gray-600">Import Dates</div>
            </div>
          </div>
        )}

        {/* File Imports Table - One Row Per Date */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Import Dates</h2>
          </div>
          
          {sortedDates.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by uploading some files in the Import Data page.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Import Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Files
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedDates.map((date) => {
                    const files = groupedFiles[date];
                    const dateStats = getDateStats(files);
                    const isExpanded = expandedDates.has(date);
                    
                    return (
                      <React.Fragment key={date}>
                        {/* Date Row */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">{dateStats.totalFiles} files</div>
                            <div className="text-gray-500">
                              {dateStats.processedFiles} processed, {dateStats.pendingFiles} pending
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatFileSize(dateStats.totalSize)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {dateStats.processedFiles > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {dateStats.processedFiles} Processed
                                </span>
                              )}
                              {dateStats.pendingFiles > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {dateStats.pendingFiles} Pending
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => toggleDateExpansion(date)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {isExpanded ? 'Hide Files' : 'Show Files'}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expanded Files Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Files for {formatDate(date)}</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-white">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          File Name
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Size
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Status
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Uploaded
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Notes
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {files.map((file) => (
                                        <tr key={file.id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                              {file.original_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                              {file.mime_type}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {formatFileSize(file.file_size)}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            {getStatusBadge(file.processed)}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(file.created_at)}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                            {file.notes || '-'}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileImportsListPage;
