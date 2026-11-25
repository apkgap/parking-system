<?php
/**
 * Enqueue profile page scripts and styles
 */
function enqueue_profile_page_assets() {
    if (is_page_template('profile-page.php') || is_page('profile')) {
        wp_enqueue_script(
            'profile-ajax',
            get_template_directory_uri() . '/customize/js/ajax-profile.js',
            array('jquery'),
            '1.0.0',
            true
        );

        // Localize script with AJAX URL and nonce
        wp_localize_script('profile-ajax', 'profileAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'resturl' => rest_url('custom/v1/'),
            'apiEndpoint' => rest_url('custom/v1/user_parking_booking'),
            'nonce' => wp_create_nonce('wp_rest'),
            'user_id' => get_current_user_id(),
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_profile_page_assets');

/**
 * Enqueue driver profile page scripts and styles
 */
function enqueue_driver_profile_page_assets() {
    if (is_page_template('profile-driver-page.php') || is_page('driver-profile')) {
        wp_enqueue_script(
            'profile-driver-ajax',
            get_template_directory_uri() . '/customize/js/ajax-profile-driver.js',
            array('jquery'),
            '1.0.0',
            true
        );

        // Get current user ID and their driver_userdata
        $current_user_id = get_current_user_id();
        $driver_taxi_user_id = get_field('driver_userdata_u', 'user_' . $current_user_id);
        
        // If driver_userdata is a post object, get its ID; otherwise use directly
        if (is_object($driver_taxi_user_id)) {
            $driver_taxi_user_id = $driver_taxi_user_id->ID;
        }

        // Localize script with AJAX URL and nonce
        wp_localize_script('profile-driver-ajax', 'profileDriverAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'resturl' => rest_url('custom/v1/'),
            'apiEndpoint' => rest_url('custom/v1/ride_assignments'),
            'nonce' => wp_create_nonce('wp_rest'),
            'user_id' => $current_user_id,
            'driver_taxi_user_id' => intval($driver_taxi_user_id), // Pass driver's taxi_user post ID
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_driver_profile_page_assets');

/**
 * Add profile page to customize.php functions
 */
function add_profile_page_functions() {
    // This function can be called from customize.php to include profile functionality
    // Already handled by the REST API endpoints above
}
