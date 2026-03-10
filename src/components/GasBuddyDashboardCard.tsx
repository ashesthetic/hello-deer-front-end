import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gasBuddyApi, GasBuddyStation, GasBuddyFuelPrice } from '../services/api';

const NEARBY_MILES = 3;

function getRegularPrice(prices: GasBuddyFuelPrice[]): number | null {
	const match = prices.find(p => p.fuelProduct?.toLowerCase() === 'regular_gas');
	if (!match) return null;
	return match.credit?.price ?? match.cash?.price ?? null;
}

function parseDistance(dist: string | null): number | null {
	if (!dist) return null;
	const num = parseFloat(dist);
	return isNaN(num) ? null : num;
}

function formatCents(price: number | null): string {
	if (price === null || price === undefined) return '—';
	return price.toFixed(1) + '¢';
}

const GasBuddyDashboardCard: React.FC = () => {
	const navigate = useNavigate();
	const [stations, setStations] = useState<GasBuddyStation[]>([]);
	const [ourPrice, setOurPrice] = useState<number | null>(null);
	const [lastFetched, setLastFetched] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPrices = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const res = await gasBuddyApi.getRedDeerPrices();
			const data = res.data;
			if (!data.success) throw new Error(data.message ?? 'Unknown error');
			setStations(data.stations ?? []);
			setOurPrice(data.our_price ?? null);
			setLastFetched(data.last_fetched_at ?? null);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { fetchPrices(); }, [fetchPrices]);

	// Filter: within 3 miles
	const nearbyStations = stations.filter(s => {
		const d = parseDistance(s.distance);
		return d !== null && d <= NEARBY_MILES;
	});

	const cheaperStations = ourPrice !== null
		? nearbyStations.filter(s => {
			const p = getRegularPrice(s.prices);
			return p !== null && p < ourPrice;
		}).sort((a, b) => (parseDistance(a.distance) ?? 999) - (parseDistance(b.distance) ?? 999))
		: [];

	const expensiveStations = ourPrice !== null
		? nearbyStations.filter(s => {
			const p = getRegularPrice(s.prices);
			return p !== null && p > ourPrice;
		}).sort((a, b) => (parseDistance(a.distance) ?? 999) - (parseDistance(b.distance) ?? 999))
		: [];

	const isAllGood = !loading && !error && ourPrice !== null && cheaperStations.length === 0;
	const hasCheaper = cheaperStations.length > 0;
	const hasExpensive = expensiveStations.length > 0;

	return (
		<div className="bg-white rounded-lg shadow-lg border border-gray-100 col-span-full overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
						<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
						</svg>
					</div>
					<div>
						<h3 className="text-base font-semibold text-gray-900">GasBuddy · Nearby Prices</h3>
						<p className="text-xs text-gray-500">Stations within {NEARBY_MILES} miles · Regular gas vs. our price</p>
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
					<button
						onClick={() => navigate('/settings/gasbuddy')}
						className="text-xs text-gray-400 hover:text-green-700 transition-colors font-medium"
					>
						View All →
					</button>
				</div>
			</div>

			<div className="px-6 py-5">
				{/* Loading */}
				{loading && (
					<div className="flex items-center gap-3 py-2">
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
						<span className="text-sm text-gray-500">Loading nearby prices...</span>
					</div>
				)}

				{/* Error */}
				{!loading && error && (
					<div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
						<svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
						</svg>
						{error}
					</div>
				)}

				{/* All good — no cheaper AND no (significant) expensive nearby stations */}
				{isAllGood && !hasExpensive && (
					<div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-4">
						<div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
							<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div>
							<p className="text-sm font-semibold text-green-800">You have the best price nearby!</p>
							<p className="text-xs text-green-600 mt-0.5">
								No stations within {NEARBY_MILES} miles are cheaper than your regular price of {formatCents(ourPrice)}.
							</p>
						</div>
					</div>
				)}

				{/* Cheaper stations found */}
				{!loading && !error && hasCheaper && (
					<div className={hasExpensive ? 'mb-6' : ''}>
						{/* Alert banner */}
						<div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
							<div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
								<svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
							</div>
							<div>
								<p className="text-sm font-semibold text-amber-800">
									{cheaperStations.length} nearby station{cheaperStations.length !== 1 ? 's are' : ' is'} cheaper than your price of {formatCents(ourPrice)}
								</p>
								<p className="text-xs text-amber-600 mt-0.5">Within {NEARBY_MILES} miles · Regular gas</p>
							</div>
						</div>

						{/* Cheaper stations table */}
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-gray-100">
										<th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Station</th>
										<th className="text-right text-xs font-medium text-gray-500 pb-2 px-3">Dist.</th>
										<th className="text-right text-xs font-medium text-gray-500 pb-2 px-3">Regular</th>
										<th className="text-right text-xs font-medium text-red-500 pb-2 pl-3">vs. Ours</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-50">
									{cheaperStations.map(station => {
										const price = getRegularPrice(station.prices);
										const diff = price !== null && ourPrice !== null ? price - ourPrice : null;
										return (
											<tr key={station.id} className="hover:bg-gray-50 transition-colors">
												<td className="py-2.5 pr-4 max-w-[200px]">
													<div className="font-medium text-gray-900 truncate" title={station.name}>{station.name}</div>
													{station.address?.line1?.trim() && (
														<div className="text-xs text-gray-400 truncate">{station.address.line1.trim()}</div>
													)}
												</td>
												<td className="py-2.5 px-3 text-right text-gray-400 text-xs whitespace-nowrap">
													{station.distance ?? '—'}
												</td>
												<td className="py-2.5 px-3 text-right whitespace-nowrap">
													<span className="font-semibold text-amber-700">{formatCents(price)}</span>
												</td>
												<td className="py-2.5 pl-3 text-right whitespace-nowrap">
													{diff !== null && (
														<span className="font-semibold text-red-600">{diff.toFixed(1)}¢</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* More expensive stations found */}
				{!loading && !error && hasExpensive && (
					<div>
						{/* Info banner */}
						<div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
							<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
								<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
								</svg>
							</div>
							<div>
								<p className="text-sm font-semibold text-blue-800">
									{expensiveStations.length} nearby station{expensiveStations.length !== 1 ? 's are' : ' is'} more expensive than your price of {formatCents(ourPrice)}
								</p>
								<p className="text-xs text-blue-600 mt-0.5">Within {NEARBY_MILES} miles · Regular gas</p>
							</div>
						</div>

						{/* Expensive stations table */}
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-gray-100">
										<th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Station</th>
										<th className="text-right text-xs font-medium text-gray-500 pb-2 px-3">Dist.</th>
										<th className="text-right text-xs font-medium text-gray-500 pb-2 px-3">Regular</th>
										<th className="text-right text-xs font-medium text-blue-500 pb-2 pl-3">vs. Ours</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-50">
									{expensiveStations.map(station => {
										const price = getRegularPrice(station.prices);
										const diff = price !== null && ourPrice !== null ? price - ourPrice : null;
										return (
											<tr key={station.id} className="hover:bg-gray-50 transition-colors">
												<td className="py-2.5 pr-4 max-w-[200px]">
													<div className="font-medium text-gray-900 truncate" title={station.name}>{station.name}</div>
													{station.address?.line1?.trim() && (
														<div className="text-xs text-gray-400 truncate">{station.address.line1.trim()}</div>
													)}
												</td>
												<td className="py-2.5 px-3 text-right text-gray-400 text-xs whitespace-nowrap">
													{station.distance ?? '—'}
												</td>
												<td className="py-2.5 px-3 text-right whitespace-nowrap">
													<span className="font-semibold text-blue-700">{formatCents(price)}</span>
												</td>
												<td className="py-2.5 pl-3 text-right whitespace-nowrap">
													{diff !== null && (
														<span className="font-semibold text-blue-600">+{diff.toFixed(1)}¢</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* No price data yet */}
				{!loading && !error && stations.length === 0 && (
					<p className="text-sm text-gray-400 py-2">No GasBuddy data yet. Run: <code className="bg-gray-100 px-1 rounded">php artisan gasbuddy:fetch</code></p>
				)}
			</div>
		</div>
	);
};

export default GasBuddyDashboardCard;
