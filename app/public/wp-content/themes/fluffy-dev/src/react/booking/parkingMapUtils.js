/**
 * Pure utilities for Step 2 parking space filtering, coordinate grid layout,
 * unpositioned/duplicate handling, natural sorting, and validation.
 */

export function getSpaceCode(space) {
	if (!space) {
		return '';
	}
	const title = String(space.title ?? '').trim();
	if (title) {
		return title;
	}
	const parkingId = String(space.parking_id ?? '').trim();
	if (parkingId) {
		return parkingId;
	}
	return `Space #${space.id}`;
}

export function compareSpaceCodes(a, b) {
	return String(a || '').localeCompare(String(b || ''), undefined, {
		numeric: true,
		sensitivity: 'base',
	});
}

export function compareSpaces(a, b) {
	const cmp = compareSpaceCodes(getSpaceCode(a), getSpaceCode(b));
	if (cmp !== 0) {
		return cmp;
	}
	return Number(a?.id || 0) - Number(b?.id || 0);
}

/**
 * Parse a coordinate value strictly.
 * - 0 is valid.
 * - null, undefined, empty/whitespace string, booleans, NaN, floats, and negatives return null.
 */
export function parseCoord(val) {
	if (val === null || val === undefined || typeof val === 'boolean') {
		return null;
	}
	if (typeof val === 'string') {
		const trimmed = val.trim();
		if (trimmed === '') {
			return null;
		}
		const num = Number(trimmed);
		return Number.isFinite(num) && Number.isInteger(num) && num >= 0 ? num : null;
	}
	if (typeof val === 'number') {
		return Number.isFinite(val) && Number.isInteger(val) && val >= 0 ? val : null;
	}
	return null;
}

function normalizeLocationToken(val) {
	const raw = String(val || '').trim();
	if (!raw) {
		return '';
	}
	// Map Thai airport names to canonical ASCII tokens if slug is absent
	if (raw.includes('สุวรรณภูมิ')) {
		return 'suvarnabhumi';
	}
	if (raw.includes('ดอนเมือง')) {
		return 'donmueang';
	}
	return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Filter parking_space items by the selected location (slug, name, or term ID).
 * Never leaks spaces belonging to a different location.
 */
export function filterSpacesByLocation(spaces, location) {
	if (!Array.isArray(spaces)) {
		return [];
	}
	if (location === null || location === undefined || String(location).trim() === '') {
		return spaces;
	}

	const rawTarget = String(location).trim();
	const targetNorm = normalizeLocationToken(rawTarget).replace(/airport$/i, '');

	return spaces.filter((space) => {
		const loc = space?.location;
		if (!loc) {
			return false;
		}
		if (loc.id !== undefined && loc.id !== null && String(loc.id) !== '' && String(loc.id) === rawTarget) {
			return true;
		}

		const slugNorm = normalizeLocationToken(loc.slug).replace(/airport$/i, '');
		const nameNorm = normalizeLocationToken(loc.name).replace(/airport$/i, '');

		if (!slugNorm && !nameNorm) {
			return false;
		}
		if (slugNorm && (slugNorm === targetNorm || slugNorm.includes(targetNorm) || targetNorm.includes(slugNorm))) {
			return true;
		}
		if (nameNorm && (nameNorm === targetNorm || nameNorm.includes(targetNorm) || targetNorm.includes(nameNorm))) {
			return true;
		}
		return false;
	});
}

function extractRowPrefix(code) {
	const match = String(code || '').trim().match(/^([A-Za-z]+)\d+$/);
	return match ? match[1].toUpperCase() : null;
}

/**
 * Build coordinate-based parking layout from filtered WordPress spaces.
 * - Uses position.x as column and position.y as row (0 is valid).
 * - Preserves empty gaps between coordinates (e.g. x=1 and x=3 leaves x=2 empty).
 * - Spaces with missing/invalid coordinates OR colliding duplicate coordinates
 *   go into `unpositioned` (sorted naturally) so they remain selectable.
 * - If the entire lot has no valid coordinates, `hasCoords` is false and
 *   `sortedSpaces` provides the natural code-sorted list (A1, A2, A10).
 * - Row labels (A, B, C) are attached only when every non-empty row consistently
 *   uses a single alphabetic prefix.
 */
export function buildParkingLayout(filteredSpaces) {
	const safeSpaces = Array.isArray(filteredSpaces) ? filteredSpaces : [];
	const sortedSpaces = [...safeSpaces].sort(compareSpaces);

	const validCandidates = [];
	const invalidSpaces = [];

	safeSpaces.forEach((space) => {
		const x = parseCoord(space?.position?.x);
		const y = parseCoord(space?.position?.y);
		if (x !== null && y !== null) {
			validCandidates.push({ space, x, y });
		} else {
			invalidSpaces.push(space);
		}
	});

	if (validCandidates.length === 0) {
		return {
			hasCoords: false,
			cols: 0,
			minX: 0,
			maxX: 0,
			minY: 0,
			maxY: 0,
			rows: [],
			unpositioned: [],
			sortedSpaces,
			hasConsistentRowLabels: false,
		};
	}

	// Detect duplicate coordinates
	const coordBuckets = new Map();
	validCandidates.forEach((entry) => {
		const key = `${entry.x},${entry.y}`;
		if (!coordBuckets.has(key)) {
			coordBuckets.set(key, []);
		}
		coordBuckets.get(key).push(entry);
	});

	const placed = [];
	const duplicateSpaces = [];

	coordBuckets.forEach((entries) => {
		if (entries.length === 1) {
			placed.push(entries[0]);
		} else {
			entries.forEach((e) => duplicateSpaces.push(e.space));
		}
	});

	const unpositioned = [...invalidSpaces, ...duplicateSpaces].sort(compareSpaces);

	if (placed.length === 0) {
		return {
			hasCoords: false,
			cols: 0,
			minX: 0,
			maxX: 0,
			minY: 0,
			maxY: 0,
			rows: [],
			unpositioned,
			sortedSpaces,
			hasConsistentRowLabels: false,
		};
	}

	let minX = placed[0].x;
	let maxX = placed[0].x;
	let minY = placed[0].y;
	let maxY = placed[0].y;

	const coordMap = new Map();
	placed.forEach((entry) => {
		if (entry.x < minX) minX = entry.x;
		if (entry.x > maxX) maxX = entry.x;
		if (entry.y < minY) minY = entry.y;
		if (entry.y > maxY) maxY = entry.y;
		coordMap.set(`${entry.x},${entry.y}`, entry.space);
	});

	const rawRows = [];
	for (let y = minY; y <= maxY; y++) {
		const cells = [];
		const rowSpaces = [];
		for (let x = minX; x <= maxX; x++) {
			const space = coordMap.get(`${x},${y}`) || null;
			cells.push({ x, y, space });
			if (space) {
				rowSpaces.push(space);
			}
		}
		let rowPrefix = null;
		if (rowSpaces.length > 0) {
			const prefixes = new Set(rowSpaces.map((s) => extractRowPrefix(getSpaceCode(s))));
			if (prefixes.size === 1 && !prefixes.has(null)) {
				rowPrefix = [...prefixes][0];
			}
		}
		rawRows.push({
			y,
			cells,
			hasSpaces: rowSpaces.length > 0,
			candidateLabel: rowPrefix,
		});
	}

	const nonEmptyRows = rawRows.filter((r) => r.hasSpaces);
	const hasConsistentRowLabels =
		nonEmptyRows.length > 0 && nonEmptyRows.every((r) => r.candidateLabel !== null);

	const rows = rawRows.map((r) => ({
		y: r.y,
		cells: r.cells,
		hasSpaces: r.hasSpaces,
		rowLabel: hasConsistentRowLabels ? r.candidateLabel : null,
	}));

	return {
		hasCoords: true,
		cols: maxX - minX + 1,
		minX,
		maxX,
		minY,
		maxY,
		rows,
		unpositioned,
		sortedSpaces,
		hasConsistentRowLabels,
	};
}

/**
 * Validate license plate using existing system rule (non-empty trimmed string).
 */
export function isValidLicensePlate(value) {
	return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate whether all car slots are ready to proceed from Step 2 to Step 3.
 */
export function validateCarSlotsForStep2(carSlots, totalVehicles, occupiedIds = []) {
	if (!Array.isArray(carSlots) || totalVehicles <= 0 || carSlots.length !== totalVehicles) {
		return { valid: false, reason: 'incomplete_cars' };
	}
	const seenPostIds = new Set();
	for (let i = 0; i < carSlots.length; i++) {
		const car = carSlots[i];
		const postId = Number(car?.space?.parking_post_id || 0);
		if (!postId) {
			return { valid: false, reason: 'missing_space', carIndex: i };
		}
		if (seenPostIds.has(postId)) {
			return { valid: false, reason: 'duplicate_space', carIndex: i };
		}
		if (occupiedIds.includes(postId)) {
			return { valid: false, reason: 'occupied_space', carIndex: i };
		}
		seenPostIds.add(postId);
		if (!isValidLicensePlate(car.licensePlate)) {
			return { valid: false, reason: 'missing_plate', carIndex: i };
		}
	}
	return { valid: true, reason: null };
}
