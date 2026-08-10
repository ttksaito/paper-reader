'use client';

import { useEffect, useState } from 'react';
import { setupAutoSync, fullSync, type SyncResult } from '@/lib/sync';
import { initDB, isOnline } from '@/lib/indexedDB';

export default function SyncManager() {
  const [online, setOnline] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);

  useEffect(() => {
    // Initialize IndexedDB
    initDB().catch((error) => {
      console.error('Failed to initialize IndexedDB:', error);
    });

    // Set initial online status
    setOnline(isOnline());

    // Setup auto-sync on network changes
    const cleanup = setupAutoSync(
      () => {
        setSyncing(true);
        setShowNotification(true);
      },
      (result) => {
        setSyncing(false);
        setLastSyncResult(result);
        setShowNotification(true);

        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    );

    // Update online status on network change
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!online) {
      alert('オフライン時は同期できません');
      return;
    }

    setSyncing(true);
    setShowNotification(true);

    const result = await fullSync();
    setLastSyncResult(result);
    setSyncing(false);

    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  return (
    <>
      {/* Online/Offline Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            online ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={online ? 'オンライン' : 'オフライン'}
        />
        <button
          onClick={handleManualSync}
          disabled={!online || syncing}
          className={`px-3 py-1 text-sm rounded ${
            online && !syncing
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title="手動同期"
        >
          {syncing ? '同期中...' : '同期'}
        </button>
      </div>

      {/* Sync Notification */}
      {showNotification && lastSyncResult && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            lastSyncResult.status === 'success'
              ? 'bg-green-100 border border-green-500'
              : lastSyncResult.status === 'error'
              ? 'bg-red-100 border border-red-500'
              : 'bg-blue-100 border border-blue-500'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {lastSyncResult.status === 'success' ? (
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {lastSyncResult.message}
              </p>
              {lastSyncResult.details && (
                <p className="text-sm text-gray-600 mt-1">
                  Papers: {lastSyncResult.details.papersSynced} | Notes:{' '}
                  {lastSyncResult.details.notesSynced} | Annotations:{' '}
                  {lastSyncResult.details.annotationsSynced}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
