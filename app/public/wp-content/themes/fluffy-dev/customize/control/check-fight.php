<?php
if ( ! defined('FLIGHTAPI_KEY') ) {
    define('FLIGHTAPI_KEY', '68ff7022db3c871ea156b691');
}

add_action('wp_enqueue_scripts', function () {
    wp_register_script('flight-search-dummy', false);
    wp_enqueue_script('flight-search-dummy');

    wp_enqueue_script(
        'flight-lookup',
        get_stylesheet_directory_uri() . '/customize/js/aviationstack/flight-lookup.js',
        ['jquery', 'jquery-ui-autocomplete'],
        '1.0.3',
        true
    );

    wp_localize_script('flight-lookup', 'akpFlightSearch', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('akp_flight_nonce'),
    ]);
});

add_action('wp_ajax_akp_flight_search',        'theme_flight_search_handler');
add_action('wp_ajax_nopriv_akp_flight_search', 'theme_flight_search_handler');

function theme_flight_search_handler() {
    check_ajax_referer('akp_flight_nonce');

    $api_key = FLIGHTAPI_KEY;
    
    if (empty($api_key)) {
        wp_send_json(['flights' => [], 'more' => false, 'error' => 'missing_api_key']);
    }

    // Parse flight IATA code to extract airline and flight number
    $flight_iata = isset($_POST['flight_iata']) ? sanitize_text_field(wp_unslash($_POST['flight_iata'])) : '';
    
    if (empty($flight_iata)) {
        wp_send_json(['flights' => [], 'more' => false, 'error' => 'missing_flight_code']);
    }
    
    // Convert to uppercase and trim
    $flight_iata = strtoupper(trim($flight_iata));
    
    // Extract airline code (first 2-3 letters) and flight number
    // Allow partial input for autocomplete (e.g., "TG" or "TG6" or "TG639")
    if (preg_match('/^([A-Z]{2,3})(\d*)$/', $flight_iata, $matches)) {
        $airline_code = $matches[1];
        $flight_number = $matches[2];
        
        // If no flight number provided, return error
        if (empty($flight_number)) {
            wp_send_json(['flights' => [], 'more' => false, 'error' => 'invalid_flight_format', 'message' => 'กรุณาระบุหมายเลขเที่ยวบิน (ตัวอย่าง: TG639)']);
        }
    } else {
        wp_send_json(['flights' => [], 'more' => false, 'error' => 'invalid_flight_format', 'message' => 'รูปแบบหมายเลขเที่ยวบินไม่ถูกต้อง (ตัวอย่าง: TG123, PG166)']);
    }
    
    // Use today's date in YYYYMMDD format
    $date = date('Ymd');
    
    $url = "https://api.flightapi.io/airline/{$api_key}?num={$flight_number}&name={$airline_code}&date={$date}";
    
    $resp = wp_remote_get($url, [
        'timeout' => 12, 
        'redirection' => 3,
        'headers' => [
            'User-Agent' => 'WordPress/' . get_bloginfo('version') . '; ' . home_url()
        ]
    ]);

    if (is_wp_error($resp)) {
        wp_send_json(['flights' => [], 'more' => false, 'error' => 'fetch_failed', 'message' => 'ไม่สามารถเชื่อมต่อกับระบบได้']);
    }

    $status_code = wp_remote_retrieve_response_code($resp);
    if ($status_code === 429) {
        wp_send_json(['flights' => [], 'more' => false, 'error' => 'rate_limited', 'message' => 'ขออภัย ระบบตรวจสอบเที่ยวบินถูกจำกัดชั่วคราว โปรดลองใหม่อีกครั้งภายหลัง']);
    }

    $body = wp_remote_retrieve_body($resp);
    
    $json = json_decode($body, true);
    if (!is_array($json)) {
        wp_send_json(['flights' => [], 'more' => false, 'error' => 'bad_json', 'message' => 'ข้อมูลที่ได้รับไม่ถูกต้อง']);
    }

    if (isset($json['error'])) {
        $message = is_array($json['error']) && isset($json['error']['message']) ? $json['error']['message'] : 'API error';
        wp_send_json(['flights' => [], 'more' => false, 'error' => 'api_error', 'message' => $message]);
    }

    // FlightAPI.io returns array directly, convert to AviationStack format for compatibility
    $flights = [];
    
    if (is_array($json) && !empty($json)) {
        foreach ($json as $flight_data) {
            // ข้ามข้อมูลที่ไม่มี departure หรือ arrival
            if (!isset($flight_data['departure']) && !isset($flight_data['arrival'])) {
                continue;
            }
            
            // Convert FlightAPI.io format to AviationStack-like format
            $converted_flight = [
                'flight' => [
                    'iata' => $flight_iata,
                    'number' => $flight_iata
                ],
                'airline' => [
                    'name' => $airline_code . ' Airlines'
                ],
                'departure' => [],
                'arrival' => []
            ];
            
            $has_valid_data = false;
            
            // Map departure data if available
            if (isset($flight_data['departure'])) {
                $dep = $flight_data['departure'];
                $airport = isset($dep['airport']) ? $dep['airport'] : (isset($dep['airportCode']) ? $dep['airportCode'] : '');
                $scheduled = isset($dep['departureDateTime']) ? $dep['departureDateTime'] : null;
                
                // ตรวจสอบว่ามีข้อมูลที่สำคัญ
                if (!empty($airport) || !empty($scheduled)) {
                    $converted_flight['departure'] = [
                        'airport' => $airport,
                        'scheduled' => $scheduled,
                        'iata' => isset($dep['airportCode']) ? $dep['airportCode'] : '',
                        'terminal' => isset($dep['terminal']) ? $dep['terminal'] : null
                    ];
                    $has_valid_data = true;
                }
            }
            
            // Map arrival data if available  
            if (isset($flight_data['arrival'])) {
                $arr = $flight_data['arrival'];
                $airport = isset($arr['airport']) ? $arr['airport'] : (isset($arr['airportCode']) ? $arr['airportCode'] : '');
                $scheduled = isset($arr['arrivalDateTime']) ? $arr['arrivalDateTime'] : null;
                
                // ตรวจสอบว่ามีข้อมูลที่สำคัญ
                if (!empty($airport) || !empty($scheduled)) {
                    $converted_flight['arrival'] = [
                        'airport' => $airport,
                        'scheduled' => $scheduled,
                        'iata' => isset($arr['airportCode']) ? $arr['airportCode'] : '',
                        'terminal' => isset($arr['terminal']) ? $arr['terminal'] : null
                    ];
                    $has_valid_data = true;
                }
            }
            
            // เพิ่มเฉพาะข้อมูลที่มีค่าที่ใช้งานได้
            if ($has_valid_data) {
                $flights[] = $converted_flight;
            }
        }
    }
    
    // ถ้าไม่พบข้อมูล ส่ง error กลับไป
    if (empty($flights)) {
        wp_send_json([
            'flights' => [],
            'more' => false,
            'error' => 'no_results',
            'message' => 'ไม่พบข้อมูลเที่ยวบิน ' . $flight_iata
        ]);
    }
    
    wp_send_json([
        'flights' => $flights,
        'more'    => false
    ]);
}