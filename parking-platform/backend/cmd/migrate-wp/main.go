package main

import (
	"fmt"
	"os"
)

// WordPress MySQL -> PostgreSQL Migration CLI
// Order of migration:
//   1. wp_users + wp_usermeta           -> users (preserving wp_user_id & phpass hash)
//   2. vehicle_type & parking_space     -> vehicle_types, parking_spaces
//   3. tabien-rod                       -> customer_vehicles
//   4. package_rent                     -> rental_packages
//   5. taxi-driver                      -> drivers
//   6. parking_booking + check_list     -> parking_bookings, parking_checklists
//   7. car_rentals                      -> car_rentals
//   8. ride_assignment                  -> ride_assignments
func main() {
	wpDSN := os.Getenv("WP_MYSQL_DSN")
	pgDSN := os.Getenv("DATABASE_URL")
	if wpDSN == "" || pgDSN == "" {
		fmt.Println("Usage: set WP_MYSQL_DSN and DATABASE_URL environment variables before running migrate-wp.")
		os.Exit(1)
	}
	fmt.Println("WordPress -> PostgreSQL migrator initialized.")
	fmt.Println("Next step: attach go-sql-driver/mysql and run idempotent UPSERT batches per CPT.")
}
