import {
	RiArrowLeftLine,
	RiArrowRightLine,
	RiCalendarLine,
	RiCarLine,
	RiCheckLine,
	RiArrowDownSLine,
	RiCloseLine,
	RiParkingBoxLine,
	RiListUnordered,
	RiLayoutGridLine,
	RiSubtractLine,
} from '@remixicon/react';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { t } from '../shared/i18n';
import { ParkingMapSkeleton } from '../shared/Skeleton';
import {
	buildParkingLayout,
	filterSpacesByLocation,
	getSpaceCode,
	isValidLicensePlate,
	validateCarSlotsForStep2,
} from './parkingMapUtils';
import { useCarparkStore } from './useCarparkStore';

const MOBILE_BREAKPOINT = 1024;

function formatBookingDate(date) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return date;
	}
	return new Intl.DateTimeFormat(t('th-TH', 'en-GB'), {
		day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
	}).format(new Date(date));
}

function getIsMobileViewport() {
	if (typeof window === 'undefined') {
		return false;
	}
	return window.innerWidth < MOBILE_BREAKPOINT;
}

export default function ParkingStep2({ onBack, onNext }) {
	const {
		startDate,
		startTime,
		endDate,
		endTime,
		location,
		vehicleTypes,
		spaces,
		occupiedIds,
		savedPlates,
		carSlots,
		activeCarIndex,
		hasChecked,
		checking,
		conditionError,
		loadError,
		slotConflicts,
		setActiveCarIndex,
		selectSpaceForCar,
		updateCarLicensePlate,
		checkAvailability,
	} = useCarparkStore();

	const [isMobile, setIsMobile] = useState(getIsMobileViewport);
	const [displayMode, setDisplayMode] = useState(() => (getIsMobileViewport() ? 'list' : 'map'));
	const sheetRef = useRef(null);
	const viewRef = useRef(null);
	const mapRef = useRef(null);
	const [selectedAreaId, setSelectedAreaId] = useState(null);
	const [expandedCarIndex, setExpandedCarIndex] = useState(0);
	const [sheetCarIndex, setSheetCarIndex] = useState(null);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}
		const handleResize = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const totalVehicles = carSlots.length;
	const selectedCount = useMemo(() => carSlots.filter((c) => Boolean(c.space)).length, [carSlots]);

	const filteredSpaces = useMemo(() => filterSpacesByLocation(spaces, location), [spaces, location]);
	const layout = useMemo(() => buildParkingLayout(filteredSpaces), [filteredSpaces]);
	const rowPairs = [];
	for (let index = 0; index < layout.rows.length; index += 2) {
		const rows = layout.rows.slice(index, index + 2);
		if (rows.some((row) => row.hasSpaces)) {
			rowPairs.push({
				rows,
				id: `fluffy-parking-area-${rows[0].y}`,
				label: rows.filter((row) => row.hasSpaces).map((row) => row.rowLabel || row.y).join('–'),
			});
		}
	}

	const occupiedSet = useMemo(() => new Set(occupiedIds.map((id) => Number(id))), [occupiedIds]);

	// Map space Post ID -> carIndex that currently holds it
	const assignedCarBySpaceId = useMemo(() => {
		const map = new Map();
		carSlots.forEach((car) => {
			if (car.space?.parking_post_id) {
				map.set(Number(car.space.parking_post_id), car.carIndex);
			}
		});
		return map;
	}, [carSlots]);

	const stats = useMemo(() => {
		const total = filteredSpaces.length;
		const occupied = filteredSpaces.filter((s) => occupiedSet.has(Number(s.id))).length;
		const available = Math.max(0, total - occupied);
		return { total, available, occupied };
	}, [filteredSpaces, occupiedSet]);

	const step2Validation = useMemo(
		() => validateCarSlotsForStep2(carSlots, totalVehicles, occupiedIds),
		[carSlots, totalVehicles, occupiedIds]
	);

	const locationLabel =
		location === 'DonMueangAirport'
			? t('สนามบินดอนเมือง', 'Don Mueang Airport')
			: t('สนามบินสุวรรณภูมิ', 'Suvarnabhumi Airport');

	const vehicleTypeLabelMap = useMemo(() => {
		const map = new Map();
		vehicleTypes.forEach((vt) => {
			map.set(String(vt.id), vt.title);
		});
		return map;
	}, [vehicleTypes]);

	const getVehicleLabel = (car) => {
		if (String(car.assignedVehicleType) === '1236' && car.otherTypeCar) {
			return car.otherTypeCar;
		}
		return vehicleTypeLabelMap.get(String(car.assignedVehicleType)) || t('รถยนต์', 'Vehicle');
	};

	const selectedArea = rowPairs.find((area) => area.id === selectedAreaId);
	const visibleAreas = selectedArea ? [selectedArea] : rowPairs;
	const areaSpaceIds = selectedArea
		? new Set(selectedArea.rows.flatMap((row) => row.cells.map(({ space }) => space?.id)))
		: null;
	const listSpaces = layout.sortedSpaces.filter((space) => (!areaSpaceIds || areaSpaceIds.has(space.id)) && !occupiedSet.has(Number(space.id)));

	const changeParkingArea = (id) => {
		setSelectedAreaId(id);
		mapRef.current?.scrollTo({ top: 0, left: 0 });
	};
	const progress = t(
		`เลือกแล้ว ${selectedCount} จาก ${totalVehicles} คัน`,
		`Selected ${selectedCount} of ${totalVehicles} vehicles`
	);
	const progressHint = selectedCount < totalVehicles
		? t(`เลือกช่องให้รถอีก ${totalVehicles - selectedCount} คัน`, `Pick spaces for ${totalVehicles - selectedCount} more vehicles`)
		: step2Validation.reason === 'missing_plate'
			? t(`กรอกทะเบียนรถคันที่ ${step2Validation.carIndex + 1}`, `Enter the plate for vehicle ${step2Validation.carIndex + 1}`)
			: '';

	const handleSelectSpace = (space) => {
		if (assignedCarBySpaceId.get(Number(space.id)) === activeCarIndex) {
			if (isMobile) {
				setSheetCarIndex(activeCarIndex);
			}
			return;
		}
		const result = selectSpaceForCar(space, activeCarIndex);
		if (result?.changed && result.action === 'selected') {
			const updatedCars = useCarparkStore.getState().carSlots;
			const selectionComplete = updatedCars.every((car) => car.space);
			const firstMissingPlate = selectionComplete && updatedCars.find((car) => !isValidLicensePlate(car.licensePlate));
			const carIndex = firstMissingPlate?.carIndex ?? result.carIndex;
			setExpandedCarIndex(carIndex);
			if (isMobile && selectionComplete) {
				setSheetCarIndex(carIndex);
			}
		}
	};

	const handleChangeSlotForCar = (carIdx) => {
		setActiveCarIndex(carIdx);
		setSheetCarIndex(null);
		viewRef.current?.focus({ preventScroll: true });
		viewRef.current?.scrollIntoView({ block: 'nearest' });
	};

	const finishPlate = () => {
		const nextPlate = carSlots.find((car) => car.space && !isValidLicensePlate(car.licensePlate));
		setSheetCarIndex(nextPlate?.carIndex ?? null);
	};

	const removeParkingSpace = (car) => {
		const result = selectSpaceForCar({ id: car.space.parking_post_id }, car.carIndex);
		if (result?.changed) {
			setActiveCarIndex(car.carIndex);
		}
	};

	useEffect(() => {
		const dialog = sheetRef.current;
		if (isMobile && sheetCarIndex !== null && dialog && !dialog.open) {
			dialog.showModal();
		}
	}, [isMobile, sheetCarIndex]);

	const renderSlotButton = (space) => {
		const postId = Number(space.id);
		const code = getSpaceCode(space).toUpperCase();
		const isOccupied = occupiedSet.has(postId);
		const assignedIdx = assignedCarBySpaceId.get(postId);
		const isSelectedForActive = assignedIdx === activeCarIndex;
		const isSelectedForOther = assignedIdx !== undefined && assignedIdx !== activeCarIndex;

		let stateClass = 'is-available';
		let ariaLabel = t(
			`ช่อง ${code} ว่าง กดเพื่อเลือกให้รถคันที่ ${activeCarIndex + 1}`,
			`Slot ${code} available, select for Vehicle ${activeCarIndex + 1}`
		);

		if (isOccupied) {
			stateClass = 'is-occupied';
			ariaLabel = t(`ช่อง ${code} ไม่ว่าง`, `Slot ${code} occupied`);
		} else if (isSelectedForActive) {
			stateClass = 'is-selected-active';
			ariaLabel = t(
				`ช่อง ${code} เลือกไว้ให้รถคันที่ ${activeCarIndex + 1}`,
				`Slot ${code} selected for Vehicle ${activeCarIndex + 1}`
			);
		} else if (isSelectedForOther) {
			stateClass = 'is-selected-other';
			ariaLabel = t(
				`ช่อง ${code} เลือกไว้ให้รถคันที่ ${assignedIdx + 1}`,
				`Slot ${code} selected for Vehicle ${assignedIdx + 1}`
			);
		}

		return (
			<button
				id={`fluffy-space-${postId}`}
				className={`fluffy-step2__slot ${stateClass}`}
				key={postId}
				type="button"
				disabled={isOccupied || isSelectedForOther}
				aria-pressed={isSelectedForActive}
				aria-label={ariaLabel}
				title={ariaLabel}
				onClick={() => handleSelectSpace(space)}
			>
				<span className="fluffy-step2__slot-code">{code}</span>
				{isOccupied && <RiSubtractLine size={16} aria-hidden="true" />}
				{!isOccupied && assignedIdx !== undefined && (
					<span className="fluffy-step2__slot-car-tag" aria-hidden="true">{assignedIdx + 1}</span>
				)}
			</button>
		);
	};

	const renderCarPlateControls = (car, idPrefix) => {
		const hasPlate = isValidLicensePlate(car.licensePlate);
		return (
			<div className="mt-2.5 space-y-2">
				<div>
					<label htmlFor={`${idPrefix}-plate-${car.carIndex}`} className="fluffy-saas-label !mb-1 !text-xs">
						{t('ทะเบียนรถ', 'License Plate')} *
					</label>
					<input
						id={`${idPrefix}-plate-${car.carIndex}`}
						className={`fluffy-saas-input !py-2 !text-sm ${!hasPlate && car.space ? 'border-amber-400' : ''}`}
						type="text"
						placeholder={t('กรอกทะเบียนรถ', 'Enter license plate')}
						value={car.licensePlate}
						onChange={(e) => updateCarLicensePlate(car.carIndex, e.target.value)}
					/>
					{!hasPlate && car.space && (
						<p className="mt-1 text-[11px] text-amber-700">
							{t('กรุณากรอกทะเบียนรถก่อนดำเนินการต่อ', 'Please enter license plate to continue')}
						</p>
					)}
				</div>
				{savedPlates.length > 0 && (
					<div>
						<label htmlFor={`${idPrefix}-saved-plate-${car.carIndex}`} className="sr-only">
							{t('เลือกจากทะเบียนที่บันทึกไว้', 'Pick saved license plate')}
						</label>
						<select
							id={`${idPrefix}-saved-plate-${car.carIndex}`}
							className="fluffy-saas-select !py-2 !text-xs"
							value=""
							onChange={(e) => {
								if (e.target.value) {
									updateCarLicensePlate(car.carIndex, e.target.value);
								}
							}}
						>
							<option value="">{t('เลือกจากทะเบียนที่บันทึกไว้', 'Pick saved license plate')}</option>
							{savedPlates.map((p) => (
								<option key={p.id} value={p.tabienrod_number}>
									{p.tabienrod_number}
								</option>
							))}
						</select>
					</div>
				)}
			</div>
		);
	};

	const isFullLot = hasChecked && !checking && !loadError && stats.total > 0 && stats.available === 0;
	const activeSheetCar = sheetCarIndex !== null ? carSlots[sheetCarIndex] : null;
	const activeCar = carSlots[activeCarIndex];

	return (
		<div id="fluffy-step2-root" className="fluffy-step2">
			<header id="fluffy-step2-header" className="fluffy-step2__header">
				<div className="fluffy-step2__header-top">
					<button className="fluffy-step2__header-back" type="button" aria-label={t('ย้อนกลับ', 'Back')} onClick={onBack}><RiArrowLeftLine size={24} aria-hidden="true" /></button>
					<h2 className="fluffy-step2__title">{t('เลือกช่องจอดรถ', 'Select Parking Space')}</h2>
				</div>
				<div id="fluffy-step2-context-bar" className="fluffy-step2__context-bar">
					<div className="fluffy-step2__schedule">
						<RiCalendarLine className="fluffy-step2__calendar" size={24} aria-hidden="true" />
						<div>
							<div className="fluffy-step2__dates">
								<span>{t('วันที่จอด', 'Drop-off')}: {formatBookingDate(startDate)} {startTime}</span>
								<span>{t('วันที่รับรถ', 'Pick-up')}: {formatBookingDate(endDate)} {endTime}</span>
							</div>
							<div className="fluffy-step2__airport">{locationLabel}</div>
						</div>
					</div>
					<strong id="fluffy-step2-progress-text" className="fluffy-step2__progress" aria-live="polite">{progress}</strong>
				</div>
				<div className="fluffy-step2__mobile-progress">
					<strong aria-live="polite">{progress}</strong>
					{activeCar && (
						<small>{t(`กำลังเลือกให้รถคันที่ ${activeCarIndex + 1}`, `Selecting for vehicle ${activeCarIndex + 1}`)} · {getVehicleLabel(activeCar)}</small>
					)}
				</div>
			</header>

			<div id="fluffy-step2-layout" className="fluffy-step2__layout">
				<section id="fluffy-parking-map-card" className="fluffy-step2__main-card">
					<div id="fluffy-step2-toolbar" className="fluffy-step2__toolbar" tabIndex={-1} ref={viewRef}>
						<div className="fluffy-step2__lot-heading">
							<h2>{t('ช่องจอดทั้งหมด', 'All parking spaces')}</h2>
							{hasChecked && !checking && (
								<p>{t(
									`ว่าง ${stats.available} จาก ${stats.total} ช่อง`,
									`${stats.available} of ${stats.total} spaces available`
								)}</p>
							)}
						</div>
						<div id="fluffy-step2-view-switch" className="fluffy-step2__view-switch" role="group" aria-label={t('มุมมองช่องจอด', 'Parking view')}>
							<button className="fluffy-step2__view-btn" type="button" aria-pressed={displayMode === 'map'} onClick={() => setDisplayMode('map')}><RiLayoutGridLine size={17} aria-hidden="true" />{t('ผัง', 'Map')}</button>
							<button className="fluffy-step2__view-btn" type="button" aria-pressed={displayMode === 'list'} onClick={() => setDisplayMode('list')}><RiListUnordered size={17} aria-hidden="true" />{t('รายการ', 'List')}</button>
						</div>
					</div>

					{layout.hasCoords && (
						<div className="fluffy-step2__area-links" role="group" aria-label={t('แถวช่องจอด', 'Parking rows')}>
							<button type="button" aria-pressed={!selectedArea} onClick={() => changeParkingArea(null)}>
								{t('ทุกแถว', 'All rows')}
							</button>
							{rowPairs.map(({ id, label }) => (
								<button key={id} type="button" aria-pressed={id === selectedArea?.id} onClick={() => changeParkingArea(id)}>
									{t(`แถว ${label}`, `Rows ${label}`)}
								</button>
							))}
						</div>
					)}

					{/* Slot Conflict Alert (mid-booking occupied or schedule/location change) */}
					{slotConflicts.length > 0 && (
						<div id="fluffy-step2-conflict-alert" className="fluffy-step2__alert is-warning" role="alert">
							<p className="m-0 font-semibold">
								{t('ช่องจอดที่เลือกไว้ก่อนหน้าไม่พร้อมใช้งานแล้ว', 'Previously selected space(s) are no longer available')}
							</p>
							<ul className="mt-1 list-disc pl-5 text-xs">
								{slotConflicts.map((c, idx) => (
									<li key={`${c.carIndex}-${idx}`}>
										{c.reason === 'occupied'
											? t(
													`ช่อง ${c.spaceCode} ไม่ว่างแล้ว กรุณาเลือกช่องใหม่ให้รถคันที่ ${c.carIndex + 1} (ระบบเก็บทะเบียนรถไว้ให้แล้ว)`,
													`Slot ${c.spaceCode} is now occupied. Please choose a new slot for Vehicle ${c.carIndex + 1} (license plate preserved).`
											  )
											: t(
													`ช่อง ${c.spaceCode} ไม่อยู่ในลานที่เลือก กรุณาเลือกช่องใหม่ให้รถคันที่ ${c.carIndex + 1}`,
													`Slot ${c.spaceCode} is not in the selected location. Please choose a new slot for Vehicle ${c.carIndex + 1}.`
											  )}
									</li>
								))}
							</ul>
						</div>
					)}

					{isFullLot && (
						<div id="fluffy-step2-full-lot" className="fluffy-step2__empty-state" role="status">
							<p className="text-base font-semibold text-[#0F2D52]">
								{t('ช่องจอดเต็มทั้งหมดในช่วงเวลาที่เลือก', 'All parking spaces are full for the selected schedule')}
							</p>
							<p className="mt-1 text-xs text-[#64748B]">
								{locationLabel} ({startDate} {startTime} – {endDate} {endTime})
							</p>
							<button
								id="fluffy-step2-full-back"
								className="fluffy-saas-btn fluffy-saas-btn-primary mt-4"
								type="button"
								onClick={onBack}
							>
								<RiArrowLeftLine size={16} aria-hidden="true" /> {t('กลับไปแก้วันเวลา', 'Change Date & Time')}
							</button>
						</div>
					)}

					{/* Loading / Error / Full / Empty / Map / List Body */}
					{checking ? (
						<div id="fluffy-step2-loading" className="space-y-4 py-2" role="status" aria-live="polite">
							<div className="flex items-center gap-2 text-sm font-semibold text-[#0F2D52]">
								<span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--fluffy-primary)] border-t-transparent" />
								<span>{t('กำลังตรวจสอบช่องว่าง', 'Checking parking availability...')}</span>
							</div>
							<ParkingMapSkeleton />
						</div>
					) : loadError ? (
						<div id="fluffy-step2-error" className="fluffy-step2__empty-state is-error" role="alert">
							<p className="text-sm font-semibold text-red-700">{t('ไม่สามารถโหลดข้อมูลช่องจอดได้', 'Failed to load parking spaces')}</p>
							<p className="mt-1 text-xs text-red-600">{loadError}</p>
							<button
								id="fluffy-step2-retry-btn"
								className="fluffy-saas-btn fluffy-saas-btn-primary mt-4"
								type="button"
								onClick={() => checkAvailability()}
							>
								{t('ลองอีกครั้ง', 'Try Again')}
							</button>
						</div>
					) : !hasChecked ? (
						<div id="fluffy-step2-unchecked" className="fluffy-step2__empty-state">
							<p className="text-sm text-[#475569]">
								{conditionError
									? conditionError.message
									: t('กรุณาเลือกวันเวลาและสถานที่จากขั้นตอนที่ 1 ก่อนเลือกช่องจอด', 'Please select schedule and location in Step 1 first.')}
							</p>
							<button
								id="fluffy-step2-goto-step1"
								className="fluffy-saas-btn fluffy-saas-btn-secondary mt-3"
								type="button"
								onClick={onBack}
							>
								<RiArrowLeftLine size={16} aria-hidden="true" /> {t('กลับไปแก้วันเวลา', 'Back to Schedule')}
							</button>
						</div>
					) : stats.total === 0 ? (
						<div id="fluffy-step2-no-spaces" className="fluffy-step2__empty-state">
							<p className="text-sm font-semibold text-[#0F2D52]">{t('ไม่พบช่องจอดในสถานที่นี้', 'No parking spaces found for this location')}</p>
							<button
								id="fluffy-step2-empty-back"
								className="fluffy-saas-btn fluffy-saas-btn-secondary mt-3"
								type="button"
								onClick={onBack}
							>
								<RiArrowLeftLine size={16} aria-hidden="true" /> {t('กลับไปเปลี่ยนสถานที่', 'Change Location')}
							</button>
						</div>
					) : displayMode === 'map' ? (
						<div id="fluffy-step2-map-view" className="fluffy-step2__map-frame">
							{layout.hasCoords && (
								<p id="fluffy-step2-map-hint" className="fluffy-step2__map-hint">
									{t('เลื่อนผังซ้าย–ขวาเพื่อดูช่องเพิ่มเติม', 'Scroll the map sideways to see more spaces')}
								</p>
							)}
							<div
								id="fluffy-step2-map-scroll"
								className="fluffy-step2__map-scroll"
								ref={mapRef}
								role="region"
								tabIndex={0}
								aria-label={t('ผังช่องจอดทุกแถว', 'Map of all parking rows')}
							>
								{layout.hasCoords ? (
									<div id="parking-grid-container" className="fluffy-step2__map-rows" style={{ '--fluffy-step2-columns': layout.cols }}>
										{visibleAreas.map(({ rows, id, label }) => (
											<section key={id} className="fluffy-step2__parking-area" aria-labelledby={id}>
												<h3 id={id} className="fluffy-step2__area-heading" tabIndex={-1}>{t(`แถว ${label}`, `Rows ${label}`)}</h3>
												<div className="fluffy-step2__lot-ground">
													<div className="fluffy-step2__lot-road">
														{rows.map((row, index) => {
															const rowLabel = row.rowLabel || row.y;
															return (
																<div key={row.y}>
																	{index > 0 && <div className="fluffy-step2__drive-aisle" aria-hidden="true" />}
																	{row.hasSpaces ? (
																		<div className="fluffy-step2__row-cells" role="group" aria-label={t(`แถว ${rowLabel}`, `Row ${rowLabel}`)}>
																			<span className="fluffy-step2__row-label" aria-hidden="true">{rowLabel}</span>
																			{row.cells.map((cell) => cell.space ? renderSlotButton(cell.space) : (
																				<span key={cell.x} className="fluffy-step2__slot-gap" aria-hidden="true" />
																			))}
																		</div>
																	) : <div className="fluffy-step2__empty-row" aria-hidden="true" />}
																</div>
															);
														})}
														<div className="fluffy-step2__drive-aisle fluffy-step2__drive-aisle--outer" aria-hidden="true" />
													</div>
												</div>
											</section>
										))}
									</div>
								) : (
									<div id="fluffy-step2-code-grid" className="fluffy-step2__code-grid">
										{layout.sortedSpaces.map(renderSlotButton)}
									</div>
								)}
							</div>
							{!selectedArea && layout.hasCoords && layout.unpositioned.length > 0 && (
								<div id="fluffy-step2-unpositioned" className="fluffy-step2__unpositioned">
									<h3>{t('ช่องจอดที่ยังไม่ได้จัดตำแหน่ง', 'Unpositioned parking spaces')}</h3>
									<div className="fluffy-step2__code-grid">{layout.unpositioned.map(renderSlotButton)}</div>
								</div>
							)}
							<div id="fluffy-step2-legend" className="fluffy-step2__legend">
								<strong>{t('สถานะช่องจอด', 'Space status')}:</strong>
								<span><i className="fluffy-step2__legend-swatch is-available" />{t('ว่าง (เลือกได้)', 'Available')}</span>
								<span><i className="fluffy-step2__legend-swatch is-occupied" />{t('ไม่ว่าง', 'Unavailable')}</span>
								<span><span className="fluffy-step2__legend-swatch is-selected-active"><RiCheckLine size={16} aria-hidden="true" /></span>{t('เลือกแล้ว', 'Selected')}</span>
								{totalVehicles > 1 && (
									<span><i className="fluffy-step2__legend-swatch is-selected-other" />{t('รถคันอื่น', 'Other vehicle')}</span>
								)}
							</div>
							{listSpaces.length === 0 && <p className="fluffy-step2__empty-state">{t('ไม่มีช่องว่างสำหรับรถคันนี้', 'No spaces available for this vehicle')}</p>}
						</div>
					) : (
						<div id="fluffy-step2-list-view">
							<h2 className="fluffy-step2__list-title">
								{selectedArea ? t(`ช่องว่างแถว ${selectedArea.label}`, `Available spaces in rows ${selectedArea.label}`) : t('ช่องว่างทุกแถว', 'Available spaces in all rows')}
							</h2>
							{listSpaces.length === 0 ? (
								<p className="fluffy-step2__empty-state">{t('ไม่มีช่องว่างสำหรับรถคันนี้', 'No spaces available for this vehicle')}</p>
							) : (
								<div id="fluffy-step2-list-items" className="fluffy-step2__list-items" key={selectedArea?.id}>
									{listSpaces.map((space) => {
										const postId = Number(space.id);
										const assignedCar = assignedCarBySpaceId.get(postId);
										const selected = assignedCar !== undefined;
										const selectedForOther = selected && assignedCar !== activeCarIndex;
										return (
											<button
												id={`fluffy-list-space-${postId}`}
												className={`fluffy-step2__list-row ${selected ? 'is-selected-active' : 'is-available'}`}
												key={postId}
												type="button"
												aria-pressed={selected}
												disabled={selectedForOther}
												onClick={() => handleSelectSpace(space)}
											>
												<span className="fluffy-step2__list-icon"><RiParkingBoxLine size={21} aria-hidden="true" /></span>
												<strong className="fluffy-step2__list-code">{getSpaceCode(space).toUpperCase()}</strong>
												<span className="fluffy-step2__list-status">{selected ? t('เลือกแล้ว', 'Selected') : t('ว่าง (เลือกได้)', 'Available')}</span>
												<span className="fluffy-step2__list-indicator" aria-hidden="true">{selected && <RiCheckLine size={17} />}</span>
											</button>
										);
									})}
								</div>
							)}
						</div>
					)}
				</section>

				<aside id="fluffy-step2-vehicles-panel" className="fluffy-step2__vehicles-panel">
					<details className="fluffy-step2__vehicles-card" key={isMobile ? 'mobile' : 'desktop'} open={!isMobile}>
						<summary
							className="fluffy-step2__vehicles-heading"
							tabIndex={isMobile ? undefined : -1}
							onClick={(event) => {
								if (!isMobile) {
									event.preventDefault();
								}
							}}
						>
							{t('รถของคุณ', 'Your Vehicles')}
						</summary>
						<div id="fluffy-step2-car-list" className="fluffy-step2__car-list">
							{carSlots.map((car) => {
								const isActive = car.carIndex === activeCarIndex;
								const carNum = car.carIndex + 1;
								const isExpanded = expandedCarIndex === car.carIndex;
								const panelId = `fluffy-step2-car-details-${car.carIndex}`;
								return (
									<div id={`fluffy-step2-car-card-${car.carIndex}`} className={`fluffy-step2__car-card ${isActive ? 'is-active' : ''}`} key={car.carIndex}>
										<h3 className="fluffy-step2__car-heading">
											<button type="button" aria-expanded={isExpanded} aria-controls={panelId} onClick={() => setExpandedCarIndex(isExpanded ? null : car.carIndex)}>
												<span><RiCarLine size={17} aria-hidden="true" />{t(`รถคันที่ ${carNum}`, `Vehicle ${carNum}`)}</span>
												{car.space && <strong>{car.space.title.toUpperCase()}</strong>}
												<RiArrowDownSLine className="fluffy-step2__car-chevron" size={20} aria-hidden="true" />
											</button>
										</h3>
										<div id={panelId} className="fluffy-step2__car-details" hidden={!isExpanded}>
											<p className="fluffy-step2__car-type">{getVehicleLabel(car)}</p>
											{car.space ? (
												<>
													{isMobile ? (
														<button className="fluffy-step2__text-button" type="button" onClick={() => setSheetCarIndex(car.carIndex)}>
															{car.licensePlate.trim() ? t(`แก้ทะเบียน ${car.licensePlate}`, `Edit plate ${car.licensePlate}`) : t('กรอกทะเบียนรถ', 'Enter license plate')}
														</button>
													) : renderCarPlateControls(car, 'desktop')}
													<div className="fluffy-step2__car-actions">
														<button className="fluffy-step2__text-button" type="button" onClick={() => handleChangeSlotForCar(car.carIndex)}>{t('เปลี่ยนช่อง', 'Change space')}</button>
														<button className="fluffy-step2__text-button" type="button" onClick={() => removeParkingSpace(car)}>{t('ยกเลิกช่อง', 'Remove space')}</button>
													</div>
												</>
											) : (
												<button className="fluffy-step2__unassigned" type="button" aria-pressed={isActive} onClick={() => handleChangeSlotForCar(car.carIndex)}>
													{t('ยังไม่เลือกช่องจอด', 'No space selected')}
													<small>{isActive ? t('เลือกช่องก่อนกรอกทะเบียน', 'Choose a space to enter the plate') : t('เลือกช่องจอด', 'Pick a space')}</small>
												</button>
											)}
										</div>
									</div>
								);
							})}
						</div>
						<div id="fluffy-step2-desktop-actions" className="fluffy-step2__desktop-actions">
							<button className="fluffy-step2__text-button" type="button" onClick={onBack}><RiArrowLeftLine size={16} aria-hidden="true" /> {t('ย้อนกลับ', 'Back')}</button>
							<button id="fluffy-step2-next-btn" className="fluffy-step2__next" type="button" disabled={checking || !!loadError || !step2Validation.valid} onClick={onNext}>
								{checking ? t('กำลังตรวจสอบ…', 'Checking…') : t('ถัดไป', 'Next')}
								{!checking && <RiArrowRightLine size={20} aria-hidden="true" />}
							</button>
						</div>
					</details>
				</aside>
			</div>

			{isMobile && activeSheetCar && (
				<dialog
					id="fluffy-step2-mobile-sheet"
					className="fluffy-step2__sheet"
					ref={sheetRef}
					aria-labelledby="fluffy-step2-sheet-title"
					onClose={() => setSheetCarIndex(null)}
					onClick={(event) => {
						if (event.target === event.currentTarget) {
							const bounds = event.currentTarget.getBoundingClientRect();
							if (event.clientY < bounds.top) {
								setSheetCarIndex(null);
							}
						}
					}}
				>
					<div className="flex items-center justify-between gap-3">
						<h2 id="fluffy-step2-sheet-title">
							{t(`รถคันที่ ${activeSheetCar.carIndex + 1}`, `Vehicle ${activeSheetCar.carIndex + 1}`)} · {activeSheetCar.space?.title.toUpperCase()}
						</h2>
						<button className="fluffy-step2__sheet-close" type="button" aria-label={t('ปิดหน้าต่าง', 'Close')} onClick={() => setSheetCarIndex(null)}><RiCloseLine size={22} aria-hidden="true" /></button>
					</div>
					{renderCarPlateControls(activeSheetCar, 'mobile-sheet')}
					<button className="fluffy-step2__next mt-4 w-full" type="button" disabled={!isValidLicensePlate(activeSheetCar.licensePlate)} onClick={finishPlate}>
						{t('บันทึกทะเบียน', 'Save license plate')}
					</button>
				</dialog>
			)}

			<div id="fluffy-step2-mobile-bar" className="fluffy-step2__mobile-bar">
				<div>
					<strong>{progress}</strong>
					{progressHint && <small>{progressHint}</small>}
				</div>
				<button id="fluffy-step2-mobile-next" className="fluffy-step2__next" type="button" disabled={checking || !!loadError || !step2Validation.valid} onClick={onNext}>
					{checking ? t('กำลังตรวจ…', 'Checking…') : t('ถัดไป', 'Next')}
					{!checking && <RiArrowRightLine size={20} aria-hidden="true" />}
				</button>
			</div>
		</div>
	);
}
