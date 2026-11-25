import { createRoot, useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Notice,
	Spinner,
	TabPanel,
	TextControl,
} from '@wordpress/components';
import '../styles/saas-theme.css';
import { TableSkeleton } from '../shared/Skeleton';

function AdminApp() {
	const [overview, setOverview] = useState(null);
	const [parkingList, setParkingList] = useState([]);
	const [rentalList, setRentalList] = useState([]);
	const [driverList, setDriverList] = useState([]);
	const [rideList, setRideList] = useState([]);
	const [elementorPages, setElementorPages] = useState([]);

	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [cleaning, setCleaning] = useState(false);
	const [notice, setNotice] = useState(null);

	const loadAll = async () => {
		setLoading(true);
		try {
			const [ov, pk, rc, dr, rd, el] = await Promise.all([
				apiFetch({ path: '/custom/v1/admin/overview' }).catch(() => ({ data: { counts: {} } })),
				apiFetch({ path: '/parking/v1/bookings?per_page=20' }).catch(() => ({ data: [] })),
				apiFetch({ path: '/carrental/v1/rentals?per_page=20' }).catch(() => ({ data: [] })),
				apiFetch({ path: '/taxi/v1/drivers?per_page=20' }).catch(() => ({ data: [] })),
				apiFetch({ path: '/custom/v1/ride_assignments?per_page=20' }).catch(() => ({ data: [] })),
				apiFetch({ path: '/custom/v1/admin/elementor-pages' }).catch(() => ({ data: [] })),
			]);

			setOverview(ov?.data?.counts || {});
			setParkingList(Array.isArray(pk) ? pk : pk?.data || pk?.bookings || []);
			setRentalList(Array.isArray(rc) ? rc : rc?.data || rc?.rentals || []);
			setDriverList(Array.isArray(dr) ? dr : dr?.data || dr?.drivers || []);
			setRideList(Array.isArray(rd) ? rd : rd?.data || rd?.items || []);
			setElementorPages(el?.data || []);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAll();
	}, []);

	const handleCleanupElementor = async () => {
		setCleaning(true);
		setNotice(null);
		try {
			const res = await apiFetch({
				path: '/custom/v1/admin/cleanup-elementor',
				method: 'POST',
			});
			const count = res?.data?.deleted_count || 0;
			setNotice({
				status: 'success',
				message: `ลบหน้า Elementor ที่ไม่เกี่ยวกับระบบจองรถเรียบร้อยแล้ว (${count} รายการ)`,
			});
			loadAll();
		} catch (err) {
			setNotice({ status: 'error', message: err.message || 'Cleanup failed' });
		} finally {
			setCleaning(false);
		}
	};

	const filterRows = (rows) => {
		if (!search.trim()) {
			return rows;
		}
		const q = search.toLowerCase();
		return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
	};

	const kpis = [
		{ label: 'Parking Bookings', value: overview?.parking_booking ?? 0 },
		{ label: 'Car Rentals', value: overview?.car_rentals ?? 0 },
		{ label: 'Drivers', value: overview?.['taxi-driver'] ?? 0 },
		{ label: 'Ride Assignments', value: overview?.ride_assignment ?? 0 },
		{ label: 'Parking Spaces', value: overview?.parking_space ?? 0 },
		{ label: 'Saved Vehicles', value: overview?.['tabien-rod'] ?? 0 },
	];

	return (
		<div id="fluffy-admin-dashboard" className="fluffy-saas-shell">
			<div className="fluffy-saas-header">
				<div>
					<h1 className="fluffy-saas-title">Parking &amp; Car Rental System</h1>
					<p className="fluffy-saas-subtitle">
						จัดการข้อมูลการจองที่จอดรถ เช่ารถ พนักงานขับรถ และทำความสะอาดหน้า Elementor เดิมด้วย @wordpress/components
					</p>
				</div>
				<Button variant="primary" onClick={loadAll} disabled={loading}>
					{loading ? 'Refreshing...' : 'Refresh Data'}
				</Button>
			</div>

			{notice && (
				<div style={{ marginBottom: 16 }}>
					<Notice status={notice.status} onRemove={() => setNotice(null)}>
						{notice.message}
					</Notice>
				</div>
			)}

			<div className="fluffy-saas-kpi-grid">
				{kpis.map((kpi) => (
					<Card key={kpi.label} className="fluffy-saas-card">
						<CardBody>
							<div className="fluffy-saas-kpi-label">{kpi.label}</div>
							<div className="fluffy-saas-kpi-value">{kpi.value}</div>
						</CardBody>
					</Card>
				))}
			</div>

			<Card className="fluffy-saas-card" style={{ marginTop: 20 }}>
				<CardHeader>
					<TextControl
						__nextHasNoMarginBottom
						label="Search records"
						placeholder="ค้นหารหัสการจอง ชื่อลูกค้า ทะเบียนรถ..."
						value={search}
						onChange={setSearch}
					/>
				</CardHeader>
				<CardBody>
					{loading ? (
						<TableSkeleton rows={6} />
					) : (
						<TabPanel
							tabs={[
								{ name: 'parking', title: `Parking (${parkingList.length})` },
								{ name: 'rentals', title: `Car Rentals (${rentalList.length})` },
								{ name: 'drivers', title: `Drivers (${driverList.length})` },
								{ name: 'rides', title: `Transport (${rideList.length})` },
								{ name: 'cleanup', title: `Elementor Cleanup (${elementorPages.length})` },
							]}
						>
							{(tab) => {
								if (tab.name === 'cleanup') {
									return (
										<div style={{ paddingTop: 16 }}>
											<p className="fluffy-saas-subtitle" style={{ marginBottom: 12 }}>
												รายการหน้า/เทมเพลต Elementor ในฐานข้อมูลที่ไม่ได้ใช้ Template ของระบบจองรถหรือสมาชิก:
											</p>
											{elementorPages.length === 0 ? (
												<Notice status="success" isDismissible={false}>
													ไม่พบหน้า Elementor ที่ค้างอยู่ในฐานข้อมูลแล้ว
												</Notice>
											) : (
												<>
													<table className="widefat striped" style={{ marginBottom: 16 }}>
														<thead>
															<tr>
																<th>ID</th>
																<th>Title</th>
																<th>Type</th>
																<th>Status</th>
															</tr>
														</thead>
														<tbody>
															{elementorPages.map((p) => (
																<tr key={p.id}>
																	<td>{p.id}</td>
																	<td>{p.title}</td>
																	<td>{p.type}</td>
																	<td>{p.status}</td>
																</tr>
															))}
														</tbody>
													</table>
													<Button
														variant="primary"
														isDestructive
														isBusy={cleaning}
														disabled={cleaning}
														onClick={handleCleanupElementor}
													>
														ลบหน้า Elementor ทั้งหมด ({elementorPages.length} รายการ)
													</Button>
												</>
											)}
										</div>
									);
								}

								const map = {
									parking: filterRows(parkingList),
									rentals: filterRows(rentalList),
									drivers: filterRows(driverList),
									rides: filterRows(rideList),
								};
								const rows = map[tab.name] || [];

								if (rows.length === 0) {
									return <p style={{ padding: '16px 0', color: '#64748B' }}>ไม่พบข้อมูล</p>;
								}

								return (
									<div style={{ paddingTop: 16, overflowX: 'auto' }}>
										<table className="widefat striped">
											<thead>
												<tr>
													<th>ID / Code</th>
													<th>Name / Title</th>
													<th>Schedule / Info</th>
													<th>Status</th>
												</tr>
											</thead>
											<tbody>
												{rows.map((row, i) => (
													<tr key={row.id || i}>
														<td>{row.order_code || row.job_code || row.driver_code || row.id}</td>
														<td>{row.fullname_park || row.driver_name || row.title || '-'}</td>
														<td>
															{row.start_date
																? `${row.start_date} → ${row.end_date || ''}`
																: row.phone || row.location_park?.name || '-'}
														</td>
														<td>{row.tracking_check_status || row.status_job || row.status || '-'}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								);
							}}
						</TabPanel>
					)}
				</CardBody>
			</Card>
		</div>
	);
}

document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('fluffy-admin-root');
	if (!root) {
		return;
	}
	createRoot(root).render(<AdminApp />);
});
