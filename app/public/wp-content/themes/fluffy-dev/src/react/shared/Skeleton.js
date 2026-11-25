export function SkeletonBox({ className = '', style = {} }) {
	return <span className={`fluffy-skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function ParkingMapSkeleton() {
	return (
		<div id="fluffy-parking-map-skeleton" className="fluffy-skeleton__parking-map space-y-4" aria-busy="true" aria-label="Loading parking map">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2">
						<SkeletonBox className="h-3 w-20" />
						<SkeletonBox className="h-6 w-12" />
					</div>
				))}
			</div>
			<div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
				<div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
					{Array.from({ length: 24 }).map((_, i) => (
						<SkeletonBox key={i} className="h-10 w-full rounded-md" />
					))}
				</div>
			</div>
		</div>
	);
}

export function PackageGridSkeleton() {
	return (
		<div id="fluffy-package-skeleton" className="fluffy-skeleton__packages mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading packages">
			{[0, 1, 2].map((i) => (
				<div key={i} className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-2.5">
					<SkeletonBox className="h-4 w-32" />
					<SkeletonBox className="h-3 w-44" />
					<SkeletonBox className="h-5 w-20" />
				</div>
			))}
		</div>
	);
}

export function BookingListSkeleton({ rows = 4 }) {
	return (
		<div id="fluffy-list-skeleton" className="fluffy-skeleton__list divide-y divide-[#E2E8F0]" aria-busy="true" aria-label="Loading list">
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-2">
						<SkeletonBox className="h-4 w-48" />
						<SkeletonBox className="h-3.5 w-64" />
					</div>
					<div className="flex items-center gap-3">
						<SkeletonBox className="h-6 w-20 rounded-md" />
						<SkeletonBox className="h-8 w-20 rounded-lg" />
					</div>
				</div>
			))}
		</div>
	);
}

export function CardDetailSkeleton() {
	return (
		<div id="fluffy-detail-skeleton" className="fluffy-skeleton__detail fluffy-saas-card space-y-5" aria-busy="true" aria-label="Loading details">
			<div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
				<div className="space-y-2">
					<SkeletonBox className="h-5 w-52" />
					<SkeletonBox className="h-3.5 w-36" />
				</div>
				<SkeletonBox className="h-6 w-20" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className="space-y-1.5">
						<SkeletonBox className="h-3 w-24" />
						<SkeletonBox className="h-4 w-40" />
					</div>
				))}
			</div>
		</div>
	);
}

export function TableSkeleton({ rows = 6 }) {
	return (
		<div id="fluffy-table-skeleton" className="fluffy-skeleton__table p-4 space-y-3" aria-busy="true" aria-label="Loading table">
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="grid grid-cols-4 gap-4 border-b border-[#E2E8F0] pb-3 last:border-b-0">
					<SkeletonBox className="h-4 w-24" />
					<SkeletonBox className="h-4 w-36" />
					<SkeletonBox className="h-4 w-40" />
					<SkeletonBox className="h-5 w-20" />
				</div>
			))}
		</div>
	);
}
