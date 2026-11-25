<?php
/*
Template Name: Testing Car Rental
Description: Testing page for car rental system and service search functionality
*/
get_header();
?>
<main class="py-8 px-4">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold mb-8 text-center">Car Rental System Testing</h1>

        <!-- Test Service Search -->
        <section class="mb-12 bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-blue-600">🔍 Test Service Search</h2>
            <?php echo do_shortcode('[car_route_search]'); ?>
        </section>

        <!-- Quick Test Actions -->
        <section class="mb-12 bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-lg shadow-md text-white">
            <h2 class="text-2xl font-semibold mb-4">⚡ Quick Test Actions</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button type="button" onclick="autoFillAndSubmitTest()" class="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-gray-100 font-semibold transition-all">
                    🚀 Auto Fill & Test Submit
                </button>
                <button type="button" onclick="autoSearchAndSelect()" class="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 font-semibold transition-all">
                    🔍 Auto Search & Select Package
                </button>
                <button type="button" onclick="fillTestDataOnly()" class="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-gray-100 font-semibold transition-all">
                    📝 Fill Test Data Only
                </button>
            </div>
        </section>

        <!-- Test Booking Form -->
        <section class="mb-12 bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-green-600">📝 Test Booking Form</h2>
            <div class="mb-4">
                <button type="button" onclick="fillTestDataOnly()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2">
                    Fill Test Data
                </button>
                <button type="button" onclick="clearAllFormData()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                    Clear All Data
                </button>
            </div>
            <form id="test-booking-form" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Full Name</label>
                        <input type="text" id="test-fullname" class="w-full p-3 border rounded-lg" placeholder="John Doe" value="Test User">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Email</label>
                        <input type="email" id="test-email" class="w-full p-3 border rounded-lg" placeholder="john@example.com" value="test@example.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Phone</label>
                        <input type="text" id="test-phone" class="w-full p-3 border rounded-lg" placeholder="081-234-5678" value="081-234-5678">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Line ID</label>
                        <input type="text" id="test-line" class="w-full p-3 border rounded-lg" placeholder="testuser" value="testuser">
                    </div>
                </div>
                <button type="button" onclick="testBookingSubmit()" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                    Test Submit Booking
                </button>
            </form>
        </section>

        <!-- Test Hidden Inputs -->
        <section class="mb-12 bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-purple-600">🔧 Test Hidden Inputs</h2>
            <form id="rentcar-booking-form" class="space-y-4">
                <div class="flex flex-wrap gap-4">
                    <button type="button" onclick="addTestHiddenInputs()" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                        Add Test Hidden Inputs
                    </button>
                    <button type="button" onclick="showHiddenInputs()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        Show Hidden Inputs
                    </button>
                    <button type="button" onclick="clearHiddenInputs()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                        Clear Hidden Inputs
                    </button>
                </div>
                <div id="hidden-inputs-display" class="bg-gray-100 p-4 rounded min-h-[100px]">
                    <p class="text-gray-500">Hidden inputs will be displayed here...</p>
                </div>
            </form>
        </section>

        <!-- Test AJAX Endpoints -->
        <section class="mb-12 bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-orange-600">🌐 Test AJAX Endpoints</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button type="button" onclick="testSearchPricing()" class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
                    Test Search Route Pricing
                </button>
                <button type="button" onclick="testCarRentSubmit()" class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
                    Test Car Rent Submit
                </button>
            </div>
            <div id="ajax-test-results" class="mt-4 bg-gray-100 p-4 rounded min-h-[100px]">
                <p class="text-gray-500">AJAX test results will be displayed here...</p>
            </div>
        </section>

        <!-- Test Database -->
        <section class="mb-12 bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-red-600">💾 Test Database</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button type="button" onclick="checkPackageRentPosts()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                    Check Package Rent Posts
                </button>
                <button type="button" onclick="checkCarRentalPosts()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                    Check Car Rental Posts
                </button>
                <button type="button" onclick="checkACFFields()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                    Check ACF Fields
                </button>
            </div>
            <div id="database-test-results" class="mt-4 bg-gray-100 p-4 rounded min-h-[100px]">
                <p class="text-gray-500">Database test results will be displayed here...</p>
            </div>
        </section>

        <!-- Status Panel -->
        <section class="bg-gray-800 text-white p-6 rounded-lg">
            <h2 class="text-2xl font-semibold mb-4">📊 System Status</h2>
            <div id="system-status" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gray-700 p-4 rounded">
                    <h3 class="font-semibold mb-2">jQuery Status</h3>
                    <p id="jquery-status" class="text-yellow-300">Checking...</p>
                </div>
                <div class="bg-gray-700 p-4 rounded">
                    <h3 class="font-semibold mb-2">AJAX URL</h3>
                    <p id="ajax-url-status" class="text-yellow-300">Checking...</p>
                </div>
                <div class="bg-gray-700 p-4 rounded">
                    <h3 class="font-semibold mb-2">Nonce Status</h3>
                    <p id="nonce-status" class="text-yellow-300">Checking...</p>
                </div>
            </div>
        </section>
    </div>
</main>

<script>
jQuery(document).ready(function($) {
    // Check system status
    checkSystemStatus();
    function checkSystemStatus() {
        $('#jquery-status').html(typeof $ !== 'undefined' ? 
            '<span class="text-green-400">✓ Loaded</span>' : 
            '<span class="text-red-400">✗ Not Found</span>'
        );
        $('#ajax-url-status').html(typeof ajax_search_price_obj !== 'undefined' ? 
            '<span class="text-green-400">✓ Available</span>' : 
            '<span class="text-red-400">✗ Not Found</span>'
        );
        $('#nonce-status').html(typeof ajax_carrent_obj !== 'undefined' ? 
            '<span class="text-green-400">✓ Available</span>' : 
            '<span class="text-red-400">✗ Not Found</span>'
        );
    }

    // === ฟังก์ชันสำหรับหน้านี้เท่านั้น ===
    window.fillTestDataOnly = function() {
        $('#test-fullname').val('นายสมชาย ทดสอบระบบ');
        $('#test-email').val('somchai.test@example.com');
        $('#test-phone').val('081-234-5678');
        $('#test-line').val('somchai_test123');
        alert('✅ ข้อมูลถูกกรอกในแบบฟอร์มนี้แล้ว');
    };

    window.clearAllFormData = function() {
        $('#test-booking-form')[0].reset();
        alert('✅ ล้างข้อมูลแบบฟอร์มนี้เรียบร้อย');
    };

    // === ฟังก์ชันสำหรับเปิดหน้า /rent-car และแจ้งเตือน ===
    window.autoSearchAndSelect = function() {
        if (confirm('ต้องการไปยังหน้า /rent-car เพื่อค้นหาและเลือกแพ็กเกจหรือไม่?')) {
            window.open('/rent-car', '_blank');
        }
    };

    window.autoFillAndSubmitTest = function() {
        if (confirm('ต้องการไปยังหน้า /rent-car เพื่อกรอกข้อมูลอัตโนมัติหรือไม่?')) {
            window.open('/rent-car', '_blank');
            alert('✅ เปิดหน้า /rent-car แล้ว โปรดรอสักครู่ ระบบจะกรอกข้อมูลให้อัตโนมัติ');
        }
    };

    window.testBookingSubmit = function() {
        fillTestDataOnly();
        addTestHiddenInputs();
        const data = $('#test-booking-form').serialize();
        const hidden = $('.selected-package-hidden').map(function() {
            return this.name + ': ' + this.value;
        }).get().join('\n');
        alert('✅ เตรียมข้อมูลสำเร็จ!\n\nข้อมูลแบบฟอร์ม:\n' + data + '\n\nInput แฝง:\n' + hidden);
    };

    // === Hidden Inputs Functions ===
    window.addTestHiddenInputs = function() {
        $('#rentcar-booking-form').find('.selected-package-hidden').remove();
        const testInputs = [
            {name: 'selected_package_id', value: '123'},
            {name: 'selected_package_route', value: 'Bangkok → Hua Hin'},
            {name: 'selected_package_car_type', value: 'Standard Sedan'},
            {name: 'selected_package_price', value: '2500 บาท'}
        ];
        testInputs.forEach(input => {
            const hiddenInput = $('<input>')
                .attr('type', 'hidden')
                .attr('name', input.name)
                .attr('value', input.value)
                .addClass('selected-package-hidden');
            $('#rentcar-booking-form').append(hiddenInput);
        });
        showHiddenInputs();
    };

    window.showHiddenInputs = function() {
        const hiddenInputs = $('.selected-package-hidden');
        let display = '<h3 class="font-bold mb-2">Current Hidden Inputs:</h3>';
        if (hiddenInputs.length === 0) {
            display += '<p class="text-gray-500">No hidden inputs found</p>';
        } else {
            display += '<ul class="space-y-1">';
            hiddenInputs.each(function() {
                display += `<li><strong>${$(this).attr('name')}:</strong> ${$(this).val()}</li>`;
            });
            display += '</ul>';
        }
        $('#hidden-inputs-display').html(display);
    };

    window.clearHiddenInputs = function() {
        $('.selected-package-hidden').remove();
        showHiddenInputs();
    };

    // === AJAX Tests ===
    window.testSearchPricing = function() {
        if (typeof ajax_search_price_obj === 'undefined') {
            $('#ajax-test-results').html('<p class="text-red-500">❌ ajax_search_price_obj not available</p>');
            return;
        }
        $.ajax({
            url: ajax_search_price_obj.ajax_url,
            type: 'POST',
            data: {
                action: 'search_route_pricing',
                origin: 'Bangkok',
                destination: 'Hua Hin',
                nonce: ajax_search_price_obj.nonce
            },
            success: function(response) {
                $('#ajax-test-results').html('<h3 class="text-green-600 font-bold">✅ Search Pricing Success</h3><div class="mt-2 max-h-40 overflow-auto">' + response + '</div>');
            },
            error: function(xhr, status, error) {
                $('#ajax-test-results').html('<p class="text-red-500">❌ Search Pricing Error: ' + error + '</p>');
            }
        });
    };

    window.testCarRentSubmit = function() {
        if (typeof ajax_carrent_obj === 'undefined') {
            $('#ajax-test-results').html('<p class="text-red-500">❌ ajax_carrent_obj not available</p>');
            return;
        }
        const testData = {
            action: 'insert_car_rent_acf',
            nonce: ajax_carrent_obj.nonce,
            selected_package_id: '123',
            selected_package_route: 'Bangkok → Hua Hin',
            selected_package_car_type: 'Standard Sedan',
            selected_package_price: '2500 บาท',
            fields: {
                personal_information: {
                    full_name: 'Test User',
                    email: 'test@example.com',
                    phone_number: '081-234-5678',
                    line_id_whatsapp: 'testuser'
                }
            }
        };
        $.ajax({
            url: ajax_carrent_obj.ajax_url,
            type: 'POST',
            data: testData,
            success: function(response) {
                $('#ajax-test-results').html('<h3 class="text-green-600 font-bold">✅ Car Rent Submit Success</h3><pre class="mt-2 bg-white p-2 rounded text-sm overflow-auto">' + JSON.stringify(response, null, 2) + '</pre>');
            },
            error: function(xhr, status, error) {
                $('#ajax-test-results').html('<p class="text-red-500">❌ Car Rent Submit Error: ' + error + '</p><pre class="mt-2 bg-white p-2 rounded text-sm">' + xhr.responseText + '</pre>');
            }
        });
    };

    // === Database Tests ===
    window.checkPackageRentPosts = function() {
        $.get('/wp-json/wp/v2/package_rent?per_page=5', function(data) {
            let display = '<h3 class="font-bold mb-2">Package Rent Posts:</h3>';
            if (data.length === 0) {
                display += '<p class="text-yellow-500">No package_rent posts found</p>';
            } else {
                display += '<ul class="space-y-1">';
                data.forEach(post => {
                    display += `<li><strong>ID ${post.id}:</strong> ${post.title.rendered}</li>`;
                });
                display += '</ul>';
            }
            $('#database-test-results').html(display);
        }).fail(function() {
            $('#database-test-results').html('<p class="text-red-500">❌ Failed to fetch package_rent posts</p>');
        });
    };

    window.checkCarRentalPosts = function() {
        $.get('/wp-json/wp/v2/car_rentals?per_page=5', function(data) {
            let display = '<h3 class="font-bold mb-2">Car Rental Posts:</h3>';
            if (data.length === 0) {
                display += '<p class="text-yellow-500">No car_rentals posts found</p>';
            } else {
                display += '<ul class="space-y-1">';
                data.forEach(post => {
                    display += `<li><strong>ID ${post.id}:</strong> ${post.title.rendered}</li>`;
                });
                display += '</ul>';
            }
            $('#database-test-results').html(display);
        }).fail(function() {
            $('#database-test-results').html('<p class="text-red-500">❌ Failed to fetch car_rentals posts</p>');
        });
    };

    window.checkACFFields = function() {
        $('#database-test-results').html('<p class="text-blue-500">🔍 ACF fields check requires backend verification...</p>');
    };

});
</script>

<?php
get_footer();
?>