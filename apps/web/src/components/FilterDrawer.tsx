import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose }) => {
  const { filters, updateFilter, clearFilters } = useFilters();
  const [regions, setRegions] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      const { data } = await supabase
        .from('master_locations')
        .select('region_name')
        .order('region_name');
      
      if (data) {
        const uniqueRegions = [...new Set(data.map(d => d.region_name))];
        setRegions(uniqueRegions);
      }
    };
    fetchRegions();
  }, []);

  // Fetch provinces when region changes
  useEffect(() => {
    if (filters.region) {
      const fetchProvinces = async () => {
        const { data } = await supabase
          .from('master_locations')
          .select('province_name')
          .eq('region_name', filters.region)
          .order('province_name');
        
        if (data) {
          const uniqueProvinces = [...new Set(data.map(d => d.province_name).filter(Boolean))];
          setProvinces(uniqueProvinces);
        }
      };
      fetchProvinces();
    } else {
      setProvinces([]);
    }
  }, [filters.region]);

  // Fetch cities when province changes
  useEffect(() => {
    if (filters.province) {
      const fetchCities = async () => {
        const { data } = await supabase
          .from('master_locations')
          .select('city_name')
          .eq('province_name', filters.province)
          .order('city_name');
        
        if (data) {
          const uniqueCities = [...new Set(data.map(d => d.city_name).filter(Boolean))];
          setCities(uniqueCities);
        }
      };
      fetchCities();
    } else {
      setCities([]);
    }
  }, [filters.province]);

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase
        .from('master_brands')
        .select('brand_id, brand_name')
        .eq('is_active', true)
        .order('brand_name');
      
      if (data) setBrands(data);
    };
    fetchBrands();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 120px)' }}>
          {/* Region Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              value={filters.region || ''}
              onChange={(e) => updateFilter('region', e.target.value || undefined)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Province Filter - Only show if region is selected */}
          {filters.region && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province
              </label>
              <select
                value={filters.province || ''}
                onChange={(e) => updateFilter('province', e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">All Provinces</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* City Filter - Only show if province is selected */}
          {filters.province && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City/Municipality
              </label>
              <select
                value={filters.city || ''}
                onChange={(e) => updateFilter('city', e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => updateFilter('dateRange', {
                  ...filters.dateRange,
                  start: e.target.value
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => updateFilter('dateRange', {
                  ...filters.dateRange,
                  end: e.target.value
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          {/* Brand Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brands
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
              {brands.map((brand) => (
                <label key={brand.brand_id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.brands?.includes(brand.brand_id) || false}
                    onChange={(e) => {
                      const currentBrands = filters.brands || [];
                      const newBrands = e.target.checked
                        ? [...currentBrands, brand.brand_id]
                        : currentBrands.filter(b => b !== brand.brand_id);
                      updateFilter('brands', newBrands.length ? newBrands : undefined);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{brand.brand_name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-azure-blue text-white px-4 py-2 text-sm font-medium hover:bg-azure-blueDark"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};