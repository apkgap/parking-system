import { createRoot, useEffect, useState } from '@wordpress/element';
import '../styles/saas-theme.css';
import { getConfig, wpRest } from '../shared/api';
import { t } from '../shared/i18n';
import { TableSkeleton } from '../shared/Skeleton';

function exportRowsToCsv(filename, rows) {
	if (!rows.length) {
		return;
	}
	const headers = ['ID/Code', 'Name', 'Schedule/Info', 'Status'];
	const csvLines = [
		headers.join(','),
		...rows.map((r) =>
			[
				r.order_code || r.job_code || r.driver_code || r.id || '',
				r.fullname_park || r.driver_name || r.title || '',
				r.start_date ? `${r.start_date} - ${r.end_date || ''}` : r.phone || '',
				r.tracking_check_status || r.status_job || r.status || '',
			]
				.map((v) => `"${String(v).replace(/"/g, '""')}"`)
				.join(',')
		),
	];
	const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function FrontendDashboardApp() {
	const config = getConfig();
	const [activeTab, setActiveTab] = useState('parking');
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState({ parking: [], rentals: [], drivers: [], transport: [] });

	const loadAll = async () => {
		setLoading(true);
		try {
			const [pk, rc, dr, tr] = await Promise.all([
				wpRest(`${config.restUrl}parking/v1/bookings?per_page=50`).catch(() => ({ data: [] })),
				wpRest(`${config.restUrl}carrental/v1/rentals?per_page=50`).catch(() => ({ data: [] })),
				wpRest(`${config.restUrl}taxi/v1/drivers?per_page=50`).catch(() => ({ data: [] })),
				wpRest(`${config.customRestUrl}ride_assignments?per_page=50`).catch(() => ({ data: [] })),
			]);
			setData({
				parking: Array.isArray(pk) ? pk : pk?.data || pk?.bookings || [],
				rentals: Array.isArray(rc) ? rc : rc?.data || rc?.rentals || [],
				drivers: Array.isArray(dr) ? dr : dr?.data || dr?.drivers || [],
				transport: Array.isArray(tr) ? tr : tr?.data || tr?.items || [],
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAll();
	}, []);

	const currentRows = (data[activeTab] || []).filter((row) => {
		if (!search.trim()) {
			return true;
		}
		return JSON.stringify(row).toLowerCase().includes(search.toLowerCase());
	});

	const tabs = [
		{ id: 'parking', label: `${t('จองที่จอดรถ', 'Parking')} (${data.parking.length})` },
		{ id: 'rentals', label: `${t('เช่ารถ', 'Car Rentals')} (${data.rentals.length})` },
		{ id: 'drivers', label: `${t('คนขับรถ', 'Drivers')} (${data.drivers.length})` },
		{ id: 'transport', label: `${t('งานรับ-ส่ง', 'Transport')} (${data.transport.length})` },
	];

	return (
		<div id="fluffy-dashboard-app" className="fluffy-dashboard fluffy-saas-shell">
			<div id="fluffy-dashboard-container" className="fluffy-dashboard__container fluffy-saas-container space-y-6">
				<div id="fluffy-dashboard-header" className="fluffy-dashboard__header fluffy-saas-header">
					<div>
						<h1 className="fluffy-dashboard__title fluffy-saas-title">{t('แดชบอร์ดจัดการระบบจอง', 'Booking Management Dashboard')}</h1>
						<p className="fluffy-dashboard__subtitle fluffy-saas-subtitle">
							{t('ติดตามสถานะการจองที่จอดรถ เช่ารถ คนขับ และงานรับ-ส่งแบบเรียลไทม์', 'Monitor parking bookings, car rentals, drivers, and ride assignments.')}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => exportRowsToCsv(`fluffy-${activeTab}.csv`, currentRows)}
							className="fluffy-saas-btn fluffy-saas-btn-secondary"
						>
							{t('Export CSV', 'Export CSV')}
						</button>
						<button type="button" onClick={loadAll} disabled={loading} className="fluffy-saas-btn fluffy-saas-btn-primary">
							{loading ? t('กำลังโหลด...', 'Refreshing...') : t('รีเฟรชข้อมูล', 'Refresh')}
						</button>
					</div>
				</div>

				<div id="fluffy-dashboard-kpis" className="fluffy-dashboard__kpis fluffy-saas-kpi-grid">
					<div className="fluffy-saas-card">
						<div className="fluffy-saas-kpi-label">{t('จองที่จอดรถ', 'Parking Bookings')}</div>
						<div className="fluffy-saas-kpi-value">{data.parking.length}</div>
					</div>
					<div className="fluffy-saas-card">
						<div className="fluffy-saas-kpi-label">{t('จองเช่ารถ', 'Car Rentals')}</div>
						<div className="fluffy-saas-kpi-value">{data.rentals.length}</div>
					</div>
					<div className="fluffy-saas-card">
						<div className="fluffy-saas-kpi-label">{t('พนักงานขับรถ', 'Drivers')}</div>
						<div className="fluffy-saas-kpi-value">{data.drivers.length}</div>
					</div>
					<div className="fluffy-saas-card">
						<div className="fluffy-saas-kpi-label">{t('งานรับ-ส่ง', 'Ride Assignments')}</div>
						<div className="fluffy-saas-kpi-value">{data.transport.length}</div>
					</div>
				</div>

				<div id="fluffy-dashboard-panel" className="fluffy-dashboard__panel fluffy-saas-card p-0 overflow-hidden">
					<div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-4 md:flex-row md:items-center md:justify-between">
						<div id="fluffy-dashboard-tabs" className="fluffy-dashboard__tabs flex flex-wrap gap-1.5">
							{tabs.map((tab) => (
								<button
									id={`fluffy-dash-tab-${tab.id}`}
									className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
										activeTab === tab.id ? 'bg-[var(--fluffy-primary)] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
									}`}
									type="button"
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
								>
									{tab.label}
								</button>
							))}
						</div>
						<input
							id="fluffy-dashboard-search"
							className="fluffy-dashboard__search fluffy-saas-input md:!w-72"
							type="text"
							placeholder={t('ค้นหารหัส ชื่อลูกค้า ทะเบียนรถ...', 'Search code, customer, plate...')}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					{loading ? (
						<TableSkeleton rows={6} />
					) : currentRows.length === 0 ? (
						<div className="p-10 text-center text-sm text-[#64748B]">{t('ไม่พบข้อมูล', 'No records found.')}</div>
					) : (
						<div className="overflow-x-auto">
							<table id="fluffy-dashboard-table" className="fluffy-dashboard__table w-full border-collapse text-left text-sm">
								<thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase text-[#64748B]">
									<tr>
										<th className="px-4 py-3">{t('รหัส', 'Code / ID')}</th>
										<th className="px-4 py-3">{t('ชื่อ / รายการ', 'Name / Title')}</th>
										<th className="px-4 py-3">{t('รายละเอียด / วันเวลา', 'Details / Schedule')}</th>
										<th className="px-4 py-3">{t('สถานะ', 'Status')}</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#E2E8F0]">
									{currentRows.map((row, idx) => (
										<tr key={row.id || idx} className="hover:bg-[#F8FAFC]">
											<td className="px-4 py-3 font-semibold text-[#0F172A]">
												{row.order_code || row.job_code || row.driver_code || row.id}
											</td>
											<td className="px-4 py-3 text-[#0F172A]">
												{row.fullname_park || row.driver_name || row.title || '-'}
											</td>
											<td className="px-4 py-3 text-[#64748B]">
												{row.start_date
													? `${row.start_date} → ${row.end_date || ''}`
													: row.phone || (typeof row.location_park === 'object' ? row.location_park?.name : row.location_park) || '-'}
											</td>
											<td className="px-4 py-3">
												<span className="fluffy-saas-pill bg-[var(--fluffy-primary-soft)] text-[var(--fluffy-primary)]">
													{row.tracking_check_status || row.status_job || row.status || 'pending'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

document.addEventListener('DOMContentLoaded', () => {
	const rootEl = document.getElementById('fluffy-dashboard-root');
	if (!rootEl) {
		return;
	}
	createRoot(rootEl).render(<FrontendDashboardApp />);
});
