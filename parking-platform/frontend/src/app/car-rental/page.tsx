export default function CarRentalPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">จองบริการเช่ารถ</h1>
      <p className="mt-2 text-sm text-slate-600">
        เชื่อมต่อ Go API: <code>GET /api/v1/car-rentals/packages</code>,{" "}
        <code>POST /api/v1/car-rentals/route-pricing</code>,{" "}
        <code>GET /api/v1/car-rentals/flights/:flightNo</code>
      </p>
    </div>
  );
}
