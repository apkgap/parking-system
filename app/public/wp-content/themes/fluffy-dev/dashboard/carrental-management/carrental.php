<?php
/**
 * REST API Route for Car Rental Post Type
 */

function enqueue_carrental_js() {
    if (is_page('dashboard')) {
        wp_enqueue_script('carrental', get_template_directory_uri() . '/dashboard/carrental-management/js/carrental.js', array(), false, true);
    }
}
add_action('wp_enqueue_scripts', 'enqueue_carrental_js');


function register_car_rental_rest_routes() {
    register_rest_route('carrental/v1', '/rentals', array(
        'methods' => 'GET',
        'callback' => 'get_car_rentals',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('carrental/v1', '/rentals/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'get_car_rental',
        'permission_callback' => '__return_true',
    ));
    
    // เพิ่ม endpoint สำหรับการส่งออกข้อมูล
    register_rest_route('carrental/v1', '/rentals/export', array(
        'methods' => 'GET',
        'callback' => 'export_car_rentals',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('carrental/v1', '/rentals', array(
        'methods' => 'POST',
        'callback' => 'create_car_rental',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));

    register_rest_route('carrental/v1', '/rentals/(?P<id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'update_car_rental',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));

    register_rest_route('carrental/v1', '/rentals/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'delete_car_rental',
        'permission_callback' => function() {
            return current_user_can('delete_posts');
        },
    ));
}

add_action('rest_api_init', 'register_car_rental_rest_routes');

/**
 * Get all car rentals with pagination, search and filtering
 */
function get_car_rentals($request) {
    $page = $request->get_param('page') ? (int) $request->get_param('page') : 1;
    $per_page = $request->get_param('per_page') ? (int) $request->get_param('per_page') : 12;
    $search = $request->get_param('search');
    $status = $request->get_param('status');
    $date_from = $request->get_param('date_from');
    $date_to = $request->get_param('date_to');
    $date_range = $request->get_param('date_range');
    
    $args = array(
        'post_type' => 'car_rentals',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'post_status' => 'publish',
    );
    
    $meta_query = array('relation' => 'AND');
    
    // เพิ่มการค้นหาถ้ามีพารามิเตอร์ search
    if (!empty($search)) {
        $args['s'] = sanitize_text_field($search);
    }
    
    // เพิ่มการกรองตามสถานะถ้ามีพารามิเตอร์ status
    if (!empty($status)) {
        $meta_query[] = array(
            'key' => 'rental_status',
            'value' => sanitize_text_field($status),
            'compare' => '='
        );
    }

    // Handle date range filtering
    if (!empty($date_range)) {
        $date_range = sanitize_text_field($date_range);
        $today = date('Y-m-d');
        $date_conditions = array();
        
        switch ($date_range) {
            case 'today':
                $date_conditions = array(
                    'key' => 'travel_information_outbound_trip_depart_date',
                    'value' => date('Ymd'),
                    'compare' => '=',
                    'type' => 'NUMERIC'
                );
                break;
            case 'yesterday':
                $yesterday = date('Ymd', strtotime('-1 day'));
                $date_conditions = array(
                    'key' => 'travel_information_outbound_trip_depart_date',
                    'value' => $yesterday,
                    'compare' => '=',
                    'type' => 'NUMERIC'
                );
                break;
            case 'last7days':
                $seven_days_ago = date('Ymd', strtotime('-7 days'));
                $today_ymd = date('Ymd');
                $date_conditions = array(
                    'key' => 'travel_information_outbound_trip_depart_date',
                    'value' => array($seven_days_ago, $today_ymd),
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                );
                break;
            case 'last30days':
                $thirty_days_ago = date('Ymd', strtotime('-30 days'));
                $today_ymd = date('Ymd');
                $date_conditions = array(
                    'key' => 'travel_information_outbound_trip_depart_date',
                    'value' => array($thirty_days_ago, $today_ymd),
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                );
                break;
            case 'thismonth':
                $first_day_month = date('Ym01');
                $last_day_month = date('Ymt');
                $date_conditions = array(
                    'key' => 'travel_information_outbound_trip_depart_date',
                    'value' => array($first_day_month, $last_day_month),
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                );
                break;
            case 'thisyear':
                $first_day_year = date('Y0101');
                $last_day_year = date('Y1231');
                $date_conditions = array(
                    'key' => 'travel_information_outbound_trip_depart_date',
                    'value' => array($first_day_year, $last_day_year),
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                );
                break;
        }
        
        if (!empty($date_conditions)) {
            $meta_query[] = $date_conditions;
        }
    }

    // Handle custom date range
    if (!empty($date_from) && !empty($date_to)) {
        $date_from_ymd = date('Ymd', strtotime($date_from));
        $date_to_ymd = date('Ymd', strtotime($date_to));
        
        $meta_query[] = array(
            'key' => 'travel_information_outbound_trip_depart_date',
            'value' => array($date_from_ymd, $date_to_ymd),
            'compare' => 'BETWEEN',
            'type' => 'NUMERIC'
        );
    } elseif (!empty($date_from)) {
        $date_from_ymd = date('Ymd', strtotime($date_from));
        $meta_query[] = array(
            'key' => 'travel_information_outbound_trip_depart_date',
            'value' => $date_from_ymd,
            'compare' => '>=',
            'type' => 'NUMERIC'
        );
    } elseif (!empty($date_to)) {
        $date_to_ymd = date('Ymd', strtotime($date_to));
        $meta_query[] = array(
            'key' => 'travel_information_outbound_trip_depart_date',
            'value' => $date_to_ymd,
            'compare' => '<=',
            'type' => 'NUMERIC'
        );
    }

    if (count($meta_query) > 1) {
        $args['meta_query'] = $meta_query;
    }
    
    // เพิ่มการเรียงลำดับตามพารามิเตอร์ orderby และ order
    $orderby = $request->get_param('orderby') ?: $request->get_param('sort');
    $order = $request->get_param('order') ? strtoupper($request->get_param('order')) : 'ASC';
    
    if (!empty($orderby)) {
        $orderby = sanitize_text_field($orderby);
        
        // จัดการกับการเรียงลำดับตามฟิลด์ต่างๆ
        switch ($orderby) {
            case 'id':
                $args['orderby'] = 'ID';
                $args['order'] = $order;
                break;
            case 'title': // รหัสการเช่า (post title)
                $args['orderby'] = 'title';
                $args['order'] = $order;
                break;
            case 'rental_code':
                $args['meta_key'] = 'rental_code';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'customer_name':
                $args['meta_key'] = 'personal_information_full_name';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'customer_phone':
                $args['meta_key'] = 'personal_information_phone_number';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'rental_status':
            case 'status':
                $args['meta_key'] = 'rental_status';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'arrival_date':
                $args['meta_key'] = 'travel_information_outbound_trip_depart_date';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'departure_date':
                $args['meta_key'] = 'travel_information_return_trip_return_date';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'package':
                $args['meta_key'] = 'selected_package_package_id';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            case 'price':
                $args['meta_key'] = 'selected_package_price';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            case 'rental_duration':
                $args['meta_key'] = 'rental_duration';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            default:
                $args['orderby'] = 'date';
                $args['order'] = 'DESC';
                break;
        }
    }

    $rentals_query = new WP_Query($args);
    $rentals = $rentals_query->posts;
    $total_rentals = $rentals_query->found_posts;
    $total_pages = ceil($total_rentals / $per_page);
    
    $data = array();
    foreach ($rentals as $rental) {
        $data[] = prepare_car_rental_response($rental);
    }
    
    $response = array(
        'data' => $data,
        'meta' => array(
            'current_page' => $page,
            'per_page' => $per_page,
            'total' => $total_rentals,
            'total_pages' => $total_pages,
        )
    );

    return new WP_REST_Response($response, 200);
}

/**
 * Get single car rental
 */
function get_car_rental($request) {
    $id = $request['id'];
    $rental = get_post($id);

    if (!$rental || $rental->post_type !== 'car_rentals') {
        return new WP_Error('no_rental', 'Car rental not found', array('status' => 404));
    }

    return new WP_REST_Response(prepare_car_rental_response($rental), 200);
}

/**
 * Create new car rental
 */
function create_car_rental($request) {
    $params = $request->get_json_params();

    $rental_data = array(
        'post_type' => 'car_rentals',
        'post_title' => sanitize_text_field($params['rental_code']),
        'post_status' => 'publish'
    );

    $rental_id = wp_insert_post($rental_data);

    if (is_wp_error($rental_id)) {
        return $rental_id;
    }

    // Update ACF fields
    if (isset($params['rental_code'])) update_field('rental_code', sanitize_text_field($params['rental_code']), $rental_id);
    if (isset($params['customer_name'])) update_field('customer_name', sanitize_text_field($params['customer_name']), $rental_id);
    if (isset($params['customer_phone'])) update_field('customer_phone', sanitize_text_field($params['customer_phone']), $rental_id);
    if (isset($params['vehicle_id'])) update_field('vehicle_id', (int) $params['vehicle_id'], $rental_id);
    if (isset($params['rental_status'])) update_field('rental_status', sanitize_text_field($params['rental_status']), $rental_id);
    if (isset($params['rental_start_date'])) update_field('rental_start_date', sanitize_text_field($params['rental_start_date']), $rental_id);
    if (isset($params['rental_end_date'])) update_field('rental_end_date', sanitize_text_field($params['rental_end_date']), $rental_id);
    if (isset($params['daily_rate'])) update_field('daily_rate', (float) $params['daily_rate'], $rental_id);
    if (isset($params['total_amount'])) update_field('total_amount', (float) $params['total_amount'], $rental_id);

    return new WP_REST_Response(prepare_car_rental_response(get_post($rental_id)), 201);
}

/**
 * Update car rental
 */
function update_car_rental($request) {
    $id = $request['id'];
    $params = $request->get_json_params();
    $rental = get_post($id);

    if (!$rental || $rental->post_type !== 'car_rentals') {
        return new WP_Error('no_rental', 'Car rental not found', array('status' => 404));
    }

    // Update ACF fields
    if (isset($params['rental_code'])) update_field('rental_code', sanitize_text_field($params['rental_code']), $id);
    if (isset($params['customer_name'])) update_field('customer_name', sanitize_text_field($params['customer_name']), $id);
    if (isset($params['customer_phone'])) update_field('customer_phone', sanitize_text_field($params['customer_phone']), $id);
    if (isset($params['vehicle_id'])) update_field('vehicle_id', (int) $params['vehicle_id'], $id);
    if (isset($params['rental_status'])) update_field('rental_status', sanitize_text_field($params['rental_status']), $id);
    if (isset($params['rental_start_date'])) update_field('rental_start_date', sanitize_text_field($params['rental_start_date']), $id);
    if (isset($params['rental_end_date'])) update_field('rental_end_date', sanitize_text_field($params['rental_end_date']), $id);
    if (isset($params['daily_rate'])) update_field('daily_rate', (float) $params['daily_rate'], $id);
    if (isset($params['total_amount'])) update_field('total_amount', (float) $params['total_amount'], $id);

    return new WP_REST_Response(prepare_car_rental_response(get_post($id)), 200);
}

/**
 * Delete car rental
 */
function delete_car_rental($request) {
    $id = $request['id'];
    $rental = get_post($id);

    if (!$rental || $rental->post_type !== 'car_rentals') {
        return new WP_Error('no_rental', 'Car rental not found', array('status' => 404));
    }

    $deleted = wp_delete_post($id, true);

    if (!$deleted) {
        return new WP_Error('cant_delete', 'Could not delete car rental', array('status' => 500));
    }

    return new WP_REST_Response(array('deleted' => true), 200);
}
/**
 * Prepare car rental response data
 */
function prepare_car_rental_response($rental) {
    // Get ACF field groups according to the JSON structure
    $selected_package = get_field('selected_package', $rental->ID);
    $personal_information = get_field('personal_information', $rental->ID);
    $travel_information_outbound_trip = get_field('travel_information_outbound_trip', $rental->ID);
    $travel_information_return_trip = get_field('travel_information_return_trip', $rental->ID);
    $additional_information = get_field('additional_information', $rental->ID);
    
    // Extract package information
    $package_post = isset($selected_package['package_id']) ? $selected_package['package_id'] : null;
    $route = isset($selected_package['route']) ? $selected_package['route'] : '';
    $car_type = isset($selected_package['car_type']) ? $selected_package['car_type'] : '';
    $price = isset($selected_package['price']) ? $selected_package['price'] : '';
    
    // Extract customer information from personal_information
    $customer_name = isset($personal_information['full_name']) ? $personal_information['full_name'] : '';
    $customer_phone = isset($personal_information['phone_number']) ? $personal_information['phone_number'] : '';
    $customer_email = isset($personal_information['email']) ? $personal_information['email'] : '';
    $customer_line_whatsapp = isset($personal_information['line_id_whatsapp']) ? $personal_information['line_id_whatsapp'] : '';
    
    // Extract flight information from travel_information_outbound_trip
    $arrival_date_raw = isset($travel_information_outbound_trip['depart_date']) ? $travel_information_outbound_trip['depart_date'] : '';
    $arrival_time = isset($travel_information_outbound_trip['depart_time']) ? $travel_information_outbound_trip['depart_time'] : '';
    $arrival_flight_no = isset($travel_information_outbound_trip['depart_start_location']) ? $travel_information_outbound_trip['depart_start_location'] : '';
    
    // Extract flight information from travel_information_return_trip
    $departure_date_raw = isset($travel_information_return_trip['return_date']) ? $travel_information_return_trip['return_date'] : '';
    $departure_time = isset($travel_information_return_trip['return_time']) ? $travel_information_return_trip['return_time'] : '';
    $departure_flight_no = isset($travel_information_return_trip['return_start_location']) ? $travel_information_return_trip['return_start_location'] : '';
    
    // Format dates from Ymd to d/m/Y format
    $arrival_date = $arrival_date_raw ? DateTime::createFromFormat('Y-m-d', $arrival_date_raw)->format('d/m/Y') : '';
    $departure_date = $departure_date_raw ? DateTime::createFromFormat('Y-m-d', $departure_date_raw)->format('d/m/Y') : '';
    
    // Extract additional information
    $discount_code = isset($additional_information['discount_code']) ? $additional_information['discount_code'] : '';
    $remark_flight = isset($additional_information['remark_flight']) ? $additional_information['remark_flight'] : '';
    
    // Derive rental code from text in parentheses in post title, e.g. "... (CR20250730-22C666)"
    $title = $rental->post_title;
    if (preg_match('/\(([^)]+)\)/', $title, $m)) {
        $rental_code = $m[1];
    } else {
        $rental_code = $title; // fallback
    }
    
    // Calculate rental duration
    $rental_duration = 0;
    if ($arrival_date_raw && $departure_date_raw) {
        $start = DateTime::createFromFormat('Ymd', $arrival_date_raw);
        $end = DateTime::createFromFormat('Ymd', $departure_date_raw);
        if ($start && $end) {
            $rental_duration = $end->diff($start)->days + 1;
        }
    }
    
    // Get package data if package_post exists
    $package_data = null;
    if ($package_post && is_object($package_post)) {
        $package_data = array(
            'id' => $package_post->ID,
            'title' => $package_post->post_title,
            'route' => $route,
            'car_type' => $car_type,
            'price' => $price
        );
    }
    
    return array(
        'id' => $rental->ID,
        'title' => $rental->post_title,
        'date' => $rental->post_date,
        'status' => $rental->post_status,
        'acf' => array(
            'rental_code' => $rental_code,
            'selected_package' => array(
                'package_id' => $package_data,
                'route' => $route,
                'car_type' => $car_type,
                'price' => $price
            ),
            'personal_information' => array(
                'full_name' => $customer_name,
                'phone_number' => $customer_phone,
                'email' => $customer_email,
                'line_id_whatsapp' => $customer_line_whatsapp
            ),
            'travel_information_outbound_trip' => array(
                'depart_date' => $arrival_date,
                'depart_time' => $arrival_time,
                'depart_start_location' => $arrival_flight_no
            ),
            'travel_information_return_trip' => array(
                'return_date' => $departure_date,
                'return_time' => $departure_time,
                'return_start_location' => $departure_flight_no
            ),
            'additional_information' => array(
                'discount_code' => $discount_code,
                'remark_flight' => $remark_flight
            ),
            'rental_duration' => $rental_duration
        )
    );
}

/**
 * Flush rewrite rules on activation
 */
function car_rental_rewrite_flush() {
    flush_rewrite_rules();
}

register_activation_hook(__FILE__, 'car_rental_rewrite_flush');

/**
 * Export car rentals data in various formats
 */
function export_car_rentals($request) {
    $format = $request->get_param('format') ?: 'csv';
    $search = $request->get_param('search');
    $status = $request->get_param('status');
    
    $args = array(
        'post_type' => 'car_rentals',
        'posts_per_page' => -1,
        'post_status' => 'publish',
    );
    
    if (!empty($search)) {
        $args['s'] = sanitize_text_field($search);
    }
    
    if (!empty($status)) {
        $args['meta_query'] = array(
            array(
                'key' => 'rental_status',
                'value' => sanitize_text_field($status),
                'compare' => '='
            )
        );
    }
    
    // เพิ่มการเรียงลำดับตามพารามิเตอร์ orderby และ order
    $orderby = $request->get_param('orderby') ?: $request->get_param('sort');
    $order = $request->get_param('order') ? strtoupper($request->get_param('order')) : 'ASC';
    
    if (!empty($orderby)) {
        $orderby = sanitize_text_field($orderby);
        
        // จัดการกับการเรียงลำดับตามฟิลด์ต่างๆ
        switch ($orderby) {
            case 'id':
                $args['orderby'] = 'ID';
                $args['order'] = $order;
                break;
            case 'title': // รหัสการเช่า (post title)
                $args['orderby'] = 'title';
                $args['order'] = $order;
                break;
            case 'rental_code':
                $args['meta_key'] = 'rental_code';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'customer_name':
                $args['meta_key'] = 'personal_information_full_name';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'customer_phone':
                $args['meta_key'] = 'personal_information_phone_number';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'rental_status':
            case 'status':
                $args['meta_key'] = 'rental_status';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'arrival_date':
                $args['meta_key'] = 'travel_information_outbound_trip_depart_date';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'departure_date':
                $args['meta_key'] = 'travel_information_return_trip_return_date';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'package':
                $args['meta_key'] = 'selected_package_package_id';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            case 'price':
                $args['meta_key'] = 'selected_package_price';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            case 'rental_duration':
                $args['meta_key'] = 'rental_duration';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            default:
                $args['orderby'] = 'date';
                $args['order'] = 'DESC';
                break;
        }
    }
    
    $rentals_query = new WP_Query($args);
    $rentals = $rentals_query->posts;
    
    $data = array();
    foreach ($rentals as $rental) {
        $data[] = prepare_car_rental_response($rental);
    }
    
    switch ($format) {
        case 'excel':
            return export_rentals_to_excel($data);
        case 'pdf':
            return export_rentals_to_pdf($data);
        case 'csv':
            return export_rentals_to_csv($data);
        default:
            return new WP_REST_Response(array('error' => 'Unsupported export format'), 400);
    }
}

/**
 * Export data to Excel format
 */
function export_rentals_to_excel($data) {
    // ในสถานการณ์จริง คุณควรใช้ไลบรารีเช่น PhpSpreadsheet เพื่อสร้างไฟล์ Excel
    // แต่สำหรับตัวอย่างนี้ เราจะส่งกลับ CSV ที่สามารถเปิดได้ใน Excel
    
    $filename = 'car-rentals-' . date('Y-m-d') . '.xlsx';
    
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: max-age=0');
    
    $output = fopen('php://output', 'w');
    
    // เพิ่ม BOM สำหรับการรองรับ UTF-8 ใน Excel
    fputs($output, "\xEF\xBB\xBF");
    
    // หัวตาราง - ใช้โครงสร้างที่ถูกต้องตาม ACF fields จาก JSON
    fputcsv($output, array('รหัสการเช่า', 'ชื่อลูกค้า', 'เบอร์โทร', 'อีเมล', 'LINE/WhatsApp', 'แพ็คเกจ', 'เส้นทาง', 'ประเภทรถ', 'วันไป', 'เวลาไป', 'เที่ยวบินไป', 'วันกลับ', 'เวลากลับ', 'เที่ยวบินกลับ', 'จำนวนวัน', 'ราคา', 'โค้ดส่วนลด', 'หมายเหตุ'));
    
    // ข้อมูล - ใช้โครงสร้างที่ถูกต้องตาม ACF fields
    foreach ($data as $row) {
        $acf = $row['acf'];
        
        $package_title = isset($acf['selected_package']['package_id']['title']) ? $acf['selected_package']['package_id']['title'] : '-';
        $route = $acf['selected_package']['route'] ?? '-';
        $car_type = $acf['selected_package']['car_type'] ?? '-';
        $price = $acf['selected_package']['price'] ?? '0';
        
        $customer_name = $acf['customer_info']['customer_name'] ?? '-';
        $customer_phone = $acf['customer_info']['customer_phone'] ?? '-';
        $customer_email = $acf['customer_info']['customer_email'] ?? '-';
        $customer_line_whatsapp = $acf['customer_info']['customer_line'] ?? '-';
        
        $arrival_date = $acf['flight_info']['arrival_date'] ?? '-';
        $arrival_time = $acf['flight_info']['arrival_time'] ?? '-';
        $arrival_flight_no = $acf['flight_info']['arrival_flight_no'] ?? '-';
        $departure_date = $acf['flight_info']['departure_date'] ?? '-';
        $departure_time = $acf['flight_info']['departure_time'] ?? '-';
        $departure_flight_no = $acf['flight_info']['departure_flight_no'] ?? '-';
        $rental_duration = $acf['rental_duration'] ?? 0;
        
        $discount_code = $acf['additional_info']['discount_code'] ?? '-';
        $remark_flight = $acf['additional_info']['remark_flight'] ?? '-';
        
        fputcsv($output, array(
            $acf['rental_code'],
            $customer_name,
            $customer_phone,
            $customer_email,
            $customer_line_whatsapp,
            $package_title,
            $route,
            $car_type,
            $arrival_date,
            $arrival_time,
            $arrival_flight_no,
            $departure_date,
            $departure_time,
            $departure_flight_no,
            $rental_duration,
            $price,
            $discount_code,
            $remark_flight
        ));
    }
    
    fclose($output);
    exit;
}

/**
 * Export data to PDF format
 */
function export_rentals_to_pdf($data) {
    // ในสถานการณ์จริง คุณควรใช้ไลบรารีเช่น TCPDF หรือ mPDF เพื่อสร้างไฟล์ PDF
    // แต่สำหรับตัวอย่างนี้ เราจะส่งกลับข้อความแจ้งว่าต้องติดตั้งไลบรารี
    
    $filename = 'car-rentals-' . date('Y-m-d') . '.pdf';
    
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    // ในสถานการณ์จริง คุณควรสร้าง PDF ที่นี่
    echo 'PDF Export Placeholder - ต้องติดตั้งไลบรารี TCPDF หรือ mPDF';
    exit;
}

/**
 * Export data to CSV format
 */
function export_rentals_to_csv($data) {
    $filename = 'car-rentals-' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // เพิ่ม BOM สำหรับการรองรับ UTF-8 ใน Excel
    fputs($output, "\xEF\xBB\xBF");
    
    // หัวตาราง - ใช้โครงสร้างที่ถูกต้องตาม ACF fields จาก JSON
    fputcsv($output, array('รหัสการเช่า', 'ชื่อลูกค้า', 'เบอร์โทร', 'อีเมล', 'LINE/WhatsApp', 'แพ็คเกจ', 'เส้นทาง', 'ประเภทรถ', 'วันไป', 'เวลาไป', 'เที่ยวบินไป', 'วันกลับ', 'เวลากลับ', 'เที่ยวบินกลับ', 'จำนวนวัน', 'ราคา', 'โค้ดส่วนลด', 'หมายเหตุ'));
    
    // ข้อมูล - ใช้โครงสร้างที่ถูกต้องตาม ACF fields
    foreach ($data as $row) {
        $acf = $row['acf'];
        
        $package_title = isset($acf['selected_package']['package_id']['title']) ? $acf['selected_package']['package_id']['title'] : '-';
        $route = $acf['selected_package']['route'] ?? '-';
        $car_type = $acf['selected_package']['car_type'] ?? '-';
        $price = $acf['selected_package']['price'] ?? '0';
        
        $customer_name = $acf['customer_info']['customer_name'] ?? '-';
        $customer_phone = $acf['customer_info']['customer_phone'] ?? '-';
        $customer_email = $acf['customer_info']['customer_email'] ?? '-';
        $customer_line_whatsapp = $acf['customer_info']['customer_line'] ?? '-';
        
        $arrival_date = $acf['flight_info']['arrival_date'] ?? '-';
        $arrival_time = $acf['flight_info']['arrival_time'] ?? '-';
        $arrival_flight_no = $acf['flight_info']['arrival_flight_no'] ?? '-';
        $departure_date = $acf['flight_info']['departure_date'] ?? '-';
        $departure_time = $acf['flight_info']['departure_time'] ?? '-';
        $departure_flight_no = $acf['flight_info']['departure_flight_no'] ?? '-';
        $rental_duration = $acf['rental_duration'] ?? 0;
        
        $discount_code = $acf['additional_info']['discount_code'] ?? '-';
        $remark_flight = $acf['additional_info']['remark_flight'] ?? '-';
        
        fputcsv($output, array(
            $acf['rental_code'],
            $customer_name,
            $customer_phone,
            $customer_email,
            $customer_line_whatsapp,
            $package_title,
            $route,
            $car_type,
            $arrival_date,
            $arrival_time,
            $arrival_flight_no,
            $departure_date,
            $departure_time,
            $departure_flight_no,
            $rental_duration,
            $price,
            $discount_code,
            $remark_flight
        ));
    }
    
    fclose($output);
    exit;
}

?>