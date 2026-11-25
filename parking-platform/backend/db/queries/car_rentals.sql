-- name: ListRentalPackages :many
SELECT * FROM rental_packages
WHERE is_active = TRUE
ORDER BY origin ASC, destination ASC;

-- name: CreateCarRental :one
INSERT INTO car_rentals (
    order_code, user_id, package_id, coupon_id,
    customer_name, customer_email, customer_phone, customer_line_id,
    outbound_at, return_at, outbound_trip, return_trip, additional_info,
    subtotal_amount, discount_amount, total_amount, status
) VALUES (
    $1, $2, $3, $4,
    $5, $6, $7, $8,
    $9, $10, $11, $12, $13,
    $14, $15, $16, $17
)
RETURNING *;

-- name: ListCarRentals :many
SELECT * FROM car_rentals
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
