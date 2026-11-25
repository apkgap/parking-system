<?php
/**
 * Template Name: Rent Car Booking
 * Description: Car rental booking page powered by React (@wordpress/scripts).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="primary" class="primary-rentcar site-main bg-slate-50 min-h-screen">
	<div id="fluffy-booking-root" class="fluffy-react-root" data-mode="rentcar"></div>
</main>

<?php
get_footer();
