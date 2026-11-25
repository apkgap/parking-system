import { useState } from '@wordpress/element';
import { getConfig, wpAjax } from '../shared/api';
import { t } from '../shared/i18n';

export default function RegisterForm({ onNotify }) {
	const config = getConfig();
	const [form, setForm] = useState({
		first_name: '',
		last_name: '',
		email: '',
		phone: '',
		username: '',
		password: '',
		confirm_password: '',
	});
	const [loading, setLoading] = useState(false);

	const updateField = (key, value) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (form.password.length < 8) {
			onNotify('error', t('รหัสผ่านสั้นเกินไป', 'Weak Password'), t('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', 'Password must be at least 8 characters.'));
			return;
		}
		if (form.password !== form.confirm_password) {
			onNotify('error', t('รหัสผ่านไม่ตรงกัน', 'Mismatch'), t('กรุณายืนยันรหัสผ่านให้ตรงกัน', 'Passwords do not match.'));
			return;
		}

		setLoading(true);
		try {
			const data = await wpAjax('user_registration', {
				registration_nonce: config.nonces.register,
				first_name: form.first_name.trim(),
				last_name: form.last_name.trim(),
				email: form.email.trim(),
				phone: form.phone.trim(),
				username: form.username.trim(),
				password: form.password,
			});
			onNotify('success', t('สมัครสมาชิกสำเร็จ', 'Account Created'), data?.message || t('กำลังเข้าสู่ระบบ...', 'Redirecting...'));
			setTimeout(() => {
				window.location.href = `${config.homeUrl}profile/`;
			}, 1200);
		} catch (err) {
			onNotify('error', t('สมัครสมาชิกไม่สำเร็จ', 'Registration Failed'), err.message.replace(/<br\s*\/?>/gi, '\n'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<form id="fluffy-register-form" className="space-y-4" onSubmit={handleSubmit}>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="fluffy-reg-first-name" className="mb-1 block text-sm font-medium text-gray-700">
						{t('ชื่อ', 'First Name')}
					</label>
					<input
						id="fluffy-reg-first-name"
						className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-primary"
						type="text"
						value={form.first_name}
						onChange={(e) => updateField('first_name', e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="fluffy-reg-last-name" className="mb-1 block text-sm font-medium text-gray-700">
						{t('นามสกุล', 'Last Name')}
					</label>
					<input
						id="fluffy-reg-last-name"
						className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-primary"
						type="text"
						value={form.last_name}
						onChange={(e) => updateField('last_name', e.target.value)}
						required
					/>
				</div>
			</div>
			<div>
				<label htmlFor="fluffy-reg-email" className="mb-1 block text-sm font-medium text-gray-700">
					{t('อีเมล', 'Email Address')}
				</label>
				<input
					id="fluffy-reg-email"
					className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-primary"
					type="email"
					value={form.email}
					onChange={(e) => updateField('email', e.target.value)}
					required
				/>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="fluffy-reg-phone" className="mb-1 block text-sm font-medium text-gray-700">
						{t('เบอร์โทรศัพท์', 'Phone Number')}
					</label>
					<input
						id="fluffy-reg-phone"
						className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-primary"
						type="tel"
						value={form.phone}
						onChange={(e) => updateField('phone', e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="fluffy-reg-username" className="mb-1 block text-sm font-medium text-gray-700">
						{t('ชื่อผู้ใช้', 'Username')}
					</label>
					<input
						id="fluffy-reg-username"
						className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-primary"
						type="text"
						value={form.username}
						onChange={(e) => updateField('username', e.target.value)}
						required
					/>
				</div>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="fluffy-reg-password" className="mb-1 block text-sm font-medium text-gray-700">
						{t('รหัสผ่าน (อย่างน้อย 8 ตัว)', 'Password (min 8 chars)')}
					</label>
					<input
						id="fluffy-reg-password"
						className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-primary"
						type="password"
						value={form.password}
						onChange={(e) => updateField('password', e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="fluffy-reg-confirm-password" className="mb-1 block text-sm font-medium text-gray-700">
						{t('ยืนยันรหัสผ่าน', 'Confirm Password')}
					</label>
					<input
						id="fluffy-reg-confirm-password"
						className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-primary"
						type="password"
						value={form.confirm_password}
						onChange={(e) => updateField('confirm_password', e.target.value)}
						required
					/>
				</div>
			</div>
			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
			>
				{loading ? t('กำลังสร้างบัญชี...', 'Creating account...') : t('สมัครสมาชิก', 'Create Account')}
			</button>
			<p className="text-center text-sm text-gray-600">
				{t('มีบัญชีอยู่แล้ว?', 'Already have an account?')}{' '}
				<a href={`${config.homeUrl}login/`} className="font-semibold text-primary hover:underline">
					{t('เข้าสู่ระบบ', 'Sign in')}
				</a>
			</p>
		</form>
	);
}
