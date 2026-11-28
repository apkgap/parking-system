<?php
/**
 * The header for Fluffy Parking & Car Rental theme
 *
 * @package fluffy
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$is_logged_in       = is_user_logged_in();
$current_user       = $is_logged_in ? wp_get_current_user() : null;
$user_roles         = $current_user ? (array) $current_user->roles : array();
$is_privileged_user = in_array( 'administrator', $user_roles, true ) || in_array( 'service-customer', $user_roles, true );
$user_initials      = $current_user ? strtoupper( mb_substr( (string) $current_user->display_name, 0, 2 ) ) : '';
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class( 'fluffy-body bg-[#F8FAFC] text-[#0F172A] antialiased' ); ?> style="font-family: 'Inter', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif;">
<?php wp_body_open(); ?>
<div id="page" class="fluffy-site site flex min-h-screen flex-col bg-[#F8FAFC]">
	<a id="fluffy-skip-link" class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'fluffy' ); ?></a>

	<header id="masthead" class="fluffy-header sticky top-0 z-40 border-b border-[#E2E8F0] bg-white">
		<div id="fluffy-header-inner" class="fluffy-header__inner mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
			<!-- Brand -->
			<div id="fluffy-header-brand" class="fluffy-header__brand flex items-center">
				<a id="fluffy-brand-link" class="fluffy-header__brand-name inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#0F172A] no-underline" href="<?php echo esc_url( home_url( '/' ) ); ?>">
					<img src="<?php echo esc_url( get_template_directory_uri() . '/customize/img/brand-logo.svg' ); ?>" alt="Parking System" class="h-8 w-8 rounded-lg">
				</a>
			</div>

			<!-- Desktop Navigation -->
			<nav id="site-navigation" class="fluffy-header__nav hidden items-center md:flex" aria-label="<?php esc_attr_e( 'Primary Navigation', 'fluffy' ); ?>">
				<?php
				if ( has_nav_menu( 'primary' ) ) {
					wp_nav_menu(
						array(
							'theme_location' => 'primary',
							'menu_id'        => 'primary-menu',
							'container'      => false,
							'menu_class'     => 'fluffy-header__menu m-0 flex list-none items-center gap-1 p-0 [&_a]:block [&_a]:rounded-lg [&_a]:px-3.5 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-[#0F172A] [&_a]:no-underline [&_a]:transition [&_a]:duration-150 [&_a:hover]:bg-[#F8FAFC] [&_a:hover]:text-[#29B2E2] [&_.current-menu-item>a]:text-[#29B2E2]',
						)
					);
				}
				?>
			</nav>

			<!-- Right Actions -->
			<div id="fluffy-header-actions" class="fluffy-header__actions flex items-center gap-3">
				<?php if ( function_exists( 'polylang_slink' ) ) : ?>
					<div id="fluffy-lang-switcher" class="fluffy-header__lang hidden items-center text-xs font-medium text-[#64748B] sm:flex">
						<?php polylang_slink(); ?>
					</div>
				<?php endif; ?>

				<?php if ( $is_logged_in && $current_user ) : ?>
					<div id="fluffy-user-menu" class="fluffy-header__user-menu relative">
						<button id="fluffy-user-menu-trigger" class="fluffy-header__user-trigger flex cursor-pointer items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-sm font-medium text-[#0F172A] transition duration-150 hover:border-[#CBD5E1] hover:bg-[#F8FAFC]" type="button" aria-expanded="false" aria-controls="fluffy-user-dropdown">
							<span class="fluffy-header__avatar flex h-7 w-7 items-center justify-center rounded-full bg-[#E6F7FD] text-xs font-semibold text-[#29B2E2]">
								<?php echo esc_html( $user_initials ); ?>
							</span>
							<span class="fluffy-header__username hidden max-w-[120px] truncate sm:inline"><?php echo esc_html( $current_user->display_name ); ?></span>
							<svg class="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						<div id="fluffy-user-dropdown" class="fluffy-header__dropdown hidden absolute right-0 z-50 mt-2 w-56 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-md">
							<div class="fluffy-header__dropdown-head border-b border-[#E2E8F0] px-3 py-2">
								<p class="m-0 truncate text-sm font-semibold text-[#0F172A]"><?php echo esc_html( $current_user->display_name ); ?></p>
								<p class="m-0 truncate text-xs text-[#64748B]"><?php echo esc_html( $current_user->user_email ); ?></p>
							</div>
							<a href="<?php echo esc_url( home_url( '/profile/' ) ); ?>" class="fluffy-header__dropdown-link mt-1 block rounded-lg px-3 py-2 text-sm text-[#0F172A] no-underline transition hover:bg-[#F8FAFC] hover:text-[#29B2E2]">
								<?php yp_text( 'โปรไฟล์และการจองของฉัน', 'My Profile & Bookings' ); ?>
							</a>
							<?php if ( $is_privileged_user ) : ?>
								<a href="<?php echo esc_url( home_url( '/dashboard/' ) ); ?>" class="fluffy-header__dropdown-link block rounded-lg px-3 py-2 text-sm text-[#0F172A] no-underline transition hover:bg-[#F8FAFC] hover:text-[#29B2E2]">
									<?php yp_text( 'แดชบอร์ดจัดการ', 'Admin Dashboard' ); ?>
								</a>
								<a href="<?php echo esc_url( home_url( '/service/' ) ); ?>" class="fluffy-header__dropdown-link block rounded-lg px-3 py-2 text-sm text-[#0F172A] no-underline transition hover:bg-[#F8FAFC] hover:text-[#29B2E2]">
									<?php yp_text( 'ควบคุมบริการ', 'Service Control' ); ?>
								</a>
								<a href="<?php echo esc_url( home_url( '/create-driver-job/' ) ); ?>" class="fluffy-header__dropdown-link block rounded-lg px-3 py-2 text-sm text-[#0F172A] no-underline transition hover:bg-[#F8FAFC] hover:text-[#29B2E2]">
									<?php yp_text( 'สร้างงานคนขับ', 'Create Driver Job' ); ?>
								</a>
							<?php endif; ?>
							<div class="fluffy-header__dropdown-foot mt-1 border-t border-[#E2E8F0] pt-1">
								<a href="<?php echo esc_url( wp_logout_url( home_url( '/' ) ) ); ?>" class="fluffy-header__logout block rounded-lg px-3 py-2 text-sm font-medium text-red-600 no-underline transition hover:bg-red-50">
									<?php yp_text( 'ออกจากระบบ', 'Logout' ); ?>
								</a>
							</div>
						</div>
					</div>
				<?php else : ?>
					<a id="fluffy-header-login" class="fluffy-header__btn-login hidden rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-sm font-medium text-[#0F172A] no-underline transition duration-150 hover:bg-[#F8FAFC] sm:inline-flex" href="<?php echo esc_url( home_url( '/login/' ) ); ?>">
						<?php yp_text( 'เข้าสู่ระบบ', 'Sign In' ); ?>
					</a>
					<a id="fluffy-header-register" class="fluffy-header__btn-register inline-flex rounded-lg bg-[#29B2E2] px-3.5 py-2 text-sm font-semibold text-white no-underline transition duration-150 hover:bg-[#1E9BC7]" href="<?php echo esc_url( home_url( '/register/' ) ); ?>">
						<?php yp_text( 'สมัครสมาชิก', 'Register' ); ?>
					</a>
				<?php endif; ?>

				<!-- Mobile Menu -->
				<div id="fluffy-mobile-menu" class="fluffy-header__mobile relative md:hidden">
					<button id="fluffy-mobile-trigger" class="fluffy-header__mobile-trigger flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] transition hover:bg-[#F8FAFC]" type="button" aria-expanded="false" aria-controls="fluffy-mobile-drawer" aria-label="<?php esc_attr_e( 'Toggle menu', 'fluffy' ); ?>">
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
					<div id="fluffy-mobile-drawer" class="fluffy-header__mobile-drawer hidden absolute right-0 z-50 mt-2 w-64 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-md">
						<?php
						if ( has_nav_menu( 'mobile' ) ) {
							wp_nav_menu(
								array(
									'theme_location' => 'mobile',
									'menu_id'        => 'mobile-menu',
									'container'      => false,
									'menu_class'     => 'fluffy-header__mobile-list m-0 list-none space-y-1 p-0 [&_a]:block [&_a]:rounded-lg [&_a]:px-3 [&_a]:py-2.5 [&_a]:text-sm [&_a]:font-medium [&_a]:text-[#0F172A] [&_a]:no-underline [&_a:hover]:bg-[#F8FAFC] [&_a:hover]:text-[#29B2E2]',
								)
							);
						}
						?>
						<?php if ( ! $is_logged_in ) : ?>
							<div class="mt-2 border-t border-[#E2E8F0] pt-2">
								<a href="<?php echo esc_url( home_url( '/login/' ) ); ?>" class="block rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] no-underline hover:bg-[#F8FAFC]">
									<?php yp_text( 'เข้าสู่ระบบ', 'Sign In' ); ?>
								</a>
							</div>
						<?php endif; ?>
					</div>
				</div>
			</div>
		</div>
	</header>
