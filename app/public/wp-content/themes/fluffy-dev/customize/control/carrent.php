<?php 

function enqueue_car_rental_scripts() {
    if (is_page('carrent')) {
        wp_enqueue_script('car-rental-script', get_template_directory_uri() . '/customize/js/carrent.js', array('jquery'), null, true);
        
        // Enqueue ajax-carrent.js with localized data
        wp_enqueue_script(
          'ajax-carrent-script',
          get_template_directory_uri() . '/customize/js/ajax-carrent.js',
          array('jquery'),
          filemtime( get_template_directory() . '/customize/js/ajax-carrent.js' ),
          true
      );
        wp_localize_script('ajax-carrent-script', 'ajax_carrent_obj', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('carrent_nonce')
        ));
    }
}
add_action('wp_enqueue_scripts', 'enqueue_car_rental_scripts'); 

add_action('rest_api_init', function () {
    register_rest_route('carrent/', '/car-locations', array(
        'methods'  => 'GET',
        'callback' => 'get_car_location_list',
        'permission_callback' => '__return_true'
    ));
});

// Add AJAX actions for coupon validation (same as parking system)
add_action('wp_ajax_validate_coupon_carrent', 'validate_coupon_carrent');
add_action('wp_ajax_nopriv_validate_coupon_carrent', 'validate_coupon_carrent');

function get_car_location_list($request) {
    $lang = $request->get_param('lang') ?: 'en';

    $args = array(
        'post_type' => 'package_rent',
        'lang' => $lang,  
        'post_status'    => 'publish',
        'posts_per_page' => -1
    );
    $posts = get_posts($args);
    $locations = array();

    foreach ($posts as $post) {
        $origin = get_field('origin', $post->ID);
        $destination = get_field('destination', $post->ID);
        
        // Add origin locations
        if (!empty($origin)) {
            $origin_locations = explode(',', $origin);
            foreach ($origin_locations as $location) {
                $location = trim($location);
                if (!empty($location) && !in_array($location, array_column($locations, 'title'))) {
                    $locations[] = array(
                        'id' => sanitize_title($location),
                        'title' => $location
                    );
                }
            }
        }
        
        // Add destination locations
        if (!empty($destination)) {
            $destination_locations = explode(',', $destination);
            foreach ($destination_locations as $location) {
                $location = trim($location);
                if (!empty($location) && !in_array($location, array_column($locations, 'title'))) {
                    $locations[] = array(
                        'id' => sanitize_title($location),
                        'title' => $location
                    );
                }
            }
        }
    }

    // Sort locations alphabetically
    usort($locations, function($a, $b) {
        return strcmp($a['title'], $b['title']);
    });

    return rest_ensure_response($locations);
}

function validate_coupon_carrent() {
    $coupon_code = sanitize_text_field($_POST['coupon_code'] ?? '');
    $total_price = floatval($_POST['total_price'] ?? 0);
    
    if (empty($coupon_code)) {
        wp_send_json_error('กรุณากรอกรหัสคูปอง');
    }
    
    if (!class_exists('WooCommerce')) {
        wp_send_json_error('WooCommerce ไม่ได้เปิดใช้งาน');
    }
    
    try {
        $coupon = new WC_Coupon($coupon_code);
        
        // Check product coupon type - must be for car rental or empty (universal)
        $product_coupon_type = get_post_meta($coupon->get_id(), '_product_coupon', true);
        if (!empty($product_coupon_type) && $product_coupon_type !== 'carent') {
            wp_send_json_error('คูปองนี้ไม่สามารถใช้ได้กับบริการเช่ารถ');
        }
        
        if (!$coupon->is_valid()) {
            wp_send_json_error('รหัสคูปองไม่ถูกต้องหรือหมดอายุ');
        }
        
        // Check if coupon has usage limit
        if ($coupon->get_usage_limit() > 0 && $coupon->get_usage_count() >= $coupon->get_usage_limit()) {
            wp_send_json_error('คูปองนี้ถูกใช้งานครบจำนวนแล้ว');
        }
        
        // Check minimum amount
        if ($coupon->get_minimum_amount() > 0 && $total_price < $coupon->get_minimum_amount()) {
            wp_send_json_error('ยอดขั้นต่ำสำหรับใช้คูปองนี้คือ ' . number_format($coupon->get_minimum_amount()) . ' บาท');
        }
        
        // Calculate discount amount
        $discount_amount = 0;
        if ($coupon->get_discount_type() === 'fixed_cart') {
            $discount_amount = $coupon->get_amount();
        } elseif ($coupon->get_discount_type() === 'percent') {
            $discount_amount = ($total_price * $coupon->get_amount()) / 100;
        }
        
        // Make sure discount doesn't exceed total price
        $discount_amount = min($discount_amount, $total_price);
        
        wp_send_json_success([
            'coupon_code' => $coupon_code,
            'discount_type' => $coupon->get_discount_type(),
            'discount_amount' => $discount_amount,
            'original_amount' => $coupon->get_amount()
        ]);
        
    } catch (Exception $e) {
        wp_send_json_error('เกิดข้อผิดพลาดในการตรวจสอบคูปอง: ' . $e->getMessage());
    }
}



// PHP Backend - Improved AJAX Handler
add_action('wp_ajax_insert_car_rent_acf', 'ajax_insert_car_rent_acf');
add_action('wp_ajax_nopriv_insert_car_rent_acf', 'ajax_insert_car_rent_acf');

function ajax_insert_car_rent_acf() {
    // Security check
    if (!check_ajax_referer('carrent_nonce', 'nonce', false)) {
        wp_send_json_error(['message' => 'Invalid security token']);
        return;
    }

    // Validate required fields
    $fields = isset($_POST['fields']) ? $_POST['fields'] : array();
    
    if (empty($fields)) {
        wp_send_json_error(['message' => 'No data provided']);
        return;
    }

    // Validate required personal information
    if (!isset($fields['personal_information']['full_name']) || 
        !isset($fields['personal_information']['email']) || 
        !isset($fields['personal_information']['line_id_whatsapp']) ||
        !isset($fields['personal_information']['phone_number']) ||
        empty($fields['personal_information']['full_name']) || 
        empty($fields['personal_information']['email']) || 
        empty($fields['personal_information']['line_id_whatsapp']) ||
        empty($fields['personal_information']['phone_number'])) {
        wp_send_json_error(['message' => 'Please fill in all required personal information']);
        return;
    }

    // Validate email format
    if (!is_email($fields['personal_information']['email'])) {
        wp_send_json_error(['message' => 'Please enter a valid email address']);
        return;
    }

    // Debug: Log incoming fields
    error_log("Incoming fields data: " . print_r($fields, true));
    
    // Validate outbound trip required fields
    $outbound_trip = isset($fields['travel_information_outbound_trip']) ? $fields['travel_information_outbound_trip'] : array();
    error_log("Outbound trip data: " . print_r($outbound_trip, true));
    
    if (empty($outbound_trip['depart_start_location']) ||
        empty($outbound_trip['depart_start_location_note']) ||
        empty($outbound_trip['depart_destination']) ||
        empty($outbound_trip['depart_destination_note']) ||
        empty($outbound_trip['depart_date']) ||
        empty($outbound_trip['depart_time'])) {
        wp_send_json_error(['message' => 'Please fill in all required travel information']);
        return;
    }

    // Validate return trip fields if it's a round trip
    if (isset($fields['trip_type']) && $fields['trip_type'] == 1) {
        $return_fields = isset($fields['travel_information_return_trip']) ? $fields['travel_information_return_trip'] : array();
        if (empty($return_fields['return_start_location']) ||
            empty($return_fields['return_start_location_note']) ||
            empty($return_fields['return_destination']) ||
            empty($return_fields['return_destination_note']) ||
            empty($return_fields['return_date']) ||
            empty($return_fields['return_time'])) {
            wp_send_json_error(['message' => 'Please fill in all required return trip information']);
            return;
        }
    }

    // Validate booking details
    if (!isset($fields['booking_details']['car_type']) ||
        !isset($fields['booking_details']['adult_count']) ||
        empty($fields['booking_details']['car_type']) ||
        empty($fields['booking_details']['adult_count'])) {
        wp_send_json_error(['message' => 'Please fill in all required booking details']);
        return;
    }

    // Validate flight information
    // if (!isset($fields['flight_information']['arrival_flight_no']) ||
    //     !isset($fields['flight_information']['arrival_flight_time']) ||
    //     !isset($fields['flight_information']['departure_flight_no']) ||
    //     !isset($fields['flight_information']['departure_flight_time']) ||
    //     empty($fields['flight_information']['arrival_flight_no']) ||
    //     empty($fields['flight_information']['arrival_flight_time']) ||
    //     empty($fields['flight_information']['departure_flight_no']) ||
    //     empty($fields['flight_information']['departure_flight_time'])) {
    //     wp_send_json_error(['message' => 'Please fill in all required flight information']);
    //     return;
    // }

    // Sanitize and prepare data
    $sanitized_fields = sanitize_car_rental_fields($fields);
    
    // Generate unique booking reference
    $booking_ref = 'CR' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
    
    // Clean booking reference to remove any special characters that could cause URL encoding issues
    $booking_ref = preg_replace('/[^A-Za-z0-9\-]/', '', $booking_ref);
    
    // Create post
    $post_data = array(
        'post_type'   => 'car_rentals',
        'post_status' => 'publish',
        'post_title'  => sprintf(
            'Car Rental Booking - %s (%s)', 
            $sanitized_fields['personal_information']['full_name'],
            $booking_ref
        ),
        'post_content' => sprintf(
            'Booking Reference: %s\nCustomer: %s\nEmail: %s\nPhone: %s\nLine ID/WhatsApp: %s',
            $booking_ref,
            $sanitized_fields['personal_information']['full_name'],
            $sanitized_fields['personal_information']['email'],
            $sanitized_fields['personal_information']['phone_number'],
            $sanitized_fields['personal_information']['line_id_whatsapp']
        )
    );

    $post_id = wp_insert_post($post_data);

    if (!$post_id || is_wp_error($post_id)) {
        wp_send_json_error(['message' => 'Unable to create booking. Please try again.']);
        return;
    }

    // Debug: Log sanitized fields
    error_log("Sanitized fields for post {$post_id}: " . print_r($sanitized_fields, true));
    
    // Save ACF fields
    if (function_exists('update_field')) {
        foreach ($sanitized_fields as $field_name => $value) {
            $result = update_field($field_name, $value, $post_id);
          
        }
        
        // Save individual location fields for easier access
        if (isset($sanitized_fields['travel_information_outbound_trip'])) {
            $outbound = $sanitized_fields['travel_information_outbound_trip'];
            
            // Save individual outbound fields
            update_field('depart_start_location', $outbound['depart_start_location'] ?? '', $post_id);
            update_field('depart_destination', $outbound['depart_destination'] ?? '', $post_id);
            update_field('depart_date', $outbound['depart_date'] ?? '', $post_id);
            update_field('depart_time', $outbound['depart_time'] ?? '', $post_id);
            update_field('rental_status','pending', $post_id);
        }
        
        if (isset($sanitized_fields['travel_information_return_trip'])) {
            $return = $sanitized_fields['travel_information_return_trip'];
            
            // Save individual return fields
            update_field('return_start_location', $return['return_start_location'] ?? '', $post_id);
            update_field('return_destination', $return['return_destination'] ?? '', $post_id);
            update_field('return_date', $return['return_date'] ?? '', $post_id);
            update_field('return_time', $return['return_time'] ?? '', $post_id);
            
        }
        
        // Save booking reference as separate field (if you have this field in ACF)
        // update_field('booking_reference', $booking_ref, $post_id);
        
        // Save booking timestamp (if you have this field in ACF)
        // update_field('booking_timestamp', current_time('mysql'), $post_id);
    }



    // Check if user is logged in and save data
    if (is_user_logged_in()) {
        $current_user_id = get_current_user_id();
        
        // Save fullname to display_name using wp_update_user
        if (!empty($sanitized_fields['personal_information']['full_name'])) {
            wp_update_user([
                'ID'           => $current_user_id,
                'display_name' => $sanitized_fields['personal_information']['full_name'],
            ]);
        }
        
        // Save email to billing_email user meta
        if (!empty($sanitized_fields['personal_information']['email'])) {
            update_user_meta($current_user_id, 'billing_email', sanitize_email($sanitized_fields['personal_information']['email']));
        }
        
        // Save phone to billing_phone user meta
        if (!empty($sanitized_fields['personal_information']['phone_number'])) {
            update_user_meta($current_user_id, 'billing_phone', sanitize_text_field($sanitized_fields['personal_information']['phone_number']));
        }
        
        // Save lineId to ACF user field with key 'line_id_user'
        if (!empty($sanitized_fields['personal_information']['line_id_whatsapp'])) {
            if (function_exists('update_field')) {
                update_field('line_id_user', $sanitized_fields['personal_information']['line_id_whatsapp'], 'user_' . $current_user_id);
            }
        }



    } 

    // Create WooCommerce order
    $wc_order_id = null;
    $checkout_url = null;

    if (defined('FLUFFY_DEMO_SKIP_PAYMENT') && FLUFFY_DEMO_SKIP_PAYMENT) {
        if (function_exists('update_field')) {
            update_field('rental_status', 'confirmed', $post_id);
        }
        $thank_url = add_query_arg(
            array(
                'order_code' => $booking_ref,
                'email'      => sanitize_email($sanitized_fields['personal_information']['email'] ?? ''),
            ),
            home_url('/thank/')
        );
        wp_send_json_success(array(
            'post_id'      => $post_id,
            'booking_ref'  => $booking_ref,
            'checkout_url' => $thank_url,
            'redirect_url' => $thank_url,
            'demo_mode'    => true,
        ));
        return;
    }

    if (class_exists('WooCommerce')) {
        try {
            // Get price from selected package or booking details
            $total_price = 0;
            if (isset($sanitized_fields['selected_package']['price'])) {
                $price_text = $sanitized_fields['selected_package']['price'];
                $total_price = floatval(preg_replace('/[^\d.]/', '', $price_text));
            } elseif (isset($sanitized_fields['booking_details']['total_price'])) {
                $total_price = floatval($sanitized_fields['booking_details']['total_price']);
            }
            
            if ($total_price <= 0) {
                $total_price = 800; // Default fallback price
            }
            
            // Check if round trip is selected and multiply price by 2
            // if (isset($sanitized_fields['trip_type']) && $sanitized_fields['trip_type'] == 1) {
            //     $total_price = $total_price * 2;
            // }
            
            // Create WooCommerce order
            $order = wc_create_order();
            
            // Add car rental booking as a product
            $product_name = 'การจองรถเช่า - ' . $booking_ref;
            if(get_locale() != 'th') {
                $product_name = 'Car Rental Booking - ' . $booking_ref;
            }
            
            // Create a simple product for this booking
            $item_id = $order->add_product(
                null, // No existing product
                1, // Quantity
                array(
                    'name' => $product_name,
                    'total' => $total_price
                )
            );

                  // Add order meta data
            $order->add_order_note('Car rental booking ID: ' . $post_id);
            $order->add_meta_data('carrent_booking_id', $post_id);
            $order->add_meta_data('carrent_order_code', $booking_ref);
            
            // Set order details
            $order->set_address(array(
                'first_name' => $sanitized_fields['personal_information']['full_name'] ?? '',
                'email'      => $sanitized_fields['personal_information']['email'] ?? '',
                'phone'      => $sanitized_fields['personal_information']['phone_number'] ?? ''
            ), 'billing');
            
      
            
            // Add travel dates if available
            if (isset($sanitized_fields['travel_information_outbound_trip']['depart_date'])) {
                $order->add_meta_data('carrent_depart_date', $sanitized_fields['travel_information_outbound_trip']['depart_date']);
            }
            if (isset($sanitized_fields['travel_information_return_trip']['return_date'])) {
                $order->add_meta_data('carrent_return_date', $sanitized_fields['travel_information_return_trip']['return_date']);
            }
            
            // Add booking URL for easy access
            $booking_url = get_permalink($post_id);
            if ($booking_url) {
                $order->add_meta_data('carrent_booking_url', $booking_url);
            }
            
            
      // Apply coupon if provided - reduce order total directly
      $discount_amount = 0.0;
      if (!empty($sanitized_fields['coupon_information']['coupon_code'])) {
        $coupon_code = sanitize_text_field($sanitized_fields['coupon_information']['coupon_code']);
        try {
          $coupon = new WC_Coupon($coupon_code);
          
          // Check product coupon type - must be for car rental or empty (universal)
          // $product_coupon_type = get_post_meta($coupon->get_id(), '_product_coupon', true);
          // if (!empty($product_coupon_type) && $product_coupon_type !== 'carent') {
          //   continue; // Skip applying invalid coupon
          // }
          
          if ($coupon->is_valid()) {
            $order_subtotal = floatval($total_price);

            // Calculate discount amount based on coupon type
            $discount_type = $coupon->get_discount_type();
            $coupon_amount = floatval($coupon->get_amount());

            if (in_array($discount_type, ['fixed_cart', 'fixed_product'], true)) {
              $discount_amount = $coupon_amount;
            } elseif (in_array($discount_type, ['percent', 'percent_product'], true)) {
              $discount_amount = ($order_subtotal * $coupon_amount) / 100.0;
            }

            // Cap discount to subtotal
            $discount_amount = max(0.0, min($discount_amount, $order_subtotal));

            // Reference meta and note
            $order->add_meta_data('applied_coupon_code', $coupon_code);
            $order->add_meta_data('coupon_discount_amount', $discount_amount);
            $order->add_order_note(sprintf(__('Applied coupon %s: -%s', 'fluffy'), $coupon_code, wc_price($discount_amount)));
          } else {
          }
        } catch (Exception $e) {
          error_log('Coupon application error: ' . $e->getMessage());
        }
      }
      
      // Add an order-level discount as a negative fee so Order Total reduces correctly
      if ($discount_amount > 0.0) {
        $fee = new WC_Order_Item_Fee();
        $fee->set_name(sprintf(__('Coupon %s', 'fluffy'), $coupon_code));
        $fee->set_tax_status('none');
        $fee->set_total(0 - floatval($discount_amount)); // negative amount reduces total
        $order->add_item($fee);
      }

      // Recalculate totals after adding the discount fee
      $order->calculate_totals();
            
            // Set order status to pending payment
            $order->set_status('pending');
            
            // Save the order
            $wc_order_id = $order->save();
            
            // Update car rental booking with WooCommerce order ID
            if (function_exists('update_field')) {
                update_field('woocommerce_order_id', $wc_order_id, $post_id);
            }
            
            // Get checkout URL
            $checkout_url = $order->get_checkout_payment_url();

            // if (get_locale() != 'th') {
            //     $checkout_url = str_replace('/checkout/', '/en/checkout/', $checkout_url);
            // }
            
        } catch (Exception $e) {
            error_log('WooCommerce order creation failed: ' . $e->getMessage());
        }
    }

    $response_data = [
        'message' => 'Booking created successfully!',
        'post_id' => $post_id,
        'order_code' => $booking_ref,
        'booking_reference' => $booking_ref,
        'qr_code_url' => $qr_code_url
    ];
    
    // Add WooCommerce data if order was created
    if ($wc_order_id && $checkout_url) {
        $response_data['woocommerce_order_id'] = $wc_order_id;
        $response_data['checkout_url'] = $checkout_url;
        $response_data['redirect_to_checkout'] = true;
    } else {
        // Log error if order creation failed
        error_log('WooCommerce order creation failed for car rental booking: ' . $post_id);
    }

    wp_send_json_success($response_data);
}


// function chk_ttt(){
//     // $order = wc_get_order('7958');
//     // if (!$order) return;
    
//     // // Get car rental booking ID from order meta
//     // $carrent_booking_id = $order->get_meta('carrent_booking_id');
//       // echo "Booking ID: " . $carrent_booking_id;
//     $profile_data = get_field('personal_information', 7957);
//     print_r($profile_data);
//     echo "Booking ID: " . $carrent_booking_id;
// }
// add_action('init', 'chk_ttt');

// WooCommerce Order Hooks for Car Rental Booking
// add_action('woocommerce_order_status_completed', 'update_carrent_booking_on_order_complete');
add_action('woocommerce_order_status_processing', 'update_carrent_booking_on_order_complete');

// Hook to redirect after payment completion
add_action('woocommerce_thankyou', 'carrent_redirect_after_payment', 10, 1);

// Hook into payment completed for immediate email sending
add_action('woocommerce_payment_complete', 'send_carrent_booking_email_on_payment_complete');

function update_carrent_booking_on_order_complete($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) return;
    
    // Get car rental booking ID from order meta
    $carrent_booking_id = $order->get_meta('carrent_booking_id');
    
    if ($carrent_booking_id) {
        // Update car rental booking status to confirmed/paid
        if (function_exists('update_field')) {
            update_field('payment_status', 'paid', $carrent_booking_id);
            update_field('rental_status', 'renting', $carrent_booking_id);
            update_field('rental_woo_id', $order_id, $carrent_booking_id);
            // Add payment completion timestamp
            update_field('payment_completed_at', current_time('mysql'), $carrent_booking_id);
        }
        
        // Add order completion note
        $order_code = $order->get_meta('carrent_order_code');
        $note = "การชำระเงินเสร็จสิ้น - WooCommerce Order ID: {$order_id}";
        if ($order_code) {
            $note .= " - Order Code: {$order_code}";
        }

        
        // Add note to car rental booking post
        $comment_data = array(
            'comment_post_ID' => $carrent_booking_id,
            'comment_content' => $note,
            'comment_type' => 'carrent_note',
            'comment_approved' => 1,
            'user_id' => 0
        );
        wp_insert_comment($comment_data);

  
        
        
        // Send confirmation email if needed
        send_carrent_confirmation_email($carrent_booking_id, $order_id);
        
        // Redirect to thank you page after payment completion
        $customer_email = get_field('customer_email', $carrent_booking_id);
        if (!$customer_email && function_exists('get_field')) {
            $personal_info = get_field('personal_information', $carrent_booking_id);
            if ($personal_info && isset($personal_info['email'])) {
                $customer_email = $personal_info['email'];
            }
        }
        
        $thank_you_url = home_url('/thank-you/');
        $thank_you_url = add_query_arg([
            'order_code' => $order_code,
            'email' => $customer_email
        ], $thank_you_url);
        
        // Store redirect URL in session or transient for later use
        set_transient('carrent_payment_redirect_' . $order_id, $thank_you_url, 300); // 5 minutes
    }
}

// Function to generate car rental booking email template
function generate_carrent_booking_email_template($booking_data, $order_code, $post_id, $customer_email = null) {
    $site_name = get_bloginfo('name');
    $site_url = get_bloginfo('url');
    $admin_email = get_option('admin_email');
  
    
    // Extract customer information
    $full_name = isset($booking_data['profile']['full_name']) ? esc_html($booking_data['profile']['full_name']) : '';
    $email = isset($booking_data['profile']['email']) ? esc_html($booking_data['profile']['email']) : '';
    $phone = isset($booking_data['profile']['phone_number']) ? esc_html($booking_data['profile']['phone_number']) : '';
    $line_id = isset($booking_data['profile']['line_id_whatsapp']) ? esc_html($booking_data['profile']['line_id_whatsapp']) : '';
    




    // Extract booking dates and times
    $start_date = isset($booking_data['startDate']) ? esc_html($booking_data['startDate']) : '';
    $start_time = isset($booking_data['startTime']) ? esc_html($booking_data['startTime']) : '';
    $end_date = isset($booking_data['endDate']) ? esc_html($booking_data['endDate']) : '';
    $end_time = isset($booking_data['endTime']) ? esc_html($booking_data['endTime']) : '';
    
    // Extract pickup and return locations
    $pickup_location = isset($booking_data['pickupLocation']) ? esc_html($booking_data['pickupLocation']) : '';
    $return_location = isset($booking_data['returnLocation']) ? esc_html($booking_data['returnLocation']) : '';
    
    // Extract vehicle information
    $total_price = isset($booking_data['totalPrice']) ? esc_html($booking_data['totalPrice']) : '';
    

    $flight_information = isset($booking_data['flightData']) ? $booking_data['flightData'] : array();
    $arrival_flight_no = isset($flight_information['arrival_flight_no']) ? esc_html($flight_information['arrival_flight_no']) : '';
    $arrival_flight_time = isset($flight_information['arrival_flight_time']) ? esc_html($flight_information['arrival_flight_time']) : '';
    $departure_flight_no = isset($flight_information['departure_flight_no']) ? esc_html($flight_information['departure_flight_no']) : '';
    $departure_flight_time = isset($flight_information['departure_flight_time']) ? esc_html($flight_information['departure_flight_time']) : '';

    $selectedPackage = isset($booking_data['selectedPackage']) ? $booking_data['selectedPackage'] : array();
    $vehicle_type = isset($selectedPackage['car_type']) ? esc_html($selectedPackage['car_type']) : '';
    $booking_details = isset($booking_data['booking_details']) ? $booking_data['booking_details'] : array();
    $adultCount = isset($booking_details['adult_count']) ? esc_html($booking_details['adult_count']) : '';
    $childCount = isset($booking_details['child_count']) ? esc_html($booking_details['child_count']) : '';

    $return_trip = isset($booking_data['returnTrip']) ? $booking_data['returnTrip'] : array();

    $return_start_location = isset($return_trip['return_start_location']) ? esc_html($return_trip['return_start_location']) : '';
    $return_start_location_note = isset($return_trip['return_start_location_note']) ? esc_html($return_trip['return_start_location_note']) : '';
    $return_destination = isset($return_trip['return_destination']) ? esc_html($return_trip['return_destination']) : '';
    $return_destination_note = isset($return_trip['return_destination_note']) ? esc_html($return_trip['return_destination_note']) : '';
    $return_date = isset($return_trip['return_date']) ? esc_html($return_trip['return_date']) : '';
    $return_time = isset($return_trip['return_time']) ? esc_html($return_trip['return_time']) : '';

    //   ob_start();
    // $to = 'treelapatx2@gmail.com';
    // $subject = $vehicle_type;
    // $headers = array('Content-Type: text/html; charset=UTF-8');

    // print_r($selectedPackage);

    // $body = ob_get_contents();
    // ob_end_clean();

    // wp_mail( $to, $subject, $body, $headers );


    $html = '<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>Car Rental Booking Confirmation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @media screen and (max-width:600px){
      .container{width:100% !important}
      .px-24{padding-left:16px !important; padding-right:16px !important}
      .py-32{padding-top:20px !important; padding-bottom:20px !important}
      .stack{display:block !important; width:100% !important}
      .text-center-sm{text-align:center !important}
    }
    a[x-apple-data-detectors]{color:inherit !important; text-decoration:none !important;}
    body {margin:0; padding:0; background:#f2f4f6; font-family:Arial, Helvetica, sans-serif;}
    table {border-collapse: collapse;}
  </style>
</head>
<body style="margin:0; padding:0; background:#f2f4f6; font-family:Arial, Helvetica, sans-serif;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:0 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td bgcolor="#e67e22" style="padding:18px 24px; color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="text-center-sm" style="color:#FFF; font-weight:bold; font-size:20px;">' . $site_name . '</td>
                  <td align="right" style="color:#FFF;" class="text-center-sm">
                    Parking and Shuttle
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          
          <!-- Greeting -->
          <tr>
            <td align="left" class="px-24 py-32" style="padding:28px 24px;">
              <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
              <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Dear '.$full_name.',</div>
              <div style="font-size:13px; color:#666;">
              Parking System is pleased to confirm that your payment for booking number '.$order_code.'<BR>has been successfully verified, and your booking is now complete.
              </div>
            </td>
          </tr>


          
          
          <tr>
            <td class="px-24" style="padding:0 24px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb; border-radius:6px;">
                <tr>
                  <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Booking Details</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Passenger Name</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $full_name . '</td>
                </tr>
                  <tr>
                  <td style="padding:12px 16px; color:#666;">Booking Number</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $order_code . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Travel Date</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $start_date . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Pickup Time</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $start_time . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Pickup Location</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $pickup_location . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Drop-off Location</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $return_location . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Vehicle Type</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $vehicle_type . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Passengers</td>
                  <td align="right" style="padding:12px 16px; color:#111;">Adults: ' . $adultCount . ' / Children: ' . $childCount . '</td>
                </tr>';


                  if (!empty($total_price)) {
              $html .= '<tr>
                  <td style="padding:12px 16px; color:#666; font-weight:bold;">Amount Paid</td>
                  <td align="right" style="padding:12px 16px; color:#111; font-weight:bold;">' . number_format($total_price) . ' THB</td>
                </tr>';
                }
                
              
    $html .= '</table>
            </td>
          </tr>';

    //  $return_start_location = isset($return_trip['return_start_location']) ? esc_html($return_trip['return_start_location']) : '';
    // $return_start_location_note = isset($return_trip['return_start_location_note']) ? esc_html($return_trip['return_start_location_note']) : '';
    // $return_destination = isset($return_trip['return_destination']) ? esc_html($return_trip['return_destination']) : '';
    // $return_destination_note = isset($return_trip['return_destination_note']) ? esc_html($return_trip['return_destination_note']) : '';
    // $return_date = isset($return_trip['return_date']) ? esc_html($return_trip['return_date']) : '';
    // $return_time = isset($return_trip['return_time']) ? esc_html($return_trip['return_time']) : '';


      if(!empty($return_trip)){
          $html .= '<tr>
            <td class="px-24" style="padding:0 24px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb; border-radius:6px;">
                <tr>
                  <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Return Trip</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Return Date</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $return_date . '</td>
                </tr>
                  <tr>
                  <td style="padding:12px 16px; color:#666;">Pickup Time</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $return_time . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Pickup Location</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $return_start_location . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Drop-off Location</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $return_destination . '</td>
                </tr>
              ';
        $html .= '</table>
                </td>
              </tr>';
        }


          
    // $flight_information = isset($booking_data['flightData']) ? $booking_data['flightData'] : array();
    // $arrival_flight_no = isset($flight_information['arrival_flight_no']) ? esc_html($flight_information['arrival_flight_no']) : '';
    // $arrival_flight_time = isset($flight_information['arrival_flight_time']) ? esc_html($flight_information['arrival_flight_time']) : '';
    // $departure_flight_no = isset($flight_information['departure_flight_no']) ? esc_html($flight_information['departure_flight_no']) : '';
    // $departure_flight_time = isset($flight_information['departure_flight_time']) ? esc_html($flight_information['departure_flight_time']) : '';

        
      if(!empty($flight_information)){
          $html .= '<tr>
            <td class="px-24" style="padding:0 24px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb; border-radius:6px;">
                <tr>
                  <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Flight Information</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Arrival Flight</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $arrival_flight_no . ' at ' . $arrival_flight_time . '</td>
                </tr>
                  <tr>
                  <td style="padding:12px 16px; color:#666;">Departure Flight</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $departure_flight_no . ' at ' . $departure_flight_time . '</td>
                </tr>
              ';
        $html .= '</table>
                </td>
              </tr>';
        }



      
    
    $html .= '
          <!-- Promo block -->
          <tr>
            <td bgcolor="#e67e22" align="center" style="padding:28px 24px; color:#ffffff;">
              <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">Contact Parking System</div>
              <div style="font-size:14px; font-weight:bold; margin-bottom:10px;">If you have any questions or need assistance, please feel free to reach us</div>
              <div style="font-size:14px; margin-bottom:15px;">LINE Official Account: @parkingsystem</div>
              <div style="font-size:14px; margin-bottom:15px;">Phone: +6696-286-4050</div>
              <div style="font-size:14px; margin-bottom:15px;">Email: support@parking-system.local</div>
              <div style="font-size:17px; font-weight:bold; margin-bottom:10px;">Thank you for choosing Parking System.<BR>We look forward to welcoming you!</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px; background:#f7f7f7;">
              <div style="font-size:12px; color:#666;">
                <div>Copyright © <strong>' . $site_name . '</strong> All rights reserved.</div>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>';

    // If customer email is provided, send the email
    if ($customer_email) {
        // Email headers
        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $site_name . ' <' . $admin_email . '>'
        );
        
        // Email subject
        $subject = 'Parking System - [Private Car Service] Booking Confirmed (Booking No. ' . $order_code . ')';

        
        try {
            // Send email to customer
            $customer_sent = wp_mail($customer_email, $subject, $html, $headers);
            
            // Send email to admin with different subject
            $admin_subject = 'บริการรถยนต์ส่วนตัวเดินทาง – การจองใหม่ (Booking No. ' . $order_code . ')';

            $admin_sent = wp_mail($admin_email, $admin_subject, $html, $headers);
            
            // Log email sending results
            if ($customer_sent) {
                error_log("Car rental booking email sent successfully to customer: $customer_email for order: $order_code");
            } else {
                error_log("Failed to send car rental booking email to customer: $customer_email for order: $order_code");
            }
            
            if ($admin_sent) {
                error_log("Car rental booking email sent successfully to admin: $admin_email for order: $order_code");
            } else {
                error_log("Failed to send car rental booking email to admin: $admin_email for order: $order_code");
            }
            
        } catch (Exception $e) {
            error_log("Error sending car rental booking emails for order $order_code: " . $e->getMessage());
        }
    }
    
    return $html;
}



// Function to send car rental confirmation email after payment
function send_carrent_confirmation_email($carrent_booking_id, $order_id) {
    $order = wc_get_order($order_id);
    if (!$order) {
        error_log("WooCommerce order not found for ID: $order_id");
        return;
    }

  
    
    // Get order code
    $order_code = $order->get_meta('carrent_order_code');
    if (!$order_code) {
        error_log("No carrent order code found for order: $order_id");
        return;
    }
    
    // Try to reconstruct booking data from ACF fields
    $booking_data = array();
    

    // Get profile information
    $profile_data = get_field('personal_information', $carrent_booking_id);
    // $order->add_order_note($profile_data['fullname']);


    if (!$profile_data) {
        // Fallback: construct from individual fields
        $profile_data = array(
            'fullname' => get_field('customer_name', $carrent_booking_id),
            'email' => get_field('customer_email', $carrent_booking_id),
            'phone' => get_field('customer_phone', $carrent_booking_id),
            'lineid' => get_field('customer_line_id', $carrent_booking_id)
        );
    }

    $flight_information = get_field('flight_information', $carrent_booking_id);


    // Check if we have customer email
    if (empty($profile_data['email'])) {
        // Try to get email from WooCommerce order
        $customer_email = $order->get_billing_email();
        if (!empty($customer_email)) {
            $profile_data['email'] = $customer_email;
        } else {
            error_log("No customer email found for carrent booking order: $order_code");
            return;
        }
    }
    
    $booking_data['profile'] = $profile_data;
    $booking_data['flightData'] = $flight_information;
    $booking_data['booking_details'] = get_field('booking_details', $carrent_booking_id);
    $booking_data['returnTrip'] = get_field('travel_information_return_trip', $carrent_booking_id);
    $booking_data['startDate'] = get_field('depart_date', $carrent_booking_id);
    $booking_data['endDate'] = get_field('return_date', $carrent_booking_id);
    $booking_data['startTime'] = get_field('depart_time', $carrent_booking_id);
    $booking_data['endTime'] = get_field('return_time', $carrent_booking_id);
    $booking_data['pickupLocation'] = get_field('depart_destination', $carrent_booking_id);
    $booking_data['returnLocation'] = get_field('return_destination', $carrent_booking_id);
    // $booking_data['vehicleType'] = get_field('car_type', $carrent_booking_id);
    $booking_data['totalPrice'] = $order->get_total();
    $booking_data['selectedPackage'] = get_field('selected_package', $carrent_booking_id);


    
  

    // Use the beautiful email template function
    generate_carrent_booking_email_template($booking_data, $order_code, $carrent_booking_id, $profile_data['email']);
    
    error_log("Car rental confirmation email sent for order: $order_code to: " . $profile_data['email']);
}

/**
 * Alternative hook for when payment is completed (before order status changes)
 */
function send_carrent_booking_email_on_payment_complete($order_id) {
    // Get WooCommerce order
    $order = wc_get_order($order_id);
    if (!$order) {
        error_log("WooCommerce order not found for ID: $order_id");
        return;
    }
    
    // Check if this is a car rental booking order
    $carrent_booking_id = $order->get_meta('carrent_booking_id');
    if (!$carrent_booking_id) {
        error_log("Not a car rental booking order: $order_id");
        return;
    }
    
    // Only send if order is paid and not already processed
    if ($order->is_paid() && !$order->get_meta('_carrent_email_sent')) {
        // Mark as processed to avoid duplicate emails
        $order->update_meta_data('_carrent_email_sent', true);
        $order->save();
        
        // Get booking data and order code
        $order_code = $order->get_meta('carrent_order_code');
        $customer_email = $order->get_billing_email();
        
        // Try to reconstruct booking data from ACF fields
        $booking_data = array();
        
        // Get profile information
        $profile_data = get_field('personal_information', $carrent_booking_id);
        if (!$profile_data) {
            // Fallback: construct from individual fields
            $profile_data = array(
                'fullname' => get_field('customer_name', $carrent_booking_id),
                'email' => get_field('customer_email', $carrent_booking_id),
                'phone' => get_field('customer_phone', $carrent_booking_id),
                'lineid' => get_field('customer_line_id', $carrent_booking_id)
            );
        }
        
        $booking_data['profile'] = $profile_data;
        // TODO: ตรวจสอบว่า ACF fields เหล่านี้มีอยู่จริงหรือไม่
        // ปัญหา: ฟิลด์ location ถูกบันทึกแต่ชื่อไม่ตรงกับที่ดึง
        $booking_data['startDate'] = get_field('pickup_date', $carrent_booking_id) ?: get_field('depart_date', $carrent_booking_id);
        $booking_data['endDate'] = get_field('return_date', $carrent_booking_id);
        $booking_data['startTime'] = get_field('pickup_time', $carrent_booking_id) ?: get_field('depart_time', $carrent_booking_id);
        $booking_data['endTime'] = get_field('return_time', $carrent_booking_id);
        $booking_data['pickupLocation'] = get_field('pickup_location', $carrent_booking_id) ?: get_field('depart_start_location', $carrent_booking_id);
        $booking_data['returnLocation'] = get_field('return_location', $carrent_booking_id) ?: get_field('depart_destination', $carrent_booking_id);
        $booking_data['vehicleType'] = get_field('vehicle_type', $carrent_booking_id);
        $booking_data['totalPrice'] = get_field('total_price', $carrent_booking_id);
        
        // Use customer email from order if profile email is empty
        if (empty($booking_data['profile']['email']) && !empty($customer_email)) {
            $booking_data['profile']['email'] = $customer_email;
        }
        
        // Send the email using our email template function
        if (!empty($booking_data['profile']['email'])) {
            generate_carrent_booking_email_template($booking_data, $order_code, $carrent_booking_id, $booking_data['profile']['email']);
            error_log("Car rental booking payment complete email sent for order: $order_code to: " . $booking_data['profile']['email']);
        } else {
            error_log("No customer email found for car rental booking order: $order_code");
        }
    }
}

// Function to handle redirect after payment completion
function carrent_redirect_after_payment($order_id) {
    if (!$order_id) return;
    
    $order = wc_get_order($order_id);
    if (!$order) return;
    
    // Check if this is a car rental booking order
    $carrent_booking_id = $order->get_meta('carrent_booking_id');
    
    if ($carrent_booking_id) {
        // Get redirect URL from transient
        $redirect_url = get_transient('carrent_payment_redirect_' . $order_id);
        
        if ($redirect_url) {
            // Clean up transient
            delete_transient('carrent_payment_redirect_' . $order_id);
            
            // Redirect using JavaScript since we're in a hook
            echo '<script type="text/javascript">
                    window.location.href = "' . esc_url($redirect_url) . '";
            </script>';
        } else {
            // Fallback redirect if transient is not available
            $order_code = $order->get_meta('carrent_order_code');
            
            // Get customer email
            $customer_email = get_field('customer_email', $carrent_booking_id);
            if (!$customer_email && function_exists('get_field')) {
                $personal_info = get_field('personal_information', $carrent_booking_id);
                if ($personal_info && isset($personal_info['email'])) {
                    $customer_email = $personal_info['email'];
                }
            }
            
            $thank_you_url = home_url('/thank-you/');
            if (get_locale() != 'th') {
                $thank_you_url = str_replace('/thank-you/', '/en/thank-you/', $thank_you_url);
            }
            $thank_you_url = add_query_arg([
                'order_code' => $order_code,
                'email' => $customer_email
            ], $thank_you_url);

                // Fix URL encoding issue - replace &#038; with &
            $thank_you_url = str_replace('&#038;', '&', $thank_you_url);
            
            // Additional fix for URL encoding in JavaScript
            $thank_you_url = html_entity_decode($thank_you_url, ENT_QUOTES, 'UTF-8');
            
            
            echo '<script type="text/javascript">
                window.location.href = "' . $thank_you_url . '";
            </script>';
        }
    }
}

// Helper function to decode URL encoded strings
function decode_if_encoded($value) {
    if (is_string($value) && strpos($value, '%') !== false) {
        $decoded = urldecode($value);
        // Double decode if needed
        if (strpos($decoded, '%') !== false) {
            $decoded = urldecode($decoded);
        }
        return $decoded;
    }
    return $value;
}

// Helper function to convert Thai date to Y-m-d format (ACF compatible)
function convert_thai_date($dateStr) {
    if (empty($dateStr)) return '';
    
    // Thai month mapping
    $thaiMonths = [
        'ม.ค.' => '01', 'ก.พ.' => '02', 'มี.ค.' => '03', 'เม.ย.' => '04',
        'พ.ค.' => '05', 'มิ.ย.' => '06', 'ก.ค.' => '07', 'ส.ค.' => '08',
        'ก.ย.' => '09', 'ต.ค.' => '10', 'พ.ย.' => '11', 'ธ.ค.' => '12'
    ];
    
    // Check if it's Thai date format (e.g., "25 ก.ย. 2568")
    if (preg_match('/^(\d{1,2})\s+([ก-ฮ\.]+)\s+(\d{4})$/', trim($dateStr), $matches)) {
        $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $thaiMonth = $matches[2];
        $year = intval($matches[3]);
        
        // Convert Buddhist year to Gregorian year if needed
        if ($year > 2500) {
            $year = $year - 543;
        }
        
        if (isset($thaiMonths[$thaiMonth])) {
            $month = $thaiMonths[$thaiMonth];
            return $year . '-' . $month . '-' . $day; // Y-m-d format
        }
    }
    
    // Check if it's already in YYYY-MM-DD format, return as is
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', trim($dateStr))) {
        return $dateStr; // Already Y-m-d format
    }
    
    // Check if it's in DD/MM/YYYY format and convert to Y-m-d
    if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', trim($dateStr), $matches)) {
        $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
        $year = $matches[3];
        return $year . '-' . $month . '-' . $day; // Y-m-d format
    }
    
    // Check if it's in MM/DD/YYYY format and convert to Y-m-d
    if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', trim($dateStr), $matches)) {
        $month = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $day = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
        $year = $matches[3];
        return $year . '-' . $month . '-' . $day; // Y-m-d format
    }
    
    // If other format, try to parse and convert to Y-m-d
    $timestamp = strtotime($dateStr);
    if ($timestamp !== false) {
        return date('Y-m-d', $timestamp); // Y-m-d format
    }
    
    // If all else fails, return original string
    return $dateStr;
}

function sanitize_car_rental_fields($fields) {
    $sanitized = array();
    
    // Personal Information
    if (isset($fields['personal_information'])) {
        $sanitized['personal_information'] = array(
            'full_name' => isset($fields['personal_information']['full_name']) ? sanitize_text_field($fields['personal_information']['full_name']) : '',
            'email' => isset($fields['personal_information']['email']) ? sanitize_email($fields['personal_information']['email']) : '',
            'line_id_whatsapp' => isset($fields['personal_information']['line_id_whatsapp']) ? sanitize_text_field($fields['personal_information']['line_id_whatsapp']) : '',
            'phone_number' => isset($fields['personal_information']['phone_number']) ? sanitize_text_field($fields['personal_information']['phone_number']) : ''
        );
    }
    
    // Selected Package Information (from service-carrent)
    // รับข้อมูลจาก hidden inputs ที่ส่งมาจาก form
    if (isset($_POST['selected_package_id']) && !empty($_POST['selected_package_id'])) {
        $sanitized['selected_package'] = array(
            'package_id' => intval($_POST['selected_package_id']),
            'route' => isset($_POST['selected_package_route']) ? sanitize_text_field($_POST['selected_package_route']) : '',
            'car_type' => isset($_POST['selected_package_car_type']) ? sanitize_text_field($_POST['selected_package_car_type']) : '',
            'price' => isset($_POST['selected_package_price']) ? sanitize_text_field($_POST['selected_package_price']) : ''
        );
    }
    
    // Travel Information - Outbound
    if (isset($fields['travel_information_outbound_trip'])) {
        $outbound = $fields['travel_information_outbound_trip'];
        $sanitized['travel_information_outbound_trip'] = array(
            'depart_start_location' => isset($outbound['depart_start_location']) ? sanitize_text_field(decode_if_encoded($outbound['depart_start_location'])) : '',
            'depart_start_location_note' => isset($outbound['depart_start_location_note']) ? sanitize_textarea_field(decode_if_encoded($outbound['depart_start_location_note'])) : '',
            'depart_destination' => isset($outbound['depart_destination']) ? sanitize_text_field(decode_if_encoded($outbound['depart_destination'])) : '',
            'depart_destination_note' => isset($outbound['depart_destination_note']) ? sanitize_textarea_field(decode_if_encoded($outbound['depart_destination_note'])) : '',
            'depart_date' => isset($outbound['depart_date']) ? convert_thai_date($outbound['depart_date']) : '',
            'depart_time' => isset($outbound['depart_time']) ? sanitize_text_field($outbound['depart_time']) : ''
        );
        
        // Log the decoded values
        error_log("Decoded outbound data: " . print_r($sanitized['travel_information_outbound_trip'], true));
    }
    
    // Trip Type
    if (isset($fields['trip_type'])) {
        $sanitized['trip_type'] = intval($fields['trip_type']);
    }
    
    // Travel Information - Return
    if (isset($fields['travel_information_return_trip'])) {
        $return = $fields['travel_information_return_trip'];
        $sanitized['travel_information_return_trip'] = array(
            'return_start_location' => isset($return['return_start_location']) ? sanitize_text_field(decode_if_encoded($return['return_start_location'])) : '',
            'return_start_location_note' => isset($return['return_start_location_note']) ? sanitize_textarea_field(decode_if_encoded($return['return_start_location_note'])) : '',
            'return_destination' => isset($return['return_destination']) ? sanitize_text_field(decode_if_encoded($return['return_destination'])) : '',
            'return_destination_note' => isset($return['return_destination_note']) ? sanitize_textarea_field(decode_if_encoded($return['return_destination_note'])) : '',
            'return_date' => isset($return['return_date']) ? convert_thai_date($return['return_date']) : '',
            'return_time' => isset($return['return_time']) ? sanitize_text_field($return['return_time']) : ''
        );
        
        // Log the decoded values
        error_log("Decoded return data: " . print_r($sanitized['travel_information_return_trip'], true));
    }
    
    // Booking Details
    if (isset($fields['booking_details'])) {
        $sanitized['booking_details'] = array(
            'car_type' => isset($fields['booking_details']['car_type']) ? sanitize_text_field($fields['booking_details']['car_type']) : '',
            'adult_count' => isset($fields['booking_details']['adult_count']) ? intval($fields['booking_details']['adult_count']) : 0,
            'child_count' => isset($fields['booking_details']['child_count']) ? intval($fields['booking_details']['child_count']) : 0,
            'remark_booking' => isset($fields['booking_details']['remark_booking']) ? sanitize_textarea_field($fields['booking_details']['remark_booking']) : '',
            'price_per_trip' => isset($fields['booking_details']['price_per_trip']) ? floatval($fields['booking_details']['price_per_trip']) : 0,
            'total_price' => isset($fields['booking_details']['total_price']) ? floatval($fields['booking_details']['total_price']) : 0
        );
    }
    
    // Flight Information
    if (isset($fields['flight_information'])) {
        $sanitized['flight_information'] = array(
            'arrival_flight_no' => isset($fields['flight_information']['arrival_flight_no']) ? sanitize_text_field($fields['flight_information']['arrival_flight_no']) : '',
            'arrival_flight_time' => isset($fields['flight_information']['arrival_flight_time']) ? sanitize_text_field($fields['flight_information']['arrival_flight_time']) : '',
            'departure_flight_no' => isset($fields['flight_information']['departure_flight_no']) ? sanitize_text_field($fields['flight_information']['departure_flight_no']) : '',
            'departure_flight_time' => isset($fields['flight_information']['departure_flight_time']) ? sanitize_text_field($fields['flight_information']['departure_flight_time']) : '',
            'discount_code' => isset($fields['flight_information']['discount_code']) ? sanitize_text_field($fields['flight_information']['discount_code']) : '',
            'remark_flight' => isset($fields['flight_information']['remark_flight']) ? sanitize_textarea_field($fields['flight_information']['remark_flight']) : ''
        );
    }
    
    // Coupon/Discount Information
    if (isset($fields['coupon_information'])) {
        $sanitized['coupon_information'] = array(
            'coupon_code' => isset($fields['coupon_information']['coupon_code']) ? sanitize_text_field($fields['coupon_information']['coupon_code']) : '',
            'discount_amount' => isset($fields['coupon_information']['discount_amount']) ? floatval($fields['coupon_information']['discount_amount']) : 0,
            'discount_percent' => isset($fields['coupon_information']['discount_percent']) ? floatval($fields['coupon_information']['discount_percent']) : 0,
            'original_price' => isset($fields['coupon_information']['original_price']) ? floatval($fields['coupon_information']['original_price']) : 0,
            'final_price' => isset($fields['coupon_information']['final_price']) ? floatval($fields['coupon_information']['final_price']) : 0
        );
    }
    
    return $sanitized;
}

function send_car_rental_confirmation_email($fields, $booking_ref, $post_id) {
    // Check if required fields exist before accessing them
    if (!isset($fields['personal_information']['email']) || !isset($fields['personal_information']['full_name'])) {
        error_log('Missing required personal information for email sending');
        return;
    }
    
    $customer_email = $fields['personal_information']['email'];
    $customer_name = $fields['personal_information']['full_name'];
    
    // Admin email (ใส่อีเมลของ admin ที่ต้องการรับการแจ้งเตือน)
    $admin_email = get_option('admin_email');
    
    $subject = "การยืนยันการจองรถเช่า - {$booking_ref}";
    
    // Create beautiful HTML email template
    $message = generate_car_rental_email_template($fields, $booking_ref, $post_id);
    
    // Email headers
    $headers = array(
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . get_bloginfo('name') . ' <' . $admin_email . '>'
    );
    
    // Send email to customer
    $customer_sent = wp_mail($customer_email, $subject, $message, $headers);
    
    // Send email to admin
    $admin_subject = "การจองรถเช่าใหม่ - {$booking_ref}";
    $admin_sent = wp_mail($admin_email, $admin_subject, $message, $headers);
    
    // Log email results
    if ($customer_sent) {
        error_log("Confirmation email sent to customer: {$customer_email}");
    } else {
        error_log("Failed to send confirmation email to customer: {$customer_email}");
    }
    
    if ($admin_sent) {
        error_log("Notification email sent to admin: {$admin_email}");
    } else {
        error_log("Failed to send notification email to admin: {$admin_email}");
    }
}

function generate_car_rental_email_template($fields, $booking_ref, $post_id) {
    $site_name = get_bloginfo('name');
    $site_url = get_bloginfo('url');
    $admin_email = get_option('admin_email');
    
    // Extract all data fields
    $full_name = isset($fields['personal_information']['full_name']) ? esc_html($fields['personal_information']['full_name']) : '';
    $email = isset($fields['personal_information']['email']) ? esc_html($fields['personal_information']['email']) : '';
    $phone = isset($fields['personal_information']['phone_number']) ? esc_html($fields['personal_information']['phone_number']) : '';
    $line_id = isset($fields['personal_information']['line_id_whatsapp']) ? esc_html($fields['personal_information']['line_id_whatsapp']) : '';
    
    // Package information
    $route = isset($fields['selected_package']['route']) ? esc_html($fields['selected_package']['route']) : '';
    $car_type_package = isset($fields['selected_package']['car_type']) ? esc_html($fields['selected_package']['car_type']) : '';
    $price = isset($fields['selected_package']['price']) ? esc_html($fields['selected_package']['price']) : '';
    
    // Outbound trip
    $depart_start_location = isset($fields['travel_information_outbound_trip']['depart_start_location']) ? esc_html($fields['travel_information_outbound_trip']['depart_start_location']) : '';
    $depart_start_location_note = isset($fields['travel_information_outbound_trip']['depart_start_location_note']) ? esc_html($fields['travel_information_outbound_trip']['depart_start_location_note']) : '';
    $depart_destination = isset($fields['travel_information_outbound_trip']['depart_destination']) ? esc_html($fields['travel_information_outbound_trip']['depart_destination']) : '';
    $depart_destination_note = isset($fields['travel_information_outbound_trip']['depart_destination_note']) ? esc_html($fields['travel_information_outbound_trip']['depart_destination_note']) : '';
    $depart_date = isset($fields['travel_information_outbound_trip']['depart_date']) ? esc_html($fields['travel_information_outbound_trip']['depart_date']) : '';
    $depart_time = isset($fields['travel_information_outbound_trip']['depart_time']) ? esc_html($fields['travel_information_outbound_trip']['depart_time']) : '';
    
    // Return trip
    $is_round_trip = isset($fields['trip_type']) && $fields['trip_type'] == 1;
    $return_start_location = isset($fields['travel_information_return_trip']['return_start_location']) ? esc_html($fields['travel_information_return_trip']['return_start_location']) : '';
    $return_start_location_note = isset($fields['travel_information_return_trip']['return_start_location_note']) ? esc_html($fields['travel_information_return_trip']['return_start_location_note']) : '';
    $return_destination = isset($fields['travel_information_return_trip']['return_destination']) ? esc_html($fields['travel_information_return_trip']['return_destination']) : '';
    $return_destination_note = isset($fields['travel_information_return_trip']['return_destination_note']) ? esc_html($fields['travel_information_return_trip']['return_destination_note']) : '';
    $return_date = isset($fields['travel_information_return_trip']['return_date']) ? esc_html($fields['travel_information_return_trip']['return_date']) : '';
    $return_time = isset($fields['travel_information_return_trip']['return_time']) ? esc_html($fields['travel_information_return_trip']['return_time']) : '';
    
    // Booking details
    $car_type = isset($fields['booking_details']['car_type']) ? esc_html($fields['booking_details']['car_type']) : '';
    $adult_count = isset($fields['booking_details']['adult_count']) ? esc_html($fields['booking_details']['adult_count']) : '';
    $child_count = isset($fields['booking_details']['child_count']) ? esc_html($fields['booking_details']['child_count']) : '';
    $remark_booking = isset($fields['booking_details']['remark_booking']) ? esc_html($fields['booking_details']['remark_booking']) : '';
    
    // Flight information
    $arrival_flight_no = isset($fields['flight_information']['arrival_flight_no']) ? esc_html($fields['flight_information']['arrival_flight_no']) : '';
    $arrival_flight_time = isset($fields['flight_information']['arrival_flight_time']) ? esc_html($fields['flight_information']['arrival_flight_time']) : '';
    $departure_flight_no = isset($fields['flight_information']['departure_flight_no']) ? esc_html($fields['flight_information']['departure_flight_no']) : '';
    $departure_flight_time = isset($fields['flight_information']['departure_flight_time']) ? esc_html($fields['flight_information']['departure_flight_time']) : '';
    $discount_code = isset($fields['flight_information']['discount_code']) ? esc_html($fields['flight_information']['discount_code']) : '';
    $remark_flight = isset($fields['flight_information']['remark_flight']) ? nl2br(esc_html($fields['flight_information']['remark_flight'])) : '';
    
    $html = '<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>Order Confirmation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @media screen and (max-width:600px){
      .container{width:100% !important}
      .px-24{padding-left:16px !important; padding-right:16px !important}
      .py-32{padding-top:20px !important; padding-bottom:20px !important}
      .stack{display:block !important; width:100% !important}
      .text-center-sm{text-align:center !important}
    }
    a[x-apple-data-detectors]{color:inherit !important; text-decoration:none !important;}
    body {margin:0; padding:0; background:#f2f4f6; font-family:Arial, Helvetica, sans-serif;}
    table {border-collapse: collapse;}
  </style>
</head>
<body style="margin:0; padding:0; background:#f2f4f6; font-family:Arial, Helvetica, sans-serif;">


  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:0 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td bgcolor="#29b2e2" style="padding:18px 24px; color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="text-center-sm" style="font-weight:bold; font-size:20px;">' . $site_name . '</td>
                  <td align="right" class="text-center-sm">
                    <a href="' . $site_url . '" style="color:#ffffff; text-decoration:none; font-size:14px;">Parking System ▸</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- Title -->
          <tr>
            <td align="center" class="px-24 py-32" style="padding:28px 24px;">
              <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
              <div style="font-size:22px; font-weight:bold; color:#333;">ขอบคุณสำหรับคำสั่งซื้อของคุณ!</div>
              <div style="font-size:13px; color:#666;">เราได้รับคำสั่งซื้อแล้วและกำลังจัดส่งให้คุณ</div>
            </td>
          </tr>


          <!-- Order summary -->
          <tr>
            <td class="px-24" style="padding:0 24px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb; border-radius:6px;">
                <tr>
                  <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">สรุปรายการสั่งซื้อ</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">หมายเลขออเดอร์</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $booking_ref . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">ชื่อผู้จอง</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $full_name . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">อีเมล</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $email . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">เบอร์โทรศัพท์</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $phone . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">เส้นทาง</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $route . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">ประเภทรถ</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $car_type . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">จำนวนผู้ใหญ่</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $adult_count . ' คน</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">จำนวนเด็ก</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $child_count . ' คน</td>
                </tr>';
    
    if (!empty($price)) {
        $html .= '<tr>
                  <td style="padding:12px 16px; color:#666;">ราคา</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $price . '</td>
                </tr>';
    }
    
    $html .= '              </table>
            </td>
          </tr>


          <!-- Address + ETA -->
          <tr>
            <td class="px-24" style="padding:8px 24px 24px;">
              <table role="presentation" width="100%">
                <tr>
                  <td class="stack" width="50%" valign="top" style="padding:16px; border:1px solid #e5e7eb; border-radius:6px;">
                    <div style="font-weight:bold; color:#111; margin-bottom:6px;">ข้อมูลการเดินทาง - เที่ยวขาไป</div>
                    <div style="font-size:13px; color:#555; line-height:1.5;">
                      ต้นทาง: ' . $depart_start_location . '<br>
                      รายละเอียดต้นทาง: ' . $depart_start_location_note . '<br>
                      ปลายทาง: ' . $depart_destination . '<br>
                      รายละเอียดปลายทาง: ' . $depart_destination_note . '<br>
                      วันที่: ' . $depart_date . '<br>
                      เวลา: ' . $depart_time . '
                    </div>
                  </td>
                  <td class="stack" width="5%">&nbsp;</td>';
    
    if ($is_round_trip) {
        $html .= '<td class="stack" width="45%" valign="top" style="padding:16px; border:1px solid #e5e7eb; border-radius:6px;">
                    <div style="font-weight:bold; color:#111; margin-bottom:6px;">ข้อมูลการเดินทาง - เที่ยวขากลับ</div>
                    <div style="font-size:13px; color:#555; line-height:1.5;">
                      ต้นทาง: ' . $return_start_location . '<br>
                      รายละเอียดต้นทาง: ' . $return_start_location_note . '<br>
                      ปลายทาง: ' . $return_destination . '<br>
                      รายละเอียดปลายทาง: ' . $return_destination_note . '<br>
                      วันที่: ' . $return_date . '<br>
                      เวลา: ' . $return_time . '
                    </div>
                  </td>';
    } else {
        $html .= '<td class="stack" width="45%" valign="top" style="padding:16px; border:1px solid #e5e7eb; border-radius:6px;">
                    <div style="font-weight:bold; color:#111; margin-bottom:6px;">ข้อมูลเพิ่มเติม</div>
                    <div style="font-size:13px; color:#555; line-height:1.5;">
                      หมายเหตุการจอง:<br>
                      ' . $remark_booking . '
                    </div>
                  </td>';
    }
    
    $html .= '                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Flight Information -->
          <tr>
            <td class="px-24" style="padding:8px 24px 24px;">
              <table role="presentation" width="100%">
                <tr>
                  <td class="stack" width="100%" valign="top" style="padding:16px; border:1px solid #e5e7eb; border-radius:6px;">
                    <div style="font-weight:bold; color:#111; margin-bottom:6px;">ข้อมูลเที่ยวบิน</div>
                    <div style="font-size:13px; color:#555; line-height:1.5;">
                      เที่ยวบินขาเข้า: ' . $arrival_flight_no . ' เวลา ' . $arrival_flight_time . '<br>
                      เที่ยวบินขาออก: ' . $departure_flight_no . ' เวลา ' . $departure_flight_time . '<br>';
    
    if (!empty($discount_code)) {
        $html .= 'โค้ดส่วนลด: ' . $discount_code . '<br>';
    }
    
    if (!empty($remark_flight)) {
        $html .= 'หมายเหตุเที่ยวบิน:<br>' . $remark_flight . '';
    }
    
    $html .= '                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- Promo block -->
          <tr>
            <td bgcolor="#29b2e2" align="center" style="padding:28px 24px; color:#ffffff;">
              <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">ขอบคุณที่ใช้บริการของเรา!</div>
              <div style="font-size:14px; margin-bottom:15px;">หากมีข้อสงสัยกรุณาติดต่อ: ' . $admin_email . '</div>
              <a href="' . $site_url . '" 
                 style="display:inline-block; background:#1c8db8; color:#ffffff; text-decoration:none; 
                        padding:12px 22px; border-radius:4px; font-weight:bold; font-size:14px;">
                กลับไปที่เว็บไซต์
              </a>
            </td>
          </tr>


          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px; background:#f7f7f7;">
              <div style="font-size:12px; color:#666;">
                <div><strong>' . $site_name . '</strong> • ' . $admin_email . '</div>
              </div>
            </td>
          </tr>


        </table>
      </td>
    </tr>
  </table>


</body>
</html>';
    
    return $html;
}


