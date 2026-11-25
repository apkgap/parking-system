import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parking Platform | Airport Parking & Car Rental",
  description: "Standalone Next.js + Go + PostgreSQL system migrated from WordPress",
};

const navLinks = [
  { href: "/parking", label: "จองที่จอดรถ" },
  { href: "/car-rental", label: "เช่ารถ" },
  { href: "/checkout", label: "ชำระเงิน (2C2P)" },
  { href: "/checkin", label: "QR Check-in/out" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/auth/login", label: "เข้าสู่ระบบ" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="text-lg font-bold text-slate-900">
              Parking<span className="text-[#29b2e2]">Platform</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[#29b2e2]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
