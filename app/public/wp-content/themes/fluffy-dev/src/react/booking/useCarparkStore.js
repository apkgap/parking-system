import { create } from 'zustand';
import { getConfig, wpAjax, wpRest } from '../shared/api';
import { t } from '../shared/i18n';
import {
	filterSpacesByLocation,
	getSpaceCode,
	isValidLicensePlate,
	validateCarSlotsForStep2,
} from './parkingMapUtils';

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

function buildSelectedSpacesFromCarSlots(carSlots) {
	return (carSlots || [])
		.filter((car) => car && car.space && car.space.parking_post_id)
		.map((car) => ({
			id: car.space.id,
			parking_post_id: car.space.parking_post_id,
			parking_id: car.space.parking_id,
			title: car.space.title,
			assignedVehicleType: car.assignedVehicleType || '',
			otherTypeCar: car.otherTypeCar || '',
			licensePlate: car.licensePlate || '',
			carIndex: car.carIndex,
		}));
}

function buildCarSlotsFromAssignments(assignments, prevCarSlots, vehicleTypes, savedPlates) {
	const defaultType = String(vehicleTypes[0]?.id || '');
	return assignments.map((assignment, idx) => {
		const prev = prevCarSlots[idx];
		const existingPlate = prev ? prev.licensePlate : savedPlates[idx]?.tabienrod_number || '';
		return {
			carIndex: idx,
			assignedVehicleType: assignment.type || prev?.assignedVehicleType || defaultType,
			otherTypeCar: assignment.otherTypeCar || '',
			licensePlate: existingPlate,
			space: prev?.space || null,
		};
	});
}

function findNextActiveCarIndex(carSlots, fallbackIndex = 0) {
	if (!Array.isArray(carSlots) || carSlots.length === 0) {
		return 0;
	}
	const firstUnassigned = carSlots.findIndex((c) => !c.space);
	if (firstUnassigned !== -1) {
		return firstUnassigned;
	}
	return Math.min(Math.max(0, fallbackIndex), carSlots.length - 1);
}

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

	// 3. Parking Spaces, Availability & Per-Car Slot Selection
	spaces: [],
	blackouts: [],
	occupiedIds: [],
	savedPlates: [],
	carSlots: [{ carIndex: 0, assignedVehicleType: '', otherTypeCar: '', licensePlate: '', space: null }],
	activeCarIndex: 0,
	selectedSpaces: [],
	viewMode: 'status',
	hasChecked: false,
	conditionError: null,
	loadError: null,
	slotConflicts: [],

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
	setActiveCarIndex: (index) =>
		set((state) => ({
			activeCarIndex: Math.min(Math.max(0, Number(index) || 0), Math.max(0, state.carSlots.length - 1)),
		})),
	clearSlotConflicts: () => set({ slotConflicts: [] }),
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
				set((state) => {
					const nextRows =
						list.length > 0
							? state.vehicleRows.map((row, idx) =>
									idx === 0 && !row.type ? { ...row, type: String(list[0].id) } : row
							  )
							: state.vehicleRows;
					const assignments = [];
					nextRows.forEach((row) => {
						const qty = Math.max(0, Number(row.quantity) || 0);
						for (let i = 0; i < qty; i++) {
							assignments.push({ type: row.type, otherTypeCar: row.otherTypeCar || '' });
						}
					});
					const nextCarSlots = buildCarSlotsFromAssignments(assignments, state.carSlots, list, state.savedPlates);
					return {
						vehicleTypes: list,
						vehicleRows: nextRows,
						carSlots: nextCarSlots,
						selectedSpaces: buildSelectedSpacesFromCarSlots(nextCarSlots),
					};
				});
			})
			.catch(() => set({ vehicleTypes: [] }));

		wpRest(`${config.customRestUrl}parking_space`)
			.then((res) => {
				const list = Array.isArray(res) ? res : res.data || [];
				set({ spaces: list, loadError: null });
			})
			.catch((err) => {
				set({
					loadError: err?.message || t('ไม่สามารถโหลดข้อมูลช่องจอดได้', 'Failed to load parking spaces.'),
				});
			});

		wpRest(`${config.customRestUrl}parking_booking_blackouts`)
			.then((res) => set({ blackouts: Array.isArray(res) ? res : [] }))
			.catch(() => set({ blackouts: [] }));

		if (user.id) {
			wpRest(`${config.customRestUrl}tabien_rod?user_id=${user.id}&per_page=50`)
				.then((res) => {
					const plates = res?.items || [];
					set((state) => {
						const nextCarSlots = state.carSlots.map((car, idx) =>
							!car.licensePlate && plates[idx]?.tabienrod_number
								? { ...car, licensePlate: plates[idx].tabienrod_number }
								: car
						);
						return {
							savedPlates: plates,
							carSlots: nextCarSlots,
							selectedSpaces: buildSelectedSpacesFromCarSlots(nextCarSlots),
						};
					});
				})
				.catch(() => set({ savedPlates: [] }));
		}
	},

	// Vehicle row mutations
	syncSelectedSpacesWithVehicles: () => {
		const assignments = get().getVehicleAssignments();
		const { vehicleTypes, savedPlates } = get();
		set((state) => {
			const nextCarSlots = buildCarSlotsFromAssignments(assignments, state.carSlots, vehicleTypes, savedPlates);
			return {
				carSlots: nextCarSlots,
				activeCarIndex: findNextActiveCarIndex(nextCarSlots, state.activeCarIndex),
				selectedSpaces: buildSelectedSpacesFromCarSlots(nextCarSlots),
			};
		});
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

	// Async API Actions: fetches fresh WP parking_space posts + occupiedIds and reconciles existing carSlots
	checkAvailability: async () => {
		const errObj = get().validateScheduleConditions();
		if (errObj) {
			set({ conditionError: errObj, hasChecked: false });
			return false;
		}
		const { startDate, startTime, endDate, endTime, location } = get();
		const config = getConfig();
		set({ conditionError: null, loadError: null, checking: true });

		try {
			const [spacesRes, occupied] = await Promise.all([
				wpRest(`${config.customRestUrl}parking_space`),
				wpAjax('check_parking_availability', {
					startDateTime: `${startDate} ${startTime}`,
					endDateTime: `${endDate} ${endTime}`,
					locationChoose: location,
				}),
			]);

			const freshSpaces = Array.isArray(spacesRes) ? spacesRes : spacesRes?.data || [];
			const freshOccupiedIds = (occupied || []).map((item) => Number(item.id));
			const validLocationSpaces = filterSpacesByLocation(freshSpaces, location);
			const validLocationSpaceMap = new Map(validLocationSpaces.map((s) => [Number(s.id), s]));

			const assignments = get().getVehicleAssignments();
			const { vehicleTypes, savedPlates, carSlots: prevCarSlots } = get();
			const syncedSlots = buildCarSlotsFromAssignments(assignments, prevCarSlots, vehicleTypes, savedPlates);

			const conflicts = [];
			const reconciledSlots = syncedSlots.map((car) => {
				if (!car.space) {
					return car;
				}
				const postId = Number(car.space.parking_post_id);
				const freshSpace = validLocationSpaceMap.get(postId);
				if (!freshSpace) {
					conflicts.push({
						carIndex: car.carIndex,
						spaceCode: car.space.title,
						reason: 'location_changed',
					});
					return { ...car, space: null };
				}
				if (freshOccupiedIds.includes(postId)) {
					conflicts.push({
						carIndex: car.carIndex,
						spaceCode: getSpaceCode(freshSpace),
						reason: 'occupied',
					});
					return { ...car, space: null };
				}
				// Refresh title/parking_id from latest WordPress data
				return {
					...car,
					space: {
						id: freshSpace.id,
						parking_post_id: freshSpace.id,
						parking_id: freshSpace.parking_id || freshSpace.title || '',
						title: getSpaceCode(freshSpace),
					},
				};
			});

			const nextActive =
				conflicts.length > 0
					? conflicts[0].carIndex
					: findNextActiveCarIndex(reconciledSlots, get().activeCarIndex);

			set({
				spaces: freshSpaces,
				occupiedIds: freshOccupiedIds,
				carSlots: reconciledSlots,
				activeCarIndex: nextActive,
				selectedSpaces: buildSelectedSpacesFromCarSlots(reconciledSlots),
				slotConflicts: conflicts,
				hasChecked: true,
				loadError: null,
			});
			return true;
		} catch (err) {
			// Preserve carSlots and typed license plates on failure so retry doesn't lose user input
			set({
				loadError: err?.message || t('ไม่สามารถโหลดข้อมูลช่องจอดได้ กรุณาลองอีกครั้ง', 'Failed to load parking spaces. Please try again.'),
				hasChecked: false,
			});
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

	/**
	 * Assign or toggle a parking space for the target car (defaults to activeCarIndex).
	 * - Never allows duplicate Post IDs across cars in the same booking.
	 * - Preserves licensePlate, assignedVehicleType, and other cars' data when changing slots.
	 */
	selectSpaceForCar: (space, explicitCarIndex = null) => {
		const { occupiedIds, carSlots, activeCarIndex } = get();
		const postId = Number(space?.id || 0);
		if (!space || !postId || occupiedIds.includes(postId) || carSlots.length === 0) {
			return { changed: false, carIndex: activeCarIndex };
		}

		const targetIdx =
			explicitCarIndex !== null && explicitCarIndex !== undefined
				? Math.min(Math.max(0, Number(explicitCarIndex)), carSlots.length - 1)
				: Math.min(Math.max(0, activeCarIndex), carSlots.length - 1);

		const existingCarIdx = carSlots.findIndex((c) => Number(c.space?.parking_post_id) === postId);

		// Clicking the slot already assigned to the active car deselects it (preserving license plate)
		if (existingCarIdx === targetIdx) {
			const nextCarSlots = carSlots.map((car, idx) =>
				idx === targetIdx ? { ...car, space: null } : car
			);
			set({
				carSlots: nextCarSlots,
				selectedSpaces: buildSelectedSpacesFromCarSlots(nextCarSlots),
				slotConflicts: get().slotConflicts.filter((c) => c.carIndex !== targetIdx),
			});
			return { changed: true, action: 'deselected', carIndex: targetIdx };
		}

		// Prevent assigning the same Post ID to another car in the same booking
		if (existingCarIdx !== -1 && existingCarIdx !== targetIdx) {
			return { changed: false, action: 'taken_by_other_car', carIndex: existingCarIdx };
		}

		const code = getSpaceCode(space);
		const nextSpaceObj = {
			id: space.id,
			parking_post_id: space.id,
			parking_id: space.parking_id || space.title || '',
			title: code,
		};

		const nextCarSlots = carSlots.map((car, idx) =>
			idx === targetIdx ? { ...car, space: nextSpaceObj } : car
		);
		const nextActive = findNextActiveCarIndex(nextCarSlots, targetIdx);

		set({
			carSlots: nextCarSlots,
			activeCarIndex: nextActive,
			selectedSpaces: buildSelectedSpacesFromCarSlots(nextCarSlots),
			slotConflicts: get().slotConflicts.filter((c) => c.carIndex !== targetIdx),
		});
		return { changed: true, action: 'selected', carIndex: targetIdx };
	},

	// Backward-compatible alias
	toggleSpace: (space) => get().selectSpaceForCar(space),

	updateCarLicensePlate: (carIndex, value) => {
		set((state) => {
			const nextCarSlots = state.carSlots.map((car, idx) =>
				idx === carIndex ? { ...car, licensePlate: value } : car
			);
			return {
				carSlots: nextCarSlots,
				selectedSpaces: buildSelectedSpacesFromCarSlots(nextCarSlots),
			};
		});
	},

	// Backward-compatible field updater by spaceId
	updateSpaceField: (spaceId, key, value) => {
		set((state) => {
			const nextCarSlots = state.carSlots.map((car) =>
				Number(car.space?.parking_post_id) === Number(spaceId) ? { ...car, [key]: value } : car
			);
			return {
				carSlots: nextCarSlots,
				selectedSpaces: buildSelectedSpacesFromCarSlots(nextCarSlots),
			};
		});
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
		const { currentStep, carSlots, occupiedIds, profile } = get();
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
			get().syncSelectedSpacesWithVehicles();
			set({ currentStep: 2 });
			await get().checkAvailability();
			return;
		}

		if (currentStep === 2) {
			const check = validateCarSlotsForStep2(carSlots, totalVehicles, occupiedIds);
			if (!check.valid) {
				if (check.reason === 'missing_plate') {
					const carNum = (check.carIndex ?? 0) + 1;
					set({
						activeCarIndex: check.carIndex ?? 0,
						modal: {
							open: true,
							type: 'error',
							title: t('กรุณากรอกทะเบียนรถ', 'Enter License Plate'),
							message: t(`กรุณากรอกทะเบียนรถสำหรับรถคันที่ ${carNum}`, `Please enter the license plate for Vehicle #${carNum}.`),
						},
					});
					return;
				}
				const selectedCount = carSlots.filter((c) => Boolean(c.space)).length;
				set({
					modal: {
						open: true,
						type: 'error',
						title: t('กรุณาเลือกช่องจอดให้ครบ', 'Select All Spaces'),
						message: t(
							`กรุณาเลือกช่องจอดให้ครบ ${totalVehicles} ช่อง (เลือกแล้ว ${selectedCount} ช่อง)`,
							`Please select ${totalVehicles} parking space(s) (${selectedCount} selected).`
						),
					},
				});
				return;
			}

			// Re-verify live availability before entering Step 3 to catch mid-booking conflicts
			const ok = await get().checkAvailability();
			if (!ok) {
				return;
			}
			const afterState = get();
			if (afterState.slotConflicts.length > 0) {
				return;
			}
			const postCheck = validateCarSlotsForStep2(afterState.carSlots, totalVehicles, afterState.occupiedIds);
			if (!postCheck.valid) {
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
		const selectedSpaces = buildSelectedSpacesFromCarSlots(state.carSlots);
		const validCheck = validateCarSlotsForStep2(state.carSlots, totalVehicles, state.occupiedIds);
		if (!validCheck.valid || selectedSpaces.length !== totalVehicles) {
			set({
				modal: {
					open: true,
					type: 'error',
					title: t('ข้อมูลช่องจอดหรือทะเบียนไม่ครบ', 'Incomplete Slot or Plate'),
					message: t(
						`กรุณาเลือกช่องจอดให้ครบ ${totalVehicles} ช่องและกรอกทะเบียนรถทุกคัน`,
						`Please select ${totalVehicles} parking space(s) and fill in all license plates.`
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
				selectedParkingSpaces: selectedSpaces,
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
