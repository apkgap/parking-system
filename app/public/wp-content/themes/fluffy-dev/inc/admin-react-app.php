<?php
declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Register WP Admin menu page for Parking & Car Rental React Dashboard (@wordpress/components).
 */
function fluffy_register_admin_react_menu(): void {
	add_menu_page(
		__( 'Parking System', 'fluffy' ),
		__( 'Parking System', 'fluffy' ),
		'manage_options',
		'fluffy-parking-admin',
		'fluffy_render_admin_react_page',
		'dashicons-car',
		26
	);
}
add_action( 'admin_menu', 'fluffy_register_admin_react_menu' );

/**
 * Render mount root for WP Admin React app.
 */
function fluffy_render_admin_react_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'fluffy' ) );
	}
	echo '<div class="wrap"><div id="fluffy-admin-root" class="fluffy-admin-root"></div></div>';
}

/**
 * Enqueue admin React bundle + @wordpress/components styles only on our admin page.
 *
 * @param string $hook_suffix Current admin page hook.
 */
function fluffy_enqueue_admin_react_assets( string $hook_suffix ): void {
	if ( 'toplevel_page_fluffy-parking-admin' !== $hook_suffix ) {
		return;
	}

	$theme_dir   = get_template_directory();
	$theme_uri   = get_template_directory_uri();
	$script_path = $theme_dir . '/build/react/admin.js';
	$asset_path  = $theme_dir . '/build/react/admin.asset.php';
	$style_path  = $theme_dir . '/build/react/admin.css';

	if ( ! file_exists( $script_path ) ) {
		return;
	}

	$asset = file_exists( $asset_path )
		? require $asset_path
		: array(
			'dependencies' => array( 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n' ),
			'version'      => (string) filemtime( $script_path ),
		);

	wp_enqueue_style( 'wp-components' );
	wp_enqueue_style(
		'fluffy-admin-fonts',
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap',
		array(),
		null
	);

	if ( file_exists( $style_path ) ) {
		wp_enqueue_style(
			'fluffy-react-admin',
			$theme_uri . '/build/react/admin.css',
			array( 'wp-components' ),
			(string) filemtime( $style_path )
		);
	}

	wp_register_script(
		'fluffy-react-admin',
		$theme_uri . '/build/react/admin.js',
		$asset['dependencies'],
		(string) $asset['version'],
		true
	);

	wp_localize_script(
		'fluffy-react-admin',
		'fluffyAdminConfig',
		array(
			'restUrl'      => esc_url_raw( rest_url() ),
			'nonce'        => wp_create_nonce( 'wp_rest' ),
			'siteName'     => get_bloginfo( 'name' ),
			'adminUrl'     => esc_url_raw( admin_url() ),
		)
	);

	wp_enqueue_script( 'fluffy-react-admin' );
}
add_action( 'admin_enqueue_scripts', 'fluffy_enqueue_admin_react_assets' );

/**
 * Allowed booking/member page templates that must NEVER be deleted during Elementor cleanup.
 *
 * @return string[]
 */
function fluffy_get_protected_booking_templates(): array {
	return array(
		'page-carpark.php',
		'page-rentcar.php',
		'login.php',
		'register.php',
		'forgot-password.php',
		'profile-page.php',
		'profile-driver-page.php',
		'checkin.php',
		'checkout.php',
		'page-dashboard.php',
		'page-thank.php',
		'payment-complete.php',
		'service-control.php',
		'create-driver-job.php',
	);
}

/**
 * Register Admin REST API endpoints (strictly manage_options).
 */
function fluffy_register_admin_rest_routes(): void {
	$admin_permission = static function (): bool {
		return current_user_can( 'manage_options' );
	};

	register_rest_route(
		'custom/v1',
		'/admin/overview',
		array(
			'methods'             => 'GET',
			'callback'            => 'fluffy_rest_admin_overview',
			'permission_callback' => $admin_permission,
		)
	);

	register_rest_route(
		'custom/v1',
		'/admin/elementor-pages',
		array(
			'methods'             => 'GET',
			'callback'            => 'fluffy_rest_list_elementor_pages',
			'permission_callback' => $admin_permission,
		)
	);

	register_rest_route(
		'custom/v1',
		'/admin/cleanup-elementor',
		array(
			'methods'             => 'POST',
			'callback'            => 'fluffy_rest_cleanup_elementor_pages',
			'permission_callback' => $admin_permission,
		)
	);
}
add_action( 'rest_api_init', 'fluffy_register_admin_rest_routes' );

/**
 * Return summary counts for all booking CPTs.
 *
 * @return WP_REST_Response
 */
function fluffy_rest_admin_overview(): WP_REST_Response {
	$cpts   = array( 'parking_booking', 'car_rentals', 'taxi-driver', 'ride_assignment', 'parking_space', 'tabien-rod' );
	$counts = array();
	foreach ( $cpts as $cpt ) {
		$obj            = wp_count_posts( $cpt );
		$counts[ $cpt ] = isset( $obj->publish ) ? (int) $obj->publish : 0;
	}

	return rest_ensure_response(
		array(
			'success' => true,
			'data'    => array(
				'counts' => $counts,
			),
		)
	);
}

/**
 * Find Elementor pages & elementor_library items unrelated to booking templates.
 *
 * @return array<int, array<string, mixed>>
 */
function fluffy_query_non_booking_elementor_posts(): array {
	$protected = fluffy_get_protected_booking_templates();
	$results   = array();

	$query = new WP_Query(
		array(
			'post_type'      => array( 'page', 'post', 'elementor_library' ),
			'post_status'    => array( 'publish', 'draft', 'private', 'pending' ),
			'posts_per_page' => -1,
			'meta_query'     => array(
				'relation' => 'OR',
				array(
					'key'     => '_elementor_edit_mode',
					'value'   => 'builder',
					'compare' => '=',
				),
				array(
					'key'     => '_elementor_data',
					'compare' => 'EXISTS',
				),
			),
		)
	);

	if ( $query->have_posts() ) {
		while ( $query->have_posts() ) {
			$query->the_post();
			$post_id  = get_the_ID();
			$template = (string) get_post_meta( $post_id, '_wp_page_template', true );

			if ( in_array( $template, $protected, true ) ) {
				continue;
			}

			$results[] = array(
				'id'       => $post_id,
				'title'    => get_the_title( $post_id ),
				'type'     => get_post_type( $post_id ),
				'status'   => get_post_status( $post_id ),
				'template' => $template ?: 'default',
			);
		}
		wp_reset_postdata();
	}

	return $results;
}

/**
 * REST: List non-booking Elementor pages in DB.
 *
 * @return WP_REST_Response
 */
function fluffy_rest_list_elementor_pages(): WP_REST_Response {
	return rest_ensure_response(
		array(
			'success' => true,
			'data'    => fluffy_query_non_booking_elementor_posts(),
		)
	);
}

/**
 * REST: Permanently delete all non-booking Elementor pages & library templates.
 *
 * @return WP_REST_Response
 */
function fluffy_rest_cleanup_elementor_pages(): WP_REST_Response {
	$items   = fluffy_query_non_booking_elementor_posts();
	$deleted = 0;

	foreach ( $items as $item ) {
		if ( wp_delete_post( (int) $item['id'], true ) ) {
			++$deleted;
		}
	}

	return rest_ensure_response(
		array(
			'success' => true,
			'data'    => array(
				'deleted_count' => $deleted,
			),
		)
	);
}
