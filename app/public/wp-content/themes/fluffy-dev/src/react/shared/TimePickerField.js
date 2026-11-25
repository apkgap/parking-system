import { useEffect, useRef, useState } from '@wordpress/element';
import { getConfig } from './api';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export default function TimePickerField({
	id,
	value,
	onChange,
	placeholder = '',
	required = false,
}) {
	const { lang } = getConfig();
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef(null);

	const parts = String(value || '').split(':');
	const selectedHour = parts[0] && HOURS.includes(parts[0]) ? parts[0] : '';
	const selectedMinute = parts[1] ? parts[1].slice(0, 2) : '';

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

	const selectHour = (h) => {
		const m = selectedMinute || '00';
		onChange(`${h}:${m}`);
	};

	const selectMinute = (m) => {
		const h = selectedHour || '09';
		onChange(`${h}:${m}`);
		setOpen(false);
	};

	return (
		<div id={`${id}-wrapper`} className="fluffy-timepicker" ref={wrapperRef}>
			<input type="hidden" name={id} value={value || ''} required={required} />
			<button
				id={id}
				className={`fluffy-datepicker__trigger ${open ? 'is-open' : ''}`}
				type="button"
				aria-expanded={open ? 'true' : 'false'}
				onClick={() => setOpen((prev) => !prev)}
			>
				<span className={value ? 'fluffy-datepicker__value' : 'fluffy-datepicker__placeholder'}>
					{value ? `${value} ${lang === 'th' ? 'น.' : ''}`.trim() : placeholder || (lang === 'th' ? 'เลือกเวลา' : 'Select time')}
				</span>
				<svg className="h-4 w-4 shrink-0 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
					<circle cx="12" cy="12" r="9" />
					<polyline points="12 7 12 12 15 15" />
				</svg>
			</button>

			{open && (
				<div id={`${id}-popover`} className="fluffy-timepicker__popover">
					<div className="fluffy-timepicker__cols">
						<div className="fluffy-timepicker__col">
							<div className="fluffy-timepicker__head">{lang === 'th' ? 'ชั่วโมง' : 'Hour'}</div>
							<div className="fluffy-timepicker__list">
								{HOURS.map((h) => (
									<button
										type="button"
										key={h}
										onClick={() => selectHour(h)}
										className={`fluffy-timepicker__opt ${selectedHour === h ? 'is-active' : ''}`}
									>
										{h}
									</button>
								))}
							</div>
						</div>
						<div className="fluffy-timepicker__col">
							<div className="fluffy-timepicker__head">{lang === 'th' ? 'นาที' : 'Min'}</div>
							<div className="fluffy-timepicker__list">
								{MINUTES.map((m) => (
									<button
										type="button"
										key={m}
										onClick={() => selectMinute(m)}
										className={`fluffy-timepicker__opt ${selectedMinute === m ? 'is-active' : ''}`}
									>
										{m}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
