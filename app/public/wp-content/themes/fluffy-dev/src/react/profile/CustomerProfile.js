import { useEffect, useState } from '@wordpress/element';
import { getConfig, wpRest } from '../shared/api';
import { t } from '../shared/i18n';
import { BookingListSkeleton } from '../shared/Skeleton';

const decodeHtml = (value) => {
	if (typeof value !== 'string' || !value.includes('&')) {
		return value || '';
	}
	const doc = new DOMParser().parseFromString(value, 'text/html');
	return doc.documentElement.textContent || value;
};

const STATUS_BADGES = {
	confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
	'checked-in': 'bg-[var(--fluffy-primary-soft)] text-[var(--fluffy-primary)] border border-indigo-200',
	'checked-out': 'bg-slate-100 text-slate-700 border border-slate-200',
	cancel: 'bg-red-50 text-red-700 border border-red-200',
	pending: 'bg-amber-50 text-amber-700 border border-amber-200',
};

export default function CustomerProfile() {
	const config = getConfig();
	const user = config.user || {};

	const [activeTab, setActiveTab] = useState('bookings');
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const [plates, setPlates] = useState([]);
	const [plateTitle, setPlateTitle] = useState('');
	const [plateNumber, setPlateNumber] = useState('');
	const [plateSaving, setPlateSaving] = useState(false);
	const [plateMessage, setPlateMessage] = useState('');

	const loadBookings = async (targetPage = page) => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: String(targetPage),
				per_page: '10',
			});
			if (search.trim()) {
				params.set('search', search.trim());
			}
			if (statusFilter) {
				params.set('status', statusFilter);
			}
			const res = await wpRest(`${config.customRestUrl}user_parking_booking?${params.toString()}`);
			const list = Array.isArray(res) ? res : res.data || res.bookings || res.items || [];
			setBookings(list);
			setTotalPages(Number(res?.pages || res?.pagination?.total_pages || res?.total_pages || 1));
		} catch {
			setBookings([]);
		} finally {
			setLoading(false);
		}
	};

	const loadPlates = async () => {
		if (!user.id) {
			return;
		}
		try {
			const res = await wpRest(`${config.customRestUrl}tabien_rod?user_id=${user.id}&per_page=50`);
			setPlates(res?.items || []);
		} catch {
			setPlates([]);
		}
	};

	useEffect(() => {
		loadBookings(page);
	}, [page, statusFilter]);

	useEffect(() => {
		loadPlates();
	}, []);

	const handleAddPlate = async (e) => {
		e.preventDefault();
		if (!plateTitle.trim() || !plateNumber.trim()) {
			return;
		}
		setPlateSaving(true);
		setPlateMessage('');
		try {
			await wpRest(`${config.customRestUrl}tabien_rod`, {
				method: 'POST',
				body: JSON.stringify({
					title: plateTitle.trim(),
					license_plate: plateNumber.trim(),
				}),
			});
			setPlateTitle('');
			setPlateNumber('');
			setPlateMessage(t('บันทึกทะเบียนรถเรียบร้อยแล้ว', 'License plate saved.'));
			loadPlates();
		} catch (err) {
			setPlateMessage(err.message);
		} finally {
			setPlateSaving(false);
		}
	};

	const initials = (user.displayName || 'U').slice(0, 2).toUpperCase();

	return (
		<div id="fluffy-customer-profile" className="fluffy-saas-shell">
			<div className="fluffy-saas-container space-y-6">
				<div className="fluffy-saas-card flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
					<div className="flex items-center gap-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fluffy-primary-soft)] text-xl font-bold text-[var(--fluffy-primary)]">
							{initials}
						</div>
						<div>
							<h1 className="fluffy-saas-title">{user.displayName}</h1>
							<p className="fluffy-saas-subtitle">{user.email}</p>
							<div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
								<span className="fluffy-saas-pill bg-[var(--fluffy-primary-soft)] text-[var(--fluffy-primary)]">
									{t('สมาชิกยืนยันแล้ว', 'Verified Member')}
								</span>
								{user.registered && (
									<span>{t('สมาชิกตั้งแต่', 'Member since')} {user.registered}</span>
								)}
							</div>
						</div>
					</div>
					<a href={config.logoutUrl} className="fluffy-saas-btn fluffy-saas-btn-secondary">
						{t('ออกจากระบบ', 'Logout')}
					</a>
				</div>

				<div className="inline-flex rounded-xl border border-[#E2E8F0] bg-white p-1">
					<button
						type="button"
						onClick={() => setActiveTab('bookings')}
						className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
							activeTab === 'bookings' ? 'bg-[var(--fluffy-primary)] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
						}`}
					>
						{t('ประวัติการจองที่จอดรถ', 'Booking History')}
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('plates')}
						className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
							activeTab === 'plates' ? 'bg-[var(--fluffy-primary)] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
						}`}
					>
						{t('ทะเบียนรถของฉัน', 'Saved Vehicles')} ({plates.length})
					</button>
				</div>

				{activeTab === 'bookings' ? (
					<div className="fluffy-saas-card p-0 overflow-hidden">
						<div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-5 md:flex-row md:items-center md:justify-between">
							<h2 className="text-base font-semibold text-[#0F172A]">{t('รายการจองทั้งหมด', 'Your Bookings')}</h2>
							<div className="flex flex-wrap gap-2">
								<input
									id="fluffy-profile-search"
									className="fluffy-saas-input !w-auto"
									type="text"
									placeholder={t('ค้นหารหัสการจอง...', 'Search bookings...')}
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
								<button
									type="button"
									onClick={() => {
										setPage(1);
										loadBookings(1);
									}}
									className="fluffy-saas-btn fluffy-saas-btn-primary"
								>
									{t('ค้นหา', 'Search')}
								</button>
								<select
									id="fluffy-profile-status"
									className="fluffy-saas-select !w-auto"
									value={statusFilter}
									onChange={(e) => {
										setPage(1);
										setStatusFilter(e.target.value);
									}}
								>
									<option value="">{t('ทุกสถานะ', 'All Status')}</option>
									<option value="confirmed">{t('ยืนยันแล้ว', 'Confirmed')}</option>
									<option value="checked-in">{t('เช็คอิน', 'Checked-in')}</option>
									<option value="checked-out">{t('เช็คเอาท์', 'Checked-out')}</option>
									<option value="cancel">{t('ยกเลิก', 'Cancelled')}</option>
								</select>
							</div>
						</div>

						{loading ? (
							<BookingListSkeleton rows={4} />
						) : bookings.length === 0 ? (
							<div className="p-10 text-center text-sm text-[#64748B]">{t('ยังไม่พบประวัติการจอง', 'No bookings found.')}</div>
						) : (
							<div className="divide-y divide-[#E2E8F0]">
								{bookings.map((item, idx) => {
									const statusKey = (item.tracking_check_status || item.status || 'pending').toLowerCase();
									const badgeClass = STATUS_BADGES[statusKey] || 'bg-slate-100 text-slate-700';
									const rawLocationLabel =
										typeof item.location_park === 'object' && item.location_park !== null
											? item.location_park.name || item.location_park.slug
											: item.location_park || item.title;
									const locationLabel = decodeHtml(rawLocationLabel);
									return (
										<div
											id={`fluffy-booking-item-${item.id || idx}`}
											className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
											key={item.id || idx}
										>
											<div>
												<p className="font-semibold text-[#0F172A]">
													#{item.order_code || item.id} — {locationLabel}
												</p>
												<p className="mt-0.5 text-sm text-[#64748B]">
													{item.start_date} {item.start_time} → {item.end_date} {item.end_time}
												</p>
											</div>
											<div className="flex items-center gap-3">
												<span className={`fluffy-saas-pill ${badgeClass}`}>{statusKey}</span>
												{item.qr_code_url && (
													<a
														href={item.qr_code_url}
														target="_blank"
														rel="noreferrer"
														className="fluffy-saas-btn fluffy-saas-btn-secondary !px-3 !py-1.5 text-xs"
													>
														QR Code
													</a>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}

						{totalPages > 1 && (
							<div className="flex items-center justify-between border-t border-[#E2E8F0] px-5 py-3 text-sm text-[#64748B]">
								<button
									type="button"
									disabled={page <= 1}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									className="fluffy-saas-btn fluffy-saas-btn-secondary !px-3 !py-1.5"
								>
									{t('ก่อนหน้า', 'Previous')}
								</button>
								<span>{page} / {totalPages}</span>
								<button
									type="button"
									disabled={page >= totalPages}
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									className="fluffy-saas-btn fluffy-saas-btn-secondary !px-3 !py-1.5"
								>
									{t('ถัดไป', 'Next')}
								</button>
							</div>
						)}
					</div>
				) : (
					<div className="grid gap-6 lg:grid-cols-12">
						<form id="fluffy-add-plate-form" className="fluffy-saas-card space-y-4 lg:col-span-4" onSubmit={handleAddPlate}>
							<h2 className="text-base font-semibold text-[#0F172A]">{t('เพิ่มทะเบียนรถใหม่', 'Add New Vehicle')}</h2>
							<div>
								<label htmlFor="fluffy-plate-title" className="fluffy-saas-label">{t('ชื่อเรียก / รุ่นรถ', 'Vehicle Label')}</label>
								<input id="fluffy-plate-title" className="fluffy-saas-input" type="text" value={plateTitle} onChange={(e) => setPlateTitle(e.target.value)} required />
							</div>
							<div>
								<label htmlFor="fluffy-plate-number" className="fluffy-saas-label">{t('เลขทะเบียนรถ', 'License Plate')}</label>
								<input id="fluffy-plate-number" className="fluffy-saas-input" type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required />
							</div>
							{plateMessage && <p className="text-xs text-[var(--fluffy-primary)]">{plateMessage}</p>}
							<button type="submit" disabled={plateSaving} className="fluffy-saas-btn fluffy-saas-btn-primary w-full">
								{plateSaving ? t('กำลังบันทึก...', 'Saving...') : t('บันทึกทะเบียนรถ', 'Save Vehicle')}
							</button>
						</form>

						<div className="fluffy-saas-card lg:col-span-8">
							<h2 className="mb-4 text-base font-semibold text-[#0F172A]">{t('ทะเบียนรถที่บันทึกไว้', 'Saved License Plates')}</h2>
							{plates.length === 0 ? (
								<p className="text-sm text-[#64748B]">{t('ยังไม่มีทะเบียนรถที่บันทึกไว้', 'No saved vehicles yet.')}</p>
							) : (
								<div className="grid gap-3 sm:grid-cols-2">
									{plates.map((plate) => (
										<div id={`fluffy-plate-${plate.id}`} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4" key={plate.id}>
											<p className="font-semibold text-[#0F172A]">{plate.tabienrod_number}</p>
											<p className="mt-0.5 text-sm text-[#64748B]">{plate.title}</p>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
