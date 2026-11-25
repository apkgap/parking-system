<?php
/**
 * Template Name: Login Page
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="box-login" class="box-login min-h-screen bg-slate-100 py-12 px-4">
	<div class="mx-auto w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
		<div class="mb-6 text-center">
			<h1 class="text-3xl font-bold text-gray-900"><?php esc_html_e( 'Welcome Back', 'fluffy' ); ?></h1>
			<p class="mt-1 text-sm text-gray-600"><?php esc_html_e( 'Please sign in to your account', 'fluffy' ); ?></p>
		</div>

		<?php if ( ! is_user_logged_in() && shortcode_exists( 'nextend_social_login' ) ) : ?>
			<div class="wpt-social-login mb-6">
				<div class="sh">
					<?php echo do_shortcode( '[nextend_social_login style="icon" redirect="' . esc_url( home_url( '/' ) ) . '"]' ); ?>
				</div>
				<div class="divider">
					<span><?php yp_text( 'หรือเข้าสู่ระบบด้วย', 'Or Login With' ); ?></span>
				</div>
			</div>
		<?php endif; ?>

		<div id="fluffy-auth-root" class="fluffy-react-root" data-mode="login"></div>
	</div>
</main>

<?php
get_footer();
