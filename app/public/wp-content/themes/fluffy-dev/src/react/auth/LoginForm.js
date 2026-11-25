import { useState } from '@wordpress/element';
import { getConfig, wpAjax } from '../shared/api';
import { t } from '../shared/i18n';

export default function LoginForm() {
	const config = getConfig();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [rememberme, setRememberme] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState('');

	if (config.user?.isLoggedIn) {
		return (
			<div className="space-y-4 text-center">
				<div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
					{t('คุณเข้าสู่ระบบอยู่แล้ว', 'You are already logged in!')}
				</div>
				<div className="flex gap-3">
					<a
						href={`${config.homeUrl}profile/`}
						className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
					>
						{t('ไปที่โปรไฟล์', 'My Profile')}
					</a>
					<a
						href={config.logoutUrl}
						className="flex-1 rounded-xl border-2 border-primary px-4 py-3 text-center text-sm font-semibold text-primary"
					>
						{t('ออกจากระบบ', 'Logout')}
					</a>
				</div>
			</div>
		);
	}

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrorMsg('');
		if (!username.trim() || !password) {
			setErrorMsg(t('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'Please enter your username and password.'));
			return;
		}
		setLoading(true);
		try {
			const data = await wpAjax('ajax_user_login', {
				security: config.nonces.login,
				username: username.trim(),
				password,
				rememberme: rememberme ? 'true' : 'false',
			});
			window.location.href = data?.redirect_url || config.homeUrl;
		} catch (err) {
			setErrorMsg(err.message || t('เข้าสู่ระบบไม่สำเร็จ', 'Login failed.'));
			setLoading(false);
		}
	};

	return (
		<form id="fluffy-login-form" className="space-y-4" onSubmit={handleSubmit}>
			{errorMsg && (
				<div id="fluffy-login-error" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
					{errorMsg}
				</div>
			)}
			<div>
				<label htmlFor="fluffy-login-username" className="mb-1.5 block text-sm font-medium text-gray-700">
					{t('ชื่อผู้ใช้ หรือ อีเมล', 'Username or Email')}
				</label>
				<input
					id="fluffy-login-username"
					className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-primary"
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
				/>
			</div>
			<div>
				<label htmlFor="fluffy-login-password" className="mb-1.5 block text-sm font-medium text-gray-700">
					{t('รหัสผ่าน', 'Password')}
				</label>
				<input
					id="fluffy-login-password"
					className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-primary"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>
			<div className="flex items-center justify-between text-sm">
				<label className="flex cursor-pointer items-center gap-2 text-gray-600">
					<input
						type="checkbox"
						checked={rememberme}
						onChange={(e) => setRememberme(e.target.checked)}
						className="h-4 w-4 rounded border-gray-300"
					/>
					{t('จดจำการเข้าสู่ระบบ', 'Remember me')}
				</label>
				<a href={`${config.homeUrl}forgot-password/`} className="font-medium text-primary hover:underline">
					{t('ลืมรหัสผ่าน?', 'Forgot password?')}
				</a>
			</div>
			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
			>
				{loading ? t('กำลังเข้าสู่ระบบ...', 'Signing in...') : t('เข้าสู่ระบบ', 'Sign In')}
			</button>
			<p className="text-center text-sm text-gray-600">
				{t('ยังไม่มีบัญชี?', "Don't have an account?")}{' '}
				<a href={`${config.homeUrl}register/`} className="font-semibold text-primary hover:underline">
					{t('สมัครสมาชิก', 'Sign up')}
				</a>
			</p>
		</form>
	);
}
