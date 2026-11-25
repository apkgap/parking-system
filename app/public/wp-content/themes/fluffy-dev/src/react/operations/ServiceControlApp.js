import { getConfig } from '../shared/api';
import { t } from '../shared/i18n';

export default function ServiceControlApp() {
	const config = getConfig();
	const roles = config.user?.roles || [];
	const allowed = roles.includes('administrator') || roles.includes('service-customer');

	const actions = [
		{ id: 'checkin', href: `${config.homeUrl}check-in/`, title: t('สแกน QR Check-in', 'QR Check-in'), desc: t('รับรถเข้าจอดและบันทึกเวลาเช็คอิน', 'Scan customer QR to check vehicle in') },
		{ id: 'checkout', href: `${config.homeUrl}check-out/`, title: t('สแกน QR Check-out', 'QR Check-out'), desc: t('ส่งมอบรถคืนและคำนวณค่าจอดเกินเวลา', 'Scan QR to complete check-out & overtime') },
		{ id: 'driver-job', href: `${config.homeUrl}create-driver-job/`, title: t('สร้างงานคนขับ', 'Create Driver Job'), desc: t('มอบหมายงานรับ-ส่งให้พนักงานขับรถ', 'Assign shuttle or valet jobs to drivers') },
		{ id: 'dashboard', href: `${config.homeUrl}dashboard/`, title: t('แดชบอร์ดจัดการ', 'Operations Dashboard'), desc: t('ดูภาพรวมการจองทั้งหมดและ Export รายงาน', 'Manage bookings, rentals, drivers & exports') },
	];

	return (
		<div id="fluffy-service-control" className="fluffy-service fluffy-saas-shell">
			<div id="fluffy-service-container" className="fluffy-service__container fluffy-saas-container max-w-4xl">
				<div id="fluffy-service-header" className="fluffy-service__header fluffy-saas-header">
					<div>
						<h1 className="fluffy-service__title fluffy-saas-title">{t('ควบคุมบริการหน้างาน', 'Service Control')}</h1>
						<p className="fluffy-service__subtitle fluffy-saas-subtitle">
							{t('เลือกเมนูสำหรับเจ้าหน้าที่จัดการรับ-ส่งรถและตรวจสอบสถานะ', 'Select an operational tool for front-desk and valet staff.')}
						</p>
					</div>
				</div>

				{!config.user?.isLoggedIn || !allowed ? (
					<div id="fluffy-service-denied" className="fluffy-service__denied fluffy-saas-card text-center">
						<p className="text-sm text-red-600">
							{t('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่', 'Access denied. Please sign in with a staff or administrator account.')}
						</p>
						<a href={`${config.homeUrl}login/`} className="fluffy-saas-btn fluffy-saas-btn-primary mt-4 no-underline">
							{t('เข้าสู่ระบบ', 'Sign In')}
						</a>
					</div>
				) : (
					<div id="fluffy-service-grid" className="fluffy-service__grid grid gap-4 sm:grid-cols-2">
						{actions.map((item) => (
							<a
								id={`fluffy-service-action-${item.id}`}
								className="fluffy-service__card fluffy-saas-card block no-underline transition hover:border-[#4169F7]"
								href={item.href}
								key={item.id}
							>
								<h2 className="m-0 text-base font-semibold text-[#0F172A]">{item.title}</h2>
								<p className="m-0 mt-1.5 text-sm text-[#64748B]">{item.desc}</p>
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
