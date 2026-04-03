import React, { useState, useEffect, useCallback } from 'react';
import { regularFuelVolumeApi, RegularFuelVolumeRecord } from '../services/api';

function fmt(value: string | null, unit = 'L'): string {
	if (value === null || value === undefined) return '—';
	const num = parseFloat(value);
	return isNaN(num) ? '—' : `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
}

function fmtVal(value: string | null): string {
	if (value === null || value === undefined) return '—';
	const num = parseFloat(value);
	return isNaN(num) ? '—' : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface TankRowProps {
	label: string;
	color: string;
	bgColor: string;
	borderColor: string;
	volume: string | null;
	height: string | null;
	ullage: string | null;
	water: string | null;
	temp: string | null;
	fill: string | null;
	status: string | null;
}

const TankRow: React.FC<TankRowProps> = ({
	label, color, bgColor, borderColor,
	volume, height, ullage, water, temp, fill, status,
}) => {
	const statusOk = status?.toLowerCase() === 'ok' || status?.toLowerCase() === 'normal';
	const statusBad = status && !statusOk;

	return (
		<div className={`rounded-lg border ${borderColor} ${bgColor} p-4`}>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className={`w-3 h-3 rounded-full ${color}`}></div>
					<span className="text-sm font-semibold text-gray-800">{label}</span>
				</div>
				{status && (
					<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusOk
						? 'bg-green-100 text-green-700'
						: statusBad
							? 'bg-red-100 text-red-700'
							: 'bg-gray-100 text-gray-600'
						}`}>
						{status}
					</span>
				)}
			</div>
			<div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
				<div>
					<p className="text-xs text-gray-500 mb-0.5">Volume</p>
					<p className="text-sm font-semibold text-gray-900">{fmt(volume)}</p>
				</div>
				<div>
					<p className="text-xs text-gray-500 mb-0.5">Height</p>
					<p className="text-sm font-semibold text-gray-900">{fmtVal(height)} mm</p>
				</div>
				<div>
					<p className="text-xs text-gray-500 mb-0.5">Ullage</p>
					<p className="text-sm font-semibold text-gray-900">{fmt(ullage)}</p>
				</div>
				<div>
					<p className="text-xs text-gray-500 mb-0.5">Water</p>
					<p className="text-sm font-semibold text-gray-900">{fmtVal(water)} mm</p>
				</div>
				<div>
					<p className="text-xs text-gray-500 mb-0.5">Temp</p>
					<p className="text-sm font-semibold text-gray-900">{fmtVal(temp)} °C</p>
				</div>
				<div>
					<p className="text-xs text-gray-500 mb-0.5">Fill</p>
					<p className="text-sm font-semibold text-gray-900">{fmt(fill)}</p>
				</div>
			</div>
		</div>
	);
};

interface LiveTankVolumeCardProps {
	staffMode?: boolean;
}

const LiveTankVolumeCard: React.FC<LiveTankVolumeCardProps> = ({ staffMode = false }) => {
	const [record, setRecord] = useState<RegularFuelVolumeRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchLatest = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const res = await (staffMode ? regularFuelVolumeApi.getLatestForStaff() : regularFuelVolumeApi.getLatest());
			const items = res.data?.data ?? [];
			setRecord(items.length > 0 ? items[0] : null);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { fetchLatest(); }, [fetchLatest]);

	const formatDatetime = (dt: string) => {
		if (!dt) return dt;

		const match = dt.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
		if (!match) return dt;

		const [, year, month, day, hourStr, minute, second] = match;

		// Create a Date in UTC using the given values
		const date = new Date(Date.UTC(
			parseInt(year),
			parseInt(month) - 1,
			parseInt(day),
			parseInt(hourStr),
			parseInt(minute),
			parseInt(second)
		));

		// 🔥 Adjust timezone manually (−6 hours to get original)
		date.setUTCHours(date.getUTCHours() - 6);

		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		const m = months[date.getUTCMonth()];
		const d = date.getUTCDate();
		const y = date.getUTCFullYear();

		let h = date.getUTCHours();
		const min = date.getUTCMinutes().toString().padStart(2, '0');

		const ampm = h >= 12 ? 'PM' : 'AM';
		h = h % 12 || 12;

		return `${m} ${d}, ${y}, ${h}:${min}${ampm}`;
	};

	return (
		<div className="bg-white rounded-lg shadow-lg border border-gray-100 col-span-full overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
						<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
					</div>
					<div>
						<h3 className="text-base font-semibold text-gray-900">Live Tank Volume</h3>
						<p className="text-xs text-gray-500">
							{record ? `Last reading: ${formatDatetime(record.datetime)}` : 'Latest tank sensor reading'}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={fetchLatest}
						disabled={loading}
						className="flex items-center gap-1.5 text-xs text-blue-700 font-medium hover:text-blue-800 disabled:opacity-50 transition-colors"
					>
						<svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						Refresh
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="px-6 py-5">
				{/* Loading */}
				{loading && (
					<div className="flex items-center gap-3 py-2">
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
						<span className="text-sm text-gray-500">Loading tank data...</span>
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

				{/* No data */}
				{!loading && !error && !record && (
					<p className="text-sm text-gray-400 py-2">No tank volume data available yet.</p>
				)}

				{/* Data */}
				{!loading && !error && record && (
					<div className="space-y-3">
						<TankRow
							label="Regular"
							color="bg-blue-500"
							bgColor="bg-blue-50"
							borderColor="border-blue-200"
							volume={record.regular_volume}
							height={record.regular_height}
							ullage={record.regular_ullage}
							water={record.regular_water}
							temp={record.regular_temp}
							fill={record.regular_fill}
							status={record.regular_status}
						/>
						<TankRow
							label="Premium"
							color="bg-purple-500"
							bgColor="bg-purple-50"
							borderColor="border-purple-200"
							volume={record.premium_volume}
							height={record.premium_height}
							ullage={record.premium_ullage}
							water={record.premium_water}
							temp={record.premium_temp}
							fill={record.premium_fill}
							status={record.premium_status}
						/>
						<TankRow
							label="Diesel"
							color="bg-amber-500"
							bgColor="bg-amber-50"
							borderColor="border-amber-200"
							volume={record.diesel_volume}
							height={record.diesel_height}
							ullage={record.diesel_ullage}
							water={record.diesel_water}
							temp={record.diesel_temp}
							fill={record.diesel_fill}
							status={record.diesel_status}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default LiveTankVolumeCard;
