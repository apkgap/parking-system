export default function CheckoutPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        ชำระเงินผ่าน 2C2P (React Checkout)
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        เชื่อมต่อ Go API: <code>POST /api/v1/checkout/2c2p/token</code> และ
        Webhook Callback ที่ <code>POST /api/v1/webhooks/2c2p</code>
      </p>
    </div>
  );
}
