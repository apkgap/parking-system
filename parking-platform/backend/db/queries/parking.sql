-- name: ListLocations :many
SELECT * FROM locations
WHERE is_active = TRUE
ORDER BY name_en ASC;

-- name: ListParkingSpacesByLocation :many
SELECT * FROM parking_spaces
WHERE location_id = $1 AND is_active = TRUE
ORDER BY base_price ASC;

-- name: CountOverlappingParkingBookings :one
SELECT COUNT(*)::int AS booked_count
FROM parking_bookings
WHERE parking_space_id = $1
  AND status IN ('pending_payment', 'confirmed', 'checked_in', 'overtime')
  AND start_at < $3
  AND end_at > $2;

-- name: CreateParkingBooking :one
INSERT INTO parking_bookings (
    order_code, user_id, location_id, parking_space_id, vehicle_type_id,
    customer_vehicle_id, coupon_id, customer_name, customer_email,
    customer_phone, customer_line_id, license_plate, start_at, end_at,
    subtotal_amount, addon_amount, discount_amount, total_amount,
    status, qr_token, addon_info, flight_info
) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9,
    $10, $11, $12, $13, $14,
    $15, $16, $17, $18,
    $19, $20, $21, $22
)
RETURNING *;

-- name: GetParkingBookingByOrderCode :one
SELECT * FROM parking_bookings
WHERE order_code = $1
LIMIT 1;

-- name: ListParkingBookings :many
SELECT * FROM parking_bookings
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CheckInParkingBooking :one
UPDATE parking_bookings
SET status = 'checked_in', checked_in_at = NOW(), updated_at = NOW()
WHERE order_code = $1 AND status = 'confirmed'
RETURNING *;

-- name: CheckOutParkingBooking :one
UPDATE parking_bookings
SET status = 'checked_out', checked_out_at = NOW(), overtime_fee = $2, updated_at = NOW()
WHERE order_code = $1 AND status IN ('checked_in', 'overtime')
RETURNING *;
