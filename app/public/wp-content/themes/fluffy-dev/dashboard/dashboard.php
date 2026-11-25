<?php 
require_once get_template_directory() . '/dashboard/driver-management/driver.php';
require_once get_template_directory() . '/dashboard/carrental-management/carrental.php';
require_once get_template_directory() . '/dashboard/transport-management/transport.php';
require_once get_template_directory() . '/dashboard/parking-management/parking.php';

function enqueue_dashboard_js() {
    wp_enqueue_script('parking-perday', get_template_directory_uri() . '/dashboard/js/parking-perday.js', array('jquery'), '1.0.0', true);
    wp_enqueue_script('parking-permonth', get_template_directory_uri() . '/dashboard/js/parking-permonth.js', array('jquery'), '1.0.0', true);
    wp_enqueue_script('parking-export', get_template_directory_uri() . '/dashboard/js/parking-export.js', array('jquery'), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_dashboard_js');
