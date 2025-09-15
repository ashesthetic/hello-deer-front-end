import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface GoogleDriveAuthProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
  className?: string;
}

const GoogleDriveAuth: React.FC<GoogleDriveAuthProps> = ({ onAuthChange, className = '' }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/google/auth-status');
      const authenticated = response.data.authenticated;
      setIsAuthenticated(authenticated);
      onAuthChange?.(authenticated);
    } catch (error) {
      console.error('Failed to check Google Drive auth status:', error);
      setError('Failed to check authentication status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get the authorization URL
      const response = await api.get('/google/auth-url');
      const authUrl = response.data.auth_url;

      // Open the authorization URL in a new window
      const authWindow = window.open(authUrl, 'google-auth', 'width=500,height=600');

      // Poll for the window to close (user completed auth)
      const pollTimer = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(pollTimer);
          // Check auth status after the window closes
          setTimeout(() => checkAuthStatus(), 1000);
        }
      }, 1000);

    } catch (error: any) {
      console.error('Authentication failed:', error);
      setError(error.response?.data?.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setIsLoading(true);
      setError('');

      await api.post('/google/revoke');
      setIsAuthenticated(false);
      onAuthChange?.(false);
    } catch (error: any) {
      console.error('Failed to revoke access:', error);
      setError(error.response?.data?.message || 'Failed to revoke access');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
        <span className="text-gray-600">Checking Google Drive status...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-blue-500 rounded mr-3 flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Google Drive</h3>
            <p className="text-sm text-gray-600">
              {isAuthenticated ? 'Connected and ready to upload files' : 'Required for file uploads'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${
              isAuthenticated ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className={`ml-2 text-sm font-medium ${
              isAuthenticated ? 'text-green-600' : 'text-red-600'
            }`}>
              {isAuthenticated ? 'Connected' : 'Not Connected'}
            </span>
          </div>

          {isAuthenticated ? (
            <button
              onClick={handleRevoke}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleAuthenticate}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveAuth;
