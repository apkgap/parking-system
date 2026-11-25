<?php
/**
 * Front page template:
 * - Logged-in user: redirect directly to /dashboard/
 * - Guest: Login UI (#fluffy-auth-root)
 *
 * @package fluffy
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

nocache_headers();

if ( is_user_logged_in() ) {
	wp_safe_redirect( home_url( '/dashboard/' ) );
	exit;
}

get_header();
?>

<main id="box-login" class="fluffy-login box-login min-h-screen bg-[#F8FAFC] py-12 px-4">
	<div id="fluffy-login-card" class="fluffy-login__card mx-auto w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-8">
		<div class="mb-6 text-center">
			<h1 class="m-0 text-2xl font-bold text-[#0F172A]"><?php yp_text( 'เข้าสู่ระบบ', 'Welcome Back' ); ?></h1>
			<p class="mt-1 text-sm text-[#64748B]"><?php yp_text( 'เข้าสู่ระบบเพื่อจัดการการจองและแดชบอร์ด', 'Please sign in to your account' ); ?></p>
		</div>

		<?php if ( shortcode_exists( 'nextend_social_login' ) ) : ?>
			<div class="wpt-social-login mb-6">
				<div class="sh">
					<?php echo do_shortcode( '[nextend_social_login style="icon" redirect="' . esc_url( home_url( '/dashboard/' ) ) . '"]' ); ?>
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
