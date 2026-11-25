jQuery(document).ready(function($) {
    // Detect language from HTML lang attribute
    function getCurrentLanguage() {
        const htmlLang = document.documentElement.lang || '';
        // Check if Thai language (th, th-TH, etc.)
        return (htmlLang.startsWith('th')) ? 'th' : 'en';
    }
    
    const currentLang = getCurrentLanguage();
    const isEnglish = currentLang !== 'th';
    
    // Helper function to format date based on language
    function formatDateForInput(date) {
        const day = date.getDate();
        const monthIndex = date.getMonth();
        
        if (isEnglish) {
            // English format: "1 Jul 2025"
            const engMonthsShort = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];
            const month = engMonthsShort[monthIndex];
            const year = date.getFullYear(); // Christian year
            return `${day} ${month} ${year}`;
        } else {
            // Thai format: "1 ก.ค. 2568"
            const thaiMonthsShort = [
                'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
            ];
            const month = thaiMonthsShort[monthIndex];
            const year = date.getFullYear() + 543; // Buddhist year
            return `${day} ${month} ${year}`;
        }
    }

    // Set locale based on language
    if (isEnglish) {
        // Use default English locale (no need to localize)
        flatpickr.localize(flatpickr.l10ns.default);
    } else {
        // Custom Thai locale with Buddhist Era years
        const thaiLocale = {
            ...flatpickr.l10ns.th,
            months: {
                longhand: [
                    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                ],
                shorthand: [
                    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
                ]
            },
            weekdays: {
                longhand: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
                shorthand: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
            },
            firstDayOfWeek: 0,
            rangeSeparator: ' ถึง ',
            weekAbbreviation: 'สัปดาห์',
            scrollTitle: 'เลื่อนเพื่อเพิ่ม',
            toggleTitle: 'คลิกเพื่อเปลี่ยน',
            amPM: ['ก่อนเที่ยง', 'หลังเที่ยง'],
            yearAriaLabel: 'ปี พ.ศ.'
        };
        flatpickr.localize(thaiLocale);
    }

    // Custom hook to modify calendar display after render (only for Thai)
    function updateCalendarYear() {
        if (isEnglish) return; // Skip for English
        
        setTimeout(() => {
            const yearInputs = document.querySelectorAll('.flatpickr-calendar .cur-year');
            yearInputs.forEach(yearInput => {
                if (yearInput && yearInput.value) {
                    const currentValue = parseInt(yearInput.value);
                    if (currentValue < 2500) {
                        const buddhistYear = currentValue + 543;
                        yearInput.value = buddhistYear;
                        if (yearInput.parentElement) {
                            const yearDisplay = yearInput.parentElement.querySelector('.numInput');
                            if (yearDisplay) {
                                yearDisplay.value = buddhistYear;
                            }
                        }
                    }
                }
            });
            const yearInputsForEvents = document.querySelectorAll('.flatpickr-calendar .cur-year');
            yearInputsForEvents.forEach(yearInput => {
                yearInput.removeEventListener('input', handleYearInput);
                yearInput.removeEventListener('change', handleYearChange);
                yearInput.addEventListener('input', handleYearInput);
                yearInput.addEventListener('change', handleYearChange);
            });
        }, 10);
    }

    function handleYearInput(event) {
        const yearInput = event.target;
        const buddhistYear = parseInt(yearInput.value);
        if (buddhistYear > 2500) {
            const christianYear = buddhistYear - 543;
            yearInput.setAttribute('data-christian-year', christianYear);
        }
    }

    function handleYearChange(event) {
        const yearInput = event.target;
        const christianYear = yearInput.getAttribute('data-christian-year');
        if (christianYear) {
            yearInput.value = christianYear;
            const calendar = yearInput.closest('.flatpickr-calendar');
            if (calendar && calendar._flatpickr) {
                calendar._flatpickr.changeYear(parseInt(christianYear));
            }
            setTimeout(() => {
                yearInput.value = parseInt(christianYear) + 543;
            }, 50);
        }
    }

    // Start Date Picker with Thai Buddhist year display
    const startDatePicker = flatpickr("#startDate", {
        dateFormat: "d/m/Y",
        defaultDate: "today",
        onReady: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
            if (selectedDates.length > 0) {
                instance.input.value = formatDateForInput(selectedDates[0]);
            }
        },
        onMonthChange: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onYearChange: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onOpen: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onValueUpdate: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                instance.input.value = formatDateForInput(selectedDates[0]);
            }
        },
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                instance.input.value = formatDateForInput(selectedDates[0]);
                // เซ็ต minDate ของ endDate picker เพื่อไม่ให้เลือกวันที่ก่อน startDate
                // แต่ไม่ต้องเปลี่ยน display ของ endDate
                endDatePicker.set('minDate', selectedDates[0]);
            }
        }
    });

    // End Date Picker with Thai Buddhist year display
    const endDatePicker = flatpickr("#endDate", {
        dateFormat: "d/m/Y",
        onReady: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
            // แสดง endDate ในรูปแบบ Thai ถ้ามีค่า
            if (selectedDates.length > 0) {
                instance.input.value = formatDateForInput(selectedDates[0]);
            }
        },
        onMonthChange: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onYearChange: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onOpen: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onValueUpdate: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                instance.input.value = formatDateForInput(selectedDates[0]);
            }
        },
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                instance.input.value = formatDateForInput(selectedDates[0]);
            }
        }
    });


    const departDate = flatpickr("#departDate", {
        dateFormat: "d/m/Y",
        onReady: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onMonthChange: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onYearChange: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onOpen: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onValueUpdate: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                instance.input.value = formatDateForInput(selectedDates[0]);
            }
        },
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                instance.input.value = formatDateForInput(selectedDates[0]);
            }
        }
    });

    const returnDate = flatpickr("#returnDate", {
        dateFormat: "d/m/Y",
        onReady: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onMonthChange: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onYearChange: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onOpen: function(selectedDates, dateStr, instance) {
            updateCalendarYear();
        },
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                instance.input.value = formatDateForInput(selectedDates[0]);
            }
        }
    });
});