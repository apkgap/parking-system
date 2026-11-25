<?php
function enqueue_service_management_scripts() {
    global $current_user;
    $allowed_roles = ['administrator', 'service-customer'];
    $user_roles = $current_user->roles;
    $has_allowed_role = array_intersect($allowed_roles, $user_roles);

    if (!empty($has_allowed_role)) {
        wp_enqueue_script('ajax-checkin', get_template_directory_uri() . '/customize/js/ajax-checkin.js', array('jquery'), null, true);
        wp_enqueue_script('ajax-checkout', get_template_directory_uri() . '/customize/js/ajax-checkout.js', array('jquery'), null, true);
        wp_localize_script('ajax-checkin', 'ajaxCheckin', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'checkin_nonce' => wp_create_nonce('checkin_nonce'),
        ));
        wp_localize_script('ajax-checkout', 'ajaxCheckout', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'checkout_nonce' => wp_create_nonce('checkout_nonce')
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_service_management_scripts');

// AJAX handler for Check-in
add_action('wp_ajax_handle_check_in', 'handle_check_in_ajax');
add_action('wp_ajax_nopriv_handle_check_in', 'handle_check_in_ajax'); // If non-logged-in users can check-in

function handle_check_in_ajax() {
    // Security check
    check_ajax_referer('checkin_nonce', 'nonce');

    // Get data from AJAX request
    $booking_id = isset($_POST['booking_id']) ? intval($_POST['booking_id']) : 0;

    if (!$booking_id) {
        wp_send_json_error(['message' => gp_text_get('รหัสการจองไม่ถูกต้อง', 'Invalid Booking ID.')]);
        return;
    }

    // Update booking post fields
    update_field('booking_status', 'checked-in', $booking_id);
    update_field('tracking_check_in', current_time('mysql'), $booking_id);
    update_field('tracking_check_status', 'checked-in', $booking_id);

    // Create a new post in 'parking_check_list' post type
    $booking_post = get_post($booking_id);
    $user_id = $booking_post->post_author; // Or get from a custom field if you store user differently

    $checklist_post_data = array(
        'post_title'  => 'Check-in for Booking #' . $booking_id,
        'post_type'   => 'parking_check_list',
        'post_status' => 'publish',
        'post_author' => get_current_user_id(), // The user performing the check-in
    );

    $checklist_id = wp_insert_post($checklist_post_data);

    if ($checklist_id) {
        // Update ACF fields for the new checklist post
        update_field('field_68a64434db416', 'checked-in', $checklist_id); // tracking_status
        update_field('field_68a6448f948fd', $user_id, $checklist_id); // user
        update_field('field_68a64666c8256', $booking_id, $checklist_id); // booking_order
    }

    wp_send_json_success(['message' => gp_text_get('เช็คอินสำเร็จ!', 'Check-in successful!')]);
}

// AJAX handler for Check-out
add_action('wp_ajax_handle_check_out', 'handle_check_out_ajax');
add_action('wp_ajax_nopriv_handle_check_out', 'handle_check_out_ajax'); // If non-logged-in users can check-out

function handle_check_out_ajax() {
    // Security check
    check_ajax_referer('checkout_nonce', 'nonce');

    // Get data from AJAX request
    $booking_id = isset($_POST['booking_id']) ? intval($_POST['booking_id']) : 0;

    if (!$booking_id) {
        wp_send_json_error(['message' => gp_text_get('รหัสการจองไม่ถูกต้อง', 'Invalid Booking ID.')]);
        return;
    }

    // Fine calculation logic
    $end_date_str = get_field('end_date', $booking_id);
    $fine = 0;
    if ($end_date_str) {
        $end_date = new DateTime($end_date_str);
        $now = new DateTime();
        if ($now > $end_date) {
            $interval = $now->diff($end_date);
            $overdue_minutes = ($interval->days * 24 * 60) + ($interval->h * 60) + $interval->i;
            $fine = $overdue_minutes; // 1 THB per minute
            update_field('late_checkout_fine', $fine, $booking_id);
        }
    }

    // Update booking post fields
    update_field('booking_status', 'checked-out', $booking_id);
    update_field('tracking_check_out', current_time('mysql'), $booking_id);
    update_field('tracking_check_status', 'checked-out', $booking_id);

    // Query for existing parking_check_list post for this booking
    $args = array(
        'post_type' => 'parking_check_list',
        'posts_per_page' => 1,
        'meta_query' => array(
            array(
                'key' => 'booking_order',
                'value' => $booking_id,
                'compare' => '=='
            )
        )
    );
    $checklist_query = new WP_Query($args);

    if ($checklist_query->have_posts()) {
        // Update existing checklist post
        $checklist_query->the_post();
        $checklist_id = get_the_ID();
        update_field('field_68a64434db416', 'checked-out', $checklist_id); // tracking_status
        wp_reset_postdata();
    } else {
        // Create a new checklist post if one doesn't exist
        $booking_post = get_post($booking_id);
        $user_id = $booking_post->post_author;

        $checklist_post_data = array(
            'post_title'  => 'Check-out for Booking #' . $booking_id,
            'post_type'   => 'parking_check_list',
            'post_status' => 'publish',
            'post_author' => get_current_user_id(),
        );

        $checklist_id = wp_insert_post($checklist_post_data);

        if ($checklist_id) {
            // Update ACF fields for the new checklist post
            update_field('field_68a64434db416', 'checked-out', $checklist_id); // tracking_status
            update_field('field_68a6448f948fd', $user_id, $checklist_id); // user
            update_field('field_68a64666c8256', $booking_id, $checklist_id); // booking_order
        }
    }

    // Get the order code to pass back in the redirect URL
    $order_code = get_field('order_code', $booking_id);
    
    wp_send_json_success([
        'message' => gp_text_get('เช็คเอาท์สำเร็จ!', 'Check-out successful!'),
        'redirect_url' => home_url('/check-in/?order_code=') . $order_code
    ]);
}

function get_booking_status_badge_details($booking_status, $check_in_time = '', $check_out_time = '') {
    $details = [
        'badge_class' => '',
        'badge_text' => '',
        'badge_icon' => '',
        'status_time_html' => ''
    ];

    switch ($booking_status) {
        case 'checked-in':
            $details['badge_class'] = 'badge-success';
            $details['badge_text'] = gp_text_get('เช็คอินแล้ว', 'Checked In');
            $details['badge_icon'] = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
            if ($check_in_time) {
                $details['status_time_html'] = '<p class="text-sm text-base-content/60 mt-2">' . gp_text_get('เมื่อ', 'at') . ' ' . esc_html(date('d/m/Y H:i', strtotime($check_in_time))) . '</p>';
            }
            break;
        case 'checked-out':
            $details['badge_class'] = 'badge-neutral';
            $details['badge_text'] = gp_text_get('เช็คเอาท์แล้ว', 'Checked Out');
            $details['badge_icon'] = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>';
            if ($check_out_time) {
                $details['status_time_html'] = '<p class="text-sm text-base-content/60 mt-2">' . gp_text_get('เมื่อ', 'at') . ' ' . esc_html(date('d/m/Y H:i', strtotime($check_out_time))) . '</p>';
            }
            break;
        case 'confirmed':
        default:
            $details['badge_class'] = 'badge-info';
            $details['badge_text'] = gp_text_get('รอเช็คอิน', 'Pending Check-in');
            $details['badge_icon'] = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
            break;
    }

    return $details;
}
