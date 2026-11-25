import { useEffect, useState } from '@wordpress/element';
import { getConfig, wpAjax, wpRest } from '../shared/api';
import { t } from '../shared/i18n';
import StatusModal from '../shared/StatusModal';
import { PackageGridSkeleton } from '../shared/Skeleton';
import DatePickerField from '../shared/DatePickerField';
import TimePickerField from '../shared/TimePickerField';

export default function RentcarBooking() {
	const config = getConfig();
	const user = config.user || {};

	const [locations, setLocations] = useState([]);
	const [packages, setPackages] = useState([]);
	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');
	const [selectedPackage, setSelectedPackage] = useState(null);
	const [tripType, setTripType] = useState(0);

	const [personal, setPersonal] = useState({
		full_name: user.displayName || '',
		email: user.email || '',
		phone_number: user.phone || '',
		line_id_whatsapp: user.lineId || '',
	});

	const [outbound, setOutbound] = useState({
		depart_start_location: '',
		depart_start_location_note: '',
		depart_destination: '',
		depart_destination_note: '',
		depart_date: '',
		depart_time: '09:00',
	});

	const [returnTrip, setReturnTrip] = useState({
		return_start_location: '',
		return_start_location_note: '',
		return_destination: '',
		return_destination_note: '',
		return_date: '',
		return_time: '18:00',
	});

	const [adultCount, setAdultCount] = useState(1);
	const [couponCode, setCouponCode] = useState('');
	const [discount, setDiscount] = useState(0);
	const [couponMsg, setCouponMsg] = useState('');
	const [searching, setSearching] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [modal, setModal] = useState({ open: false, type: 'success', title: '', message: '' });

	useEffect(() => {
		wpRest(`${config.carrentRestUrl}car-locations?lang=${config.lang}`)
			.then((res) => setLocations(Array.isArray(res) ? res : []))
			.catch(() => setLocations([]));
	}, []);

	const handleSearchPackages = async () => {
		const params = new URLSearchParams();
		if (origin) {
			params.set('origin', origin);
		}
		if (destination) {
			params.set('destination', destination);
		}
		setSearching(true);
		try {
			const res = await wpRest(`${config.customRestUrl}car_rental_packages?${params.toString()}`);
			setPackages(res?.data || []);
		} catch {
			setPackages([]);
		} finally {
			setSearching(false);
		}
	};

	const basePrice = selectedPackage ? Number(selectedPackage.price || 0) * (tripType === 1 ? 2 : 1) : 0;
	const finalPrice = Math.max(0, basePrice - discount);

	const handleValidateCoupon = async () => {
		if (!couponCode.trim()) {
			return;
		}
		try {
			const res = await wpAjax('validate_coupon_carrent', {
				coupon_code: couponCode.trim(),
				total_price: basePrice,
			});
			setDiscount(Number(res?.discount_amount || 0));
			setCouponMsg(t(`ลด ${res.discount_amount} บาท`, `Discount: -${res.discount_amount} THB`));
		} catch (err) {
			setDiscount(0);
			setCouponMsg(err.message);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedPackage) {
			setModal({
				open: true,
				type: 'error',
				title: t('กรุณาเลือกแพ็กเกจ', 'Select a Package'),
				message: t('กรุณาค้นหาและเลือกแพ็กเกจรถเช่าก่อนยืนยัน', 'Please search and select a car rental package first.'),
			});
			return;
		}

		setSubmitting(true);
		try {
			const fields = {
				trip_type: tripType,
				selected_package: {
					id: selectedPackage.id,
					title: selectedPackage.title,
					car_type: selectedPackage.car_type,
					origin: selectedPackage.origin,
					destination: selectedPackage.destination,
					price: finalPrice,
				},
				personal_information: personal,
				travel_information_outbound_trip: {
					...outbound,
					depart_start_location: outbound.depart_start_location || selectedPackage.origin,
					depart_destination: outbound.depart_destination || selectedPackage.destination,
				},
				travel_information_return_trip: {
					...returnTrip,
					return_start_location: returnTrip.return_start_location || selectedPackage.destination,
					return_destination: returnTrip.return_destination || selectedPackage.origin,
				},
				booking_details: {
					car_type: selectedPackage.car_type || selectedPackage.title,
					adult_count: adultCount,
					total_price: finalPrice,
				},
				coupon_code: discount > 0 ? couponCode.trim() : '',
			};

			const res = await wpAjax('insert_car_rent_acf', {
				nonce: config.nonces.carrent,
				fields,
			});
			window.location.href = res?.checkout_url || res?.redirect_url || config.checkoutUrl;
		} catch (err) {
			setModal({ open: true, type: 'error', title: t('จองไม่สำเร็จ', 'Booking Failed'), message: err.message });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div id="fluffy-rentcar-app" className="fluffy-saas-shell">
			<div className="fluffy-saas-container">
				<div className="fluffy-saas-header">
					<div>
						<h1 className="fluffy-saas-title">{t('จองบริการเช่ารถพร้อมคนขับ', 'Private Car Rental Booking')}</h1>
						<p className="fluffy-saas-subtitle">
							{t('ค้นหาเส้นทาง เลือกรถที่ต้องการ และกรอกข้อมูลการเดินทางได้ในหน้าเดียว', 'Search routes, select your vehicle package, and complete your reservation.')}
						</p>
					</div>
					<div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
						<span className="fluffy-saas-pill bg-[#EEF2FF] text-[#4169F7]">1. {t('การจอง', 'Booking')}</span>
						<span>→</span>
						<span className="fluffy-saas-pill bg-white border border-[#E2E8F0]">2. {t('ชำระเงิน', 'Payment')}</span>
						<span>→</span>
						<span className="fluffy-saas-pill bg-white border border-[#E2E8F0]">3. {t('ยืนยัน', 'Confirmed')}</span>
					</div>
				</div>

				<section className="fluffy-saas-card mb-6">
					<h2 className="mb-4 text-base font-semibold text-[#0F172A]">{t('1. ค้นหาเส้นทางและแพ็กเกจ', '1. Search Route & Packages')}</h2>
					<div className="grid gap-4 sm:grid-cols-3">
						<select id="fluffy-rc-origin" className="fluffy-saas-select" value={origin} onChange={(e) => setOrigin(e.target.value)}>
							<option value="">{t('เลือกต้นทาง', 'Select Origin')}</option>
							{locations.map((loc) => (
								<option key={loc.id} value={loc.title}>{loc.title}</option>
							))}
						</select>
						<select id="fluffy-rc-destination" className="fluffy-saas-select" value={destination} onChange={(e) => setDestination(e.target.value)}>
							<option value="">{t('เลือกปลายทาง', 'Select Destination')}</option>
							{locations.map((loc) => (
								<option key={loc.id} value={loc.title}>{loc.title}</option>
							))}
						</select>
						<button type="button" onClick={handleSearchPackages} className="fluffy-saas-btn fluffy-saas-btn-primary">
							{t('ค้นหาราคา', 'Search Packages')}
						</button>
					</div>

					{searching ? (
						<PackageGridSkeleton />
					) : packages.length > 0 && (
						<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{packages.map((pkg) => {
								const active = selectedPackage?.id === pkg.id;
								return (
									<button
										id={`fluffy-rc-pkg-${pkg.id}`}
										className={`fluffy-saas-space-btn ${active ? 'is-selected' : ''}`}
										type="button"
										key={pkg.id}
										onClick={() => {
											setSelectedPackage(pkg);
											setOutbound((prev) => ({
												...prev,
												depart_start_location: pkg.origin,
												depart_destination: pkg.destination,
											}));
											setReturnTrip((prev) => ({
												...prev,
												return_start_location: pkg.destination,
												return_destination: pkg.origin,
											}));
										}}
									>
										<div className="font-semibold text-[#0F172A]">{pkg.car_type || pkg.title}</div>
										<div className="mt-0.5 text-xs text-[#64748B]">{pkg.origin} → {pkg.destination}</div>
										<div className="mt-2 text-sm font-bold text-[#4169F7]">{Number(pkg.price).toLocaleString()} {t('บาท', 'THB')}</div>
									</button>
								);
							})}
						</div>
					)}
				</section>

				<form id="fluffy-rentcar-form" className="grid gap-6 lg:grid-cols-12" onSubmit={handleSubmit}>
					<div className="space-y-6 lg:col-span-8">
						<section className="fluffy-saas-card">
							<h2 className="mb-4 text-base font-semibold text-[#0F172A]">{t('2. ข้อมูลผู้จอง', '2. Personal Information')}</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label htmlFor="fluffy-rc-fullname" className="fluffy-saas-label">{t('ชื่อ - นามสกุล', 'Full Name')} *</label>
									<input id="fluffy-rc-fullname" className="fluffy-saas-input" type="text" value={personal.full_name} onChange={(e) => setPersonal((p) => ({ ...p, full_name: e.target.value }))} required />
								</div>
								<div>
									<label htmlFor="fluffy-rc-email" className="fluffy-saas-label">Email *</label>
									<input id="fluffy-rc-email" className="fluffy-saas-input" type="email" value={personal.email} onChange={(e) => setPersonal((p) => ({ ...p, email: e.target.value }))} required />
								</div>
								<div>
									<label htmlFor="fluffy-rc-phone" className="fluffy-saas-label">{t('เบอร์โทรศัพท์', 'Phone')} *</label>
									<input id="fluffy-rc-phone" className="fluffy-saas-input" type="tel" value={personal.phone_number} onChange={(e) => setPersonal((p) => ({ ...p, phone_number: e.target.value }))} required />
								</div>
								<div>
									<label htmlFor="fluffy-rc-line" className="fluffy-saas-label">LINE ID / WhatsApp *</label>
									<input id="fluffy-rc-line" className="fluffy-saas-input" type="text" value={personal.line_id_whatsapp} onChange={(e) => setPersonal((p) => ({ ...p, line_id_whatsapp: e.target.value }))} required />
								</div>
							</div>
						</section>

						<section className="fluffy-saas-card">
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<h2 className="text-base font-semibold text-[#0F172A]">{t('3. รายละเอียดการเดินทาง', '3. Travel Details')}</h2>
								<div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1">
									<button
										type="button"
										onClick={() => setTripType(0)}
										className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${tripType === 0 ? 'bg-[#4169F7] text-white' : 'text-[#64748B]'}`}
									>
										{t('เที่ยวเดียว', 'One Way')}
									</button>
									<button
										type="button"
										onClick={() => setTripType(1)}
										className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${tripType === 1 ? 'bg-[#4169F7] text-white' : 'text-[#64748B]'}`}
									>
										{t('ไป-กลับ', 'Round Trip')}
									</button>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label htmlFor="fluffy-rc-out-start-note" className="fluffy-saas-label">{t('รายละเอียดจุดรับขาไป', 'Pickup Details')} *</label>
									<input id="fluffy-rc-out-start-note" className="fluffy-saas-input" type="text" value={outbound.depart_start_location_note} onChange={(e) => setOutbound((p) => ({ ...p, depart_start_location_note: e.target.value }))} required />
								</div>
								<div>
									<label htmlFor="fluffy-rc-out-dest-note" className="fluffy-saas-label">{t('รายละเอียดจุดส่งขาไป', 'Drop-off Details')} *</label>
									<input id="fluffy-rc-out-dest-note" className="fluffy-saas-input" type="text" value={outbound.depart_destination_note} onChange={(e) => setOutbound((p) => ({ ...p, depart_destination_note: e.target.value }))} required />
								</div>
								<div>
									<label htmlFor="fluffy-rc-out-date" className="fluffy-saas-label">{t('วันที่เดินทาง', 'Departure Date')} *</label>
									<DatePickerField
										id="fluffy-rc-out-date"
										value={outbound.depart_date}
										onChange={(val) => setOutbound((p) => ({ ...p, depart_date: val }))}
										placeholder={t('เลือกวันที่เดินทาง', 'Select departure date')}
										minDate={new Date()}
										required
									/>
								</div>
								<div>
									<label htmlFor="fluffy-rc-out-time" className="fluffy-saas-label">{t('เวลาเดินทาง', 'Departure Time')} *</label>
									<TimePickerField id="fluffy-rc-out-time" value={outbound.depart_time} onChange={(val) => setOutbound((p) => ({ ...p, depart_time: val }))} required />
								</div>
							</div>

							{tripType === 1 && (
								<div className="mt-5 grid gap-4 border-t border-[#E2E8F0] pt-5 sm:grid-cols-2">
									<div>
										<label htmlFor="fluffy-rc-ret-start-note" className="fluffy-saas-label">{t('รายละเอียดจุดรับขากลับ', 'Return Pickup')} *</label>
										<input id="fluffy-rc-ret-start-note" className="fluffy-saas-input" type="text" value={returnTrip.return_start_location_note} onChange={(e) => setReturnTrip((p) => ({ ...p, return_start_location_note: e.target.value }))} required />
									</div>
									<div>
										<label htmlFor="fluffy-rc-ret-dest-note" className="fluffy-saas-label">{t('รายละเอียดจุดส่งขากลับ', 'Return Drop-off')} *</label>
										<input id="fluffy-rc-ret-dest-note" className="fluffy-saas-input" type="text" value={returnTrip.return_destination_note} onChange={(e) => setReturnTrip((p) => ({ ...p, return_destination_note: e.target.value }))} required />
									</div>
									<div>
										<label htmlFor="fluffy-rc-ret-date" className="fluffy-saas-label">{t('วันเดินทางกลับ', 'Return Date')} *</label>
										<DatePickerField
											id="fluffy-rc-ret-date"
											value={returnTrip.return_date}
											onChange={(val) => setReturnTrip((p) => ({ ...p, return_date: val }))}
											placeholder={t('เลือกวันเดินทางกลับ', 'Select return date')}
											minDate={outbound.depart_date ? new Date(`${outbound.depart_date}T00:00:00`) : new Date()}
											required
										/>
									</div>
									<div>
										<label htmlFor="fluffy-rc-ret-time" className="fluffy-saas-label">{t('เวลาเดินทางกลับ', 'Return Time')} *</label>
										<TimePickerField id="fluffy-rc-ret-time" value={returnTrip.return_time} onChange={(val) => setReturnTrip((p) => ({ ...p, return_time: val }))} required />
									</div>
								</div>
							)}

							<div className="mt-4 max-w-[160px]">
								<label htmlFor="fluffy-rc-adults" className="fluffy-saas-label">{t('จำนวนผู้โดยสาร', 'Passengers')}</label>
								<input id="fluffy-rc-adults" className="fluffy-saas-input" type="number" min={1} max={12} value={adultCount} onChange={(e) => setAdultCount(Number(e.target.value) || 1)} />
							</div>
						</section>
					</div>

					<aside className="lg:col-span-4">
						<div className="fluffy-saas-card sticky top-6">
							<h3 className="mb-4 text-base font-semibold text-[#0F172A]">{t('สรุปการเช่ารถ', 'Rental Summary')}</h3>
							<div className="space-y-2.5 text-sm text-[#64748B]">
								<div className="flex justify-between">
									<span>{t('แพ็กเกจ', 'Package')}</span>
									<span className="font-semibold text-[#0F172A]">{selectedPackage?.car_type || '-'}</span>
								</div>
								<div className="flex justify-between">
									<span>{t('ราคารวม', 'Subtotal')}</span>
									<span className="text-[#0F172A]">{basePrice.toLocaleString()} {t('บาท', 'THB')}</span>
								</div>
								{discount > 0 && (
									<div className="flex justify-between text-emerald-600">
										<span>{t('ส่วนลด', 'Discount')}</span>
										<span>-{discount.toLocaleString()} {t('บาท', 'THB')}</span>
									</div>
								)}
								<div className="flex justify-between border-t border-[#E2E8F0] pt-3 text-base font-bold text-[#0F172A]">
									<span>{t('ยอดสุทธิ', 'Total')}</span>
									<span className="text-[#4169F7]">{finalPrice.toLocaleString()} {t('บาท', 'THB')}</span>
								</div>
							</div>

							<div className="mt-5 flex gap-2">
								<input id="fluffy-rc-coupon" className="fluffy-saas-input" type="text" placeholder={t('รหัสคูปอง', 'Coupon code')} value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
								<button type="button" onClick={handleValidateCoupon} className="fluffy-saas-btn fluffy-saas-btn-secondary">
									{t('ใช้', 'Apply')}
								</button>
							</div>
							{couponMsg && <p className="mt-2 text-xs text-[#64748B]">{couponMsg}</p>}

							<button type="submit" disabled={submitting} className="fluffy-saas-btn fluffy-saas-btn-primary mt-6 w-full py-3">
								{submitting ? t('กำลังดำเนินการ...', 'Submitting...') : t('ดำเนินการชำระเงิน', 'Proceed to Payment')}
							</button>
						</div>
					</aside>
				</form>
			</div>

			<StatusModal modal={modal} onClose={() => setModal((prev) => ({ ...prev, open: false }))} />
		</div>
	);
}
