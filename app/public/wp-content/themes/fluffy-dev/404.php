<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package fluffy
 */

get_header();
?>

<div class="error-404-page">
	<div class="error-404-container">
		<div class="error-404-bg">404</div>
		<div class="error-404-content">
			<h1 class="error-404-title"><?php esc_html_e( 'Page not found', 'fluffy' ); ?></h1>
			<p class="error-404-description"><?php esc_html_e( 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.', 'fluffy' ); ?></p>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="error-404-btn">
				<?php esc_html_e( 'Go To Home', 'fluffy' ); ?>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M3.33331 10H16.6666M16.6666 10L11.6666 5M16.6666 10L11.6666 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</a>
		</div>
	</div>
</div>

<style>
	.error-404-page {
		min-height:100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #e8f7fc 0%, #d4f1f9 100%);
		padding: 40px 20px;
	}

	.error-404-container {
		position: relative;
		width: 100%;
		max-width: 600px;
		text-align: center;
	}

	.error-404-bg {
		font-size: 300px;
		font-weight: 700;
		color: rgba(41, 178, 226, 0.08);
		line-height: 1;
		margin: -40px 0;
		letter-spacing: -20px;
	}

	.error-404-content {
		position: relative;
		z-index: 10;
	}

	.error-404-title {
		font-size: 36px;
		font-weight: 600;
		color: #2d3436;
		margin: 20px 0 15px;
	}

	.error-404-description {
		font-size: 16px;
		color: #b2bec3;
		margin: 0 0 30px;
		line-height: 1.6;
	}

	.error-404-btn {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 14px 32px;
		background: #29b2e2;
		color: white;
		text-decoration: none;
		border-radius: 50px;
		font-weight: 600;
		transition: all 0.3s ease;
		border: none;
		cursor: pointer;
	}

	.error-404-btn:hover {
		background: #1a9cc9;
		transform: translateX(5px);
	}

	.error-404-btn svg {
		width: 20px;
		height: 20px;
	}

	@media (max-width: 768px) {
		.error-404-bg {
			font-size: 150px;
			margin: -20px 0;
		}

		.error-404-title {
			font-size: 28px;
		}

		.error-404-description {
			font-size: 14px;
		}
	}
</style>

<?php
get_footer();
