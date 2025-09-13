interface FilterBarProps {
  onFilterChange?: (filters: any) => void;
}

export default function FilterBar({ }: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Barangay Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Barangay
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="">All Barangays</option>
            <option value="poblacion">Poblacion</option>
            <option value="san-antonio">San Antonio</option>
            <option value="santo-nino">Santo Niño</option>
            <option value="bagong-lipunan">Bagong Lipunan</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="">All Categories</option>
            <option value="beverages">Beverages</option>
            <option value="snacks">Snacks</option>
            <option value="personal-care">Personal Care</option>
            <option value="household">Household Items</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search insights..."
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Apply Button */}
        <div className="flex-none">
          <label className="block text-sm font-medium text-gray-700 mb-1 opacity-0">
            Apply
          </label>
          <button className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-700 transition-colors">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}