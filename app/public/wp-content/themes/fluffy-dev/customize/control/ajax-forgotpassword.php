<?php
function enqueue_ajax_forgot_password_scripts() {
    if (is_page_template('forgot-password.php') ) {
        wp_enqueue_script(
            'ajax-forgot-password', 
            get_template_directory_uri() . '/customize/js/ajax-resetpassword.js', 
            array('jquery'), 
            '1.0.0', 
            true
        );
        
        wp_localize_script('ajax-forgot-password', 'ajax_object', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('forgot_password_nonce')
        ));
    }
}
// Enqueue scripts for login and forgot password pages
add_action('wp_enqueue_scripts', 'enqueue_ajax_forgot_password_scripts');

// Handle AJAX forgot password request
function ajax_forgot_password_handler() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['security'], 'forgot_password_nonce')) {
        wp_send_json_error(['message' => 'Security check failed. Please refresh the page and try again.']);
        return;
    }

    // Sanitize email
    $user_email = sanitize_email($_POST['user_email']);
    
    // Validate email
    if (empty($user_email)) {
        wp_send_json_error(['message' => 'Email address is required.']);
        return;
    }

    if (!is_email($user_email)) {
        wp_send_json_error(['message' => 'Please enter a valid email address.']);
        return;
    }

    // Check if user exists
    $user = get_user_by('email', $user_email);
    if (!$user) {
        wp_send_json_error(['message' => 'No account found with this email address.']);
        return;
    }

    // Generate password reset key
    $reset_key = get_password_reset_key($user);
    if (is_wp_error($reset_key)) {
        wp_send_json_error(['message' => 'Failed to generate reset key. Please try again.']);
        return;
    }

    // Send password reset email
    $reset_url = network_site_url("wp-login.php?action=rp&key=$reset_key&login=" . rawurlencode($user->user_login), 'login');
    
    $message = sprintf(
        __('Someone has requested a password reset for the following account:') . "\r\n\r\n" .
        __('Site Name: %s') . "\r\n" .
        __('Username: %s') . "\r\n\r\n" .
        __('If this was a mistake, just ignore this email and nothing will happen.') . "\r\n\r\n" .
        __('To reset your password, visit the following address:') . "\r\n\r\n" .
        '%s',
        get_bloginfo('name'),
        $user->user_login,
        $reset_url
    );

    $subject = sprintf(__('[%s] Password Reset'), get_bloginfo('name'));
    
    if (wp_mail($user_email, $subject, $message)) {
        wp_send_json_success(['message' => 'Password reset link has been sent to your email address.']);
    } else {
        wp_send_json_error(['message' => 'Failed to send reset email. Please try again.']);
    }
}

// Register AJAX handlers
add_action('wp_ajax_ajax_forgot_password', 'ajax_forgot_password_handler');
add_action('wp_ajax_nopriv_ajax_forgot_password', 'ajax_forgot_password_handler');
?>
