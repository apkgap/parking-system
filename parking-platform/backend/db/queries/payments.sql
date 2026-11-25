-- name: CreatePayment :one
INSERT INTO payments (
    invoice_no, provider, parking_booking_id, car_rental_id,
    amount, currency, status, payment_token, raw_request
) VALUES (
    $1, $2, $3, $4,
    $5, $6, $7, $8, $9
)
RETURNING *;

-- name: MarkPaymentPaid :one
UPDATE payments
SET status = 'paid',
    provider_transaction_id = $2,
    raw_callback = $3,
    paid_at = NOW(),
    updated_at = NOW()
WHERE invoice_no = $1
RETURNING *;
