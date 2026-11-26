import { create } from 'zustand';
import { getConfig, wpAjax, wpRest } from '../shared/api';
import { t } from '../shared/i18n';

export const EMPTY_SENDING_ADDON = {
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

export const EMPTY_VALET_ADDON = {
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

const getInitialProfile = () => {
	const user = getConfig().user || {};
	return {
		fullname: user.displayName || '',
		email: user.email || '',
		phone: user.phone || '',
		lineid: user.lineId || '',
	};
};

export const useCarparkStore = create((set, get) => ({
	// 1. Date, Time & Location
	startDate: '',
	startTime: '09:00',
	endDate: '',
	endTime: '18:00',
	location: 'SuvarnabhumiAirport',

	// 2. Vehicle Types & Rows
	vehicleTypes: [],
	vehicleRows: [{ type: '', quantity: 1, otherTypeCar: '' }],

	// 3. Parking Spaces, Availability & 2D Map
	spaces: [],
	blackouts: [],
	occupiedIds: [],
	savedPlates: [],
	selectedSpaces: [],
	viewMode: 'status',
	hasChecked: false,
	conditionError: null,

	// 4. Add-on Services
	servicePickup: false,
	serviceValet: false,
	sendingAddon: { ...EMPTY_SENDING_ADDON },
	valetAddon: { ...EMPTY_VALET_ADDON },

	// 5. Pricing & Coupon
	pricing: { price_per_car: 0, total_price: 0 },
	couponCode: '',
	discount: 0,
	couponStatus: '',

	// 6. Customer Profile & UI State
	profile: getInitialProfile(),
	currentStep: 1,
	checking: false,
	submitting: false,
	modal: { open: false, type: 'success', title: '', message: '' },

	// Simple setters
	setField: (key, value) => set({ [key]: value }),
	setProfile: (updater) =>
		set((state) => ({
			profile: typeof updater === 'function' ? updater(state.profile) : updater,
		})),
	setSendingAddon: (updater) =>
		set((state) => ({
			sendingAddon: typeof updater === 'function' ? updater(state.sendingAddon) : updater,
		})),
	setValetAddon: (updater) =>
		set((state) => ({
			valetAddon: typeof updater === 'function' ? updater(state.valetAddon) : updater,
		})),
	setModal: (updater) =>
		set((state) => ({
			modal: typeof updater === 'function' ? updater(state.modal) : updater,
		})),
	closeModal: () => set((state) => ({ modal: { ...state.modal, open: false } })),

	// Derived helpers
	getTotalVehicles: () =>
		get().vehicleRows.reduce((sum, r) => sum + Math.max(0, Number(r.quantity) || 0), 0),

	getVehicleAssignments: () => {
		const list = [];
		get().vehicleRows.forEach((row) => {
			const qty = Math.max(0, Number(row.quantity) || 0);
			for (let i = 0; i < qty; i++) {
				list.push({ type: row.type, otherTypeCar: row.otherTypeCar || '' });
			}
		});
		return list;
	},

	// Master data loader
	loadMasterData: () => {
		const config = getConfig();
		const user = config.user || {};

		wpRest(`${config.customRestUrl}vehicle_type?lang=${config.lang}`)
			.then((res) => {
				const list = Array.isArray(res) ? res : res.data || [];
				set((state) => ({
					vehicleTypes: list,
					vehicleRows:
						list.length > 0
							? state.vehicleRows.map((row, idx) =>
									idx === 0 && !row.type ? { ...row, type: String(list[0].id) } : row
							  )
							: state.vehicleRows,
				}));
			})
			.catch(() => set({ vehicleTypes: [] }));

		wpRest(`${config.customRestUrl}parking_space`)
			.then((res) => set({ spaces: Array.isArray(res) ? res : res.data || [] }))
			.catch(() => set({ spaces: [] }));

		wpRest(`${config.customRestUrl}parking_booking_blackouts`)
			.then((res) => set({ blackouts: Array.isArray(res) ? res : [] }))
			.catch(() => set({ blackouts: [] }));

		if (user.id) {
			wpRest(`${config.customRestUrl}tabien_rod?user_id=${user.id}&per_page=50`)
				.then((res) => set({ savedPlates: res?.items || [] }))
				.catch(() => set({ savedPlates: [] }));
		}
	},

	// Vehicle row mutations
	syncSelectedSpacesWithVehicles: () => {
		const totalVehicles = get().getTotalVehicles();
		const assignments = get().getVehicleAssignments();
		const { vehicleTypes } = get();
		set((state) => ({
			selectedSpaces: state.selectedSpaces.slice(0, totalVehicles).map((space, idx) => ({
				...space,
				assignedVehicleType: assignments[idx]?.type || space.assignedVehicleType || vehicleTypes[0]?.id || '',
				otherTypeCar: assignments[idx]?.otherTypeCar || space.otherTypeCar || '',
			})),
		}));
	},

	updateVehicleRow: (index, key, value) => {
		set((state) => ({
			vehicleRows: state.vehicleRows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
		}));
		get().syncSelectedSpacesWithVehicles();
	},

	addVehicleRow: () => {
		const firstId = String(get().vehicleTypes[0]?.id || '');
		set((state) => ({
			vehicleRows: [...state.vehicleRows, { type: firstId, quantity: 1, otherTypeCar: '' }],
		}));
		get().syncSelectedSpacesWithVehicles();
	},

	removeVehicleRow: (index) => {
		if (get().vehicleRows.length <= 1) {
			return;
		}
		set((state) => ({
			vehicleRows: state.vehicleRows.filter((_, i) => i !== index),
		}));
		get().syncSelectedSpacesWithVehicles();
	},

	// Schedule validation
	validateScheduleConditions: () => {
		const { startDate, endDate, startTime, endTime, blackouts } = get();
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
	},

	// Async API Actions
	checkAvailability: async () => {
		const errObj = get().validateScheduleConditions();
		if (errObj) {
			set({ conditionError: errObj, hasChecked: false, selectedSpaces: [] });
			return false;
		}
		const { startDate, startTime, endDate, endTime, location } = get();
		set({ conditionError: null, checking: true });
		try {
			const occupied = await wpAjax('check_parking_availability', {
				startDateTime: `${startDate} ${startTime}`,
				endDateTime: `${endDate} ${endTime}`,
				locationChoose: location,
			});
			set({
				occupiedIds: (occupied || []).map((item) => Number(item.id)),
				selectedSpaces: [],
				hasChecked: true,
			});
			return true;
		} catch (err) {
			set({ conditionError: { type: 'blackout', message: err.message }, hasChecked: false });
			return false;
		} finally {
			set({ checking: false });
		}
	},

	calculatePrice: () => {
		const { startDate, endDate, startTime, endTime, vehicleRows } = get();
		const totalVehicles = get().getTotalVehicles();
		if (!startDate || !endDate || totalVehicles === 0) {
			set({ pricing: { price_per_car: 0, total_price: 0 } });
			return;
		}
		const quantities = {};
		vehicleRows.forEach((row) => {
			if (row.type && Number(row.quantity) > 0) {
				quantities[row.type] = (quantities[row.type] || 0) + Number(row.quantity);
			}
		});

		const config = getConfig();
		wpAjax('calculate_parking_price', {
			nonce: config.nonces.parkingPrice,
			startDate,
			endDate,
			startTime,
			endTime,
			vehicleQuantities: JSON.stringify(quantities),
		})
			.then((res) => {
				set({
					pricing: {
						price_per_car: Number(res?.price_per_car || 0),
						total_price: Number(res?.total_price || 0),
					},
				});
			})
			.catch(() => {});
	},

	toggleSpace: (space) => {
		const { occupiedIds, selectedSpaces, vehicleTypes, savedPlates } = get();
		if (!space || occupiedIds.includes(Number(space.id))) {
			return;
		}
		const totalVehicles = get().getTotalVehicles();
		const assignments = get().getVehicleAssignments();

		const exists = selectedSpaces.find((item) => Number(item.parking_post_id) === Number(space.id));
		if (exists) {
			set({
				selectedSpaces: selectedSpaces.filter((item) => Number(item.parking_post_id) !== Number(space.id)),
			});
			return;
		}
		if (selectedSpaces.length >= totalVehicles) {
			set({
				modal: {
					open: true,
					type: 'error',
					title: t('เลือกครบจำนวนรถแล้ว', 'Selection Limit Reached'),
					message: t(
						`คุณระบุจำนวนรถไว้ ${totalVehicles} คัน หากต้องการเลือกช่องเพิ่ม กรุณาเพิ่มจำนวนรถก่อน`,
						`You selected ${totalVehicles} vehicle(s). Increase vehicle quantity to select more spaces.`
					),
				},
			});
			return;
		}
		const nextIdx = selectedSpaces.length;
		const assigned = assignments[nextIdx] || {};
		set({
			selectedSpaces: [
				...selectedSpaces,
				{
					id: space.id,
					parking_post_id: space.id,
					parking_id: space.parking_id || space.title || '',
					title: space.title || space.parking_id || `Space #${space.id}`,
					assignedVehicleType: assigned.type || vehicleTypes[0]?.id || '',
					otherTypeCar: assigned.otherTypeCar || '',
					licensePlate: savedPlates[nextIdx]?.tabienrod_number || '',
				},
			],
		});
	},

	updateSpaceField: (spaceId, key, value) => {
		set((state) => ({
			selectedSpaces: state.selectedSpaces.map((item) =>
				Number(item.parking_post_id) === Number(spaceId) ? { ...item, [key]: value } : item
			),
		}));
	},

	validateCoupon: async () => {
		const { couponCode, pricing } = get();
		if (!couponCode.trim()) {
			return;
		}
		set({ couponStatus: '' });
		try {
			const res = await wpAjax('validate_coupon', {
				coupon_code: couponCode.trim(),
				total_price: pricing.total_price,
			});
			set({
				discount: Number(res?.discount_amount || 0),
				couponStatus: t(`ใช้คูปองสำเร็จ ลด ${res.discount_amount} บาท`, `Coupon applied: -${res.discount_amount} THB`),
			});
		} catch (err) {
			set({ discount: 0, couponStatus: err.message });
		}
	},

	nextStep: async () => {
		const { currentStep, selectedSpaces, profile } = get();
		const totalVehicles = get().getTotalVehicles();

		if (currentStep === 1) {
			const errObj = get().validateScheduleConditions();
			if (errObj) {
				set({
					conditionError: errObj,
					modal: { open: true, type: 'error', title: t('ไม่ตรงเงื่อนไขการจอง', 'Booking Condition'), message: errObj.message },
				});
				return;
			}
			if (totalVehicles <= 0) {
				set({
					modal: { open: true, type: 'error', title: t('ระบุจำนวนรถ', 'Specify Vehicles'), message: t('กรุณาระบุจำนวนรถอย่างน้อย 1 คัน', 'Please select at least 1 vehicle.') },
				});
				return;
			}
			const ok = await get().checkAvailability();
			if (ok) {
				set({ currentStep: 2 });
			}
			return;
		}
		if (currentStep === 2) {
			if (selectedSpaces.length !== totalVehicles) {
				set({
					modal: {
						open: true,
						type: 'error',
						title: t('กรุณาเลือกช่องจอดให้ครบ', 'Select All Spaces'),
						message: t(
							`กรุณาเลือกช่องจอดให้ครบ ${totalVehicles} ช่อง (เลือกแล้ว ${selectedSpaces.length} ช่อง)`,
							`Please select ${totalVehicles} parking space(s) (${selectedSpaces.length} selected).`
						),
					},
				});
				return;
			}
			set({ currentStep: 3 });
			return;
		}
		if (currentStep === 3) {
			if (!profile.fullname.trim() || !profile.email.trim() || !profile.phone.trim()) {
				set({
					modal: {
						open: true,
						type: 'error',
						title: t('กรอกข้อมูลผู้จองไม่ครบ', 'Missing Contact Details'),
						message: t('กรุณากรอกชื่อ-นามสกุล อีเมล และเบอร์โทรศัพท์ให้ครบถ้วน', 'Please fill in full name, email, and phone number.'),
					},
				});
				return;
			}
			set({ currentStep: 4 });
		}
	},

	submitBooking: async () => {
		const state = get();
		const totalVehicles = state.getTotalVehicles();
		const errObj = state.validateScheduleConditions();
		if (errObj) {
			set({
				conditionError: errObj,
				modal: { open: true, type: 'error', title: t('ไม่ตรงเงื่อนไขการจอง', 'Booking Condition'), message: errObj.message },
			});
			return;
		}
		if (!state.hasChecked) {
			set({
				modal: {
					open: true,
					type: 'error',
					title: t('กรุณาตรวจสอบช่องว่าง', 'Check Availability First'),
					message: t('กรุณาเลือกวันเวลาและกดตรวจสอบช่องว่างก่อน', 'Please check parking availability first.'),
				},
			});
			return;
		}
		if (state.selectedSpaces.length !== totalVehicles) {
			set({
				modal: {
					open: true,
					type: 'error',
					title: t('กรุณาเลือกช่องจอดให้ครบ', 'Select All Spaces'),
					message: t(
						`กรุณาเลือกช่องจอดให้ครบ ${totalVehicles} ช่อง (เลือกแล้ว ${state.selectedSpaces.length} ช่อง)`,
						`Please select ${totalVehicles} parking space(s) (${state.selectedSpaces.length} selected).`
					),
				},
			});
			return;
		}

		const config = getConfig();
		const user = config.user || {};
		const finalTotal = Math.max(0, state.pricing.total_price - state.discount);

		set({ submitting: true });
		try {
			const bookingData = {
				startDate: state.startDate,
				endDate: state.endDate,
				startTime: state.startTime,
				endTime: state.endTime,
				location: state.location,
				pricePerCar: state.pricing.price_per_car,
				totalPrice: finalTotal,
				couponCode: state.discount > 0 ? state.couponCode.trim() : '',
				discountAmount: state.discount,
				profile: state.profile,
				customer_user: user.id || 0,
				vehicleTypeQuantities: state.vehicleRows.map((r) => ({
					type: r.type === '1236' && r.otherTypeCar ? r.otherTypeCar : r.type,
					quantity: Number(r.quantity) || 1,
				})),
				selectedParkingSpaces: state.selectedSpaces,
				addon:
					state.servicePickup || state.serviceValet
						? {
								servicePickup: state.servicePickup,
								serviceValet: state.serviceValet,
								sending: state.sendingAddon,
								parking: state.valetAddon,
						  }
						: null,
			};

			const res = await wpAjax('insert_parking_booking', {
				bookingData: JSON.stringify(bookingData),
			});

			window.location.href = res?.checkout_url || res?.redirect_url || config.checkoutUrl;
		} catch (err) {
			set({
				modal: { open: true, type: 'error', title: t('จองไม่สำเร็จ', 'Booking Failed'), message: err.message },
			});
		} finally {
			set({ submitting: false });
		}
	},
}));
