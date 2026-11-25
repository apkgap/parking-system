<?php
/**
 * Template Name: Customer Profile Page
 * Description: Member profile with parking booking history and saved vehicles (React).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! is_user_logged_in() ) {
	wp_safe_redirect( home_url( '/login' ) );
	exit;
}

get_header();
?>

<main id="primary" class="site-main">
	<div id="fluffy-profile-root" class="fluffy-react-root" data-mode="customer"></div>
</main>

<?php
get_footer();
