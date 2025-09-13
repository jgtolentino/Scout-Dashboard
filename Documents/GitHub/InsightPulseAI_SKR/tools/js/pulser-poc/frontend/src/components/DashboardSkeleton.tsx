import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gray-300" />
            <div className="p-6">
              <div className="h-4 bg-gray-300 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-300 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Share Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gray-300" />
          <div className="p-6">
            <div className="h-5 bg-gray-300 rounded w-40 mb-6" />
            <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
              <div className="w-48 h-48 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>

        {/* Movers Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gray-300" />
          <div className="p-6">
            <div className="h-5 bg-gray-300 rounded w-32 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-32 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Skeleton */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gray-300" />
        <div className="p-6">
          <div className="h-5 bg-gray-300 rounded w-40 mb-6" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
                <div className="h-4 bg-gray-300 rounded w-8" />
                <div className="h-4 bg-gray-300 rounded w-48" />
                <div className="h-4 bg-gray-300 rounded w-24" />
                <div className="h-4 bg-gray-300 rounded w-32 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}