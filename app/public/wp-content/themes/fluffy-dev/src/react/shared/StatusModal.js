import { t } from './i18n';

export default function StatusModal({ modal, onClose }) {
	if (!modal?.open) {
		return null;
	}

	const isSuccess = modal.type === 'success';

	return (
		<div
			id="fluffy-status-modal"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
		>
			<div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-8 text-center shadow-2xl">
				<div className="mb-4 flex justify-center">
					<div
						className={`flex h-16 w-16 items-center justify-center rounded-full text-white ${
							isSuccess ? 'bg-green-500' : 'bg-red-500'
						}`}
					>
						{isSuccess ? '✓' : '!'}
					</div>
				</div>
				<h2
					className={`mb-2 text-2xl font-bold ${
						isSuccess ? 'text-green-600' : 'text-red-600'
					}`}
				>
					{modal.title}
				</h2>
				<p className="mb-6 whitespace-pre-line text-sm text-gray-600">
					{modal.message}
				</p>
				<button
					type="button"
					onClick={onClose}
					className="rounded-xl bg-primary px-8 py-3 font-semibold text-white transition hover:opacity-90"
				>
					{t('ตกลง', 'OK')}
				</button>
			</div>
		</div>
	);
}
