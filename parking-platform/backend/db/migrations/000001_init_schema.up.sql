-- Parking Platform Initial Schema (PostgreSQL 16)
-- Migrated & normalized from WordPress CPTs:
--   wp_users, parking_space, vehicle_type, tabien-rod,
--   parking_booking, parking_check_list, package_rent,
--   car_rentals, taxi-driver, ride_assignment

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1. ENUM TYPES
-- =========================================================
CREATE TYPE user_role AS ENUM ('customer', 'driver', 'staff', 'admin');
CREATE TYPE booking_status AS ENUM (
    'pending_payment',
    'confirmed',
    'checked_in',
    'checked_out',
    'overtime',
    'cancelled',
    'no_show'
);
CREATE TYPE payment_status AS ENUM ('pending', 'awaiting_payment', 'paid', 'failed', 'refunded', 'cancelled');
CREATE TYPE driver_status AS ENUM ('available', 'busy', 'offline', 'suspended');
CREATE TYPE ride_job_status AS ENUM ('pending', 'assigned', 'en_route', 'picked_up', 'completed', 'cancelled');

-- =========================================================
-- 2. USERS & AUTH (Supports legacy WP password rehash + LINE OA)
-- =========================================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_user_id          BIGINT UNIQUE,
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    password_algo       TEXT NOT NULL DEFAULT 'bcrypt', -- 'wp_phpass' | 'bcrypt'
    role                user_role NOT NULL DEFAULT 'customer',
    full_name           TEXT NOT NULL,
    phone               TEXT,
    line_id             TEXT,
    line_user_id        TEXT UNIQUE, -- LINE Messaging API userId for push notifications
    preferred_locale    TEXT NOT NULL DEFAULT 'th',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 3. MASTER DATA: LOCATIONS, VEHICLE TYPES, PARKING SPACES, BLACKOUTS
-- =========================================================
CREATE TABLE locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT NOT NULL UNIQUE, -- e.g. 'SuvarnabhumiAirport', 'DonMueangAirport'
    name_th     TEXT NOT NULL,
    name_en     TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicle_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_post_id  BIGINT UNIQUE,
    code        TEXT NOT NULL UNIQUE,
    name_th     TEXT NOT NULL,
    name_en     TEXT NOT NULL,
    daily_rate  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parking_spaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_post_id      BIGINT UNIQUE,
    location_id     UUID NOT NULL REFERENCES locations(id),
    name_th         TEXT NOT NULL,
    name_en         TEXT NOT NULL,
    zone_code       TEXT,
    capacity        INT NOT NULL DEFAULT 1,
    base_price      NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_covered      BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parking_blackouts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parking_space_id  UUID REFERENCES parking_spaces(id) ON DELETE CASCADE,
    location_id       UUID REFERENCES locations(id) ON DELETE CASCADE,
    start_at          TIMESTAMPTZ NOT NULL,
    end_at            TIMESTAMPTZ NOT NULL,
    reason            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_at > start_at)
);

-- Customer saved license plates (replaces CPT: tabien-rod)
CREATE TABLE customer_vehicles (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_post_id       BIGINT UNIQUE,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type_id  UUID REFERENCES vehicle_types(id),
    license_plate    TEXT NOT NULL,
    province         TEXT,
    brand            TEXT,
    model            TEXT,
    color            TEXT,
    is_default       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 4. COUPONS
-- =========================================================
CREATE TABLE coupons (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code             TEXT NOT NULL UNIQUE,
    scope            TEXT NOT NULL DEFAULT 'all', -- 'parking' | 'car_rental' | 'all'
    discount_type    TEXT NOT NULL,               -- 'percent' | 'fixed'
    discount_value   NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    max_uses         INT,
    used_count       INT NOT NULL DEFAULT 0,
    starts_at        TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 5. PARKING BOOKINGS & CHECK-IN / CHECK-OUT CHECKLIST
-- =========================================================
CREATE TABLE parking_bookings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_post_id              BIGINT UNIQUE,
    order_code              TEXT NOT NULL UNIQUE,
    user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
    location_id             UUID NOT NULL REFERENCES locations(id),
    parking_space_id        UUID REFERENCES parking_spaces(id),
    vehicle_type_id         UUID REFERENCES vehicle_types(id),
    customer_vehicle_id     UUID REFERENCES customer_vehicles(id) ON DELETE SET NULL,
    coupon_id               UUID REFERENCES coupons(id) ON DELETE SET NULL,

    -- Snapshot customer & vehicle info
    customer_name           TEXT NOT NULL,
    customer_email          TEXT NOT NULL,
    customer_phone          TEXT NOT NULL,
    customer_line_id        TEXT,
    license_plate           TEXT,

    -- Booking schedule
    start_at                TIMESTAMPTZ NOT NULL,
    end_at                  TIMESTAMPTZ NOT NULL,
    checked_in_at           TIMESTAMPTZ,
    checked_out_at          TIMESTAMPTZ,

    -- Pricing
    subtotal_amount         NUMERIC(10, 2) NOT NULL DEFAULT 0,
    addon_amount            NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount         NUMERIC(10, 2) NOT NULL DEFAULT 0,
    overtime_fee            NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount            NUMERIC(10, 2) NOT NULL DEFAULT 0,

    -- Status & QR
    status                  booking_status NOT NULL DEFAULT 'pending_payment',
    qr_token                TEXT UNIQUE,
    addon_info              JSONB NOT NULL DEFAULT '{}'::jsonb,
    flight_info             JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Notification tracking (prevents duplicate cron pushes)
    reminded_checkin_at     TIMESTAMPTZ,
    reminded_checkout_at    TIMESTAMPTZ,
    notified_overtime_at    TIMESTAMPTZ,
    notified_overdue_at     TIMESTAMPTZ,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_at > start_at)
);

CREATE INDEX idx_parking_bookings_schedule ON parking_bookings (location_id, start_at, end_at);
CREATE INDEX idx_parking_bookings_status ON parking_bookings (status);
CREATE INDEX idx_parking_bookings_user ON parking_bookings (user_id);

-- Check-in / Check-out inspection (replaces CPT: parking_check_list)
CREATE TABLE parking_checklists (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_post_id          BIGINT UNIQUE,
    parking_booking_id  UUID NOT NULL REFERENCES parking_bookings(id) ON DELETE CASCADE,
    staff_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    check_type          TEXT NOT NULL, -- 'check_in' | 'check_out'
    mileage             INT,
    fuel_level          TEXT,
    notes               TEXT,
    photo_urls          JSONB NOT NULL DEFAULT '[]'::jsonb,
    checklist_items     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 6. CAR RENTALS & PACKAGES (replaces CPT: package_rent, car_rentals)
-- =========================================================
CREATE TABLE rental_packages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_post_id      BIGINT UNIQUE,
    code            TEXT UNIQUE,
    title_th        TEXT NOT NULL,
    title_en        TEXT NOT NULL,
    origin          TEXT NOT NULL,
    destination     TEXT NOT NULL,
    vehicle_type_id UUID REFERENCES vehicle_types(id),
    price_one_way   NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_roundtrip NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE car_rentals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_post_id          BIGINT UNIQUE,
    order_code          TEXT NOT NULL UNIQUE,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    package_id          UUID REFERENCES rental_packages(id) ON DELETE SET NULL,
    coupon_id           UUID REFERENCES coupons(id) ON DELETE SET NULL,

    customer_name       TEXT NOT NULL,
    customer_email      TEXT NOT NULL,
    customer_phone      TEXT NOT NULL,
    customer_line_id    TEXT,

    outbound_at         TIMESTAMPTZ NOT NULL,
    return_at           TIMESTAMPTZ,
    outbound_trip       JSONB NOT NULL DEFAULT '{}'::jsonb,
    return_trip         JSONB NOT NULL DEFAULT '{}'::jsonb,
    additional_info     JSONB NOT NULL DEFAULT '{}'::jsonb,

    subtotal_amount     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status              booking_status NOT NULL DEFAULT 'pending_payment',

    reminded_outbound_at TIMESTAMPTZ,
    reminded_return_at   TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_car_rentals_outbound ON car_rentals (outbound_at);
CREATE INDEX idx_car_rentals_status ON car_rentals (status);

-- =========================================================
-- 7. DRIVERS & RIDE ASSIGNMENTS (replaces CPT: taxi-driver, ride_assignment)
-- =========================================================
CREATE TABLE drivers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_post_id      BIGINT UNIQUE,
    user_id         UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    driver_code     TEXT NOT NULL UNIQUE,
    driver_name     TEXT NOT NULL,
    phone           TEXT NOT NULL,
    vehicle_info    TEXT,
    license_plate   TEXT,
    vehicle_color   TEXT,
    status          driver_status NOT NULL DEFAULT 'available',
    job_count       INT NOT NULL DEFAULT 0,
    completed_jobs  INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ride_assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wp_post_id          BIGINT UNIQUE,
    job_code            TEXT NOT NULL UNIQUE,
    driver_id           UUID REFERENCES drivers(id) ON DELETE SET NULL,
    parking_booking_id  UUID REFERENCES parking_bookings(id) ON DELETE SET NULL,
    car_rental_id       UUID REFERENCES car_rentals(id) ON DELETE SET NULL,
    pickup_location     TEXT NOT NULL,
    dropoff_location    TEXT NOT NULL,
    scheduled_at        TIMESTAMPTZ NOT NULL,
    status              ride_job_status NOT NULL DEFAULT 'pending',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_assignments_driver ON ride_assignments (driver_id, status);

-- =========================================================
-- 8. PAYMENTS (2C2P API v4 Transactions & Webhook Logs)
-- =========================================================
CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no              TEXT NOT NULL UNIQUE,
    provider                TEXT NOT NULL DEFAULT '2c2p',
    parking_booking_id      UUID REFERENCES parking_bookings(id) ON DELETE SET NULL,
    car_rental_id           UUID REFERENCES car_rentals(id) ON DELETE SET NULL,
    amount                  NUMERIC(10, 2) NOT NULL,
    currency                TEXT NOT NULL DEFAULT 'THB',
    status                  payment_status NOT NULL DEFAULT 'pending',
    payment_token           TEXT,
    provider_transaction_id TEXT,
    raw_request             JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_callback            JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (parking_booking_id IS NOT NULL AND car_rental_id IS NULL) OR
        (parking_booking_id IS NULL AND car_rental_id IS NOT NULL)
    )
);

-- Seed default airport locations
INSERT INTO locations (code, name_th, name_en) VALUES
    ('SuvarnabhumiAirport', 'สนามบินสุวรรณภูมิ', 'Suvarnabhumi Airport'),
    ('DonMueangAirport', 'สนามบินดอนเมือง', 'Don Mueang Airport')
ON CONFLICT (code) DO NOTHING;
