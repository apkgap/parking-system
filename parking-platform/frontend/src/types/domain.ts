export type UserRole = "customer" | "driver" | "staff" | "admin";

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "overtime"
  | "cancelled"
  | "no_show";

export interface AirportLocation {
  id: string;
  code: string;
  name_th: string;
  name_en: string;
}

export interface ParkingBooking {
  id: string;
  order_code: string;
  location_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  license_plate?: string;
  start_at: string;
  end_at: string;
  total_amount: number;
  status: BookingStatus;
  qr_token?: string;
}

export interface CarRentalBooking {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  outbound_at: string;
  return_at?: string;
  total_amount: number;
  status: BookingStatus;
}
