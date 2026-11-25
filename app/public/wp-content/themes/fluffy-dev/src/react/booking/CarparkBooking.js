import { useEffect, useMemo, useState } from '@wordpress/element';
import { getConfig, wpAjax, wpRest } from '../shared/api';
import { t } from '../shared/i18n';
import StatusModal from '../shared/StatusModal';
import { ParkingMapSkeleton } from '../shared/Skeleton';
import DatePickerField from '../shared/DatePickerField';
import TimePickerField from '../shared/TimePickerField';

function getSpaceColorClass(space, isOccupied, isSelected, viewMode) {
	if (!space) {
		return 'bg-slate-100 border border-dashed border-slate-200 text-slate-400 cursor-default';
	}
	if (isOccupied) {
		return 'bg-red-500 text-white border border-red-600 cursor-not-allowed opacity-90';
	}
	if (isSelected) {
		return 'bg-[#4169F7] text-white border border-[#3154D9] ring-2 ring-[#4169F7]/30 shadow-sm';
	}
	if (viewMode === 'distance') {
		const y = Number(space.position?.y || 0);
		if (y <= 2) {
			return 'bg-blue-500 hover:bg-blue-600 text-white border border-blue-600';
		}
		if (y <= 4) {
			return 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600';
		}
		return 'bg-orange-500 hover:bg-orange-600 text-white border border-orange-600';
	}
	if (viewMode === 'zone') {
		const prefix = String(space.title || '').charAt(0).toUpperCase();
		if (prefix === 'A' || prefix === 'B') {
			return 'bg-purple-500 hover:bg-purple-600 text-white border border-purple-600';
		}
		if (prefix === 'C' || prefix === 'D') {
			return 'bg-indigo-500 hover:bg-indigo-600 text-white border border-indigo-600';
		}
		return 'bg-teal-500 hover:bg-teal-600 text-white border border-teal-600';
	}
	return 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600';
}

const EMPTY_SENDING_ADDON = {
	flightDepart: '',
	flightDepartTime: '',
	flightArrival: '',
	flightArrivalTime: '',
	pickupTime: '',
	dropoffTime: '',
	pickupPoint: '',
	dropoffPoint: '',
	adultCount: 1,
	childCount: 0,
	baggageCount: 1,
	pickupNote: '',
};

const EMPTY_VALET_ADDON = {
	flightDepart: '',
	flightDepartTime: '',
	flightArrival: '',
	flightArrivalTime: '',
	pickupTime: '',
	dropoffTime: '',
	pickupPoint: '',
	dropoffPoint: '',
	pickupNote: '',
};

export default function CarparkBooking() {
	const config = getConfig();
	const user = config.user || {};

	// 1. Date, Time & Location
	const [startDate, setStartDate] = useState('');
	const [startTime, setStartTime] = useState('09:00');
	const [endDate, setEndDate] = useState('');
	const [endTime, setEndTime] = useState('18:00');
	const [location, setLocation] = useState('SuvarnabhumiAirport');

	// 2. Vehicle Type & Quantity Rows (original vehicle-rows-container behavior)
	const [vehicleTypes, setVehicleTypes] = useState([]);
	const [vehicleRows, setVehicleRows] = useState([{ type: '', quantity: 1, otherTypeCar: '' }]);

	// 3. Parking Spaces, Availability & 2D Map
	const [spaces, setSpaces] = useState([]);
	const [blackouts, setBlackouts] = useState([]);
	const [occupiedIds, setOccupiedIds] = useState([]);
	const [savedPlates, setSavedPlates] = useState([]);
	const [selectedSpaces, setSelectedSpaces] = useState([]);
	const [viewMode, setViewMode] = useState('status');
	const [hasChecked, setHasChecked] = useState(false);
	const [conditionError, setConditionError] = useState(null); // { type: '24h' | 'blackout' | 'invalid', message: string }

	// 4. Add-on Services (servicePickup & serviceValet matching customize.php:1481)
	const [servicePickup, setServicePickup] = useState(false);
	const [serviceValet, setServiceValet] = useState(false);
	const [sendingAddon, setSendingAddon] = useState(EMPTY_SENDING_ADDON);
	const [valetAddon, setValetAddon] = useState(EMPTY_VALET_ADDON);

	// 5. Pricing & Coupon
	const [pricing, setPricing] = useState({ price_per_car: 0, total_price: 0 });
	const [couponCode, setCouponCode] = useState('');
	const [discount, setDiscount] = useState(0);
	const [couponStatus, setCouponStatus] = useState('');

	// 6. Customer Profile
	const [profile, setProfile] = useState({
		fullname: user.displayName || '',
		email: user.email || '',
		phone: user.phone || '',
		lineid: user.lineId || '',
	});

	const [checking, setChecking] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [modal, setModal] = useState({ open: false, type: 'success', title: '', message: '' });

	// Load master data
	useEffect(() => {
		wpRest(`${config.customRestUrl}vehicle_type?lang=${config.lang}`)
			.then((res) => {
				const list = Array.isArray(res) ? res : res.data || [];
				setVehicleTypes(list);
				if (list.length > 0) {
					setVehicleRows((prev) =>
						prev.map((row, idx) => (idx === 0 && !row.type ? { ...row, type: String(list[0].id) } : row))
					);
				}
			})
			.catch(() => setVehicleTypes([]));

		wpRest(`${config.customRestUrl}parking_space`)
			.then((res) => setSpaces(Array.isArray(res) ? res : res.data || []))
			.catch(() => setSpaces([]));

		wpRest(`${config.customRestUrl}parking_booking_blackouts`)
			.then((res) => setBlackouts(Array.isArray(res) ? res : []))
			.catch(() => setBlackouts([]));

		if (user.id) {
			wpRest(`${config.customRestUrl}tabien_rod?user_id=${user.id}&per_page=50`)
				.then((res) => setSavedPlates(res?.items || []))
				.catch(() => setSavedPlates([]));
		}
	}, []);

	// Total requested vehicle count = max selectable spaces (original behavior)
	const totalVehicles = useMemo(
		() => vehicleRows.reduce((sum, r) => sum + Math.max(0, Number(r.quantity) || 0), 0),
		[vehicleRows]
	);

	// Flat list of vehicle type assignments matching totalVehicles
	const vehicleAssignmentsList = useMemo(() => {
		const list = [];
		vehicleRows.forEach((row) => {
			const qty = Math.max(0, Number(row.quantity) || 0);
			for (let i = 0; i < qty; i++) {
				list.push({ type: row.type, otherTypeCar: row.otherTypeCar || '' });
			}
		});
		return list;
	}, [vehicleRows]);

	// Keep selectedSpaces synced with vehicleAssignmentsList & cap by totalVehicles
	useEffect(() => {
		setSelectedSpaces((prev) => {
			const trimmed = prev.slice(0, totalVehicles);
			return trimmed.map((space, idx) => ({
				...space,
				assignedVehicleType: vehicleAssignmentsList[idx]?.type || space.assignedVehicleType || vehicleTypes[0]?.id || '',
				otherTypeCar: vehicleAssignmentsList[idx]?.otherTypeCar || space.otherTypeCar || '',
			}));
		});
	}, [totalVehicles, vehicleAssignmentsList]);

	const filteredSpaces = useMemo(() => {
		const normalize = (val) => String(val || '').toLowerCase().replace(/[^a-z0-9]/g, '');
		const target = normalize(location).replace('airport', '');
		return spaces.filter((s) => {
			if (!target) {
				return true;
			}
			const locNorm = normalize(s?.location?.slug || s?.location?.name || '');
			if (!locNorm) {
				return true;
			}
			return locNorm.includes(target);
		});
	}, [spaces, location]);

	// Build 2D coordinate grid matching original space-parking.js (position.x, position.y + walkways)
	const gridLayout = useMemo(() => {
		const coords = filteredSpaces.filter(
			(s) => s.position && s.position.x !== null && s.position.x !== '' && s.position.y !== null && s.position.y !== ''
		);
		if (coords.length === 0) {
			return { hasCoords: false, cols: 0, matrix: [] };
		}
		const maxX = Math.max(...coords.map((s) => Number(s.position.x)));
		const maxY = Math.max(...coords.map((s) => Number(s.position.y)));
		const minX = Math.min(...coords.map((s) => Number(s.position.x)));
		const minY = Math.min(...coords.map((s) => Number(s.position.y)));

		const rows = [];
		for (let y = minY; y <= maxY; y++) {
			const row = [];
			for (let x = minX; x <= maxX; x++) {
				const found = coords.find((s) => Number(s.position.x) === x && Number(s.position.y) === y) || null;
				row.push({ x, y, space: found });
			}
			rows.push(row);
		}
		return { hasCoords: true, cols: maxX - minX + 1, matrix: rows };
	}, [filteredSpaces]);

	const stats = useMemo(() => {
		const total = filteredSpaces.length;
		const occupied = filteredSpaces.filter((s) => occupiedIds.includes(Number(s.id))).length;
		const available = Math.max(0, total - occupied);
		const rate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0.0';
		return { total, available, occupied, rate };
	}, [filteredSpaces, occupiedIds]);

	const legendItems = useMemo(() => {
		if (viewMode === 'distance') {
			return [
				{ color: 'bg-blue-500', text: t('ใกล้ทางเข้า', 'Near entrance') },
				{ color: 'bg-amber-500', text: t('ระยะปานกลาง', 'Medium distance') },
				{ color: 'bg-orange-500', text: t('ไกลจากทางเข้า', 'Far from entrance') },
				{ color: 'bg-[#4169F7]', text: t('ช่องจอดที่เลือก', 'Selected') },
				{ color: 'bg-red-500', text: t('ใช้งานแล้ว', 'Occupied') },
				{ color: 'bg-slate-100 border border-dashed border-slate-300', text: t('ทางเดิน', 'Walkway') },
			];
		}
		if (viewMode === 'zone') {
			return [
				{ color: 'bg-purple-500', text: t('โซน A-B', 'Zone A-B') },
				{ color: 'bg-indigo-500', text: t('โซน C-D', 'Zone C-D') },
				{ color: 'bg-teal-500', text: t('โซนอื่นๆ', 'Other Zones') },
				{ color: 'bg-[#4169F7]', text: t('ช่องจอดที่เลือก', 'Selected') },
				{ color: 'bg-red-500', text: t('ใช้งานแล้ว', 'Occupied') },
				{ color: 'bg-slate-100 border border-dashed border-slate-300', text: t('ทางเดิน', 'Walkway') },
			];
		}
		return [
			{ color: 'bg-emerald-500', text: t('ช่องจอดว่าง', 'Available') },
			{ color: 'bg-red-500', text: t('ใช้งานแล้ว', 'Occupied') },
			{ color: 'bg-[#4169F7]', text: t('ช่องจอดที่เลือก', 'Selected') },
			{ color: 'bg-slate-100 border border-dashed border-slate-300', text: t('ทางเดิน', 'Walkway') },
		];
	}, [viewMode]);

	// Validate all original booking conditions: 24h advance, end > start, and blackout ranges
	const validateScheduleConditions = () => {
		if (!startDate || !endDate || !startTime || !endTime) {
			return {
				type: 'invalid',
				message: t('กรุณาเลือกวันที่และเวลาให้ครบถ้วนก่อนค้นหา', 'Please select start/end date and time before searching.'),
			};
		}

		const startDT = new Date(`${startDate}T${startTime}`);
		const endDT = new Date(`${endDate}T${endTime}`);
		const now = new Date();

		if (Number.isNaN(startDT.getTime()) || Number.isNaN(endDT.getTime())) {
			return { type: 'invalid', message: t('รูปแบบวันที่หรือเวลาไม่ถูกต้อง', 'Invalid date or time format.') };
		}

		if (endDT <= startDT) {
			return { type: 'invalid', message: t('วันและเวลาสิ้นสุดต้องมากกว่าวันและเวลาเริ่มต้น', 'End date/time must be after start date/time.') };
		}

		const diffHours = (startDT.getTime() - now.getTime()) / (1000 * 60 * 60);
		if (diffHours < 24) {
			return {
				type: '24h',
				message: t(
					'สำหรับการจองล่วงหน้าน้อยกว่า 24 ชม. กรุณาติดต่อผ่าน Line OA',
					'For bookings less than 24 hours in advance, please contact us via Line OA.'
				),
			};
		}

		for (const range of blackouts) {
			if (!range?.start_date || !range?.end_date) {
				continue;
			}
			const blockedStart = new Date(`${range.start_date}T00:00:00`);
			const blockedEnd = new Date(`${range.end_date}T23:59:59`);
			if (startDT <= blockedEnd && endDT >= blockedStart) {
				return {
					type: 'blackout',
					message: range.message || t('ช่วงวันที่เลือกไม่สามารถจองได้', 'Selected dates are unavailable for booking.'),
				};
			}
		}

		return null;
	};

	const handleCheckAvailability = async () => {
		const errObj = validateScheduleConditions();
		if (errObj) {
			setConditionError(errObj);
			setHasChecked(false);
			setSelectedSpaces([]);
			return;
		}
		setConditionError(null);
		setChecking(true);
		try {
			const occupied = await wpAjax('check_parking_availability', {
				startDateTime: `${startDate} ${startTime}`,
				endDateTime: `${endDate} ${endTime}`,
				locationChoose: location,
			});
			setOccupiedIds((occupied || []).map((item) => Number(item.id)));
			setSelectedSpaces([]);
			setHasChecked(true);
		} catch (err) {
			setConditionError({ type: 'blackout', message: err.message });
			setHasChecked(false);
		} finally {
			setChecking(false);
		}
	};

	// Auto-check availability when schedule or location changes
	useEffect(() => {
		if (startDate && endDate && location) {
			handleCheckAvailability();
		} else {
			setHasChecked(false);
		}
	}, [startDate, endDate, startTime, endTime, location, blackouts]);

	const toggleSpace = (space) => {
		if (!space || occupiedIds.includes(Number(space.id))) {
			return;
		}
		setSelectedSpaces((prev) => {
			const exists = prev.find((item) => Number(item.parking_post_id) === Number(space.id));
			if (exists) {
				return prev.filter((item) => Number(item.parking_post_id) !== Number(space.id));
			}
			if (prev.length >= totalVehicles) {
				setModal({
					open: true,
					type: 'error',
					title: t('เลือกครบจำนวนรถแล้ว', 'Selection Limit Reached'),
					message: t(
						`คุณระบุจำนวนรถไว้ ${totalVehicles} คัน หากต้องการเลือกช่องเพิ่ม กรุณาเพิ่มจำนวนรถก่อน`,
						`You selected ${totalVehicles} vehicle(s). Increase vehicle quantity to select more spaces.`
					),
				});
				return prev;
			}
			const nextIdx = prev.length;
			const assigned = vehicleAssignmentsList[nextIdx] || {};
			return [
				...prev,
				{
					id: space.id,
					parking_post_id: space.id,
					parking_id: space.parking_id || space.title || '',
					title: space.title || space.parking_id || `Space #${space.id}`,
					assignedVehicleType: assigned.type || vehicleTypes[0]?.id || '',
					otherTypeCar: assigned.otherTypeCar || '',
					licensePlate: savedPlates[nextIdx]?.tabienrod_number || '',
				},
			];
		});
	};

	const updateVehicleRow = (index, key, value) => {
		setVehicleRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
	};

	const addVehicleRow = () => {
		setVehicleRows((prev) => [...prev, { type: String(vehicleTypes[0]?.id || ''), quantity: 1, otherTypeCar: '' }]);
	};

	const removeVehicleRow = (index) => {
		if (vehicleRows.length <= 1) {
			return;
		}
		setVehicleRows((prev) => prev.filter((_, i) => i !== index));
	};

	const updateSpaceField = (spaceId, key, value) => {
		setSelectedSpaces((prev) =>
			prev.map((item) => (Number(item.parking_post_id) === Number(spaceId) ? { ...item, [key]: value } : item))
		);
	};

	// Auto-calculate price from vehicleRows + dates (original calculate_parking_price flow)
	useEffect(() => {
		if (!startDate || !endDate || totalVehicles === 0) {
			setPricing({ price_per_car: 0, total_price: 0 });
			return;
		}
		const quantities = {};
		vehicleRows.forEach((row) => {
			if (row.type && Number(row.quantity) > 0) {
				quantities[row.type] = (quantities[row.type] || 0) + Number(row.quantity);
			}
		});

		wpAjax('calculate_parking_price', {
			nonce: config.nonces.parkingPrice,
			startDate,
			endDate,
			startTime,
			endTime,
			vehicleQuantities: JSON.stringify(quantities),
		})
			.then((res) => {
				setPricing({
					price_per_car: Number(res?.price_per_car || 0),
					total_price: Number(res?.total_price || 0),
				});
			})
			.catch(() => {});
	}, [startDate, endDate, startTime, endTime, vehicleRows, totalVehicles]);

	const handleValidateCoupon = async () => {
		if (!couponCode.trim()) {
			return;
		}
		setCouponStatus('');
		try {
			const res = await wpAjax('validate_coupon', {
				coupon_code: couponCode.trim(),
				total_price: pricing.total_price,
			});
			setDiscount(Number(res?.discount_amount || 0));
			setCouponStatus(t(`ใช้คูปองสำเร็จ ลด ${res.discount_amount} บาท`, `Coupon applied: -${res.discount_amount} THB`));
		} catch (err) {
			setDiscount(0);
			setCouponStatus(err.message);
		}
	};

	const finalTotal = Math.max(0, pricing.total_price - discount);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const errObj = validateScheduleConditions();
		if (errObj) {
			setConditionError(errObj);
			setModal({ open: true, type: 'error', title: t('ไม่ตรงเงื่อนไขการจอง', 'Booking Condition'), message: errObj.message });
			return;
		}
		if (!hasChecked) {
			setModal({
				open: true,
				type: 'error',
				title: t('กรุณาตรวจสอบช่องว่าง', 'Check Availability First'),
				message: t('กรุณาเลือกวันเวลาและกดตรวจสอบช่องว่างก่อน', 'Please check parking availability first.'),
			});
			return;
		}
		if (selectedSpaces.length !== totalVehicles) {
			setModal({
				open: true,
				type: 'error',
				title: t('กรุณาเลือกช่องจอดให้ครบ', 'Select All Spaces'),
				message: t(
					`กรุณาเลือกช่องจอดให้ครบ ${totalVehicles} ช่อง (เลือกแล้ว ${selectedSpaces.length} ช่อง)`,
					`Please select ${totalVehicles} parking space(s) (${selectedSpaces.length} selected).`
				),
			});
			return;
		}

		setSubmitting(true);
		try {
			const bookingData = {
				startDate,
				endDate,
				startTime,
				endTime,
				location,
				pricePerCar: pricing.price_per_car,
				totalPrice: finalTotal,
				couponCode: discount > 0 ? couponCode.trim() : '',
				discountAmount: discount,
				profile,
				customer_user: user.id || 0,
				vehicleTypeQuantities: vehicleRows.map((r) => ({
					type: r.type === '1236' && r.otherTypeCar ? r.otherTypeCar : r.type,
					quantity: Number(r.quantity) || 1,
				})),
				selectedParkingSpaces: selectedSpaces,
				addon:
					servicePickup || serviceValet
						? {
								servicePickup,
								serviceValet,
								sending: sendingAddon,
								parking: valetAddon,
						  }
						: null,
			};

			const res = await wpAjax('insert_parking_booking', {
				bookingData: JSON.stringify(bookingData),
			});

			window.location.href = res?.checkout_url || res?.redirect_url || config.checkoutUrl;
		} catch (err) {
			setModal({ open: true, type: 'error', title: t('จองไม่สำเร็จ', 'Booking Failed'), message: err.message });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div id="fluffy-carpark-app" className="fluffy-carpark fluffy-saas-shell">
			<div id="fluffy-carpark-container" className="fluffy-carpark__container fluffy-saas-container">
				<div id="fluffy-carpark-header" className="fluffy-carpark__header fluffy-saas-header">
					<div>
						<h1 className="fluffy-carpark__title fluffy-saas-title">{t('จองที่จอดรถสนามบิน', 'Airport Parking Reservation')}</h1>
						<p className="fluffy-carpark__subtitle fluffy-saas-subtitle">
							{t('เลือกวันเวลา ประเภทรถ ผังช่องจอด และบริการเสริมครบในหน้าเดียว', 'Select schedule, vehicle types, parking map slots, and add-on services.')}
						</p>
					</div>
					<ol id="fluffy-carpark-steps" className="fluffy-carpark__steps m-0 flex list-none items-center gap-4 p-0 text-xs font-medium text-[#64748B]">
						<li className="fluffy-carpark__step fluffy-carpark__step--active font-semibold text-[#4169F7]">1. {t('การจอง', 'Booking')}</li>
						<li className="fluffy-carpark__step">2. {t('ชำระเงิน', 'Payment')}</li>
						<li className="fluffy-carpark__step">3. {t('ยืนยันการจอง', 'Confirmed')}</li>
					</ol>
				</div>

				<form id="fluffy-carpark-form" className="fluffy-carpark__form grid gap-6 lg:grid-cols-12" onSubmit={handleSubmit}>
					<div id="fluffy-carpark-main" className="fluffy-carpark__main space-y-6 lg:col-span-8">
						{/* Section 1: Date, Time & Location */}
						<section id="fluffy-carpark-schedule" className="fluffy-carpark__section fluffy-saas-card">
							<h2 className="mb-4 text-base font-semibold text-[#0F172A]">{t('1. วันเวลาและสถานที่', '1. Schedule & Location')}</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label htmlFor="fluffy-start-date" className="fluffy-saas-label">{t('วันเริ่มต้น', 'Start Date')} *</label>
									<DatePickerField
										id="fluffy-start-date"
										value={startDate}
										onChange={setStartDate}
										placeholder={t('เลือกวันเริ่มต้น', 'Select start date')}
										minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
										disabledRanges={blackouts}
										required
									/>
								</div>
								<div>
									<label htmlFor="fluffy-start-time" className="fluffy-saas-label">{t('เวลาเริ่มต้น', 'Start Time')} *</label>
									<TimePickerField id="fluffy-start-time" value={startTime} onChange={setStartTime} required />
								</div>
								<div>
									<label htmlFor="fluffy-end-date" className="fluffy-saas-label">{t('วันสิ้นสุด', 'End Date')} *</label>
									<DatePickerField
										id="fluffy-end-date"
										value={endDate}
										onChange={setEndDate}
										placeholder={t('เลือกวันสิ้นสุด', 'Select end date')}
										minDate={startDate ? new Date(`${startDate}T00:00:00`) : new Date(Date.now() + 24 * 60 * 60 * 1000)}
										disabledRanges={blackouts}
										required
									/>
								</div>
								<div>
									<label htmlFor="fluffy-end-time" className="fluffy-saas-label">{t('เวลาสิ้นสุด', 'End Time')} *</label>
									<TimePickerField id="fluffy-end-time" value={endTime} onChange={setEndTime} required />
								</div>
							</div>

							<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
								<div className="flex-1">
									<label htmlFor="fluffy-location" className="fluffy-saas-label">{t('สถานที่', 'Airport Location')} *</label>
									<select id="fluffy-location" className="fluffy-saas-select" value={location} onChange={(e) => setLocation(e.target.value)}>
										<option value="SuvarnabhumiAirport">{t('สนามบินสุวรรณภูมิ', 'Suvarnabhumi Airport')}</option>
										<option value="DonMueangAirport">{t('สนามบินดอนเมือง', 'Don Mueang Airport')}</option>
									</select>
								</div>
								<button type="button" onClick={handleCheckAvailability} disabled={checking} className="fluffy-saas-btn fluffy-saas-btn-primary">
									{checking ? t('กำลังตรวจสอบ...', 'Checking...') : t('ตรวจสอบช่องว่าง', 'Check Availability')}
								</button>
							</div>

							{conditionError && (
								<div id="fluffy-condition-error" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
									<p className="font-medium">{conditionError.message}</p>
									{conditionError.type === '24h' && (
										<a
											href={config.lineOaLink || 'https://lin.ee/Bm45y3b'}
											target="_blank"
											rel="noreferrer"
											className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#06C755] px-3.5 py-2 text-xs font-semibold text-white no-underline transition hover:opacity-90"
										>
											{t('ติดต่อผ่าน LINE OA', 'Contact via LINE OA')}
										</a>
									)}
								</div>
							)}
						</section>

						{/* Section 2: Vehicle Types & Quantities (original vehicle-rows-container) */}
						<section id="fluffy-carpark-vehicles" className="fluffy-carpark__section fluffy-saas-card">
							<div className="mb-4 flex items-center justify-between">
								<div>
									<h2 className="text-base font-semibold text-[#0F172A]">{t('2. ประเภทรถและจำนวนคัน', '2. Vehicle Types & Quantity')}</h2>
									<p className="text-xs text-[#64748B]">{t(`รวมทั้งหมด ${totalVehicles} คัน`, `Total: ${totalVehicles} vehicle(s)`)}</p>
								</div>
								<button type="button" onClick={addVehicleRow} className="fluffy-saas-btn fluffy-saas-btn-secondary !px-3 !py-1.5 text-xs">
									+ {t('เพิ่มประเภทรถ', 'Add Vehicle Type')}
								</button>
							</div>
							<div className="space-y-3">
								{vehicleRows.map((row, idx) => (
									<div key={idx} className="grid gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 sm:grid-cols-12">
										<div className="sm:col-span-6">
											<select
												className="fluffy-saas-select"
												value={row.type}
												onChange={(e) => updateVehicleRow(idx, 'type', e.target.value)}
											>
												{vehicleTypes.map((vt) => (
													<option key={vt.id} value={vt.id}>{vt.title}</option>
												))}
											</select>
										</div>
										<div className="flex items-center gap-2 sm:col-span-4">
											<button
												type="button"
												onClick={() => updateVehicleRow(idx, 'quantity', Math.max(1, (Number(row.quantity) || 1) - 1))}
												className="fluffy-saas-btn fluffy-saas-btn-secondary !px-3 !py-1.5"
											>
												-
											</button>
											<input
												type="number"
												min={1}
												max={20}
												className="fluffy-saas-input text-center"
												value={row.quantity}
												onChange={(e) => updateVehicleRow(idx, 'quantity', Math.max(1, Number(e.target.value) || 1))}
											/>
											<button
												type="button"
												onClick={() => updateVehicleRow(idx, 'quantity', (Number(row.quantity) || 1) + 1)}
												className="fluffy-saas-btn fluffy-saas-btn-secondary !px-3 !py-1.5"
											>
												+
											</button>
										</div>
										<div className="flex items-center justify-end sm:col-span-2">
											{vehicleRows.length > 1 && (
												<button
													type="button"
													onClick={() => removeVehicleRow(idx)}
													className="text-xs font-medium text-red-600 hover:underline"
												>
													{t('ลบ', 'Remove')}
												</button>
											)}
										</div>
										{String(row.type) === '1236' && (
											<div className="sm:col-span-12">
												<input
													type="text"
													className="fluffy-saas-input"
													placeholder={t('ระบุประเภทรถอื่นๆ', 'Specify other vehicle type')}
													value={row.otherTypeCar}
													onChange={(e) => updateVehicleRow(idx, 'otherTypeCar', e.target.value)}
												/>
											</div>
										)}
									</div>
								))}
							</div>
						</section>

						{/* Section 3: Original 2D Parking Grid Map */}
						<section id="fluffy-parking-map-card" className="fluffy-saas-card">
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<div>
									<h2 className="text-base font-semibold text-[#0F172A]">{t('3. ผังเลือกช่องจอดรถ', '3. Parking Space Map')}</h2>
									<p className="text-xs text-[#64748B]">
										{t(`เลือกแล้ว ${selectedSpaces.length} / ${totalVehicles} ช่อง`, `Selected ${selectedSpaces.length} / ${totalVehicles} space(s)`)}
									</p>
								</div>
								<div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1 text-xs">
									{[
										{ key: 'status', label: t('สถานะ', 'Status') },
										{ key: 'distance', label: t('ระยะห่าง', 'Distance') },
										{ key: 'zone', label: t('โซน', 'Zone') },
									].map((mode) => (
										<button
											type="button"
											key={mode.key}
											onClick={() => setViewMode(mode.key)}
											className={`rounded-md px-3 py-1.5 font-semibold transition ${
												viewMode === mode.key ? 'bg-[#4169F7] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
											}`}
										>
											{mode.label}
										</button>
									))}
								</div>
							</div>

							<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
								<div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
									<div className="text-xs text-[#64748B]">{t('ช่องจอดทั้งหมด', 'Total Spaces')}</div>
									<div className="mt-0.5 text-lg font-bold text-[#0F172A]">{stats.total}</div>
								</div>
								<div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
									<div className="text-xs text-emerald-700">{t('ช่องจอดว่าง', 'Available')}</div>
									<div className="mt-0.5 text-lg font-bold text-emerald-700">{stats.available}</div>
								</div>
								<div className="rounded-lg border border-red-200 bg-red-50/60 p-3">
									<div className="text-xs text-red-700">{t('ใช้งานแล้ว', 'Occupied')}</div>
									<div className="mt-0.5 text-lg font-bold text-red-700">{stats.occupied}</div>
								</div>
								<div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
									<div className="text-xs text-[#64748B]">{t('อัตราการใช้งาน', 'Occupancy')}</div>
									<div className="mt-0.5 text-lg font-bold text-[#0F172A]">{stats.rate}%</div>
								</div>
							</div>

							<div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5">
								{legendItems.map((item) => (
									<div key={item.text} className="flex items-center gap-2 text-xs text-[#0F172A]">
										<span className={`inline-block h-3.5 w-3.5 rounded ${item.color}`} />
										<span>{item.text}</span>
									</div>
								))}
							</div>

							{checking ? (
								<ParkingMapSkeleton />
							) : !hasChecked ? (
								<div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B]">
									{conditionError
										? conditionError.message
										: t('กรุณาเลือกวันเริ่มต้น วันสิ้นสุด (ล่วงหน้าอย่างน้อย 24 ชม.) เพื่อแสดงผังช่องจอดว่าง', 'Select start and end dates (at least 24 hours in advance) to view available parking slots.')}
								</div>
							) : filteredSpaces.length === 0 ? (
								<p className="py-6 text-center text-sm text-[#64748B]">{t('ไม่พบข้อมูลช่องจอด', 'No parking spaces found.')}</p>
							) : gridLayout.hasCoords ? (
								<div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white p-4">
									<div
										id="parking-grid-container"
										className="grid gap-1.5"
										style={{ gridTemplateColumns: `repeat(${gridLayout.cols}, minmax(44px, 1fr))` }}
									>
										{gridLayout.matrix.flat().map((cell) => {
											const space = cell.space;
											const isOccupied = space ? occupiedIds.includes(Number(space.id)) : false;
											const isSelected = space
												? selectedSpaces.some((s) => Number(s.parking_post_id) === Number(space.id))
												: false;
											const cellClass = getSpaceColorClass(space, isOccupied, isSelected, viewMode);

											if (!space) {
												return (
													<div
														key={`walkway-${cell.x}-${cell.y}`}
														title={t('ทางเดิน', 'Walkway')}
														className={`flex h-10 items-center justify-center rounded-md text-[10px] ${cellClass}`}
													/>
												);
											}

											return (
												<button
													id={`fluffy-space-${space.id}`}
													className={`flex h-10 items-center justify-center rounded-md text-xs font-semibold transition ${cellClass}`}
													type="button"
													key={space.id}
													disabled={isOccupied}
													title={`${space.title || space.parking_id} - ${isOccupied ? t('ไม่ว่าง', 'Occupied') : t('ว่าง', 'Available')}`}
													onClick={() => toggleSpace(space)}
												>
													{String(space.title || space.parking_id).toUpperCase()}
												</button>
											);
										})}
									</div>
								</div>
							) : (
								<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
									{filteredSpaces.map((space) => {
										const isOccupied = occupiedIds.includes(Number(space.id));
										const isSelected = selectedSpaces.some((s) => Number(s.parking_post_id) === Number(space.id));
										const cellClass = getSpaceColorClass(space, isOccupied, isSelected, viewMode);
										return (
											<button
												id={`fluffy-space-${space.id}`}
												className={`flex h-11 items-center justify-center rounded-lg text-xs font-semibold transition ${cellClass}`}
												type="button"
												key={space.id}
												disabled={isOccupied}
												onClick={() => toggleSpace(space)}
											>
												{String(space.title || space.parking_id).toUpperCase()}
											</button>
										);
									})}
								</div>
							)}

							{selectedSpaces.length > 0 && (
								<div className="mt-5 space-y-3 border-t border-[#E2E8F0] pt-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
										{t('ทะเบียนรถสำหรับแต่ละช่องจอด', 'License Plate per Selected Space')}
									</p>
									{selectedSpaces.map((item) => (
										<div key={item.parking_post_id} className="grid gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 sm:grid-cols-12">
											<div className="flex items-center text-sm font-semibold text-[#0F172A] sm:col-span-3">
												{t('ช่อง', 'Slot')} {item.title}
											</div>
											<div className="sm:col-span-5">
												<input
													className="fluffy-saas-input"
													type="text"
													placeholder={t('กรอกทะเบียนรถ เช่น กข 1234', 'License plate')}
													value={item.licensePlate}
													onChange={(e) => updateSpaceField(item.parking_post_id, 'licensePlate', e.target.value)}
												/>
											</div>
											<div className="sm:col-span-4">
												{savedPlates.length > 0 && (
													<select
														className="fluffy-saas-select"
														value=""
														onChange={(e) => {
															if (e.target.value) {
																updateSpaceField(item.parking_post_id, 'licensePlate', e.target.value);
															}
														}}
													>
														<option value="">{t('เลือกจากทะเบียนที่บันทึก', 'Pick saved plate')}</option>
														{savedPlates.map((p) => (
															<option key={p.id} value={p.tabienrod_number}>{p.tabienrod_number}</option>
														))}
													</select>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						{/* Section 4: Original Add-on Services (Pickup & Valet) */}
						<section id="fluffy-carpark-addons" className="fluffy-carpark__section fluffy-saas-card space-y-4">
							<h2 className="text-base font-semibold text-[#0F172A]">{t('4. บริการเสริม (ไม่บังคับ)', '4. Add-on Services (Optional)')}</h2>

							<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
								<input
									type="checkbox"
									checked={servicePickup}
									onChange={(e) => setServicePickup(e.target.checked)}
									className="h-4 w-4 rounded border-gray-300"
								/>
								<div>
									<div className="text-sm font-semibold text-[#0F172A]">{t('บริการรถรับ-ส่งสนามบิน', 'Airport Shuttle Pickup / Drop-off')}</div>
									<div className="text-xs text-[#64748B]">{t('ระบุเที่ยวบินและจุดรับ-ส่งที่สนามบิน', 'Provide flight and terminal pickup details')}</div>
								</div>
							</label>

							{servicePickup && (
								<div className="grid gap-3 rounded-lg border border-[#E2E8F0] p-4 sm:grid-cols-2">
									<input className="fluffy-saas-input" type="text" placeholder={t('เที่ยวบินขาไป', 'Departure Flight')} value={sendingAddon.flightDepart} onChange={(e) => setSendingAddon((p) => ({ ...p, flightDepart: e.target.value }))} />
									<TimePickerField id="fluffy-sending-depart-time" value={sendingAddon.flightDepartTime} onChange={(val) => setSendingAddon((p) => ({ ...p, flightDepartTime: val }))} placeholder={t('เวลาเที่ยวบินขาไป', 'Departure time')} />
									<input className="fluffy-saas-input" type="text" placeholder={t('เที่ยวบินขากลับ', 'Arrival Flight')} value={sendingAddon.flightArrival} onChange={(e) => setSendingAddon((p) => ({ ...p, flightArrival: e.target.value }))} />
									<TimePickerField id="fluffy-sending-arrival-time" value={sendingAddon.flightArrivalTime} onChange={(val) => setSendingAddon((p) => ({ ...p, flightArrivalTime: val }))} placeholder={t('เวลาเที่ยวบินขากลับ', 'Arrival time')} />
									<input className="fluffy-saas-input" type="text" placeholder={t('จุดรับ', 'Pickup Point')} value={sendingAddon.pickupPoint} onChange={(e) => setSendingAddon((p) => ({ ...p, pickupPoint: e.target.value }))} />
									<input className="fluffy-saas-input" type="text" placeholder={t('จุดส่ง', 'Drop-off Point')} value={sendingAddon.dropoffPoint} onChange={(e) => setSendingAddon((p) => ({ ...p, dropoffPoint: e.target.value }))} />
									<input className="fluffy-saas-input" type="number" min={1} placeholder={t('ผู้ใหญ่', 'Adults')} value={sendingAddon.adultCount} onChange={(e) => setSendingAddon((p) => ({ ...p, adultCount: Number(e.target.value) || 1 }))} />
									<input className="fluffy-saas-input" type="number" min={0} placeholder={t('สัมภาระ (ใบ)', 'Baggage')} value={sendingAddon.baggageCount} onChange={(e) => setSendingAddon((p) => ({ ...p, baggageCount: Number(e.target.value) || 0 }))} />
									<input className="fluffy-saas-input sm:col-span-2" type="text" placeholder={t('หมายเหตุเพิ่มเติม', 'Pickup Note')} value={sendingAddon.pickupNote} onChange={(e) => setSendingAddon((p) => ({ ...p, pickupNote: e.target.value }))} />
								</div>
							)}

							<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
								<input
									type="checkbox"
									checked={serviceValet}
									onChange={(e) => setServiceValet(e.target.checked)}
									className="h-4 w-4 rounded border-gray-300"
								/>
								<div>
									<div className="text-sm font-semibold text-[#0F172A]">{t('บริการรับ-ส่งรถ (Valet Parking)', 'Valet Parking Service')}</div>
									<div className="text-xs text-[#64748B]">{t('พนักงานรับรถและนำรถมาส่งให้ที่อาคารผู้โดยสาร', 'Staff picks up and returns your vehicle at the terminal')}</div>
								</div>
							</label>

							{serviceValet && (
								<div className="grid gap-3 rounded-lg border border-[#E2E8F0] p-4 sm:grid-cols-2">
									<input className="fluffy-saas-input" type="text" placeholder={t('เที่ยวบินขาไป', 'Departure Flight')} value={valetAddon.flightDepart} onChange={(e) => setValetAddon((p) => ({ ...p, flightDepart: e.target.value }))} />
									<TimePickerField id="fluffy-valet-depart-time" value={valetAddon.flightDepartTime} onChange={(val) => setValetAddon((p) => ({ ...p, flightDepartTime: val }))} placeholder={t('เวลาเที่ยวบินขาไป', 'Departure time')} />
									<input className="fluffy-saas-input" type="text" placeholder={t('จุดรับรถ', 'Car Pickup Point')} value={valetAddon.pickupPoint} onChange={(e) => setValetAddon((p) => ({ ...p, pickupPoint: e.target.value }))} />
									<input className="fluffy-saas-input" type="text" placeholder={t('จุดส่งคืนรถ', 'Car Return Point')} value={valetAddon.dropoffPoint} onChange={(e) => setValetAddon((p) => ({ ...p, dropoffPoint: e.target.value }))} />
									<input className="fluffy-saas-input sm:col-span-2" type="text" placeholder={t('หมายเหตุเพิ่มเติม', 'Valet Note')} value={valetAddon.pickupNote} onChange={(e) => setValetAddon((p) => ({ ...p, pickupNote: e.target.value }))} />
								</div>
							)}
						</section>

						{/* Section 5: Customer Information */}
						<section id="fluffy-carpark-customer" className="fluffy-carpark__section fluffy-saas-card">
							<h2 className="mb-4 text-base font-semibold text-[#0F172A]">{t('5. ข้อมูลผู้จอง', '5. Customer Information')}</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label htmlFor="fluffy-cp-fullname" className="fluffy-saas-label">{t('ชื่อ - นามสกุล', 'Full Name')} *</label>
									<input id="fluffy-cp-fullname" className="fluffy-saas-input" type="text" value={profile.fullname} onChange={(e) => setProfile((p) => ({ ...p, fullname: e.target.value }))} required />
								</div>
								<div>
									<label htmlFor="fluffy-cp-email" className="fluffy-saas-label">Email *</label>
									<input id="fluffy-cp-email" className="fluffy-saas-input" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} required />
								</div>
								<div>
									<label htmlFor="fluffy-cp-phone" className="fluffy-saas-label">{t('เบอร์โทรศัพท์', 'Phone')} *</label>
									<input id="fluffy-cp-phone" className="fluffy-saas-input" type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} required />
								</div>
								<div>
									<label htmlFor="fluffy-cp-line" className="fluffy-saas-label">LINE ID</label>
									<input id="fluffy-cp-line" className="fluffy-saas-input" type="text" value={profile.lineid} onChange={(e) => setProfile((p) => ({ ...p, lineid: e.target.value }))} />
								</div>
							</div>
						</section>
					</div>

					<aside id="fluffy-carpark-sidebar" className="fluffy-carpark__sidebar lg:col-span-4">
						<div id="fluffy-carpark-summary" className="fluffy-carpark__summary fluffy-saas-card sticky top-20">
							<h3 className="mb-4 text-base font-semibold text-[#0F172A]">{t('สรุปรายการจอง', 'Booking Summary')}</h3>
							<div className="space-y-2.5 text-sm text-[#64748B]">
								<div className="flex justify-between">
									<span>{t('จำนวนรถ / ช่องจอด', 'Vehicles / Slots')}</span>
									<span className="font-semibold text-[#0F172A]">{selectedSpaces.length} / {totalVehicles}</span>
								</div>
								<div className="flex justify-between">
									<span>{t('ราคารวม', 'Subtotal')}</span>
									<span className="text-[#0F172A]">{pricing.total_price.toLocaleString()} {t('บาท', 'THB')}</span>
								</div>
								{discount > 0 && (
									<div className="flex justify-between text-emerald-600">
										<span>{t('ส่วนลดคูปอง', 'Discount')}</span>
										<span>-{discount.toLocaleString()} {t('บาท', 'THB')}</span>
									</div>
								)}
								<div className="flex justify-between border-t border-[#E2E8F0] pt-3 text-base font-bold text-[#0F172A]">
									<span>{t('ยอดสุทธิ', 'Total')}</span>
									<span className="text-[#4169F7]">{finalTotal.toLocaleString()} {t('บาท', 'THB')}</span>
								</div>
							</div>

							<div className="mt-5 flex gap-2">
								<input
									id="fluffy-cp-coupon"
									className="fluffy-saas-input"
									type="text"
									placeholder={t('รหัสคูปองส่วนลด', 'Coupon code')}
									value={couponCode}
									onChange={(e) => setCouponCode(e.target.value)}
								/>
								<button type="button" onClick={handleValidateCoupon} className="fluffy-saas-btn fluffy-saas-btn-secondary">
									{t('ใช้', 'Apply')}
								</button>
							</div>
							{couponStatus && <p className="mt-2 text-xs text-[#64748B]">{couponStatus}</p>}

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
