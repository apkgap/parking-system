<?php
/**
 * Easy Digital Downloads Theme Updater
 *
 * @package fluffy
 */

// Includes the files needed for the theme updater
if ( !class_exists( 'EDD_Theme_Updater_Admin' ) ) {
	include( dirname( __FILE__ ) . '/theme-updater-admin.php' );
}

// Loads the updater classes
$updater = new EDD_Theme_Updater_Admin(

	// Config settings
	$config = array(
		'remote_api_url' => 'https://vecular.co', // Site where EDD is hosted
		'item_name'      => 'Fluffy Theme ธีมเวิร์ดเพรส (WordPress) ที่เบามาก', // Name of theme
		'theme_slug'     => 'fluffy', // Theme slug
		'version'        => '1.0.0', // The current version of this theme
		'author'         => 'YourPlans', // The author of this theme
		'download_id'    => '', // Optional, used for generating a license renewal link
		'renew_url'      => '', // Optional, allows for a custom license renewal link
		'beta'           => false, // Optional, set to true to opt into beta versions
	),

	// Strings
	$strings = array(
		'theme-license'             => __( 'Theme License', 'fluffy' ),
		'enter-key'                 => __( 'Enter fluffy theme license key. You can find from <a href="https://vecular.co/my-account/" target="_blank">Account Page</a>.', 'fluffy' ),
		'license-key'               => __( 'License Key', 'fluffy' ),
		'license-action'            => __( 'License Action', 'fluffy' ),
		'deactivate-license'        => __( 'Deactivate License', 'fluffy' ),
		'activate-license'          => __( 'Activate License', 'fluffy' ),
		'status-unknown'            => __( 'License status is unknown.', 'fluffy' ),
		'renew'                     => __( 'Renew?', 'fluffy' ),
		'unlimited'                 => __( 'unlimited', 'fluffy' ),
		'license-key-is-active'     => __( 'License key is active.', 'fluffy' ),
		'expires%s'                 => __( 'Expires %s.', 'fluffy' ),
		'expires-never'             => __( 'Lifetime License.', 'fluffy' ),
		'%1$s/%2$-sites'            => __( 'You have %1$s / %2$s sites activated.', 'fluffy' ),
		'license-key-expired-%s'    => __( 'License key expired %s.', 'fluffy' ),
		'license-key-expired'       => __( 'License key has expired.', 'fluffy' ),
		'license-keys-do-not-match' => __( 'License keys do not match.', 'fluffy' ),
		'license-is-inactive'       => __( 'License is inactive.', 'fluffy' ),
		'license-key-is-disabled'   => __( 'License key is disabled.', 'fluffy' ),
		'site-is-inactive'          => __( 'Site is inactive.', 'fluffy' ),
		'license-status-unknown'    => __( 'License status is unknown.', 'fluffy' ),
		'update-notice'             => __( "Updating this theme will lose any customizations you have made. 'Cancel' to stop, 'OK' to update.", 'fluffy' ),
		'update-available'          => __( '<strong>%1$s %2$s</strong> is available. <a href="%3$s" class="thickbox" title="%4s">Check out what\'s new</a> or <a href="%5$s"%6$s>update now</a>.', 'fluffy' ),
	)

);
