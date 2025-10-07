'use client';

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Loader2 } from 'lucide-react';

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoiamd0b2xlbnRpbm8iLCJhIjoiY21jMmNycWRiMDc0ajJqcHZoaDYyeTJ1NiJ9.Dns6WOql16BUQ4l7otaeww';

interface RegionalData {
  region_name: string;
  revenue: number;
  growth_rate: number;
  market_share: number;
  transaction_count: number;
}

interface ChoroplethMapProps {
  title: string;
  data: RegionalData[];
  loading?: boolean;
  valueKey: keyof RegionalData;
  colorScheme?: 'revenue' | 'growth' | 'market_share';
}

// Philippines regions coordinates (approximate centroids)
const PHILIPPINES_REGIONS = {
  'NCR': { lat: 14.5995, lng: 120.9842, name: 'National Capital Region' },
  'CAR': { lat: 16.4023, lng: 120.5960, name: 'Cordillera Administrative Region' },
  'Region I': { lat: 16.0934, lng: 120.5615, name: 'Ilocos Region' },
  'Region II': { lat: 17.6129, lng: 121.7270, name: 'Cagayan Valley' },
  'Region III': { lat: 15.4817, lng: 120.5670, name: 'Central Luzon' },
  'CALABARZON': { lat: 14.1007, lng: 121.0794, name: 'Calabarzon' },
  'MIMAROPA': { lat: 13.4066, lng: 121.0437, name: 'Mimaropa' },
  'Region V': { lat: 13.4203, lng: 123.3750, name: 'Bicol Region' },
  'Region VI': { lat: 11.5564, lng: 122.5623, name: 'Western Visayas' },
  'Region VII': { lat: 10.3157, lng: 123.8854, name: 'Central Visayas' },
  'Region VIII': { lat: 11.2421, lng: 124.9662, name: 'Eastern Visayas' },
  'Region IX': { lat: 8.4542, lng: 123.0150, name: 'Zamboanga Peninsula' },
  'Region X': { lat: 8.4833, lng: 124.6500, name: 'Northern Mindanao' },
  'Region XI': { lat: 7.0731, lng: 125.6128, name: 'Davao Region' },
  'Region XII': { lat: 6.5122, lng: 124.8453, name: 'Soccsksargen' },
  'CARAGA': { lat: 8.9477, lng: 125.5270, name: 'Caraga' },
  'BARMM': { lat: 7.2190, lng: 124.2452, name: 'Bangsamoro' }
};

const ChoroplethMap: React.FC<ChoroplethMapProps> = ({ 
  title, 
  data, 
  loading, 
  valueKey = 'revenue',
  colorScheme = 'revenue'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  // Color schemes for different metrics
  const colorSchemes = {
    revenue: ['#f7fafc', '#e2e8f0', '#cbd5e0', '#a0aec0', '#718096', '#4a5568', '#2d3748'],
    growth: ['#f0fff4', '#c6f6d5', '#9ae6b4', '#68d391', '#48bb78', '#38a169', '#2f855a'],
    market_share: ['#fef5e7', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c']
  };

  const getColor = (value: number, maxValue: number, colorScheme: string) => {
    const colors = colorSchemes[colorScheme as keyof typeof colorSchemes];
    const ratio = Math.min(value / maxValue, 1);
    const index = Math.floor(ratio * (colors.length - 1));
    return colors[index];
  };

  useEffect(() => {
    if (!mapContainer.current || loading) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [122.5, 12.0], // Center of Philippines
      zoom: 5.5,
      maxZoom: 8,
      minZoom: 4
    });

    map.current.on('load', () => {
      setMapLoading(false);
      
      if (!data || data.length === 0) return;

      // Calculate max value for color scaling
      const maxValue = Math.max(...data.map(d => Number(d[valueKey]) || 0));

      // Add markers for each region with data
      data.forEach((regionData) => {
        const regionInfo = PHILIPPINES_REGIONS[regionData.region_name as keyof typeof PHILIPPINES_REGIONS];
        
        if (!regionInfo) return;

        const value = Number(regionData[valueKey]) || 0;
        const color = getColor(value, maxValue, colorScheme);
        
        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.style.width = '40px';
        markerElement.style.height = '40px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.backgroundColor = color;
        markerElement.style.border = '3px solid white';
        markerElement.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        markerElement.style.cursor = 'pointer';
        markerElement.style.display = 'flex';
        markerElement.style.alignItems = 'center';
        markerElement.style.justifyContent = 'center';
        markerElement.style.fontSize = '10px';
        markerElement.style.fontWeight = 'bold';
        markerElement.style.color = value > maxValue * 0.5 ? 'white' : '#1a202c';
        markerElement.textContent = regionData.region_name;

        // Create popup content
        const popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1a202c;">
              ${regionInfo.name}
            </h3>
            <div style="font-size: 12px; color: #4a5568;">
              <div style="margin-bottom: 4px;">
                <strong>Revenue:</strong> ₱${regionData.revenue.toLocaleString()}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>Transactions:</strong> ${regionData.transaction_count.toLocaleString()}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>Market Share:</strong> ${regionData.market_share.toFixed(1)}%
              </div>
              <div>
                <strong>Growth Rate:</strong> ${regionData.growth_rate.toFixed(1)}%
              </div>
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(popupContent);

        // Add marker to map
        new mapboxgl.Marker(markerElement)
          .setLngLat([regionInfo.lng, regionInfo.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Add navigation controls
      map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right');
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [data, loading, valueKey, colorScheme]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-80 text-gray-500">
          No regional data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-600">
          {data.length} regions • Showing {valueKey.replace('_', ' ')}
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-80 rounded-lg overflow-hidden"
          style={{ minHeight: '320px' }}
        />
        
        {mapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="text-sm text-gray-600">Loading map...</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
        <div>Interactive map • Click markers for details</div>
        <div className="flex items-center space-x-4">
          <div>Low</div>
          <div className="flex space-x-1">
            {colorSchemes[colorScheme].map((color, i) => (
              <div 
                key={i} 
                className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div>High</div>
        </div>
      </div>
    </div>
  );
};

export default ChoroplethMap;