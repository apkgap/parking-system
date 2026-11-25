-- name: ListDrivers :many
SELECT * FROM drivers
ORDER BY driver_name ASC
LIMIT $1 OFFSET $2;

-- name: CreateDriver :one
INSERT INTO drivers (
    user_id, driver_code, driver_name, phone, vehicle_info,
    license_plate, vehicle_color, status
) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8
)
RETURNING *;

-- name: CreateRideAssignment :one
INSERT INTO ride_assignments (
    job_code, driver_id, parking_booking_id, car_rental_id,
    pickup_location, dropoff_location, scheduled_at, status, notes
) VALUES (
    $1, $2, $3, $4,
    $5, $6, $7, $8, $9
)
RETURNING *;

-- name: ListRideAssignments :many
SELECT * FROM ride_assignments
ORDER BY scheduled_at DESC
LIMIT $1 OFFSET $2;
