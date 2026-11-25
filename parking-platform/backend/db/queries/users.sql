-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 AND is_active = TRUE
LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1
LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (
    wp_user_id, email, password_hash, password_algo, role,
    full_name, phone, line_id, line_user_id, preferred_locale
) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9, $10
)
RETURNING *;

-- name: UpdateUserPasswordHash :exec
UPDATE users
SET password_hash = $2, password_algo = 'bcrypt', updated_at = NOW()
WHERE id = $1;

-- name: LinkUserLineAccount :exec
UPDATE users
SET line_user_id = $2, updated_at = NOW()
WHERE id = $1;
