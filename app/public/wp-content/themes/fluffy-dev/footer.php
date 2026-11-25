<?php
/**
 * The template for displaying the footer
 *
 * @package fluffy
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$footer_logo = function_exists( 'get_field' ) ? get_field( 'logo_footer', 'option' ) : null;
$footer_info = function_exists( 'get_field' ) ? (string) get_field( 'footer_info', 'option' ) : '';
?>
	<footer id="colophon" class="fluffy-footer mt-auto border-t border-[#E2E8F0] bg-white">
		<div id="fluffy-footer-inner" class="fluffy-footer__inner mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div id="fluffy-footer-grid" class="fluffy-footer__grid grid gap-8 md:grid-cols-12">
				<!-- Brand & Description -->
				<div id="fluffy-footer-brand" class="fluffy-footer__brand md:col-span-5">
					<div class="fluffy-footer__logo mb-3">
						<?php if ( is_array( $footer_logo ) && ! empty( $footer_logo['url'] ) ) : ?>
							<img src="<?php echo esc_url( $footer_logo['url'] ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" class="h-9 w-auto">
						<?php elseif ( has_custom_logo() ) : ?>
							<div class="[&_img]:h-9 [&_img]:w-auto">
								<?php the_custom_logo(); ?>
							</div>
						<?php else : ?>
							<a id="fluffy-footer-brand-link" class="fluffy-footer__brand-name text-lg font-bold text-[#0F172A] no-underline" href="<?php echo esc_url( home_url( '/' ) ); ?>">
								<?php echo esc_html( get_bloginfo( 'name' ) ); ?>
							</a>
						<?php endif; ?>
					</div>
					<p class="fluffy-footer__desc max-w-sm text-sm leading-relaxed text-[#64748B]">
						<?php
						if ( '' !== trim( $footer_info ) ) {
							echo esc_html( $footer_info );
						} else {
							yp_text(
								'ระบบจองที่จอดรถสนามบินและบริการเช่ารถพร้อมคนขับ สะดวก ปลอดภัย และตรวจสอบสถานะการจองได้แบบเรียลไทม์',
								'Airport parking reservation and private car service with real-time booking management.'
							);
						}
						?>
					</p>
				</div>

				<!-- Services Column -->
				<div id="fluffy-footer-services" class="fluffy-footer__col md:col-span-3">
					<h3 class="fluffy-footer__heading mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
						<?php yp_text( 'บริการจองรถ', 'Booking Services' ); ?>
					</h3>
					<ul class="fluffy-footer__list m-0 list-none space-y-2.5 p-0 text-sm">
						<li>
							<a href="<?php echo esc_url( home_url( '/carpark/' ) ); ?>" class="fluffy-footer__link text-[#64748B] no-underline transition hover:text-[#4169F7]">
								<?php yp_text( 'จองที่จอดรถสนามบิน', 'Airport Parking' ); ?>
							</a>
						</li>
						<li>
							<a href="<?php echo esc_url( home_url( '/carrent/' ) ); ?>" class="fluffy-footer__link text-[#64748B] no-underline transition hover:text-[#4169F7]">
								<?php yp_text( 'จองรถเช่าพร้อมคนขับ', 'Private Car Rental' ); ?>
							</a>
						</li>
						<li>
							<a href="<?php echo esc_url( home_url( '/checkout/' ) ); ?>" class="fluffy-footer__link text-[#64748B] no-underline transition hover:text-[#4169F7]">
								<?php yp_text( 'ชำระเงิน', 'Checkout' ); ?>
							</a>
						</li>
					</ul>
				</div>

				<!-- Member Column -->
				<div id="fluffy-footer-account" class="fluffy-footer__col md:col-span-2">
					<h3 class="fluffy-footer__heading mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
						<?php yp_text( 'บัญชีผู้ใช้', 'Account' ); ?>
					</h3>
					<ul class="fluffy-footer__list m-0 list-none space-y-2.5 p-0 text-sm">
						<li>
							<a href="<?php echo esc_url( home_url( '/profile/' ) ); ?>" class="fluffy-footer__link text-[#64748B] no-underline transition hover:text-[#4169F7]">
								<?php yp_text( 'ประวัติการจอง', 'My Bookings' ); ?>
							</a>
						</li>
						<li>
							<a href="<?php echo esc_url( home_url( '/login/' ) ); ?>" class="fluffy-footer__link text-[#64748B] no-underline transition hover:text-[#4169F7]">
								<?php yp_text( 'เข้าสู่ระบบ', 'Sign In' ); ?>
							</a>
						</li>
						<li>
							<a href="<?php echo esc_url( home_url( '/register/' ) ); ?>" class="fluffy-footer__link text-[#64748B] no-underline transition hover:text-[#4169F7]">
								<?php yp_text( 'สมัครสมาชิก', 'Register' ); ?>
							</a>
						</li>
					</ul>
				</div>

				<!-- Operations Column -->
				<div id="fluffy-footer-ops" class="fluffy-footer__col md:col-span-2">
					<h3 class="fluffy-footer__heading mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
						<?php yp_text( 'ระบบจัดการ', 'Operations' ); ?>
					</h3>
					<ul class="fluffy-footer__list m-0 list-none space-y-2.5 p-0 text-sm">
						<li>
							<a href="<?php echo esc_url( home_url( '/check-in/' ) ); ?>" class="fluffy-footer__link text-[#64748B] no-underline transition hover:text-[#4169F7]">
								<?php yp_text( 'สแกน QR Check-in', 'QR Check-in' ); ?>
							</a>
						</li>
						<li>
							<a href="<?php echo esc_url( home_url( '/check-out/' ) ); ?>" class="fluffy-footer__link text-[#64748B] no-underline transition hover:text-[#4169F7]">
								<?php yp_text( 'สแกน QR Check-out', 'QR Check-out' ); ?>
							</a>
						</li>
						<li>
							<a href="<?php echo esc_url( home_url( '/dashboard/' ) ); ?>" class="fluffy-footer__link text-[#64748B] no-underline transition hover:text-[#4169F7]">
								<?php yp_text( 'แดชบอร์ด', 'Dashboard' ); ?>
							</a>
						</li>
					</ul>
				</div>
			</div>

			<!-- Bottom Bar -->
			<div id="fluffy-footer-bottom" class="fluffy-footer__bottom mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#E2E8F0] pt-6 sm:flex-row">
				<p class="fluffy-footer__copyright m-0 text-xs text-[#64748B]">
					&copy; <?php echo esc_html( gmdate( 'Y' ) . ' ' . get_bloginfo( 'name' ) ); ?>. <?php yp_text( 'สงวนลิขสิทธิ์', 'All rights reserved.' ); ?>
				</p>
				<div id="fluffy-footer-social" class="fluffy-footer__social flex items-center gap-3 text-xs text-[#64748B]">
					<?php echo do_shortcode( '[social_list]' ); ?>
				</div>
			</div>
		</div>
	</footer>
</div><!-- #page -->

<?php wp_footer(); ?>
</body>
</html>
