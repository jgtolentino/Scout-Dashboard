'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { scoutFetch } from '@/lib/scoutFetch';

export default function HomePage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      const connected = await scoutFetch.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        // Auto-redirect to dashboard if connection is successful
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    };

    testConnection();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Scout Platform
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            v5.2 Executive Analytics Dashboard
          </p>
          
          {/* Connection Status */}
          <div className="space-y-4">
            {isConnected === null && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Connecting to Scout APIs...</span>
              </div>
            )}
            
            {isConnected === true && (
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Connected to Scout Platform v5.2</span>
                </div>
                <p className="text-sm text-gray-600">Redirecting to dashboard...</p>
              </div>
            )}
            
            {isConnected === false && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-red-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Connection Failed</span>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Unable to connect to Scout APIs. Please check your configuration.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full scout-button-primary"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>
          
          {/* Manual Navigation */}
          {isConnected && (
            <div className="mt-8 space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="scout-button-primary"
              >
                Go to Dashboard
              </button>
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-12 text-xs text-gray-500">
            <p>Medallion+ Architecture • Consolidated Schema</p>
            <p>Build {process.env.NEXT_PUBLIC_APP_VERSION} • {process.env.NEXT_PUBLIC_APP_ENV}</p>
          </div>
        </div>
      </div>
    </div>
  );
}