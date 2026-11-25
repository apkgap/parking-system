export default function ParkingBookingPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">จองที่จอดรถสนามบิน</h1>
      <p className="mt-2 text-sm text-slate-600">
        เชื่อมต่อ Go API: <code>GET /api/v1/parking/locations</code>,{" "}
        <code>POST /api/v1/parking/availability</code>,{" "}
        <code>POST /api/v1/parking/calculate-price</code>,{" "}
        <code>POST /api/v1/parking/bookings</code>
      </p>
    </div>
  );
}
