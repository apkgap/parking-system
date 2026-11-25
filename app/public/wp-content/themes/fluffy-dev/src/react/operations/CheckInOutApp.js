import { useEffect, useState } from '@wordpress/element';
import { getConfig, wpAjax, wpRest } from '../shared/api';
import { t } from '../shared/i18n';
import StatusModal from '../shared/StatusModal';
import { CardDetailSkeleton } from '../shared/Skeleton';

export default function CheckInOutApp({ mode = 'checkin' }) {
	const config = getConfig();
	const isCheckout = mode === 'checkout';
	const [orderCode, setOrderCode] = useState(() => {
		const params = new URLSearchParams(window.location.search);
		return params.get('order_code') || '';
	});
	const [booking, setBooking] = useState(null);
	const [loading, setLoading] = useState(false);
	const [processing, setProcessing] = useState(false);
	const [modal, setModal] = useState({ open: false, type: 'success', title: '', message: '' });

	const fetchBooking = async (code) => {
		if (!code.trim()) {
			return;
		}
		setLoading(true);
		setBooking(null);
		try {
			const res = await wpRest(`${config.customRestUrl}parking_booking?search=${encodeURIComponent(code.trim())}`);
			const list = Array.isArray(res) ? res : res.data || [];
			const matched =
				list.find((item) => String(item.order_code || '').toLowerCase() === code.trim().toLowerCase()) || list[0] || null;
			setBooking(matched);
			if (!matched) {
				setModal({
					open: true,
					type: 'error',
					title: t('ไม่พบรายการจอง', 'Booking Not Found'),
					message: t(`ไม่พบหมายเลขการจอง ${code}`, `No booking found for code ${code}.`),
				});
			}
		} catch (err) {
			setModal({ open: true, type: 'error', title: t('เกิดข้อผิดพลาด', 'Error'), message: err.message });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (orderCode) {
			fetchBooking(orderCode);
		}
	}, []);

	useEffect(() => {
		if (orderCode || !window.Html5QrcodeScanner) {
			return undefined;
		}
		const readerEl = document.getElementById('fluffy-qr-reader');
		if (!readerEl) {
			return undefined;
		}
		const scanner = new window.Html5QrcodeScanner('fluffy-qr-reader', { fps: 10, qrbox: { width: 240, height: 240 } }, false);
		scanner.render(
			(decodedText) => {
				scanner.clear().catch(() => {});
				setOrderCode(decodedText);
				fetchBooking(decodedText);
			},
			() => {}
		);
		return () => {
			scanner.clear().catch(() => {});
		};
	}, [orderCode]);

	const handleAction = async () => {
		if (!booking?.id) {
			return;
		}
		setProcessing(true);
		try {
			const action = isCheckout ? 'handle_check_out' : 'handle_check_in';
			const nonce = isCheckout ? config.nonces.checkout : config.nonces.checkin;
			const res = await wpAjax(action, {
				nonce,
				booking_id: booking.id,
			});
			setModal({
				open: true,
				type: 'success',
				title: isCheckout ? t('เช็คเอาท์สำเร็จ', 'Check-out Complete') : t('เช็คอินสำเร็จ', 'Check-in Complete'),
				message: res?.message || t('บันทึกสถานะเรียบร้อยแล้ว', 'Status updated.'),
			});
			fetchBooking(orderCode);
		} catch (err) {
			setModal({ open: true, type: 'error', title: t('ดำเนินการไม่สำเร็จ', 'Action Failed'), message: err.message });
		} finally {
			setProcessing(false);
		}
	};

	const locationName =
		typeof booking?.location_park === 'object' && booking?.location_park !== null
			? booking.location_park.name || booking.location_park.slug
			: booking?.location_park || '-';

	return (
		<div id={`fluffy-ops-${mode}`} className="fluffy-ops fluffy-saas-shell">
			<div id="fluffy-ops-container" className="fluffy-ops__container fluffy-saas-container max-w-3xl">
				<div id="fluffy-ops-header" className="fluffy-ops__header fluffy-saas-header">
					<div>
						<h1 className="fluffy-ops__title fluffy-saas-title">
							{isCheckout ? t('สแกน QR เพื่อเช็คเอาท์', 'QR Check-out') : t('สแกน QR เพื่อเช็คอิน', 'QR Check-in')}
						</h1>
						<p className="fluffy-ops__subtitle fluffy-saas-subtitle">
							{t('สแกน QR Code จากลูกค้าหรือกรอกรหัสการจองเพื่อค้นหา', 'Scan customer QR code or enter order code manually.')}
						</p>
					</div>
					<a href={`${config.homeUrl}service/`} className="fluffy-saas-btn fluffy-saas-btn-secondary">
						{t('กลับหน้าควบคุมบริการ', 'Service Control')}
					</a>
				</div>

				<div id="fluffy-ops-search-card" className="fluffy-ops__card fluffy-saas-card mb-6">
					<form
						id="fluffy-ops-search-form"
						className="fluffy-ops__search-form flex flex-col gap-3 sm:flex-row"
						onSubmit={(e) => {
							e.preventDefault();
							fetchBooking(orderCode);
						}}
					>
						<input
							id="fluffy-ops-order-code"
							className="fluffy-ops__input fluffy-saas-input flex-1"
							type="text"
							placeholder={t('กรอกรหัสการจอง เช่น 123456', 'Enter order code e.g. 123456')}
							value={orderCode}
							onChange={(e) => setOrderCode(e.target.value)}
						/>
						<button type="submit" disabled={loading} className="fluffy-saas-btn fluffy-saas-btn-primary">
							{loading ? t('กำลังค้นหา...', 'Searching...') : t('ค้นหาการจอง', 'Lookup Booking')}
						</button>
					</form>

					{!orderCode && (
						<div id="fluffy-qr-wrapper" className="fluffy-ops__qr-wrapper mt-6 flex flex-col items-center">
							<div id="fluffy-qr-reader" className="fluffy-ops__qr-reader w-full max-w-xs overflow-hidden rounded-xl border border-[#E2E8F0]" />
						</div>
					)}
				</div>

				{loading ? (
					<CardDetailSkeleton />
				) : booking && (
					<div id="fluffy-ops-booking-card" className="fluffy-ops__booking-card fluffy-saas-card space-y-5">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
							<div>
								<h2 className="m-0 text-lg font-bold text-[#0F172A]">
									#{booking.order_code || booking.id} — {booking.fullname_park || booking.title}
								</h2>
								<p className="m-0 mt-1 text-sm text-[#64748B]">{locationName}</p>
							</div>
							<span className="fluffy-saas-pill bg-[var(--fluffy-primary-soft)] text-[var(--fluffy-primary)]">
								{booking.tracking_check_status || booking.status || 'pending'}
							</span>
						</div>

						<div className="grid gap-4 text-sm sm:grid-cols-2">
							<div>
								<div className="text-xs text-[#64748B]">{t('วันเวลาเริ่มต้น', 'Start Schedule')}</div>
								<div className="mt-0.5 font-medium text-[#0F172A]">{booking.start_date} {booking.start_time}</div>
							</div>
							<div>
								<div className="text-xs text-[#64748B]">{t('วันเวลาสิ้นสุด', 'End Schedule')}</div>
								<div className="mt-0.5 font-medium text-[#0F172A]">{booking.end_date} {booking.end_time}</div>
							</div>
							<div>
								<div className="text-xs text-[#64748B]">{t('เบอร์โทรศัพท์', 'Phone')}</div>
								<div className="mt-0.5 font-medium text-[#0F172A]">{booking.phone_park || '-'}</div>
							</div>
							<div>
								<div className="text-xs text-[#64748B]">Email</div>
								<div className="mt-0.5 font-medium text-[#0F172A]">{booking.email_park || '-'}</div>
							</div>
						</div>

						<div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4">
							<button
								type="button"
								onClick={() => {
									setOrderCode('');
									setBooking(null);
								}}
								className="fluffy-saas-btn fluffy-saas-btn-secondary"
							>
								{t('สแกนรายการใหม่', 'Scan Another')}
							</button>
							<button
								type="button"
								onClick={handleAction}
								disabled={processing}
								className="fluffy-saas-btn fluffy-saas-btn-primary"
							>
								{processing
									? t('กำลังบันทึก...', 'Processing...')
									: isCheckout
									? t('ยืนยันการเช็คเอาท์', 'Confirm Check-out')
									: t('ยืนยันการเช็คอิน', 'Confirm Check-in')}
							</button>
						</div>
					</div>
				)}
			</div>

			<StatusModal modal={modal} onClose={() => setModal((prev) => ({ ...prev, open: false }))} />
		</div>
	);
}
