jQuery(document).ready(function($) {
    // เปิดใช้งาน Select2 with enhanced styling
    $('#origin, #destination').select2({
        placeholder: function() {
            return $(this).find('option:first').text();
        },
        allowClear: true,
        width: '100%',
        minimumResultsForSearch: 5, // Show search box when more than 5 options
        language: {
            noResults: function() {
                return "ไม่พบข้อมูลที่ตรงกัน";
            },
            searching: function() {
                return "กำลังค้นหา...";
            }
        }
    });

    // ส่งฟอร์มด้วย AJAX
    $('#route-search-form').on('submit', function(e) {
        e.preventDefault();
        
        const origin = $('#origin').val();
        const destination = $('#destination').val();
        const popup = $('#search-results');
        const contentBox = $('#results-content');

        // Validate form
        if (!origin || !destination) {
            alert('กรุณาเลือกต้นทางและปลายทาง');
            return;
        }

        // Show popup with loading
        popup.removeClass('hidden');
        $('.box-loading').css('display', 'flex');
        contentBox.html('');

        // AJAX request
        $.ajax({
            url: ajax_search_price_obj.ajax_url,
            type: 'POST',
            data: {
                action: 'search_route_pricing',
                origin: origin,
                destination: destination,
                nonce: ajax_search_price_obj.nonce
            },
            success: function(response) {
                $('.box-loading').css('display', 'none');
                contentBox.html(response);
            },
            error: function(xhr, status, error) {
                $('.box-loading').css('display', 'none');
                contentBox.html('<p class="text-center py-8 text-red-500">เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง</p>');
                console.error('Search error:', error);
            }
        });
    });

    // Clear results when changing origin or destination
    $('#origin, #destination').on('change', function() {
        $('#search-results').addClass('hidden');
        $('#results-content').html('');
        $('.box-loading').css('display', 'none');
    });
});
