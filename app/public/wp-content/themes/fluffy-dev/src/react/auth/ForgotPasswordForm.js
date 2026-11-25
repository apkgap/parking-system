import { useState } from '@wordpress/element';
import { getConfig, wpAjax } from '../shared/api';
import { t } from '../shared/i18n';

export default function ForgotPasswordForm({ onNotify }) {
	const config = getConfig();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const data = await wpAjax('ajax_forgot_password', {
				security: config.nonces.forgotPassword,
				user_email: email.trim(),
			});
			onNotify('success', t('ส่งลิงก์สำเร็จ', 'Reset Link Sent'), data?.message || t('กรุณาตรวจสอบอีเมลของคุณ', 'Please check your email.'));
			setEmail('');
		} catch (err) {
			onNotify('error', t('ไม่สำเร็จ', 'Error'), err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form id="fluffy-forgot-form" className="space-y-4" onSubmit={handleSubmit}>
			<div>
				<label htmlFor="fluffy-forgot-email" className="mb-1.5 block text-sm font-medium text-gray-700">
					{t('อีเมลที่ลงทะเบียนไว้', 'Registered Email Address')}
				</label>
				<input
					id="fluffy-forgot-email"
					className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-primary"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>
			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
			>
				{loading ? t('กำลังส่ง...', 'Sending...') : t('ส่งลิงก์ตั้งรหัสผ่านใหม่', 'Send Reset Link')}
			</button>
			<div className="text-center text-sm">
				<a href={`${config.homeUrl}login/`} className="font-medium text-primary hover:underline">
					{t('กลับไปหน้าเข้าสู่ระบบ', 'Back to Login')}
				</a>
			</div>
		</form>
	);
}
