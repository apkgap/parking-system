jQuery(document).ready(function($) {

    if (typeof $.fn.select2 === 'undefined') {
        console.error('Select2 is not loaded.');
        return;
    }

    // Add a special class to all elements within the form
    const specialClass = 'special-mark'; // change this if you prefer another class name
    $('#driver-job-form').find('*').addClass(specialClass);
    // Also add a specific class to all div elements
    $('#driver-job-form').find('div').addClass('special-div');

    // Initialize Select2 for Drivers
    $('#taxi_user').select2({
        placeholder: 'ค้นหาคนขับ...',
        minimumInputLength: 1,
        ajax: {
            url: driverJobAjax.driver_endpoint, // Use the correct driver endpoint
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    search: params.term
                };
            },
            processResults: function (response) {
                // The API returns an object with a 'data' key containing the results
                return {
                    results: $.map(response.data, function (item) {
                        return {
                            id: item.id,
                            text: item.title // The API provides 'title' for the driver's name
                        };
                    })
                };
            },
            cache: true
        },
        escapeMarkup: function (markup) { return markup; },
        // Custom styling options
        width: '100%',
        theme: 'bootstrap4',
        containerCssClass: 'select2-custom-container',
        selectionCssClass: 'select2-custom-selection',
        dropdownCssClass: 'select2-custom-dropdown'
    });

    // Initialize Select2 for Booking Orders
    $('#booking-order').select2({
        placeholder: 'ค้นหารายการจอง...',
        minimumInputLength: 1, // User must type at least 1 character
        ajax: {
            url: driverJobAjax.booking_endpoint,
            dataType: 'json',
            delay: 250, // Wait 250ms after typing before sending the request
            data: function (params) {
                return {
                    search: params.term, // Send search term to the API
                    per_page: 10 // Limit results per page
                };
            },
            processResults: function (data) {
                // The API returns an array of objects
                if (!Array.isArray(data)) {
                    console.error('Expected array but got:', typeof data);
                    return { results: [] };
                }

                return {
                    results: $.map(data, function (item) {
                        return {
                            id: item.id,
                            text: item.title
                        };
                    })
                };
            },
            cache: true
        },
        escapeMarkup: function (markup) { return markup; }, // Let our custom formatter work
        // Custom styling options
        width: '100%',
        theme: 'bootstrap4',
        containerCssClass: 'select2-custom-container',
        selectionCssClass: 'select2-custom-selection',
        dropdownCssClass: 'select2-custom-dropdown'
    });

    // --- MODIFIED ---: Handle display of booking details in a modal
    const modal = $('#booking-modal');
    const modalBody = $('#booking-modal-body');
    const modalTitle = $('#booking-modal-title');
    const modalSubtitle = $('#booking-modal-subtitle');
    const modalWrapper = $('#booking-modal-content-wrapper');

    function openModal() {
        modal.removeClass('hidden');
        setTimeout(() => { // For transition effect
            modalWrapper.removeClass('opacity-0 translate-y-4');
        }, 10);
    }

    function closeModal() {
        modalWrapper.addClass('opacity-0 translate-y-4');
        setTimeout(() => { // Wait for transition to finish
            modal.addClass('hidden');
            modalBody.html(''); // Clear content
        }, 300);
    }

    $('#booking-order').on('select2:select', function (e) {
        var bookingId = e.params.data.id;
        var endpoint = driverJobAjax.booking_endpoint + '?id=' + bookingId;

        // Show loading state in modal
        modalTitle.text('กำลังโหลดข้อมูล...');
        modalSubtitle.text('โปรดรอสักครู่...');
        modalBody.html('<div class="flex justify-center items-center py-20"><div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div></div>');
        openModal();

        $.ajax({
            url: endpoint,
            method: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-WP-Nonce', driverJobAjax.nonce);
            },
            success: function(response) {
                if (response && response.length > 0) {
                    var data = response[0];
                    modalTitle.text('รายละเอียดการจอง');
                    modalSubtitle.text('Order Code: ' + data.order_code);
                    var html = formatBookingDetails(data);
                    modalBody.html(html);
                    
                    // Populate add-on information into input fields
                    populateAddonInformation(data.addon_information);
                } else {
                    modalTitle.text('เกิดข้อผิดพลาด');
                    modalSubtitle.text('ไม่สามารถโหลดข้อมูลได้');
                    modalBody.html('<p class="text-center py-10 text-red-500">ไม่พบข้อมูลการจอง</p>');
                    
                    // Clear add-on information if no data
                    clearAddonInformation();
                }
            },
            error: function() {
                modalTitle.text('เกิดข้อผิดพลาด');
                modalSubtitle.text('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
                modalBody.html('<p class="text-center py-10 text-red-500">เกิดข้อผิดพลาดในการดึงข้อมูล</p>');
            }
        });
    });

    // Close modal events
    $('#booking-modal-close').on('click', closeModal);
    $('#booking-modal-background').on('click', closeModal);
    $(document).on('keydown', function(e) {
        if (e.key === "Escape" && !modal.hasClass('hidden')) {
            closeModal();
        }
    });
    
    // Function to populate add-on information into input fields
    function populateAddonInformation(addonData) {
        if (!addonData) {
            clearAddonInformation();
            return;
        }
        
        // Show the add-on information section
        $('#addon-information-section').removeClass('hidden');
        
        // Populate service pickup and valet
        $('#service_pickup').val(addonData.service_pickup ? 'ใช่' : 'ไม่');
        $('#service_valet').val(addonData.service_valet ? 'ใช่' : 'ไม่');
        
        // Populate sending flight information
        if (addonData.sending_flight) {
            const flight = addonData.sending_flight;
            $('#sending_flight_depart').val(flight.depart || '');
            $('#sending_flight_depart_time').val(flight.depart_time || '');
            $('#sending_flight_arrival').val(flight.arrival || '');
            $('#sending_flight_arrival_time').val(flight.arrival_time || '');
            $('#sending_flight_pickup_point').val(flight.pickup_point || '');
            $('#sending_flight_pickup_time').val(flight.pickup_time || '');
            $('#sending_flight_dropoff_point').val(flight.dropoff_point || '');
            $('#sending_flight_dropoff_time').val(flight.dropoff_time || '');
            $('#sending_flight_adult_count').val(flight.adult_count || '');
            $('#sending_flight_child_count').val(flight.child_count || '');
            $('#sending_flight_baggage_count').val(flight.baggage_count || '');
            $('#sending_flight_pickup_note').val(flight.pickup_note || '');
        } else {
            clearSendingFlightInformation();
        }
        
        // Populate parking car information
        if (addonData.parking_car) {
            const parking = addonData.parking_car;
            $('#parking_car_depart').val(parking.depart || '');
            $('#parking_car_depart_time').val(parking.depart_time || '');
            $('#parking_car_arrival').val(parking.arrival || '');
            $('#parking_car_arrival_time').val(parking.arrival_time || '');
            $('#parking_car_pickup_point').val(parking.pickup_point || '');
            $('#parking_car_pickup_time').val(parking.pickup_time || '');
            $('#parking_car_dropoff_point').val(parking.dropoff_point || '');
            $('#parking_car_dropoff_time').val(parking.dropoff_time || '');
            $('#parking_car_pickup_note').val(parking.pickup_note || '');
        } else {
            clearParkingCarInformation();
        }
    }
    
    // Function to clear all add-on information from input fields
    function clearAddonInformation() {
        // Hide the add-on information section
        $('#addon-information-section').addClass('hidden');
        
        // Clear service pickup and valet
        $('#service_pickup').val('');
        $('#service_valet').val('');
        
        // Clear sending flight information
        clearSendingFlightInformation();
        
        // Clear parking car information
        clearParkingCarInformation();
    }
    
    // Helper function to clear sending flight information
    function clearSendingFlightInformation() {
        $('#sending_flight_depart').val('');
        $('#sending_flight_depart_time').val('');
        $('#sending_flight_arrival').val('');
        $('#sending_flight_arrival_time').val('');
        $('#sending_flight_pickup_point').val('');
        $('#sending_flight_pickup_time').val('');
        $('#sending_flight_dropoff_point').val('');
        $('#sending_flight_dropoff_time').val('');
        $('#sending_flight_adult_count').val('');
        $('#sending_flight_child_count').val('');
        $('#sending_flight_baggage_count').val('');
        $('#sending_flight_pickup_note').val('');
    }
    
    // Helper function to clear parking car information
    function clearParkingCarInformation() {
        $('#parking_car_depart').val('');
        $('#parking_car_depart_time').val('');
        $('#parking_car_arrival').val('');
        $('#parking_car_arrival_time').val('');
        $('#parking_car_pickup_point').val('');
        $('#parking_car_pickup_time').val('');
        $('#parking_car_dropoff_point').val('');
        $('#parking_car_dropoff_time').val('');
        $('#parking_car_adult_count').val('');
        $('#parking_car_child_count').val('');
        $('#parking_car_baggage_count').val('');
        $('#parking_car_pickup_note').val('');
    }
    
    // Function to show success alert
    function showSuccessAlert(message) {
        $('#success-message').text(message || 'บันทึกข้อมูลเรียบร้อยแล้ว');
        $('#success-alert').removeClass('hidden');
        setTimeout(() => {
            $('#success-alert .relative').removeClass('opacity-0 translate-y-4');
            $('#success-alert .relative').addClass('opacity-100 translate-y-0');
        }, 50);
    }
    
    // Function to hide success alert
    function hideSuccessAlert() {
        $('#success-alert .relative').removeClass('opacity-100 translate-y-0');
        $('#success-alert .relative').addClass('opacity-0 translate-y-4');
        setTimeout(() => {
            $('#success-alert').addClass('hidden');
        }, 300);
    }
    
    // Function to show error alert
    function showErrorAlert(message) {
        $('#error-message').text(message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        $('#error-alert').removeClass('hidden');
        setTimeout(() => {
            $('#error-alert .relative').removeClass('opacity-0 translate-y-4');
            $('#error-alert .relative').addClass('opacity-100 translate-y-0');
        }, 50);
    }
    
    // Function to hide error alert
    function hideErrorAlert() {
        $('#error-alert .relative').removeClass('opacity-100 translate-y-0');
        $('#error-alert .relative').addClass('opacity-0 translate-y-4');
        setTimeout(() => {
            $('#error-alert').addClass('hidden');
        }, 300);
    }
    
    // Handle alert button clicks
    $('#success-ok').on('click', function() {
        hideSuccessAlert();
    });
    
    $('#error-retry').on('click', function() {
        hideErrorAlert();
    });
    
    // Submit form via AJAX
    $('#driver-job-form').on('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            taxi_user: $('#taxi_user').val(),
            status_job: $('#status_job').val(),
            booking_order: $('#booking-order').val(),
            plate_driver: $('#plate_driver').val(),
            addon_information: {
                service_pickup: $('#service_pickup').is(':checked'),
                service_valet: $('#service_valet').is(':checked'),
                sending_flight: {
                    depart: $('#sending_flight_depart').val(),
                    depart_time: $('#sending_flight_depart_time').val(),
                    arrival: $('#sending_flight_arrival').val(),
                    arrival_time: $('#sending_flight_arrival_time').val(),
                    pickup_point: $('#sending_flight_pickup_point').val(),
                    pickup_time: $('#sending_flight_pickup_time').val(),
                    dropoff_point: $('#sending_flight_dropoff_point').val(),
                    dropoff_time: $('#sending_flight_dropoff_time').val(),
                    adult_count: $('#sending_flight_adult_count').val(),
                    child_count: $('#sending_flight_child_count').val(),
                    baggage_count: $('#sending_flight_baggage_count').val(),
                    pickup_note: $('#sending_flight_pickup_note').val()
                },
                parking_car: {
                    depart: $('#parking_car_depart').val(),
                    depart_time: $('#parking_car_depart_time').val(),
                    arrival: $('#parking_car_arrival').val(),
                    arrival_time: $('#parking_car_arrival_time').val(),
                    pickup_point: $('#parking_car_pickup_point').val(),
                    pickup_time: $('#parking_car_pickup_time').val(),
                    dropoff_point: $('#parking_car_dropoff_point').val(),
                    dropoff_time: $('#parking_car_dropoff_time').val(),
                    pickup_note: $('#parking_car_pickup_note').val()
                }
            }
        };
        
        // Show loading state on button and overlay
        const $submitBtn = $(this).find('button[type="submit"]');
        const originalBtnText = $submitBtn.text();
        $submitBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> กำลังบันทึก...');
        $submitBtn.prop('disabled', true);
        
        // Show form loading overlay
        $('#box-loading').css('display', 'flex');
        
        // Send AJAX request
        $.ajax({
            url: driverJobAjax.ajax_url,
            type: 'POST',
            data: {
                action: 'save_ride_assignment',
                nonce: driverJobAjax.nonce,
                data: JSON.stringify(formData)
            },
            success: function(response) {
                if (response.success) {
                    // Show success message with Thai text
                    showSuccessAlert('บันทึกข้อมูลเรียบร้อยแล้ว');
                    
                    // Reset form
                    $('#driver-job-form')[0].reset();
                    $('#taxi_user').val(null).trigger('change');
                    $('#booking-order').val(null).trigger('change');
                    clearAddonInformation();
                    
                    // Redirect to dashboard after a short delay and activate tab4
                    setTimeout(function() {
                        window.location.href = 'https://www.okparking.net/dashboard/';
                        // Activate the sidebar tab4
                        $('.sidebar').find('[data-nav="tab4"]').addClass('active');
                    }, 1500);
                } else {
                    // Show error message with Thai text
                    showErrorAlert('เกิดข้อผิดพลาด: ' + (response.data ? response.data.message : 'กรุณาลองใหม่อีกครั้ง'));
                }
            },
            error: function(xhr, status, error) {
                // Show error message with Thai text
                showErrorAlert('เกิดข้อผิดพลาด: ' + error);
            },
            complete: function() {
                // Restore button state
                $submitBtn.html(originalBtnText);
                $submitBtn.prop('disabled', false);
                
                // Hide form loading overlay
                $('#box-loading').css('display', 'none');
            }
        });
    });

    function formatBookingDetails(data) {
        // Initialize html variable
        let html = '<div class="space-y-4">';

        // Helper for creating a detail row
        const detailRow = (label, value) => {
            if (value === null || value === undefined || value === '') return '';
            return `<div class="py-2 border-b border-gray-100"><p class="text-sm text-gray-500">${label}</p><p class="font-medium text-gray-800">${value}</p></div>`;
        };

        // Customer Details
        html += '<h3 class="text-lg font-semibold text-gray-900 border-b pb-2">ข้อมูลลูกค้า</h3>';
        html += detailRow('ชื่อ-นามสกุล', data.fullname_park);
        html += detailRow('อีเมล', data.email_park);
        html += detailRow('Line ID', data.line_id_park);
        html += detailRow('เบอร์โทร', data.phone_park);

        // Booking Details
        html += '<h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-4">ข้อมูลการจอง</h3>';
        html += detailRow('Order Code', data.order_code);
        html += detailRow('สถานที่', data.location_park ? data.location_park.name : 'N/A');
        html += detailRow('วัน-เวลา เริ่มต้น', `${data.start_date} ${data.start_time}`);
        html += detailRow('วัน-เวลา สิ้นสุด', `${data.end_date} ${data.end_time}`);

        // Vehicle Details (Handles multiple vehicles)
        if (data.vehicle_info && data.vehicle_info.length > 0) {
            html += '<h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-4">ข้อมูลรถ</h3>';
            data.vehicle_info.forEach((vehicle, index) => {
                html += `<div class="p-2 border rounded-md mt-2 bg-gray-50">`;
                html += `<p class="font-semibold text-gray-800">คันที่ ${index + 1}</p>`;
                html += detailRow('ประเภทรถ', vehicle.other_type_car);
                html += detailRow('ทะเบียน', vehicle.license_plate);
                html += detailRow('ช่องจอด', vehicle.parking_slot);
                 html += `</div>`;
            });
        }

        // Add-on Details
        if (data.addon_information) {
            const addons = data.addon_information;
            let addonHtml = '';

            if (addons.service_pickup) addonHtml += '<li>บริการรับ - ส่งสนามบิน</li>';
            if (addons.service_valet) addonHtml += '<li>บริการรับจอด - รับส่งรถ สนามบิน</li>';

            if (addons.sending_flight && Object.values(addons.sending_flight).some(v => v)) {
                const flight = addons.sending_flight;
                addonHtml += '<li class="mt-2"><strong>ข้อมูลการเดินทาง (รับ-ส่ง):</strong><ul class="list-disc list-inside pl-4">';
                if(flight.depart) addonHtml += `<li>เที่ยวบินขาไป: ${flight.depart} - ${flight.depart_time}</li>`;
                if(flight.arrival) addonHtml += `<li>เที่ยวบินขากลับ: ${flight.arrival} - ${flight.arrival_time}</li>`;
                if(flight.pickup_point) addonHtml += `<li>จุดรับ: ${flight.pickup_point} เวลา ${flight.pickup_time}</li>`;
                if(flight.dropoff_point) addonHtml += `<li>จุดส่ง: ${flight.dropoff_point} เวลา ${flight.dropoff_time}</li>`;
                if(flight.adult_count) addonHtml += `<li>ผู้ใหญ่: ${flight.adult_count} คน</li>`;
                if(flight.child_count) addonHtml += `<li>เด็ก: ${flight.child_count} คน</li>`;
                if(flight.baggage_count) addonHtml += `<li>กระเป๋า: ${flight.baggage_count} ใบ</li>`;
                if(flight.pickup_note) addonHtml += `<li>หมายเหตุ: ${flight.pickup_note}</li>`;
                addonHtml += '</ul></li>';
            }
            
            if (addons.parking_car && Object.values(addons.parking_car).some(v => v)) {
                const parking = addons.parking_car;
                addonHtml += '<li class="mt-2"><strong>ข้อมูลการเดินทาง (ฝากจอด):</strong><ul class="list-disc list-inside pl-4">';
                if(parking.depart) addonHtml += `<li>เที่ยวบินขาไป: ${parking.depart} - ${parking.depart_time}</li>`;
                if(parking.arrival) addonHtml += `<li>เที่ยวบินขากลับ: ${parking.arrival} - ${parking.arrival_time}</li>`;
                if(parking.pickup_point) addonHtml += `<li>จุดรับรถ: ${parking.pickup_point} เวลา ${parking.pickup_time}</li>`;
                if(parking.dropoff_point) addonHtml += `<li>จุดส่งคืนรถ: ${parking.dropoff_point} เวลา ${parking.dropoff_time}</li>`;
                if(parking.pickup_note) addonHtml += `<li>หมายเหตุ: ${parking.pickup_note}</li>`;
                addonHtml += '</ul></li>';
            }

            if (addonHtml) {
                html += '<h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-4">บริการเสริม</h3>';
                html += `<ul class="list-disc list-inside text-gray-800">${addonHtml}</ul>`;
            }
        }

        html += '</div>';
        return html;
    }
});