import { useState } from "react";
import { MoreHorizontal, TrendingUp, TrendingDown, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";
import { philippineGeoJSON, philippineCities } from "@/lib/ph-geojson";

export default function GeospatialMap() {
  const [mapView, setMapView] = useState("Density");
  const { locationData, isLoading } = useDashboardData();

  const toggleMapView = () => {
    setMapView(prev => prev === "Density" ? "Markers" : "Density");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Geospatial Map */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Consumer Distribution</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={mapView === "Density" ? "default" : "outline"}
              onClick={toggleMapView}
              className="text-xs"
            >
              {mapView}
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="map-container bg-gradient-to-br from-blue-50 to-blue-100 border border-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Enhanced Philippine GeoJSON Map */}
            <div className="relative w-full h-full flex items-center justify-center">
              <svg viewBox="119 5 9 14" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Render Philippine regions */}
                {philippineGeoJSON.features.map((feature, index) => {
                  const pathData = feature.geometry.coordinates[0]
                    .map((coord, i) => `${i === 0 ? 'M' : 'L'} ${coord[0]} ${coord[1]}`)
                    .join(' ') + ' Z';
                  
                  return (
                    <path
                      key={feature.properties.name}
                      d={pathData}
                      fill="rgba(34, 97, 211, 0.15)"
                      stroke="rgba(34, 97, 211, 0.4)"
                      strokeWidth="0.05"
                      className="cursor-pointer hover:fill-opacity-30 transition-all"
                    />
                  );
                })}
                
                {/* Location markers with accurate coordinates */}
                {locationData?.map((location) => {
                  const coords = philippineCities[location.location as keyof typeof philippineCities];
                  if (!coords) return null;
                  
                  const [lat, lng] = coords;
                  const size = Math.sqrt(location.transactions) * 0.05 + 0.1;
                  
                  return (
                    <g key={location.location}>
                      <circle
                        cx={lng}
                        cy={lat}
                        r={size}
                        fill="hsl(var(--scout-blue))"
                        opacity={0.8}
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                      />
                      <text
                        x={lng}
                        y={lat - size - 0.2}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700"
                        fontSize="0.4"
                      >
                        {location.location}
                      </text>
                      <text
                        x={lng}
                        y={lat - size - 0.5}
                        textAnchor="middle"
                        className="text-xs fill-gray-600 font-bold"
                        fontSize="0.3"
                      >
                        {location.transactions}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Map Legend */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-gray-600">Transaction Volume</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700 border-b pb-2">
              <span>Location</span>
              <span>Transaction Volume</span>
            </div>
            {locationData?.slice(0, 7).map((location) => (
              <div key={location.location} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="font-medium text-gray-900">{location.location}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{location.transactions}</span>
                  <div className="text-xs text-gray-500">transactions</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regional Performance */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Regional Performance</CardTitle>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locationData?.map((location) => (
              <div
                key={location.location}
                className="flex items-center justify-between p-3 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{location.location}</p>
                  <p className="text-sm text-muted-foreground">
                    ₱{(location.revenue / 1000000).toFixed(1)}M revenue
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{location.transactions}</p>
                  <div className="flex items-center gap-1">
                    {location.change >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <p className={`text-xs ${location.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {location.change >= 0 ? "+" : ""}{location.change.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
