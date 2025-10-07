import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Home, Search, FileX } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Scout Dashboard',
  description: 'The page you are looking for could not be found.',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Enhanced 404 Page with Security Hardening
 * - No sensitive information exposure
 * - User-friendly navigation
 * - Analytics tracking
 * - Security monitoring
 */
export default async function NotFound() {
  // Get request information for monitoring
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const referer = headersList.get('referer') || 'direct';

  // Log 404 for monitoring (without exposing sensitive paths)
  const logData = {
    event: '404_page_accessed',
    userAgent: userAgent.substring(0, 100), // Truncate to prevent log injection
    referer: referer.startsWith('http') ? new URL(referer).origin : 'direct',
    timestamp: new Date().toISOString(),
  };

  // Capture 404 event in Sentry for monitoring
  Sentry.addBreadcrumb({
    message: '404 Page Accessed',
    level: 'info',
    category: 'navigation',
    data: logData,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="bg-red-100 rounded-full p-6">
            <FileX className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            Page Not Found
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            The page you are looking for might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Need Help?
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center">
              <Search className="w-4 h-4 mr-2 text-gray-400" />
              <span>Check your URL for typos</span>
            </div>
            <div className="flex items-center">
              <Home className="w-4 h-4 mr-2 text-gray-400" />
              <span>Return to the main dashboard</span>
            </div>
            <div className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2 text-gray-400" />
              <span>Use your browser&apos;s back button</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}