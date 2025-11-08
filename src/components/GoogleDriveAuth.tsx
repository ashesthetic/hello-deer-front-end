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
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'good' | 'poor'>('unknown');

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
      
      // If authenticated, test the connection quality
      if (authenticated) {
        testConnection();
      }
    } catch (error) {
      console.error('Failed to check Google Drive auth status:', error);
      setError('Failed to check authentication status');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      const response = await api.get('/google/test-connection');
      
      if (response.data.authenticated && response.data.connection_test === 'passed') {
        setConnectionStatus('good');
      } else {
        setConnectionStatus('poor');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('poor');
    }
  };

  const handleAuthenticate = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get the authorization URL
      const response = await api.get('/google/auth-url');
      const authUrl = response.data.auth_url;

      // Redirect to Google auth in the same window
      window.location.href = authUrl;

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
      setConnectionStatus('unknown');
      onAuthChange?.(false);
    } catch (error: any) {
      console.error('Failed to revoke access:', error);
      setError(error.response?.data?.message || 'Failed to revoke access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryConnection = async () => {
    setError('');
    await checkAuthStatus();
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'good': return 'text-green-600';
      case 'poor': return 'text-yellow-600';
      case 'testing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'good': return 'Good connection';
      case 'poor': return 'Poor connection';
      case 'testing': return 'Testing...';
      default: return '';
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
            {isAuthenticated && connectionStatus !== 'unknown' && (
              <p className={`text-xs ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </p>
            )}
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
            <div className="flex items-center space-x-2">
              {connectionStatus === 'poor' && (
                <button
                  onClick={handleRetryConnection}
                  disabled={isLoading}
                  className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  Retry
                </button>
              )}
              <button
                onClick={handleRevoke}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Disconnecting...
                  </div>
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAuthenticate}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Connect'
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Connection quality indicator */}
      {isAuthenticated && connectionStatus === 'poor' && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm">
            Connection quality is poor. File uploads may fail. Try clicking "Retry" to reconnect.
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveAuth;
