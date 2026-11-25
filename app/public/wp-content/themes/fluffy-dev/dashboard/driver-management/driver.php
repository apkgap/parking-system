<?php
/**
 * REST API Route for Taxi Driver Post Type
 */

function enqueue_driver_js() {
    if (is_page('dashboard')) {
        wp_enqueue_script('driver', get_template_directory_uri() . '/dashboard/driver-management/js/driver.js', array(), false, true);
    }
}
add_action('wp_enqueue_scripts', 'enqueue_driver_js');


function register_taxi_driver_rest_routes() {
    register_rest_route('taxi/v1', '/drivers', array(
        'methods' => 'GET',
        'callback' => 'get_taxi_drivers',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('taxi/v1', '/drivers/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'get_taxi_driver',
        'permission_callback' => '__return_true',
    ));
    
    // เพิ่ม endpoint สำหรับการส่งออกข้อมูล
    register_rest_route('taxi/v1', '/drivers/export', array(
        'methods' => 'GET',
        'callback' => 'export_taxi_drivers',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('taxi/v1', '/drivers', array(
        'methods' => 'POST',
        'callback' => 'create_taxi_driver',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));

    register_rest_route('taxi/v1', '/drivers/(?P<id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'update_taxi_driver',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));

    register_rest_route('taxi/v1', '/drivers/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'delete_taxi_driver',
        'permission_callback' => function() {
            return current_user_can('delete_posts');
        },
    ));
}

add_action('rest_api_init', 'register_taxi_driver_rest_routes');

/**
 * Get all taxi drivers with pagination, search and filtering
 */
function get_taxi_drivers($request) {
    $page = $request->get_param('page') ? (int) $request->get_param('page') : 1;
    $per_page = $request->get_param('per_page') ? (int) $request->get_param('per_page') : 12;
    $search = $request->get_param('search');
    $status = $request->get_param('status');
    
    $args = array(
        'post_type' => 'taxi-driver',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'post_status' => 'publish',
    );
    
    // เพิ่มการเรียงลำดับตามพารามิเตอร์ orderby และ order
    $orderby = $request->get_param('orderby') ?: $request->get_param('sort');
    $order = $request->get_param('order') ? strtoupper($request->get_param('order')) : 'ASC';
    
    if (!empty($orderby)) {
        $orderby = sanitize_text_field($orderby);
        
        // จัดการกับการเรียงลำดับตามฟิลด์ต่างๆ
        switch ($orderby) {
            case 'id':
                $args['orderby'] = 'ID';
                $args['order'] = $order;
                break;
            case 'title': // ชื่อคนขับ (post title)
                $args['orderby'] = 'title';
                $args['order'] = $order;
                break;
            case 'driver_code':
                $args['meta_key'] = 'driver_code';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'driver_name':
                $args['meta_key'] = 'driver_name';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'phone':
                $args['meta_key'] = 'phone';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'work_status':
            case 'status':
                $args['meta_key'] = 'status';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'assigned_car':
            case 'vehicle':
                $args['meta_key'] = 'vehicle';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            case 'job_count':
                $args['meta_key'] = 'job_count';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            case 'completed_jobs':
                $args['meta_key'] = 'completed_jobs';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            default:
                $args['orderby'] = 'date';
                $args['order'] = 'DESC';
                break;
        }
    }
    
    // เพิ่มการค้นหาถ้ามีพารามิเตอร์ search
    if (!empty($search)) {
        $args['s'] = sanitize_text_field($search);
    }
    
    // เพิ่มการกรองตามสถานะถ้ามีพารามิเตอร์ status
    if (!empty($status)) {
        $args['meta_query'] = array(
            array(
                'key' => 'status',
                'value' => sanitize_text_field($status),
                'compare' => '='
            )
        );
    }

    $drivers_query = new WP_Query($args);
    $drivers = $drivers_query->posts;
    $total_drivers = $drivers_query->found_posts;
    $total_pages = ceil($total_drivers / $per_page);
    
    $data = array();
    foreach ($drivers as $driver) {
        $data[] = prepare_taxi_driver_response($driver);
    }
    
    $response = array(
        'data' => $data,
        'meta' => array(
            'current_page' => $page,
            'per_page' => $per_page,
            'total' => $total_drivers,
            'total_pages' => $total_pages,
        )
    );

    return new WP_REST_Response($response, 200);
}

/**
 * Get single taxi driver
 */
function get_taxi_driver($request) {
    $id = $request['id'];
    $driver = get_post($id);

    if (!$driver || $driver->post_type !== 'taxi-driver') {
        return new WP_Error('no_driver', 'Taxi driver not found', array('status' => 404));
    }

    return new WP_REST_Response(prepare_taxi_driver_response($driver), 200);
}

/**
 * Create new taxi driver
 */
function create_taxi_driver($request) {
    $params = $request->get_json_params();

    $driver_data = array(
        'post_type' => 'taxi-driver',
        'post_title' => sanitize_text_field($params['title']),
        'post_content' => wp_kses_post($params['content']),
        'post_status' => 'publish',
    );

    $driver_id = wp_insert_post($driver_data);

    if (is_wp_error($driver_id)) {
        return $driver_id;
    }

    return new WP_REST_Response(prepare_taxi_driver_response(get_post($driver_id)), 201);
}

/**
 * Update taxi driver
 */
function update_taxi_driver($request) {
    $id = $request['id'];
    $params = $request->get_json_params();

    $driver_data = array(
        'ID' => $id,
        'post_title' => sanitize_text_field($params['title']),
        'post_content' => wp_kses_post($params['content']),
    );

    $updated = wp_update_post($driver_data);

    if (is_wp_error($updated)) {
        return $updated;
    }

    return new WP_REST_Response(prepare_taxi_driver_response(get_post($id)), 200);
}

/**
 * Delete taxi driver
 */
function delete_taxi_driver($request) {
    $id = $request['id'];
    $result = wp_delete_post($id, true);

    if (!$result) {
        return new WP_Error('delete_failed', 'Failed to delete taxi driver', array('status' => 500));
    }

    return new WP_REST_Response(array('message' => 'Taxi driver deleted'), 200);
}

/**
 * Prepare taxi driver response data
 */
function prepare_taxi_driver_response($driver) {
    $data = array(
        'id' => $driver->ID,
        'title' => $driver->post_title,
    );

    // Clean ACF output with simple fallback
    // Extract all fields first
    $driver_code     = get_field('driver_code', $driver->ID);
    $driver_name     = get_field('driver_name', $driver->ID);
    $phone           = get_field('phone', $driver->ID);
    $job_count       = get_field('job_count', $driver->ID);
    $completed_jobs  = get_field('completed_jobs', $driver->ID);
    $vehicle         = get_field('vehicle', $driver->ID);

    // Normalize numeric fields early
    $job_count = (int) $job_count;
    $completed_jobs = (int) $completed_jobs;

    // Vehicle may be an object or array or null
    $vehicle_id    = null;
    $vehicle_title = '';
    $vehicle_slug  = '';
    if (is_object($vehicle)) {
        $vehicle_id    = isset($vehicle->ID) ? $vehicle->ID : null;
        $vehicle_title = isset($vehicle->post_title) ? $vehicle->post_title : '';
        $vehicle_slug  = isset($vehicle->post_name) ? $vehicle->post_name : '';
    } elseif (is_array($vehicle)) {
        $vehicle_id    = isset($vehicle['ID']) ? $vehicle['ID'] : null;
        $vehicle_title = isset($vehicle['post_title']) ? $vehicle['post_title'] : '';
        $vehicle_slug  = isset($vehicle['post_name']) ? $vehicle['post_name'] : '';
    }

    // Handle ACF Select Field - Status
    $work_status_object = get_field_object('status', $driver->ID);
    $work_status_value = get_field('status', $driver->ID); // Get the actual selected value
    
    $status_data = array(
        'value' => $work_status_value, // The selected value (e.g., 'working')
        'label' => '', // Will be populated below
        'choices' => array() // All available choices
    );
    
    if ($work_status_object && isset($work_status_object['choices'])) {
        $choices = $work_status_object['choices'];
        $status_data['choices'] = $choices;
        
        // Get the label for the selected value
        if ($work_status_value && isset($choices[$work_status_value])) {
            $status_data['label'] = $choices[$work_status_value];
        }
    }

    $acf = array(
        'driver_code'    => $driver_code,
        'driver_name'    => $driver_name,
        'phone'          => $phone,
        'status'         => $status_data, // Complete status information
        'vehicle_data'   => array(
            'id'    => $vehicle_id,
            'title' => $vehicle_title,
            'slug'  => $vehicle_slug,
        ),
        'job_count'      => $job_count,
        'completed_jobs' => $completed_jobs,
    );

    // Normalize numeric fields
    foreach (array('job_count', 'completed_jobs') as $numKey) {
        if (isset($acf[$numKey])) {
            $acf[$numKey] = (int) $acf[$numKey];
        }
    }

    $data['acf'] = $acf;

    return $data;
}
/**
 * Flush rewrite rules on activation
 */
function taxi_driver_rewrite_flush() {
    flush_rewrite_rules();
}

register_activation_hook(__FILE__, 'taxi_driver_rewrite_flush');

/**
 * Export taxi drivers data in various formats
 */
function export_taxi_drivers($request) {
    $format = $request->get_param('format') ? sanitize_text_field($request->get_param('format')) : 'excel';
    $search = $request->get_param('search');
    $status = $request->get_param('status');
    
    // ดึงข้อมูลทั้งหมดโดยไม่มีการแบ่งหน้า
    $args = array(
        'post_type' => 'taxi-driver',
        'posts_per_page' => -1,
        'post_status' => 'publish',
    );
    
    // เพิ่มการค้นหาถ้ามีพารามิเตอร์ search
    if (!empty($search)) {
        $args['s'] = sanitize_text_field($search);
    }
    
    // เพิ่มการกรองตามสถานะถ้ามีพารามิเตอร์ status
    if (!empty($status)) {
        $args['meta_query'] = array(
            array(
                'key' => 'status',
                'value' => sanitize_text_field($status),
                'compare' => '='
            )
        );
    }
    
    // เพิ่มการเรียงลำดับตามพารามิเตอร์ orderby และ order
    $orderby = $request->get_param('orderby') ?: $request->get_param('sort');
    $order = $request->get_param('order') ? strtoupper($request->get_param('order')) : 'ASC';
    
    if (!empty($orderby)) {
        $orderby = sanitize_text_field($orderby);
        
        // จัดการกับการเรียงลำดับตามฟิลด์ต่างๆ
        switch ($orderby) {
            case 'id':
                $args['orderby'] = 'ID';
                $args['order'] = $order;
                break;
            case 'title': // ชื่อคนขับ (post title)
                $args['orderby'] = 'title';
                $args['order'] = $order;
                break;
            case 'driver_code':
                $args['meta_key'] = 'driver_code';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'driver_name':
                $args['meta_key'] = 'driver_name';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'phone':
                $args['meta_key'] = 'phone';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'work_status':
            case 'status':
                $args['meta_key'] = 'status';
                $args['orderby'] = 'meta_value';
                $args['order'] = $order;
                break;
            case 'assigned_car':
            case 'vehicle':
                $args['meta_key'] = 'vehicle';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            case 'job_count':
                $args['meta_key'] = 'job_count';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            case 'completed_jobs':
                $args['meta_key'] = 'completed_jobs';
                $args['orderby'] = 'meta_value_num';
                $args['order'] = $order;
                break;
            default:
                $args['orderby'] = 'date';
                $args['order'] = 'DESC';
                break;
        }
    }
    
    $drivers_query = new WP_Query($args);
    $drivers = $drivers_query->posts;
    
    $data = array();
    foreach ($drivers as $driver) {
        $data[] = prepare_taxi_driver_response($driver);
    }
    
    // ตรวจสอบรูปแบบการส่งออกและส่งออกข้อมูลตามรูปแบบที่ต้องการ
    switch ($format) {
        case 'excel':
            return export_to_excel($data);
        case 'pdf':
            return export_to_pdf($data);
        case 'csv':
            return export_to_csv($data);
        default:
            return new WP_REST_Response(array('error' => 'Unsupported export format'), 400);
    }
}

/**
 * Export data to Excel format
 */
function export_to_excel($data) {
    // ในสถานการณ์จริง คุณควรใช้ไลบรารีเช่น PhpSpreadsheet เพื่อสร้างไฟล์ Excel
    // แต่สำหรับตัวอย่างนี้ เราจะส่งกลับ CSV ที่สามารถเปิดได้ใน Excel
    
    $filename = 'taxi-drivers-' . date('Y-m-d') . '.xlsx';
    
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: max-age=0');
    
    $output = fopen('php://output', 'w');
    
    // หัวตาราง
    fputcsv($output, array('รหัสคนขับ', 'ชื่อคนขับ', 'เบอร์โทร', 'สถานะ', 'รถ', 'จำนวนงาน', 'งานที่เสร็จสิ้น'));
    
    // ข้อมูล
    foreach ($data as $row) {
        $acf = $row['acf'];
        $vehicle_title = isset($acf['vehicle_data']['title']) ? $acf['vehicle_data']['title'] : '-';
        
        fputcsv($output, array(
            $acf['driver_code'],
            $acf['driver_name'],
            $acf['phone'],
            isset($acf['status']) ? $acf['status'] : $acf['status'],
            $vehicle_title,
            $acf['job_count'],
            $acf['completed_jobs']
        ));
    }
    
    fclose($output);
    exit;
}

/**
 * Export data to PDF format
 */
function export_to_pdf($data) {
    // ในสถานการณ์จริง คุณควรใช้ไลบรารีเช่น TCPDF หรือ mPDF เพื่อสร้างไฟล์ PDF
    // แต่สำหรับตัวอย่างนี้ เราจะส่งกลับข้อความแจ้งว่าต้องติดตั้งไลบรารี
    
    $filename = 'taxi-drivers-' . date('Y-m-d') . '.pdf';
    
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    // ในสถานการณ์จริง คุณควรสร้าง PDF ที่นี่
    echo 'PDF Export Placeholder - ต้องติดตั้งไลบรารี TCPDF หรือ mPDF';
    exit;
}

/**
 * Export data to CSV format
 */
function export_to_csv($data) {
    $filename = 'taxi-drivers-' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // เพิ่ม BOM สำหรับการรองรับ UTF-8 ใน Excel
    fputs($output, "\xEF\xBB\xBF");
    
    // หัวตาราง
    fputcsv($output, array('รหัสคนขับ', 'ชื่อคนขับ', 'เบอร์โทร', 'สถานะ', 'รถ', 'จำนวนงาน', 'งานที่เสร็จสิ้น'));
    
    // ข้อมูล
    foreach ($data as $row) {
        $acf = $row['acf'];
        $vehicle_title = isset($acf['vehicle_data']['title']) ? $acf['vehicle_data']['title'] : '-';
        
        fputcsv($output, array(
            $acf['driver_code'],
            $acf['driver_name'],
            $acf['phone'],
            isset($acf['status']) ? $acf['status'] : $acf['status'],
            $vehicle_title,
            $acf['job_count'],
            $acf['completed_jobs']
        ));
    }
    
    fclose($output);
    exit;
}
