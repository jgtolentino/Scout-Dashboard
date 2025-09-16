// Simplified Philippines provinces GeoJSON for choropleth mapping
// This is a minimal structure - in production you'd load full GeoJSON from a file
export const philippinesGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    // Major provinces with simplified coordinates for demo
    // In production, you'd use a complete Philippines administrative boundaries GeoJSON
    {
      "type": "Feature",
      "properties": { "name": "Metro Manila", "province": "NCR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [120.9405, 14.6760], [121.0540, 14.6760],
          [121.0540, 14.7695], [120.9405, 14.7695], [120.9405, 14.6760]
        ]]
      }
    },
    {
      "type": "Feature", 
      "properties": { "name": "Cebu", "province": "Cebu" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [123.8854, 9.8349], [124.0896, 9.8349],
          [124.0896, 10.8218], [123.8854, 10.8218], [123.8854, 9.8349]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Davao", "province": "Davao del Sur" },
      "geometry": {
        "type": "Polygon", 
        "coordinates": [[
          [125.4281, 6.8955], [125.6133, 6.8955],
          [125.6133, 7.4543], [125.4281, 7.4543], [125.4281, 6.8955]
        ]]
      }
    }
    // Add more provinces as needed
  ]
};

// Fallback data for development/demo purposes
export const philippinesProvinces = [
  "Abra", "Agusan del Norte", "Agusan del Sur", "Aklan", "Albay", "Antique",
  "Apayao", "Aurora", "Basilan", "Bataan", "Batanes", "Batangas", "Benguet",
  "Biliran", "Bohol", "Bukidnon", "Bulacan", "Cagayan", "Camarines Norte",
  "Camarines Sur", "Camiguin", "Capiz", "Catanduanes", "Cavite", "Cebu",
  "Compostela Valley", "Cotabato", "Davao del Norte", "Davao del Sur",
  "Davao Oriental", "Dinagat Islands", "Eastern Samar", "Guimaras", "Ifugao",
  "Ilocos Norte", "Ilocos Sur", "Iloilo", "Isabela", "Kalinga", "Laguna",
  "Lanao del Norte", "Lanao del Sur", "La Union", "Leyte", "Maguindanao",
  "Marinduque", "Masbate", "Mindoro Occidental", "Mindoro Oriental",
  "Misamis Occidental", "Misamis Oriental", "Mountain Province", "Negros Occidental",
  "Negros Oriental", "Northern Samar", "Nueva Ecija", "Nueva Vizcaya",
  "Palawan", "Pampanga", "Pangasinan", "Quezon", "Quirino", "Rizal",
  "Romblon", "Samar", "Sarangani", "Siquijor", "Sorsogon", "South Cotabato",
  "Southern Leyte", "Sultan Kudarat", "Sulu", "Surigao del Norte",
  "Surigao del Sur", "Tarlac", "Tawi-Tawi", "Zambales", "Zamboanga del Norte",
  "Zamboanga del Sur", "Zamboanga Sibugay", "Metro Manila"
];