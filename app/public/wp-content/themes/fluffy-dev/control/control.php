<?php
function control_enq() {
    $css_file = get_template_directory() . '/control/css/control.css';
    $js_file = get_template_directory() . '/control/js/control.js';

    $css_version = filemtime($css_file);
    $js_version = filemtime($js_file);

    wp_enqueue_style('control-styles', get_template_directory_uri() . '/control/css/control.css', array(), $css_version);
    wp_enqueue_script('control-script', get_template_directory_uri() . '/control/js/control.js', array('jquery'), $js_version, true);
}
add_action('wp_enqueue_scripts', 'control_enq');