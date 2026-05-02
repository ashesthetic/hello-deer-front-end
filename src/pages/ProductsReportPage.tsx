import React, { useState, useEffect, useCallback } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { productsReportApi } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

interface PbDepartment {
	department_number: string;
	description: string;
}

interface DeptRow {
	department_number: string;
	department: string;
	unique_products: number;
	total_qty: string;
	total_revenue: string;
	revenue_pct: number;
}

interface ProductRow {
	plu_code: string;
	item_number: string;
	english_description: string;
	department: string;
	total_qty: string;
	total_revenue: string;
}

const fmt = (n: number) =>
	new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// Known deposit/lottery department keywords for exclusion helpers
const DEPOSIT_KEYWORDS = ['deposit'];
const LOTTERY_KEYWORDS = ['lotto', 'lottery', '649', 'scratch'];

const matchesKeyword = (desc: string, keywords: string[]) =>
	keywords.some((k) => desc.toLowerCase().includes(k));

const ProductsReportPage: React.FC = () => {
	usePageTitle('Products Report');

	// Filter inputs
	const [fromDate, setFromDate] = useState(thirtyDaysAgo);
	const [toDate, setToDate] = useState(today);
	const [selectedDept, setSelectedDept] = useState('');
	const [sortBy, setSortBy] = useState<'qty' | 'revenue'>('revenue');
	const [topN, setTopN] = useState(20);
	const [excludeDeposits, setExcludeDeposits] = useState(true);
	const [excludeLottery, setExcludeLottery] = useState(false);

	// Applied filters (set on Generate)
	const [applied, setApplied] = useState<{
		from: string; to: string; dept: string;
		sortBy: 'qty' | 'revenue'; topN: number;
		excludeDeposits: boolean; excludeLottery: boolean;
	} | null>(null);

	// Data
	const [pbDepartments, setPbDepartments] = useState<PbDepartment[]>([]);
	const [deptData, setDeptData] = useState<DeptRow[]>([]);
	const [topProducts, setTopProducts] = useState<ProductRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasGenerated, setHasGenerated] = useState(false);

	// Load department list once on mount
	useEffect(() => {
		productsReportApi.getPbDepartments()
			.then((res) => setPbDepartments(res.data))
			.catch(() => {});
	}, []);

	const buildExclude = useCallback((depts: PbDepartment[], exDep: boolean, exLot: boolean) => {
		return depts
			.filter((d) => {
				if (exDep && matchesKeyword(d.description, DEPOSIT_KEYWORDS)) return true;
				if (exLot && matchesKeyword(d.description, LOTTERY_KEYWORDS)) return true;
				return false;
			})
			.map((d) => d.department_number)
			.join(',');
	}, []);

	const fetchReport = useCallback(async (params: NonNullable<typeof applied>, newSortBy?: 'qty' | 'revenue') => {
		setLoading(true);
		setError(null);
		const excludeDepts = buildExclude(pbDepartments, params.excludeDeposits, params.excludeLottery);
		const sort = newSortBy ?? params.sortBy;

		try {
			const [deptRes, prodRes] = await Promise.all([
				params.dept
					? Promise.resolve({ data: { data: [] } })
					: productsReportApi.getByDepartment({
						from: params.from, to: params.to,
						...(excludeDepts ? { exclude_departments: excludeDepts } : {}),
					}),
				productsReportApi.getTopProducts({
					from: params.from, to: params.to,
					limit: params.topN,
					sort_by: sort,
					...(params.dept ? { department_number: params.dept } : {}),
					...(excludeDepts ? { exclude_departments: excludeDepts } : {}),
				}),
			]);

			setDeptData(deptRes.data.data ?? []);
			setTopProducts(prodRes.data.data ?? []);
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to load report');
		} finally {
			setLoading(false);
		}
	}, [pbDepartments, buildExclude]);

	const handleGenerate = () => {
		const params = { from: fromDate, to: toDate, dept: selectedDept, sortBy, topN, excludeDeposits, excludeLottery };
		setApplied(params);
		setHasGenerated(true);
		fetchReport(params);
	};

	const handleSortChange = (newSort: 'qty' | 'revenue') => {
		setSortBy(newSort);
		if (applied) {
			const updated = { ...applied, sortBy: newSort };
			setApplied(updated);
			fetchReport(updated, newSort);
		}
	};

	// Summary card values derived from dept data (or top products when dept filtered)
	const totalQty = deptData.length > 0
		? deptData.reduce((s, d) => s + Number(d.total_qty), 0)
		: topProducts.reduce((s, p) => s + Number(p.total_qty), 0);

	const totalRevenue = deptData.length > 0
		? deptData.reduce((s, d) => s + Number(d.total_revenue), 0)
		: topProducts.reduce((s, p) => s + Number(p.total_revenue), 0);

	const uniqueProducts = deptData.length > 0
		? deptData.reduce((s, d) => s + d.unique_products, 0)
		: topProducts.length;

	const topDept = deptData.length > 0
		? deptData.reduce((best, d) => Number(d.total_revenue) > Number(best.total_revenue) ? d : best, deptData[0])
		: null;

	// Chart data — top 10 departments by revenue
	const chartDepts = [...deptData].slice(0, 10);
	const chartData = {
		labels: chartDepts.map((d) => d.department || 'Unknown'),
		datasets: [{
			label: 'Revenue',
			data: chartDepts.map((d) => Number(d.total_revenue)),
			backgroundColor: '#3B82F6',
			borderRadius: 4,
		}],
	};

	const makeChartOptions = (formatLabel: (v: number) => string, tickFmt: (v: number) => string): any => ({
		indexAxis: 'y' as const,
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: { callbacks: { label: (ctx: any) => ` ${formatLabel(ctx.parsed.x)}` } },
			datalabels: {
				anchor: 'end' as const,
				align: 'end' as const,
				formatter: formatLabel,
				font: { size: 11 },
				color: '#374151',
			},
		},
		scales: {
			x: {
				ticks: { callback: tickFmt, font: { size: 11 } },
				grid: { color: '#F3F4F6' },
			},
			y: { ticks: { font: { size: 12 } }, grid: { display: false } },
		},
	});

	const chartOptions = makeChartOptions(
		(v) => fmt(v),
		(v) => `$${(v / 1000).toFixed(0)}k`,
	);

	// Chart data — top 10 products
	const chartProducts = [...topProducts].slice(0, 10);
	const productChartByRevenue = applied?.sortBy === 'revenue' || !applied;
	const prodChartData = {
		labels: chartProducts.map((p) => p.english_description || p.plu_code || p.item_number),
		datasets: [{
			label: productChartByRevenue ? 'Revenue' : 'Qty Sold',
			data: chartProducts.map((p) => productChartByRevenue ? Number(p.total_revenue) : Number(p.total_qty)),
			backgroundColor: '#10B981',
			borderRadius: 4,
		}],
	};

	const prodChartOptions = productChartByRevenue
		? makeChartOptions((v) => fmt(v), (v) => `$${(v / 1000).toFixed(0)}k`)
		: makeChartOptions((v) => v.toLocaleString(), (v) => v.toLocaleString());

	const selectedDeptLabel = pbDepartments.find((d) => d.department_number === selectedDept)?.description;

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Products Report</h1>
				<p className="text-sm text-gray-500 mt-0.5">Analyse product sales by department, quantity, and revenue</p>
			</div>

			{/* Filters */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
				<div className="flex flex-wrap gap-3 items-end">
					<div className="flex items-center gap-1.5">
						<label className="text-xs text-gray-500 whitespace-nowrap">From</label>
						<input
							type="date"
							value={fromDate}
							onChange={(e) => setFromDate(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<label className="text-xs text-gray-500 whitespace-nowrap">To</label>
						<input
							type="date"
							value={toDate}
							onChange={(e) => setToDate(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<label className="text-xs text-gray-500 whitespace-nowrap">Department</label>
						<select
							value={selectedDept}
							onChange={(e) => setSelectedDept(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px]"
						>
							<option value="">All Departments</option>
							{pbDepartments.map((d) => (
								<option key={d.department_number} value={d.department_number}>
									{d.description}
								</option>
							))}
						</select>
					</div>
					<div className="flex items-center gap-1.5">
						<label className="text-xs text-gray-500 whitespace-nowrap">Sort by</label>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as 'qty' | 'revenue')}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="revenue">Revenue</option>
							<option value="qty">Quantity</option>
						</select>
					</div>
					<div className="flex items-center gap-1.5">
						<label className="text-xs text-gray-500 whitespace-nowrap">Top</label>
						<select
							value={topN}
							onChange={(e) => setTopN(Number(e.target.value))}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value={10}>10</option>
							<option value={20}>20</option>
							<option value={50}>50</option>
						</select>
					</div>
					<button
						onClick={handleGenerate}
						disabled={loading}
						className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? 'Loading…' : 'Generate'}
					</button>
				</div>

				{/* Checkboxes */}
				<div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
					<label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
						<input
							type="checkbox"
							checked={excludeDeposits}
							onChange={(e) => setExcludeDeposits(e.target.checked)}
							className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						Exclude Deposits
					</label>
					<label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
						<input
							type="checkbox"
							checked={excludeLottery}
							onChange={(e) => setExcludeLottery(e.target.checked)}
							className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						Exclude Lottery
					</label>
				</div>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
					{error}
				</div>
			)}

			{!hasGenerated && !loading && (
				<div className="text-center py-16 text-gray-400 text-sm">
					Set your filters and click <span className="font-medium text-gray-500">Generate</span> to load the report.
				</div>
			)}

			{hasGenerated && !loading && (
				<>
					{/* Summary Cards */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						<div className="bg-white rounded-lg border border-gray-200 p-4">
							<p className="text-xs text-gray-500">Items Sold</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{Number(totalQty).toLocaleString('en-CA', { maximumFractionDigits: 0 })}</p>
							<p className="text-xs text-gray-400 mt-0.5">units</p>
						</div>
						<div className="bg-white rounded-lg border border-gray-200 p-4">
							<p className="text-xs text-gray-500">Store Revenue</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{fmt(totalRevenue)}</p>
							<p className="text-xs text-gray-400 mt-0.5">
								{applied?.from} — {applied?.to}
							</p>
						</div>
						<div className="bg-white rounded-lg border border-gray-200 p-4">
							<p className="text-xs text-gray-500">Unique Products</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{uniqueProducts.toLocaleString()}</p>
							<p className="text-xs text-gray-400 mt-0.5">distinct SKUs</p>
						</div>
						<div className="bg-white rounded-lg border border-gray-200 p-4">
							<p className="text-xs text-gray-500">Top Department</p>
							<p className="text-lg font-bold text-gray-900 mt-1 truncate">
								{selectedDeptLabel ?? topDept?.department ?? '—'}
							</p>
							{topDept && !selectedDept && (
								<p className="text-xs text-gray-400 mt-0.5">{fmt(Number(topDept.total_revenue))}</p>
							)}
						</div>
					</div>

					{/* Department Breakdown — only when "All Departments" */}
					{!selectedDept && deptData.length > 0 && (
						<div className="space-y-4">
							<h2 className="text-base font-semibold text-gray-800">Revenue by Department</h2>

							{/* Chart */}
							<div className="bg-white rounded-lg border border-gray-200 p-4">
								<p className="text-xs text-gray-500 mb-3">Top 10 departments</p>
								<div style={{ height: Math.max(chartDepts.length * 36 + 20, 200) }}>
									<Bar data={chartData} options={chartOptions} />
								</div>
							</div>

							{/* Table */}
							<div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200 text-sm">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Products Sold</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{deptData.map((d) => (
											<tr key={d.department_number} className="hover:bg-gray-50">
												<td className="px-4 py-2 font-medium text-gray-900">{d.department || <span className="text-gray-400">Unknown</span>}</td>
												<td className="px-4 py-2 text-right text-gray-700">{d.unique_products}</td>
												<td className="px-4 py-2 text-right text-gray-700">{Number(d.total_qty).toLocaleString('en-CA', { maximumFractionDigits: 1 })}</td>
												<td className="px-4 py-2 text-right font-medium text-gray-900">{fmt(Number(d.total_revenue))}</td>
												<td className="px-4 py-2 text-right">
													<div className="flex items-center justify-end gap-2">
														<div className="w-16 bg-gray-100 rounded-full h-1.5">
															<div
																className="bg-blue-500 h-1.5 rounded-full"
																style={{ width: `${Math.min(d.revenue_pct, 100)}%` }}
															/>
														</div>
														<span className="text-gray-600 text-xs w-10 text-right">{d.revenue_pct}%</span>
													</div>
												</td>
											</tr>
										))}
									</tbody>
									<tfoot className="bg-gray-50 border-t-2 border-gray-200">
										<tr>
											<td className="px-4 py-2 font-semibold text-gray-700">Total</td>
											<td className="px-4 py-2 text-right font-semibold text-gray-700">
												{deptData.reduce((s, d) => s + d.unique_products, 0)}
											</td>
											<td className="px-4 py-2 text-right font-semibold text-gray-700">
												{deptData.reduce((s, d) => s + Number(d.total_qty), 0).toLocaleString('en-CA', { maximumFractionDigits: 1 })}
											</td>
											<td className="px-4 py-2 text-right font-semibold text-gray-900">
												{fmt(deptData.reduce((s, d) => s + Number(d.total_revenue), 0))}
											</td>
											<td className="px-4 py-2 text-right text-gray-500 text-xs">100%</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					)}

					{/* Top Products Section */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h2 className="text-base font-semibold text-gray-800">
								Top {applied?.topN} Products
								{selectedDeptLabel && <span className="ml-2 text-sm font-normal text-gray-500">— {selectedDeptLabel}</span>}
							</h2>
							<span className="text-xs text-gray-400">
								Sorted by {applied?.sortBy === 'revenue' ? 'Revenue' : 'Quantity'}
							</span>
						</div>

						{/* Product Chart */}
						{chartProducts.length > 0 && (
							<div className="bg-white rounded-lg border border-gray-200 p-4">
								<p className="text-xs text-gray-500 mb-3">
									Top {chartProducts.length} products by {productChartByRevenue ? 'revenue' : 'quantity'}
								</p>
								<div style={{ height: Math.max(chartProducts.length * 36 + 20, 200) }}>
									<Bar data={prodChartData} options={prodChartOptions} />
								</div>
							</div>
						)}

						{/* Top Products Table */}
						<div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 text-sm">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">#</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
										<th
											className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer select-none ${applied?.sortBy === 'qty' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
											onClick={() => handleSortChange('qty')}
										>
											Qty Sold {applied?.sortBy === 'qty' && '▼'}
										</th>
										<th
											className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer select-none ${applied?.sortBy === 'revenue' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
											onClick={() => handleSortChange('revenue')}
										>
											Revenue {applied?.sortBy === 'revenue' && '▼'}
										</th>
										<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{topProducts.length === 0 ? (
										<tr>
											<td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No products found for this period</td>
										</tr>
									) : (
										topProducts.map((p, i) => {
											const qty = Number(p.total_qty);
											const rev = Number(p.total_revenue);
											const avg = qty > 0 ? rev / qty : 0;
											return (
												<tr key={p.item_number} className="hover:bg-gray-50">
													<td className="px-4 py-2 text-xs text-gray-400">{i + 1}</td>
													<td className="px-4 py-2">
														<span className="font-medium text-gray-900">{p.english_description || p.plu_code}</span>
														<span className="ml-2 text-xs text-gray-400 font-mono">{p.item_number}</span>
													</td>
													<td className="px-4 py-2 text-gray-500 text-xs">{p.department || '—'}</td>
													<td className="px-4 py-2 text-right text-gray-700">
														{qty.toLocaleString('en-CA', { maximumFractionDigits: 1 })}
													</td>
													<td className="px-4 py-2 text-right font-medium text-gray-900">{fmt(rev)}</td>
													<td className="px-4 py-2 text-right text-gray-500">{fmt(avg)}</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
					</div>
				</>
			)}

			{loading && (
				<div className="flex justify-center items-center py-16">
					<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
				</div>
			)}
		</div>
	);
};

export default ProductsReportPage;
