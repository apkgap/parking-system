<?php
/**
 * Template Name: Checkout
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! is_user_logged_in() ) {
	wp_safe_redirect( home_url( '/login/' ) );
	exit;
}

get_header();
?>

<main id="primary" class="fluffy-main site-main">
	<div id="fluffy-operations-root" class="fluffy-react-root" data-mode="checkout"></div>
</main>

<?php
get_footer();
