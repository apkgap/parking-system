import { useEffect, useRef, useState } from '@wordpress/element';
import { DayPicker } from 'react-day-picker';
import { format, isValid, parseISO } from 'date-fns';
import { th as thLocale } from 'date-fns/locale/th';
import { enUS as enLocale } from 'date-fns/locale/en-US';
import 'react-day-picker/style.css';
import { getConfig } from './api';

function formatDisplayDate(isoStr, lang) {
	if (!isoStr) {
		return '';
	}
	const parsed = parseISO(isoStr);
	if (!isValid(parsed)) {
		return isoStr;
	}
	if (lang === 'th') {
		const dayMonth = format(parsed, 'd MMM', { locale: thLocale });
		const beYear = parsed.getFullYear() + 543;
		return `${dayMonth} ${beYear}`;
	}
	return format(parsed, 'dd MMM yyyy', { locale: enLocale });
}

export default function DatePickerField({
	id,
	value,
	onChange,
	placeholder = '',
	minDate = null,
	disabledRanges = [],
	required = false,
}) {
	const { lang } = getConfig();
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef(null);

	const selectedDate = value ? parseISO(value) : undefined;
	const validSelected = selectedDate && isValid(selectedDate) ? selectedDate : undefined;

	useEffect(() => {
		const handleOutside = (e) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		const handleEsc = (e) => {
			if (e.key === 'Escape') {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handleOutside);
		document.addEventListener('keydown', handleEsc);
		return () => {
			document.removeEventListener('mousedown', handleOutside);
			document.removeEventListener('keydown', handleEsc);
		};
	}, []);

	const disabledMatchers = [];
	if (minDate) {
		disabledMatchers.push({ before: minDate });
	}
	(disabledRanges || []).forEach((range) => {
		if (range?.start_date && range?.end_date) {
			const from = parseISO(range.start_date);
			const to = parseISO(range.end_date);
			if (isValid(from) && isValid(to)) {
				disabledMatchers.push({ from, to });
			}
		}
	});

	const handleSelect = (day) => {
		if (!day) {
			return;
		}
		onChange(format(day, 'yyyy-MM-dd'));
		setOpen(false);
	};

	const displayText = formatDisplayDate(value, lang);

	return (
		<div id={`${id}-wrapper`} className="fluffy-datepicker" ref={wrapperRef}>
			{/* Hidden native input keeps HTML form required validation working */}
			<input type="hidden" name={id} value={value || ''} required={required} />
			<button
				id={id}
				className={`fluffy-datepicker__trigger ${open ? 'is-open' : ''}`}
				type="button"
				aria-expanded={open ? 'true' : 'false'}
				onClick={() => setOpen((prev) => !prev)}
			>
				<span className={displayText ? 'fluffy-datepicker__value' : 'fluffy-datepicker__placeholder'}>
					{displayText || placeholder || (lang === 'th' ? 'เลือกวันที่' : 'Select date')}
				</span>
				<svg className="h-4 w-4 shrink-0 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
					<line x1="16" y1="2" x2="16" y2="6" />
					<line x1="8" y1="2" x2="8" y2="6" />
					<line x1="3" y1="10" x2="21" y2="10" />
				</svg>
			</button>

			{open && (
				<div id={`${id}-popover`} className="fluffy-datepicker__popover">
					<DayPicker
						mode="single"
						selected={validSelected}
						defaultMonth={validSelected || minDate || new Date()}
						onSelect={handleSelect}
						locale={lang === 'th' ? thLocale : enLocale}
						disabled={disabledMatchers}
						showOutsideDays
					/>
				</div>
			)}
		</div>
	);
}
