import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatCurrency, formatNumber } from '../lib/utils';
import { MapPin, Store as StoreIcon } from 'lucide-react';

export default function Stores() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [storeType, setStoreType] = useState<string>('');

  const { data: stores } = useQuery({
    queryKey: ['stores', storeType],
    queryFn: async () => {
      const response = await storeAPI.getStores({ storeType: storeType || undefined });
      return response.data;
    },
  });

  const { data: storePerformance } = useQuery({
    queryKey: ['store-performance', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return null;
      const response = await storeAPI.getStorePerformance(selectedStore, 30);
      return response.data;
    },
    enabled: !!selectedStore,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
        <div className="flex gap-2">
          <select
            value={storeType}
            onChange={(e) => setStoreType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Store Types</option>
            <option value="Sari-sari">Sari-sari</option>
            <option value="Convenience">Convenience</option>
            <option value="Supermarket">Supermarket</option>
            <option value="Hypermarket">Hypermarket</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store List */}
        <Card>
          <CardHeader>
            <CardTitle>Store Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stores?.map((store: any) => (
                <div
                  key={store.id}
                  onClick={() => setSelectedStore(store.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStore === store.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <StoreIcon className="w-4 h-4 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">{store.store_name}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{store.store_code}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          {store.barangay}, {store.city_municipality}, {store.region}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      store.store_type === 'Sari-sari'
                        ? 'bg-green-100 text-green-800'
                        : store.store_type === 'Convenience'
                        ? 'bg-blue-100 text-blue-800'
                        : store.store_type === 'Supermarket'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {store.store_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Store Performance */}
        {selectedStore && storePerformance && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue (30 days)</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        storePerformance.dailyPerformance.reduce(
                          (sum: number, day: any) => sum + day.revenue,
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Transactions</p>
                    <p className="text-xl font-semibold">
                      {formatNumber(
                        storePerformance.dailyPerformance.reduce(
                          (sum: number, day: any) => sum + day.transactions,
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {storePerformance.topProducts.map((product: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{product.product_name}</p>
                        <p className="text-sm text-gray-500">{product.brand}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-gray-500">{product.units_sold} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}