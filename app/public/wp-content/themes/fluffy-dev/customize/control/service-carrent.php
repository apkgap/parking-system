<?php  
// ลงทะเบียน shortcode
add_shortcode('car_route_search', 'render_route_search_shortcode');
function render_route_search_shortcode() {
    // Enqueue scripts when shortcode is used
    handle_ajax_search_price();
    
    ob_start();
    ?>
        <div class="car-route-search-component max-w-7xl mx-auto bg-white rounded-xl shadow-md p-4 sm:p-6 md:p-8 mb-[2em]">
            <h2 class="text-center text-2xl font-semibold text-gray-800 mb-8"><?php yp_text('ค้นหาบริการรถเช่า', 'Private Car Service'); ?></h2>

            <form method="POST" action="" id="route-search-form" class="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 items-end mb-6">
                <div class="flex flex-col flex-1 w-full">
                    <label for="origin" class="block mb-2 font-semibold text-gray-700">
                        <strong><?php yp_text('ต้นทาง:', 'From:'); ?></strong>
                    </label>
                    <select name="origin" id="origin" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white">
                        <option value=""><?php yp_text('เลือกจุดเริ่มต้น...', 'Select origin...'); ?></option>
                        <?php echo get_location_options('origin'); ?>
                    </select>
                </div>
                <div class="flex flex-col flex-1 w-full">
                    <label for="destination" class="block mb-2 font-semibold text-gray-700">
                        <strong><?php yp_text('ปลายทาง:', 'To:'); ?></strong>
                    </label>
                    <select name="destination" id="destination" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white">
                        <option value=""><?php yp_text('เลือกจุดหมาย...', 'Select destination...'); ?></option>
                        <?php echo get_location_options('destination'); ?>
                    </select>
                </div>
                <div class="flex-1 w-full">
                    <button id="carrent-search-btn" type="submit" class="w-full bg-primary hover:bg-primary text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-lg flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <?php yp_text('ค้นหาราคา', 'Check Price'); ?>
                    </button>
                </div>
            </form>
        </div>

        <div id="search-results" class="car-route-search-component fixed inset-0 z-50 flex items-center justify-center bg-tranparent bg-opacity-40 z-999 hidden">
            <div class="blur"></div>
            <div id="search-results-modal" class="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
                <button type="button" onclick="closeSearchResults()" class="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                <div id="results-content"></div>
            </div>
        </div>

        <div id="result-choose" class="car-route-search-component result-choose mb-[2em]">

        </div>
        <script>
        function closeSearchResults() {
            document.getElementById('search-results').classList.add('hidden');
            document.getElementById('results-content').innerHTML = '';
        }
        </script>
    <?php
    return ob_get_clean();
}

// Handle AJAX for search price functionality
function handle_ajax_search_price() {
    wp_enqueue_style(
        'service-search-style',
        get_template_directory_uri() . '/customize/css/service.css',
        array(),
        '1.0.0'
    );
    
    wp_enqueue_script(
        'ajax-search-price',
        get_template_directory_uri() . '/customize/js/ajax-search-price.js',
        array('jquery'),
        '1.0.0',
        true
    );

    wp_localize_script(
        'ajax-search-price',
        'ajax_search_price_obj',
        array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('search_price_nonce'),
        )
    );
}

// ดึงรายการ Location สำหรับ Select2
function get_location_options($field_name) {
    $args = array(
        'post_type'      => 'package_rent',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids'
    );

    $query = new WP_Query($args);
    $locations = array();

    if ($query->have_posts()) {
        foreach ($query->posts as $post_id) {
            // Get ACF field value for the specified field (origin or destination)
            $field_value = get_field($field_name, $post_id);
            
            if (!empty($field_value)) {
                // If it's a string, use it directly
                if (is_string($field_value)) {
                    $locations[$field_value] = $field_value;
                }
                // If it's an array (like select field with label/value)
                elseif (is_array($field_value)) {
                    if (isset($field_value['value']) && isset($field_value['label'])) {
                        $locations[$field_value['value']] = $field_value['label'];
                    } else {
                        // Handle array of values
                        foreach ($field_value as $value) {
                            if (is_string($value)) {
                                $locations[$value] = $value;
                            }
                        }
                    }
                }
            }
        }
    }

    wp_reset_postdata();

    // Build options HTML
    $options = '';
    if (!empty($locations)) {
        // Remove duplicates and sort alphabetically
        $locations = array_unique($locations);
        asort($locations);
        foreach ($locations as $value => $label) {
            $options .= '<option value="' . esc_attr($value) . '">' . esc_html($label) . '</option>';
        }
    }

    return $options;
}

// AJAX Handler สำหรับค้นหาราคา
add_action('wp_ajax_search_route_pricing', 'ajax_search_route_pricing');
add_action('wp_ajax_nopriv_search_route_pricing', 'ajax_search_route_pricing');
// add_action( 'init', 'ajax_search_route_pricing');

function ajax_search_route_pricing() {
    // Security check
    if (!check_ajax_referer('search_price_nonce', 'nonce', false)) {
        wp_send_json_error(['message' => 'Invalid security token']);
        return;
    }

    $origin_value = sanitize_text_field($_POST['origin']);
    $destination_value = sanitize_text_field($_POST['destination']);

    //Validate input
    if (empty($origin_value) || empty($destination_value)) {
        wp_send_json_error(['message' => gp_text_get('กรุณาเลือกต้นทางและปลายทาง', 'Please select origin and destination')]);
        return;
    }

    $args = [
        'post_type'      => 'package_rent',
        'posts_per_page' => -1,
        'meta_query'     => [
            'relation' => 'AND',
            [
                'key'     => 'origin',
                'value'   => $origin_value,
                'compare' => 'LIKE'
            ],
            [
                'key'     => 'destination',
                'value'   => $destination_value,
                'compare' => 'LIKE'
            ],
        ],
    ];

    $query = new WP_Query($args);
    $output = '';
    // print_r($query);

    if ($query->have_posts()) {
        $output .= '<h3 class="text-xl font-semibold text-gray-800 mb-6">' . gp_text_get('ผลการค้นหา:', 'Search Results:') . ' ' . esc_html($origin_value) . ' → ' . esc_html($destination_value) . '</h3>';
        
        // Start single table for all results
        $output .= '<div class="car-route-search-component overflow-x-auto shadow-md rounded-lg h-[60vh] overflow-y-auto">';
        $output .= '<table class="w-full border-collapse bg-white text-left">'; // Responsive table
        $output .= '<thead class="bg-primary text-white hidden md:table-header-group">'; // Hide on mobile
        $output .= '<tr>';
        $output .= '<th class="p-4 font-semibold">' . gp_text_get('เส้นทาง', 'Route') . '</th>';
        $output .= '<th class="p-4 font-semibold">' . gp_text_get('ประเภทรถ', 'Car Type') . '</th>';
        $output .= '<th class="p-4 font-semibold">' . gp_text_get('ราคา', 'Price') . '</th>';
        $output .= '<th class="p-4 font-semibold text-center">' . gp_text_get('เลือก', 'Select') . '</th>';
        $output .= '</tr>';
        $output .= '</thead>';
        $output .= '<tbody class="divide-y divide-gray-200">'; // Rows as blocks on mobile

        while ($query->have_posts()) {
            $query->the_post();

            $title = get_the_title();
            $car_prices = get_field('price');
            $origin = get_field('origin');
            $destination = get_field('destination');
            $car_type = get_field('car_type');
            $post_id = get_the_ID();

            $output .= '<tr class="block md:table-row hover:bg-gray-50">';
            
            // Route column
            $route_display = esc_html($origin) . ' - ' . esc_html($destination);
            $output .= '<td class="p-4 flex justify-between items-center md:table-cell" data-label="' . gp_text_get('เส้นทาง', 'Route') . '">' . $route_display . '</td>';

            // Car type column
            $type = esc_html($car_type ?? ($title ?: gp_text_get('ไม่ระบุ', 'Not specified')));
            $output .= '<td class="p-4 flex justify-between items-center md:table-cell font-medium" data-label="' . gp_text_get('ประเภทรถ', 'Car Type') . '">' . $type . '</td>';
            
            // Price column
            $price_display = $car_prices ? esc_html($car_prices) . ' ' . gp_text_get('บาท', 'Baht') : gp_text_get('ไม่ระบุราคา', 'Price not specified');
            $output .= '<td class="p-4 flex justify-between items-center md:table-cell font-semibold text-primary" data-label="' . gp_text_get('ราคา', 'Price') . '">' . $price_display . '</td>';
        
            // Radio button column
            $output .= '<td class="p-4 flex justify-end items-center md:table-cell md:text-center" data-label="' . gp_text_get('เลือก', 'Select') . '">';
            $output .= '<input type="radio" name="selected_package" value="' . $post_id . '" class="w-5 h-5 text-primary bg-gray-100 border-gray-300 focus:ring-primary focus:ring-2">';
            $output .= '</td>';
            
            $output .= '</tr>';
        }
        
        $output .= '</tbody>';
        $output .= '</table>';
        $output .= '</div>';

        // Add CSS for mobile view
        $output .= '<style>
        @media (max-width: 767px) {
            td[data-label]::before {
                content: attr(data-label);
                font-weight: 600;
                margin-right: 1rem;
            }
        }
        </style>';
        
        // Add single action button
        $output .= '<div class="mt-6 text-center">';
        $output .= '<button type="button" id="select-package-btn" onclick="processSelectedPackage()" class="bg-primary hover:bg-primary text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg flex items-center justify-center gap-2 mx-auto">';
        $output .= '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">';
        $output .= '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>';
        $output .= '</svg>';
        $output .= gp_text_get('ดำเนินการต่อ', 'Continue');
        $output .= '</button>';
        $output .= '</div>';
        // Add JavaScript function with proper PHP/JS separation
        $selected_package_text = gp_text_get('แพ็คเกจที่เลือก', 'Selected Package');
        $route_text = gp_text_get('เส้นทาง', 'Route');
        $car_type_text = gp_text_get('ประเภทรถ', 'Car Type');
        $price_text = gp_text_get('ราคา', 'Price');
        $cancel_text = gp_text_get('ยกเลิกการเลือก', 'Cancel Selection');
        $please_select_text = gp_text_get('กรุณาเลือกรายการที่ต้องการ', 'Please select the desired item');
        $form_not_found_text = gp_text_get('ไม่พบฟอร์มจอง', 'Booking form not found');
        $baht_text = gp_text_get('บาท', 'Baht');
        
        $output .= '<script>
        function processSelectedPackage() {
            const selectedRadio = document.querySelector("input[name=\'selected_package\']:checked");
            if (!selectedRadio) {
                alert("' . $please_select_text . '");
                return;
            }

            document.querySelector("label[for=\'trip-type\']").classList.remove("disabled");

            // เก็บข้อมูล row ที่เลือก
            const row = selectedRadio.closest("tr");
            const route = row.querySelector("td:nth-child(1)").innerText.trim();
            const carType = row.querySelector("td:nth-child(2)").innerText.trim();
            const price = row.querySelector("td:nth-child(3)").innerText.trim();
            const packageId = selectedRadio.value;

            // หา form หลัก
            const bookingForm = document.getElementById("rentcar-booking-form");
            if (!bookingForm) {
                alert("' . $form_not_found_text . '");
                return;
            }

            // ลบ input hidden เก่า
            bookingForm.querySelectorAll(".selected-package-hidden").forEach(e => e.remove());

            // สร้าง input hidden ใหม่ (ใช้ชื่อที่ตรงกับ ACF field structure)
            const fields = [
                {name: "selected_package_id", value: packageId},
                {name: "selected_package_route", value: route},
                {name: "selected_package_car_type", value: carType},
                {name: "selected_package_price", value: price}
            ];
            fields.forEach(f => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = f.name;
                input.value = f.value;
                input.className = "selected-package-hidden";
                bookingForm.appendChild(input);
            });
            
            // Clear validation errors for fields that will be populated
            const fieldsToCheck = ["departStart", "departHuaHin", "returnStart", "returnHuaHin", "carTypeSelect"];
            fieldsToCheck.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.classList.remove("error");
                    // Remove alert-error siblings
                    const alertErrors = field.parentNode.querySelectorAll(".alert-error");
                    alertErrors.forEach(alert => alert.remove());
                    // Clear popup_span
                    const popupSpan = field.parentNode.querySelector(".popup_span");
                    if (popupSpan) {
                        popupSpan.innerHTML = "";
                        popupSpan.classList.add("hide");
                        popupSpan.classList.remove("flex");
                    }
                }
            });

            // ตั้งค่า dropdown และปิดการแก้ไข
            const departStartSelect = document.getElementById("departStart");
            const departHuaHinSelect = document.getElementById("departHuaHin");
            const returnStartSelect = document.getElementById("returnStart");
            const returnHuaHinSelect = document.getElementById("returnHuaHin");
            const carTypeSelect = document.getElementById("carTypeSelect");

            // แยกเป็นต้นทางและปลายทางด้วย →
            const [startPoint, endPoint] = route.split(" - ").map(part => part.trim());
    

            // ตั้งค่าให้ dropdown ต้นทาง (departStartSelect)
            if (departStartSelect && startPoint) {
                setSelectByText(departStartSelect, startPoint);
                departStartSelect.disabled = true;
            }

            // ตั้งค่าให้ dropdown ปลายทาง (departHuaHinSelect)
            if (departHuaHinSelect && endPoint) {
                setSelectByText(departHuaHinSelect, endPoint);
                departHuaHinSelect.disabled = true;
            }

            // ตั้งค่าให้ dropdown ขากลับ (สลับกัน)
            if (returnStartSelect && endPoint) {
                setSelectByText(returnStartSelect, endPoint);
                returnStartSelect.disabled = true;
            }

            if (returnHuaHinSelect && startPoint) {
                setSelectByText(returnHuaHinSelect, startPoint);
                // returnHuaHinSelect.disabled = true;
            }

            // ตั้งค่าประเภทรถที่เลือก
            if (carTypeSelect && carType) {
                setSelectByText(carTypeSelect, carType);
                carTypeSelect.disabled = true;
            }

            // แสดงผลใน result-choose
            const resultChoose = document.getElementById("result-choose");
            resultChoose.innerHTML = 
                "<div class=\"car-route-search-component max-w-7xl mx-auto bg-green-50 border border-green-200 rounded-xl shadow-md p-4 sm:p-6 md:p-8 mt-4\">" +
                    "<div class=\"flex items-center gap-3 mb-4\">" +
                        "<svg class=\"w-6 h-6 text-green-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">" +
                            "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z\"></path>" +
                        "</svg>" +
                        "<h3 class=\"text-xl font-semibold text-green-800\">' . $selected_package_text . '</h3>" +
                    "</div>" +
                    "<div class=\"grid grid-cols-1 md:grid-cols-3 gap-4\">" +
                        "<div class=\"bg-white p-4 rounded-lg shadow-sm\">" +
                            "<span class=\"text-sm text-gray-600 block mb-1\">' . $route_text . '</span>" +
                            "<span class=\"font-semibold text-gray-800\">" + route + "</span>" +
                        "</div>" +
                        "<div class=\"bg-white p-4 rounded-lg shadow-sm\">" +
                            "<span class=\"text-sm text-gray-600 block mb-1\">' . $car_type_text . '</span>" +
                            "<span class=\"font-semibold text-gray-800\">" + carType + "</span>" +
                        "</div>" +
                        "<div class=\"bg-white p-4 rounded-lg shadow-sm\">" +
                            "<span class=\"text-sm text-gray-600 block mb-1\">' . $price_text . '</span>" +
                            "<span class=\"font-semibold text-primary text-lg wpt_price_start\">" + price + "</span>" +
                        "</div>" +
                    "</div>" +
                    "<div class=\"mt-4 flex justify-end\">" +
                        "<button type=\"button\" onclick=\"clearSelectedPackage()\" class=\"text-red-600 hover:text-red-800 text-sm font-medium\">" +
                            "' . $cancel_text . '" +
                        "</button>" +
                    "</div>" +
                "</div>";

            // อัปเดตราคาใน summary
            updatePriceSummary(price);

            // ปิด popup
            document.getElementById("search-results").classList.add("hidden");
            document.getElementById("results-content").innerHTML = "";
        }

        function setSelectByText(selectElement, text) {
            // ลบช่องว่างหน้า-หลังของ text ที่ต้องการ
            const trimmedText = text.trim();

            // ค้นหา option ที่มี text ตรงกัน
            for (let option of selectElement.options) {
                if (option.text.trim() === trimmedText) {
                    selectElement.value = option.value;
                    option.selected = true; // ตั้งให้ option นี้เป็น selected
                    return; // ถ้าเจอ ตั้งค่าแล้วจบ
                }
            }

            // ถ้าไม่เจอ: สร้าง option ใหม่
            const newOption = document.createElement("option");
            newOption.text = trimmedText;
            newOption.value = trimmedText; // หรือจะใช้ ID พิเศษก็ได้ เช่น "auto-" + Date.now()
            newOption.selected = true; // ตั้งให้ option ใหม่เป็น selected
            selectElement.add(newOption);

            // ตั้งค่าให้ dropdown ชี้ไปที่ option ใหม่นี้
            selectElement.value = trimmedText;

            console.log(`Option created and selected: ${trimmedText}`);
        }
        
        function clearSelectedPackage() {
            // ลบ input hidden
            const bookingForm = document.getElementById("rentcar-booking-form");
            if (bookingForm) {
                bookingForm.querySelectorAll(".selected-package-hidden").forEach(e => e.remove());
            }
            
            // ลบการแสดงผล
            document.getElementById("result-choose").innerHTML = "";
            
            // รีเซ็ตราคา
            updatePriceSummary("0 ' . $baht_text . '");
        }
        
        function updatePriceSummary(price) {
            // อัปเดตราคาใน summary section
            const totalPriceEl = document.getElementById("summary-total-price");
            const grandTotalEl = document.getElementById("summary-grand-total");
            
            if (totalPriceEl) totalPriceEl.textContent = price;
            if (grandTotalEl) grandTotalEl.textContent = price;
        }
        </script>';
        wp_reset_postdata();
    } else {
        $output = '<div class="text-center py-8"><p class="text-gray-500 text-lg">' . gp_text_get('ไม่พบบริการสำหรับเส้นทางนี้', 'No service found for this route') . '</p></div>';
    }

    echo $output;
    wp_die();
}