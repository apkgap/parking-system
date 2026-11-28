# Parking System (`fluffy-dev`)

ระบบจองที่จอดรถสนามบิน, จองบริการเช่ารถพร้อมคนขับ และระบบสมาชิก/แอดมิน บน WordPress Theme (`fluffy-dev`) พัฒนาด้วย React (`@wordpress/scripts`)

![WordPress](https://img.shields.io/badge/WordPress-6.0%2B-21759B?logo=wordpress&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.0%2B-777BB4?logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-%40wordpress%2Fscripts-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-UI-38B2AC?logo=tailwindcss&logoColor=white)

---

## แผนผังระบบและ Flow Chart (Site Map & Architecture)

### ภาพรวมโครงสร้างและเส้นทางหน้าเว็บ (Site Map)
![Site Map & System Architecture](docs/images/system-sitemap.jpg)

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

#### Step 2: เลือกช่องจอดและกรอกทะเบียนรถ

- สลับระหว่าง **ผัง** กับ **รายการ** หรือเลือกแท็บแถวที่ต้องการ
- เลือกช่องให้ครบตามจำนวนรถ ระบบจะจัดช่องให้รถแต่ละคันตามลำดับ
- เปิดรายการ **รถของคุณ** เพื่อกรอกทะเบียนแต่ละคัน หรือเลือกทะเบียนที่บันทึกไว้ เมื่อกรอกครบจึงกด **ถัดไป**

![Step 2: ผังช่องจอดและช่องกรอกทะเบียน](docs/images/carpark-step2.png)

---

#### Step 3: เลือกบริการเสริมและกรอกข้อมูลผู้จอง

- เลือกบริการรถรับ–ส่งสนามบินหรือ Valet Parking ตามต้องการ
- กรอกชื่อ เบอร์โทร อีเมล และ LINE ID หากต้องการระบุ ใช้รหัสคูปองได้จากกล่องสรุปรายการจอง

![Step 3: บริการเสริมและข้อมูลผู้จอง](docs/images/carpark-step3.png)

---

#### Step 4: ตรวจสอบและยืนยันการจอง

- ตรวจสอบสนามบิน วันเวลา ช่องจอด ทะเบียน ข้อมูลติดต่อ และยอดสุทธิ ก่อนกด **ยืนยันการจอง**

![Step 4: ตรวจสอบและยืนยันการจอง](docs/images/carpark-step4.png)

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
