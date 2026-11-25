jQuery(document).ready(function($) {
    var isSubmitting = false;
    var loadingTimeout; // เพิ่มตัวแปรสำหรับจัดการ timeout
    
    // Language detection
    function getCurrentLanguage() {
        const htmlLang = document.documentElement.lang || '';
        return (htmlLang.startsWith('th')) ? 'th' : 'en';
    }
    
    const currentLang = getCurrentLanguage();
    
    function getText(thText, enText) {
        return currentLang === 'th' ? thText : enText;
    }
    
    // Initialize variables at the top
    let pricePerTrip = 0;
    let originalPackagePrice = 0; // เก็บราคาต้นฉบับของแพ็คเกจ (ก่อนคูณ 2)
    let totalPrice = 0;
    let discountAmount = 0;
    let discountPercent = 0;
    let appliedCoupon = null;

    $('#carBookingFormBtn').on('click', function(e) {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting) {
            return;
        }

        // Basic form validation
        if (!validateForm()) {
            return;
        }

        isSubmitting = true;

        // Show loading and disable button
        $('.box-loading').css('display', 'flex');
        $(this).prop('disabled', true).text('Processing...');

        // กำหนด timeout สำหรับ loading box (30 วินาที)
        loadingTimeout = setTimeout(function() {
            $('.box-loading').css('display', 'none');
            var bookNowText = getText('จองทันที', 'Book Now');
            $('#carBookingFormBtn').prop('disabled', false).text(bookNowText);
            isSubmitting = false;
            var timeoutMsg = getText('การประมวลผลใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง', 'Processing timeout. Please try again');
            showFieldError($('#carBookingFormBtn'), timeoutMsg);
        }, 30000);

        // Clear previous error messages
        $('.error-message').remove();

        // รวบรวมข้อมูลจาก hidden inputs ที่สร้างจาก service-carrent
        var selectedPackageData = {};
        $('.selected-package-hidden').each(function() {
            var name = $(this).attr('name');
            var value = $(this).val();
            if (name && value) {
                // แปลงชื่อ field ให้ตรงกับ structure ใน carrent.php
                if (name === 'selected_package_id') {
                    selectedPackageData.package_id = value;
                } else if (name === 'selected_package_route') {
                    selectedPackageData.route = value;
                } else if (name === 'selected_package_car_type') {
                    selectedPackageData.car_type = value;
                } else if (name === 'selected_package_price') {
                    selectedPackageData.price = value;
                    // อัปเดตราคาจากแพ็คเกจที่เลือก
                    var priceText = value.replace(/[^\d]/g, ''); // ลบตัวอักษรที่ไม่ใช่ตัวเลข
                    var packagePrice = parseFloat(priceText) || 0;
                    pricePerTrip = packagePrice;
                    originalPackagePrice = packagePrice; // เก็บราคาต้นฉบับ
                    updateSummaryPrice(); // Update price display when package changes
                }
            }
        });

        // ตรวจสอบและอัปเดตราคาอีกครั้งก่อนส่งข้อมูล
        var finalPriceText = $('input[name="selected_package_price"]').val();
        if (finalPriceText) {
            var finalPriceNumber = finalPriceText.replace(/[^\d]/g, '');
            pricePerTrip = parseFloat(finalPriceNumber) || pricePerTrip;
        }

        // Build form data
        var fields = {
            personal_information: {
                full_name: $('#fullname').val(),
                email: $('#email').val(),
                line_id_whatsapp: $('#lineId').val(),
                phone_number: $('#phone').val()
            },
            // เพิ่มข้อมูลแพ็คเกจที่เลือกจาก service-carrent
            selected_package: selectedPackageData,
            travel_information_outbound_trip: {
                depart_start_location: $('#departStart').val(),
                depart_start_location_note: $('#departStartNote').val(),
                depart_destination: $('#departHuaHin').val(),
                depart_destination_note: $('#departHuaHinNote').val(),
                depart_date: $('#departDate').val() ? $('#departDate').val().replace(/-/g, '') : '',
                depart_time: $('#departTime').val()
            },
            trip_type: $('#trip-type').is(':checked') ? 1 : 0,
            travel_information_return_trip: {
                return_start_location: $('#returnStart').val(),
                return_start_location_note: $('#returnStartNote').val(),
                return_destination: $('#returnHuaHin').val(),
                return_destination_note: $('#returnHuaHinNote').val(),
                return_date: $('#returnDate').val() ? $('#returnDate').val().replace(/-/g, '') : '',
                return_time: $('#returnTime').val()
            },
            booking_details: {
                car_type: $('#carTypeSelect').val(),
                adult_count: $('#adultCount').val(),
                child_count: $('#childCount').val(),
                remark_booking: $('#remark').val(),
                price_per_trip: pricePerTrip,
                total_price: totalPrice
            },
            flight_information: {
                arrival_flight_no: $('#arrivalFlightNo').val(),
                arrival_flight_time: $('#arrivalFlightTime').val(),
                departure_flight_no: $('#departureFlightNo').val(),
                departure_flight_time: $('#departureFlightTime').val(),
                discount_code: $('#discountCode').val(),
                remark_flight: $('#flightNote').val()
            },
            coupon_information: {
                coupon_code: appliedCoupon ? $('#discountCode').val() : '',
                discount_amount: discountAmount,
                discount_percent: discountPercent,
                original_price: pricePerTrip,
                final_price: totalPrice
            }
        };

        console.log('Form fields data:', fields);
        console.log('Selected package data:', selectedPackageData);
        console.log('Travel outbound data:', fields.travel_information_outbound_trip);
        console.log('Travel return data:', fields.travel_information_return_trip);

        // รวบรวมข้อมูล hidden inputs และเพิ่มลงใน data ที่ส่ง
        var ajaxData = {
            action: 'insert_car_rent_acf',
            nonce: ajax_carrent_obj.nonce,
            fields: fields
        };

        // เพิ่มข้อมูล hidden inputs ลงใน AJAX data
        $('.selected-package-hidden').each(function() {
            var name = $(this).attr('name');
            var value = $(this).val();
            if (name && value) {
                ajaxData[name] = value;
            }
        });

        // AJAX request
        $.ajax({
            url: ajax_carrent_obj.ajax_url,
            type: 'POST',
            dataType: 'json',
            timeout: 30000,
            data: ajaxData,
            success: function(res) {
                // ยกเลิก timeout เมื่อได้ response สำเร็จ
                clearTimeout(loadingTimeout);
                
                if (res.success) {
                    console.log('Booking created successfully:', res.data);
                    
                    // Show success message
                    var successMsg = getText('การจองสำเร็จ! กำลังเตรียมข้อมูล...', 'Booking successful! Preparing data...');
                    showFieldError($('#carBookingFormBtn'), successMsg, 'success');
                    
                    // Check if WooCommerce checkout URL is available
                    if (res.data.redirect_to_checkout && res.data.checkout_url) {
                        // Redirect to WooCommerce checkout
                        setTimeout(function() {
                            window.location.href = res.data.checkout_url;
                        }, 1500);
                    } else {
                        // Fallback to thank you page
                        setTimeout(function() {
                            var email = $('#email').val();
                            window.location.href = '/thank-you?ref=' + res.data.order_code + '&email=' + encodeURIComponent(email);
                        }, 2000);
                    }
                } else {                
                    showFieldError($('#carBookingFormBtn'), res.data?.message || 'An error occurred while creating your booking');
                }
            },
            error: function(xhr, status, error) {
                // ยกเลิก timeout เมื่อเกิด error
                clearTimeout(loadingTimeout);
                
                console.error('AJAX Error:', { xhr, status, error });
                let errorMessage = 'Unable to process your booking. Please try again.';
                if (status === 'timeout') {
                    errorMessage = 'Request timed out. Please check your connection and try again.';
                } else if (xhr.responseJSON?.data?.message) {
                    errorMessage = xhr.responseJSON.data.message;
                }
                
                // Display error message to user
                showFieldError($('#carBookingFormBtn'), errorMessage);
            },
            complete: function() {
                // ยกเลิก timeout และซ่อน loading (เฉพาะเมื่อไม่ redirect)
                if (loadingTimeout) {
                    clearTimeout(loadingTimeout);
                }
                isSubmitting = false;
                $('.box-loading').css('display', 'none');
                var bookNowText = getText('จองทันที', 'Book Now');
            $('#carBookingFormBtn').prop('disabled', false).text(bookNowText);
            }
        });
    });

    function validateForm() {
        let isValid = true;
        let errors = [];

        // Required fields validation
        const requiredFields = {
            '#fullname': 'Full name is required',
            '#email': 'Email is required',
            '#phone': 'Phone number is required',
            '#lineId': 'Line ID/WhatsApp is required',
            '#departStart': 'Departure location is required',
            '#departStartNote': 'Departure location note is required',
            '#departHuaHin': 'Departure destination is required',
            '#departHuaHinNote': 'Departure destination note is required',
            '#departDate': 'Departure date is required',
            '#departTime': 'Departure time is required',
            '#carTypeSelect': 'Car type is required',
            '#adultCount': 'Number of adults is required',
            // '#arrivalFlightNo': 'Arrival flight number is required',
            // '#arrivalFlightTime': 'Arrival flight time is required',
            // '#departureFlightNo': 'Departure flight number is required',
            // '#departureFlightTime': 'Departure flight time is required'
        };

        // Check if it's a round trip and validate return trip fields
        if ($('#trip-type').is(':checked')) {
            const returnFields = {
                '#returnStart': 'Return start location is required',
                '#returnStartNote': 'Return start location note is required',
                '#returnHuaHin': 'Return destination is required',
                '#returnHuaHinNote': 'Return destination note is required',
                '#returnDate': 'Return date is required',
                '#returnTime': 'Return time is required'
            };
            Object.assign(requiredFields, returnFields);
        }

        // ลบ alert-error เมื่อ input มีการเปลี่ยนแปลงหรือพิมพ์
        $('input, select, textarea').on('input change', function() {
            $(this).siblings('.alert-error').remove();
            $(this).removeClass('error');
        });

        $.each(requiredFields, function(selector, message) {
            const $field = $(selector);
            $field.siblings('.alert-error').remove(); // ลบ error เดิม
            if (!$field.val()) {
                $field.addClass('error');
                showFieldError($field, message); // แสดง error ใต้ input
                errors.push(message);
                isValid = false;
            } else {
                $field.removeClass('error');
            }
        });



        // Email validation
        if (!validateEmailField()) {
            errors.push('Please enter a valid email address');
            isValid = false;
        }
        // Passenger count validation (เรียกใช้ฟังก์ชัน)
        if (!validatePassengerCount($('#adultCount'))) {
            var adultError = getText('จำนวนผู้โดยสาร (ผู้ใหญ่) ต้องอยู่ระหว่าง 0-10 คน', 'Adult count must be between 0-10');
            errors.push(adultError);
            isValid = false;
        }
        // Show validation errors
        if (!isValid) {
            // showFieldError(errors.join('<br>'));
        }

        return isValid;
    }

    function showSuccessMessage(message) {
        const $alert = $('<div class="alert alert-success success-message">' + message + '</div>');
        $('.btn.btn-primary.w-full').parent().prepend($alert);
        setTimeout(() => {
            $alert.fadeOut();
        }, 5000);
    }

    function resetForm() {
        $('form')[0].reset();
        $('.error').removeClass('error');
        $('.error-message, .success-message').remove();
    }

    function clearFieldError($field) {
        $field.siblings('.popup_span').empty().addClass('hide').removeClass('flex');
        $field.removeClass('error');
    }

    // Clear errors on input
    $('input, select, textarea').on('input change', function() {
        clearFieldError($(this));
    });

    function showFieldError($field, message, type = 'error') {
        // ตรวจสอบว่า $field เป็น jQuery object และมี popup_span เป็น sibling
        if (!$field || !$field.length || typeof $field.siblings !== 'function' || !$field.siblings('.popup_span').length) {
            // fallback: แสดง error ด้านบนปุ่ม submit
            $('.error-message, .success-message').remove();
            const alertClass = type === 'success' ? 'alert-success success-message' : 'alert-error error-message';
            const $alert = $('<div class="alert ' + alertClass + '">' + message + '</div>');
            $('.btn.btn-primary.w-full').parent().prepend($alert);
            
            // Auto hide success messages
            if (type === 'success') {
                setTimeout(() => {
                    $alert.fadeOut();
                }, 3000);
            }
            return;
        }
        // โค้ดเดิม
        $field.siblings('.popup_span').empty();
        $field.siblings('.popup_span').removeClass('hide');
        const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
        $field.siblings('.popup_span').addClass('flex').append(`
            <div role="alert" class="alert ${alertClass} mt-2 w-full text-center">
                <span>${message}</span>
            </div>
        `);
        
        // Auto hide success messages
        if (type === 'success') {
            setTimeout(() => {
                $field.siblings('.popup_span').empty().addClass('hide').removeClass('flex');
            }, 3000);
        }
    }

    // Real-time validation
    $('input[required], select[required]').on('blur', function() {
        if ($(this).val() && $(this).val().trim()) {
            $(this).removeClass('error');
        }
    });

    // Trip type change handler - Combined functionality
    $('#trip-type').on('change', function() {
        const isRoundTrip = $(this).is(':checked');
        const $returnSection = $('.return-trip-section'); // Assuming you have a section for return trip

        if (isRoundTrip) {
            $returnSection.show();
            // Add required attribute to return trip fields
            $('#returnStart, #returnStartNote, #returnHuaHin, #returnHuaHinNote, #returnDate, #returnTime').prop('required', true);
        } else {
            $returnSection.hide();
            // Remove required attribute but DON'T clear values to preserve user input
            $('#returnStart, #returnStartNote, #returnHuaHin, #returnHuaHinNote, #returnDate, #returnTime').prop('required', false).removeClass('error');
            // Only clear error states, not the actual values
        }

        // Update price calculation
        // ใช้ราคาต้นฉบับที่เก็บไว้ (ถ้ายังไม่มีให้ดึงจาก input)
        let basePrice = originalPackagePrice;
        
        if (basePrice === 0) {
            // ดึงราคาต้นฉบับจาก hidden input ครั้งแรก
            var priceInput = $('input[name="selected_package_price"]').val();
            if (priceInput) {
                var priceText = priceInput.replace(/[^\d]/g, '');
                basePrice = parseFloat(priceText) || 0;
                originalPackagePrice = basePrice; // เก็บราคาต้นฉบับ
            }
        }
        
        // คำนวณราคาตาม trip type
        if (isRoundTrip) {
            pricePerTrip = basePrice * 2;
        } else {
            pricePerTrip = basePrice;
        }
        
        // อัปเดต input ด้วยราคาใหม่
        var currencyText = getText('บาท', 'Baht');
        $('input[name="selected_package_price"]').val(pricePerTrip.toLocaleString('en-US') + ' ' + currencyText);
        
        // รีเซ็ตคูปองเมื่อเปลี่ยน trip type
        if (appliedCoupon) {
            appliedCoupon = null;
            discountAmount = 0;
            discountPercent = 0;
            $('#discountCode').val('').prop('readonly', false);
            $('#apply-coupon-btn').removeClass('btn-success').addClass('btn-primary').text(getText('ใช้โค้ด', 'Apply')).prop('disabled', false);
            $('#coupon-message').addClass('hidden');
        }
        
        updateSummaryPrice();
    });

    function validateEmailField() {
        const email = $('#email').val();
        $('#email').siblings('.alert-error').remove();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            $('#email').addClass('error');
            showFieldError($('#email'), 'Please enter a valid email address');
            return false;
        } else {
            $('#email').removeClass('error');
            return true;
        }
    }

    function validatePassengerCount($field) {
        const val = parseInt($field.val(), 10);
        let message = '';
        if ($field.attr('id') === 'adultCount') {
            message = getText('จำนวนผู้โดยสาร (ผู้ใหญ่) ต้องอยู่ระหว่าง 0-10 คน', 'Adult count must be between 0-10');
        } else {
            message = getText('จำนวนผู้โดยสาร (เด็ก) ต้องอยู่ระหว่าง 0-10 คน', 'Children count must be between 0-10');
        }
        if (isNaN(val) || val < 1 || val > 10) {
            $field.addClass('error');
            showFieldError($field, message);
            return false;
        } else {
            $field.removeClass('error');
            clearFieldError($field);
            return true;
        }
    }


    // Time field validation (HH:MM format)
    $('#departTime, #returnTime, #arrivalFlightTime, #departureFlightTime').on('input blur', function() {
        const time = $(this).val();
        if (time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
            $(this).addClass('error');
            showFieldError('Please enter time in HH:MM format (e.g., 14:30)');
        } else {
            $(this).removeClass('error');
        }
    });

    // Phone number validation (basic Thai phone format)
    // $('#phone').on('input blur', function() {
    //     const phone = $(this).val();
    //     if (phone && !/^[0-9\-\s\+\(\)]{8,15}$/.test(phone)) {
    //         $(this).addClass('error');
    //         showFieldError('Please enter a valid phone number');
    //     } else {
    //         $(this).removeClass('error');
    //     }
    // });

    // เรียก validateEmailField แบบ real-time
    $('#email').on('input blur', function() {
        validateEmailField();
    });

    $('select').on('change', function() {
        const $field = $(this);
        if ($field.val() === "") {
            $field.addClass('error');
            showFieldError($field, getText('กรุณาเลือกข้อมูล', 'Please select'));
        } else {
            clearFieldError($field);
        }
    });

    $('#adultCount').on('input blur', function() {
        const val = parseInt($(this).val(), 10);
        if (isNaN(val) || val < 1 || val > 10) {
            $(this).addClass('error');
            showFieldError($(this), $(this).attr('id') === 'adultCount'
                ? getText('จำนวนผู้โดยสาร (ผู้ใหญ่) ต้องอยู่ระหว่าง 1-10 คน', 'Adult count must be between 1-10')
                : getText('จำนวนผู้โดยสาร (เด็ก) ต้องอยู่ระหว่าง1-10 คน', 'Children count must be between 1-10')
            );
        } else {
            $(this).removeClass('error');
            clearFieldError($(this));
        }
    });

    $('#adultCount').on('input blur', function() {
        validatePassengerCount($(this));
    });

    async function fetchCarrentPrice() {
        try {
            // const res = await fetch('/wp-json/mytheme/v1/settings');
            // const data = await res.json();
            // if (data && data.price_carrent) {
            //     pricePerTrip = parseFloat(data.price_carrent) || 0;
            // }


            var priceText = $('.selected_package_price').val();
            var priceNumber = priceText.replace(/[^0-9.]/g, '');
            pricePerTrip = parseFloat(priceNumber);

        } catch (e) {
            pricePerTrip = 0;
        }
        updateSummaryPrice();
    }
    fetchCarrentPrice();

    function updateSummaryPrice() {
        const basePrice = Math.round(pricePerTrip);
        const roundedDiscount = Math.round(discountAmount);
        const finalPrice = Math.max(0, basePrice - roundedDiscount);
        
        var currencyText = getText('บาท', 'Baht');
        $('#summary-total-price').text(basePrice.toLocaleString() + ' ' + currencyText);
        
        if (roundedDiscount > 0) {
            $('#coupon-discount-row').removeClass('hidden');
            $('#summary-discount').text('-' + roundedDiscount.toLocaleString() + ' ' + currencyText);
        } else {
            $('#coupon-discount-row').addClass('hidden');
        }
        
        $('#summary-grand-total').text(finalPrice.toLocaleString() + ' ' + currencyText);
        totalPrice = finalPrice;
    }

    // Coupon functionality
    $('#apply-coupon-btn').on('click', function() {
        const couponCode = $('#discountCode').val().trim();
        if (!couponCode) {
            var enterCouponMsg = getText('กรุณากรอกรหัสคูปอง', 'Please enter coupon code');
            showCouponMessage(enterCouponMsg, 'error');
            return;
        }
        
        applyCoupon(couponCode);
    });

    function applyCoupon(couponCode) {
        // Show loading state
        $('#apply-coupon-btn').prop('disabled', true).text(getText('กำลังตรวจสอบ...', 'Checking...'));
        
        // ดึงราคาจากแพ็คเกจที่เลือกก่อนส่งไปตรวจสอบคูปอง
        var currentPrice = pricePerTrip;
        var priceText = $('input[name="selected_package_price"]').val();
        if (priceText) {
            var priceNumber = priceText.replace(/[^0-9.]/g, '');
            currentPrice = parseFloat(priceNumber) || pricePerTrip;
        }
        
        // Use AJAX action like parking system
        $.ajax({
            url: ajax_carrent_obj.ajax_url,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'validate_coupon_carrent',
                coupon_code: couponCode,
                total_price: currentPrice
            },
            success: function(response) {
                if (response.success) {
                    appliedCoupon = response.data;
                    discountAmount = response.data.discount_amount;
                    
                    // อัปเดต pricePerTrip จาก currentPrice ที่ใช้ตรวจสอบคูปอง
                    pricePerTrip = currentPrice;
                    
                    var couponMsg = getText('ใช้คูปองสำเร็จ!', 'Coupon applied!');
                    var discountMsg = getText('ส่วนลด', 'Discount');
                    var currencyText = getText('บาท', 'Baht');
                    showCouponMessage(`${couponMsg} ${discountMsg} ${discountAmount} ${currencyText}`, 'success');
                    var appliedText = getText('ใช้แล้ว', 'Applied');
                    $('#apply-coupon-btn').text(appliedText).addClass('btn-success').removeClass('btn-primary');
                    $('#discountCode').prop('readonly', true);
                    updateSummaryPrice();
                } else {
                    var invalidCouponMsg = getText('รหัสคูปองไม่ถูกต้องหรือหมดอายุ', 'Invalid or expired coupon code');
                    showCouponMessage(response.data || invalidCouponMsg, 'error');
                    var useCodeText = getText('ใช้โค้ด', 'Apply');
                    $('#apply-coupon-btn').prop('disabled', false).text(useCodeText);
                }
                
            },
            error: function(xhr, status, error) {
                console.error('Coupon validation error:', error);
                let errorMessage = getText('เกิดข้อผิดพลาดในการตรวจสอบคูปอง', 'Error validating coupon');
                
                if (xhr.responseJSON && xhr.responseJSON.data) {
                    errorMessage = xhr.responseJSON.data;
                }
                
                showCouponMessage(errorMessage, 'error');
                $('#apply-coupon-btn').prop('disabled', false).text('ใช้โค้ด');
            }
        });
    }

    function showCouponMessage(message, type) {
        const $message = $('#coupon-message');
        $message.removeClass('hidden text-green-600 text-red-600');
        
        if (type === 'success') {
            $message.addClass('text-green-600');
        } else {
            $message.addClass('text-red-600');
        }
        
        $message.text(message);
        
        if (type === 'error') {
            setTimeout(() => {
                $message.addClass('hidden');
            }, 5000);
        }
    }

    // Reset coupon when discount code is changed
    $('#discountCode').on('input', function() {
        if (appliedCoupon && !$(this).prop('readonly')) {
            appliedCoupon = null;
            discountAmount = 0;
            discountPercent = 0;
            $('#apply-coupon-btn').removeClass('btn-success').addClass('btn-primary').text('ใช้โค้ด').prop('disabled', false);
            $('#coupon-message').addClass('hidden');
            updateSummaryPrice();
        }
    });

    // Form submission protection - prevent Enter key submission
    $('#rentcar-booking-form').on('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            return false;
        }
    });

    // Global keydown listener for all form inputs
    $('#rentcar-booking-form input, #rentcar-booking-form select, #rentcar-booking-form textarea').on('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            return false;
        }
    });

    // Submit event listener to check if submission came from designated button
    $('#rentcar-booking-form').on('submit', function(e) {
        e.preventDefault();
        return false;
    });

    // Override form.submit() method to block programmatic submissions
    const originalSubmit = HTMLFormElement.prototype.submit;
    const form = document.getElementById('rentcar-booking-form');
    if (form) {
        form.submit = function() {
            console.warn('Form submission blocked. Use the designated submit button.');
            return false;
        };
    }

    // Validation for route-search-form
    $('#route-search-form').on('submit', function(e) {
        e.preventDefault();
        let isValid = true;
        const requiredFields = {
            '#origin': 'Departure location is required',
            '#destination': 'Departure destination is required'
        };

        $.each(requiredFields, function(selector, message) {
            const $field = $(selector);
            $field.siblings('.alert-error').remove();
            if (!$field.val()) {
                $field.addClass('error');
                showFieldError($field, message);
                isValid = false;
            } else {
                $field.removeClass('error');
            }
        });

        if (isValid) {
            // If valid, proceed with the form submission logic
            // This could be an AJAX call or other processing
            console.log('Form is valid, proceeding with search...');
            // Add your form submission logic here
        }
    });

    // Clear validation errors when user selects values in dropdown for route-search-form
    $('#origin, #destination').on('change', function() {
        const $field = $(this);
        if ($field.val()) {
            $field.removeClass('error');
            $field.siblings('.alert-error').remove();
            clearFieldError($field);
        }
    });

    // Clear validation errors when user selects values in main booking form dropdowns
    $('#departStart, #departHuaHin, #returnStart, #returnHuaHin').on('change', function() {
        const $field = $(this);
        if ($field.val()) {
            $field.removeClass('error');
            $field.siblings('.alert-error').remove();
            $field.siblings('.popup_span').empty().addClass('hide').removeClass('flex');
            clearFieldError($field);
        }
    });

    // Clear errors only when user manually selects from dropdown - no automatic checking
});