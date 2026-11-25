import { createRoot } from '@wordpress/element';
import '../styles/saas-theme.css';
import CheckInOutApp from './CheckInOutApp';
import ServiceControlApp from './ServiceControlApp';
import CreateDriverJobApp from './CreateDriverJobApp';
import ThankYouApp from './ThankYouApp';

document.addEventListener('DOMContentLoaded', () => {
	const rootEl = document.getElementById('fluffy-operations-root');
	if (!rootEl) {
		return;
	}
	const mode = rootEl.dataset.mode || 'service-control';
	let node = <ServiceControlApp />;
	if (mode === 'checkin' || mode === 'checkout') {
		node = <CheckInOutApp mode={mode} />;
	} else if (mode === 'driver-job') {
		node = <CreateDriverJobApp />;
	} else if (mode === 'thank-you') {
		node = <ThankYouApp />;
	}
	createRoot(rootEl).render(node);
});
