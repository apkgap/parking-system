<?php
/**
 * Template Name: Payment Complete
 * Handles server-side 2C2P HMAC-SHA256 verification and renders clean SaaS result UI.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$status_type = 'warning';
$heading     = 'No Payment Information';
$message     = 'No payment response data was received.';
$invoice_no  = '';

$secret_key = function_exists( 'get_field' ) ? (string) get_field( '2c2p_secret_key', 'option' ) : '';

if ( isset( $_REQUEST['paymentResponse'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$raw_response = sanitize_text_field( wp_unslash( $_REQUEST['paymentResponse'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$decoded_xml  = base64_decode( $raw_response, true );
	$xml_object   = is_string( $decoded_xml ) ? simplexml_load_string( $decoded_xml ) : false;

	if ( $xml_object && isset( $xml_object->payload, $xml_object->signature ) ) {
		$payload_xml    = base64_decode( (string) $xml_object->payload, true );
		$signature_xml  = strtoupper( (string) $xml_object->signature );
		$signature_hash = strtoupper( hash_hmac( 'sha256', base64_encode( (string) $payload_xml ), $secret_key, false ) );

		if ( hash_equals( $signature_hash, $signature_xml ) ) {
			$payload_obj = is_string( $payload_xml ) ? simplexml_load_string( $payload_xml ) : false;
			if ( $payload_obj ) {
				$payment_status = (string) $payload_obj->respCode;
				$invoice_no     = (string) $payload_obj->invoiceNo;
				$resp_desc      = (string) $payload_obj->respDesc;

				if ( '0000' === $payment_status ) {
					$status_type = 'success';
					$heading     = 'Payment Successful';
					$message     = 'Your payment has been confirmed. Thank you.';
				} else {
					$status_type = 'error';
					$heading     = 'Payment Failed';
					$message     = $resp_desc ?: 'Your payment could not be processed.';
				}
			} else {
				$status_type = 'error';
				$heading     = 'Payload Error';
				$message     = 'Could not parse payment payload.';
			}
		} else {
			$status_type = 'error';
			$heading     = 'Security Verification Failed';
			$message     = 'Invalid payment response signature.';
		}
	} else {
		$status_type = 'error';
		$heading     = 'Response Error';
		$message     = 'Could not parse payment response.';
	}
}

get_header();
?>

<main id="primary" class="fluffy-payment-complete site-main bg-[#F8FAFC] py-12 px-4">
	<div id="fluffy-payment-card" class="fluffy-payment-complete__card mx-auto max-w-lg rounded-xl border border-[#E2E8F0] bg-white p-8 text-center">
		<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full <?php echo 'success' === $status_type ? 'bg-emerald-50 text-emerald-600' : ( 'error' === $status_type ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600' ); ?> text-2xl font-bold">
			<?php echo 'success' === $status_type ? '✓' : '!'; ?>
		</div>
		<h1 class="m-0 text-2xl font-bold text-[#0F172A]"><?php echo esc_html( $heading ); ?></h1>
		<p class="mt-2 text-sm text-[#64748B]"><?php echo esc_html( $message ); ?></p>

		<?php if ( '' !== $invoice_no ) : ?>
			<div id="fluffy-payment-invoice" class="fluffy-payment-complete__invoice my-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm">
				<span class="text-[#64748B]">Invoice: </span>
				<strong class="text-[#0F172A]"><?php echo esc_html( $invoice_no ); ?></strong>
			</div>
		<?php endif; ?>

		<div class="mt-6 flex justify-center gap-3">
			<a id="fluffy-payment-return" class="fluffy-payment-complete__btn inline-flex rounded-lg bg-[#29B2E2] px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[#1E9BC7]" href="<?php echo esc_url( home_url( '/service/' ) ); ?>">
				<?php yp_text( 'กลับหน้าควบคุมบริการ', 'Return to Service Control' ); ?>
			</a>
		</div>
	</div>
</main>

<?php
get_footer();
