jQuery(document).ready(function($) {

    function initializeTimePickersBox(inputId, containerClass, pickerTitle, defaultValue = '09:00') {
        if (typeof Picker === 'undefined') {
            console.warn('Picker.js is not loaded. Time pickers will not be initialized.');
            return;
        }

        const input = document.getElementById(inputId);
        const container = document.querySelector(containerClass);

        if (!input || !container) {
            console.warn(`Time picker elements not found for ${inputId}. Skipping time picker initialization.`);
            return;
        }

        const pickerOptions = {
            format: 'HH:mm',
            increment: { minute: 1 },
            headers: true,
            controls: true,
            inline: true,
            rows: 4,
            text: {
                title: pickerTitle,
                cancel: (typeof parkingTranslations !== 'undefined' && parkingTranslations.cancel) ? parkingTranslations.cancel : 'ยกเลิก',
                confirm: (typeof parkingTranslations !== 'undefined' && parkingTranslations.confirm) ? parkingTranslations.confirm : 'ตกลง'
            }
        };

        const picker = new Picker(input, {
            ...pickerOptions,
            container: container,
            value: input.value || defaultValue,
        });

        const pickerEl = container.querySelector('.picker');
        if (pickerEl) pickerEl.style.display = 'none';

        input.addEventListener('click', (e) => {
            e.stopPropagation();
            if (pickerEl) pickerEl.style.display = 'block';
        });

        document.addEventListener('click', (e) => {
            if (pickerEl &&
                !input.contains(e.target) &&
                !container.contains(e.target) &&
                !pickerEl.contains(e.target)) {
                pickerEl.style.display = 'none';
            }
        });
    }

    // เรียกใช้สำหรับแต่ละ input
    var departTimeTitle = (typeof parkingTranslations !== 'undefined') ? 'เลือกเวลาออกเดินทาง' : 'Select Departure Time';
    var returnTimeTitle = (typeof parkingTranslations !== 'undefined') ? 'เลือกเวลาออกเดินทาง (ขากลับ)' : 'Select Return Time';
    initializeTimePickersBox('departTime', '.ib_departTime', departTimeTitle, '09:00');
    initializeTimePickersBox('returnTime', '.ib_returnTime', returnTimeTitle, '18:00');
    // initializeTimePickersBox('arrivalFlightTime', '.ib_arrivalFlightTime', 'เลือกเวลาเที่ยวบินขาเข้า', '09:00');
    // initializeTimePickersBox('departureFlightTime', '.ib_departureFlightTime', 'เลือกเวลาเที่ยวบินขาออก', '09:00');

    // ตั้งค่าเริ่มต้นสำหรับ input fields
    function setDefaultTimeValues() {
        document.getElementById('departTime').value = '09:00';
        document.getElementById('returnTime').value = '18:00';
        document.getElementById('arrivalFlightTime').value = '09:00';
        document.getElementById('departureFlightTime').value = '09:00';
    }
    
    // เรียกใช้งาน function ตั้งค่าเริ่มต้น
    setDefaultTimeValues();

    
    /**
     * Summary Update Handler for Car Rental Form
     * Updates the summary section in real-time as user fills the form
     */
    
    class SummaryUpdater {
        constructor() {
            this.initializeElements();
            this.bindEvents();
            this.updateSummary(); // Initial update
        }

        initializeElements() {
            this.$tripTypeCheckbox = $('#trip-type');
            this.$returnBox = $('#return-box');
            this.$summaryReturnTrip = $('#summary-return-trip');
            
            // Initialize trip type display
            this.handleTripTypeChange();
        }

        bindEvents() {
            // Trip type change
            this.$tripTypeCheckbox.on('change', () => this.handleTripTypeChange());

            // Passenger count inputs
            $('#adultCount').on('input change', (e) => this.handlePassengerCount(e, 'adult'));
            $('#childCount').on('input change', (e) => this.handlePassengerCount(e, 'child'));

            // All form inputs
            const formInputs = [
                '#fullname', '#email', '#lineId', '#phone',
                '#departStart', '#departStartNote', '#departHuaHin', '#departHuaHinNote', '#departDate', '#departTime',
                '#returnStart', '#returnStartNote', '#returnHuaHin', '#returnHuaHinNote', '#returnDate', '#returnTime',
                '#carTypeSelect', '#remark',
                '#arrivalFlightNo', '#arrivalFlightTime', '#departureFlightNo', '#departureFlightTime', '#discountCode', '#flightNote'
            ];

            formInputs.forEach(selector => {
                $(selector).on('input change keyup', () => this.updateSummary());
            });

            // Set initial passenger count displays
            this.setInitialPassengerCounts();
        }

        handleTripTypeChange() {
            const isRoundTrip = this.$tripTypeCheckbox.is(':checked');
            
            if (isRoundTrip) {
                this.$returnBox.show();
                this.$summaryReturnTrip.show();
            } else {
                this.$returnBox.hide();
                this.$summaryReturnTrip.hide();
                this.clearReturnTripSummary();
            }
            
            this.updateSummary();
        }

        handlePassengerCount(event, type) {
            const value = $(event.target).val();
            const displayId = type === 'adult' ? '#adultCount-display' : '#childCount-display';
            const summaryClass = type === 'adult' ? '.summary-adultCount' : '.summary-childCount';
            
            $(displayId).text(value);
            var personText = (typeof getText === 'function') ? getText('คน', 'person') : ((typeof parkingTranslations !== 'undefined' && parkingTranslations.person) ? parkingTranslations.person : 'คน');
            $(summaryClass).text(value + ' ' + personText);
        }

        setInitialPassengerCounts() {
            const adultCount = $('#adultCount').val();
            const childCount = $('#childCount').val();
            
            $('#adultCount-display').text(adultCount);
            $('#childCount-display').text(childCount);
            var personText = (typeof getText === 'function') ? getText('คน', 'person') : ((typeof parkingTranslations !== 'undefined' && parkingTranslations.person) ? parkingTranslations.person : 'คน');
            $('.summary-adultCount').text(adultCount + ' ' + personText);
            $('.summary-childCount').text(childCount + ' ' + personText);
        }

        clearReturnTripSummary() {
            const returnFields = [
                '.summary-returnStart', '.summary-returnStartNote', 
                '.summary-returnHuaHin', '.summary-returnHuaHinNote', 
                '.summary-returnDate', '.summary-returnTime'
            ];
            
            returnFields.forEach(field => $(field).text('-'));
        }

        formatDate(dateStr) {
            if (!dateStr) return '-';
            
            try {
                console.log('Input dateStr:', dateStr);
                
                // Thai month mapping
                const thaiMonths = {
                    'ม.ค.': '01', 'ก.พ.': '02', 'มี.ค.': '03', 'เม.ย.': '04',
                    'พ.ค.': '05', 'มิ.ย.': '06', 'ก.ค.': '07', 'ส.ค.': '08',
                    'ก.ย.': '09', 'ต.ค.': '10', 'พ.ย.': '11', 'ธ.ค.': '12'
                };
                
                let date;
                
                // Handle Thai date format (e.g., "25 ก.ค. 2568")
                if (dateStr.includes('ค.') || dateStr.includes('ย.') || dateStr.includes('ง.')) {
                    const parts = dateStr.trim().split(' ');
                    if (parts.length === 3) {
                        const day = parts[0];
                        const thaiMonth = parts[1];
                        let year = parseInt(parts[2]);
                        
                        // Convert Buddhist year to Gregorian year if needed
                        if (year > 2500) {
                            year = year - 543;
                        }
                        
                        const month = thaiMonths[thaiMonth];
                        if (month) {
                            date = new Date(year, parseInt(month) - 1, parseInt(day));
                        } else {
                            console.error('Unknown Thai month:', thaiMonth);
                            return dateStr;
                        }
                    } else {
                        return dateStr;
                    }
                }
                // Handle YYYY-MM-DD format
                else if (dateStr.includes('-')) {
                    date = new Date(dateStr);
                }
                // Handle YYYYMMDD format
                else if (dateStr.length === 8) {
                    const year = dateStr.substring(0, 4);
                    const month = dateStr.substring(4, 6);
                    const day = dateStr.substring(6, 8);
                    date = new Date(year, month - 1, day);
                }
                // Try direct parsing
                else {
                    date = new Date(dateStr);
                }
                
                console.log('Parsed date:', date);
                
                if (isNaN(date.getTime())) {
                    console.error('Invalid date:', dateStr);
                    return dateStr; // Return original string if parsing fails
                }
                
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                
                const formatted = `${day}/${month}/${year}`;
                console.log('Formatted date:', formatted);
                
                return formatted;
            } catch (error) {
                console.error('Date formatting error:', error);
                return dateStr; // Return original string if error occurs
            }
        }

        formatTime(timeStr) {
            if (!timeStr) return '-';
            var timeUnit = (typeof parkingTranslations !== 'undefined') ? ' น.' : '';
            return timeStr + timeUnit;
        }

        getSelectText(selector, placeholder = 'เลือกสถานที่') {
            const selectedText = $(selector + ' option:selected').text();
            const loadingText = (typeof parkingTranslations !== 'undefined' && parkingTranslations.loading) ? parkingTranslations.loading : 'กำลังโหลด...';
            
            if (!selectedText || selectedText === placeholder || selectedText === loadingText) {
                return '-';
            }
            return selectedText;
        }

        updatePersonalInfo() {
            $('.summary-fullname').text($('#fullname').val() || '-');
            $('.summary-email').text($('#email').val() || '-');
            $('.summary-lineId').text($('#lineId').val() || '-');
            $('.summary-phone').text($('#phone').val() || '-');
        }

        updateOutboundTrip() {
            $('.summary-departStart').text(this.getSelectText('#departStart'));
            $('.summary-departStartNote').text($('#departStartNote').val() || '-');
            $('.summary-departHuaHin').text(this.getSelectText('#departHuaHin'));
            $('.summary-departHuaHinNote').text($('#departHuaHinNote').val() || '-');
            $('.summary-departDate').text(this.formatDate($('#departDate').val()));
            $('.summary-departTime').text(this.formatTime($('#departTime').val()));
        }

        updateReturnTrip() {
            if (this.$tripTypeCheckbox.is(':checked')) {
                $('.summary-returnStart').text(this.getSelectText('#returnStart'));
                $('.summary-returnStartNote').text($('#returnStartNote').val() || '-');
                $('.summary-returnHuaHin').text(this.getSelectText('#returnHuaHin'));
                $('.summary-returnHuaHinNote').text($('#returnHuaHinNote').val() || '-');
                $('.summary-returnDate').text(this.formatDate($('#returnDate').val()));
                $('.summary-returnTime').text(this.formatTime($('#returnTime').val()));
            }
        }

        updateBookingDetails() {
            var selectCarText = (typeof parkingTranslations !== 'undefined') ? 'เลือกรถ' : 'Select Vehicle';
            $('.summary-carType').text(this.getSelectText('#carTypeSelect', selectCarText));
            $('.summary-remark').text($('#remark').val() || '-');
        }

        updateFlightInfo() {
            $('.summary-arrivalFlight').text($('#arrivalFlightNo').val() || '-');
            $('.summary-arrivalFlightTime').text(this.formatTime($('#arrivalFlightTime').val()));
            $('.summary-departureFlight').text($('#departureFlightNo').val() || '-');
            $('.summary-departureFlightTime').text(this.formatTime($('#departureFlightTime').val()));
            $('.summary-discountCode').text($('#discountCode').val() || '-');
            $('.summary-flightNote').text($('#flightNote').val() || '-');
        }

        updateSummary() {
            try {
                this.updatePersonalInfo();
                this.updateOutboundTrip();
                this.updateReturnTrip();
                this.updateBookingDetails();
                this.updateFlightInfo();
            } catch (error) {
                console.error('Error updating summary:', error);
            }
        }

        // Public method to manually trigger update
        refresh() {
            this.updateSummary();
        }
    }

    // Initialize the summary updater
    window.summaryUpdater = new SummaryUpdater();
    
    // Make it globally accessible for debugging
    if (typeof window.debug === 'undefined') {
        window.debug = {};
    }
    window.debug.summaryUpdater = window.summaryUpdater;

});
