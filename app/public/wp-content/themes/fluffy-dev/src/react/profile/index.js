import { createRoot } from '@wordpress/element';
import '../styles/saas-theme.css';
import CustomerProfile from './CustomerProfile';
import DriverProfile from './DriverProfile';

document.addEventListener('DOMContentLoaded', () => {
	const rootEl = document.getElementById('fluffy-profile-root');
	if (!rootEl) {
		return;
	}
	const mode = rootEl.dataset.mode || 'customer';
	createRoot(rootEl).render(mode === 'driver' ? <DriverProfile /> : <CustomerProfile />);
});
