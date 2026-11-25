export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">เข้าสู่ระบบ</h1>
      <p className="mt-2 text-sm text-slate-600">
        เชื่อมต่อ Go API: <code>POST /api/v1/auth/login</code> (รองรับรหัสผ่าน
        WordPress phpass เดิมพร้อม auto-rehash เป็น bcrypt)
      </p>
    </div>
  );
}
