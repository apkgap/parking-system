<?php

/**
 * Multilingual Functions for Parking System
 * 
 * @package fluffy
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Simple translation functions
 */
function yp_text($text_th, $text_eng)
{
    if (get_locale() == 'th') {
        echo $text_th;
    } else {
        echo $text_eng;
    }
}

function yp_text_get($text_th, $text_eng)
{
    if (get_locale() == 'th') {
        return $text_th;
    } else {
        return $text_eng;
    }
}

function gp_text_get($text_th, $text_eng)
{
    if (get_locale() == 'th') {
        return $text_th;
    } else {
        return $text_eng;
    }
}

/**
 * Enhanced translation function with key support
 */
function parking_text($key, $th_text, $en_text)
{
    if (get_locale() == 'th') {
        return $th_text;
    } else {
        return $en_text;
    }
}

/**
 * JavaScript translations for dynamic content
 */
function enqueue_parking_translations()
{
    $translations = array(
        'search_parking' => parking_text('search_parking', 'ค้นหาที่จอดรถ', 'Search Parking'),
        'start_date' => parking_text('start_date', 'วันเริ่มต้น', 'Start Date'),
        'start_time' => parking_text('start_time', 'เวลาเริ่มต้น', 'Start Time'),
        'end_date' => parking_text('end_date', 'วันสิ้นสุด', 'End Date'),
        'end_time' => parking_text('end_time', 'เวลาสิ้นสุด', 'End Time'),
        'location' => parking_text('location', 'สถานที่', 'Location'),
        'select_location' => parking_text('select_location', 'เลือกสถานที่', 'Select Location'),
        'suvarnabhumi_airport' => parking_text('suvarnabhumi_airport', 'สนามบินสุวรรณภูมิ', 'Suvarnabhumi Airport'),
        'don_mueang_airport' => parking_text('don_mueang_airport', 'สนามบินดอนเมือง', 'Don Mueang Airport'),
        'car_type' => parking_text('car_type', 'ประเภทรถ', 'Car Type'),
        'quantity' => parking_text('quantity', 'จำนวน', 'Quantity'),
        'cars' => parking_text('cars', 'คัน', 'Cars'),
        'search' => parking_text('search', 'ค้นหา', 'Search'),
        'select_parking' => parking_text('select_parking', 'กรุณาเลือกที่จอดรถ', 'Please Select Parking Space'),
        'available' => parking_text('available', 'ว่าง', 'Available'),
        'spaces' => parking_text('spaces', 'ช่อง', 'Spaces'),
        'show_status' => parking_text('show_status', 'แสดงสถานะ', 'Show Status'),
        'show_distance' => parking_text('show_distance', 'แสดงระยะห่าง', 'Show Distance'),
        'show_zone' => parking_text('show_zone', 'แสดงโซน', 'Show Zone'),
        'legend' => parking_text('legend', 'คำอธิบาย', 'Legend'),
        'parking_map' => parking_text('parking_map', 'แผนผังลานจอดรถ', 'Parking Map'),
        'space_info' => parking_text('space_info', 'ข้อมูลช่องจอด', 'Space Information'),
        'space_id' => parking_text('space_id', 'รหัสช่อง', 'Space ID'),
        'status' => parking_text('status', 'สถานะ', 'Status'),
        'change_status' => parking_text('change_status', 'เปลี่ยนสถานะ', 'Change Status'),
        'fullname' => parking_text('fullname', 'ชื่อ - นามสกุล', 'Full Name'),
        'email' => parking_text('email', 'อีเมล', 'Email'),
        'phone' => parking_text('phone', 'เบอร์โทรศัพท์', 'Phone Number'),
        'line_id' => parking_text('line_id', 'Line ID', 'Line ID'),
        'free_services' => parking_text('free_services', 'ฟรี บริการเสริม', 'Free Additional Services'),
        'airport_shuttle' => parking_text('airport_shuttle', 'บริการรับ - ส่งสนามบิน', 'Airport Shuttle Service'),
        'valet_service' => parking_text('valet_service', 'บริการรับจอด - รับส่งรถ สนามบิน (จะให้บริการในอนาคต)', 'Valet Parking Service (Coming Soon)'),
        'flight_info' => parking_text('flight_info', 'ข้อมูลเที่ยวบิน', 'Flight Information'),
        'departure_flight' => parking_text('departure_flight', 'กรอกเที่ยวบินขาออก', 'Departure Flight No.'),
        'arrival_flight' => parking_text('arrival_flight', 'กรอกเที่ยวบินขาเข้า', 'Arrival Flight No.'),
        'coupon_code' => parking_text('coupon_code', 'รหัสคูปองส่วนลด', 'Coupon Code'),
        'apply_coupon' => parking_text('apply_coupon', 'ใช้คูปอง', 'Apply Coupon'),
        'search_details' => parking_text('search_details', 'รายละเอียดการค้นหา', 'Search Details'),
        'car_details' => parking_text('car_details', 'รายละเอียดรถ', 'Vehicle Details'),
        'price_details' => parking_text('price_details', 'รายละเอียดราคา', 'Price Details'),
        'parking_fee' => parking_text('parking_fee', 'ราคาค่าจอด', 'Parking Fee'),
        'discount' => parking_text('discount', 'ส่วนลด', 'Discount'),
        'total' => parking_text('total', 'รวม', 'Total'),
        'book_now' => parking_text('book_now', 'จองทันที', 'Book Now'),
        'loading' => parking_text('loading', 'กำลังโหลด...', 'Loading...'),
        'please_specify' => parking_text('please_specify', 'โปรดระบุ', 'Please specify'),
        'required' => parking_text('required', 'จำเป็น', 'Required'),
        'booking' => parking_text('booking', 'การจอง', 'Booking'),
        'payment' => parking_text('payment', 'ชำระเงิน', 'Payment'),
        'confirmation' => parking_text('confirmation', 'ยืนยันการจอง', 'Confirmation'),
        'occupied' => parking_text('occupied', 'ใช้งาน', 'Occupied'),
        'occupancy_rate' => parking_text('occupancy_rate', 'อัตราการใช้', 'Occupancy Rate'),
        'add_vehicle_types' => parking_text('add_vehicle_types', 'ถ้ามีประเภทรถฝากเพิ่ม', 'Add more vehicle types'),
        'specify_other_vehicle' => parking_text('specify_other_vehicle', 'โปรดระบุประเภทรถอื่นๆ', 'Please specify other vehicle type'),
        'specify_vehicle_placeholder' => parking_text('specify_vehicle_placeholder', 'ระบุประเภทรถ...', 'Specify vehicle type...'),
        'select_start_date' => parking_text('select_start_date', 'เลือกวันที่เริ่มต้น', 'Select start date'),
        'select_end_date' => parking_text('select_end_date', 'เลือกวันที่สิ้นสุด', 'Select end date'),

        // Thank You Page translations
        'payment_successful' => parking_text('payment_successful', 'ได้รับการจองแล้ว', 'Your payment was successful!'),
        'system_verifying' => parking_text('system_verifying', 'ระบบกำลังตรวจสอบข้อมูลการจองของคุณ', 'The system is verifying your booking information'),
        'contact_staff_notice' => parking_text('contact_staff_notice', 'หากไม่ได้รับแปลงข้อมูลกรุณาแจ้งเจ้าหน้าที่ก่อนเวลาบันทึก 12 ชั่วโมง', 'If you do not receive information updates, please contact staff before 12 hours of departure'),
        'car_rental_booking_number' => parking_text('car_rental_booking_number', 'หมายเลขการจองรถเช่าของคุณ', 'Your car rental booking number'),
        'parking_booking_number' => parking_text('parking_booking_number', 'หมายเลขการจองที่จอดรถของคุณ', 'Your parking booking number'),
        'confirmation_email_sent' => parking_text('confirmation_email_sent', 'อีเมลยืนยันถูกส่งไปที่', 'Confirmation email sent to'),
        'add_line_official' => parking_text('add_line_official', '**กรุณาแอด <span class="text-green-600 font-bold">LINE Official Account</span> ของเรา**', '**Please add our <span class="text-green-600 font-bold">LINE Official Account</span>**'),
        'service_updates' => parking_text('service_updates', 'เพื่อไม่พลาดทุกขั้นตอนการใช้งาน', 'To not miss any service updates'),
        'contact_staff' => parking_text('contact_staff', 'หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่', 'If you have any questions, please contact our staff'),
        'view_details' => parking_text('view_details', 'ดูรายละเอียด', 'View Details'),
        'back_to_home' => parking_text('back_to_home', 'กลับสู่หน้าแรก', 'Back to Home'),

        // Car Rental Service translations
        'search_car_rental' => parking_text('search_car_rental', 'ค้นหาบริการรถเช่า', 'Search Car Rental Service'),
        'origin' => parking_text('origin', 'ต้นทาง:', 'Origin:'),
        'destination' => parking_text('destination', 'ปลายทาง:', 'Destination:'),
        'select_starting_point' => parking_text('select_starting_point', 'เลือกจุดเริ่มต้น...', 'Select starting point...'),
        'select_destination' => parking_text('select_destination', 'เลือกจุดหมาย...', 'Select destination...'),
        'search_price' => parking_text('search_price', 'ค้นหาราคา', 'Search Price'),
        'search_results' => parking_text('search_results', 'ผลการค้นหา:', 'Search Results:'),
        'rental_route' => parking_text('rental_route', 'เส้นทาง', 'Route'),
        'rental_car_type' => parking_text('rental_car_type', 'ประเภทรถ', 'Car Type'),
        'rental_price' => parking_text('rental_price', 'ราคา', 'Price'),
        'select' => parking_text('select', 'เลือก', 'Select'),
        'not_specified' => parking_text('not_specified', 'ไม่ระบุ', 'Not specified'),
        'baht' => parking_text('baht', 'บาท', 'Baht'),
        'price_not_specified' => parking_text('price_not_specified', 'ไม่ระบุราคา', 'Price not specified'),
        'continue' => parking_text('continue', 'ดำเนินการต่อ', 'Continue'),
        'please_select_item' => parking_text('please_select_item', 'กรุณาเลือกรายการที่ต้องการ', 'Please select the desired item'),
        'booking_form_not_found' => parking_text('booking_form_not_found', 'ไม่พบฟอร์มจอง', 'Booking form not found'),
        'selected_package' => parking_text('selected_package', 'แพ็คเกจที่เลือก', 'Selected Package'),
        'cancel_selection' => parking_text('cancel_selection', 'ยกเลิกการเลือก', 'Cancel Selection'),
        'no_service_found' => parking_text('no_service_found', 'ไม่พบบริการสำหรับเส้นทางนี้', 'No service found for this route'),
        'please_select_origin_destination' => parking_text('please_select_origin_destination', 'กรุณาเลือกต้นทางและปลายทาง', 'Please select origin and destination'),

        // JavaScript Parking Space translations
        'booking_details' => parking_text('booking_details', 'รายละเอียดการจอง:', 'Booking Details:'),
        'space_for' => parking_text('space_for', 'สำหรับ', 'for'),
        'no_vehicle_assigned' => parking_text('no_vehicle_assigned', 'ยังไม่มีการมอบหมายรถ', 'No vehicle assigned yet'),
        'vehicle_type_not_specified' => parking_text('vehicle_type_not_specified', 'ยังไม่ได้ระบุประเภทรถ', 'Vehicle type not specified'),
        'please_select_datetime' => parking_text('please_select_datetime', 'กรุณาเลือกวันที่และเวลาให้ครบถ้วนก่อนค้นหา', 'Please select date and time before searching'),
        'please_select_location' => parking_text('please_select_location', 'กรุณาเลือกสถานที่ให้ครบถ้วนก่อนค้นหา', 'Please select location before searching'),
        'search_error' => parking_text('search_error', 'เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง', 'An error occurred while searching. Please try again'),
        'load_vehicle_types_failed' => parking_text('load_vehicle_types_failed', 'โหลด vehicle types ไม่สำเร็จ:', 'Failed to load vehicle types:'),
        'cannot_load_data' => parking_text('cannot_load_data', 'ไม่สามารถโหลดข้อมูล', 'Cannot load data'),
        'please_fill_required' => parking_text('please_fill_required', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'Please fill in all required fields'),
        'please_select_space' => parking_text('please_select_space', 'กรุณาเลือกช่องจอดอย่างน้อยหนึ่งช่อง', 'Please select at least one parking space'),
        'space_mismatch' => parking_text('space_mismatch', 'จำนวนช่องจอดที่เลือกไม่ตรงกับจำนวนรถทั้งหมดที่ระบุในฟอร์ม', 'Selected spaces do not match total vehicles specified'),
        'save_error' => parking_text('save_error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง', 'An error occurred while saving. Please try again'),
        'connection_error' => parking_text('connection_error', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง', 'Connection error. Please check your connection and try again'),
        'select_time' => parking_text('select_time', 'เลือกเวลา', 'Select Time'),
        'cancel' => parking_text('cancel', 'ยกเลิก', 'Cancel'),
        'confirm' => parking_text('confirm', 'ตกลง', 'Confirm'),
        'no_parking_available' => parking_text('no_parking_available', 'ไม่พบที่จอดว่าง', 'No Parking Available'),
        'no_parking_message' => parking_text('no_parking_message', 'ขออภัย ไม่พบช่องจอดว่างในช่วงเวลาที่เลือก กรุณาลองใหม่อีกครั้ง', 'Sorry, no parking spaces available for the selected time. Please try again'),
        'close' => parking_text('close', 'ปิด', 'Close'),

        // Vehicle license plate translations
        'vehicle_license' => parking_text('vehicle_license', 'ทะเบียนรถคันที่', 'Vehicle License'),
        'enter_license_plate' => parking_text('enter_license_plate', 'ระบุเลขทะเบียนรถ', 'Enter license plate number'),
        'select_license' => parking_text('select_license', 'เลือกทะเบียน', 'Select License'),
        'delete_row' => parking_text('delete_row', 'ลบแถวนี้', 'Delete this row'),
        'select_registered_vehicle' => parking_text('select_registered_vehicle', 'เลือกทะเบียนรถที่ลงทะเบียนไว้', 'Select Registered Vehicle'),
        'select_from_registered' => parking_text('select_from_registered', 'เลือกจากรายการทะเบียนรถที่คุณเคยลงทะเบียนไว้', 'Select from your registered vehicles'),

        // Units (baht, quantity, discount already defined above)
        'person' => parking_text('person', 'คน', 'person'),
        'vehicle_unit' => parking_text('vehicle_unit', 'คัน', 'vehicle'),
        'days' => parking_text('days', 'วัน', 'days'),
        'coupon_applied' => parking_text('coupon_applied', 'ใช้คูปองสำเร็จ!', 'Coupon applied!')
    );

    wp_localize_script('wpt-script', 'parkingTranslations', $translations);
    wp_localize_script('wpt-script', 'parkingLang', array('current' => get_locale()));
}
add_action('wp_enqueue_scripts', 'enqueue_parking_translations');

/**
 * Get current language code (th/en)
 */
function get_current_lang_code()
{
    return (get_locale() == 'th') ? 'th' : 'en';
}

/**
 * Check if current language is Thai
 */
function is_thai_language()
{
    return get_locale() == 'th';
}

/**
 * Check if current language is English
 */
function is_english_language()
{
    return get_locale() != 'th';
}

/**
 * Format number based on current language
 */
function format_number_by_lang($number, $decimals = 0)
{
    if (is_thai_language()) {
        return number_format($number, $decimals, '.', ',');
    } else {
        return number_format($number, $decimals, '.', ',');
    }
}

/**
 * Format currency based on current language
 */
function format_currency_by_lang($amount, $decimals = 0)
{
    $formatted = format_number_by_lang($amount, $decimals);

    if (is_thai_language()) {
        return $formatted . ' บาท';
    } else {
        return '$' . $formatted;
    }
}
