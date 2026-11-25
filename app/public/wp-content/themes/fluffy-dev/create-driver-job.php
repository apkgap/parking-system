<?php
/**
 * Template Name: Create Driver Job
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! is_user_logged_in() ) {
	auth_redirect();
	exit;
}

$current_user     = wp_get_current_user();
$allowed_roles    = array( 'administrator', 'service-customer' );
$has_allowed_role = array_intersect( $allowed_roles, (array) $current_user->roles );

if ( empty( $has_allowed_role ) ) {
	wp_die( esc_html__( 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'fluffy' ), esc_html__( 'Forbidden', 'fluffy' ), array( 'response' => 403 ) );
}

get_header();
?>

<main id="primary" class="fluffy-main site-main">
	<div id="fluffy-operations-root" class="fluffy-react-root" data-mode="driver-job"></div>
</main>

<?php
get_footer();
