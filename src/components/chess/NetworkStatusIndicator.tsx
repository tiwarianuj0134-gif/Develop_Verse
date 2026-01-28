/**
 * Network Status Indicator Component
 * Displays network connectivity status and offline mode information
 * Requirements: 7.3 - Network error handling and offline support
 */

import { useState, useEffect } from 'react';
import { networkService, NetworkStatus } from './NetworkService';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
  onRetryConnection?: () => void;
}

export default function NetworkStatusIndicator({ 
  showDetails = false, 
  className = '',
  onRetryConnection 
}: NetworkStatusIndicatorProps) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(networkService.getNetworkStatus());
  const [showDetailedStatus, setShowDetailedStatus] = useState(false);

  useEffect(() => {
    const unsubscribe = networkService.subscribe((status) => {
      setNetworkStatus(status);
    });

    return unsubscribe;
  }, []);

  const getStatusIcon = () => {
    if (!networkStatus.isOnline) {
      return '📡❌'; // Offline
    } else if (!networkStatus.isBackendAvailable) {
      return '📡⚠️'; // Online but backend unavailable
    } else if (networkStatus.connectionQuality === 'poor') {
      return '📡🟡'; // Poor connection
    } else {
      return '📡✅'; // Good connection
    }
  };

  const getStatusText = () => {
    if (!networkStatus.isOnline) {
      return 'Offline';
    } else if (!networkStatus.isBackendAvailable) {
      return 'Backend Unavailable';
    } else if (networkStatus.connectionQuality === 'poor') {
      return 'Poor Connection';
    } else {
      return 'Online';
    }
  };

  const getStatusColor = () => {
    if (!networkStatus.isOnline) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (!networkStatus.isBackendAvailable) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else if (networkStatus.connectionQuality === 'poor') {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    } else {
      return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const handleRetryConnection = async () => {
    if (onRetryConnection) {
      onRetryConnection();
    } else {
      await networkService.forceNetworkCheck();
    }
  };

  const formatLastChecked = () => {
    const now = Date.now();
    const diff = now - networkStatus.lastChecked;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else {
      return new Date(networkStatus.lastChecked).toLocaleTimeString();
    }
  };

  const capabilities = networkService.getOfflineCapabilities();

  return (
    <div className={`${className}`}>
      {/* Compact Status Indicator */}
      <div 
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-sm cursor-pointer transition-colors ${getStatusColor()}`}
        onClick={() => setShowDetailedStatus(!showDetailedStatus)}
        title="Click for network details"
      >
        <span className="text-base">{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
        {networkStatus.retryCount > 0 && (
          <span className="text-xs opacity-75">
            (Retry {networkStatus.retryCount})
          </span>
        )}
      </div>

      {/* Detailed Status Panel */}
      {(showDetails || showDetailedStatus) && (
        <div className="mt-2 p-4 bg-white rounded-lg border shadow-sm">
          <div className="space-y-3">
            {/* Connection Status */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Connection Status</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Browser:</span>
                  <span className={networkStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
                    {networkStatus.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Backend:</span>
                  <span className={networkStatus.isBackendAvailable ? 'text-green-600' : 'text-red-600'}>
                    {networkStatus.isBackendAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quality:</span>
                  <span className={
                    networkStatus.connectionQuality === 'good' ? 'text-green-600' :
                    networkStatus.connectionQuality === 'poor' ? 'text-orange-600' :
                    'text-red-600'
                  }>
                    {networkStatus.connectionQuality}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Check:</span>
                  <span className="text-gray-800">{formatLastChecked()}</span>
                </div>
              </div>
            </div>

            {/* Offline Capabilities */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Offline Capabilities</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className={capabilities.canPlayLocally ? 'text-green-600' : 'text-red-600'}>
                    {capabilities.canPlayLocally ? '✅' : '❌'}
                  </span>
                  <span>Local gameplay</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={capabilities.hasLocalAI ? 'text-green-600' : 'text-red-600'}>
                    {capabilities.hasLocalAI ? '✅' : '❌'}
                  </span>
                  <span>Local AI opponent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={capabilities.canSaveGameState ? 'text-green-600' : 'text-red-600'}>
                    {capabilities.canSaveGameState ? '✅' : '❌'}
                  </span>
                  <span>Game state persistence</span>
                </div>
                {capabilities.pendingOperations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">⏳</span>
                    <span>{capabilities.pendingOperations.length} pending operations</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleRetryConnection}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Check Connection
              </button>
              {showDetailedStatus && (
                <button
                  onClick={() => setShowDetailedStatus(false)}
                  className="bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  Hide Details
                </button>
              )}
            </div>

            {/* Network Error Information */}
            {networkStatus.retryCount > 0 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="text-yellow-800">
                  Connection issues detected. Retried {networkStatus.retryCount} times.
                  {networkStatus.nextRetryAt && (
                    <span className="block text-xs mt-1">
                      Next retry: {new Date(networkStatus.nextRetryAt).toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Offline Mode Notice */}
            {!networkStatus.isOnline && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                <p className="text-red-800">
                  <strong>Offline Mode:</strong> You can continue playing locally. 
                  Your game progress will be saved and synced when connection is restored.
                </p>
              </div>
            )}

            {/* Backend Unavailable Notice */}
            {networkStatus.isOnline && !networkStatus.isBackendAvailable && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="text-yellow-800">
                  <strong>Limited Mode:</strong> Internet connection is available but the game server is unreachable. 
                  Using local AI and offline features.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Network Status Badge - minimal version for space-constrained areas
 */
export function NetworkStatusBadge({ className = '' }: { className?: string }) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(networkService.getNetworkStatus());

  useEffect(() => {
    const unsubscribe = networkService.subscribe((status) => {
      setNetworkStatus(status);
    });

    return unsubscribe;
  }, []);

  if (networkStatus.isOnline && networkStatus.isBackendAvailable) {
    return null; // Don't show anything when everything is working
  }

  const getStatusInfo = () => {
    if (!networkStatus.isOnline) {
      return { icon: '🔴', text: 'Offline', color: 'bg-red-100 text-red-800' };
    } else if (!networkStatus.isBackendAvailable) {
      return { icon: '🟡', text: 'Limited', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { icon: '🟢', text: 'Online', color: 'bg-green-100 text-green-800' };
    }
  };

  const status = getStatusInfo();

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color} ${className}`}>
      <span>{status.icon}</span>
      <span>{status.text}</span>
    </div>
  );
}