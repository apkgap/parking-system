<?php
declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( ! defined( 'FLUFFY_DEMO_SKIP_PAYMENT' ) ) {
	define( 'FLUFFY_DEMO_SKIP_PAYMENT', true );
}

function fluffy_enqueue_saas_fonts(): void {
	wp_enqueue_style(
		'fluffy-saas-fonts',
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap',
		array(),
		null
	);

	$header_js = get_template_directory() . '/js/fluffy-header.js';
	if ( file_exists( $header_js ) ) {
		wp_register_script(
			'fluffy-header-menu',
			get_template_directory_uri() . '/js/fluffy-header.js',
			array(),
			(string) filemtime( $header_js ),
			true
		);
		wp_enqueue_script( 'fluffy-header-menu' );
	}
}
add_action( 'wp_enqueue_scripts', 'fluffy_enqueue_saas_fonts', 10 );

/**
 * Register and enqueue @wordpress/scripts React bundles for
 * Auth (Login/Register/Forgot Password), Member Profile, and Booking (Carpark/Rentcar).
 */
function fluffy_enqueue_react_apps(): void {
	$is_front   = is_front_page() || is_home();
	$bundle_map = array(
		'auth'       => is_page_template( array( 'login.php', 'register.php', 'forgot-password.php' ) ) || ( $is_front && ! is_user_logged_in() ),
		'profile'    => is_page_template( array( 'profile-page.php', 'profile-driver-page.php' ) ) || is_page( array( 'profile', 'driver-profile' ) ),
		'booking'    => is_page_template( array( 'page-carpark.php', 'page-rentcar.php' ) ) || is_page( array( 'carrent', 'carpark' ) ),
		'operations' => is_page_template( array( 'checkin.php', 'checkout.php', 'service-control.php', 'create-driver-job.php', 'page-thank.php' ) ),
		'dashboard'  => is_page_template( array( 'page-dashboard.php' ) ) || is_page( 'dashboard' ) || ( $is_front && is_user_logged_in() ),
	);

	$active_bundle = '';
	foreach ( $bundle_map as $bundle => $is_match ) {
		if ( $is_match ) {
			$active_bundle = $bundle;
			break;
		}
	}

	if ( '' === $active_bundle ) {
		return;
	}

	$theme_dir  = get_template_directory();
	$theme_uri  = get_template_directory_uri();
	$asset_path = $theme_dir . '/build/react/' . $active_bundle . '.asset.php';
	$script_path = $theme_dir . '/build/react/' . $active_bundle . '.js';
	$style_path       = $theme_dir . '/build/react/' . $active_bundle . '.css';
	$vendor_style_path = $theme_dir . '/build/react/style-' . $active_bundle . '.css';

	if ( ! file_exists( $script_path ) ) {
		return;
	}

	$asset = file_exists( $asset_path )
		? require $asset_path
		: array(
			'dependencies' => array( 'wp-element' ),
			'version'      => (string) filemtime( $script_path ),
		);

	$handle = 'fluffy-react-' . $active_bundle;

	if ( 'operations' === $active_bundle && is_page_template( array( 'checkin.php', 'checkout.php' ) ) ) {
		wp_enqueue_script( 'html5-qrcode', 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js', array(), '2.3.8', true );
	}

	wp_enqueue_style(
		'fluffy-saas-fonts',
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap',
		array(),
		null
	);

	wp_register_script(
		$handle,
		$theme_uri . '/build/react/' . $active_bundle . '.js',
		$asset['dependencies'],
		(string) $asset['version'],
		true
	);

	if ( file_exists( $vendor_style_path ) ) {
		wp_register_style(
			$handle . '-vendor',
			$theme_uri . '/build/react/style-' . $active_bundle . '.css',
			array(),
			(string) filemtime( $vendor_style_path )
		);
		wp_enqueue_style( $handle . '-vendor' );
	}

	if ( file_exists( $style_path ) ) {
		wp_register_style(
			$handle,
			$theme_uri . '/build/react/' . $active_bundle . '.css',
			file_exists( $vendor_style_path ) ? array( $handle . '-vendor' ) : array(),
			(string) filemtime( $style_path )
		);
		wp_enqueue_style( $handle );
	}

	$current_user = wp_get_current_user();
	$user_id      = get_current_user_id();

	$driver_taxi_user_id = 0;
	$driver_display_name = $current_user->display_name ?? '';
	if ( $user_id > 0 && 'profile' === $active_bundle ) {
		if ( function_exists( 'get_field' ) ) {
			$raw_driver = get_field( 'driver_userdata_u', 'user_' . $user_id );
			if ( is_object( $raw_driver ) && isset( $raw_driver->ID ) ) {
				$driver_taxi_user_id = (int) $raw_driver->ID;
			} else {
				$driver_taxi_user_id = (int) $raw_driver;
			}
		}

		$driver_query = new WP_Query(
			array(
				'post_type'      => 'taxi-driver',
				'meta_key'       => 'driver_userdata',
				'meta_value'     => $user_id,
				'posts_per_page' => 1,
				'post_status'    => 'publish',
			)
		);
		if ( $driver_query->have_posts() ) {
			$driver_query->the_post();
			$driver_display_name = $driver_display_name . ' (' . get_the_title() . ')';
			wp_reset_postdata();
		}
	}

	$locale = get_locale();
	$lang   = ( 0 === strpos( $locale, 'th' ) ) ? 'th' : 'en';

	$config = array(
		'ajaxUrl'         => admin_url( 'admin-ajax.php' ),
		'restUrl'         => esc_url_raw( rest_url() ),
		'customRestUrl'   => esc_url_raw( rest_url( 'custom/v1/' ) ),
		'carrentRestUrl'  => esc_url_raw( rest_url( 'carrent/' ) ),
		'homeUrl'         => esc_url_raw( home_url( '/' ) ),
		'checkoutUrl'     => function_exists( 'wc_get_checkout_url' ) ? esc_url_raw( wc_get_checkout_url() ) : esc_url_raw( home_url( '/checkout/' ) ),
		'logoutUrl'       => esc_url_raw( wp_logout_url( home_url( '/' ) ) ),
		'lineOaLink'      => esc_url_raw( ( function_exists( 'get_field' ) && get_field( 'line_oa_link', 'option' ) ) ? (string) get_field( 'line_oa_link', 'option' ) : 'https://lin.ee/Bm45y3b' ),
		'lang'            => $lang,
		'canRegister'     => (bool) get_option( 'users_can_register' ),
		'nonces'          => array(
			'rest'           => wp_create_nonce( 'wp_rest' ),
			'login'          => wp_create_nonce( 'user_login_nonce' ),
			'register'       => wp_create_nonce( 'user_registration_nonce' ),
			'forgotPassword' => wp_create_nonce( 'forgot_password_nonce' ),
			'parkingPrice'   => wp_create_nonce( 'calculate_parking_price' ),
			'carrent'        => wp_create_nonce( 'carrent_nonce' ),
			'searchPrice'    => wp_create_nonce( 'search_price_nonce' ),
			'checkin'        => wp_create_nonce( 'checkin_nonce' ),
			'checkout'       => wp_create_nonce( 'checkout_nonce' ),
		),
		'user'            => array(
			'isLoggedIn'        => is_user_logged_in(),
			'id'                => $user_id,
			'displayName'       => $user_id > 0 ? $current_user->display_name : '',
			'driverDisplayName' => $driver_display_name,
			'driverTaxiUserId'  => $driver_taxi_user_id,
			'email'             => $user_id > 0 ? ( get_user_meta( $user_id, 'billing_email', true ) ?: $current_user->user_email ) : '',
			'phone'             => $user_id > 0 ? ( get_user_meta( $user_id, 'billing_phone', true ) ?: get_user_meta( $user_id, 'phone', true ) ) : '',
			'lineId'            => ( $user_id > 0 && function_exists( 'get_field' ) ) ? (string) get_field( 'line_id_user', 'user_' . $user_id ) : '',
			'registered'        => $user_id > 0 ? gmdate( 'd/m/Y', strtotime( $current_user->user_registered ) ) : '',
			'roles'             => $user_id > 0 ? (array) $current_user->roles : array(),
		),
	);

	wp_localize_script( $handle, 'fluffyReactConfig', $config );
	wp_enqueue_script( $handle );
}
add_action( 'wp_enqueue_scripts', 'fluffy_enqueue_react_apps', 20 );

/**
 * Dequeue legacy jQuery page scripts on templates refactored to React
 * to avoid duplicate event listeners.
 */
function fluffy_dequeue_legacy_scripts_for_react(): void {
	if ( is_page_template( 'login.php' ) ) {
		wp_dequeue_script( 'ajax-login' );
	}
	if ( is_page_template( 'register.php' ) ) {
		wp_dequeue_script( 'ajax-register' );
	}
	if ( is_page_template( 'forgot-password.php' ) ) {
		wp_dequeue_script( 'ajax-forgot-password' );
	}
	if ( is_page_template( 'profile-page.php' ) || is_page( 'profile' ) ) {
		wp_dequeue_script( 'profile-ajax' );
	}
	if ( is_page_template( 'profile-driver-page.php' ) || is_page( 'driver-profile' ) ) {
		wp_dequeue_script( 'profile-driver-ajax' );
	}
	if ( is_page_template( 'page-rentcar.php' ) || is_page( 'carrent' ) ) {
		wp_dequeue_script( 'car-rental-script' );
		wp_dequeue_script( 'ajax-carrent-script' );
		wp_dequeue_script( 'customize-script' );
		wp_dequeue_script( 'tabien-popup-script' );
		wp_dequeue_script( 'thaidate-script' );
	}
	if ( is_page_template( 'page-carpark.php' ) || is_page( 'carpark' ) ) {
		wp_dequeue_script( 'customize-script' );
		wp_dequeue_script( 'tabien-popup-script' );
		wp_dequeue_script( 'thaidate-script' );
		wp_dequeue_script( 'space-parking-script' );
		wp_deregister_script( 'space-parking-script' );
	}
	if ( is_page_template( array( 'checkin.php', 'checkout.php', 'create-driver-job.php' ) ) ) {
		wp_dequeue_script( 'ajax-checkin' );
		wp_dequeue_script( 'ajax-checkout' );
		wp_dequeue_script( 'ajax-add-driver-job' );
	}
	if ( is_page_template( 'page-dashboard.php' ) || is_page( 'dashboard' ) || ( ( is_front_page() || is_home() ) && is_user_logged_in() ) ) {
		wp_dequeue_script( 'parking-perday' );
		wp_dequeue_script( 'parking-permonth' );
		wp_dequeue_script( 'parking-export' );
		wp_dequeue_script( 'carrental' );
		wp_dequeue_script( 'driver' );
		wp_dequeue_script( 'driver-js' );
		wp_dequeue_script( 'parking' );
		wp_dequeue_script( 'transport-js' );
	}

	// Prevent global legacy parking scripts from firing on any React-refactored page.
	if ( is_front_page() || is_home() || is_page_template(
		array(
			'login.php',
			'register.php',
			'forgot-password.php',
			'profile-page.php',
			'profile-driver-page.php',
			'page-carpark.php',
			'page-rentcar.php',
			'checkin.php',
			'checkout.php',
			'service-control.php',
			'create-driver-job.php',
			'page-thank.php',
			'page-dashboard.php',
		)
	) || is_page( array( 'profile', 'driver-profile', 'carrent', 'carpark', 'dashboard' ) ) ) {
		wp_dequeue_script( 'space-parking-script' );
		wp_deregister_script( 'space-parking-script' );
		wp_dequeue_script( 'customize-script' );
		wp_dequeue_script( 'tabien-popup-script' );
		wp_dequeue_script( 'thaidate-script' );
	}
}
add_action( 'wp_enqueue_scripts', 'fluffy_dequeue_legacy_scripts_for_react', 99 );
// Must run on wp_footer BEFORE priority 20 (wp_print_footer_scripts) because customize.php enqueues space-parking-script on wp_footer at priority 10.
add_action( 'wp_footer', 'fluffy_dequeue_legacy_scripts_for_react', 15 );

/**
 * JSON REST endpoint for Car Rental packages (used by React Rentcar booking UI).
 */
function fluffy_register_react_rest_routes(): void {
	register_rest_route(
		'custom/v1',
		'/car_rental_packages',
		array(
			'methods'             => 'GET',
			'callback'            => 'fluffy_rest_get_car_rental_packages',
			'permission_callback' => '__return_true',
			'args'                => array(
				'origin'      => array(
					'type'              => 'string',
					'required'          => false,
					'sanitize_callback' => 'sanitize_text_field',
				),
				'destination' => array(
					'type'              => 'string',
					'required'          => false,
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'fluffy_register_react_rest_routes' );

/**
 * Return structured JSON list of package_rent items for React.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response
 */
function fluffy_rest_get_car_rental_packages( WP_REST_Request $request ): WP_REST_Response {
	$origin      = (string) $request->get_param( 'origin' );
	$destination = (string) $request->get_param( 'destination' );

	$meta_query = array( 'relation' => 'AND' );
	if ( '' !== $origin ) {
		$meta_query[] = array(
			'key'     => 'origin',
			'value'   => $origin,
			'compare' => 'LIKE',
		);
	}
	if ( '' !== $destination ) {
		$meta_query[] = array(
			'key'     => 'destination',
			'value'   => $destination,
			'compare' => 'LIKE',
		);
	}

	$args = array(
		'post_type'      => 'package_rent',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
	);
	if ( count( $meta_query ) > 1 ) {
		$args['meta_query'] = $meta_query;
	}

	$query = new WP_Query( $args );
	$items = array();

	if ( $query->have_posts() ) {
		while ( $query->have_posts() ) {
			$query->the_post();
			$post_id = get_the_ID();
			$items[] = array(
				'id'          => $post_id,
				'title'       => get_the_title( $post_id ),
				'origin'      => function_exists( 'get_field' ) ? (string) get_field( 'origin', $post_id ) : '',
				'destination' => function_exists( 'get_field' ) ? (string) get_field( 'destination', $post_id ) : '',
				'car_type'    => function_exists( 'get_field' ) ? (string) get_field( 'car_type', $post_id ) : '',
				'price'       => function_exists( 'get_field' ) ? (float) get_field( 'price', $post_id ) : 0.0,
			);
		}
		wp_reset_postdata();
	}

	return rest_ensure_response(
		array(
			'success' => true,
			'data'    => $items,
		)
	);
}
