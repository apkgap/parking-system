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

		<div id="fluffy-auth-root" class="fluffy-react-root" data-mode="login"></div>

		<div id="fluffy-demo-credentials" class="fluffy-login__demo mt-5 flex items-center justify-between border-t border-[#E2E8F0] pt-4 text-xs text-[#64748B]">
			<span><?php yp_text( 'ทดลองใช้', 'Demo' ); ?></span>
			<span class="font-mono text-[#0F172A]">demo_staff / Demo@2026!</span>
		</div>
	</div>
</main>

<?php
get_footer();
