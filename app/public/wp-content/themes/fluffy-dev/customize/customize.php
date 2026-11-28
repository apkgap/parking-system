<?php

require_once get_template_directory() . '/customize/control/carrent.php';
require_once get_template_directory() . '/customize/control/signup.php';
require_once get_template_directory() . '/customize/control/signin.php';
require_once get_template_directory() . '/customize/control/ajax-forgotpassword.php';
require_once get_template_directory() . '/customize/control/service-carrent.php';
require_once get_template_directory() . '/customize/control/add-driver-job.php';
require_once get_template_directory() . '/customize/control/service-management.php';
// require_once get_template_directory() . '/customize/control/check-fight.php';
require_once get_template_directory() . '/customize/control/customer-profile.php';
require_once get_template_directory() . '/inc/multilingual-functions.php';
// echo get_template_directory() . '/customize/control/ajax-forgotpassword.php';

// Create custom role 'service-customer'
// add_action( 'init', function() {
//     add_role( 'service-customer', 'Service Customer', array(
//         'read'         => true,
//         'edit_posts'   => true,
//         'delete_posts' => true,
//         'upload_files' => true,
//     ) );
// } );

function enqueue_daisyui_and_tailwind()
{
    // Enqueue DaisyUI main stylesheet
    wp_enqueue_style(
        'daisyui',
        'https://cdn.jsdelivr.net/npm/daisyui@5',
        array(),
        '5.0.0'
    );

    // Enqueue DaisyUI lofi theme only
    // wp_enqueue_style(
    //     'daisyui-lofi-theme',
    //     'https://cdn.jsdelivr.net/npm/daisyui@5/dist/themes/lofi.css',
    //     array('daisyui'),
    //     '5.0.0'
    // );

    // // Enqueue Tailwind CSS Browser script
    wp_enqueue_script(
        'tailwindcss-browser',
        get_template_directory_uri() . '/js/tailwind-4.js',
        array(),
        true
    );
}

// Hook the function to wp_enqueue_scripts
add_action('wp_enqueue_scripts', 'enqueue_daisyui_and_tailwind');


function enqueue_customize_file()
{
    $css_file = get_template_directory() . '/customize/css/customize.css';
    $js_file = get_template_directory() . '/customize/js/customize.js';
    $thaidatejs_file = get_template_directory() . '/customize/js/thai-date.js';
    $space_parking = get_template_directory() . '/customize/js/space-parking.js';
    $tabien_popup = get_template_directory() . '/customize/js/tabien-popup.js';
    $woocommerce_checkout = get_template_directory() . '/customize/css/woocommerce-checkout.css';

    $css_version = filemtime($css_file);
    $js_version = filemtime($js_file);
    $thjs_version = filemtime($thaidatejs_file);
    $space_parking_version = filemtime($space_parking);
    $tabien_popup_version = filemtime($tabien_popup);

    wp_enqueue_style('customize-styles', get_template_directory_uri() . '/customize/css/customize.css', array(), $css_version);
    wp_enqueue_style('picker-styles', get_template_directory_uri() . '/customize/css/picker.min.css', array());
    wp_enqueue_style('flatpickr-styles', 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css', array());
    wp_enqueue_script('customize-script', get_template_directory_uri() . '/customize/js/customize.js', array('jquery'), $js_version, true);

    // Enqueue parking translations script
    wp_enqueue_script('parking-translations', get_template_directory_uri() . '/js/parking-translations.js', array('jquery'), filemtime(get_template_directory() . '/js/parking-translations.js'), true);
    wp_enqueue_script('picker-script', get_template_directory_uri() . '/customize/js/picker.min.js', array('jquery'), true);
    wp_enqueue_script('flatpickr-script', 'https://cdn.jsdelivr.net/npm/flatpickr', array('jquery'), true);
    wp_enqueue_script('thaidate-script', get_template_directory_uri() . '/customize/js/thai-date.js', array('jquery'), $thjs_version, true);
    wp_enqueue_style('select2-styles',  get_template_directory_uri() . '/customize/css/select2.min.css', array());
    wp_enqueue_script('select2-script', get_template_directory_uri() . '/customize/js/select2.min.js', array('jquery'), $thjs_version, true);
    wp_enqueue_script('tabien-popup-script', get_template_directory_uri() . '/customize/js/tabien-popup.js', array('jquery'), $tabien_popup_version, true);
    wp_enqueue_style('woocommerce-checkout-style', get_template_directory_uri() . '/customize/css/woocommerce-checkout.css', array());

    // Add WordPress global variables for login check
    wp_localize_script('tabien-popup-script', 'wpApiSettings', array(
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
        'userId' => get_current_user_id()
    ));
}
add_action('wp_enqueue_scripts', 'enqueue_customize_file');


function remove_fluffy_styles()
{
    wp_dequeue_style('fluffy-style'); // Replace 'fluffy-style' with the actual handle if different
    wp_deregister_style('fluffy-style');
}
add_action('wp_enqueue_scripts', 'remove_fluffy_styles', 100);

function login_register_buttons_shortcode($atts = [])
{
    // Parse shortcode attributes
    $atts = shortcode_atts([
        'welcome_text' => '%s', // %s will be replaced with display name
        'login_text'   => 'Login',
        'register_text' => 'Register',
        'logout_text'  => 'Logout',
    ], $atts, 'login_register_buttons');

    ob_start();

    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $user_roles = (array) $current_user->roles;
        $is_privileged_user = in_array('administrator', $user_roles, true) || in_array('service-customer', $user_roles, true);

        $welcome_text = sprintf(
            esc_html($atts['welcome_text']),
            esc_html($current_user->display_name)
        );
        // print_r($user_roles);
        // echo 'testxxx';
?>
        <div class="auth-user-logged-in flex items-center gap-2 md:gap-4">
            <?php if ($is_privileged_user): ?>
                <div class="dropdown dropdown-end">
                    <div tabindex="0" role="button" class="auth-dashboard-button duration-200 cursor-pointer flex items-center">
                        <!-- Feather icon for user -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user w-6 h-6 text-gray-700">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <!-- Text for desktop only -->
                        <p class="auth-welcome-message text-gray-700 font-medium ml-2 hidden md:flex text-sm"><?php echo $welcome_text; ?></p>
                    </div>
                    <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li><a href="<?php echo esc_url(home_url('/dashboard/')); ?>">Dashboard</a></li>
                        <li><a href="<?php echo esc_url(home_url('/service/')); ?>">Service Control</a></li>
                        <li><a href="<?php echo esc_url(home_url('/profile/')); ?>">Profile</a></li>
                        <li><a href="<?php echo esc_url(home_url('/create-driver-job/')); ?>">Create Driver Job</a></li>
                        <li class="mt-2 border-t pt-2">
                            <a href="<?php echo esc_url(wp_logout_url(home_url())); ?>" class="text-red-500 hover:text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-log-out mr-2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                <?php echo esc_html($atts['logout_text']); ?>
                            </a>
                        </li>
                    </ul>
                </div>
            <?php else: ?>
                <div class="dropdown dropdown-end">
                    <div tabindex="0" role="button" class="auth-dashboard-button duration-200 cursor-pointer flex items-center">
                        <!-- Feather icon for user -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user w-4 h-4 text-gray-700">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <!-- Text for desktop only -->
                        <p class="auth-welcome-message text-gray-700 font-medium ml-2 hidden md:flex text-sm"><?php echo $welcome_text; ?></p>
                    </div>
                    <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li><a href="<?php if ($user_roles[0] == 'driver') {
                                            echo esc_url(home_url('/profile-driver/'));
                                        } else {
                                            echo esc_url(home_url('/profile/'));
                                        } ?>">Profile</a></li>
                        <li class="mt-2 border-t pt-2">
                            <a href="<?php echo esc_url(wp_logout_url(home_url())); ?>" class="text-red-500 hover:text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-log-out mr-2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                <?php echo esc_html($atts['logout_text']); ?>
                            </a>
                        </li>
                    </ul>
                </div>
            <?php endif; ?>

        </div>
    <?php
    } else {
    ?>
        <div class="auth-buttons-container flex items-center gap-3 md:gap-4" role="navigation" aria-label="<?php esc_attr_e('Account Actions', 'text-domain'); ?>">
            <a href="<?php echo esc_url(get_home_url() . '/login'); ?>"
                class="auth-login-button flex items-center p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                aria-label="<?php esc_attr_e('Login to your account', 'text-domain'); ?>">
                <!-- Feather icon for log-in -->
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-log-in w-5 h-5 md:w-4 md:h-4 text-gray-700 hover:text-gray-900 transition-colors duration-200">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                <!-- Text for desktop only -->
                <span class="ml-1 text-gray-700 hover:text-gray-900 transition-colors duration-200 hidden md:flex text-sm"><?php echo esc_html($atts['login_text']); ?></span>
            </a>
            <?php if (get_option('users_can_register')) : ?>
                <a href="<?php echo esc_url(get_home_url() . '/register'); ?>"
                    class="auth-register-button flex items-center p-2 px-4 rounded-full bg-primary bg-opacity-10 hover:bg-opacity-20 transition-colors duration-200"
                    aria-label="<?php esc_attr_e('Create a new account', 'text-domain'); ?>">
                    <!-- Feather icon for user-plus -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user-plus w-5 h-5 md:w-4 md:h-4 text-white hover:text-white-focus transition-colors duration-200">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    <!-- Text for desktop only -->
                    <span class="ml-1 text-white hover:text-white-focus transition-colors duration-200 hidden md:flex text-sm"><?php echo esc_html($atts['register_text']); ?></span>
                </a>
            <?php endif; ?>
        </div>
    <?php
    }

    return ob_get_clean();
}
add_shortcode('login_register_buttons', 'login_register_buttons_shortcode');

function my_booking_buttons_shortcode()
{
    ob_start(); // Start output buffering

    $parkcar_icon = get_template_directory_uri() . '/customize/img/parked-car.svg';
    $vehicle = get_template_directory_uri() . '/customize/img/vehicle.svg';
    // Your HTML goes here
    $carpark_url = 'carpark';
    $carrent_url = 'carrent';
    if (get_locale() != 'th') {
        $carpark_url = 'en/carpark';
        $carrent_url = 'en/carrent';
    }
    ?>
    <div class="button-container">
        <button id="bk-primary" class="booking-button primary-button" data-url="<?php echo $carpark_url; ?>">
            <img src="<?php echo $parkcar_icon; ?>" alt="<?php yp_text('จองที่จอดรถ', 'Parking Booking'); ?>">
            <?php yp_text('จองที่จอดรถ', 'Parking Booking'); ?>
        </button>
        <button id="bk-secondary" class="booking-button secondary-button" data-url="<?php echo $carrent_url; ?>">
            <img src="<?php echo $vehicle; ?>" alt="<?php yp_text('จองรถส่วนตัว', 'Transfer Booking'); ?>">
            <?php yp_text('จองรถส่วนตัว', 'Transfer Booking'); ?>
        </button>
    </div>
<?php

    return ob_get_clean(); // Return the buffered content
}
add_shortcode('booking_buttons', 'my_booking_buttons_shortcode');

function my_custom_loading_box()
{
?>
    <div id="box-loading" class="box-loading" style="display: none;">
        <div class="loader"></div>
        <div class="blur"></div>
    </div>
<?php
}
add_action('wp_footer', 'my_custom_loading_box');

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/vehicle_type', array(
        'methods' => 'GET',
        'callback' => 'get_custom_vehicle_type_data',
        'permission_callback' => '__return_true', // ให้ทุกคนเรียกดูได้ (เปลี่ยนตามความต้องการ)
    ));
});

function get_custom_vehicle_type_data($request)
{
    $lang = $request->get_param('lang') ?: 'en';

    $args = array(
        'post_type' => 'vehicle_type',
        'posts_per_page' => -1,
        'lang' => $lang,
        'post_status' => 'publish',
    );

    $query = new WP_Query($args);
    $data = [];

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            $data[] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'max_seats' => get_field('max_seats'),
                'pricing_rate' => get_field('pricing_rate'),
            );
        }
        wp_reset_postdata();
    }

    return rest_ensure_response($data);
}

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/parking_space', array(
        'methods' => 'GET',
        'callback' => 'get_parking_space_data',
        'permission_callback' => '__return_true', // ให้ทุกคนดูได้
        'args' => array(
            'location' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Filter parking spaces by location taxonomy',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'locate_id' => array(
                'required' => false,
                'type' => 'integer',
                'description' => 'Filter parking spaces by location ID',
                'sanitize_callback' => 'absint',
            ),
        ),
    ));
});

function get_parking_space_data($request)
{
    $args = array(
        'post_type' => 'parking_space',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'asc',
    );

    // Get the location parameter from the request
    $location = $request->get_param('location');
    $locate_id = $request->get_param('locate_id');

    // If location parameter is provided, filter by location taxonomy
    if (!empty($location)) {
        $args['tax_query'] = array(
            array(
                'taxonomy' => 'location',
                'field'    => 'slug',
                'terms'    => $location,
            ),
        );
    }
    if (!empty($locate_id)) {
        $args['tax_query'] = array(
            array(
                'taxonomy' => 'location',
                'field'    => 'id',
                'terms'    => $locate_id,
            ),
        );
    }
    $query = new WP_Query($args);
    $data = [];

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            $location_terms = get_the_terms(get_the_ID(), 'location');
            $location_name = !is_wp_error($location_terms) && !empty($location_terms) ? $location_terms[0]->name : '';
            $location_slug = !is_wp_error($location_terms) && !empty($location_terms) ? $location_terms[0]->slug : '';
            $location_id = !is_wp_error($location_terms) && !empty($location_terms) ? $location_terms[0]->term_id : '';

            $raw_position = get_field('position');
            $position_arr = is_array($raw_position) ? $raw_position : array();

            $data[] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'parking_id' => get_field('parking_id'),
                'location' => array(
                    'id' => $location_id,
                    'name' => $location_name,
                    'slug' => $location_slug
                ),
                'position' => array(
                    'x' => array_key_exists('position_x', $position_arr) ? $position_arr['position_x'] : null,
                    'y' => array_key_exists('position_y', $position_arr) ? $position_arr['position_y'] : null,
                ),
            );
        }
        wp_reset_postdata();
    }
    return rest_ensure_response($data);
}

// New endpoint to list taxonomy terms
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/taxonomy_terms/(?P<taxonomy>[a-zA-Z0-9_-]+)', array(
        'methods' => 'GET',
        'callback' => 'get_taxonomy_terms',
        'permission_callback' => '__return_true',
        'args' => array(
            'taxonomy' => array(
                'required' => true,
                'type' => 'string',
                'description' => 'The taxonomy to retrieve terms from',
            ),
        ),
    ));
});
function get_taxonomy_terms($request)
{
    $taxonomy = $request['taxonomy'];

    // Check if taxonomy exists
    if (!taxonomy_exists($taxonomy)) {
        return new WP_Error('invalid_taxonomy', 'Invalid taxonomy', array('status' => 404));
    }

    // Get terms
    $terms = get_terms(array(
        'taxonomy' => $taxonomy,
        'hide_empty' => false,
    ));

    if (is_wp_error($terms)) {
        return $terms;
    }

    // Format terms for response to match the expected format
    $formatted_terms = array();
    foreach ($terms as $term) {
        $formatted_terms[] = array(
            'id' => $term->term_id,
            'title' => $term->name,
        );
    }

    return rest_ensure_response($formatted_terms);
}



add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/parking_booking', array(
        'methods' => 'GET',
        'callback' => 'get_parking_booking_data',
        'permission_callback' => '__return_true',
    ));

    // User-specific parking bookings endpoint
    register_rest_route('custom/v1', '/user_parking_booking', array(
        'methods' => 'GET',
        'callback' => 'get_user_parking_booking_data',
        'permission_callback' => 'is_user_logged_in',
    ));
});

function get_parking_booking_data($request)
{
    $per_page = $request->get_param('per_page') ? (int) $request->get_param('per_page') : 100;

    $args = array(
        'post_type'      => 'parking_booking',
        'post_status'    => 'publish',
        'posts_per_page' => $per_page,
        'orderby'        => 'date',
        'order'          => 'DESC',
    );

    // Add search functionality
    if (! empty($request['search'])) {
        $args['s'] = sanitize_text_field($request['search']);
    }

    $query = new WP_Query($args);
    $data = [];

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            $vehicle_info = [];
            if (have_rows('vehicle_info')) {
                while (have_rows('vehicle_info')) {
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

            $customer_info = get_field('customer_info');
            $customer_user = get_field('customer_user');
            $booking_status = get_field('booking_status_relation');
            $tracking_check_status = get_field('tracking_check_status');
            $order_code = get_field('order_code');

            $location_data = null;
            $location = get_field('location_park');
            if ($location) {
                if (is_object($location)) {
                    $location_data = [
                        'id' => $location->term_id,
                        'name' => $location->name,
                        'slug' => $location->slug
                    ];
                } else {
                    $term = get_term($location, 'location'); // Replace 'location' with your taxonomy name
                    if ($term && !is_wp_error($term)) {
                        $location_data = [
                            'id' => $term->term_id,
                            'name' => $term->name,
                            'slug' => $term->slug
                        ];
                    }
                }
            }


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

            $data[] = array(
                'id' => get_the_ID(),
                'order_code' => $order_code,
                'qrcode_svg' => get_field('qrcode_svg'),
                'qr_code_url' => get_field('qr_code_url'),
                'title' => get_the_title(),
                'start_date' => get_field('start_date'),
                'start_time' => get_field('start_time'),
                'end_date'   => get_field('end_date'),
                'end_time'   => get_field('end_time'),
                'booking_status_relation' => $booking_status ? (is_object($booking_status) ? $booking_status->ID : $booking_status) : null,
                'tracking_check_status' => $tracking_check_status,
                'fullname_park' => get_field('fullname_park'),
                'email_park' => get_field('email_park'),
                'line_id_park' => get_field('line_id_park'),
                'phone_park' => get_field('phone_park'),
                'customer_info' => $customer_info,
                'customer_user' => $customer_user ? (is_object($customer_user) ? $customer_user->ID : $customer_user) : null,
                'vehicle_info'  => $vehicle_info,
                'location_park' => $location_data,
                'addon_information' => $addon_data,
            );
        }
        wp_reset_postdata();
    }

    return rest_ensure_response($data);
}

function get_user_parking_booking_data($request)
{
    $current_user_id = get_current_user_id();
    if (!$current_user_id) {
        return new WP_Error('not_logged_in', 'User must be logged in', array('status' => 401));
    }

    $per_page = $request->get_param('per_page') ? (int) $request->get_param('per_page') : 10;
    $page = $request->get_param('page') ? (int) $request->get_param('page') : 1;
    $status_filter = $request->get_param('status');

    $args = array(
        'post_type'      => 'parking_booking',
        'post_status'    => 'publish',
        'posts_per_page' => $per_page,
        'paged'          => $page,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'meta_query'     => array(
            array(
                'key'     => 'customer_user',
                'value'   => $current_user_id,
                'compare' => '='
            )
        )
    );

    // Add search functionality
    if (!empty($request['search'])) {
        $args['s'] = sanitize_text_field($request['search']);
    }

    // Add status filter
    if (!empty($status_filter)) {
        $args['meta_query'][] = array(
            'key'     => 'tracking_check_status',
            'value'   => $status_filter,
            'compare' => '='
        );
    }

    $query = new WP_Query($args);
    $data = [];

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            $vehicle_info = [];
            if (have_rows('vehicle_info')) {
                while (have_rows('vehicle_info')) {
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

            $customer_info = get_field('customer_info');
            $customer_user = get_field('customer_user');
            $booking_status = get_field('booking_status_relation');
            $tracking_check_status = get_field('tracking_check_status');
            $order_code = get_field('order_code');

            $location_data = null;
            $location = get_field('location_park');
            if ($location) {
                if (is_object($location)) {
                    $location_data = [
                        'id' => $location->term_id,
                        'name' => $location->name,
                        'slug' => $location->slug
                    ];
                } else {
                    $term = get_term($location, 'location');
                    if ($term && !is_wp_error($term)) {
                        $location_data = [
                            'id' => $term->term_id,
                            'name' => $term->name,
                            'slug' => $term->slug
                        ];
                    }
                }
            }

            $addon_information = get_field('addon_information');

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

            $data[] = array(
                'id' => get_the_ID(),
                'order_code' => $order_code,
                'qrcode_svg' => get_field('qrcode_svg'),
                'qr_code_url' => get_field('qr_code_url'),
                'title' => get_the_title(),
                'start_date' => get_field('start_date'),
                'start_time' => get_field('start_time'),
                'end_date'   => get_field('end_date'),
                'end_time'   => get_field('end_time'),
                'booking_status_relation' => $booking_status,
                'tracking_check_status' => $tracking_check_status,
                'fullname_park' => get_field('fullname_park'),
                'email_park' => get_field('email_park'),
                'line_id_park' => get_field('line_id_park'),
                'phone_park' => get_field('phone_park'),
                'customer_info' => $customer_info,
                'customer_user' => $customer_user ? (is_object($customer_user) ? $customer_user->ID : $customer_user) : null,
                'vehicle_info'  => $vehicle_info,
                'location_park' => $location_data,
                'addon_information' => $addon_data,
            );
        }
        wp_reset_postdata();
    }

    $response = array(
        'data' => $data,
        'total' => $query->found_posts,
        'pages' => $query->max_num_pages,
        'current_page' => $page,
        'per_page' => $per_page
    );

    return rest_ensure_response($response);
}

function enqueue_parking_scripts()
{
    $space_parking = get_template_directory() . '/customize/js/space-parking.js';
    $space_parking_version = filemtime($space_parking);

    wp_enqueue_script('space-parking-script', get_template_directory_uri() . '/customize/js/space-parking.js', array('jquery'), $space_parking_version, true);

    // ส่งค่า ajaxurl ไปยัง JS
    wp_localize_script('space-parking-script', 'ajaxurl_obj', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'line_oa_link' => get_field('line_oa_link', 'option') ?: 'https://lin.ee/Bm45y3b',
        'line_oa_id'   => get_field('line_oa_id', 'option') ?: '@parkingsystem'
    ));

    // Provide a nonce for parking price calculation AJAX
    wp_localize_script('space-parking-script', 'parking_nonce', array(
        'nonce' => wp_create_nonce('calculate_parking_price'),
    ));
}
add_action('wp_footer', 'enqueue_parking_scripts');

// AJAX endpoint for calculate_parking_price used by space-parking.js
add_action('wp_ajax_calculate_parking_price', 'ajax_calculate_parking_price');
add_action('wp_ajax_nopriv_calculate_parking_price', 'ajax_calculate_parking_price');
function ajax_calculate_parking_price()
{
    // Check nonce (returns 0/false if invalid)
    $valid = check_ajax_referer('calculate_parking_price', 'nonce', false);
    if (!$valid) {
        wp_send_json_error('Invalid nonce');
    }

    // Collect inputs
    $startDate = sanitize_text_field($_POST['startDate'] ?? '');
    $endDate = sanitize_text_field($_POST['endDate'] ?? '');
    $startTime = sanitize_text_field($_POST['startTime'] ?? '00:00');
    $endTime = sanitize_text_field($_POST['endTime'] ?? '23:59');
    $vehicleQuantities = array();
    if (!empty($_POST['vehicleQuantities'])) {
        $decoded = json_decode(stripslashes($_POST['vehicleQuantities']), true);
        if (is_array($decoded)) {
            $vehicleQuantities = $decoded;
        }
    }

    $data = array(
        'startDate' => $startDate,
        'endDate' => $endDate,
        'startTime' => $startTime,
        'endTime' => $endTime,
        'vehicleQuantities' => $vehicleQuantities,
    );

    $result = calculate_parking_price($data);
    if (isset($result['error'])) {
        wp_send_json_error($result['error']);
    }

    wp_send_json_success($result);
}

function wert4425()
{
    $args = [
        'post_type' => 'parking_booking',
        'posts_per_page' => -1,
        'post_status' => 'publish',
    ];

    $query = new WP_Query($args);

    // เก็บ start_date ทั้งหมดใน array
    $start_dates = [];

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            // ดึงค่า ACF field start_date และ end_date
            $start_date = get_field('start_date');
            $end_date = get_field('end_date');

            // เพิ่มลงใน array
            $start_dates[] = $start_date;

            // แสดงข้อมูลแต่ละรายการ
            echo '<div class="parking-booking-item">';
            echo '<h3>' . get_the_title() . '</h3>';
            echo '<p>Start Date: ' . $start_date . '</p>';
            echo '<p>End Date: ' . $end_date . '</p>';
            echo '<p>Post ID: ' . get_the_ID() . '</p>';
            echo '</div>';
        }

        // Reset post data หลังจาก custom query
        wp_reset_postdata();

        // แสดง start_date ทั้งหมดใน array
        echo '<h4>Start Dates ทั้งหมด:</h4>';
        echo '<pre>';
        print_r($start_dates);
        echo '</pre>';
    } else {
        echo 'ไม่พบข้อมูล parking booking';
    }
}
// add_action('init', 'wert4425');


function get_occupied_parking_spaces($start_datetime_str, $end_datetime_str, $locationChoose)
{
    // 1. ตรวจสอบค่าว่างของสตริงอินพุต
    if (empty($start_datetime_str)) {
        return ['error' => 'start_datetime_str is empty'];
    }
    if (empty($end_datetime_str)) {
        return ['error' => 'end_datetime_str is empty'];
    }
    if (empty($locationChoose)) {
        return ['error' => 'locationChoose is empty'];
    }

    // 2. แปลงสตริงอินพุตให้เป็น DateTime objects
    try {
        $start_dt = new DateTime($start_datetime_str);
        $end_dt = new DateTime($end_datetime_str);
    } catch (Exception $e) {
        return ['error' => 'Invalid date/time format for input parameters: ' . $e->getMessage()];
    }

    // ตรวจสอบความถูกต้องของ DateTime objects ที่สร้างได้
    if (!$start_dt || !$end_dt) { // ปกติแล้วถ้ามี Exception จะไม่ถึงตรงนี้ แต่มีไว้เพื่อความปลอดภัย
        return ['error' => 'Invalid date/time format after conversion.'];
    }

    $occupied_space_ids = [];

    // 3. สร้าง WP_Query เพื่อดึงข้อมูลการจอง (ส่วนนี้ยังคงเดิม)
    $args = [
        'post_type'      => 'parking_booking',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'meta_query'     => [
            [
                'key'     => 'location_park',
                'value'   => $locationChoose,
                'compare' => 'LIKE',
            ],
        ],
    ];
    $query = new WP_Query($args);

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            // 4. ดึงข้อมูลวันที่และเวลาของการจอง
            $booking_start_date = get_field('start_date'); // สมมติว่ารูปแบบคือ YYYY-MM-DD
            $booking_end_date   = get_field('end_date');   // สมมติว่ารูปแบบคือ YYYY-MM-DD
            $booking_start_time = get_field('start_time') ?: '00:00:00'; // สมมติว่ารูปแบบคือ HH:MM:SS
            $booking_end_time   = get_field('end_time') ?: '23:59:59';   // สมมติว่ารูปแบบคือ HH:MM:SS

            // 5. รวมวันที่และเวลาเพื่อสร้าง DateTime objects ของการจอง
            try {
                $booking_start_dt = new DateTime($booking_start_date . ' ' . $booking_start_time);
                $booking_end_dt   = new DateTime($booking_end_date . ' ' . $booking_end_time);
            } catch (Exception $e) {
                // หากแปลงไม่ได้ ให้ข้ามการจองนี้ไป
                error_log("Failed to parse booking date/time for post ID " . get_the_ID() . ": " . $e->getMessage());
                continue;
            }
            $real_start_dt = $booking_start_dt->format('Y-m-d H:i:s');
            $real_end_dt = $booking_end_dt->format('Y-m-d H:i:s');
            // $m_name = $start_dt ->format('Y-m-d H:i:s') . ' - ' . $end_dt->format('Y-m-d H:i:s');
            // $occupied_spaces[] = $real_start_dt . ' - ' . $real_end_dt;

            if ($booking_start_dt <= $end_dt && $booking_end_dt >= $start_dt) {
                // $occupied_spaces[] = get_the_ID(); // เก็บ ID ของโพสต์ที่มีการจองทับซ้อน
                $vehicle_info_rows = get_field('vehicle_info'); // ดึงข้อมูลจาก Repeater Field 'vehicle_info'

                if ($vehicle_info_rows) {
                    foreach ($vehicle_info_rows as $row) {
                        if (isset($row['booked_parking_space']) && is_object($row['booked_parking_space'])) {
                            $booked_parking_space_post = $row['booked_parking_space'];
                            $parking_space_id = $booked_parking_space_post->ID;
                            $occupied_space_ids[] = $parking_space_id;
                        }
                    }
                }
            }
        }

        wp_reset_postdata();
    }

    // 8. ลบ ID ที่ซ้ำกันและส่งคืนผลลัพธ์
    $occupied_space_ids = array_unique($occupied_space_ids);

    // ดึงข้อมูลรายละเอียดแต่ละช่องจอด
    $occupied_spaces = [];
    foreach ($occupied_space_ids as $space_id) {
        $parking_space_tax = get_the_terms($space_id, 'location');
        $position = get_field('position', $space_id);
        $occupied_spaces[] = [
            'id' => $space_id,
            'title' => get_the_title($space_id),
            'parking_id' => get_field('parking_id', $space_id),
            'position' => [
                'x' => $position['position_x'] ?? '',
                'y' => $position['position_y'] ?? '',
            ],
            'location_park_tax' => [
                'id' => $parking_space_tax[0]->term_id,
                'name' => $parking_space_tax[0]->name,
                'slug' => $parking_space_tax[0]->slug,
            ],
        ];
    }

    return $occupied_spaces;
}

add_action('wp_ajax_check_parking_availability', 'check_parking_availability');
add_action('wp_ajax_nopriv_check_parking_availability', 'check_parking_availability');
function check_parking_availability()
{
    // รับข้อมูลจาก AJAX
    $start_datetime = sanitize_text_field($_POST['startDateTime'] ?? '');
    $end_datetime = sanitize_text_field($_POST['endDateTime'] ?? '');
    $locationChoose = sanitize_text_field($_POST['locationChoose'] ?? '');

    if (empty($start_datetime) || empty($end_datetime)) {
        wp_send_json_error('กรุณาระบุวันที่และเวลาให้ครบถ้วน');
        return;
    }

    $blocked_check = okpark_check_parking_booking_blackout($start_datetime, $end_datetime);
    if (!empty($blocked_check['blocked'])) {
        wp_send_json_error($blocked_check['message'] ?? 'ช่วงวันที่เลือกไม่สามารถจองได้');
        return;
    }

    $result = get_occupied_parking_spaces($start_datetime, $end_datetime, $locationChoose);

    if (isset($result['error'])) {
        wp_send_json_error($result['error']);
    } else {
        wp_send_json_success($result);
    }
}

add_action('wp_ajax_insert_parking_booking', 'insert_parking_booking');
add_action('wp_ajax_nopriv_insert_parking_booking', 'insert_parking_booking');

add_action('wp_ajax_validate_coupon', 'validate_coupon');
add_action('wp_ajax_nopriv_validate_coupon', 'validate_coupon');

function validate_coupon()
{
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

        // Check product coupon type - must be for parking or empty (universal)
        $product_coupon_type = get_post_meta($coupon->get_id(), '_product_coupon', true);
        if (!empty($product_coupon_type) && $product_coupon_type !== 'parking') {
            wp_send_json_error('คูปองนี้ไม่สามารถใช้ได้กับบริการจอดรถ');
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

add_action('init', function () {
    $autoload = trailingslashit(WP_PLUGIN_DIR) . 'yp-qrcode/vendor/autoload.php';
    if (file_exists($autoload)) {
        require_once $autoload;
    } else {
        error_log('Composer autoload not found: ' . $autoload);
    }
});

// ========= 2) ฟังก์ชันสร้าง QR เป็น SVG ด้วย endroid/qr-code =========
function generate_booking_qr_code_png($booking_id, $order_code)
{
    // ensure autoload
    if (! class_exists('\Endroid\QrCode\Builder\Builder')) {
        $autoload = trailingslashit(WP_PLUGIN_DIR) . 'yp-qrcode/vendor/autoload.php';
        if (file_exists($autoload)) {
            require_once $autoload;
        } else {
            error_log('Composer autoload not found: ' . $autoload);
            return false;
        }
    }

    $booking_url = add_query_arg(
        [
            'id'   => (string) $booking_id,
            'code' => (string) $order_code,
        ],
        home_url('/check-in/')
    );

    $uploads = wp_upload_dir();
    if (! empty($uploads['error'])) {
        error_log('Uploads dir error: ' . $uploads['error']);
        return false;
    }
    $dir_path = trailingslashit($uploads['basedir']) . 'qr_codes';
    $dir_url  = trailingslashit($uploads['baseurl']) . 'qr_codes';
    if (! file_exists($dir_path) && ! wp_mkdir_p($dir_path)) {
        error_log('Failed to create dir: ' . $dir_path);
        return false;
    }

    $filename   = 'qr_' . sanitize_file_name((string) $order_code) . '.png';
    $file_path  = trailingslashit($dir_path) . $filename;
    $public_url = trailingslashit($dir_url) . $filename;

    try {
        $result = \Endroid\QrCode\Builder\Builder::create()
            ->writer(new \Endroid\QrCode\Writer\PngWriter())
            ->data($booking_url)
            ->size(300)
            ->margin(10)
            ->build();

        // Save the QR code to a file
        $result->saveToFile($file_path);
        @chmod($file_path, 0644);

        // Return the public URL of the QR code
        return $public_url;
    } catch (\Throwable $e) {
        error_log('QR PNG generation failed: ' . $e->getMessage());
        return false;
    }
}

function calculate_parking_price($booking_data)
{
    // Handle both old format (just days) and new format (booking data)
    if (is_numeric($booking_data)) {
        $days = $booking_data;
        $total_vehicles = 1;
    } else {
        // Calculate days from start and end dates
        if (empty($booking_data['startDate']) || empty($booking_data['endDate'])) {
            return ['error' => 'ข้อมูลวันที่ไม่ครบถ้วน'];
        }

        $start_date = new DateTime($booking_data['startDate'] . ' ' . $booking_data['startTime']);
        $end_date = new DateTime($booking_data['endDate'] . ' ' . $booking_data['endTime']);

        // หาส่วนต่างเป็นวินาทีรวม
        $total_seconds = $end_date->getTimestamp() - $start_date->getTimestamp();

        $days = 0;

        // ตรวจสอบว่ามีส่วนต่างเวลาหรือไม่
        if ($total_seconds > 0) {
            // แปลงวินาทีเป็นชั่วโมง (1 ชั่วโมง = 3600 วินาที)
            $total_hours = $total_seconds / 3600;

            // ใช้ ceil() ปัดเศษชั่วโมงขึ้นให้เป็นวัน
            // (หารด้วย 24 ชั่วโมง)
            $days = ceil($total_hours / 24);
        }

        // If same day booking, count as 1 day
        if ($days == 0) {
            $days = 1;
        }

        // Calculate total vehicles from vehicleTypeQuantities
        $total_vehicles = 0;
        if (!empty($booking_data['vehicleTypeQuantities'])) {
            foreach ($booking_data['vehicleTypeQuantities'] as $vehicle) {
                $total_vehicles += intval($vehicle['quantity'] ?? 0);
            }
        } else {
            $total_vehicles = 1; // fallback
        }
    }

    if ($days <= 0) {
        return is_numeric($booking_data) ? 0 : ['error' => 'จำนวนวันไม่ถูกต้อง'];
    }

    // ดึงราคาจาก ACF (Options Page)
    $price_1_day     = get_field('price_parking', 'option') ?: 100;
    $price_2_3_days  = get_field('price_2_3_days', 'option') ?: 90;
    $price_4_6_days  = get_field('price_4_6_days', 'option') ?: 80;
    $price_7_plus    = get_field('price_7_plus_days', 'option') ?: 70;

    switch (true) {
        case ($days == 1):
            $daily_price = $price_1_day;
            break;

        case ($days >= 2 && $days <= 3):
            $daily_price = $price_2_3_days;
            break;

        case ($days >= 4 && $days <= 6):
            $daily_price = $price_4_6_days;
            break;

        case ($days >= 7):
            $daily_price = $price_7_plus;
            break;

        default:
            $daily_price = $price_1_day; // fallback
            break;
    }

    $price_per_car = $daily_price * $days;
    $total_price = $price_per_car * $total_vehicles;

    // Return different formats based on input
    if (is_numeric($booking_data)) {
        return $total_price; // Backward compatibility
    } else {
        return [
            'start_date' => $booking_data['startDate'],
            'end_date' => $booking_data['endDate'],
            's_time' => $booking_data['startTime'],
            'e_time' => $booking_data['endTime'],
            'real_start_date' => $start_date,
            'real_end_date' => $end_date,
            'days' => $days,
            'total_vehicles' => $total_vehicles,
            'daily_price' => $daily_price,
            'price_per_car' => $price_per_car,
            'total_price' => $total_price
        ];
    }
}

function okpark_get_parking_booking_blackout_ranges()
{
    $ranges = get_field('parking_booking_blackout_ranges', 'option');
    if (!is_array($ranges)) {
        return [];
    }

    $normalized = [];
    foreach ($ranges as $row) {
        $start = isset($row['start_date']) ? sanitize_text_field($row['start_date']) : '';
        $end = isset($row['end_date']) ? sanitize_text_field($row['end_date']) : '';
        $message = isset($row['message']) ? sanitize_text_field($row['message']) : '';

        if (empty($start) || empty($end)) {
            continue;
        }

        $normalized[] = [
            'start_date' => $start,
            'end_date' => $end,
            'message' => $message,
        ];
    }

    return $normalized;
}

function okpark_check_parking_booking_blackout($start_datetime, $end_datetime)
{
    $ranges = okpark_get_parking_booking_blackout_ranges();
    if (empty($ranges)) {
        return ['blocked' => false];
    }

    try {
        $booking_start = new DateTime($start_datetime);
        $booking_end = new DateTime($end_datetime);
    } catch (Exception $e) {
        return ['blocked' => false];
    }

    if ($booking_end < $booking_start) {
        return ['blocked' => true, 'message' => 'ช่วงวันที่ไม่ถูกต้อง'];
    }

    foreach ($ranges as $range) {
        try {
            $blocked_start = new DateTime($range['start_date'] . ' 00:00:00');
            $blocked_end = new DateTime($range['end_date'] . ' 23:59:59');
        } catch (Exception $e) {
            continue;
        }

        $overlap = ($booking_start <= $blocked_end) && ($booking_end >= $blocked_start);
        if ($overlap) {
            $msg = !empty($range['message']) ? $range['message'] : 'ช่วงวันที่เลือกไม่สามารถจองได้';
            return [
                'blocked' => true,
                'message' => $msg,
                'range' => $range,
            ];
        }
    }

    return ['blocked' => false];
}

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/parking_booking_blackouts', array(
        'methods' => 'GET',
        'callback' => function () {
            return rest_ensure_response(okpark_get_parking_booking_blackout_ranges());
        },
        'permission_callback' => '__return_true',
    ));
});

function insert_parking_booking()
{
    if (empty($_POST['bookingData'])) {
        wp_send_json_error('ไม่มีข้อมูลที่ส่งมา');
    }

    $data = json_decode(stripslashes($_POST['bookingData']), true);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (empty($data['startDate']) || empty($data['endDate'])) {
        wp_send_json_error('ข้อมูลไม่ครบถ้วน');
    }

    $start_time = sanitize_text_field($data['startTime'] ?? '00:00');
    $end_time = sanitize_text_field($data['endTime'] ?? '23:59');
    $start_datetime = sanitize_text_field($data['startDate']) . ' ' . $start_time;
    $end_datetime = sanitize_text_field($data['endDate']) . ' ' . $end_time;
    $blocked_check = okpark_check_parking_booking_blackout($start_datetime, $end_datetime);
    if (!empty($blocked_check['blocked'])) {
        wp_send_json_error($blocked_check['message'] ?? 'ช่วงวันที่เลือกไม่สามารถจองได้');
    }

    // Calculate pricing using the updated function
    $pricing_result = calculate_parking_price($data);
    if (isset($pricing_result['error'])) {
        wp_send_json_error($pricing_result['error']);
    }

    // Update data with calculated prices if not already provided
    if (empty($data['pricePerCar'])) {
        $data['pricePerCar'] = $pricing_result['price_per_car'];
    }
    if (empty($data['totalPrice'])) {
        $data['totalPrice'] = $pricing_result['total_price'];
    }

    $profile = $data['profile'];

    // Generate a 6-digit order code
    $order_code = mt_rand(100000, 999999);

    // สร้าง post ใหม่
    $post_id = wp_insert_post([
        'post_type'   => 'parking_booking',
        'post_status' => 'publish',
        'post_title'  => 'Booking ' . ($data['startDate'] ?? '') . ' - ' . ($data['endDate'] ?? '') . ' - ' . ($profile['fullname'] ?? '') . ' #' . $order_code,
    ]);

    if (is_wp_error($post_id) || !$post_id) {
        wp_send_json_error('ไม่สามารถสร้างโพสต์ได้');
    }

    // Save the order code to an ACF field
    update_field('order_code', $order_code, $post_id);

    $qr = generate_booking_qr_code_png($post_id, $order_code);

    // Save ACF ถ้าสำเร็จ
    update_field('qr_code_url', esc_url_raw($qr), $post_id);

    // บันทึกฟิลด์ ACF หลัก
    update_field('start_date', $data['startDate'], $post_id);
    update_field('end_date', $data['endDate'], $post_id);

    // บันทึกข้อมูลโปรไฟล์
    update_field('location_park', $data['location'], $post_id);
    update_field('tracking_check_status', 'pending', $post_id);

    update_field('fullname_park', sanitize_text_field($profile['fullname'] ?? ''), $post_id);
    update_field('email_park', sanitize_email($profile['email'] ?? ''), $post_id);
    update_field('phone_park', sanitize_text_field($profile['phone'] ?? ''), $post_id);
    update_field('line_id_park', sanitize_text_field($profile['lineid'] ?? ''), $post_id);

    update_field('start_time', $data['startTime'] ?? '', $post_id);
    update_field('end_time', $data['endTime'] ?? '', $post_id);
    update_field('booking_status_relation', 1244, $post_id);
    update_field('price_percar', $data['pricePerCar'] ?? '', $post_id);
    update_field('cp_price', $data['totalPrice'] ?? '', $post_id);

    // Update customer_user if user is logged in
    if (is_user_logged_in()) {
        update_field('customer_user', get_current_user_id(), $post_id);
    }

    // ตัวอย่าง: บันทึกข้อมูลลูกค้า (กรณีไม่ได้เป็นสมาชิก)
    if (!empty($data['customer_name']) && !empty($data['customer_phone'])) {
        update_field('customer_info', [
            'customer_name'  => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],
            'customer_email' => $data['customer_email'] ?? '',
        ], $post_id);
    }

    // ตัวอย่าง: บันทึกข้อมูลลูกค้า (กรณีเป็นสมาชิก)
    if (!empty($data['customer_user'])) {
        update_field('customer_user', get_current_user_id(), $post_id); // เก็บเป็น id ของ current user
    }

    // บันทึก vehicle_type_info (repeater) 
    if (!empty($data['vehicleTypeQuantities'])) {
        $vehicle_type_info = [];
        foreach ($data['vehicleTypeQuantities'] as $vehicle) {
            $vehicle_type_info[] = [
                'quantity_cp' => intval($vehicle['quantity'] ?? 0),
                'tp_car'      => sanitize_text_field($vehicle['type'] ?? ''),
            ];
        }
        update_field('vehicle_type_info', $vehicle_type_info, $post_id);
    }

    // บันทึก vehicle_info (repeater) สำหรับข้อมูลรถแต่ละคัน
    if (!empty($data['selectedParkingSpaces'])) {
        $vehicle_info = [];
        foreach ($data['selectedParkingSpaces'] as $i => $space) {
            $vehicle_info[] = [
                'vehicle_type_relation' => $space['assignedVehicleType'], // ต้องเป็น post ID ของ vehicle_type
                'license_plate'         => $space['licensePlate'] ?? '',
                'other_type_car'        => $space['otherTypeCar'] ?? '',
                'booked_parking_space'  => $space['parking_post_id'] ?? '', // ต้องเป็น post ID ของ parking_space
                'zone_parking'          => $space['zone_parking'] ?? '',   // ต้องเป็น post ID ของ parking_zone
                'parking_slot'          => $space['id'] ?? '',
                'parking_slot_id'       => $space['parking_id'] ?? '',
            ];

            // Create tabien-rod post for each vehicle with license plate
            if (!empty($space['licensePlate'])) {
                // Check if a tabien-rod post with the same license plate already exists for the same user
                $existing_tabien = get_posts([
                    'post_type' => 'tabien-rod',
                    'post_status' => 'publish',
                    'meta_query' => [
                        [
                            'key' => 'tabienrod_number',
                            'value' => $space['licensePlate'],
                            'compare' => '='
                        ],
                        [
                            'key' => 'user-okpark',
                            'value' => get_current_user_id(),
                            'compare' => '='
                        ]
                    ],
                    'numberposts' => 1
                ]);

                // Only create new post if no duplicate exists
                if (empty($existing_tabien)) {
                    // Create new tabien-rod post
                    $tabien_post_id = wp_insert_post([
                        'post_type'   => 'tabien-rod',
                        'post_status' => 'publish',
                        'post_title'  => 'ทะเบียนรถ: ' . $space['licensePlate'] . ' - ' . $profile['fullname'],
                    ]);

                    // If post created successfully, save ACF fields
                    if ($tabien_post_id && !is_wp_error($tabien_post_id)) {
                        update_field('tabienrod_number', sanitize_text_field($space['licensePlate']), $tabien_post_id);
                        update_field('user-okpark', get_current_user_id(), $tabien_post_id);
                    }
                }
            }
        }
        update_field('vehicle_info', $vehicle_info, $post_id);
    }

    // --- บันทึกบริการเสริม (addon_information) ---
    if (!empty($data['addon'])) {
        $addon = $data['addon'];
        update_field('addon_information', [
            'service_pickup' => !empty($addon['servicePickup']),
            'service_valet' => !empty($addon['serviceValet']),
            'sending_flight' => [
                'depart'        => $addon['sending']['flightDepart'] ?? '',
                'depart_time'   => $addon['sending']['flightDepartTime'] ?? '',
                'arrival'       => $addon['sending']['flightArrival'] ?? '',
                'arrival_time'  => $addon['sending']['flightArrivalTime'] ?? '',
                'pickup_time'   => $addon['sending']['pickupTime'] ?? '',
                'dropoff_time'  => $addon['sending']['dropoffTime'] ?? '',
                'pickup_point'  => $addon['sending']['pickupPoint'] ?? '',
                'dropoff_point' => $addon['sending']['dropoffPoint'] ?? '',
                'adult_count'   => $addon['sending']['adultCount'] ?? '',
                'child_count'   => $addon['sending']['childCount'] ?? '',
                'baggage_count' => $addon['sending']['baggageCount'] ?? '',
                'pickup_note'   => $addon['sending']['pickupNote'] ?? '',
            ],
            'parking_car' => [
                'depart'        => $addon['parking']['flightDepart'] ?? '',
                'depart_time'   => $addon['parking']['flightDepartTime'] ?? '',
                'arrival'       => $addon['parking']['flightArrival'] ?? '',
                'arrival_time'  => $addon['parking']['flightArrivalTime'] ?? '',
                'pickup_time'   => $addon['parking']['pickupTime'] ?? '',
                'dropoff_time'  => $addon['parking']['dropoffTime'] ?? '',
                'pickup_point'  => $addon['parking']['pickupPoint'] ?? '',
                'dropoff_point' => $addon['parking']['dropoffPoint'] ?? '',
                'pickup_note'   => $addon['parking']['pickupNote'] ?? '',
            ],
        ], $post_id);
    }

    // Check if user is logged in and save data
    if (is_user_logged_in()) {
        $current_user_id = get_current_user_id();

        // Save fullname to user_display user meta
        if (!empty($profile['fullname'])) {
            wp_update_user([
                'ID'           => $current_user_id,
                'display_name' => $profile['fullname'],
            ]);
        }

        // Save email to billing_email user meta
        if (!empty($profile['email'])) {
            update_user_meta($current_user_id, 'billing_email', sanitize_email($profile['email']));
        }

        // Save phone to billing_phone user meta
        if (!empty($profile['phone'])) {
            update_user_meta($current_user_id, 'billing_phone', sanitize_text_field($profile['phone']));
        }

        // Save lineId to ACF user field with key 'line_id_user'
        if (!empty($profile['lineid'])) {
            if (function_exists('update_field')) {
                update_field('line_id_user', $profile['lineid'], 'user_' . $current_user_id);
            }
        }
    }    // Create WooCommerce order
    $wc_order_id = null;
    $checkout_url = null;

    if (defined('FLUFFY_DEMO_SKIP_PAYMENT') && FLUFFY_DEMO_SKIP_PAYMENT) {
        update_field('tracking_check_status', 'confirmed', $post_id);
        $thank_url = add_query_arg(
            array(
                'order_code' => $order_code,
                'email'      => sanitize_email($profile['email'] ?? ''),
            ),
            home_url('/thank/')
        );
        wp_send_json_success(array(
            'post_id'      => $post_id,
            'order_code'   => $order_code,
            'checkout_url' => $thank_url,
            'redirect_url' => $thank_url,
            'demo_mode'    => true,
        ));
        return;
    }

    if (class_exists('WooCommerce')) {
        try {
            // Create WooCommerce order
            $order = wc_create_order();

            // Add parking booking as a product
            $product_name = 'การจองที่จอดรถ - ' . $order_code;
            if (get_locale() != 'th') {
                $product_name = 'Parking Booking - ' . $order_code;
            }
            $product_price = floatval($data['totalPrice'] ?? 0);

            // Create a simple product for this booking
            $item_id = $order->add_product(
                null, // No existing product
                1, // Quantity
                array(
                    'name' => $product_name,
                    'total' => $product_price
                )
            );

            // Set order details
            $order->set_address(array(
                'first_name' => $profile['fullname'] ?? '',
                'email'      => $profile['email'] ?? '',
                'phone'      => $profile['phone'] ?? ''
            ), 'billing');

            // Add order meta data
            $order->add_meta_data('parking_booking_id', $post_id);
            $order->add_meta_data('parking_order_code', $order_code);
            $order->add_meta_data('parking_start_date', $data['startDate'] ?? '');
            $order->add_meta_data('parking_end_date', $data['endDate'] ?? '');

            // Add booking URL for easy access
            $booking_url = admin_url('post.php?post=' . $post_id . '&action=edit&classic-editor');
            if ($booking_url) {
                $order->add_meta_data('parking_booking_url', $booking_url);
            }

            // Add QR code URL if available
            if (!empty($qr)) {
                $order->add_meta_data('parking_qr_code_url', $qr);
            }

            // Apply coupon if provided - reduce order total directly
            $discount_amount = 0.0;
            if (!empty($data['coupon_code'])) {
                $coupon_code = sanitize_text_field($data['coupon_code']);
                try {
                    $coupon = new WC_Coupon($coupon_code);

                    // Check product coupon type - must be for parking or empty (universal)
                    // $product_coupon_type = get_post_meta($coupon->get_id(), '_product_coupon', true);
                    // if (!empty($product_coupon_type) && $product_coupon_type !== 'parking') {
                    //     continue; // Skip applying invalid coupon
                    // }

                    if ($coupon->is_valid()) {
                        $order_subtotal = floatval($product_price);

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

            // Update parking booking with WooCommerce order ID
            update_field('woocommerce_order_id', $wc_order_id, $post_id);

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
        'message' => 'บันทึกสำเร็จ',
        'post_id' => $post_id,
        'order_code' => $order_code,
        'qr_code_url' => esc_url_raw($qr),
        'input_data' => $data
    ];

    // Add WooCommerce data if order was created
    if ($wc_order_id && $checkout_url) {
        $response_data['woocommerce_order_id'] = $wc_order_id;
        $response_data['checkout_url'] = $checkout_url;
        $response_data['redirect_to_checkout'] = true;
    }

    wp_send_json_success($response_data);
}

// ========= WooCommerce Order Hooks for Parking Booking =========

// Hook to update parking booking status when WooCommerce order is completed
// add_action('woocommerce_order_status_completed', 'update_parking_booking_on_order_complete');
add_action('woocommerce_order_status_processing', 'update_parking_booking_on_order_complete');

// Hook to redirect after payment completion for parking
add_action('woocommerce_thankyou', 'parking_redirect_after_payment', 10, 1);

function update_parking_booking_on_order_complete($order_id)
{
    $order = wc_get_order($order_id);
    if (!$order) return;

    // Get parking booking ID from order meta
    $parking_booking_id = $order->get_meta('parking_booking_id');

    if ($parking_booking_id) {
        // Update parking booking status to confirmed/paid
        update_field('payment_status', 'paid', $parking_booking_id);
        update_field('booking_status', 'confirmed', $parking_booking_id);
        update_field('tracking_check_status', 'confirmed', $parking_booking_id);
        update_field('parking_woo_id', $order_id, $parking_booking_id);
        // Add payment completion timestamp
        update_field('payment_completed_at', current_time('mysql'), $parking_booking_id);

        // Add order completion note
        $order_code = $order->get_meta('parking_order_code');
        $note = "การชำระเงินเสร็จสิ้น - WooCommerce Order ID: {$order_id}";
        if ($order_code) {
            $note .= " - Order Code: {$order_code}";
        }

        // Add note to parking booking post
        $comment_data = array(
            'comment_post_ID' => $parking_booking_id,
            'comment_content' => $note,
            'comment_type' => 'parking_note',
            'comment_approved' => 1,
            'user_id' => 0
        );
        wp_insert_comment($comment_data);

        // Send confirmation email if needed
        send_parking_confirmation_email($parking_booking_id, $order_id);

        // Redirect to thank you page after payment completion
        $customer_email = '';

        // Try to get customer email from multiple sources
        // 1. From WooCommerce order billing email
        $customer_email = $order->get_billing_email();

        // 2. If not found, try from parking booking ACF fields
        if (empty($customer_email)) {
            $profile_data = get_field('email_park', $parking_booking_id);
            if ($profile_data) {
                $customer_email = $profile_data;
            }
        }

        // 3. If still not found, try from order meta
        if (empty($customer_email)) {
            $booking_data = $order->get_meta('parking_booking_data');
            if ($booking_data) {
                if (is_string($booking_data)) {
                    $booking_data = json_decode($booking_data, true);
                }
                if (isset($booking_data['profile']['email'])) {
                    $customer_email = $booking_data['profile']['email'];
                }
            }
        }

        $thank_you_url = home_url('/thank-you/');
        $thank_you_url = add_query_arg([
            'order_code' => $order_code,
            'email' => $customer_email
        ], $thank_you_url);

        // Store redirect URL in session or transient for later use
        set_transient('parking_payment_redirect_' . $order_id, $thank_you_url, 300); // 5 minutes
    }
}

// Function to send parking confirmation email after payment
function send_parking_confirmation_email($parking_booking_id, $order_id)
{
    $order = wc_get_order($order_id);
    if (!$order) {
        error_log("WooCommerce order not found for ID: $order_id");
        return;
    }

    // Get order code
    $order_code = $order->get_meta('parking_order_code');
    if (!$order_code) {
        error_log("No parking order code found for order: $order_id");
        return;
    }

    // Try to reconstruct booking data from ACF fields
    $booking_data = array();

    // Get profile information
    $profile_data = get_field('profile_information', $parking_booking_id);
    if (!$profile_data) {
        // Fallback: construct from individual fields
        $profile_data = array(
            'fullname' => get_field('fullname_park', $parking_booking_id),
            'email' => get_field('email_park', $parking_booking_id),
            'phone' => get_field('phone_park', $parking_booking_id),
            'lineid' => get_field('line_id_park', $parking_booking_id)
        );
    }

    // Check if we have customer email
    if (empty($profile_data['email'])) {
        // Try to get email from WooCommerce order
        $customer_email = $order->get_billing_email();
        if (!empty($customer_email)) {
            $profile_data['email'] = $customer_email;
        } else {
            error_log("No customer email found for parking booking order: $order_code");
            return;
        }
    }

    $booking_data['profile'] = $profile_data;
    $booking_data['startDate'] = get_field('start_date', $parking_booking_id);
    $booking_data['endDate'] = get_field('end_date', $parking_booking_id);
    $booking_data['startTime'] = get_field('start_time', $parking_booking_id);
    $booking_data['endTime'] = get_field('end_time', $parking_booking_id);
    $booking_data['location'] = get_field('location_park', $parking_booking_id);

    // Get vehicle information
    $vehicle_info = get_field('vehicle_info', $parking_booking_id);
    if ($vehicle_info) {
        $booking_data['selectedParkingSpaces'] = array();
        foreach ($vehicle_info as $vehicle) {
            $booking_data['selectedParkingSpaces'][] = array(
                'licensePlate' => $vehicle['license_plate'] ?? '',
                'otherTypeCar' => $vehicle['other_type_car'] ?? '',
                'parking_post_id' => $vehicle['booked_parking_space'] ?? '',
                'parking_id' => $vehicle['parking_slot_id'] ?? '',
                'id' => $vehicle['parking_slot'] ?? ''
            );
        }
    }

    // Get addon information
    $addon_info = get_field('addon_information', $parking_booking_id);
    if ($addon_info) {
        $booking_data['addon'] = array(
            'servicePickup' => !empty($addon_info['service_pickup']),
            'serviceValet' => !empty($addon_info['service_valet']),
            'sending' => array(
                'flightDepart' => $addon_info['sending_flight']['depart'] ?? '',
                'flightDepartTime' => $addon_info['sending_flight']['depart_time'] ?? '',
                'flightArrival' => $addon_info['sending_flight']['arrival'] ?? '',
                'flightArrivalTime' => $addon_info['sending_flight']['arrival_time'] ?? '',
                'pickupTime' => $addon_info['sending_flight']['pickup_time'] ?? '',
                'dropoffTime' => $addon_info['sending_flight']['dropoff_time'] ?? '',
                'pickupPoint' => $addon_info['sending_flight']['pickup_point'] ?? '',
                'dropoffPoint' => $addon_info['sending_flight']['dropoff_point'] ?? '',
                'adultCount' => $addon_info['sending_flight']['adult_count'] ?? '',
                'childCount' => $addon_info['sending_flight']['child_count'] ?? '',
                'baggageCount' => $addon_info['sending_flight']['baggage_count'] ?? '',
                'pickupNote' => $addon_info['sending_flight']['pickup_note'] ?? ''
            ),
            'parking' => array(
                'flightDepart' => $addon_info['parking_car']['depart'] ?? '',
                'flightDepartTime' => $addon_info['parking_car']['depart_time'] ?? '',
                'flightArrival' => $addon_info['parking_car']['arrival'] ?? '',
                'flightArrivalTime' => $addon_info['parking_car']['arrival_time'] ?? '',
                'pickupTime' => $addon_info['parking_car']['pickup_time'] ?? '',
                'dropoffTime' => $addon_info['parking_car']['dropoff_time'] ?? '',
                'pickupPoint' => $addon_info['parking_car']['pickup_point'] ?? '',
                'dropoffPoint' => $addon_info['parking_car']['dropoff_point'] ?? '',
                'pickupNote' => $addon_info['parking_car']['pickup_note'] ?? ''
            )
        );
    }

    // Use the beautiful email template function
    generate_parking_booking_email_template($booking_data, $order_code, $parking_booking_id, $profile_data['email']);

    error_log("Parking confirmation email sent for order: $order_code to: " . $profile_data['email']);
}

// Function to handle redirect after payment completion for parking
function parking_redirect_after_payment($order_id)
{
    if (!$order_id) return;

    $order = wc_get_order($order_id);
    if (!$order) return;

    // Check if this is a parking booking order
    $parking_booking_id = $order->get_meta('parking_booking_id');

    if ($parking_booking_id) {
        // Get redirect URL from transient
        $redirect_url = get_transient('parking_payment_redirect_' . $order_id);

        if ($redirect_url) {
            // Clean up transient
            delete_transient('parking_payment_redirect_' . $order_id);

            // Redirect using JavaScript since we're in a hook
            echo '<script type="text/javascript">
                    window.location.href = "' . esc_url($redirect_url) . '";
            </script>';
        } else {
            // Fallback redirect if transient is not available
            $order_code = $order->get_meta('parking_order_code');

            // Get customer email
            $customer_email = get_field('email_park', $parking_booking_id);

            // If still empty, try customer_info field
            if (empty($customer_email)) {
                $customer_info = get_field('customer_info', $parking_booking_id);
                if ($customer_info && isset($customer_info['email'])) {
                    $customer_email = $customer_info['email'];
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

// Add custom columns to WooCommerce orders admin page
add_filter('manage_edit-shop_order_columns', 'add_parking_booking_columns');
function add_parking_booking_columns($columns)
{
    $new_columns = array();

    foreach ($columns as $key => $column) {
        $new_columns[$key] = $column;

        // Add parking columns after order status
        if ($key === 'order_status') {
            $new_columns['parking_booking_id'] = 'Booking ID';
            $new_columns['parking_order_code'] = 'Order Code';
        }
    }

    return $new_columns;
}

// Populate custom columns with data
add_action('manage_shop_order_posts_custom_column', 'populate_parking_booking_columns', 10, 2);
function populate_parking_booking_columns($column, $post_id)
{
    $order = wc_get_order($post_id);
    if (!$order) return;

    switch ($column) {
        case 'parking_booking_id':
            $booking_id = $order->get_meta('parking_booking_id');
            if ($booking_id) {
                $booking_url = $order->get_meta('parking_booking_url');
                if ($booking_url) {
                    echo '<a href="' . esc_url($booking_url) . '" target="_blank">' . esc_html($booking_id) . '</a>';
                } else {
                    echo esc_html($booking_id);
                }
            } else {
                echo '-';
            }
            break;

        case 'parking_order_code':
            $order_code = $order->get_meta('parking_order_code');
            echo $order_code ? esc_html($order_code) : '-';
            break;
    }
}

// Add parking booking details to order admin page
add_action('woocommerce_admin_order_data_after_billing_address', 'display_parking_booking_details_in_admin');
function display_parking_booking_details_in_admin($order)
{
    $booking_id = $order->get_meta('parking_booking_id');
    $order_code = $order->get_meta('parking_order_code');
    $booking_url = $order->get_meta('parking_booking_url');
    $qr_code_url = $order->get_meta('parking_qr_code_url');

    if ($booking_id || $order_code) {
        echo '<div class="address">';
        echo '<p><strong>ข้อมูลการจองที่จอดรถ:</strong></p>';

        if ($booking_id) {
            echo '<p><strong>Booking ID:</strong> ';
            if ($booking_url) {
                echo '<a href="' . esc_url($booking_url) . '" target="_blank">' . esc_html($booking_id) . '</a>';
            } else {
                echo esc_html($booking_id);
            }
            echo '</p>';
        }

        if ($order_code) {
            echo '<p><strong>Order Code:</strong> ' . esc_html($order_code) . '</p>';
        }

        if ($qr_code_url) {
            echo '<p><strong>QR Code:</strong> <br><img src="' . esc_url($qr_code_url) . '" alt="QR Code" style="max-width: 150px; height: auto;"></p>';
        }

        echo '</div>';
    }
}

// ========= Parking Booking Email Template =========

function generate_parking_booking_email_template($booking_data, $order_code, $post_id, $customer_email = null)
{
    $site_name = get_bloginfo('name');
    $site_url = get_bloginfo('url');
    $admin_email = get_option('admin_email');

    // Extract customer information
    $full_name = isset($booking_data['profile']['fullname']) ? esc_html($booking_data['profile']['fullname']) : '';
    $email = isset($booking_data['profile']['email']) ? esc_html($booking_data['profile']['email']) : '';
    $phone = isset($booking_data['profile']['phone']) ? esc_html($booking_data['profile']['phone']) : '';
    $line_id = isset($booking_data['profile']['lineid']) ? esc_html($booking_data['profile']['lineid']) : '';

    // Extract booking dates and times
    $start_date = isset($booking_data['startDate']) ? esc_html($booking_data['startDate']) : '';
    $start_time = isset($booking_data['startTime']) ? esc_html($booking_data['startTime']) : '';
    $end_date = isset($booking_data['endDate']) ? esc_html($booking_data['endDate']) : '';
    $end_time = isset($booking_data['endTime']) ? esc_html($booking_data['endTime']) : '';

    // Extract location information
    $location_name = '';
    if (!empty($booking_data['location'])) {
        $location_term = get_term($booking_data['location'], 'location');
        if ($location_term && !is_wp_error($location_term)) {
            $location_name = $location_term->name;
        }
    }

    // Extract addon information
    $service_pickup = isset($booking_data['addon']['servicePickup']) ? $booking_data['addon']['servicePickup'] : false;
    $service_valet = isset($booking_data['addon']['serviceValet']) ? $booking_data['addon']['serviceValet'] : false;

    // Sending flight information
    $sending_depart = isset($booking_data['addon']['sending']['flightDepart']) ? esc_html($booking_data['addon']['sending']['flightDepart']) : '';
    $sending_depart_time = isset($booking_data['addon']['sending']['flightDepartTime']) ? esc_html($booking_data['addon']['sending']['flightDepartTime']) : '';
    $sending_arrival = isset($booking_data['addon']['sending']['flightArrival']) ? esc_html($booking_data['addon']['sending']['flightArrival']) : '';
    $sending_arrival_time = isset($booking_data['addon']['sending']['flightArrivalTime']) ? esc_html($booking_data['addon']['sending']['flightArrivalTime']) : '';
    $sending_pickup_time = isset($booking_data['addon']['sending']['pickupTime']) ? esc_html($booking_data['addon']['sending']['pickupTime']) : '';
    $sending_dropoff_time = isset($booking_data['addon']['sending']['dropoffTime']) ? esc_html($booking_data['addon']['sending']['dropoffTime']) : '';
    $sending_pickup_point = isset($booking_data['addon']['sending']['pickupPoint']) ? esc_html($booking_data['addon']['sending']['pickupPoint']) : '';
    $sending_dropoff_point = isset($booking_data['addon']['sending']['dropoffPoint']) ? esc_html($booking_data['addon']['sending']['dropoffPoint']) : '';
    $sending_adult_count = isset($booking_data['addon']['sending']['adultCount']) ? esc_html($booking_data['addon']['sending']['adultCount']) : '';
    $sending_child_count = isset($booking_data['addon']['sending']['childCount']) ? esc_html($booking_data['addon']['sending']['childCount']) : '';
    $sending_baggage_count = isset($booking_data['addon']['sending']['baggageCount']) ? esc_html($booking_data['addon']['sending']['baggageCount']) : '';
    $sending_pickup_note = isset($booking_data['addon']['sending']['pickupNote']) ? esc_html($booking_data['addon']['sending']['pickupNote']) : '';

    // Parking car information
    $parking_depart = isset($booking_data['addon']['parking']['flightDepart']) ? esc_html($booking_data['addon']['parking']['flightDepart']) : '';
    $parking_depart_time = isset($booking_data['addon']['parking']['flightDepartTime']) ? esc_html($booking_data['addon']['parking']['flightDepartTime']) : '';
    $parking_arrival = isset($booking_data['addon']['parking']['flightArrival']) ? esc_html($booking_data['addon']['parking']['flightArrival']) : '';
    $parking_arrival_time = isset($booking_data['addon']['parking']['flightArrivalTime']) ? esc_html($booking_data['addon']['parking']['flightArrivalTime']) : '';
    $parking_pickup_time = isset($booking_data['addon']['parking']['pickupTime']) ? esc_html($booking_data['addon']['parking']['pickupTime']) : '';
    $parking_dropoff_time = isset($booking_data['addon']['parking']['dropoffTime']) ? esc_html($booking_data['addon']['parking']['dropoffTime']) : '';
    $parking_pickup_point = isset($booking_data['addon']['parking']['pickupPoint']) ? esc_html($booking_data['addon']['parking']['pickupPoint']) : '';
    $parking_dropoff_point = isset($booking_data['addon']['parking']['dropoffPoint']) ? esc_html($booking_data['addon']['parking']['dropoffPoint']) : '';
    $parking_pickup_note = isset($booking_data['addon']['parking']['pickupNote']) ? esc_html($booking_data['addon']['parking']['pickupNote']) : '';

    $html = '<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>Booking Confirmation</title>
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
                  <td class="text-center-sm" style="font-weight:bold; font-size:20px;color:#ffffff">' . $site_name . '</td>
                  <td align="right" class="text-center-sm">Parking and Shuttle</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
           <tr>
            <td align="left" class="px-24 py-32" style="padding:28px 24px;">
              <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
              <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Dear ' . $full_name . ',</div>
              <div style="font-size:13px; color:#666;">
              Parking System is pleased to confirm that your payment for booking number ' . $order_code . '<BR>has been successfully verified, and your reservation is now complete.
              </div>
            </td>
          </tr>


        <tr>
             <td>
                <div style="margin-bottom:25px; text-align:center;">
                    <div style="font-weight:bold; color:#111; margin-bottom:10px;">QR Code for entry and exit</div>
                        <div style="display:inline-block; padding:15px; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <img style="width:200px; height:200px;" alt="QR Code" src="' . esc_url_raw(get_field('qr_code_url', $post_id)) . '">
                        </div>
                    <div style="font-size:12px; color:#666; margin-top:8px;">Please show this QR Code at the entry and exit points</div>
                </div>
             </td>
         </tr>
        


          <!-- Order summary -->
          <tr>
            <td class="px-24" style="padding:0 24px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb; border-radius:6px;">
                <tr>
                  <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Your Information</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Full Name</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $full_name . '</td>
                </tr>
                    <tr>
                  <td style="padding:12px 16px; color:#666;">Phone Number</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $phone . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Email</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $email . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Line ID / WhatsApp</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $line_id . '</td>
                </tr>
                ';
    $html .= '</table>
            </td>
          </tr>



          <!-- Reservation Details -->
          <tr>
            <td class="px-24" style="padding:0 24px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb; border-radius:6px;">
                <tr>
                  <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Reservation Details</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Booking ID</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $order_code . '</td>
                </tr>
                    <tr>
                  <td style="padding:12px 16px; color:#666;">Parking Location</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $location_name . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">Start Date</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $start_date . ' ' . $start_time . '</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; color:#666;">End Date</td>
                  <td align="right" style="padding:12px 16px; color:#111;">' . $end_date . ' ' . $end_time . '</td>
                </tr>';



    // Vehicle information section
    if (!empty($booking_data['selectedParkingSpaces']) && is_array($booking_data['selectedParkingSpaces'])) {
        $html .= '
                        <!-- Vehicle Information -->
                        <tr>
                            <td style="padding:12px 16px; color:#666;">
                                    ';
        foreach ($booking_data['selectedParkingSpaces'] as $index => $space) {
            $license_plate = isset($space['licensePlate']) ? esc_html($space['licensePlate']) : '';
            $other_type_car = isset($space['otherTypeCar']) ? esc_html($space['otherTypeCar']) : '';
            $parking_slot_id = isset($space['id']) ? esc_html($space['id']) : '';

            $html .= '<div style="font-size:13px; color:#555; line-height:1.5; margin-top:10px; padding-top:10px; border-top:1px solid #eee;">
                                            Vehicle #' . ($index + 1) . '<br>
                                            Vehicle Type: ' . $license_plate . '<br>
                                            Other Type Car: ' . $other_type_car . '<br>
                                            Parking Slot: ' . $parking_slot_id . '
                                            </div>';
        }
        $html .= '                  
                            </td>
                        </tr>';
    }



    $html .= '</table>
            </td>
          </tr>';



    // Sending flight information section
    if (!empty($sending_depart) || !empty($sending_arrival)) {
        $html .= '
          <!-- Sending Flight Information -->
          <tr>
            <td class="px-24" style="padding:8px 24px 24px;">
              <table role="presentation" width="100%">
                <tr>
                  <td class="stack" width="100%" valign="top" style="padding:16px; border:1px solid #e5e7eb; border-radius:6px;">
                    <div style="font-weight:bold; color:#111; margin-bottom:6px;">Add-on Services</div>
                    <div style="font-size:13px; color:#555; line-height:1.5;">';

        if (!empty($sending_depart)) {
            $html .= 'Departure Flight: ' . $sending_depart . '<br>';
        }

        if (!empty($sending_arrival)) {
            $html .= 'Arrival Flight: ' . $sending_arrival . '<br>';
        }


        if (!empty($sending_depart_time)) {
            $html .= $sending_depart_time . '<br>';
        }

        if (!empty($sending_arrival_time)) {
            $html .=  $sending_arrival_time . '<br>';
        }

        if (!empty($sending_pickup_time)) {
            $html .= 'Parking Time: ' . $sending_pickup_time . '<br>';
        }

        if (!empty($sending_dropoff_time)) {
            $html .= 'Drop-off Time: ' . $sending_dropoff_time . '<br>';
        }

        if (!empty($sending_pickup_point)) {
            $html .= 'Pickup Location: ' . $sending_pickup_point . '<br>';
        }

        if (!empty($sending_dropoff_point)) {
            $html .= 'Drop-off Location: ' . $sending_dropoff_point . '<br>';
        }

        if (!empty($sending_adult_count)) {
            $html .= 'Passengers (Adults): ' . $sending_adult_count . ' คน<br>';
        }

        if (!empty($sending_child_count)) {
            $html .= 'Passengers (Children): ' . $sending_child_count . ' คน<br>';
        }

        if (!empty($sending_baggage_count)) {
            $html .= 'Number of Luggage: ' . $sending_baggage_count . ' ใบ<br>';
        }

        if (!empty($sending_pickup_note)) {
            $html .= 'Notes for Driver:<br>' . nl2br($sending_pickup_note) . '<br>';
        }

        $html .= '                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>';
    }

    $html .= '
          <!-- Promo block -->
          <tr>
            <td align="center" style="padding:28px 24px; color:#f10000;">
              <div style="font-size:16px; font-weight:bold; margin-bottom:10px;">*If your flight is delayed, please contact our parking
staff immediately via LINE.</div>
            </td>
          </tr>';


    $html .= '
          <!-- Promo block -->
          <tr>
            <td bgcolor="#29b2e2" align="center" style="padding:28px 24px; color:#ffffff;">
              <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">Need Help? We’re Here for You!</div>
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
        // $subject = 'ยืนยันการจองที่จอดรถ - ' . $order_code . ' - ' . $site_name;
        $subject = '[Parking System] [Parking Service] Your Payment is Complete – Booking ID #' . $order_code;

        try {
            // Send email to customer
            $customer_sent = wp_mail($customer_email, $subject, $html, $headers);


            // Send email to admin with different subject
            $admin_subject = '[Parking Service] New Booking Received (Booking No. ' . $order_code . ') – Please Verify Information';
            $admin_emails = array(
                $admin_email,
                'keatsanapong.d44@gmail.com'
            );

            // Send to all admin emails
            foreach ($admin_emails as $single_admin_email) {
                $admin_sent = wp_mail($single_admin_email, $admin_subject, $html, $headers);
                if ($admin_sent) {
                    error_log("Parking booking email sent successfully to admin: $single_admin_email for order: $order_code");
                } else {
                    error_log("Failed to send parking booking email to admin: $single_admin_email for order: $order_code");
                }
            }

            // Log email sending results
            if ($customer_sent) {
                error_log("Parking booking email sent successfully to customer: $customer_email for order: $order_code");
            } else {
                error_log("Failed to send parking booking email to customer: $customer_email for order: $order_code");
            }
        } catch (Exception $e) {
            error_log("Error sending parking booking emails for order $order_code: " . $e->getMessage());
        }
    }

    return $html;
}

// REST API: Tabien Rod endpoints
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/tabien_rod', array(
        'methods'  => 'GET',
        'callback' => 'get_tabien_rod_items',
        'permission_callback' => '__return_true',
        'args' => array(
            'page' => array('type' => 'integer', 'required' => false, 'sanitize_callback' => 'absint'),
            'per_page' => array('type' => 'integer', 'required' => false, 'sanitize_callback' => 'absint'),
            'search' => array('type' => 'string', 'required' => false, 'sanitize_callback' => 'sanitize_text_field'),
            'user_id' => array('type' => 'integer', 'required' => false, 'sanitize_callback' => 'absint'),
            'license_plate' => array('type' => 'string', 'required' => false, 'sanitize_callback' => 'sanitize_text_field'),
        )
    ));

    register_rest_route('custom/v1', '/tabien_rod/(?P<id>\\d+)', array(
        'methods'  => 'GET',
        'callback' => 'get_tabien_rod_item',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array('type' => 'integer', 'required' => true, 'sanitize_callback' => 'absint'),
        )
    ));

    register_rest_route('custom/v1', '/tabien_rod', array(
        'methods'  => 'POST',
        'callback' => 'create_tabien_rod_item',
        'permission_callback' => function () {
            return is_user_logged_in();
        },
        'args' => array(
            'title' => array('type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field'),
            'license_plate' => array('type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field'),
        )
    ));
});

function format_tabien_rod_post($post)
{
    $post_id = is_object($post) ? $post->ID : (int)$post;
    return array(
        'id' => $post_id,
        'title' => get_the_title($post_id),
        'tabienrod_number' => get_field('tabienrod_number', $post_id),
        'user_okpark' => get_field('user-okpark', $post_id),
        'link' => get_permalink($post_id),
    );
}

function get_tabien_rod_items($request)
{
    $paged = max(1, (int)($request['page'] ?: 1));
    $per_page = (int)($request['per_page'] ?: 10);

    $meta_query = array('relation' => 'AND');
    if (!empty($request['user_id'])) {
        $meta_query[] = array(
            'key' => 'user-okpark',
            'value' => (int)$request['user_id'],
            'compare' => '=',
        );
    }
    if (!empty($request['license_plate'])) {
        $meta_query[] = array(
            'key' => 'tabienrod_number',
            'value' => sanitize_text_field($request['license_plate']),
            'compare' => '=',
        );
    }

    $args = array(
        'post_type' => 'tabien-rod',
        'post_status' => 'publish',
        'paged' => $paged,
        'posts_per_page' => $per_page,
        's' => !empty($request['search']) ? sanitize_text_field($request['search']) : '',
    );
    if (count($meta_query) > 1) {
        $args['meta_query'] = $meta_query;
    }

    $q = new WP_Query($args);
    $items = array_map('format_tabien_rod_post', $q->posts);

    return array(
        'items' => $items,
        'pagination' => array(
            'total' => (int)$q->found_posts,
            'pages' => (int)$q->max_num_pages,
            'page'  => $paged,
            'per_page' => $per_page,
        )
    );
}

function get_tabien_rod_item($request)
{
    $post_id = (int)$request['id'];
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'tabien-rod' || $post->post_status !== 'publish') {
        return new WP_Error('not_found', 'ไม่พบข้อมูล', array('status' => 404));
    }
    return format_tabien_rod_post($post_id);
}

function create_tabien_rod_item($request)
{
    $title = sanitize_text_field($request['title']);
    $license = sanitize_text_field($request['license_plate']);
    $current_user = get_current_user_id();

    // Duplicate check for same user and license plate
    $existing = get_posts(array(
        'post_type' => 'tabien-rod',
        'post_status' => 'publish',
        'numberposts' => 1,
        'meta_query' => array(
            array('key' => 'tabienrod_number', 'value' => $license, 'compare' => '='),
            array('key' => 'user-okpark', 'value' => $current_user, 'compare' => '=')
        )
    ));
    if (!empty($existing)) {
        return new WP_Error('duplicate', 'ทะเบียนนี้ถูกบันทึกไว้แล้วสำหรับผู้ใช้งานคนนี้', array('status' => 409));
    }

    $post_id = wp_insert_post(array(
        'post_type' => 'tabien-rod',
        'post_status' => 'publish',
        'post_title' => 'ทะเบียนรถ: ' . $license . ' - ' . $title,
    ));
    if (is_wp_error($post_id) || !$post_id) {
        return new WP_Error('create_failed', 'ไม่สามารถสร้างโพสต์ได้', array('status' => 500));
    }

    update_field('tabienrod_number', $license, $post_id);
    update_field('user-okpark', $current_user, $post_id);

    return format_tabien_rod_post($post_id);
}


if (function_exists('acf_add_options_page')) {
    acf_add_options_page(array(
        'page_title'    => 'Theme Settings', // The title displayed in the admin menu
        'menu_title'    => 'Theme Settings', // The menu title
        'menu_slug'     => 'theme-settings', // The slug for the options page URL
        'capability'    => 'manage_options', // User capability required to access
        'redirect'      => false,            // Don't redirect to the first sub-page
        'position'      => 60,               // Position in the admin menu (e.g., below Posts)
        'icon_url'      => 'dashicons-admin-settings', // Dashicon for the menu item
    ));

    acf_add_options_sub_page(array(
        'page_title'  => 'Price Settings',
        'menu_title'  => 'Price',
        'parent_slug' => 'theme-settings',
    ));

    acf_add_options_sub_page(array(
        'page_title'  => 'Parking Booking Settings',
        'menu_title'  => 'Parking Booking',
        'menu_slug'   => 'parking-booking-settings',
        'parent_slug' => 'theme-settings',
    ));
}

// Add Line OA setting field to Theme Settings
add_action('acf/init', function () {
    if (function_exists('acf_add_local_field_group')):

        acf_add_local_field_group(array(
            'key' => 'group_theme_settings_line_oa',
            'title' => 'Line OA Settings',
            'fields' => array(
                array(
                    'key' => 'field_theme_settings_line_oa_link',
                    'label' => 'Line OA Link',
                    'name' => 'line_oa_link',
                    'type' => 'url',
                    'instructions' => 'ลิงก์สำหรับติดต่อ Line OA เช่น https://lin.ee/Bm45y3b',
                    'required' => 0,
                    'conditional_logic' => 0,
                    'wrapper' => array(
                        'width' => '',
                        'class' => '',
                        'id' => '',
                    ),
                    'default_value' => '',
                    'placeholder' => 'https://lin.ee/...',
                ),
                array(
                    'key' => 'field_theme_settings_line_oa_id',
                    'label' => 'Line OA ID',
                    'name' => 'line_oa_id',
                    'type' => 'text',
                    'instructions' => 'ID สำหรับติดต่อ Line OA เช่น @parkingsystem',
                    'required' => 0,
                    'conditional_logic' => 0,
                    'wrapper' => array(
                        'width' => '',
                        'class' => '',
                        'id' => '',
                    ),
                    'default_value' => '',
                    'placeholder' => '@parkingsystem',
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'options_page',
                        'operator' => '==',
                        'value' => 'theme-settings',
                    ),
                ),
            ),
            'menu_order' => 0,
            'position' => 'normal',
            'style' => 'default',
            'label_placement' => 'top',
            'instruction_placement' => 'label',
            'hide_on_screen' => '',
            'active' => true,
            'description' => '',
            'show_in_rest' => 0,
        ));

        acf_add_local_field_group(array(
            'key' => 'group_theme_settings_parking_booking_blackout',
            'title' => 'Parking Booking Blackout',
            'fields' => array(
                array(
                    'key' => 'field_theme_settings_parking_booking_blackout_ranges',
                    'label' => 'Blackout Date Ranges',
                    'name' => 'parking_booking_blackout_ranges',
                    'type' => 'repeater',
                    'required' => 0,
                    'conditional_logic' => 0,
                    'wrapper' => array(
                        'width' => '',
                        'class' => '',
                        'id' => '',
                    ),
                    'layout' => 'table',
                    'button_label' => 'Add Range',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_theme_settings_parking_booking_blackout_start_date',
                            'label' => 'Start Date',
                            'name' => 'start_date',
                            'type' => 'date_picker',
                            'required' => 1,
                            'wrapper' => array(
                                'width' => '30',
                                'class' => '',
                                'id' => '',
                            ),
                            'display_format' => 'Y-m-d',
                            'return_format' => 'Y-m-d',
                            'first_day' => 1,
                        ),
                        array(
                            'key' => 'field_theme_settings_parking_booking_blackout_end_date',
                            'label' => 'End Date',
                            'name' => 'end_date',
                            'type' => 'date_picker',
                            'required' => 1,
                            'wrapper' => array(
                                'width' => '30',
                                'class' => '',
                                'id' => '',
                            ),
                            'display_format' => 'Y-m-d',
                            'return_format' => 'Y-m-d',
                            'first_day' => 1,
                        ),
                        array(
                            'key' => 'field_theme_settings_parking_booking_blackout_message',
                            'label' => 'Message',
                            'name' => 'message',
                            'type' => 'text',
                            'required' => 0,
                            'wrapper' => array(
                                'width' => '40',
                                'class' => '',
                                'id' => '',
                            ),
                            'default_value' => '',
                        ),
                    ),
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'options_page',
                        'operator' => '==',
                        'value' => 'acf-options-parking-booking-settings',
                    ),
                ),
                array(
                    array(
                        'param' => 'options_page',
                        'operator' => '==',
                        'value' => 'parking-booking-settings',
                    ),
                ),
            ),
            'menu_order' => 0,
            'position' => 'normal',
            'style' => 'default',
            'label_placement' => 'top',
            'instruction_placement' => 'label',
            'hide_on_screen' => '',
            'active' => true,
            'description' => '',
            'show_in_rest' => 0,
        ));

        // Passenger extra fee notice field in Theme Settings
        acf_add_local_field_group(array(
            'key' => 'group_theme_settings_passenger_notice',
            'title' => 'Passenger Extra Fee Notice',
            'fields' => array(
                array(
                    'key' => 'field_theme_settings_passenger_extra_fee_notice',
                    'label' => 'Passenger Extra Fee Notice',
                    'name' => 'passenger_extra_fee_notice',
                    'type' => 'textarea',
                    'instructions' => 'ข้อความจะแสดงใต้ช่อง จำนวนผู้โดยสาร (ผู้ใหญ่).',
                    'required' => 0,
                    'wrapper' => array(
                        'width' => '',
                        'class' => '',
                        'id' => '',
                    ),
                    'default_value' => "ในกรณี ผู้โดยสารเกิน 4 ท่าน ตั้งแต่ท่านที่ 5 ขออนุญาตคิดค่าบริการรับ-ส่ง เพิ่มท่านละ 100 บาท (เด็กไม่คิดเพิ่ม) โดยชำระกับแอดมิน Line: @parkingsystem",
                    'placeholder' => '',
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'options_page',
                        'operator' => '==',
                        'value' => 'theme-settings',
                    ),
                ),
            ),
            'menu_order' => 0,
            'position' => 'normal',
            'style' => 'default',
            'label_placement' => 'top',
            'instruction_placement' => 'label',
            'hide_on_screen' => '',
            'active' => true,
            'description' => '',
            'show_in_rest' => 0,
        ));
    endif;
});




add_action('rest_api_init', 'register_theme_settings_rest_route');

function register_theme_settings_rest_route()
{
    register_rest_route('mytheme/v1', '/settings', array(
        'methods' => 'GET',
        'callback' => 'get_theme_settings_data',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('mytheme/v1', '/settings', array(
        'methods' => 'POST',
        'callback' => 'update_theme_settings_data',
        'permission_callback' => function () {
            return current_user_can('manage_options');
        },
        'args' => array(
            'site_tagline' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'New site tagline.',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'contact_email' => array(
                'required' => false,
                'type' => 'string',
                'format' => 'email',
                'description' => 'New contact email.',
                'sanitize_callback' => 'sanitize_email',
            ),
        ),
    ));
}

// ฟังก์ชันสำหรับ GET: ดึงข้อมูล ACF field จาก options page


function get_theme_settings_data($request)
{
    $price_carrent  = get_field('price_carrent', 'option');
    $price_parking  = get_field('price_parking', 'option');

    // เพิ่ม field อื่นๆ ได้ที่นี่
    return [
        'price_carrent' => $price_carrent,
        'price_parking' => $price_parking,
    ];
}

// ฟังก์ชันสำหรับ POST: (ตัวอย่าง, สามารถปรับแต่งให้บันทึก field ที่ต้องการ)
function update_theme_settings_data($request)
{
    $params = $request->get_params();

    // ตัวอย่าง: อัปเดต tagline และ contact_email (ถ้ามี)
    if (isset($params['site_tagline'])) {
        update_field('site_tagline', sanitize_text_field($params['site_tagline']), 'option');
    }
    if (isset($params['contact_email'])) {
        update_field('contact_email', sanitize_email($params['contact_email']), 'option');
    }

    // อัปเดต price_carrent และ price_parking ถ้าต้องการ
    if (isset($params['price_carrent'])) {
        update_field('price_carrent', $params['price_carrent'], 'option');
    }
    if (isset($params['price_parking'])) {
        update_field('price_parking', $params['price_parking'], 'option');
    }

    return [
        'success' => true,
        'data' => get_theme_settings_data($request),
    ];
}





// ========= WooCommerce Order Complete Hook =========

/**
 * Send parking booking email when WooCommerce order is completed
 */
function send_parking_booking_email_on_order_complete($order_id)
{
    // Get WooCommerce order
    $order = wc_get_order($order_id);
    if (!$order) {
        return;
    }

    // Check if this is a parking booking order
    $order_meta = $order->get_meta_data();
    $booking_data = null;
    $order_code = null;
    $post_id = null;

    // Look for parking booking data in order meta
    foreach ($order_meta as $meta) {
        $key = $meta->get_data()['key'];
        $value = $meta->get_data()['value'];

        if ($key === 'parking_booking_data') {
            $booking_data = is_string($value) ? json_decode($value, true) : $value;
        }
        if ($key === 'parking_order_code') {
            $order_code = $value;
        }
        if ($key === 'parking_post_id') {
            $post_id = $value;
        }
    }

    // If no parking booking data found, try alternative methods
    if (!$booking_data || !$order_code) {
        // Try to get from order items
        foreach ($order->get_items() as $item_id => $item) {
            $item_booking_data = $item->get_meta('parking_booking_data');
            $item_order_code = $item->get_meta('parking_order_code');
            $item_post_id = $item->get_meta('parking_post_id');

            if ($item_booking_data) {
                $booking_data = is_string($item_booking_data) ? json_decode($item_booking_data, true) : $item_booking_data;
            }
            if ($item_order_code) {
                $order_code = $item_order_code;
            }
            if ($item_post_id) {
                $post_id = $item_post_id;
            }

            if ($booking_data && $order_code) {
                break;
            }
        }
    }

    // If still no booking data, this might not be a parking order
    if (!$booking_data || !$order_code) {
        error_log("No parking booking data found for order ID: $order_id");
        return;
    }

    // Generate and send the email
    try {
        $email_content = generate_parking_booking_email_template($booking_data, $order_code, $post_id);

        // Get customer email
        $customer_email = $order->get_billing_email();
        if (!$customer_email && isset($booking_data['profile']['email'])) {
            $customer_email = $booking_data['profile']['email'];
        }

        if (!$customer_email) {
            error_log("No customer email found for parking booking order ID: $order_id");
            return;
        }

        // Email subject
        $subject = 'ยืนยันการจองที่จอดรถ - ' . $order_code . ' - ' . get_bloginfo('name');

        // Email headers
        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>'
        );

        // Send email
        $email_sent = wp_mail($customer_email, $subject, $email_content, $headers);

        if ($email_sent) {
            // Log successful email
            error_log("Parking booking confirmation email sent successfully for order ID: $order_id to: $customer_email");

            // Add order note
            $order->add_order_note('Parking booking confirmation email sent to: ' . $customer_email);
        } else {
            error_log("Failed to send parking booking confirmation email for order ID: $order_id");

            // Add order note
            $order->add_order_note('Failed to send parking booking confirmation email to: ' . $customer_email);
        }
    } catch (Exception $e) {
        error_log("Error sending parking booking email for order ID: $order_id - " . $e->getMessage());

        // Add order note
        $order->add_order_note('Error sending parking booking confirmation email: ' . $e->getMessage());
    }
}

// Hook into WooCommerce order completed
add_action('woocommerce_order_status_completed', 'send_parking_booking_email_on_order_complete');

// Also hook into order processing (in case you want to send email earlier)
// add_action('woocommerce_order_status_processing', 'send_parking_booking_email_on_order_complete');

/**
 * Alternative hook for when payment is completed (before order status changes)
 */
function send_parking_booking_email_on_payment_complete($order_id)
{
    // Get WooCommerce order
    $order = wc_get_order($order_id);
    if (!$order) {
        error_log("WooCommerce order not found for ID: $order_id");
        return;
    }

    // Check if this is a parking booking order
    $parking_booking_id = $order->get_meta('parking_booking_id');
    if (!$parking_booking_id) {
        error_log("Not a parking booking order: $order_id");
        return;
    }

    // Only send if order is paid and not already processed
    if ($order->is_paid() && !$order->get_meta('_parking_email_sent')) {
        // Mark as processed to avoid duplicate emails
        $order->update_meta_data('_parking_email_sent', true);
        $order->save();

        // Get booking data and order code
        $order_code = $order->get_meta('parking_order_code');
        $customer_email = $order->get_billing_email();

        // Try to reconstruct booking data from ACF fields
        $booking_data = array();

        // Get profile information
        $profile_data = get_field('profile_information', $parking_booking_id);
        if (!$profile_data) {
            // Fallback: construct from individual fields
            $profile_data = array(
                'fullname' => get_field('fullname_park', $parking_booking_id),
                'email' => get_field('email_park', $parking_booking_id),
                'phone' => get_field('phone_park', $parking_booking_id),
                'lineid' => get_field('line_id_park', $parking_booking_id)
            );
        }

        $booking_data['profile'] = $profile_data;
        $booking_data['startDate'] = get_field('start_date', $parking_booking_id);
        $booking_data['endDate'] = get_field('end_date', $parking_booking_id);
        $booking_data['startTime'] = get_field('start_time', $parking_booking_id);
        $booking_data['endTime'] = get_field('end_time', $parking_booking_id);
        $booking_data['location'] = get_field('location_park', $parking_booking_id);

        // Get vehicle information
        $vehicle_info = get_field('vehicle_info', $parking_booking_id);
        if ($vehicle_info) {
            $booking_data['selectedParkingSpaces'] = array();
            foreach ($vehicle_info as $vehicle) {
                $booking_data['selectedParkingSpaces'][] = array(
                    'licensePlate' => $vehicle['license_plate'] ?? '',
                    'otherTypeCar' => $vehicle['other_type_car'] ?? '',
                    'parking_post_id' => $vehicle['booked_parking_space'] ?? '',
                    'parking_id' => $vehicle['parking_slot_id'] ?? '',
                    'id' => $vehicle['parking_slot'] ?? ''
                );
            }
        }

        // Get addon information
        $addon_info = get_field('addon_information', $parking_booking_id);
        if ($addon_info) {
            $booking_data['addon'] = array(
                'servicePickup' => !empty($addon_info['service_pickup']),
                'serviceValet' => !empty($addon_info['service_valet']),
                'sending' => array(
                    'flightDepart' => $addon_info['sending_flight']['depart'] ?? '',
                    'flightDepartTime' => $addon_info['sending_flight']['depart_time'] ?? '',
                    'flightArrival' => $addon_info['sending_flight']['arrival'] ?? '',
                    'flightArrivalTime' => $addon_info['sending_flight']['arrival_time'] ?? '',
                    'pickupTime' => $addon_info['sending_flight']['pickup_time'] ?? '',
                    'dropoffTime' => $addon_info['sending_flight']['dropoff_time'] ?? '',
                    'pickupPoint' => $addon_info['sending_flight']['pickup_point'] ?? '',
                    'dropoffPoint' => $addon_info['sending_flight']['dropoff_point'] ?? '',
                    'adultCount' => $addon_info['sending_flight']['adult_count'] ?? '',
                    'childCount' => $addon_info['sending_flight']['child_count'] ?? '',
                    'baggageCount' => $addon_info['sending_flight']['baggage_count'] ?? '',
                    'pickupNote' => $addon_info['sending_flight']['pickup_note'] ?? ''
                ),
                'parking' => array(
                    'flightDepart' => $addon_info['parking_car']['depart'] ?? '',
                    'flightDepartTime' => $addon_info['parking_car']['depart_time'] ?? '',
                    'flightArrival' => $addon_info['parking_car']['arrival'] ?? '',
                    'flightArrivalTime' => $addon_info['parking_car']['arrival_time'] ?? '',
                    'pickupTime' => $addon_info['parking_car']['pickup_time'] ?? '',
                    'dropoffTime' => $addon_info['parking_car']['dropoff_time'] ?? '',
                    'pickupPoint' => $addon_info['parking_car']['pickup_point'] ?? '',
                    'dropoffPoint' => $addon_info['parking_car']['dropoff_point'] ?? '',
                    'pickupNote' => $addon_info['parking_car']['pickup_note'] ?? ''
                )
            );
        }

        // Use customer email from order if profile email is empty
        if (empty($booking_data['profile']['email']) && !empty($customer_email)) {
            $booking_data['profile']['email'] = $customer_email;
        }

        // Send the email using our email template function
        if (!empty($booking_data['profile']['email'])) {
            generate_parking_booking_email_template($booking_data, $order_code, $parking_booking_id, $booking_data['profile']['email']);
            error_log("Parking booking payment complete email sent for order: $order_code to: " . $booking_data['profile']['email']);
        } else {
            error_log("No customer email found for parking booking order: $order_code");
        }
    }
}

// Hook into payment completed
add_action('woocommerce_payment_complete', 'send_parking_booking_email_on_payment_complete');

/**
 * Manual trigger function for testing
 */
function manually_send_parking_booking_email($order_id)
{
    if (current_user_can('administrator')) {
        send_parking_booking_email_on_order_complete($order_id);
        return "Email sent for order ID: $order_id";
    }
    return "Permission denied";
}


?>