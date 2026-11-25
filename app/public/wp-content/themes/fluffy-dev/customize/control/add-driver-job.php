<?php
/**
 * Functions for the Create Driver Job page template.
 */

if ( ! function_exists( 'enqueue_driver_job_scripts' ) ) {
    /**
     * Enqueues scripts and styles for the driver job creation page.
     */
    function enqueue_driver_job_scripts() {
        // Only enqueue on the 'create-driver-job' page template.
        if ( ! is_page_template( 'create-driver-job.php' ) ) {
            return;
        }

        // Enqueue Select2 CSS
        wp_enqueue_style( 'select2-css', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css', array(), '4.1.0-rc.0' );

        // Enqueue Select2 JS
        wp_enqueue_script( 'select2-js', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', array( 'jquery' ), '4.1.0-rc.0', true );

        // Enqueue our custom ajax script
        wp_enqueue_script( 'ajax-add-driver-job', get_template_directory_uri() . '/customize/js/ajax-add-driver-job.js', array( 'jquery', 'select2-js' ), null, true );

        // Pass data to our script
        wp_localize_script( 'ajax-add-driver-job', 'driverJobAjax', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'driver_endpoint' => rest_url('taxi/v1/drivers'),
            'booking_endpoint' => esc_url_raw( rest_url( 'custom/v1/parking_booking' ) ),
            'nonce' => wp_create_nonce( 'wp_rest' )
        ) );
        // Legacy create-driver-job.css removed (replaced by React operations bundle).
    }

    add_action( 'wp_enqueue_scripts', 'enqueue_driver_job_scripts', 20 );
}

// AJAX handler for saving ride assignment
function save_ride_assignment() {
    // Check nonce for security
    if ( ! wp_verify_nonce( $_POST['nonce'], 'wp_rest' ) ) {
        wp_send_json_error( array( 'message' => 'Security check failed' ) );
    }
    
    // Check user permissions
    if ( ! current_user_can( 'administrator' ) ) {
        wp_send_json_error( array( 'message' => 'Insufficient permissions' ) );
    }
    
    // Parse the data
    $data = json_decode( stripslashes( $_POST['data'] ), true );
    
    if ( ! $data ) {
        wp_send_json_error( array( 'message' => 'Invalid data format' ) );
    }
    
    // Generate job code
    $job_code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $job_code = 'JOB-' . $job_code;
    
    // Create the post
    $post_id = wp_insert_post( array(
        'post_title'  => 'Ride Assignment - ' . $job_code . ' - ' . date('Y-m-d H:i:s'),
        'post_type'   => 'ride_assignment',
        'post_status' => 'publish',
    ) );
    
    if ( is_wp_error( $post_id ) ) {
        wp_send_json_error( array( 'message' => 'Failed to create ride assignment' ) );
    }
    
    // Update ACF fields
    update_field('job_code', $job_code, $post_id);
    
    if ( isset( $data['taxi_user'] ) ) {
        update_field( 'taxi_user', $data['taxi_user'], $post_id );
    }
    
    if ( isset( $data['status_job'] ) ) {
        update_field( 'status_job', $data['status_job'], $post_id );
    }
    
    if ( isset( $data['booking_order'] ) ) {
        update_field( 'booking-order', $data['booking_order'], $post_id );
    }
    
    if ( isset( $data['plate_driver'] ) ) {
        update_field( 'plate-driver', $data['plate_driver'], $post_id );
    }
    
    if ( isset( $data['addon_information'] ) ) {
        update_field( 'addon_information_driver', $data['addon_information'], $post_id );
    }
    
    wp_send_json_success( array( 'message' => 'Ride assignment created successfully', 'post_id' => $post_id ) );
}

add_action( 'wp_ajax_save_ride_assignment', 'save_ride_assignment' );

if ( ! function_exists( 'register_ride_assignment_api_routes' ) ) {
    /**
     * Register API routes for ride_assignment post type
     */
    function register_ride_assignment_api_routes() {
        register_rest_route( 'custom/v1', '/ride_assignments', array(
            'methods'  => 'POST',
            'callback' => 'create_ride_assignment',
            'permission_callback' => function() {
                return current_user_can('administrator');
            },
        ) );
    }
    
    add_action( 'rest_api_init', 'register_ride_assignment_api_routes' );
}

if ( ! function_exists( 'create_ride_assignment' ) ) {
    /**
     * Create a new ride assignment
     */
    function create_ride_assignment( $request ) {
        $data = $request->get_json_params();
        
        $job_code = str_pad(random_int(0, max: 999999), 6, '0', STR_PAD_LEFT);
        $job_code = 'JOB-' . $job_code;
        
        // Create the post
        $post_id = wp_insert_post( array(
            'post_title'  => 'Ride Assignment - ' . $job_code . ' - ' . date('Y-m-d H:i:s'),
            'post_type'   => 'ride_assignment',
            'post_status' => 'publish',
        ) );
        
        if ( is_wp_error( $post_id ) ) {
            return new WP_REST_Response( array(
                'success' => false,
                'message' => 'Failed to create ride assignment'
            ), 500 );
        }
        
        // Update ACF fields
        update_field('job_code', $job_code, $post_id);

        if ( isset( $data['taxi_user'] ) ) {
            update_field( 'taxi_user', $data['taxi_user'], $post_id );
        }
        
        if ( isset( $data['status_job'] ) ) {
            update_field( 'status_job', $data['status_job'], $post_id );
        }
        
        if ( isset( $data['booking_order'] ) ) {
            update_field( 'booking-order', $data['booking_order'], $post_id );
        }
        
        if ( isset( $data['plate_driver'] ) ) {
            update_field( 'plate-driver', $data['plate_driver'], $post_id );
        }
        
        if ( isset( $data['addon_information'] ) ) {
            update_field( 'addon_information_driver', $data['addon_information'], $post_id );
        }
        
        return new WP_REST_Response( array(
            'success' => true,
            'message' => 'Ride assignment created successfully',
            'post_id' => $post_id,
            'job_code' => $job_code
        ), 200 );
    }
}
