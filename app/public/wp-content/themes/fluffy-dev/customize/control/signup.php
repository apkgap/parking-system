<?php
// Enqueue AJAX script and localize
function enqueue_ajax_registration_script() {
    if (is_page_template('register.php')) {
        // Make sure jQuery is loaded first
        wp_enqueue_script('jquery');
        
        wp_enqueue_script('ajax-register', get_template_directory_uri() . '/customize/js/ajax-register.js', array('jquery'), '1.0.1', true);
        
        wp_localize_script('ajax-register', 'ajax_object', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('user_registration_nonce')
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_ajax_registration_script');

// Register AJAX handlers
add_action('wp_ajax_nopriv_user_registration', 'handle_ajax_registration');
add_action('wp_ajax_user_registration', 'handle_ajax_registration');

function handle_ajax_registration() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['registration_nonce'], 'user_registration_nonce')) {
        wp_send_json_error(['message' => 'Security check failed']);
    }
    
    $first_name = sanitize_text_field($_POST['first_name']);
    $last_name = sanitize_text_field($_POST['last_name']);
    $email = sanitize_email($_POST['email']);
    $phone = sanitize_text_field($_POST['phone']);
    $username = sanitize_user($_POST['username']);
    $password = $_POST['password'];
    
    $errors = array();
    
    // Validation
    if (empty($first_name)) $errors[] = 'First name is required';
    if (empty($last_name)) $errors[] = 'Last name is required';
    if (empty($email) || !is_email($email)) $errors[] = 'Valid email is required';
    if (empty($phone)) $errors[] = 'Phone number is required';
    if (empty($username)) $errors[] = 'Username is required';
    if (empty($password) || strlen($password) < 8) $errors[] = 'Password must be at least 8 characters';
    if (username_exists($username)) $errors[] = 'Username already exists';
    if (email_exists($email)) $errors[] = 'Email already exists';
    
    if (!empty($errors)) {
        wp_send_json_error(['message' => implode('<br>', $errors)]);
    }
    
    $user_id = wp_create_user($username, $password, $email);

    if (!is_wp_error($user_id)) {
        // Set user role
        $user = new WP_User($user_id);
        $user->set_role('subscriber');
        // Update user meta
        update_user_meta($user_id, 'first_name', $first_name);
        update_user_meta($user_id, 'last_name', $last_name);
        update_user_meta($user_id, 'phone', $phone);
        
        // Auto login after registration
        wp_set_current_user($user_id);
        wp_set_auth_cookie($user_id);
        
        wp_send_json_success(['message' => 'Your account has been created successfully']);
    } else {
        wp_send_json_error(['message' => $user_id->get_error_message()]);
    }
}
?>
