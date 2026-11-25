jQuery(document).ready(function($) {
    // Main Tab Switching
    $('.wpt-tab').click(function() {
        $('.wpt-tab').removeClass('wpt-active');
        $(this).addClass('wpt-active');

        var tabId = $(this).data('tab');
        $('.wpt-tab-content').hide();
        $('#wpt-' + tabId).show();

        $('.wrap-booking').removeClass('vPrivate');
    });





    $('.parking-type').click(function (e) { 
        var type = $(this).attr('data-sub-tab');
        if(type){
            $('input[name="parking-type"]').val(type);

            $('.parking_duration_select select').prop('selectedIndex', 0);
            $('input[name="parking-duration"]').val('');

            if( type == 'daily' ){

                $('.parking_duration_day').removeClass('hide');
                $('.parking_duration_month').addClass('hide');
            }


            if( type == 'monthly' ){
                $('.parking_duration_month').removeClass('hide');
                $('.parking_duration_day').addClass('hide');
            }
        }
    });





    $('.parking_duration_select select').change(function (e) { 
        e.preventDefault();
        var data = $(this).val();
        if(data){
            $('input[name="parking-duration"]').val(data);
        }
    });

    $('.parking-location').change(function (e) { 
        e.preventDefault();
        var data = $(this).val();
        if(data){
            $('.wpt-form').attr('action','/parking/'+data);
        }
    });

    




    $('.wpt-private').click(function (e) { 
        e.preventDefault();
        $('.wrap-booking').addClass('vPrivate');
    });

    $('.wpt-date-picker').flatpickr({
        dateFormat: 'd/m/Y',
        locale: 'th',
        minDate: "today" // Set minimum date to today
    });

    // Ensure consistent Thai display (Buddhist year + Thai short month)
    function formatDateForInput(date) {
        if (!date || !(date instanceof Date)) return '';
        var day = date.getDate();
        var monthIndex = date.getMonth();
        var thaiMonthsShort = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        var month = thaiMonthsShort[monthIndex];
        var year = date.getFullYear() + 543;
        return day + ' ' + month + ' ' + year;
    }

    $('.wpt-date-picker').each(function() {
        var el = this;
        // Attach flatpickr with display formatter if not already attached
        try {
            var fp = el._flatpickr;
            if (fp) {
                // add handlers to ensure display format
                fp.config.onValueUpdate = fp.config.onValueUpdate || [];
                fp.config.onValueUpdate.push(function(selectedDates, dateStr, instance) {
                    if (selectedDates.length > 0) instance.input.value = formatDateForInput(selectedDates[0]);
                });
                fp.config.onChange = fp.config.onChange || [];
                fp.config.onChange.push(function(selectedDates, dateStr, instance) {
                    if (selectedDates.length > 0) instance.input.value = formatDateForInput(selectedDates[0]);
                });
            }
        } catch (e) {
            // ignore
        }
    });

    // Sub Tab Switching (for both Parking and Private Car tabs)
    $('.wpt-sub-tab').click(function() {
        // var parentTab = $(this).closest('.wpt-tab-content');
        // parentTab.find('.wpt-sub-tab').removeClass('wpt-active');

        $('.wpt-sub-tab').removeClass('wpt-active');
        $(this).addClass('wpt-active');

        // var subTabId = $(this).data('sub-tab');
        // parentTab.find('.wpt-sub-tab-content').hide();
        // parentTab.find('#wpt-' + subTabId).show();
    });


});