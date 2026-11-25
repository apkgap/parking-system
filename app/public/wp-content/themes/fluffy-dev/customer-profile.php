<?php
/**
 * Customer Profile Functions
 * Handles user profile data and parking booking retrieval using existing parking API
 */

// Add REST API endpoint for user profile data
add_action('rest_api_init', function () {
    register_rest_route('profile/v1', '/user-stats', array(
        'methods' => 'GET',
        'callback' => 'get_user_booking_stats',
        'permission_callback' => function() {
            return is_user_logged_in();
        },
    ));
});

/**
 * Get user booking statistics
 */
function get_user_booking_stats($request) {
    $current_user_id = get_current_user_id();
    
    if (!$current_user_id) {
        return new WP_Error('not_logged_in', 'User not logged in', array('status' => 401));
    }

    // Get all user bookings
    $args = array(
        'post_type' => 'parking_booking',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'meta_query' => array(
            array(
                'key' => 'customer_user',
                'value' => $current_user_id,
                'compare' => '='
            )
        )
    );

    $query = new WP_Query($args);
    $total_bookings = $query->found_posts;
    
    // Count by status
    $completed = 0;
    $active = 0;
    $month_bookings = 0;
    
    $current_month = date('Y-m');
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            
            $status = get_field('booking_status_relation');
            $booking_date = get_the_date('Y-m');
            
            // Count by status (you may need to adjust these based on your status values)
            if ($status == 'completed' || $status == 3) {
                $completed++;
            } elseif ($status == 'confirmed' || $status == 'pending' || $status == 1 || $status == 2) {
                $active++;
            }
            
            // Count current month bookings
            if ($booking_date == $current_month) {
                $month_bookings++;
            }
        }
        wp_reset_postdata();
    }

    $stats = array(
        'total' => $total_bookings,
        'completed' => $completed,
        'active' => $active,
        'month' => $month_bookings
    );

    return rest_ensure_response($stats);
}

/**
 * Get status badge information
 */
function get_status_badge_info($status) {
    $status_map = array(
        '1' => array('label' => 'รอดำเนินการ', 'color' => 'yellow'),
        '2' => array('label' => 'ยืนยันแล้ว', 'color' => 'blue'),
        '3' => array('label' => 'เสร็จสิ้น', 'color' => 'green'),
        '4' => array('label' => 'ยกเลิก', 'color' => 'red'),
        'pending' => array('label' => 'รอดำเนินการ', 'color' => 'yellow'),
        'confirmed' => array('label' => 'ยืนยันแล้ว', 'color' => 'blue'),
        'completed' => array('label' => 'เสร็จสิ้น', 'color' => 'green'),
        'cancelled' => array('label' => 'ยกเลิก', 'color' => 'red'),
    );

    return $status_map[$status] ?? array('label' => 'ไม่ทราบสถานะ', 'color' => 'gray');
}

/**
 * Enqueue profile page scripts and styles
 */
function enqueue_profile_page_assets() {
    if (is_page_template('profile-page.php') || is_page('profile')) {
        wp_enqueue_script(
            'profile-ajax',
            get_template_directory_uri() . '/ajax-profile.js',
            array('jquery'),
            '1.0.0',
            true
        );

        // Localize script with AJAX URL and nonce
        wp_localize_script('profile-ajax', 'profileAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'resturl' => rest_url('custom/v1/'), // Use existing parking API
            'nonce' => wp_create_nonce('wp_rest'),
            'user_id' => get_current_user_id(),
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_profile_page_assets');