import { createRoot } from '@wordpress/element';
import '../styles/saas-theme.css';
import CarparkBooking from './CarparkBooking';
import RentcarBooking from './RentcarBooking';

document.addEventListener('DOMContentLoaded', () => {
	const rootEl = document.getElementById('fluffy-booking-root');
	if (!rootEl) {
		return;
	}
	const mode = rootEl.dataset.mode || 'carpark';
	createRoot(rootEl).render(mode === 'rentcar' ? <RentcarBooking /> : <CarparkBooking />);
});
