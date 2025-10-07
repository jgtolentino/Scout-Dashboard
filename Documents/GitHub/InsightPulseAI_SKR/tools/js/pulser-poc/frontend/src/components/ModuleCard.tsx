import React, { useState } from 'react';
import Card from './Card';

interface ModuleCardProps {
  title: string;
  accent?: 'primary' | 'success' | 'warning' | 'danger';
  quickFilters?: string[];
  onFocus?: () => void;
  onDrillThrough?: (data: any) => void;
  children: React.ReactNode;
}

export default function ModuleCard({
  title,
  accent = 'primary',
  quickFilters = [],
  onFocus,
  onDrillThrough,
  children,
}: ModuleCardProps) {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showDrillThrough, setShowDrillThrough] = useState(false);

  return (
    <Card accent={accent} className="relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {onFocus && (
          <button
            onClick={onFocus}
            className="px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
          >
            Focus
          </button>
        )}
      </div>

      {/* Quick Filters */}
      {quickFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Quick filters:</span>
          {quickFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
              className={`
                px-3 py-1 text-sm rounded-full transition-all
                ${
                  selectedFilter === filter
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div
        onContextMenu={(e) => {
          if (onDrillThrough) {
            e.preventDefault();
            setShowDrillThrough(true);
          }
        }}
      >
        {children}
      </div>

      {/* Drill-Through Panel */}
      {showDrillThrough && onDrillThrough && (
        <div className="absolute right-0 top-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg z-10 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Drill-Through Details</h3>
            <button
              onClick={() => setShowDrillThrough(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Right-click on any data point to see detailed information.
          </div>
        </div>
      )}
    </Card>
  );
}