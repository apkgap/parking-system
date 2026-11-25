import Link from "next/link";

const modules = [
  {
    href: "/parking",
    title: "จองที่จอดรถสนามบิน",
    desc: "สุวรรณภูมิ / ดอนเมือง เช็กช่องว่าง, Blackout, คูปอง และคำนวณราคา",
    legacy: "page-carpark.php",
  },
  {
    href: "/car-rental",
    title: "จองบริการเช่ารถ",
    desc: "ค้นหาเส้นทาง/แพ็กเกจ, ค้นหาเที่ยวบิน AviationStack และเลือกบริการเสริม",
    legacy: "page-rentcar.php",
  },
  {
    href: "/checkout",
    title: "ชำระเงินผ่าน 2C2P",
    desc: "หน้า Checkout ฝั่ง React เชื่อมต่อ 2C2P PGW API v4 โดยตรง",
    legacy: "woocommerce/checkout + 2c2p",
  },
  {
    href: "/checkin",
    title: "QR Check-in / Check-out",
    desc: "สแกน QR Code หน้างาน บันทึกสภาพรถ และคำนวณค่าจอดเกินเวลา",
    legacy: "checkin.php / checkout.php",
  },
  {
    href: "/dashboard",
    title: "Admin Dashboard",
    desc: "จัดการ Parking, Car Rental, Driver, Transport และ Export Excel/CSV",
    legacy: "page-dashboard.php",
  },
  {
    href: "/auth/login",
    title: "สมาชิก & โปรไฟล์",
    desc: "เข้าสู่ระบบ (รองรับรหัสผ่าน WP เดิม), ผูก LINE OA และจัดการทะเบียนรถ",
    legacy: "login.php / profile-page.php",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-slate-900 p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
          Next.js + Go + PostgreSQL (sqlc)
        </p>
        <h1 className="mt-2 text-3xl font-bold">Parking Platform System</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          โครงสร้างระบบใหม่ที่แยกออกจาก WordPress เต็มรูปแบบ รองรับการ Migrate
          ข้อมูลเดิมทั้งหมด, 2C2P API และแจ้งเตือนผ่าน LINE OA
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#29b2e2] hover:shadow-md"
          >
            <h2 className="text-base font-semibold text-slate-900 group-hover:text-[#29b2e2]">
              {m.title}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">{m.desc}</p>
            <p className="mt-3 text-xs text-slate-400">แทนที่: {m.legacy}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
