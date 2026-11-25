<?php
/**
 * Template Name: Register Page
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="box-register" class="box-register min-h-screen bg-slate-100 py-12 px-4">
	<div class="mx-auto w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
		<div class="mb-6 text-center">
			<h1 class="text-3xl font-bold text-gray-900"><?php esc_html_e( 'Create Account', 'fluffy' ); ?></h1>
			<p class="mt-1 text-sm text-gray-600"><?php yp_text( 'สมัครสมาชิกเพื่อจองที่จอดรถและเช่ารถ', 'Sign up to manage your bookings' ); ?></p>
		</div>

		<div id="fluffy-auth-root" class="fluffy-react-root" data-mode="register"></div>
	</div>
</main>

<?php
get_footer();
