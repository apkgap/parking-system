document.addEventListener('DOMContentLoaded', function() {
    if (window.__todayBookingsInitialized) { return; }
    window.__todayBookingsInitialized = true;

    const todayTbody = document.getElementById('today-bookings-tbody');
    const todayReloadButton = document.getElementById('reload-today-bookings');
    const todayPaginationContainer = document.getElementById('today-pagination-container');

    if (todayTbody && todayReloadButton && todayPaginationContainer) {
        let todayCurrentPage = 1;
        let todayTotalPages = 1;
        let todayTotalBookings = 0;

        function renderStatusBadge(statusValue) {
            const statusConfig = {
                'confirmed':   { label: 'ยืนยันแล้ว', color: 'bg-purple-100 text-purple-800' },
                'checked-in':  { label: 'เช็คอิน',    color: 'bg-blue-100 text-blue-800' },
                'checked-out': { label: 'เช็คเอาท์',  color: 'bg-green-100 text-green-800' },
                'cancel':      { label: 'ยกเลิก',      color: 'bg-red-100 text-red-800' },
                'none':        { label: 'ไม่มีข้อมูล',  color: 'bg-gray-100 text-gray-800' }
            };
    
            const config = statusConfig[statusValue] || statusConfig['none'];
            return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}">${escapeHtml(config.label)}</span>`;
        }

        function escapeHtml(text) {
            if (text === null || text === undefined) return '';
            return text.toString().replace(/[&<>"']/g, m => ({'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#039;'}[m]));
        }

        function renderTodayPagination(meta) {
            if (!meta || !meta.total_pages || meta.total_pages <= 1) {
                todayPaginationContainer.innerHTML = '';
                return;
            }

            const current_page = parseInt(meta.current_page, 10) || 1;
            const total_pages = parseInt(meta.total_pages, 10) || 1;
            const total = parseInt(meta.total, 10) || 0;
            const per_page = parseInt(meta.per_page, 10) || 10;
            const startItem = ((current_page - 1) * per_page) + 1;
            const endItem = Math.min(current_page * per_page, total);

            let paginationHTML = `
                <div class="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                    <div class="text-sm text-gray-700">
                        แสดง <span class="font-medium">${startItem}</span> ถึง <span class="font-medium">${endItem}</span> 
                        จาก <span class="font-medium">${total}</span> รายการ
                    </div>
                    <div class="flex items-center space-x-1">
            `;

            // Previous button
            paginationHTML += `
                <button onclick="window.fetchTodayBookings(${current_page - 1})" 
                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 ${current_page <= 1 ? 'cursor-not-allowed opacity-50' : ''}" ${current_page <= 1 ? 'disabled' : ''}>
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                </button>
            `;

            // Page numbers (simplified)
            paginationHTML += `<span class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300">หน้า ${current_page} / ${total_pages}</span>`;

            // Next button
            paginationHTML += `
                <button onclick="window.fetchTodayBookings(${current_page + 1})" 
                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 ${current_page >= total_pages ? 'cursor-not-allowed opacity-50' : ''}" ${current_page >= total_pages ? 'disabled' : ''}>
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>
                </button>
            `;

            paginationHTML += `</div></div>`;
            todayPaginationContainer.innerHTML = paginationHTML;
        }

        const renderTodayLoadingSkeleton = () => {
            const cols = 7;
            const rows = 10;
            let html = '';
            for (let r = 0; r < rows; r++) {
                html += '<tr class="border-b">';
                for (let c = 0; c < cols; c++) {
                    const widths = ['w-24', 'w-24', 'w-20', 'w-28', 'w-28', 'w-20', 'w-24'];
                    const w = widths[c] || 'w-24';
                    html += `
                        <td class="px-4 py-3">
                            <div class="h-4 ${w} bg-gray-200 rounded animate-pulse"></div>
                        </td>
                    `;
                }
                html += '</tr>';
            }
            todayTbody.innerHTML = html;
        };


        const fetchTodayBookings = async (page = 1) => {
            todayCurrentPage = page;
            renderTodayLoadingSkeleton();

            try {
                const response = await fetch(`/wp-json/parking/v1/today-bookings?page=${page}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const responseData = await response.json();
                const bookings = responseData.data;
                const meta = responseData.meta;

                if (!bookings || !meta) {
                    throw new Error('Invalid data structure from API');
                }

                todayTotalPages = meta.total_pages;
                todayTotalBookings = meta.total;

                if (bookings.length > 0) {
                    let html = '';
                    bookings.forEach((booking, index) => {
                        const {
                            id,
                            order_code: orderCode = '',
                            fullname_park: customerName = '-',
                            location_park: locationPark,
                            start_date: startDate = '-',
                            end_date: endDate = '-',
                            tracking_check_status: statusValue = 'none',
                            addon_information: addonInfo
                        } = booking;

                        const locationName = locationPark?.name || '-';
                        const hasAddons = addonInfo && (addonInfo.service_pickup || addonInfo.service_valet);
                        const editUrl = `${location.origin}/wp-admin/post.php?post=${id}&action=edit&classic-editor`;
                        const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

                        html += `
                            <tr class="${bgClass} border-b hover:bg-gray-100">
                                <td class="px-4 py-3 text-left text-sm text-gray-700"><span class="font-medium">${escapeHtml(customerName)}</span></td>
                                <td class="px-4 py-3 text-left text-sm text-gray-700">${escapeHtml(locationName)}</td>
                                <td class="px-4 py-3 text-left text-sm text-gray-700"><span class="font-mono">${escapeHtml(startDate)}</span></td>
                                <td class="px-4 py-3 text-left text-sm text-gray-700"><span class="font-mono">${escapeHtml(endDate)}</span></td>
                                <td class="px-4 py-3 text-center text-sm">${renderStatusBadge(statusValue)}</td>
                                <td class="px-4 py-3 text-center text-sm">
                                    ${hasAddons ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check text-green-500 inline-block"><polyline points="20 6 9 17 4 12"></polyline></svg>` : '-'}
                                </td>
                                <td class="px-4 py-3 text-center text-sm">
                                     <a href="${editUrl}" target="_blank" class="text-blue-600 hover:text-blue-900 p-1 inline-block" title="แก้ไข">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    </a>
                                </td>
                            </tr>
                        `;
                    });
                    todayTbody.innerHTML = html;
                } else {
                    todayTbody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-gray-500">ไม่พบรายการจองสำหรับวันนี้</td></tr>';
                }
                renderTodayPagination(meta);
            } catch (error) {
                console.error('Error fetching today\'s bookings:', error);
                todayTbody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
            }
        };

        window.fetchTodayBookings = fetchTodayBookings;
        fetchTodayBookings();
        todayReloadButton.addEventListener('click', () => fetchTodayBookings());
    }
});