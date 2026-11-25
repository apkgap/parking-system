<?php
/**
 * fluffy Theme Customizer
 *
 * @package fluffy
 */

/**
 * Add postMessage support for site title and description for the Theme Customizer.
 *
 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
 */
function fluffy_customize_register( $wp_customize ) {
	$wp_customize->get_setting( 'blogname' )->transport         = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport  = 'postMessage';
	$wp_customize->get_setting( 'header_textcolor' )->transport = 'postMessage';

	if ( isset( $wp_customize->selective_refresh ) ) {
		$wp_customize->selective_refresh->add_partial(
			'blogname',
			array(
				'selector'        => '.site-title a',
				'render_callback' => 'fluffy_customize_partial_blogname',
			)
		);
		$wp_customize->selective_refresh->add_partial(
			'blogdescription',
			array(
				'selector'        => '.site-description',
				'render_callback' => 'fluffy_customize_partial_blogdescription',
			)
		);
	}

	// Booking settings section
	$wp_customize->add_section( 'fluffy_booking_settings', array(
		'title'    => __( 'Booking Settings', 'fluffy' ),
		'priority' => 160,
	) );

	// Passenger extra fee notice setting
	$wp_customize->add_setting( 'passenger_extra_fee_notice', array(
		'default'           => "ในกรณี ผู้โดยสารเกิน 4 ท่าน ตั้งแต่ท่านที่ 5 ขออนุญาตคิดค่าบริการรับ-ส่ง เพิ่มท่านละ 100 บาท (เด็กไม่คิดเพิ่ม) โดยชำระกับแอดมิน Line: @okparking24",
		'sanitize_callback' => 'wp_kses_post',
	) );

	$wp_customize->add_control( 'passenger_extra_fee_notice', array(
		'label'    => __( 'Passenger extra fee notice', 'fluffy' ),
		'section'  => 'fluffy_booking_settings',
		'settings' => 'passenger_extra_fee_notice',
		'type'     => 'textarea',
	) );
}
add_action( 'customize_register', 'fluffy_customize_register' );

/**
 * Render the site title for the selective refresh partial.
 *
 * @return void
 */
function fluffy_customize_partial_blogname() {
	bloginfo( 'name' );
}

/**
 * Render the site tagline for the selective refresh partial.
 *
 * @return void
 */
function fluffy_customize_partial_blogdescription() {
	bloginfo( 'description' );
}

/**
 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
 */
function fluffy_customize_preview_js() {
	wp_enqueue_script( 'fluffy-customizer', get_template_directory_uri() . '/js/customizer.js', array( 'customize-preview' ), _S_VERSION, true );
}
add_action( 'customize_preview_init', 'fluffy_customize_preview_js' );
