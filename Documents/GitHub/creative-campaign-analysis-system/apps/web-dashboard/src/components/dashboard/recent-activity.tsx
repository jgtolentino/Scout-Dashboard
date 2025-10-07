import React from 'react';

export const RecentActivity = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-center">No recent activity</p>
      </div>
    </div>
  );
}; 