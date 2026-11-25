export default function CheckinPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        QR Code Check-in / Check-out
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        เชื่อมต่อ Go API: <code>POST /api/v1/ops/checkin</code> และ{" "}
        <code>POST /api/v1/ops/checkout</code>
      </p>
    </div>
  );
}
