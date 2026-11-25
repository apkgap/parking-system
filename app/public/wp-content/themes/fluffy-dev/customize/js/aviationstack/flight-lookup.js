(function ($) {
  document.addEventListener('DOMContentLoaded', function () {
    // รายการ input ที่ต้องการให้มี autocomplete
    const flightInputs = [
      'sending_flight_depart',
      'sending_flight_arrival',
      'flight_depart',
      'flight_arrival',
      'arrivalFlightNo',
      'departureFlightNo'
    ];

    // วนลูปสร้าง autocomplete ให้แต่ละ input
    flightInputs.forEach(inputId => {
      initializeFlightLookup(inputId);
    });

    function initializeFlightLookup(inputId) {
      const flightInput = document.getElementById(inputId);

      // ถ้าไม่มีช่องตามไอดีนี้ ก็ไม่ต้องทำอะไร
      if (!flightInput) return;

      const group = flightInput.closest('.input-group');
      if (!group) return;

      const popup = group.querySelector('.popup_data');
      if (!popup) return;

      // ให้แน่ใจว่า parent เป็น relative (เพื่อให้ dropdown วางตำแหน่งถูก)
      if (!group.classList.contains('relative')) {
        group.classList.add('relative');
      }
      // ตั้งค่า class tailwind ให้กล่อง popup (ถ้ายังไม่ได้ใส่ใน HTML)
      popup.classList.add(
        'absolute', 'left-0', 'right-0', 'top-full', 'bg-white',
        'border', 'border-gray-200', 'rounded-lg', 'mt-1',
        'max-h-72', 'overflow-auto', 'z-50', 'shadow-xl', 'hidden'
      );

      // ===== State =====
      let debounceTimer = null;
      let results       = [];
      let activeIndex   = -1;
      let currentRequest = null; // Track ongoing request

      // ===== Utils =====
      function toDateTimeText(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm   = String(d.getMonth() + 1).padStart(2, '0');
        const dd   = String(d.getDate()).padStart(2, '0');
        const hh   = String(d.getHours()).padStart(2, '0');
        const mi   = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
      }
      function toHHMM(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mi}`;
      }
      function toLabel(f) {
        const al     = f && f.airline && f.airline.name ? f.airline.name : '-';
        const code   = f && f.flight && (f.flight.iata || f.flight.number) ? (f.flight.iata || f.flight.number) : '-';
        const depApt = f && f.departure && f.departure.airport ? f.departure.airport : '-';
        const arrApt = f && f.arrival && f.arrival.airport ? f.arrival.airport : '-';
        const depTm  = toDateTimeText(f && f.departure && f.departure.scheduled);
        const arrTm  = toDateTimeText(f && f.arrival   && f.arrival.scheduled);
        return {
          line1: `${al} (${code})`,
          line2: `${depApt} → ${arrApt}`,
          line3: `${depTm} → ${arrTm}`
        };
      }

      function render(items) {
        results = items || [];
        activeIndex = -1;

        if (!results.length) {
          popup.innerHTML = `<div class="p-3 text-gray-500">ไม่พบข้อมูล</div>`;
          popup.classList.remove('hidden');
          return;
        }

        popup.innerHTML = results.map((f, i) => {
          const l = toLabel(f);
          const code = (f && f.flight && f.flight.iata) ? f.flight.iata : '-';
          return `
            <div
              class="flex items-start gap-2 py-2 px-3 cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
              role="option"
              data-index="${i}">
              <div class="font-semibold min-w-[5.5rem]">${code}</div>
              <div>
                <div class="text-gray-700">${escapeHtml(l.line1)}</div>
                <div class="text-gray-700">${escapeHtml(l.line2)}</div>
                <div class="text-gray-500 text-sm">${escapeHtml(l.line3)}</div>
              </div>
            </div>
          `;
        }).join('');

        popup.classList.remove('hidden');
      }

      function clearPopup() {
        popup.classList.add('hidden');
        popup.innerHTML = '';
        activeIndex = -1;
      }

      function showError(message, isWarning = false) {
        const bgColor = isWarning ? 'bg-yellow-50' : 'bg-red-50';
        const borderColor = isWarning ? 'border-yellow-300' : 'border-red-300';
        const textColor = isWarning ? 'text-yellow-800' : 'text-red-800';
        const iconColor = isWarning ? 'text-yellow-600' : 'text-red-600';
        
        const icon = isWarning 
          ? `<svg class="w-6 h-6 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
             </svg>`
          : `<svg class="w-6 h-6 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
             </svg>`;
        
        popup.innerHTML = `
          <div class="p-4 ${bgColor} border ${borderColor} rounded-lg m-2">
            <div class="flex items-start gap-2">
              <div class="flex-shrink-0">${icon}</div>
              <div class="flex-1">
                <div class="font-semibold ${textColor} mb-1">แจ้งเตือน</div>
                <div class="${textColor} text-sm">${escapeHtml(message)}</div>
              </div>
            </div>
          </div>
        `;
        popup.classList.remove('hidden');
        
        // ซ่อนข้อความหลัง 8 วินาที
        setTimeout(() => {
          if (popup.innerHTML.includes(escapeHtml(message))) {
            clearPopup();
          }
        }, 8000);
      }

      function pick(index) {
        const f = results[index];
        if (!f) return;

        // บันทึกลง input ที่จะส่งฟอร์ม
        const code = f && f.flight && f.flight.iata ? f.flight.iata.toUpperCase() : '';
        flightInput.value = code;

        // ถ้าต้องเก็บ JSON ทั้งก้อน ไว้ใน hidden field (ถ้าคุณมี)
        const hiddenJson = document.getElementById(`${inputId}_data`);
        if (hiddenJson) hiddenJson.value = JSON.stringify(f);

        // กำหนดค่าเวลาให้กับ input ที่เกี่ยวข้อง
        setTimeFields(inputId, f);

        clearPopup();
      }

      function setTimeFields(inputId, flightData) {
        // กำหนดชื่อ field ของเวลาตามชื่อ field ของเที่ยวบิน
        let timeFieldId = '';
        
        if (inputId === 'sending_flight_depart') {
          timeFieldId = 'sending_flight_depart_time';
        } else if (inputId === 'sending_flight_arrival') {
          timeFieldId = 'sending_flight_arrival_time';
        } else if (inputId === 'flight_depart') {
          timeFieldId = 'flight_depart_time';
        } else if (inputId === 'flight_arrival') {
          timeFieldId = 'flight_arrival_time';
        } else if (inputId === 'arrivalFlightNo') {
          timeFieldId = 'arrivalFlightTime';
        } else if (inputId === 'departureFlightNo') {
          timeFieldId = 'departureFlightTime';
        }
        
        // ถ้ามี field ของเวลา ให้กำหนดค่า
        if (timeFieldId) {
          const timeField = document.getElementById(timeFieldId);
          if (timeField) {
            // ใช้เวลาจาก departure หรือ arrival ตาม field ที่เกี่ยวข้อง
            let timeValue = '';
            if (inputId.includes('depart')) {
              timeValue = toHHMM(flightData && flightData.departure && flightData.departure.scheduled);
            } else if (inputId.includes('arrival')) {
              timeValue = toHHMM(flightData && flightData.arrival && flightData.arrival.scheduled);
            }
            timeField.value = timeValue;
          }
        }
      }

      function updateActive() {
        Array.from(popup.querySelectorAll('[role="option"]')).forEach((el, idx) => {
          el.setAttribute('aria-selected', idx === activeIndex ? 'true' : 'false');
          if (idx === activeIndex) el.scrollIntoView({ block: 'nearest' });
        });
      }

      function escapeHtml(str) {
        return String(str || '').replace(/[&<>"'`=\/]/g, function (s) {
          return ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
            "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
          })[s];
        });
      }

      // ===== Events =====
      popup.addEventListener('click', (e) => {
        const el = e.target.closest('[role="option"]');
        if (!el) return;
        pick(parseInt(el.dataset.index, 10));
      });

      // ลูกศรขึ้น/ลง + Enter + Esc
      flightInput.addEventListener('keydown', (e) => {
        if (popup.classList.contains('hidden')) return;

        const max = results.length - 1;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          activeIndex = Math.min(max, activeIndex + 1);
          updateActive();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          activeIndex = Math.max(0, activeIndex - 1);
          updateActive();
        } else if (e.key === 'Enter') {
          if (activeIndex >= 0 && activeIndex <= max) {
            e.preventDefault();
            pick(activeIndex);
          }
        } else if (e.key === 'Escape') {
          clearPopup();
        }
      });

      // คลิกนอกปิด popup
      document.addEventListener('click', (e) => {
        if (!popup.contains(e.target) && e.target !== flightInput) {
          clearPopup();
        }
      });

      // ค้นหาแบบ debounce
      flightInput.addEventListener('input', () => {
        // เคลียร์เมื่อผู้ใช้พิมพ์ใหม่
        const hiddenJson = document.getElementById(`${inputId}_data`);
        if (hiddenJson) hiddenJson.value = '';

        const q = (flightInput.value || '').trim();
        if (q.length < 2) { clearPopup(); return; }

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => searchFlights(q), 300);
      });

      // ทำตัวพิมพ์ใหญ่ตอน blur
      // flightInput.addEventListener('blur', () => {
      //   flightInput.value = (flightInput.value || '').toUpperCase();
      // });

      // ===== AJAX ===== (Now using FlightAPI.io backend)
      async function searchFlights(q) {
        // Cancel previous request if exists
        if (currentRequest) {
          currentRequest.abort();
        }
        
        try {
          // Create new AbortController for this request
          currentRequest = new AbortController();
          
          const fd = new FormData();
          fd.append('action', 'akp_flight_search');
          fd.append('_ajax_nonce',  akpFlightSearch.nonce);
          fd.append('flight_iata', q);
          fd.append('limit', '15');
          fd.append('offset', '0');

          const res = await fetch(akpFlightSearch.ajax_url, {
            method: 'POST',
            body: fd,
            credentials: 'same-origin',
            signal: currentRequest.signal
          });
          
          // Clear current request on success
          currentRequest = null;

          if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
          const data = await res.json();
          
          // ตรวจสอบ error จาก API
          if (data && data.error) {
            let errorMessage = '';
            let isWarning = false;
            
            switch(data.error) {
              case 'no_results':
                // แสดงข้อความไม่พบข้อมูลแบบปกติ พร้อมหมายเลขที่ค้นหา
                popup.innerHTML = `<div class="p-3 text-gray-500">ไม่พบข้อมูลเที่ยวบิน "${escapeHtml(q.toUpperCase())}"</div>`;
                popup.classList.remove('hidden');
                return;
              
              case 'rate_limited':
                errorMessage = data.message || 'ขออภัย ระบบตรวจสอบเที่ยวบินถูกจำกัดชั่วคราว โปรดลองใหม่อีกครั้งภายหลัง';
                isWarning = true;
                break;
              
              case 'invalid_flight_format':
                errorMessage = data.message || 'รูปแบบหมายเลขเที่ยวบินไม่ถูกต้อง (ตัวอย่าง: TG123, PG166)';
                isWarning = true;
                break;
              
              case 'missing_api_key':
                errorMessage = 'ไม่พบ API Key กรุณาติดต่อผู้ดูแลระบบ';
                break;
              
              case 'fetch_failed':
              case 'api_error':
              case 'bad_json':
                errorMessage = data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
                break;
              
              default:
                errorMessage = data.message || 'เกิดข้อผิดพลาด';
                break;
            }
            
            if (errorMessage) {
              showError(errorMessage, isWarning);
            }
            return;
          }
          
          render((data && data.flights) ? data.flights : []);
        } catch (err) {
          // Ignore abort errors
          if (err.name === 'AbortError') {
            return;
          }
          
          currentRequest = null;
          showError('เกิดข้อผิดพลาดระหว่างค้นหา: ' + err.message);
        }
      }
    }
  });
})(jQuery);