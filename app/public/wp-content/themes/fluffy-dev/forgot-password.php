<?php
/**
 * Template Name: Forgot Password Page
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="box-forgot-password" class="box-forgot-password min-h-screen bg-slate-100 py-12 px-4">
	<div class="mx-auto w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
		<div class="mb-6 text-center">
			<h1 class="text-3xl font-bold text-gray-900"><?php esc_html_e( 'Forgot Password?', 'fluffy' ); ?></h1>
			<p class="mt-1 text-sm text-gray-600"><?php esc_html_e( 'Enter your email to reset your password', 'fluffy' ); ?></p>
		</div>

		<div id="fluffy-auth-root" class="fluffy-react-root" data-mode="forgot-password"></div>
	</div>
</main>

<?php
get_footer();
