<?php
/**
 * REST API Route for Parking Booking Post Type
 */

function enqueue_parking_js() {
    if (is_page('dashboard')) {
        wp_enqueue_script('parking', get_template_directory_uri() . '/dashboard/parking-management/js/parking.js', array(), false, true);
    }
}
add_action('wp_enqueue_scripts', 'enqueue_parking_js');

function register_parking_booking_list_rest_routes() {
    // Route for getting and creating bookings
    register_rest_route('parking/v1', '/bookings', array(
        array(
            'methods' => 'GET',
            'callback' => 'get_parking_booking_list_data',
            'permission_callback' => '__return_true',
        ),
        array(
            'methods' => 'POST',
            'callback' => 'create_new_parking_booking_list',
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            },
        ),
    ));

    // Route for getting, updating, and deleting a single booking
    register_rest_route('parking/v1', '/bookings/(?P<id>\d+)', array(
        array(
            'methods' => 'GET',
            'callback' => 'get_parking_booking_list_by_id',
            'permission_callback' => '__return_true',
        ),
        array(
            'methods' => 'PUT',
            'callback' => 'update_existing_parking_booking_list',
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            },
        ),
        array(
            'methods' => 'DELETE',
            'callback' => 'delete_parking_booking_list_by_id',
            'permission_callback' => function() {
                return current_user_can('delete_posts');
            },
        ),
    ));
    
    // Endpoint for exporting data
    register_rest_route('parking/v1', '/bookings/export', array(
        'methods' => 'GET',
        'callback' => 'export_parking_booking_list_data',
        'permission_callback' => '__return_true',
    ));

    // Endpoint for today's bookings
    register_rest_route('parking/v1', '/today-bookings', array(
        'methods' => 'GET',
        'callback' => 'get_today_bookings',
        'permission_callback' => '__return_true',
    ));

    // Endpoint for monthly bookings
    register_rest_route('parking/v1', '/monthly-bookings', array(
        'methods' => 'GET',
        'callback' => 'get_monthly_bookings',
        'permission_callback' => '__return_true',
    ));
}

add_action('rest_api_init', 'register_parking_booking_list_rest_routes');

/**
 * Get all parking bookings with pagination, search and filtering
 */
function get_parking_booking_list_data($request) {
    $page = $request->get_param('page') ? (int) $request->get_param('page') : 1;
    $per_page = $request->get_param('per_page') ? (int) $request->get_param('per_page') : 100;
    $search = $request->get_param('search');
    $status = $request->get_param('status');
    $start_date = $request->get_param('start_date');
    $date_from = $request->get_param('date_from');
    $date_to = $request->get_param('date_to');
    $date_range = $request->get_param('date_range');

    $args = array(
        'post_type' => 'parking_booking',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'post_status' => 'publish',
        'orderby' => 'date',
        'order' => 'DESC',
    );

    $meta_query = array('relation' => 'AND');

    if (!empty($search)) {
        $args['s'] = sanitize_text_field($search);
    }

    if (!empty($status)) {
        $meta_query[] = array(
            'key' => 'booking_status_relation',
            'value' => sanitize_text_field($status),
            'compare' => '=',
        );
    }

    if (!empty($start_date)) {
        $meta_query[] = array(
            'key' => 'start_date',
            'value' => sanitize_text_field($start_date),
            'compare' => 'LIKE',
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
                    'key' => 'start_date',
                    'value' => $today,
                    'compare' => '=',
                    'type' => 'DATE'
                );
                break;
            case 'yesterday':
                $yesterday = date('Y-m-d', strtotime('-1 day'));
                $date_conditions = array(
                    'key' => 'start_date',
                    'value' => $yesterday,
                    'compare' => '=',
                    'type' => 'DATE'
                );
                break;
            case 'last7days':
                $seven_days_ago = date('Y-m-d', strtotime('-7 days'));
                $date_conditions = array(
                    'key' => 'start_date',
                    'value' => array($seven_days_ago, $today),
                    'compare' => 'BETWEEN',
                    'type' => 'DATE'
                );
                break;
            case 'last30days':
                $thirty_days_ago = date('Y-m-d', strtotime('-30 days'));
                $date_conditions = array(
                    'key' => 'start_date',
                    'value' => array($thirty_days_ago, $today),
                    'compare' => 'BETWEEN',
                    'type' => 'DATE'
                );
                break;
            case 'thismonth':
                $first_day_month = date('Y-m-01');
                $last_day_month = date('Y-m-t');
                $date_conditions = array(
                    'key' => 'start_date',
                    'value' => array($first_day_month, $last_day_month),
                    'compare' => 'BETWEEN',
                    'type' => 'DATE'
                );
                break;
            case 'thisyear':
                $first_day_year = date('Y-01-01');
                $last_day_year = date('Y-12-31');
                $date_conditions = array(
                    'key' => 'start_date',
                    'value' => array($first_day_year, $last_day_year),
                    'compare' => 'BETWEEN',
                    'type' => 'DATE'
                );
                break;
        }
        
        if (!empty($date_conditions)) {
            $meta_query[] = $date_conditions;
        }
    }

    // Handle custom date range
    if (!empty($date_from) && !empty($date_to)) {
        $date_from = sanitize_text_field($date_from);
        $date_to = sanitize_text_field($date_to);
        
        $meta_query[] = array(
            'key' => 'start_date',
            'value' => array($date_from, $date_to),
            'compare' => 'BETWEEN',
            'type' => 'DATE'
        );
    } elseif (!empty($date_from)) {
        $date_from = sanitize_text_field($date_from);
        $meta_query[] = array(
            'key' => 'start_date',
            'value' => $date_from,
            'compare' => '>=',
            'type' => 'DATE'
        );
    } elseif (!empty($date_to)) {
        $date_to = sanitize_text_field($date_to);
        $meta_query[] = array(
            'key' => 'start_date',
            'value' => $date_to,
            'compare' => '<=',
            'type' => 'DATE'
        );
    }

    if (count($meta_query) > 1) {
        $args['meta_query'] = $meta_query;
    }
    
    $orderby = $request->get_param('orderby') ?: $request->get_param('sort');
    $order = $request->get_param('order') ? strtoupper($request->get_param('order')) : 'DESC';
    
    if (!empty($orderby)) {
        $orderby = sanitize_text_field($orderby);
        $meta_keys = ['order_code', 'fullname_park', 'phone_park', 'booking_status_relation', 'start_date', 'end_date'];
        if (in_array($orderby, $meta_keys)) {
            $args['meta_key'] = $orderby;
            $args['orderby'] = 'meta_value';
        } else {
            $args['orderby'] = $orderby;
        }
        $args['order'] = $order;
    }

    $query = new WP_Query($args);

    return create_paginated_response($query, $page, $per_page);
}

/**
 * Get single parking booking
 */
function get_parking_booking_list_by_id($request) {
    $id = $request['id'];
    $booking = get_post($id);

    if (!$booking || $booking->post_type !== 'parking_booking') {
        return new WP_Error('no_booking', 'Parking booking not found', array('status' => 404));
    }

    return new WP_REST_Response(prepare_parking_booking_list_response($booking), 200);
}

/**
 * Create new parking booking
 */
function create_new_parking_booking_list($request) {
    $params = $request->get_json_params();

    $booking_data = array(
        'post_type' => 'parking_booking',
        'post_title' => sanitize_text_field($params['order_code'] ?? 'New Parking Booking'),
        'post_status' => 'publish'
    );

    $booking_id = wp_insert_post($booking_data);

    if (is_wp_error($booking_id)) {
        return $booking_id;
    }

    // Update ACF fields
    if (isset($params['order_code'])) update_field('order_code', sanitize_text_field($params['order_code']), $booking_id);
    if (isset($params['fullname_park'])) update_field('fullname_park', sanitize_text_field($params['fullname_park']), $booking_id);
    if (isset($params['email_park'])) update_field('email_park', sanitize_email($params['email_park']), $booking_id);
    if (isset($params['phone_park'])) update_field('phone_park', sanitize_text_field($params['phone_park']), $booking_id);
    if (isset($params['line_id_park'])) update_field('line_id_park', sanitize_text_field($params['line_id_park']), $booking_id);
    if (isset($params['start_date'])) update_field('start_date', sanitize_text_field($params['start_date']), $booking_id);
    if (isset($params['start_time'])) update_field('start_time', sanitize_text_field($params['start_time']), $booking_id);
    if (isset($params['end_date'])) update_field('end_date', sanitize_text_field($params['end_date']), $booking_id);
    if (isset($params['end_time'])) update_field('end_time', sanitize_text_field($params['end_time']), $booking_id);
    if (isset($params['booking_status_relation'])) update_field('booking_status_relation', (int) $params['booking_status_relation'], $booking_id);
    if (isset($params['location_park'])) update_field('location_park', (int) $params['location_park'], $booking_id);

    return new WP_REST_Response(prepare_parking_booking_list_response(get_post($booking_id)), 201);
}

/**
 * Update parking booking
 */
function update_existing_parking_booking_list($request) {
    $id = $request['id'];
    $params = $request->get_json_params();
    $booking = get_post($id);

    if (!$booking || $booking->post_type !== 'parking_booking') {
        return new WP_Error('no_booking', 'Parking booking not found', array('status' => 404));
    }

    // Update ACF fields
    if (isset($params['order_code'])) update_field('order_code', sanitize_text_field($params['order_code']), $id);
    if (isset($params['fullname_park'])) update_field('fullname_park', sanitize_text_field($params['fullname_park']), $id);
    if (isset($params['email_park'])) update_field('email_park', sanitize_email($params['email_park']), $id);
    if (isset($params['phone_park'])) update_field('phone_park', sanitize_text_field($params['phone_park']), $id);
    if (isset($params['line_id_park'])) update_field('line_id_park', sanitize_text_field($params['line_id_park']), $id);
    if (isset($params['start_date'])) update_field('start_date', sanitize_text_field($params['start_date']), $id);
    if (isset($params['start_time'])) update_field('start_time', sanitize_text_field($params['start_time']), $id);
    if (isset($params['end_date'])) update_field('end_date', sanitize_text_field($params['end_date']), $id);
    if (isset($params['end_time'])) update_field('end_time', sanitize_text_field($params['end_time']), $id);
    if (isset($params['booking_status_relation'])) update_field('booking_status_relation', (int) $params['booking_status_relation'], $id);
    if (isset($params['location_park'])) update_field('location_park', (int) $params['location_park'], $id);

    return new WP_REST_Response(prepare_parking_booking_list_response(get_post($id)), 200);
}

/**
 * Delete parking booking
 */
function delete_parking_booking_list_by_id($request) {
    $id = $request['id'];
    $booking = get_post($id);

    if (!$booking || $booking->post_type !== 'parking_booking') {
        return new WP_Error('no_booking', 'Parking booking not found', array('status' => 404));
    }

    $deleted = wp_delete_post($id, true);

    if (!$deleted) {
        return new WP_Error('cant_delete', 'Could not delete parking booking', array('status' => 500));
    }

    return new WP_REST_Response(array('deleted' => true), 200);
}

/**
 * Prepare parking booking response data using the provided function
 */
function prepare_parking_booking_list_response($post) {
    $post_id = $post->ID;

    // Vehicle Info Repeater
    $vehicle_info = array();
    if (have_rows('vehicle_info', $post_id)) {
        while (have_rows('vehicle_info', $post_id)) {
            the_row();
            $vehicle_info[] = array(
                'vehicle_type_relation' => get_sub_field('vehicle_type_relation') ? get_sub_field('vehicle_type_relation')->ID : null,
                'license_plate'         => get_sub_field('license_plate'),
                'other_type_car'        => get_sub_field('other_type_car'),
                'booked_parking_space'  => get_sub_field('booked_parking_space') ? get_sub_field('booked_parking_space')->ID : null,
                'zone_parking'          => get_sub_field('zone_parking') ? get_sub_field('zone_parking')->ID : null,
                'parking_slot'          => get_sub_field('parking_slot'),
                'parking_slot_id'       => get_sub_field('parking_slot_id'),
            );
        }
    }

    // Location Data
    $location_data = null;
    $location = get_field('location_park', $post_id);
    if ($location) {
        $term = is_object($location) ? $location : get_term($location, 'location');
        if ($term && !is_wp_error($term)) {
            $location_data = array(
                'id' => $term->term_id,
                'name' => $term->name,
                'slug' => $term->slug
            );
        }
    }

    // Addon Information
    $addon_data = array();
    $addon_information = get_field('addon_information', $post_id);
    if ($addon_information) {
        $addon_data = array(
            'service_pickup' => !empty($addon_information['service_pickup']),
            'service_valet' => !empty($addon_information['service_valet']),
            'sending_flight' => $addon_information['sending_flight'] ?? [],
            'parking_car' => $addon_information['parking_car'] ?? [],
        );
    }
    
    $booking_status = get_field('booking_status_relation', $post_id);

    return array(
        'id' => $post_id,
        'order_code' => get_field('order_code', $post_id),
        'qr_code_url' => get_field('qr_code_url', $post_id),
        'tracking_check_status' => get_field('tracking_check_status', $post_id),
        'title' => get_the_title($post_id),
        'start_date' => get_field('start_date', $post_id),
        'start_time' => get_field('start_time', $post_id),
        'end_date'   => get_field('end_date', $post_id),
        'end_time'   => get_field('end_time', $post_id),
        'booking_status_relation' => $booking_status ? (is_object($booking_status) ? $booking_status->ID : $booking_status) : null,
        'fullname_park' => get_field('fullname_park', $post_id),
        'email_park' => get_field('email_park', $post_id),
        'line_id_park' => get_field('line_id_park', $post_id),
        'phone_park' => get_field('phone_park', $post_id),
        'customer_info' => get_field('customer_info', $post_id),
        'customer_user' => get_field('customer_user', $post_id) ? (is_object(get_field('customer_user', $post_id)) ? get_field('customer_user', $post_id)->ID : get_field('customer_user', $post_id)) : null,
        'vehicle_info'  => $vehicle_info,
        'location_park' => $location_data,
        'addon_information' => $addon_data,
    );
}

/**
 * Export parking bookings data in various formats
 */
function export_parking_booking_list_data($request) {
    $format = $request->get_param('format') ?: 'csv';
    $search = $request->get_param('search');
    $status = $request->get_param('status');
    
    $args = array(
        'post_type' => 'parking_booking',
        'posts_per_page' => -1,
        'post_status' => 'publish',
    );
    
    if (!empty($search)) {
        $args['s'] = sanitize_text_field($search);
    }
    
    if (!empty($status)) {
        $args['meta_query'] = array(
            array(
                'key' => 'booking_status_relation',
                'value' => sanitize_text_field($status),
                'compare' => '='
            )
        );
    }
    
    $orderby = $request->get_param('orderby') ?: $request->get_param('sort');
    $order = $request->get_param('order') ? strtoupper($request->get_param('order')) : 'DESC';
    
    if (!empty($orderby)) {
        $orderby = sanitize_text_field($orderby);
        
        switch ($orderby) {
            case 'id':
                $args['orderby'] = 'ID';
                $args['order'] = $order;
                break;
            case 'title':
                $args['orderby'] = 'title';
                $args['order'] = $order;
                break;
            case 'order_code':
                $args['meta_key'] = 'order_code';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'customer_name':
                $args['meta_key'] = 'fullname_park';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'customer_phone':
                $args['meta_key'] = 'phone_park';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'booking_status':
            case 'status':
                $args['meta_key'] = 'booking_status_relation';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'start_date':
                $args['meta_key'] = 'start_date';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'end_date':
                $args['meta_key'] = 'end_date';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            default:
                $args['orderby'] = 'date';
                $args['order'] = 'DESC';
                break;
        }
    }
    
    $bookings_query = new WP_Query($args);
    $bookings = $bookings_query->posts;
    
    $data = array();
    foreach ($bookings as $booking) {
        $data[] = prepare_parking_booking_list_response($booking);
    }
    
    switch ($format) {
        case 'excel':
            return export_parking_to_excel($data);
        case 'pdf':
            return export_parking_to_pdf($data);
        case 'csv':
            return export_parking_to_csv($data);
        default:
            return new WP_REST_Response(array('error' => 'Unsupported export format'), 400);
    }
}

/**
 * Export data to Excel format
 */
function export_parking_to_excel($data) {
    $filename = 'parking-bookings-' . date('Y-m-d') . '.xlsx';
    
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: max-age=0');
    
    $output = fopen('php://output', 'w');
    
    fputs($output, "\xEF\xBB\xBF");
    
    fputcsv($output, array('รหัสจอง', 'ชื่อลูกค้า', 'เบอร์โทร', 'อีเมล', 'LINE ID', 'วันที่เริ่ม', 'เวลาเริ่ม', 'วันที่สิ้นสุด', 'เวลาสิ้นสุด', 'สถานะ', 'สถานที่จอด', 'ป้ายทะเบียน', 'ประเภทรถ', 'โซนจอด', 'ช่องจอด'));
    
    foreach ($data as $row) {
        $vehicle_plate = '';
        $vehicle_type = '';
        $parking_zone = '';
        $parking_slot = '';
        
        if (!empty($row['vehicle_info'])) {
            $vehicle = $row['vehicle_info'][0];
            $vehicle_plate = $vehicle['license_plate'] ?? '';
            $vehicle_type = $vehicle['other_type_car'] ?? '';
            $parking_zone = $vehicle['zone_parking'] ?? '';
            $parking_slot = $vehicle['parking_slot'] ?? '';
        }
        
        $location_name = $row['location_park']['name'] ?? '';
        
        fputcsv($output, array(
            $row['order_code'],
            $row['fullname_park'],
            $row['phone_park'],
            $row['email_park'],
            $row['line_id_park'],
            $row['start_date'],
            $row['start_time'],
            $row['end_date'],
            $row['end_time'],
            $row['booking_status_relation'],
            $location_name,
            $vehicle_plate,
            $vehicle_type,
            $parking_zone,
            $parking_slot
        ));
    }
    
    fclose($output);
    exit;
}

/**
 * Export data to PDF format
 */
function export_parking_to_pdf($data) {
    $filename = 'parking-bookings-' . date('Y-m-d') . '.pdf';
    
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    echo 'PDF Export Placeholder - ต้องติดตั้งไลบรารี TCPDF หรือ mPDF';
    exit;
}

/**
 * Export data to CSV format
 */
function export_parking_to_csv($data) {
    $filename = 'parking-bookings-' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    fputs($output, "\xEF\xBB\xBF");
    
    fputcsv($output, array('รหัสจอง', 'ชื่อลูกค้า', 'เบอร์โทร', 'อีเมล', 'LINE ID', 'วันที่เริ่ม', 'เวลาเริ่ม', 'วันที่สิ้นสุด', 'เวลาสิ้นสุด', 'สถานะ', 'สถานที่จอด', 'ป้ายทะเบียน', 'ประเภทรถ', 'โซนจอด', 'ช่องจอด'));
    
    foreach ($data as $row) {
        $vehicle_plate = '';
        $vehicle_type = '';
        $parking_zone = '';
        $parking_slot = '';
        
        if (!empty($row['vehicle_info'])) {
            $vehicle = $row['vehicle_info'][0];
            $vehicle_plate = $vehicle['license_plate'] ?? '';
            $vehicle_type = $vehicle['other_type_car'] ?? '';
            $parking_zone = $vehicle['zone_parking'] ?? '';
            $parking_slot = $vehicle['parking_slot'] ?? '';
        }
        
        $location_name = $row['location_park']['name'] ?? '';
        
        fputcsv($output, array(
            $row['order_code'],
            $row['fullname_park'],
            $row['phone_park'],
            $row['email_park'],
            $row['line_id_park'],
            $row['start_date'],
            $row['start_time'],
            $row['end_date'],
            $row['end_time'],
            $row['booking_status_relation'],
            $location_name,
            $vehicle_plate,
            $vehicle_type,
            $parking_zone,
            $parking_slot
        ));
    }
    
    fclose($output);
    exit;
}

/**
 * Flush rewrite rules on activation
 */
function parking_booking_list_rewrite_flush() {
    flush_rewrite_rules();
}

register_activation_hook(__FILE__, 'parking_booking_list_rewrite_flush');

function get_today_bookings($request) {
    $page = $request->get_param('page') ? (int) $request->get_param('page') : 1;
    $per_page = 10;

    $args = array(
        'post_type' => 'parking_booking',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'post_status' => 'publish',
        'meta_query' => array(
            array(
                'key' => 'start_date',
                'value' => date('Y-m-d'),
                'compare' => '=',
                'type' => 'DATE',
            ),
        ),
        'orderby' => 'date',
        'order' => 'DESC',
    );

    $query = new WP_Query($args);

    return create_paginated_response($query, $page, $per_page);
}

function get_monthly_bookings($request) {
    $page = $request->get_param('page') ? (int) $request->get_param('page') : 1;
    $year = $request->get_param('year') ? (int) $request->get_param('year') : date('Y');
    $month = $request->get_param('month') ? (int) $request->get_param('month') : date('m');
    $per_page = 10;

    $args = array(
        'post_type' => 'parking_booking',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'post_status' => 'publish',
        'date_query' => array(
            array(
                'year'  => $year,
                'month' => $month,
            ),
        ),
        'orderby' => 'date',
        'order' => 'DESC',
    );

    $query = new WP_Query($args);

    return create_paginated_response($query, $page, $per_page);
}

/**
 * Creates a paginated REST response from a WP_Query object.
 */
function create_paginated_response($query, $page, $per_page) {
    $data = array_map('prepare_parking_booking_list_response', $query->posts);
    wp_reset_postdata();

    $response = array(
        'data' => $data,
        'meta' => array(
            'total' => (int) $query->found_posts,
            'total_pages' => $query->max_num_pages,
            'current_page' => $page,
            'per_page' => $per_page,
        )
    );

    return new WP_REST_Response($response, 200);
}
