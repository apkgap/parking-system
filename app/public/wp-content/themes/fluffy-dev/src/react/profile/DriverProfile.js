import { useEffect, useState } from '@wordpress/element';
import { getConfig, wpRest } from '../shared/api';
import { t } from '../shared/i18n';
import { BookingListSkeleton } from '../shared/Skeleton';

export default function DriverProfile() {
	const config = getConfig();
	const user = config.user || {};

	const [jobs, setJobs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('');

	const loadJobs = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (user.driverTaxiUserId) {
				params.set('taxi_user_id', String(user.driverTaxiUserId));
			}
			if (search.trim()) {
				params.set('search', search.trim());
			}
			if (status) {
				params.set('status', status);
			}
			const res = await wpRest(`${config.customRestUrl}ride_assignments?${params.toString()}`);
			const list = Array.isArray(res) ? res : res.data || res.items || [];
			setJobs(list);
		} catch {
			setJobs([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadJobs();
	}, [status]);

	const initials = (user.displayName || 'D').slice(0, 2).toUpperCase();

	return (
		<div id="fluffy-driver-profile" className="fluffy-saas-shell">
			<div className="fluffy-saas-container space-y-6">
				<div className="fluffy-saas-card flex items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fluffy-primary-soft)] text-xl font-bold text-[var(--fluffy-primary)]">
							{initials}
						</div>
						<div>
							<h1 className="fluffy-saas-title">{user.driverDisplayName || user.displayName}</h1>
							<p className="fluffy-saas-subtitle">{user.email}</p>
						</div>
					</div>
					<a href={config.logoutUrl} className="fluffy-saas-btn fluffy-saas-btn-secondary">
						{t('ออกจากระบบ', 'Logout')}
					</a>
				</div>

				<div className="fluffy-saas-card p-0 overflow-hidden">
					<div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-5 md:flex-row md:items-center md:justify-between">
						<h2 className="text-base font-semibold text-[#0F172A]">{t('รายการงานที่ได้รับมอบหมาย', 'Assigned Driver Jobs')}</h2>
						<div className="flex flex-wrap gap-2">
							<input
								id="fluffy-driver-search"
								className="fluffy-saas-input !w-auto"
								type="text"
								placeholder={t('ค้นหางาน...', 'Search jobs...')}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<button type="button" onClick={loadJobs} className="fluffy-saas-btn fluffy-saas-btn-primary">
								{t('ค้นหา', 'Search')}
							</button>
							<select
								id="fluffy-driver-status"
								className="fluffy-saas-select !w-auto"
								value={status}
								onChange={(e) => setStatus(e.target.value)}
							>
								<option value="">{t('ทุกสถานะ', 'All Status')}</option>
								<option value="pending">{t('รอดำเนินการ', 'Pending')}</option>
								<option value="in_progress">{t('กำลังดำเนินการ', 'In Progress')}</option>
								<option value="completed">{t('เสร็จสิ้น', 'Completed')}</option>
								<option value="cancelled">{t('ยกเลิก', 'Cancelled')}</option>
							</select>
						</div>
					</div>

					{loading ? (
						<BookingListSkeleton rows={4} />
					) : jobs.length === 0 ? (
						<div className="p-10 text-center text-sm text-[#64748B]">{t('ยังไม่มีรายการงาน', 'No assigned jobs found.')}</div>
					) : (
						<div className="divide-y divide-[#E2E8F0]">
							{jobs.map((job, idx) => (
								<div
									id={`fluffy-driver-job-${job.id || idx}`}
									className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
									key={job.id || idx}
								>
									<div>
										<p className="font-semibold text-[#0F172A]">{job.job_code || job.title || `Job #${job.id}`}</p>
										<p className="mt-0.5 text-sm text-[#64748B]">
											{job.fullname_park || job.customer_name || ''} {job.location_park ? `· ${job.location_park}` : ''}
										</p>
									</div>
									<span className="fluffy-saas-pill bg-[var(--fluffy-primary-soft)] text-[var(--fluffy-primary)]">
										{job.status_job || job.status || 'pending'}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
