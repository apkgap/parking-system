package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"parking-platform/backend/internal/config"
	"parking-platform/backend/internal/service"
)

type Server struct {
	Cfg    config.Config
	Pool   *pgxpool.Pool
	TwoC2P *service.TwoC2PService
	Line   *service.LineNotifyService
}

func (s *Server) RegisterRoutes(app *fiber.App) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "parking-api"})
	})

	v1 := app.Group("/api/v1")

	// Auth & Profile
	auth := v1.Group("/auth")
	auth.Post("/login", s.notImplemented("auth.login"))
	auth.Post("/register", s.notImplemented("auth.register"))
	auth.Post("/refresh", s.notImplemented("auth.refresh"))
	auth.Post("/logout", s.notImplemented("auth.logout"))
	auth.Post("/forgot-password", s.notImplemented("auth.forgot_password"))

	// Parking Booking
	parking := v1.Group("/parking")
	parking.Get("/locations", s.listLocations)
	parking.Get("/spaces", s.notImplemented("parking.spaces"))
	parking.Get("/blackouts", s.notImplemented("parking.blackouts"))
	parking.Post("/availability", s.notImplemented("parking.availability"))
	parking.Post("/calculate-price", s.notImplemented("parking.calculate_price"))
	parking.Post("/bookings", s.notImplemented("parking.create_booking"))
	parking.Get("/bookings/:orderCode", s.notImplemented("parking.get_booking"))

	// QR Check-in / Check-out
	ops := v1.Group("/ops")
	ops.Post("/checkin", s.notImplemented("ops.checkin"))
	ops.Post("/checkout", s.notImplemented("ops.checkout"))

	// Car Rental
	rental := v1.Group("/car-rentals")
	rental.Get("/packages", s.notImplemented("car_rentals.packages"))
	rental.Post("/route-pricing", s.notImplemented("car_rentals.route_pricing"))
	rental.Post("/bookings", s.notImplemented("car_rentals.create_booking"))
	rental.Get("/flights/:flightNo", s.notImplemented("car_rentals.flight_lookup"))

	// Coupons & Checkout (2C2P)
	v1.Post("/coupons/validate", s.notImplemented("coupons.validate"))
	v1.Post("/checkout/2c2p/token", s.notImplemented("checkout.2c2p_token"))
	v1.Post("/webhooks/2c2p", s.notImplemented("webhooks.2c2p"))

	// Customer Vehicles (tabien-rod)
	vehicles := v1.Group("/vehicles")
	vehicles.Get("/", s.notImplemented("vehicles.list"))
	vehicles.Post("/", s.notImplemented("vehicles.create"))
	vehicles.Delete("/:id", s.notImplemented("vehicles.delete"))

	// Admin Dashboard (Parking / Car Rental / Driver / Transport + Exports)
	dash := v1.Group("/dashboard")
	dash.Get("/parking/bookings", s.notImplemented("dashboard.parking.list"))
	dash.Get("/parking/bookings/export", s.notImplemented("dashboard.parking.export"))
	dash.Get("/car-rentals", s.notImplemented("dashboard.car_rentals.list"))
	dash.Get("/car-rentals/export", s.notImplemented("dashboard.car_rentals.export"))
	dash.Get("/drivers", s.notImplemented("dashboard.drivers.list"))
	dash.Post("/drivers", s.notImplemented("dashboard.drivers.create"))
	dash.Get("/drivers/export", s.notImplemented("dashboard.drivers.export"))
	dash.Get("/transport/assignments", s.notImplemented("dashboard.transport.list"))
	dash.Post("/transport/assignments", s.notImplemented("dashboard.transport.create"))
}

func (s *Server) listLocations(c *fiber.Ctx) error {
	rows, err := s.Pool.Query(c.Context(), `SELECT id::text, code, name_th, name_en FROM locations WHERE is_active = TRUE ORDER BY name_en ASC`)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type locationDTO struct {
		ID     string `json:"id"`
		Code   string `json:"code"`
		NameTH string `json:"name_th"`
		NameEN string `json:"name_en"`
	}
	items := make([]locationDTO, 0)
	for rows.Next() {
		var item locationDTO
		if err := rows.Scan(&item.ID, &item.Code, &item.NameTH, &item.NameEN); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		items = append(items, item)
	}
	return c.JSON(fiber.Map{"success": true, "data": items})
}

func (s *Server) notImplemented(action string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "NOT_IMPLEMENTED",
				"message": "Endpoint scaffold ready: " + action,
			},
		})
	}
}
