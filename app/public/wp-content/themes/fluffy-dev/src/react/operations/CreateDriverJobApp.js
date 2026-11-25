import { useEffect, useState } from '@wordpress/element';
import { getConfig, wpAjax, wpRest } from '../shared/api';
import { t } from '../shared/i18n';
import StatusModal from '../shared/StatusModal';

export default function CreateDriverJobApp() {
	const config = getConfig();
	const [bookings, setBookings] = useState([]);
	const [drivers, setDrivers] = useState([]);
	const [bookingOrder, setBookingOrder] = useState('');
	const [taxiUser, setTaxiUser] = useState('');
	const [statusJob, setStatusJob] = useState('pending');
	const [plateDriver, setPlateDriver] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [modal, setModal] = useState({ open: false, type: 'success', title: '', message: '' });

	useEffect(() => {
		wpRest(`${config.customRestUrl}parking_booking?per_page=100`)
			.then((res) => setBookings(Array.isArray(res) ? res : res.data || []))
			.catch(() => setBookings([]));

		wpRest(`${config.restUrl}taxi/v1/drivers?per_page=100`)
			.then((res) => setDrivers(Array.isArray(res) ? res : res.data || res.drivers || []))
			.catch(() => setDrivers([]));
	}, []);

	const selectedBooking = bookings.find((b) => String(b.id) === String(bookingOrder)) || null;

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!bookingOrder || !taxiUser) {
			setModal({
				open: true,
				type: 'error',
				title: t('กรอกข้อมูลไม่ครบ', 'Missing Fields'),
				message: t('กรุณาเลือกรายการจองและพนักงานขับรถ', 'Please select both a booking and a driver.'),
			});
			return;
		}
		setSubmitting(true);
		try {
			const payload = {
				booking_order: Number(bookingOrder),
				taxi_user: Number(taxiUser),
				status_job: statusJob,
				plate_driver: plateDriver.trim(),
				addon_information: selectedBooking?.addon_information || {},
			};
			const res = await wpAjax('save_ride_assignment', {
				nonce: config.nonces.rest,
				data: JSON.stringify(payload),
			});
			setModal({
				open: true,
				type: 'success',
				title: t('สร้างงานคนขับสำเร็จ', 'Driver Job Created'),
				message: res?.message || t('บันทึกการจ่ายงานเรียบร้อยแล้ว', 'Ride assignment saved.'),
			});
			setBookingOrder('');
			setPlateDriver('');
		} catch (err) {
			setModal({ open: true, type: 'error', title: t('สร้างงานไม่สำเร็จ', 'Failed'), message: err.message });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div id="fluffy-driver-job" className="fluffy-driver-job fluffy-saas-shell">
			<div id="fluffy-driver-job-container" className="fluffy-driver-job__container fluffy-saas-container max-w-3xl">
				<div id="fluffy-driver-job-header" className="fluffy-driver-job__header fluffy-saas-header">
					<div>
						<h1 className="fluffy-driver-job__title fluffy-saas-title">{t('ระบบจ่ายงานรถรับ-ส่ง', 'Create Driver Job')}</h1>
						<p className="fluffy-driver-job__subtitle fluffy-saas-subtitle">
							{t('เลือกรายการจองและมอบหมายพนักงานขับรถพร้อมบันทึกทะเบียนรถ', 'Assign a booking to a driver and record vehicle plate details.')}
						</p>
					</div>
				</div>

				<form id="fluffy-driver-job-form" className="fluffy-driver-job__form fluffy-saas-card space-y-5" onSubmit={handleSubmit}>
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label htmlFor="fluffy-job-booking" className="fluffy-saas-label">{t('รายการจองที่จอดรถ', 'Booking Order')} *</label>
							<select
								id="fluffy-job-booking"
								className="fluffy-saas-select"
								value={bookingOrder}
								onChange={(e) => setBookingOrder(e.target.value)}
								required
							>
								<option value="">{t('-- เลือกรายการจอง --', '-- Select Booking --')}</option>
								{bookings.map((b) => (
									<option key={b.id} value={b.id}>
										#{b.order_code || b.id} - {b.fullname_park || b.title}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="fluffy-job-driver" className="fluffy-saas-label">{t('พนักงานขับรถ', 'Driver')} *</label>
							<select
								id="fluffy-job-driver"
								className="fluffy-saas-select"
								value={taxiUser}
								onChange={(e) => setTaxiUser(e.target.value)}
								required
							>
								<option value="">{t('-- เลือกคนขับ --', '-- Select Driver --')}</option>
								{drivers.map((d) => (
									<option key={d.id} value={d.id}>
										{d.driver_name || d.title} {d.driver_code ? `(${d.driver_code})` : ''}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="fluffy-job-status" className="fluffy-saas-label">{t('สถานะงาน', 'Job Status')}</label>
							<select id="fluffy-job-status" className="fluffy-saas-select" value={statusJob} onChange={(e) => setStatusJob(e.target.value)}>
								<option value="pending">{t('รอดำเนินการ', 'Pending')}</option>
								<option value="scheduled">{t('กำหนดคิวแล้ว', 'Scheduled')}</option>
								<option value="dispatched">{t('มอบหมายแล้ว', 'Dispatched')}</option>
								<option value="progress">{t('กำลังดำเนินการ', 'In Progress')}</option>
								<option value="completed">{t('เสร็จสิ้น', 'Completed')}</option>
								<option value="cancelled">{t('ยกเลิก', 'Cancelled')}</option>
							</select>
						</div>

						<div>
							<label htmlFor="fluffy-job-plate" className="fluffy-saas-label">{t('ทะเบียนรถคนขับ', 'Driver License Plate')}</label>
							<input
								id="fluffy-job-plate"
								className="fluffy-saas-input"
								type="text"
								placeholder={t('เช่น กข-1234 กรุงเทพมหานคร', 'e.g. AB-1234 Bangkok')}
								value={plateDriver}
								onChange={(e) => setPlateDriver(e.target.value)}
							/>
						</div>
					</div>

					{selectedBooking?.addon_information && (
						<div id="fluffy-job-addon-preview" className="fluffy-driver-job__addon rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm">
							<p className="m-0 font-semibold text-[#0F172A]">{t('ข้อมูลบริการเสริมจากการจอง', 'Booking Add-on Details')}</p>
							<p className="m-0 mt-1 text-xs text-[#64748B]">
								Pickup: {selectedBooking.addon_information.service_pickup ? 'Yes' : 'No'} · Valet: {selectedBooking.addon_information.service_valet ? 'Yes' : 'No'}
							</p>
						</div>
					)}

					<div className="flex justify-end pt-2">
						<button type="submit" disabled={submitting} className="fluffy-saas-btn fluffy-saas-btn-primary">
							{submitting ? t('กำลังบันทึก...', 'Saving...') : t('บันทึกการจ่ายงาน', 'Assign Driver Job')}
						</button>
					</div>
				</form>
			</div>

			<StatusModal modal={modal} onClose={() => setModal((prev) => ({ ...prev, open: false }))} />
		</div>
	);
}
