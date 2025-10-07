import React from 'react';

interface DesignCoachProps {
  issues: Array<{ level: string; code: string; message: string }>;
}

export default function DesignCoach({ issues }: DesignCoachProps) {
  if (!issues.length) return null;
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <h3 className="font-semibold mb-2 text-gray-800">Design Issues</h3>
      {issues.map((issue, i) => (
        <div key={i} className={`mb-1 text-sm ${
          issue.level === 'error' ? 'text-red-600' : 'text-yellow-600'
        }`}>
          <strong>{issue.code}:</strong> {issue.message}
        </div>
      ))}
    </div>
  );
}