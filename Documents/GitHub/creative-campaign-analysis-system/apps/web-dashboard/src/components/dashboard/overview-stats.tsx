import React from 'react';

export const OverviewStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700">Total Campaigns</h3>
        <p className="text-2xl font-bold text-blue-600">0</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700">Active Files</h3>
        <p className="text-2xl font-bold text-green-600">0</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700">Processing</h3>
        <p className="text-2xl font-bold text-yellow-600">0</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
        <p className="text-2xl font-bold text-purple-600">0</p>
      </div>
    </div>
  );
}; 