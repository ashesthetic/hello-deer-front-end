import React, { useState, useEffect, useCallback } from 'react';
import { gasBuddyApi, GasBuddyStation, GasBuddyFuelPrice } from '../services/api';


function getPrice(prices: GasBuddyFuelPrice[], product: string): number | null {
  const match = prices.find(p => p.fuelProduct?.toLowerCase() === product.toLowerCase());
  if (!match) return null;
  return match.credit?.price ?? match.cash?.price ?? null;
}

function getPostedTime(prices: GasBuddyFuelPrice[], product: string): string | null {
  const match = prices.find(p => p.fuelProduct?.toLowerCase() === product.toLowerCase());
  if (!match) return null;
  const iso = match.credit?.postedTime ?? match.cash?.postedTime ?? null;
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'just now';
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

function formatCents(price: number | null): string {
  if (price === null || price === undefined) return '—';
  // GasBuddy returns prices in cents (e.g. 179.9)
  return price.toFixed(1) + '¢';
}

const FUEL_COLUMNS = [
  { key: 'regular_gas',  label: 'Regular',  color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-500' },
  { key: 'midgrade_gas', label: 'Midgrade', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',  dot: 'bg-blue-500'  },
  { key: 'premium_gas',  label: 'Premium',  color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200',dot: 'bg-purple-500'},
  { key: 'diesel',       label: 'Diesel',   color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-500' },
];

const GasBuddyPricesCard: React.FC = () => {
  const [stations, setStations] = useState<GasBuddyStation[]>([]);
  const [displayName, setDisplayName] = useState('Red Deer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await gasBuddyApi.getRedDeerPrices();
      const data = res.data;
      if (!data.success) throw new Error(data.message ?? 'Unknown error');
      setStations(data.stations ?? []);
      setDisplayName(data.display_name ?? 'Red Deer');
      setLastFetched(data.last_fetched_at ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load GasBuddy prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  // Compute best (lowest) price per fuel type across all stations
  const lowestByFuel = FUEL_COLUMNS.reduce<Record<string, { price: number; station: string; address: string | null } | null>>(
    (acc, col) => {
      let best: { price: number; station: string; address: string | null } | null = null;
      stations.forEach(s => {
        const p = getPrice(s.prices, col.key);
        if (p !== null && (best === null || p < best.price)) {
          best = { price: p, station: s.name, address: s.address?.line1?.trim() || null };
        }
      });
      acc[col.key] = best;
      return acc;
    },
    {}
  );

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 col-span-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">GasBuddy Prices</h3>
            <p className="text-xs text-gray-500">Live fuel prices · {displayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && !loading && (
            <span className="text-xs text-gray-400">
              Updated {new Date(lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchPrices}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-green-700 font-medium hover:text-green-800 disabled:opacity-50 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <a
            href="https://www.gasbuddy.com/home?search=red+deer&fuel=1&method=all&maxAge=0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-green-700 transition-colors"
            title="Open GasBuddy"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      <div className="p-6">
        {/* Best prices summary row */}
        {!loading && !error && stations.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {FUEL_COLUMNS.map(col => {
              const best = lowestByFuel[col.key];
              return (
                <div key={col.key} className={`${col.bg} rounded-lg p-4 border ${col.border}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${col.dot} shrink-0`}></span>
                    <span className="text-xs text-gray-500 font-medium">{col.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${col.color}`}>
                    {best ? formatCents(best.price) : '—'}
                  </div>
                  {best && (
                    <div className="mt-1">
                      <div className="text-xs text-gray-500 font-medium truncate" title={best.station}>{best.station}</div>
                      {best.address && (
                        <div className="text-xs text-gray-400 truncate" title={best.address}>{best.address}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                  <div className="h-7 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load prices</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Stations table */}
        {!loading && !error && stations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Station</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 px-3">Dist.</th>
                  {FUEL_COLUMNS.map(col => (
                    <th key={col.key} className={`text-right text-xs font-medium pb-2 px-3 ${col.color}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stations.map(station => (
                  <tr key={station.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4 max-w-[220px]">
                      <div className="font-medium text-gray-900 truncate" title={station.name}>{station.name}</div>
                      {station.address?.line1?.trim() && (
                        <div className="text-xs text-gray-400 truncate" title={station.address.line1.trim()}>{station.address.line1.trim()}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-400 text-xs whitespace-nowrap">
                      {station.distance != null ? station.distance : '—'}
                    </td>
                    {FUEL_COLUMNS.map(col => {
                      const price = getPrice(station.prices, col.key);
                      const posted = getPostedTime(station.prices, col.key);
                      const isLowest = lowestByFuel[col.key]?.price === price && price !== null;
                      return (
                        <td key={col.key} className="py-2.5 px-3 text-right whitespace-nowrap">
                          {price !== null ? (
                            <div>
                              <span className={`font-semibold ${isLowest ? col.color : 'text-gray-700'}`}>
                                {formatCents(price)}
                              </span>
                              {isLowest && (
                                <span className="ml-1 text-xs">🏷️</span>
                              )}
                              {posted && (
                                <div className="text-xs text-gray-400">{posted}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && stations.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">No stations found for Red Deer.</p>
        )}
      </div>
    </div>
  );
};

export default GasBuddyPricesCard;
