# Parking System (`fluffy-dev`)

ระบบจองที่จอดรถสนามบิน, จองบริการเช่ารถพร้อมคนขับ และระบบสมาชิก/แอดมิน บน WordPress Theme (`fluffy-dev`) พัฒนาด้วย React (`@wordpress/scripts`)

![WordPress](https://img.shields.io/badge/WordPress-6.0%2B-21759B?logo=wordpress&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.0%2B-777BB4?logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-%40wordpress%2Fscripts-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-UI-38B2AC?logo=tailwindcss&logoColor=white)

---

## แผนผังระบบและ Flow Chart (Site Map & Architecture)

### ภาพรวมโครงสร้างและเส้นทางหน้าเว็บ (Site Map)
![Site Map & System Architecture](docs/images/system-sitemap-flowchart.png)

### Flow Chart: ระบบจองที่จอดรถสนามบิน (`/carpark/`)
![Flow Chart ระบบจองที่จอดรถสนามบิน](docs/images/flowchart-carpark-classic.png)

### Flow Chart: ระบบจองบริการเช่ารถพร้อมคนขับ (`/carrent/`)
![Flow Chart ระบบจองบริการเช่ารถพร้อมคนขับ](docs/images/flowchart-carrent-classic.png)

---

## คู่มือการใช้งานแบบ Step-by-Step

### 1. ระบบจองที่จอดรถสนามบิน (`/carpark/` — 4-Step Wizard)

#### Step 1: เลือกวันเวลา สถานที่ และประเภทรถ
- กำหนด **วันเริ่มต้น–วันสิ้นสุด** และ **เวลาเริ่มต้น–เวลาสิ้นสุด**
- เลือก **สถานที่จอดรถ** (เช่น สนามบินสุวรรณภูมิ)
- เลือก **ประเภทรถและจำนวนคัน** (สามารถกด `+ เพิ่มประเภทรถ` ได้หลายประเภท) ระบบจะคำนวณราคาให้อัตโนมัติในแถบ **สรุปรายการจอง** ด้านขวา

![Step 1: วันเวลาและรถ](docs/images/carpark-booking.png)

---

#### Step 2: เลือกผังช่องจอดรถและกรอกทะเบียนรถ

![ภาพรวม Step 2: ผังช่องจอดรถ](docs/images/carpark-step2.png)

**2.1 สรุปสถานะช่องจอดแบบเรียลไทม์ & มุมมอง**
- แสดงจำนวน **ช่องจอดทั้งหมด (92)**, **ช่องจอดว่าง**, **ใช้งานแล้ว**, และ **อัตราการใช้งาน (%)**
- สลับมุมมองได้ 3 แบบ: `สถานะ`, `ระยะห่าง`, `โซน`

![สรุปสถานะช่องจอด](docs/images/carpark-step2-stats.png)

**2.2 ผังเลือกช่องจอดรถแบบ 2D**
- กดเลือกช่องจอดที่ต้องการได้โดยตรงจากแผนผัง (`สีเขียว = ว่าง`, `สีแดง = ใช้งานแล้ว`, `สีฟ้า = ช่องที่เลือก`, `สีเทา = ทางเดิน`)

![ผังเลือกช่องจอดรถ 2D](docs/images/carpark-step2-map.png)

**2.3 ระบุทะเบียนรถสำหรับแต่ละช่องจอด**
- กรอกเลขทะเบียนรถของช่องที่เลือก (เช่น `1กข 4974`) หรือเลือกจาก **ทะเบียนที่บันทึกไว้ในโปรไฟล์** ได้ทันที

![กรอกทะเบียนรถสำหรับแต่ละช่องจอด](docs/images/carpark-step2-plate.png)

---

#### Step 3 & Step 4: บริการเสริม ข้อมูลผู้จอง และยืนยันการจอง
- กรอกข้อมูลผู้จอง (ชื่อ, เบอร์โทร, อีเมล, LINE ID), เลือกบริการเสริม (ถ้ามี), ใส่รหัสคูปองส่วนลด แล้วกดยืนยันเพื่อบันทึกเข้าสู่ระบบและรับรหัสการจอง (`Order Code`)

---

### 2. ระบบจองบริการเช่ารถพร้อมคนขับ (`/carrent/`)
1. **ค้นหาเส้นทางและแพ็กเกจ:** เลือกต้นทาง–ปลายทาง แล้วกด `ค้นหาราคา` เพื่อดูแพ็กเกจรถทั้งหมด (เช่น Standard Sedan, Premium Sedan, Toyota Innova MPV, Toyota Fortuner, VIP Commuter)
2. **กรอกข้อมูลผู้จองและรายละเอียดการเดินทาง:** ระบุชื่อ, อีเมล, เบอร์โทร, LINE ID / WhatsApp, จุดรับ–ส่ง, วันเวลา และเลือกรูปแบบ `เที่ยวเดียว` หรือ `ไป-กลับ`
3. **สรุปและชำระเงิน:** ตรวจสอบราคาใน **สรุปการเช่ารถ** ใส่โค้ดส่วนลด (ถ้ามี) แล้วกด `ดำเนินการชำระเงิน`

![จองบริการเช่ารถพร้อมคนขับ](docs/images/rentcar-booking.png)

---

## โครงสร้างโปรเจกต์

- `app/public/wp-content/themes/fluffy-dev/` — WordPress Theme + React (`src/react/`)
- `.github/workflows/deploy.yml` — GitHub Actions สำหรับ build React และ deploy ขึ้น FTP เมื่อ push เข้า `main`

## การพัฒนา (Development)

```bash
cd app/public/wp-content/themes/fluffy-dev
npm install
npm run start   # Watch mode
npm run build   # Production build
```
