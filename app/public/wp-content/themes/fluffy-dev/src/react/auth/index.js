import { createRoot, useState } from '@wordpress/element';
import '../styles/saas-theme.css';
import StatusModal from '../shared/StatusModal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

function AuthApp({ mode }) {
	const [modal, setModal] = useState({ open: false, type: 'success', title: '', message: '' });

	const onNotify = (type, title, message) => {
		setModal({ open: true, type, title, message });
	};

	return (
		<>
			{mode === 'register' && <RegisterForm onNotify={onNotify} />}
			{mode === 'forgot-password' && <ForgotPasswordForm onNotify={onNotify} />}
			{mode !== 'register' && mode !== 'forgot-password' && <LoginForm onNotify={onNotify} />}
			<StatusModal modal={modal} onClose={() => setModal((prev) => ({ ...prev, open: false }))} />
		</>
	);
}

document.addEventListener('DOMContentLoaded', () => {
	const rootEl = document.getElementById('fluffy-auth-root');
	if (!rootEl) {
		return;
	}
	const mode = rootEl.dataset.mode || 'login';
	createRoot(rootEl).render(<AuthApp mode={mode} />);
});
