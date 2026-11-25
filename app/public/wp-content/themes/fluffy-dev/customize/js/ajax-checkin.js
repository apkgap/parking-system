jQuery(document).ready(function($) {
    // Function to show a confirmation dialog
    function showConfirmationDialog(title, message, callback) {
        $('#confirmation-title').text(title);
        $('#confirmation-message').text(message);
        $('#confirmation-modal').css('display', 'flex');

        $('#confirm-ok-btn').off('click').on('click', function() {
            $('#confirmation-modal').css('display', 'none');
            callback(true);
        });

        $('#confirm-cancel-btn').off('click').on('click', function() {
            $('#confirmation-modal').css('display', 'none');
            callback(false);
        });
    }

    // --- Custom Alert and Loading Functions ---

    // Function to show loading overlay
    function showLoading() {
        $('#box-loading').css('display', 'flex');
    }

    // Function to hide loading overlay
    function hideLoading() {
        $('#box-loading').css('display', 'none');
    }

    // Function to show success alert
    function showSuccessAlert(message) {
        $('#success-message').text(message || 'ดำเนินการเรียบร้อยแล้ว');
        $('#success-alert').removeClass('hidden');
        setTimeout(() => {
            $('#success-alert .relative').removeClass('opacity-0 translate-y-4').addClass('opacity-100 translate-y-0');
        }, 50);
        setTimeout(hideSuccessAlert, 3000); // Auto-hide after 3 seconds
    }

    // Function to hide success alert
    function hideSuccessAlert() {
        $('#success-alert .relative').removeClass('opacity-100 translate-y-0').addClass('opacity-0 translate-y-4');
        setTimeout(() => {
            $('#success-alert').addClass('hidden');
            location.reload(); // Reload after hiding
        }, 300);
    }

    // Function to show error alert
    function showErrorAlert(message) {
        $('#error-message').text(message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        $('#error-alert').removeClass('hidden');
        setTimeout(() => {
            $('#error-alert .relative').removeClass('opacity-0 translate-y-4').addClass('opacity-100 translate-y-0');
        }, 50);
    }

    // Function to hide error alert
    function hideErrorAlert() {
        $('#error-alert .relative').removeClass('opacity-100 translate-y-0').addClass('opacity-0 translate-y-4');
        setTimeout(() => {
            $('#error-alert').addClass('hidden');
        }, 300);
    }

    // Handle alert button clicks
    $('#success-ok, #success-alert .opacity-50').on('click', hideSuccessAlert);
    $('#error-retry, #error-alert .opacity-50').on('click', hideErrorAlert);

    // Handle the click event for the check-in button
    $(document).on('click', '.check-in-button', function(e) {
        e.preventDefault();

        const $button = $(this);
        const bookingId = $button.data('booking-id');

        if (!bookingId) {
            showErrorAlert('ข้อมูลไม่ถูกต้อง ไม่สามารถดำเนินการได้');
            return;
        }

        // Show confirmation dialog before proceeding
        showConfirmationDialog('ยืนยันการเช็คอิน', 'คุณแน่ใจหรือไม่ว่าต้องการเช็คอินรายการนี้?', function(isConfirmed) {
            if (isConfirmed) {
                showLoading(); // Show loading overlay

                $.ajax({
                    url: ajaxCheckin.ajaxurl, // Use localized ajaxurl
                    type: 'POST',
                    data: {
                        action: 'handle_check_in',
                        nonce: ajaxCheckin.checkin_nonce, // Use localized nonce
                        booking_id: bookingId
                    },
                    success: function(response) {
                        hideLoading(); // Hide loading overlay
                        if (response.success) {
                            showSuccessAlert(response.data.message);
                        } else {
                            showErrorAlert(response.data.message);
                        }
                    },
                    error: function() {
                        hideLoading(); // Hide loading overlay
                        showErrorAlert('เกิดข้อผิดพลาดในการสื่อสารกับเซิร์ฟเวอร์');
                    }
                });
            }
        });
    });
});
