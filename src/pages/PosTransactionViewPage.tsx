import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posTransactionsApi, PosTransaction } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

const PosTransactionViewPage: React.FC = () => {
	usePageTitle('POS Transaction');
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [transaction, setTransaction] = useState<PosTransaction | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		posTransactionsApi.getById(Number(id))
			.then((res) => setTransaction(res.data))
			.catch((err) => setError(err.response?.data?.message || 'Transaction not found'))
			.finally(() => setLoading(false));
	}, [id]);

	const formatDateTime = (str: string | null) => {
		if (!str) return '—';
		return new Date(str).toLocaleString('en-CA', {
			timeZone: 'America/Edmonton',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	};

	const formatDate = (dateStr: string) => {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('en-CA', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	};

	const fuelGradeLabel = (gradeId: string, description?: string) => {
		if (description) return description.replace(/\(.*?\)$/, '').trim();
		const map: Record<string, string> = { '88': 'Regular', '89': 'Plus', '71': 'Sup Plus' };
		return map[gradeId] ?? `Grade ${gradeId}`;
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-20">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (error || !transaction) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
					{error || 'Transaction not found'}
				</div>
				<button onClick={() => navigate(-1)} className="mt-4 text-sm text-blue-600 hover:underline">
					← Back
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-1 flex items-center gap-1">
						← Back
					</button>
					<h1 className="text-2xl font-bold text-gray-900">Transaction #{transaction.sequence_number}</h1>
					<p className="text-sm text-gray-500 mt-0.5">{formatDate(transaction.business_date)}</p>
				</div>
				<div className="flex gap-2">
					{transaction.is_training && (
						<span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Training</span>
					)}
					{transaction.is_offline && (
						<span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">Offline</span>
					)}
					{transaction.is_suspended && (
						<span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Suspended</span>
					)}
					{transaction.is_outside_sale && (
						<span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">Outside Sale</span>
					)}
				</div>
			</div>

			{/* Transaction Info */}
			<div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
				<div>
					<span className="text-xs text-gray-500 block">Store</span>
					<span className="text-gray-900 font-medium">{transaction.store_location_id}</span>
				</div>
				<div>
					<span className="text-xs text-gray-500 block">Register</span>
					<span className="text-gray-900 font-medium">{transaction.register_id}</span>
				</div>
				<div>
					<span className="text-xs text-gray-500 block">Cashier</span>
					<span className="text-gray-900 font-medium">{transaction.cashier_id}</span>
				</div>
				<div>
					<span className="text-xs text-gray-500 block">Shift</span>
					<span className="text-gray-900 font-medium">{transaction.shift_id}</span>
				</div>
				<div>
					<span className="text-xs text-gray-500 block">Started</span>
					<span className="text-gray-900">{formatDateTime(transaction.started_at)}</span>
				</div>
				<div>
					<span className="text-xs text-gray-500 block">Ended</span>
					<span className="text-gray-900">{formatDateTime(transaction.ended_at)}</span>
				</div>
				{transaction.import && (
					<div className="col-span-2 sm:col-span-3">
						<span className="text-xs text-gray-500 block">Source File</span>
						<span className="text-gray-600 font-mono text-xs">{transaction.import.filename}</span>
					</div>
				)}
			</div>

			{/* Items */}
			<div>
				<h2 className="text-base font-semibold text-gray-800 mb-2">
					Items ({transaction.items?.length ?? 0})
				</h2>
				<div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 text-sm">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty / Vol</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{(transaction.items ?? []).length === 0 ? (
								<tr>
									<td colSpan={8} className="px-4 py-6 text-center text-gray-500 text-sm">No items</td>
								</tr>
							) : (
								(transaction.items ?? []).map((item) => {
									const isFuel = item.item_type_code === 'FUEL';
									const isPrepay = item.item_type_code === 'PREPAY';
									const uom = item.item_type_sub_code || 'liter';
									return (
										<tr key={item.id} className={`hover:bg-gray-50 ${isPrepay ? 'bg-blue-50/50' : ''}`}>
											<td className="px-4 py-2 text-xs text-gray-400">{item.line_sequence}</td>
											<td className="px-4 py-2 whitespace-nowrap">
												{isFuel ? (
													<span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
														⛽ {fuelGradeLabel(item.plu_code, item.description)}
													</span>
												) : isPrepay ? (
													<span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
														Pre-pay
													</span>
												) : (
													<span className="text-xs font-mono text-gray-500">{item.plu_code}</span>
												)}
											</td>
											<td className="px-4 py-2 text-gray-900">
												{isFuel ? (
													<>
														{item.description}
														{item.plu_modifier && <span className="ml-1 text-xs text-gray-400">Pump {item.plu_modifier}</span>}
													</>
												) : isPrepay ? (
													<span className="text-gray-700">{item.description}</span>
												) : (
													<>
														{item.sku?.english_description || item.description}
														{!item.item_number && <span className="ml-1 text-xs text-gray-400">(unlinked)</span>}
													</>
												)}
											</td>
											<td className="px-4 py-2 text-gray-600 whitespace-nowrap">
												{isFuel || isPrepay ? (
													<span className="text-gray-400">—</span>
												) : item.department ? (
													`${item.department.department_number} — ${item.department.description}`
												) : (
													item.department_number ?? '—'
												)}
											</td>
											<td className="px-4 py-2 text-right whitespace-nowrap">
												{isFuel ? (
													<span>{Number(item.quantity).toFixed(3)} <span className="text-xs text-gray-400">{uom}</span></span>
												) : isPrepay ? (
													<span className="text-gray-400">—</span>
												) : (
													Number(item.quantity).toFixed(2)
												)}
											</td>
											<td className="px-4 py-2 text-right whitespace-nowrap">
												{isFuel ? (
													<span>${Number(item.actual_sale_price).toFixed(3)}<span className="text-xs text-gray-400">/L</span></span>
												) : isPrepay ? (
													<span className="text-gray-400">—</span>
												) : (
													`$${Number(item.actual_sale_price).toFixed(2)}`
												)}
											</td>
											<td className={`px-4 py-2 text-right font-medium whitespace-nowrap ${Number(item.sales_amount) < 0 ? 'text-red-600' : ''}`}>
												${Number(item.sales_amount).toFixed(2)}
											</td>
											<td className="px-4 py-2 text-right text-gray-500 whitespace-nowrap">
												{Number(item.tax_collected_amount) > 0 ? `$${Number(item.tax_collected_amount).toFixed(2)}` : '—'}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Tenders */}
			<div>
				<h2 className="text-base font-semibold text-gray-800 mb-2">
					Payment ({transaction.tenders?.length ?? 0})
				</h2>
				<div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 text-sm">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-type</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{(transaction.tenders ?? []).length === 0 ? (
								<tr>
									<td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">No tender info</td>
								</tr>
							) : (
								(transaction.tenders ?? []).map((tender) => (
									<tr key={tender.id} className="hover:bg-gray-50">
										<td className="px-4 py-2 capitalize">{tender.tender_code}</td>
										<td className="px-4 py-2 text-gray-500">{tender.tender_sub_code ?? '—'}</td>
										<td className="px-4 py-2 text-right font-medium">${Number(tender.tender_amount).toFixed(2)}</td>
										<td className="px-4 py-2 text-gray-500">{tender.is_change ? 'Yes' : 'No'}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Totals Summary */}
			<div className="bg-white rounded-lg border border-gray-200 p-4">
				<h2 className="text-base font-semibold text-gray-800 mb-3">Totals</h2>
				<dl className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
					<div>
						<dt className="text-xs text-gray-500">Gross</dt>
						<dd className="font-medium text-gray-900">${Number(transaction.total_gross_amount).toFixed(2)}</dd>
					</div>
					<div>
						<dt className="text-xs text-gray-500">Net</dt>
						<dd className="font-medium text-gray-900">${Number(transaction.total_net_amount).toFixed(2)}</dd>
					</div>
					<div>
						<dt className="text-xs text-gray-500">Tax Exempt</dt>
						<dd className="font-medium text-gray-900">${Number(transaction.total_tax_exempt_amount).toFixed(2)}</dd>
					</div>
					<div>
						<dt className="text-xs text-gray-500">Tax</dt>
						<dd className="font-medium text-gray-900">${Number(transaction.total_tax_amount).toFixed(2)}</dd>
					</div>
					<div>
						<dt className="text-xs text-gray-500">Grand Total</dt>
						<dd className="text-lg font-bold text-gray-900">${Number(transaction.total_grand_amount).toFixed(2)}</dd>
					</div>
				</dl>
			</div>
		</div>
	);
};

export default PosTransactionViewPage;
