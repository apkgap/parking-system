<?php 
// REST API: Parking Booking Addon endpoints
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/parking_booking/addon', array(
        'methods' => 'GET',
        'callback' => 'get_parking_booking_addon_data',
        'permission_callback' => '__return_true',
        'args' => array(
            'booking_id' => array(
                'required' => false,
                'type' => 'integer',
                'description' => 'Filter addon data by specific booking ID',
                'sanitize_callback' => 'absint',
            ),
            'page' => array(
                'required' => false,
                'type' => 'integer',
                'description' => 'Page number for pagination',
                'sanitize_callback' => 'absint',
            ),
            'per_page' => array(
                'required' => false,
                'type' => 'integer',
                'description' => 'Number of items per page',
                'sanitize_callback' => 'absint',
            ),
            'orderby' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Field to order by',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'order' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Order direction (ASC or DESC)',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'search' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Search term',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
    
    register_rest_route('custom/v1', '/parking_booking/addon', array(
        'methods' => 'POST',
        'callback' => 'update_parking_booking_addon_data',
        'permission_callback' => '__return_true',
        'args' => array(
            'booking_id' => array(
                'required' => true,
                'type' => 'integer',
                'description' => 'Booking post ID to update addon data',
                'sanitize_callback' => 'absint',
            ),
            'addon_data' => array(
                'required' => true,
                'type' => 'object',
                'description' => 'Addon data structure based on ACF fields',
            ),
        ),
    ));
});

function get_parking_booking_addon_data($request) {
    $booking_id = $request->get_param('booking_id');
    
    // Add pagination parameters
    $page = $request->get_param('page') ? (int) $request->get_param('page') : 1;
    $per_page = $request->get_param('per_page') ? (int) $request->get_param('per_page') : 12;
    $search = $request->get_param('search');
    
    // Add sorting parameters
    $orderby = $request->get_param('orderby');
    $order = $request->get_param('order') ? strtoupper($request->get_param('order')) : 'DESC';
    
    $args = array(
        'post_type' => 'parking_booking',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
    );
    
    // Add search if specified
    if (!empty($search)) {
        $args['s'] = sanitize_text_field($search);
    }
    
    // Apply sorting if specified
    if (!empty($orderby)) {
        $orderby = sanitize_text_field($orderby);
        
        // Handle different sorting options
        switch ($orderby) {
            case 'id':
                $args['orderby'] = 'ID';
                $args['order'] = $order;
                break;
            case 'title':
            case 'customer':
                $args['orderby'] = 'title';
                $args['order'] = $order;
                break;
            case 'date':
            case 'start_date':
            case 'end_date':
                $args['orderby'] = 'date';
                $args['order'] = $order;
                break;
            case 'license_plate':
                $args['meta_key'] = 'license_plate';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'location':
                $args['meta_key'] = 'location';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'status':
                $args['meta_key'] = 'status';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            // Add more cases as needed for meta fields
            default:
                $args['orderby'] = 'date';
                $args['order'] = 'DESC';
                break;
        }
    } else {
        // Default sorting
        $args['orderby'] = 'date';
        $args['order'] = 'DESC';
    }
    
    if ($booking_id) {
        $args['p'] = $booking_id;
    }
    
    $query = new WP_Query($args);
    $data = [];
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            
            $addon_information = get_field('addon_information');
            
            // Structure addon data according to ACF fields
            $addon_data = array();
            
            if ($addon_information) {
                $addon_data = array(
                    'service_pickup' => !empty($addon_information['service_pickup']),
                    'service_valet' => !empty($addon_information['service_valet']),
                    'sending_flight' => array(
                        'depart' => $addon_information['sending_flight']['depart'] ?? '',
                        'depart_time' => $addon_information['sending_flight']['depart_time'] ?? '',
                        'arrival' => $addon_information['sending_flight']['arrival'] ?? '',
                        'arrival_time' => $addon_information['sending_flight']['arrival_time'] ?? '',
                        'pickup_time' => $addon_information['sending_flight']['pickup_time'] ?? '',
                        'dropoff_time' => $addon_information['sending_flight']['dropoff_time'] ?? '',
                        'pickup_point' => $addon_information['sending_flight']['pickup_point'] ?? '',
                        'dropoff_point' => $addon_information['sending_flight']['dropoff_point'] ?? '',
                        'adult_count' => $addon_information['sending_flight']['adult_count'] ?? '',
                        'child_count' => $addon_information['sending_flight']['child_count'] ?? '',
                        'baggage_count' => $addon_information['sending_flight']['baggage_count'] ?? '',
                        'pickup_note' => $addon_information['sending_flight']['pickup_note'] ?? '',
                    ),
                    'parking_car' => array(
                        'depart' => $addon_information['parking_car']['depart'] ?? '',
                        'depart_time' => $addon_information['parking_car']['depart_time'] ?? '',
                        'arrival' => $addon_information['parking_car']['arrival'] ?? '',
                        'arrival_time' => $addon_information['parking_car']['arrival_time'] ?? '',
                        'pickup_time' => $addon_information['parking_car']['pickup_time'] ?? '',
                        'dropoff_time' => $addon_information['parking_car']['dropoff_time'] ?? '',
                        'pickup_point' => $addon_information['parking_car']['pickup_point'] ?? '',
                        'dropoff_point' => $addon_information['parking_car']['dropoff_point'] ?? '',
                        'pickup_note' => $addon_information['parking_car']['pickup_note'] ?? '',
                    ),
                );
            }
            
            $data[] = prepare_parking_booking_response(get_post(), $addon_data);
        }
        wp_reset_postdata();
    }
    
    // Calculate pagination data
    $total_bookings = $query->found_posts;
    $total_pages = ceil($total_bookings / $per_page);
    
    $response = array(
        'data' => $data,
        'meta' => array(
            'current_page' => $page,
            'per_page' => $per_page,
            'total' => $total_bookings,
            'total_pages' => $total_pages,
        )
    );
    
    return rest_ensure_response($response);
}

/**
 * Prepare parking booking response data
 */
function prepare_parking_booking_response($post, $addon_data = array()) {
    $post_id = $post->ID;
    $data = array(
        'id' => $post_id,
        'title' => $post->post_title,
    );

    // Get ACF fields for the parking booking
    $vehicle_info = get_field('vehicle_info', $post_id);
    $start_date = get_field('start_date', $post_id);
    $end_date = get_field('end_date', $post_id);
    $location_term = get_field('location_park', $post_id);
    $status_term = get_field('booking_status_relation', $post_id);

    // Format customer info
    $customer_fullname = get_field('fullname_park', $post_id);

    // Format location info
    $location_data = null;
    if ($location_term && is_object($location_term)) {
        $location_data = [
            'id' => $location_term->term_id,
            'name' => $location_term->name,
            'slug' => $location_term->slug
        ];
    }

    // Format status info
    $status_data = null;
    if ($status_term && is_object($status_term)) {
        $color = get_field('color', 'booking_status_' . $status_term->term_id);
        $status_data = [
            'id' => $status_term->term_id,
            'name' => $status_term->name,
            'color' => $color
        ];
    }

    $data['customer_info'] = array(
        'fullname_park' => $customer_fullname
    );

    $data['vehicle_info'] = $vehicle_info;
    $data['start_date'] = $start_date;
    $data['end_date'] = $end_date;
    $data['location_park'] = $location_data;
    $data['booking_status_relation'] = $status_data;
    $data['addon_information'] = $addon_data;

    return $data;
}

function update_parking_booking_addon_data($request) {
    $booking_id = $request->get_param('booking_id');
    $addon_data = $request->get_param('addon_data');
    
    if (!$booking_id || !$addon_data) {
        return new WP_Error('missing_data', 'Booking ID and addon data are required', array('status' => 400));
    }
    
    $post = get_post($booking_id);
    if (!$post || $post->post_type !== 'parking_booking') {
        return new WP_Error('invalid_booking', 'Invalid booking ID', array('status'  => 404));
    }
    
    // Sanitize addon data
    $sanitized_addon = array(
        'service_pickup' => !empty($addon_data['service_pickup']),
        'service_valet' => !empty($addon_data['service_valet']),
    );
    
    // Sanitize sending flight data
    if (!empty($addon_data['sending_flight'])) {
        $sending = $addon_data['sending_flight'];
        $sanitized_addon['sending_flight'] = array(
            'depart' => sanitize_text_field($sending['depart'] ?? ''),
            'depart_time' => sanitize_text_field($sending['depart_time'] ?? ''),
            'arrival' => sanitize_text_field($sending['arrival'] ?? ''),
            'arrival_time' => sanitize_text_field($sending['arrival_time'] ?? ''),
            'pickup_time' => sanitize_text_field($sending['pickup_time'] ?? ''),
            'dropoff_time' => sanitize_text_field($sending['dropoff_time'] ?? ''),
            'pickup_point' => sanitize_text_field($sending['pickup_point'] ?? ''),
            'dropoff_point' => sanitize_text_field($sending['dropoff_point'] ?? ''),
            'adult_count' => intval($sending['adult_count'] ?? 0),
            'child_count' => intval($sending['child_count'] ?? 0),
            'baggage_count' => intval($sending['baggage_count'] ?? 0),
            'pickup_note' => sanitize_text_field($sending['pickup_note'] ?? ''),
        );
    }
    
    // Sanitize parking car data
    if (!empty($addon_data['parking_car'])) {
        $parking = $addon_data['parking_car'];
        $sanitized_addon['parking_car'] = array(
            'depart' => sanitize_text_field($parking['depart'] ?? ''),
            'depart_time' => sanitize_text_field($parking['depart_time'] ?? ''),
            'arrival' => sanitize_text_field($parking['arrival'] ?? ''),
            'arrival_time' => sanitize_text_field($parking['arrival_time'] ?? ''),
            'pickup_time' => sanitize_text_field($parking['pickup_time'] ?? ''),
            'dropoff_time' => sanitize_text_field($parking['dropoff_time'] ?? ''),
            'pickup_point' => sanitize_text_field($parking['pickup_point'] ?? ''),
            'dropoff_point' => sanitize_text_field($parking['dropoff_point'] ?? ''),
            'pickup_note' => sanitize_text_field($parking['pickup_note'] ?? ''),
        );
    }
    
    // Update ACF fields
    $updated = update_field('addon_information', $sanitized_addon, $booking_id);
    
    if ($updated) {
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Addon data updated successfully',
            'booking_id' => $booking_id,
            'addon_data' => $sanitized_addon,
        ));
    } else {
        return new WP_Error('update_failed', 'Failed to update addon data', array('status' => 500));
    }
}

/**
 * Get ride assignments with search, sort, and pagination
 * Includes all ACF fields for ride_assignment post type
 */
function get_ride_assignments($request) {
    $page = $request->get_param('page') ? (int) $request->get_param('page') : 1;
    $per_page = $request->get_param('per_page') ? (int) $request->get_param('per_page') : 12;
    $search = sanitize_text_field((string) $request->get_param('search'));
    $allowed_orderby = array('date', 'title', 'ID');
    $raw_orderby = (string) $request->get_param('orderby');
    $orderby = in_array($raw_orderby, $allowed_orderby, true) ? $raw_orderby : 'date';
    $raw_order = strtoupper((string) $request->get_param('order'));
    $order = in_array($raw_order, array('ASC', 'DESC'), true) ? $raw_order : 'DESC';
    $taxi_user_id = absint($request->get_param('taxi_user_id'));
    $status_filter = sanitize_text_field((string) $request->get_param('status'));
    
    // Date filtering parameters
    $date_range = $request->get_param('date_range');
    $date_from = $request->get_param('date_from');
    $date_to = $request->get_param('date_to');
    
    $args = array(
        'post_type' => 'ride_assignment',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'orderby' => $orderby,
        'order' => $order,
    );
    
    if ($search) {
        $args['s'] = $search;
    }

    $meta_conditions = array();
    // Filter by taxi_user if provided
    if ($taxi_user_id) {
        $meta_conditions[] = array(
            'key' => 'taxi_user',
            'value' => $taxi_user_id,
            'compare' => '='
        );
    }
    if ($status_filter) {
        $meta_conditions[] = array(
            'key' => 'status_job',
            'value' => $status_filter,
            'compare' => '='
        );
    }
    if (!empty($meta_conditions)) {
        $args['meta_query'] = count($meta_conditions) > 1
            ? array_merge(array('relation' => 'AND'), $meta_conditions)
            : $meta_conditions;
    }
    
    // Handle date filtering
    if ($date_range || ($date_from && $date_to)) {
        $meta_query = isset($args['meta_query']) ? $args['meta_query'] : array();
        
        if ($date_range) {
            $today = current_time('Y-m-d');
            $start_date = '';
            $end_date = '';
            
            switch ($date_range) {
                case 'today':
                    $start_date = $today;
                    $end_date = $today;
                    break;
                case 'yesterday':
                    $yesterday = date('Y-m-d', strtotime('-1 day', strtotime($today)));
                    $start_date = $yesterday;
                    $end_date = $yesterday;
                    break;
                case 'last7days':
                    $start_date = date('Y-m-d', strtotime('-7 days', strtotime($today)));
                    $end_date = $today;
                    break;
                case 'last30days':
                    $start_date = date('Y-m-d', strtotime('-30 days', strtotime($today)));
                    $end_date = $today;
                    break;
                case 'thismonth':
                    $start_date = date('Y-m-01', strtotime($today));
                    $end_date = date('Y-m-t', strtotime($today));
                    break;
                case 'thisyear':
                    $start_date = date('Y-01-01', strtotime($today));
                    $end_date = date('Y-12-31', strtotime($today));
                    break;
            }
            
            if ($start_date && $end_date) {
                $meta_query[] = array(
                    'relation' => 'OR',
                    array(
                        'key' => 'start_date',
                        'value' => array($start_date, $end_date),
                        'compare' => 'BETWEEN',
                        'type' => 'DATE'
                    ),
                    array(
                        'key' => 'end_date',
                        'value' => array($start_date, $end_date),
                        'compare' => 'BETWEEN',
                        'type' => 'DATE'
                    )
                );
            }
        } elseif ($date_from && $date_to) {
            $meta_query[] = array(
                'relation' => 'OR',
                array(
                    'key' => 'start_date',
                    'value' => array($date_from, $date_to),
                    'compare' => 'BETWEEN',
                    'type' => 'DATE'
                ),
                array(
                    'key' => 'end_date',
                    'value' => array($date_from, $date_to),
                    'compare' => 'BETWEEN',
                    'type' => 'DATE'
                )
            );
        }
        
        if (!empty($meta_query)) {
            $args['meta_query'] = $meta_query;
        }
    }
    
    // Handle sorting by meta fields
    switch ($orderby) {
        case 'ID':
        case 'id':
            $args['orderby'] = 'ID';
            break;
        case 'title':
        case 'customer':
            $args['orderby'] = 'title';
            break;
        case 'date':
        case 'start_date':
        case 'end_date':
            $args['orderby'] = 'date';
            break;
        case 'plate_driver':
        case 'license_plate':
            $args['meta_key'] = 'plate-driver';
            $args['orderby'] = 'meta_value';
            break;
        case 'status_job':
        case 'status':
            $args['meta_key'] = 'status_job';
            $args['orderby'] = 'meta_value';
            break;
        default:
            $args['orderby'] = 'date';
            break;
    }
    
    $query = new WP_Query($args);
    
    $assignments = array();
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            
            // Get all ACF fields for ride_assignment
            $job_code = get_field('job_code');
            $taxi_user = get_field('taxi_user');
            $status_job = get_field('status_job');
            $booking_order = get_field('booking-order');
            $plate_driver = get_field('plate-driver');
            
            // Get addon information with all nested fields
            $addon_information = get_field('addon_information_driver');
            
            $addon_data = null;
            if ($addon_information) {
                // Initialize addon data structure
                $addon_data = array(
                    'service_pickup' => !empty($addon_information['service_pickup']),
                    'service_valet' => !empty($addon_information['service_valet']),
                );
                
                // Handle sending_flight data if service_pickup is enabled
                if (!empty($addon_information['service_pickup']) && !empty($addon_information['sending_flight'])) {
                    $sending_flight = $addon_information['sending_flight'];
                    $addon_data['sending_flight'] = array(
                        'depart' => $sending_flight['depart'] ?? '',
                        'depart_time' => $sending_flight['depart_time'] ?? '',
                        'arrival' => $sending_flight['arrival'] ?? '',
                        'arrival_time' => $sending_flight['arrival_time'] ?? '',
                        'pickup_time' => $sending_flight['pickup_time'] ?? '',
                        'dropoff_time' => $sending_flight['dropoff_time'] ?? '',
                        'pickup_point' => $sending_flight['pickup_point'] ?? '',
                        'dropoff_point' => $sending_flight['dropoff_point'] ?? '',
                        'adult_count' => $sending_flight['adult_count'] ?? 0,
                        'child_count' => $sending_flight['child_count'] ?? 0,
                        'baggage_count' => $sending_flight['baggage_count'] ?? 0,
                        'pickup_note' => $sending_flight['pickup_note'] ?? '',
                    );
                }
                
                // Handle parking_car data if service_valet is enabled
                if (!empty($addon_information['service_valet']) && !empty($addon_information['parking_car'])) {
                    $parking_car = $addon_information['parking_car'];
                    $addon_data['parking_car'] = array(
                        'depart' => $parking_car['depart'] ?? '',
                        'depart_time' => $parking_car['depart_time'] ?? '',
                        'arrival' => $parking_car['arrival'] ?? '',
                        'arrival_time' => $parking_car['arrival_time'] ?? '',
                        'pickup_time' => $parking_car['pickup_time'] ?? '',
                        'dropoff_time' => $parking_car['dropoff_time'] ?? '',
                        'pickup_point' => $parking_car['pickup_point'] ?? '',
                        'dropoff_point' => $parking_car['dropoff_point'] ?? '',
                        'pickup_note' => $parking_car['pickup_note'] ?? '',
                    );
                }
            }
            
            // Format taxi user data
            $taxi_user_data = null;
            if ($taxi_user && is_object($taxi_user)) {
                $taxi_user_data = array(
                    'ID' => $taxi_user->ID,
                    'post_title' => $taxi_user->post_title,
                );
            }
            
            // Format booking order data
            $booking_order_data = null;
            if ($booking_order && is_object($booking_order)) {
                $booking_order_data = array(
                    'ID' => $booking_order->ID,
                    'post_title' => $booking_order->post_title,
                );
            }
            
            $assignments[] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'date' => get_the_date('Y-m-d H:i:s'),
                'job_code' => $job_code,
                'taxi_user' => $taxi_user_data,
                'status_job' => $status_job,
                'booking_order' => $booking_order_data,
                'plate_driver' => $plate_driver,
                'addon_information' => $addon_data,
            );
        }
        wp_reset_postdata();
    }
    
    // Calculate pagination data
    $total_assignments = $query->found_posts;
    $total_pages = ceil($total_assignments / $per_page);
    
    return new WP_REST_Response(array(
        'data' => $assignments,
        'meta' => array(
            'current_page' => $page,
            'per_page' => $per_page,
            'total' => $total_assignments,
            'total_pages' => $total_pages,
        )
    ), 200);
}

// Register REST API endpoint for ride assignments
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/ride_assignments', array(
        'methods' => 'GET',
        'callback' => 'get_ride_assignments',
        'permission_callback' => 'is_user_logged_in',
        'args' => array(
            'page' => array(
                'required' => false,
                'type' => 'integer',
                'description' => 'Page number for pagination',
                'sanitize_callback' => 'absint',
            ),
            'per_page' => array(
                'required' => false,
                'type' => 'integer',
                'description' => 'Number of items per page',
                'sanitize_callback' => 'absint',
            ),
            'orderby' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Field to order by',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'order' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Order direction (ASC or DESC)',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'search' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Search term',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'date_range' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Date range filter (today, yesterday, last7days, last30days, thismonth, thisyear)',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'date_from' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Start date for custom range (Y-m-d format)',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'date_to' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'End date for custom range (Y-m-d format)',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'taxi_user_id' => array(
                'required' => false,
                'type' => 'integer',
                'description' => 'Filter by taxi user ID (post ID)',
                'sanitize_callback' => 'absint',
            ),
        ),
    ));
});
?>
