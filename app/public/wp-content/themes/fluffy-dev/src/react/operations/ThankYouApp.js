import { getConfig } from '../shared/api';
import { t } from '../shared/i18n';

export default function ThankYouApp() {
	const config = getConfig();
	const params = new URLSearchParams(window.location.search);
	const orderCode = params.get('order_code') || params.get('ref') || '';
	const email = params.get('email') || '';
	const isCarRental = orderCode.startsWith('CR');

	return (
		<div id="fluffy-thank-page" className="fluffy-thank fluffy-saas-shell">
			<div id="fluffy-thank-container" className="fluffy-thank__container fluffy-saas-container max-w-2xl">
				<div id="fluffy-thank-card" className="fluffy-thank__card fluffy-saas-card text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-emerald-600">
						✓
					</div>
					<h1 className="fluffy-thank__title m-0 text-2xl font-bold text-[#0F172A]">
						{t('ได้รับการจองเรียบร้อยแล้ว', 'Booking Confirmed')}
					</h1>
					<p className="fluffy-thank__subtitle mx-auto mt-2 max-w-md text-sm text-[#64748B]">
						{t(
							'ระบบได้รับข้อมูลการจองของคุณแล้ว หากไม่ได้รับอีเมลยืนยันกรุณาติดต่อเจ้าหน้าที่ผ่าน LINE OA',
							'We have received your reservation details. Please contact staff via LINE OA if you need assistance.'
						)}
					</p>

					{(orderCode || email) && (
						<div id="fluffy-thank-summary" className="fluffy-thank__summary my-6 space-y-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left text-sm">
							{orderCode && (
								<div className="flex justify-between">
									<span className="text-[#64748B]">
										{isCarRental ? t('หมายเลขการจองเช่ารถ', 'Car Rental Booking No.') : t('หมายเลขการจองที่จอดรถ', 'Parking Booking No.')}
									</span>
									<span className="font-bold text-[#4169F7]">{orderCode}</span>
								</div>
							)}
							{email && (
								<div className="flex justify-between">
									<span className="text-[#64748B]">{t('อีเมลยืนยันถูกส่งไปที่', 'Confirmation Email')}</span>
									<span className="font-medium text-[#0F172A]">{email}</span>
								</div>
							)}
						</div>
					)}

					<div id="fluffy-thank-actions" className="fluffy-thank__actions flex flex-wrap justify-center gap-3">
						<a
							href={config.lineOaLink || 'https://lin.ee/Bm45y3b'}
							target="_blank"
							rel="noreferrer"
							className="fluffy-saas-btn bg-[#06C755] text-white no-underline hover:opacity-90"
						>
							{t('ติดต่อผ่าน LINE OA', 'Contact LINE OA')}
						</a>
						<a href={`${config.homeUrl}profile/`} className="fluffy-saas-btn fluffy-saas-btn-primary no-underline">
							{t('ดูประวัติการจอง', 'View My Bookings')}
						</a>
						<a href={config.homeUrl} className="fluffy-saas-btn fluffy-saas-btn-secondary no-underline">
							{t('กลับหน้าหลัก', 'Back to Home')}
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
