import {
	RiAddLine,
	RiArrowLeftLine,
	RiArrowRightLine,
	RiCalendarLine,
	RiCarLine,
	RiCheckLine,
	RiFileList3Line,
	RiServiceLine,
	RiSubtractLine,
	RiUserLine,
} from '@remixicon/react';
import { useEffect, useMemo } from '@wordpress/element';
import { getConfig } from '../shared/api';
import { t } from '../shared/i18n';
import StatusModal from '../shared/StatusModal';
import DatePickerField from '../shared/DatePickerField';
import TimePickerField from '../shared/TimePickerField';
import ParkingStep2 from './ParkingStep2';
import { useCarparkStore } from './useCarparkStore';

export default function CarparkBooking() {
	const config = getConfig();

	// Consume centralized Zustand store
	const {
		startDate,
		startTime,
		endDate,
		endTime,
		location,
		vehicleTypes,
		vehicleRows,
		blackouts,
		selectedSpaces,
		conditionError,
		servicePickup,
		serviceValet,
		sendingAddon,
		valetAddon,
		pricing,
		couponCode,
		discount,
		couponStatus,
		profile,
		currentStep,
		checking,
		submitting,
		modal,
		setField,
		setProfile,
		setSendingAddon,
		setValetAddon,
		setModal,
		loadMasterData,
		checkAvailability,
		calculatePrice,
		updateVehicleRow,
		addVehicleRow,
		removeVehicleRow,
		validateCoupon: handleValidateCoupon,
		nextStep: handleNextStep,
		submitBooking,
	} = useCarparkStore();

	const setStartDate = (v) => setField('startDate', v);
	const setStartTime = (v) => setField('startTime', v);
	const setEndDate = (v) => setField('endDate', v);
	const setEndTime = (v) => setField('endTime', v);
	const setLocation = (v) => setField('location', v);
	const setServicePickup = (v) => setField('servicePickup', v);
	const setServiceValet = (v) => setField('serviceValet', v);
	const setCouponCode = (v) => setField('couponCode', v);
	const setCurrentStep = (v) => setField('currentStep', v);

	// Load master data once on mount
	useEffect(() => {
		loadMasterData();
	}, [loadMasterData]);

	const totalVehicles = useMemo(
		() => vehicleRows.reduce((sum, r) => sum + Math.max(0, Number(r.quantity) || 0), 0),
		[vehicleRows]
	);

	// Auto-check availability when schedule or location changes
	useEffect(() => {
		if (startDate && endDate && location) {
			checkAvailability();
		} else {
			setField('hasChecked', false);
		}
	}, [startDate, endDate, startTime, endTime, location, blackouts, checkAvailability, setField]);

	// Auto-calculate price when schedule or vehicleRows change
	useEffect(() => {
		calculatePrice();
	}, [startDate, endDate, startTime, endTime, vehicleRows, totalVehicles, calculatePrice]);

	const finalTotal = Math.max(0, pricing.total_price - discount);

	const wizardSteps = [
		{ id: 1, label: t('วันเวลาและรถ', 'Schedule & Vehicles') },
		{ id: 2, label: t('ผังช่องจอด', 'Parking Map') },
		{ id: 3, label: t('บริการเสริมและผู้จอง', 'Add-ons & Contact') },
		{ id: 4, label: t('ตรวจสอบและยืนยัน', 'Review & Confirm') },
	];

	const handleSubmit = (e) => {
		e.preventDefault();
		submitBooking();
	};

	const activeStepLabel = wizardSteps[currentStep - 1]?.label;

	const wizardNavigation = (
		<nav id="fluffy-carpark-wizard-nav" className="fluffy-carpark__wizard-nav fluffy-wizard-nav" aria-label={t('ขั้นตอนการจอง', 'Booking steps')}>
			{wizardSteps.map((step) => {
				const isActive = currentStep === step.id;
				const isCompleted = currentStep > step.id;
				return (
					<button
						id={`fluffy-wizard-step-${step.id}`}
						className={`fluffy-carpark__wizard-btn fluffy-wizard-btn ${
							isActive ? 'is-active' : isCompleted ? 'is-completed' : ''
						}`}
						type="button"
						key={step.id}
						disabled={!isCompleted}
						aria-label={step.label}
						aria-current={isActive ? 'step' : undefined}
						onClick={() => {
							if (step.id < currentStep) {
								setCurrentStep(step.id);
							}
						}}
					>
						<span className="fluffy-wizard-btn__num">
							{isCompleted ? <RiCheckLine size={16} aria-hidden="true" /> : <span>{step.id}</span>}
						</span>
						<span className="fluffy-wizard-btn__label">{step.label}</span>
					</button>
				);
			})}
			<p className="fluffy-wizard-nav__summary" aria-hidden="true">
				{t(
					`ขั้นที่ ${currentStep} จาก ${wizardSteps.length}`,
					`Step ${currentStep} of ${wizardSteps.length}`
				)} <span>·</span> <strong>{activeStepLabel}</strong>
			</p>
		</nav>
	);

	return (
		<div id="fluffy-carpark-app" className={`fluffy-carpark fluffy-saas-shell ${currentStep === 2 ? 'is-step2' : ''}`}>
			<div id="fluffy-carpark-container" className="fluffy-carpark__container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<header id="fluffy-carpark-header" className="fluffy-carpark__header fluffy-saas-header">
					{config.brandLogoUrl && (
						<img className="fluffy-carpark__header-icon" src={config.brandLogoUrl} alt="" width={56} height={56} />
					)}
					<div>
						<h1 className="fluffy-carpark__title fluffy-saas-title">{t('จองที่จอดรถสนามบิน', 'Airport Parking Reservation')}</h1>
						<p className="fluffy-carpark__subtitle fluffy-saas-subtitle">
							{t('เลือกวันเวลา ประเภทรถ ผังช่องจอด และบริการเสริมครบในหน้าเดียว', 'Select schedule, vehicle types, parking map slots, and add-on services.')}
						</p>
					</div>
				</header>
				{wizardNavigation}

				{currentStep === 2 ? (
					<ParkingStep2 onBack={() => setCurrentStep(1)} onNext={handleNextStep} />
				) : (
				<form id="fluffy-carpark-form" className="fluffy-carpark__form" onSubmit={handleSubmit}>
					<div id="fluffy-carpark-main" className="fluffy-carpark__main">

						{currentStep === 1 && (
							<>
								{/* Section 1: Date, Time & Location */}
								<section id="fluffy-carpark-schedule" className="fluffy-carpark__section fluffy-saas-card">
							<h2 className="fluffy-carpark__section-title"><RiCalendarLine size={20} aria-hidden="true" />{t('วันเวลาและสถานที่', 'Schedule & location')}</h2>
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

							<div className="mt-4">
								<label htmlFor="fluffy-location" className="fluffy-saas-label">{t('สถานที่', 'Airport Location')} *</label>
								<select id="fluffy-location" className="fluffy-saas-select" value={location} onChange={(e) => setLocation(e.target.value)}>
									<option value="SuvarnabhumiAirport">{t('สนามบินสุวรรณภูมิ', 'Suvarnabhumi Airport')}</option>
									<option value="DonMueangAirport">{t('สนามบินดอนเมือง', 'Don Mueang Airport')}</option>
								</select>
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
							<div className="fluffy-carpark__vehicle-heading">
								<div>
									<h2 className="fluffy-carpark__section-title"><RiCarLine size={20} aria-hidden="true" />{t('รถที่จะนำมาจอด', 'Vehicles to park')}</h2>
									<p className="text-xs text-[#64748B]">{t(`รวมทั้งหมด ${totalVehicles} คัน`, `Total: ${totalVehicles} vehicle(s)`)}</p>
								</div>
								<button type="button" onClick={addVehicleRow} className="fluffy-saas-btn fluffy-saas-btn-secondary !px-3 !py-1.5 text-xs">
									<RiAddLine size={16} aria-hidden="true" /> {t('เพิ่มประเภทรถ', 'Add Vehicle Type')}
								</button>
							</div>
							<div className="space-y-3">
								{vehicleRows.map((row, idx) => (
									<div key={idx} className="fluffy-carpark__vehicle-row">
										<div className="fluffy-carpark__vehicle-type">
											<select
												aria-label={t('ประเภทรถ', 'Vehicle type')}
												className="fluffy-saas-select"
												value={row.type}
												onChange={(e) => updateVehicleRow(idx, 'type', e.target.value)}
											>
												{vehicleTypes.map((vt) => (
													<option key={vt.id} value={vt.id}>{vt.title}</option>
												))}
											</select>
										</div>
										<div className="fluffy-carpark__quantity" role="group" aria-label={t('จำนวนรถ', 'Vehicle quantity')}>
											<button
												type="button"
												onClick={() => updateVehicleRow(idx, 'quantity', Math.max(1, (Number(row.quantity) || 1) - 1))}
												aria-label={t('ลดจำนวนรถ', 'Decrease vehicle quantity')}
												disabled={Number(row.quantity) <= 1}
											>
												<RiSubtractLine size={18} aria-hidden="true" />
											</button>
											<input
												type="number"
												min={1}
												max={20}
												className="fluffy-saas-input fluffy-carpark__quantity-input"
												aria-label={t('จำนวนคัน', 'Number of vehicles')}
												value={row.quantity}
												onChange={(e) => updateVehicleRow(idx, 'quantity', Math.max(1, Number(e.target.value) || 1))}
											/>
											<button
												type="button"
												onClick={() => updateVehicleRow(idx, 'quantity', (Number(row.quantity) || 1) + 1)}
												aria-label={t('เพิ่มจำนวนรถ', 'Increase vehicle quantity')}
											>
												<RiAddLine size={18} aria-hidden="true" />
											</button>
										</div>
										{vehicleRows.length > 1 && (
												<button
													type="button"
													onClick={() => removeVehicleRow(idx)}
													className="fluffy-carpark__vehicle-remove"
												>
													{t('ลบ', 'Remove')}
												</button>
											)}
										{String(row.type) === '1236' && (
											<div className="fluffy-carpark__vehicle-other">
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
							</>
						)}

						{currentStep === 3 && (
							<>
								{/* Section 4: Original Add-on Services (Pickup & Valet) */}
								<section id="fluffy-carpark-addons" className="fluffy-carpark__section fluffy-saas-card space-y-2">
							<h2 className="fluffy-carpark__section-title"><RiServiceLine size={20} aria-hidden="true" />{t('บริการเสริม (ไม่บังคับ)', 'Add-ons (optional)')}</h2>

							<label className="fluffy-carpark__addon-option">
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
								<div className="grid gap-2 pb-2 sm:grid-cols-2">
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

							<label className="fluffy-carpark__addon-option">
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
								<div className="grid gap-2 pb-2 sm:grid-cols-2">
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
							<h2 className="fluffy-carpark__section-title"><RiUserLine size={20} aria-hidden="true" />{t('ข้อมูลผู้จอง', 'Contact details')}</h2>
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
							</>
						)}

						{currentStep === 4 && (
							<section id="fluffy-carpark-review" className="fluffy-carpark__section fluffy-saas-card space-y-5">
								<h2 className="fluffy-carpark__section-title"><RiFileList3Line size={20} aria-hidden="true" />{t('ตรวจสอบข้อมูลการจอง', 'Review reservation')}</h2>
								<div className="grid gap-4 rounded-lg bg-[#F1F5F9] p-4 text-sm sm:grid-cols-2">
									<div>
										<div className="text-xs text-[#64748B]">{t('สนามบิน', 'Location')}</div>
										<div className="mt-0.5 font-semibold text-[#0F172A]">
											{location === 'DonMueangAirport' ? t('สนามบินดอนเมือง', 'Don Mueang Airport') : t('สนามบินสุวรรณภูมิ', 'Suvarnabhumi Airport')}
										</div>
									</div>
									<div>
										<div className="text-xs text-[#64748B]">{t('ช่วงเวลาจอด', 'Parking Schedule')}</div>
										<div className="mt-0.5 font-semibold text-[#0F172A]">{startDate} {startTime} → {endDate} {endTime}</div>
									</div>
									<div>
										<div className="text-xs text-[#64748B]">{t('ช่องจอดและทะเบียนรถ', 'Slots & Plates')}</div>
										<div className="mt-0.5 font-medium text-[#0F172A]">
											{selectedSpaces.map((s) => `${s.title}${s.licensePlate ? ` (${s.licensePlate})` : ''}`).join(', ')}
										</div>
									</div>
									<div>
										<div className="text-xs text-[#64748B]">{t('บริการเสริม', 'Add-ons')}</div>
										<div className="mt-0.5 font-medium text-[#0F172A]">
											{servicePickup || serviceValet
												? [servicePickup ? t('รถรับ-ส่งสนามบิน', 'Shuttle') : '', serviceValet ? 'Valet' : ''].filter(Boolean).join(', ')
												: t('ไม่มี', 'None')}
										</div>
									</div>
									<div>
										<div className="text-xs text-[#64748B]">{t('ผู้จอง', 'Customer')}</div>
										<div className="mt-0.5 font-medium text-[#0F172A]">{profile.fullname} · {profile.phone}</div>
									</div>
									<div>
										<div className="text-xs text-[#64748B]">Email / LINE</div>
										<div className="mt-0.5 font-medium text-[#0F172A]">{profile.email} {profile.lineid ? `· ${profile.lineid}` : ''}</div>
									</div>
								</div>
							</section>
						)}

						{/* Wizard Back Navigation */}
						{currentStep > 1 && (
							<div id="fluffy-carpark-wizard-actions" className="fluffy-carpark__wizard-actions flex items-center justify-start pt-1">
								<button
									id="fluffy-wizard-prev"
									className="fluffy-saas-btn fluffy-saas-btn-secondary"
									type="button"
									onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
								>
									<RiArrowLeftLine size={18} aria-hidden="true" /> {t('ย้อนกลับ', 'Back')}
								</button>
							</div>
						)}
					</div>

					<aside id="fluffy-carpark-sidebar" className="fluffy-carpark__sidebar">
						<div id="fluffy-carpark-summary" className="fluffy-carpark__summary fluffy-saas-card">
							<h2 className="fluffy-carpark__section-title"><RiFileList3Line size={20} aria-hidden="true" />{t('สรุปรายการจอง', 'Booking summary')}</h2>
							<div className="fluffy-carpark__summary-lines">
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
								<div className="fluffy-carpark__summary-total">
									<span>{t('ยอดสุทธิ', 'Total')}</span>
									<span className="fluffy-carpark__summary-price">{finalTotal.toLocaleString()} {t('บาท', 'THB')}</span>
								</div>
							</div>

							<div className="fluffy-carpark__coupon">
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

							{currentStep < 4 ? (
								<button key="sidebar-next-btn" type="button" onClick={handleNextStep} disabled={checking} className="fluffy-saas-btn fluffy-saas-btn-primary mt-6 w-full py-3">
									{checking ? t('กำลังค้นหาช่องว่าง...', 'Checking...') : t('ขั้นตอนถัดไป', 'Next Step')}
									{!checking && <RiArrowRightLine size={18} aria-hidden="true" />}
								</button>
							) : (
								<button key="sidebar-submit-btn" type="submit" disabled={submitting} className="fluffy-saas-btn fluffy-saas-btn-primary mt-6 w-full py-3">
									{submitting ? t('กำลังดำเนินการ...', 'Submitting...') : t('ยืนยันการจอง', 'Confirm Booking')}
								</button>
							)}
						</div>
					</aside>
				</form>
				)}
			</div>

			<StatusModal modal={modal} onClose={() => setModal((prev) => ({ ...prev, open: false }))} />
		</div>
	);
}
