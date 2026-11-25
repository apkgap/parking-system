<?php
function enqueue_ajax_login_scripts() {
    if (is_page_template('login.php')) {
        wp_enqueue_script(
            'ajax-login', 
            get_template_directory_uri() . '/customize/js/ajax-login.js', 
            array('jquery'), 
            '1.0.0', 
            true
        );
        
        wp_localize_script('ajax-login', 'ajax_object', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('user_login_nonce')
        ));
    }
}
// Enqueue scripts for login and forgot password pages
add_action('wp_enqueue_scripts', 'enqueue_ajax_login_scripts');


function ajax_user_login_handler() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['security'], 'user_login_nonce')) {
        wp_send_json_error(array('message' => 'Security check failed.'));
        return;
    }

    // Get form data
    $username = sanitize_text_field($_POST['username']);
    $password = $_POST['password'];
    $remember = $_POST['rememberme'] === 'true';

    // Validate inputs
    if (empty($username) || empty($password)) {
        wp_send_json_error(array('message' => 'Please enter your username and password.'));
        return;
    }

    // Prepare credentials
    $credentials = array(
        'user_login'    => $username,
        'user_password' => $password,
        'remember'      => $remember
    );

    // Attempt login
    $user = wp_signon($credentials, false);

    if (is_wp_error($user)) {
        // Login failed
        $error_message = $user->get_error_message();
        
        // Customize error messages
        if (strpos($error_message, 'Invalid username') !== false || 
            strpos($error_message, 'incorrect password') !== false ||
            strpos($error_message, 'Unknown username') !== false) {
            // $error_message = 'Invalid username or password. Please try again.';
        }
        
        wp_send_json_error(array('message' => $error_message));
    } else {
        // Login successful
        wp_set_current_user($user->ID);
        
        // Determine redirect URL
        $redirect_url = get_home_url();
        // if (isset($_POST['redirect_to']) && !empty($_POST['redirect_to'])) {
        //     $redirect_url = esc_url_raw($_POST['redirect_to']);
        // }
        
        wp_send_json_success(array(
            'message' => 'Login successful! Redirecting...',
            'redirect_url' => $redirect_url,
            'user_id' => $user->ID
        ));
    }
}
// add_action('init', 'ajax_user_login_handler');
// AJAX Login Handler
add_action('wp_ajax_nopriv_ajax_user_login', 'ajax_user_login_handler');
add_action('wp_ajax_ajax_user_login', 'ajax_user_login_handler');

?>
