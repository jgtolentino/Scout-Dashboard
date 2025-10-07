import React, { useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, GeoJSON } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  MapPin, 
  Home,
  TrendingUp,
  Users,
  Download,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { ChartErrorBoundary } from '../ErrorBoundary';
import useDataStore from '@/store/dataStore';
import { DataVisualizationKit } from '../widgets/DataVisualizationKit';
import { ResponsiveChart } from '../widgets/ResponsiveChart';
import { StockChart } from '../widgets/StockChart';
import { InteractiveChart } from '../widgets/InteractiveChart';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeographicAnalysisProps {
  filters: {
    dateRange: string;
    region: string;
    category: string;
    brand: string;
    timeOfDay: string;
    dayType: string;
  };
}

// Philippine regions GeoJSON data (simplified for demo)
const philippineRegionsGeoJSON = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "NCR", region_code: "NCR", revenue: 1284000 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[[120.9, 14.7], [121.1, 14.7], [121.1, 14.5], [120.9, 14.5], [120.9, 14.7]]]
      }
    },
    {
      type: "Feature" as const,
      properties: { name: "Region III", region_code: "R3", revenue: 567000 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[[120.5, 15.2], [121.2, 15.2], [121.2, 14.8], [120.5, 14.8], [120.5, 15.2]]]
      }
    },
    {
      type: "Feature" as const,
      properties: { name: "Region IV-A", region_code: "R4A", revenue: 623000 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[[120.8, 14.4], [122.0, 14.4], [122.0, 13.8], [120.8, 13.8], [120.8, 14.4]]]
      }
    },
    {
      type: "Feature" as const,
      properties: { name: "Region VII", region_code: "R7", revenue: 445000 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[[123.5, 10.5], [124.5, 10.5], [124.5, 9.5], [123.5, 9.5], [123.5, 10.5]]]
      }
    },
    {
      type: "Feature" as const,
      properties: { name: "Region XI", region_code: "R11", revenue: 298000 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[[125.0, 7.5], [126.0, 7.5], [126.0, 6.5], [125.0, 6.5], [125.0, 7.5]]]
      }
    }
  ]
};

export default function GeographicAnalysis({ filters }: GeographicAnalysisProps) {
  const { datasets } = useDataStore();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [drilldownLevel, setDrilldownLevel] = useState<'region' | 'city' | 'barangay'>('region');
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  // Philippines center coordinates
  const philippinesCenter: LatLngTuple = [12.8797, 121.7740];

  // Regional performance data
  const regionalData = useMemo(() => {
    return [
      { 
        region: 'NCR', 
        transactions: 8450, 
        revenue: 1284000, 
        stores: 89,
        growth: 15.2,
        cities: ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig']
      },
      { 
        region: 'Region III', 
        transactions: 3890, 
        revenue: 567000, 
        stores: 45,
        growth: 8.7,
        cities: ['Angeles', 'Olongapo', 'Malolos', 'Cabanatuan', 'San Fernando']
      },
      { 
        region: 'Region IV-A', 
        transactions: 4200, 
        revenue: 623000, 
        stores: 52,
        growth: 12.1,
        cities: ['Antipolo', 'Calamba', 'Lipa', 'Lucena', 'Batangas City']
      },
      { 
        region: 'Region VII', 
        transactions: 2890, 
        revenue: 445000, 
        stores: 38,
        growth: 6.4,
        cities: ['Cebu City', 'Lapu-Lapu', 'Mandaue', 'Talisay', 'Toledo']
      },
      { 
        region: 'Region XI', 
        transactions: 1980, 
        revenue: 298000, 
        stores: 25,
        growth: 18.9,
        cities: ['Davao City', 'Tagum', 'Panabo', 'Samal', 'Digos']
      }
    ];
  }, [filters]);

  // Store locations data
  const storeLocations = useMemo(() => {
    return [
      { id: 1, name: 'SM Mall of Asia', lat: 14.5358, lng: 120.9823, revenue: 125000, region: 'NCR' },
      { id: 2, name: 'Ayala Center Cebu', lat: 10.3157, lng: 123.8854, revenue: 98000, region: 'Region VII' },
      { id: 3, name: 'SM City North EDSA', lat: 14.6574, lng: 121.0297, revenue: 112000, region: 'NCR' },
      { id: 4, name: 'Robinsons Galleria', lat: 14.6193, lng: 121.0568, revenue: 89000, region: 'NCR' },
      { id: 5, name: 'SM City Davao', lat: 7.0731, lng: 125.6128, revenue: 76000, region: 'Region XI' },
      { id: 6, name: 'Ayala Center Makati', lat: 14.5547, lng: 121.0244, revenue: 134000, region: 'NCR' },
      { id: 7, name: 'SM City Clark', lat: 15.1693, lng: 120.5934, revenue: 87000, region: 'Region III' },
      { id: 8, name: 'Robinsons Place Manila', lat: 14.5999, lng: 120.9822, revenue: 95000, region: 'NCR' },
    ];
  }, [filters]);

  // Top performing cities
  const cityPerformance = useMemo(() => {
    return [
      { city: 'Manila', transactions: 2850, revenue: 428000, growth: 12.3 },
      { city: 'Quezon City', transactions: 2140, revenue: 322000, growth: 18.7 },
      { city: 'Cebu City', transactions: 1890, revenue: 287000, growth: 8.2 },
      { city: 'Makati', transactions: 1650, revenue: 248000, growth: 15.1 },
      { city: 'Davao City', transactions: 1420, revenue: 213000, growth: 22.4 },
    ];
  }, [filters]);

  // Barangay performance (drill-down data)
  const barangayData = useMemo(() => {
    if (!selectedRegion) return [];
    
    return [
      { barangay: 'Poblacion', transactions: 680, revenue: 98000 },
      { barangay: 'San Antonio', transactions: 520, revenue: 76000 },
      { barangay: 'Bagong Silang', transactions: 445, revenue: 64000 },
      { barangay: 'Maligaya', transactions: 398, revenue: 58000 },
      { barangay: 'Santo Niño', transactions: 367, revenue: 52000 },
    ];
  }, [selectedRegion]);

  const handleRegionClick = useCallback((feature: any) => {
    const regionName = feature.properties.name;
    setSelectedRegion(regionName);
    setDrilldownLevel('city');
  }, []);

  const handleDrillUp = useCallback(() => {
    if (drilldownLevel === 'barangay') {
      setDrilldownLevel('city');
    } else if (drilldownLevel === 'city') {
      setDrilldownLevel('region');
      setSelectedRegion(null);
    }
  }, [drilldownLevel]);

  const handleExport = (chartType: string, format: 'png' | 'csv') => {
    console.log(`Exporting ${chartType} as ${format}`);
  };

  // Color scale function for regions based on revenue
  const getRegionColor = (revenue: number) => {
    const maxRevenue = Math.max(...regionalData.map(d => d.revenue));
    const intensity = revenue / maxRevenue;
    const opacity = 0.3 + (intensity * 0.7);
    return `rgba(31, 168, 201, ${opacity})`;
  };

  // Style function for GeoJSON regions
  const regionStyle = (feature: any) => {
    const revenue = feature.properties.revenue || 0;
    return {
      fillColor: getRegionColor(revenue),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  // Event handlers for GeoJSON
  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9
        });
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(regionStyle(feature));
      },
      click: (e: any) => {
        handleRegionClick(feature);
        if (mapRef) {
          mapRef.fitBounds(e.target.getBounds());
        }
      }
    });

    // Bind popup
    const regionData = regionalData.find(d => d.region === feature.properties.name);
    if (regionData) {
      layer.bindPopup(`
        <div style="font-family: sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937;">${regionData.region}</h3>
          <p style="margin: 4px 0;"><strong>Revenue:</strong> ₱${(regionData.revenue / 1000).toFixed(0)}K</p>
          <p style="margin: 4px 0;"><strong>Transactions:</strong> ${regionData.transactions.toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Stores:</strong> ${regionData.stores}</p>
          <p style="margin: 4px 0;"><strong>Growth:</strong> +${regionData.growth}%</p>
        </div>
      `);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Geographic Intelligence</h2>
        <p className="text-gray-600 mt-1">
          Regional performance analysis and store location intelligence powered by OpenStreetMap
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => handleDrillUp()}
          className="flex items-center gap-1 text-dashboard-600 hover:text-dashboard-700"
          disabled={drilldownLevel === 'region'}
        >
          <Home size={16} />
          Philippines
        </button>
        {selectedRegion && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700">{selectedRegion}</span>
          </>
        )}
        {drilldownLevel === 'barangay' && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700">Barangays</span>
          </>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Regions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">17</p>
              <p className="text-xs text-green-600 mt-1">+2 new this quarter</p>
            </div>
            <MapPin className="text-dashboard-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stores</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">249</p>
              <p className="text-xs text-amber-600 mt-1">Across all regions</p>
            </div>
            <MapPin className="text-amber-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Region</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">NCR</p>
              <p className="text-xs text-green-600 mt-1">₱1.28M revenue</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coverage</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">78%</p>
              <p className="text-xs text-dashboard-600 mt-1">Population reached</p>
            </div>
            <Users className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Main Map and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OpenStreetMap */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {drilldownLevel === 'region' ? 'Philippine Regions' : 
               drilldownLevel === 'city' ? `${selectedRegion} Cities` : 
               `${selectedRegion} Barangays`}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('map', 'png')}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <ChartErrorBoundary>
            <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={philippinesCenter}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                ref={setMapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Regional boundaries */}
                <GeoJSON
                  data={philippineRegionsGeoJSON}
                  style={regionStyle}
                  onEachFeature={onEachFeature}
                />

                {/* Store locations */}
                {storeLocations.map((store) => (
                  <CircleMarker
                    key={store.id}
                    center={[store.lat, store.lng]}
                    radius={8}
                    fillColor="#ef4444"
                    color="#ffffff"
                    weight={2}
                    opacity={1}
                    fillOpacity={0.8}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'sans-serif' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{store.name}</h4>
                        <p style={{ margin: '4px 0' }}><strong>Region:</strong> {store.region}</p>
                        <p style={{ margin: '4px 0' }}><strong>Revenue:</strong> ₱{(store.revenue / 1000).toFixed(0)}K</p>
                        <p style={{ margin: '4px 0' }}><strong>Location:</strong> {store.lat.toFixed(4)}, {store.lng.toFixed(4)}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
            
            {/* Map Legend */}
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">Store Locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: 'rgba(31, 168, 201, 0.4)' }}></div>
                  <span className="text-sm text-gray-600">Low Revenue</span>
                </div>
                <div className="w-4 h-4" style={{ backgroundColor: 'rgba(31, 168, 201, 1.0)' }}></div>
                <span className="text-sm text-gray-600">High Revenue</span>
              </div>
            </div>
          </ChartErrorBoundary>
        </div>

        {/* Performance Data */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {drilldownLevel === 'region' ? 'Regional Performance' : 
             drilldownLevel === 'city' ? 'City Performance' : 
             'Barangay Performance'}
          </h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {drilldownLevel === 'region' && regionalData.map((region, index) => (
              <div 
                key={region.region}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedRegion === region.region 
                    ? 'border-dashboard-500 bg-dashboard-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleRegionClick({ properties: { name: region.region } })}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{region.region}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    region.growth > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    +{region.growth}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Transactions</div>
                    <div className="font-medium">{region.transactions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Revenue</div>
                    <div className="font-medium">₱{(region.revenue / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Stores</div>
                    <div className="font-medium">{region.stores}</div>
                  </div>
                </div>
              </div>
            ))}

            {drilldownLevel === 'city' && cityPerformance.map((city, index) => (
              <div key={city.city} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{city.city}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    +{city.growth}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Transactions</div>
                    <div className="font-medium">{city.transactions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Revenue</div>
                    <div className="font-medium">₱{(city.revenue / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              </div>
            ))}

            {drilldownLevel === 'barangay' && barangayData.map((barangay, index) => (
              <div key={barangay.barangay} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{barangay.barangay}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Transactions</div>
                    <div className="font-medium">{barangay.transactions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Revenue</div>
                    <div className="font-medium">₱{(barangay.revenue / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Store Locations */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Top Performing Stores</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Store Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Region</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Revenue</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Location</th>
              </tr>
            </thead>
            <tbody>
              {storeLocations.map((store) => (
                <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{store.name}</td>
                  <td className="py-3 px-4 text-gray-600">{store.region}</td>
                  <td className="py-3 px-4 text-right font-medium">
                    ₱{(store.revenue / 1000).toFixed(0)}K
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {store.lat.toFixed(4)}, {store.lng.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Geographic Intelligence */}
      <div className="col-span-full mt-8 border-t pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-green-600" />
          Advanced Geographic Intelligence
          <span className="text-sm font-normal text-gray-500 ml-2">(Location Analytics + Market Insights)</span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geographic Analytics Suite */}
          <div className="lg:col-span-2">
            <DataVisualizationKit 
              props={{ 
                title: "Geospatial Analytics Suite", 
                chartTypes: ["map", "heatmap", "flow"],
                interactiveMode: true,
                dataSource: "geographic-intelligence",
                layers: ["regions", "density", "performance"]
              }} 
              data={null} 
            />
          </div>
          
          {/* Regional Performance Trends */}
          <StockChart 
            props={{ 
              title: "Regional Performance Trends (Market-style)", 
              symbol: "SCOUT:GEO",
              timeframe: "1Y",
              comparison: true,
              regions: true
            }} 
            data={null} 
          />
          
          {/* Location Performance Matrix */}
          <ResponsiveChart 
            props={{ 
              title: "Location Performance Matrix", 
              chartType: "bubble",
              responsive: true,
              showLegend: true,
              dimensions: ["population", "revenue", "growth"]
            }} 
            data={null} 
          />
          
          {/* Market Penetration Analysis */}
          <InteractiveChart 
            props={{ 
              title: "Market Penetration Analyzer", 
              chartType: "map",
              showControls: true,
              layers: ["penetration", "competition", "opportunity"]
            }} 
            data={null} 
          />
          
          {/* Location Intelligence Dashboard */}
          <InteractiveChart 
            props={{ 
              title: "Real-time Location Intelligence", 
              chartType: "dashboard",
              showControls: true,
              metrics: ["foot_traffic", "conversion", "expansion_score"]
            }} 
            data={null} 
          />
        </div>
      </div>
    </div>
  );
}