document.addEventListener('DOMContentLoaded', async function() {
    // Prevent double initialization if this script is enqueued twice
    if (window.__parkingUIInitialized) { return; }
    window.__parkingUIInitialized = true;
    const tableContainer = document.querySelector('.parking-table-container');
    const tbody = document.querySelector('.parking-table tbody');
    const paginationContainer = document.getElementById('parking-pagination');
    const searchInput = document.getElementById('parking-search');
    const exportButton = document.getElementById('export-button');
    const exportDropdown = document.getElementById('export-dropdown');
    const filterButton = document.getElementById('filter-button');
    const filterDropdown = document.getElementById('filter-dropdown');
    const refreshButton = document.getElementById('refresh-button');
    const addParkingButton = document.getElementById('add-parking-button');
    
    if (!tableContainer || !tbody || !paginationContainer) {
        console.error('Required elements not found for parking pagination');
        return;
    }
    
    let currentPage = 1;
    const perPage = 12; // 12 รายการต่อหน้า
    let searchQuery = '';
    let statusFilter = '';
    let sortBy = '';
    let sortOrder = 'asc';
    let dateRange = '';
    let dateFrom = '';
    let dateTo = '';
    
    // Make fetchBookings globally accessible for pagination
    window.fetchBookings = fetchBookings;
    
    // Function to close all dropdowns
    function closeAllDropdowns() {
        if (exportDropdown) exportDropdown.classList.add('hidden');
        if (filterDropdown) filterDropdown.classList.add('hidden');
        const dateFilterDropdown = document.getElementById('date-filter-dropdown');
        if (dateFilterDropdown) dateFilterDropdown.classList.add('hidden');
    }
    
    // Function to fetch parking bookings data
    async function fetchBookings(page = 1, search = '', status = '', sort = '', order = 'asc', dateRangeParam = '', dateFromParam = '', dateToParam = '') {
        // Show loading skeleton state
        renderLoadingSkeleton();
        
        try {
            // สร้าง URL สำหรับการเรียก API พร้อมพารามิเตอร์
            let apiUrl = `/wp-json/parking/v1/bookings?page=${page}&per_page=${perPage}`;
            
            // เพิ่มพารามิเตอร์การค้นหาถ้ามี
            if (search) {
                apiUrl += `&search=${encodeURIComponent(search)}`;
            }
            
            // เพิ่มพารามิเตอร์การกรองสถานะถ้ามี
            if (status) {
                apiUrl += `&status=${encodeURIComponent(status)}`;
            }
            
            // เพิ่มพารามิเตอร์การเรียงลำดับถ้ามี
            if (sort) {
                apiUrl += `&sort=${encodeURIComponent(sort)}&order=${encodeURIComponent(order)}`;
            }
            
            // เพิ่มพารามิเตอร์การกรองวันที่
            if (dateRangeParam) {
                apiUrl += `&date_range=${encodeURIComponent(dateRangeParam)}`;
            }
            
            if (dateFromParam) {
                apiUrl += `&date_from=${encodeURIComponent(dateFromParam)}`;
            }
            
            if (dateToParam) {
                apiUrl += `&date_to=${encodeURIComponent(dateToParam)}`;
            }
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            renderTable(data.data);
            renderPagination(data.meta);
            
            // อัพเดตตัวแปรสถานะปัจจุบัน
            currentPage = page;
            searchQuery = search;
            statusFilter = status;
            sortBy = sort;
            sortOrder = order;
            dateRange = dateRangeParam;
            dateFrom = dateFromParam;
            dateTo = dateToParam;
        } catch (error) {
            console.error('Error fetching parking bookings:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-6 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
        }
    }

    // Render loading skeleton rows
    function renderLoadingSkeleton() {
        const cols = 8;
        const rows = Math.max(1, perPage);
        let html = '';
        for (let r = 0; r < rows; r++) {
            html += '<tr class="border-b">';
            for (let c = 0; c < cols; c++) {
                const widths = ['w-20','w-24','w-16','w-24','w-16','w-20','w-16','w-16'];
                const w = widths[c] || 'w-20';
                html += `
                    <td class="px-2 py-3 md:px-4 md:py-4 text-center">
                        <div class="mx-auto h-4 ${w} bg-gray-200 rounded animate-pulse"></div>
                    </td>
                `;
            }
            html += '</tr>';
        }
        tbody.innerHTML = html;
    }
    
    // Function to render table rows
    function renderTable(bookings) {
        if (!bookings || bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-6 text-gray-500">ไม่พบข้อมูลการจองที่จอดรถ</td></tr>';
            return;
        }
        
        let html = '';
        bookings.forEach((booking, index) => {
            // Extract data directly from booking object (not nested under acf)
            const customerName = booking.fullname_park || '-';
            const locationName = booking.location_park?.name || '-';
            const startDate = booking.start_date || '-';
            const endDate = booking.end_date || '-';
            const orderCode = booking.order_code || '';
            const addons = booking.addon_information;
            const hasAddons = addons && (addons.service_pickup || addons.service_valet);
            const statusValue = booking.tracking_check_status || 'none';
            const editUrl = `${location.origin}/wp-admin/post.php?post=${booking.id}&action=edit&classic-editor`;
            
            // Alternate row background colors
            const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            html += `
                <tr class="${bgClass} border-b hover:bg-gray-100">
                    <td class="px-4 py-3 text-center text-sm text-gray-700">${escapeHtml(orderCode)}</td>
                    <td class="px-4 py-3 text-left text-sm text-gray-700"><span class="font-medium">${escapeHtml(customerName)}</span></td>
                    <td class="px-4 py-3 text-left text-sm text-gray-700">${escapeHtml(locationName)}</td>
                    <td class="px-4 py-3 text-left text-sm text-gray-700"><span class="font-mono">${escapeHtml(startDate)}</span></td>
                    <td class="px-4 py-3 text-left text-sm text-gray-700"><span class="font-mono">${escapeHtml(endDate)}</span></td>
                    <td class="px-4 py-3 text-center text-sm">${renderStatusBadge(statusValue)}</td>
                    <td class="px-4 py-3 text-center text-sm">
                        ${hasAddons ? `
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check text-green-500 mx-auto">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ` : '-'}
                    </td>
                    <td class="px-4 py-3 text-center text-sm">
                        <div class="flex items-center justify-end md:justify-center space-x-1">
                            <a href="${editUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-900 p-1" title="แก้ไข">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    // Function to render status badge
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

    // Function to render pagination controls
    function renderPagination(meta) {
        if (!meta || meta.total_pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        const currentPage = meta.current_page;
        const totalPages = meta.total_pages;
        const total = meta.total;
        const perPage = meta.per_page;
        
        // คำนวณช่วงของรายการที่แสดง
        const startItem = ((currentPage - 1) * perPage) + 1;
        const endItem = Math.min(currentPage * perPage, total);
        
        let paginationHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div class="text-sm text-gray-700">
                    แสดง <span class="font-medium">${startItem}</span> ถึง <span class="font-medium">${endItem}</span> 
                    จาก <span class="font-medium">${total}</span> รายการ
                </div>
                <div class="flex items-center space-x-1">
        `;
        
        // Previous button
        if (currentPage > 1) {
            paginationHTML += `
                <button onclick="fetchBookings(${currentPage - 1}, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            `;
        } else {
            paginationHTML += `
                <span class="px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-300 rounded-l-lg cursor-not-allowed">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </span>
            `;
        }
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page and ellipsis
        if (startPage > 1) {
            paginationHTML += `
                <button onclick="fetchBookings(1, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-100 hover:text-gray-700">
                    1
                </button>
            `;
            if (startPage > 2) {
                paginationHTML += `
                    <span class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300">...</span>
                `;
            }
        }
        
        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                paginationHTML += `
                    <span class="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border-t border-b border-gray-300">
                        ${i}
                    </span>
                `;
            } else {
                paginationHTML += `
                    <button onclick="fetchBookings(${i}, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
                            class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-100 hover:text-gray-700">
                        ${i}
                    </button>
                `;
            }
        }
        
        // Last page and ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `
                    <span class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300">...</span>
                `;
            }
            paginationHTML += `
                <button onclick="fetchBookings(${totalPages}, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-100 hover:text-gray-700">
                    ${totalPages}
                </button>
            `;
        }
        
        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `
                <button onclick="fetchBookings(${currentPage + 1}, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            `;
        } else {
            paginationHTML += `
                <span class="px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-300 rounded-r-lg cursor-not-allowed">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </span>
            `;
        }
        
        paginationHTML += `
                </div>
            </div>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
    }
    
    // Utility function to escape HTML
    function escapeHtml(text) {
        if (text === null || text === undefined) {
            return '';
        }
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"]/g, function(m) { return map[m]; });
    }
    
    // Initialize the table
    await fetchBookings(currentPage);
    
    // ฟังก์ชันสำหรับจัดการการคลิกที่หัวตารางเพื่อเรียงลำดับ
    function handleSortClick(event) {
        const header = event.currentTarget;
        const sortKey = header.dataset.sort;
        
        if (sortBy === sortKey) {
            // สลับทิศทางการเรียงลำดับ
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            // เรียงลำดับใหม่
            sortBy = sortKey;
            sortOrder = 'asc';
        }
        
        // อัพเดตตัวบ่งชี้
        updateSortIndicators();
        
        // โหลดข้อมูลใหม่
        fetchBookings(1, searchQuery, statusFilter, sortBy, sortOrder, dateRange, dateFrom, dateTo);
    }
    
    // ฟังก์ชันสำหรับอัพเดตตัวบ่งชี้การเรียงลำดับ
    function updateSortIndicators() {
        const headers = document.querySelectorAll('.sortable');
        headers.forEach(header => {
            const indicator = header.querySelector('.sort-indicator svg');
            const sortKey = header.dataset.sort;
            
            if (sortKey === sortBy) {
                // แสดงทิศทางการเรียงลำดับ
                if (sortOrder === 'asc') {
                    indicator.style.transform = 'rotate(180deg)';
                    indicator.style.opacity = '1';
                } else if (sortOrder === 'desc') {
                    indicator.style.transform = 'rotate(0deg)';
                    indicator.style.opacity = '1';
                }
            } else {
                // รีเซ็ตเป็นสถานะเริ่มต้น
                indicator.style.transform = 'rotate(0deg)';
                indicator.style.opacity = '0.5';
            }
        });
    }
    
    // เพิ่ม event listeners สำหรับการเรียงลำดับ
    document.querySelectorAll('.parking-table th[data-sort]').forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', handleSortClick);
        
        // เพิ่มตัวบ่งชี้เริ่มต้นถ้ายังไม่มี
        if (!header.querySelector('.sort-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'sort-indicator inline-block ml-1 text-gray-400';
            indicator.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>';
            header.appendChild(indicator);
        }
    });
    
    // ===== Event Listeners for Table Controls =====
    
    // Search Input - ค้นหาเมื่อพิมพ์และหยุดพิมพ์ (debounce)
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                await fetchBookings(1, this.value, statusFilter, sortBy, sortOrder, dateRange, dateFrom, dateTo);
            }, 500); // รอ 500ms หลังจากหยุดพิมพ์
        });
    }
    
    // Export Button - แสดง/ซ่อนเมนูดรอปดาวน์
    if (exportButton && exportDropdown) {
        exportButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // ปิดเมนูอื่นๆ ก่อน
            closeAllDropdowns();
            
            // แสดงเมนู export
            exportDropdown.classList.remove('hidden');
        });
        
        // Export Options - จัดการการคลิกตัวเลือกการส่งออก
        exportDropdown.querySelectorAll('a').forEach(option => {
            option.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const format = this.textContent.toLowerCase();
                await exportBookings(format);
                exportDropdown.classList.add('hidden');
            });
        });
    }
    
    // Filter Button - แสดง/ซ่อนเมนูดรอปดาวน์
    if (filterButton && filterDropdown) {
        filterButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // ปิดเมนูอื่นๆ ก่อน
            closeAllDropdowns();
            
            // แสดงเมนู filter
            filterDropdown.classList.remove('hidden');
        });
        
        // Filter Options - จัดการการคลิกตัวเลือกการกรอง
        filterDropdown.querySelectorAll('a').forEach(option => {
            option.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const text = this.textContent;
                let status = '';
                
                if (text.includes('กำลังจอด')) status = 'active';
                else if (text.includes('เสร็จสิ้น')) status = 'completed';
                else if (text.includes('ยกเลิก')) status = 'cancelled';
                else if (text.includes('รอดำเนินการ')) status = 'pending';
                
                await fetchBookings(1, searchQuery, status, sortBy, sortOrder, dateRange, dateFrom, dateTo);
                filterDropdown.classList.add('hidden');
            });
        });
    }
    
    // Refresh Button - โหลดข้อมูลใหม่
    if (refreshButton) {
        refreshButton.addEventListener('click', async function() {
            await fetchBookings(currentPage, searchQuery, statusFilter, sortBy, sortOrder, dateRange, dateFrom, dateTo);
        });
    }
    
    // Add Parking Button - เปิดหน้าเพิ่มการจองที่จอดรถ
    if (addParkingButton) {
        addParkingButton.addEventListener('click', function(e) {
            e.preventDefault();
            // เปลี่ยนเป็น URL จริงของหน้าเพิ่มการจองที่จอดรถ
            window.location.href = '/dashboard/parking-management/add-booking/';
        });
    }
    
    // Date Filter Button - แสดง/ซ่อนเมนูดรอปดาวน์วันที่
    const dateFilterButton = document.getElementById('date-filter-button');
    const dateFilterDropdown = document.getElementById('date-filter-dropdown');
    
    if (dateFilterButton && dateFilterDropdown) {
        dateFilterButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // ปิดเมนูอื่นๆ ก่อน
            closeAllDropdowns();
            
            // แสดงเมนู date filter
            dateFilterDropdown.classList.remove('hidden');
        });
        
        // Quick Date Filter Options
        const quickFilterButtons = dateFilterDropdown.querySelectorAll('.date-quick-filter');
        quickFilterButtons.forEach(button => {
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const range = this.dataset.range;
                
                // Clear custom date inputs
                const dateStartInput = document.getElementById('date-start');
                const dateEndInput = document.getElementById('date-end');
                if (dateStartInput) dateStartInput.value = '';
                if (dateEndInput) dateEndInput.value = '';
                
                // Update active state
                quickFilterButtons.forEach(btn => btn.classList.remove('bg-blue-100', 'text-blue-800'));
                this.classList.add('bg-blue-100', 'text-blue-800');
                
                // Apply filter
                await fetchBookings(1, searchQuery, statusFilter, sortBy, sortOrder, range, '', '');
                dateFilterDropdown.classList.add('hidden');
            });
        });
        
        // Custom Date Range Apply Button
        const applyCustomDateButton = document.getElementById('apply-custom-date');
        if (applyCustomDateButton) {
            applyCustomDateButton.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const dateStartInput = document.getElementById('date-start');
                const dateEndInput = document.getElementById('date-end');
                
                const startDate = dateStartInput ? dateStartInput.value : '';
                const endDate = dateEndInput ? dateEndInput.value : '';
                
                if (!startDate && !endDate) {
                    alert('กรุณาเลือกวันที่เริ่มต้นหรือวันที่สิ้นสุด');
                    return;
                }
                
                // Clear quick filter active states
                quickFilterButtons.forEach(btn => btn.classList.remove('bg-blue-100', 'text-blue-800'));
                
                // Apply custom date filter
                await fetchBookings(1, searchQuery, statusFilter, sortBy, sortOrder, '', startDate, endDate);
                dateFilterDropdown.classList.add('hidden');
            });
        }
        
        // Clear Date Filter Button
        const clearDateFilterButton = document.getElementById('date-filter-clear');
        if (clearDateFilterButton) {
            clearDateFilterButton.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Clear all date inputs
                const dateStartInput = document.getElementById('date-start');
                const dateEndInput = document.getElementById('date-end');
                if (dateStartInput) dateStartInput.value = '';
                if (dateEndInput) dateEndInput.value = '';
                
                // Clear quick filter active states
                quickFilterButtons.forEach(btn => btn.classList.remove('bg-blue-100', 'text-blue-800'));
                
                // Apply filter without date parameters
                await fetchBookings(1, searchQuery, statusFilter, sortBy, sortOrder, '', '', '');
                dateFilterDropdown.classList.add('hidden');
            });
        }
    }
    
    // ปิดเมนูดรอปดาวน์เมื่อคลิกที่อื่น
    document.addEventListener('click', function(e) {
        // ตรวจสอบว่าคลิกนอกพื้นที่ของปุ่มและเมนูทั้งหมด
        const clickedInsideExport = exportButton && (exportButton.contains(e.target) || exportDropdown && exportDropdown.contains(e.target));
        const clickedInsideFilter = filterButton && (filterButton.contains(e.target) || filterDropdown && filterDropdown.contains(e.target));
        const clickedInsideDateFilter = dateFilterButton && (dateFilterButton.contains(e.target) || dateFilterDropdown && dateFilterDropdown.contains(e.target));
        
        if (!clickedInsideExport && !clickedInsideFilter && !clickedInsideDateFilter) {
            closeAllDropdowns();
        }
    });
    
    // หยุด propagation ของเหตุการณ์คลิกในดรอปดาวน์ เพื่อไม่ให้ปิดเมนู
    if (exportDropdown) {
        exportDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    if (filterDropdown) {
        filterDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    if (dateFilterDropdown) {
        dateFilterDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Export to Excel function for parking data
    window.exportParkingToExcel = async function() {
        try {
            // Get current search and filter parameters from parking.js
            const searchQuery = window.currentSearchQuery || '';
            const statusFilter = window.currentStatusFilter || '';
            const sortBy = window.currentSortBy || '';
            const sortOrder = window.currentSortOrder || 'asc';
            
            // If global variables are not available, try to get them from the parking.js fetchBookings function
            if (!window.currentSearchQuery && !window.currentStatusFilter) {
                // Use the same parameters as currently displayed in the table
                // These would have been set when fetchBookings was last called
            }
            
            // Get all table data (including filtered results)
            const headers = [];
            const rows = [];
            
            // Get headers from current table
            document.querySelectorAll('.parking-table thead th').forEach(th => {
                headers.push(th.textContent.trim().replace(/\s+/g, ' '));
            });
            
            // Add headers to rows
            rows.push(headers);
            
            // Get current data - use the same data that's being displayed
            const response = await fetch(`/wp-json/parking/v1/bookings?per_page=9999&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusFilter)}&sort=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(sortOrder)}`);
            const data = await response.json();
            
            // Debug log to check what data we're getting
            console.log('Excel export data received:', data);
            
            // Check if data is in the expected format
            if (data && data.data && data.data.length > 0) {
                // Use data.data if the API returns in that format (like in parking.js)
                data.data.forEach(booking => {
                    const rowData = [
                        booking.order_code || '',
                        booking.fullname_park || '',
                        (booking.location_park && booking.location_park.name) || booking.location_park || '',
                        booking.start_date || '',
                        booking.end_date || '',
                        booking.tracking_check_status || '',
                        (booking.addon_information && (booking.addon_information.service_pickup || booking.addon_information.service_valet)) ? 'Yes' : 'No' || '',
                        '' // actions column (usually not exported)
                    ];
                    rows.push(rowData);
                });
            } else if (data.bookings && data.bookings.length > 0) {
                // Fallback to original format
                data.bookings.forEach(booking => {
                    const rowData = [
                        booking.order_code || '',
                        booking.fullname_park || '',
                        (booking.location_park && booking.location_park.name) || booking.location_park || '',
                        booking.start_date || '',
                        booking.end_date || '',
                        booking.tracking_check_status || '',
                        (booking.addon_information && (booking.addon_information.service_pickup || booking.addon_information.service_valet)) ? 'Yes' : 'No' || '',
                        '' // actions column
                    ];
                    rows.push(rowData);
                });
            }
            
            // Create workbook
            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "การจองที่จอดรถ");
            
            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            
            // Download file
            XLSX.writeFile(wb, `parking_bookings_${dateStr}.xlsx`);
            
            console.log('Excel export completed successfully');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
        }
    };


    // Export to CSV function for parking data
    window.exportParkingToCSV = async function() {
        try {
            // Get current search and filter parameters from parking.js
            const searchQuery = window.currentSearchQuery || '';
            const statusFilter = window.currentStatusFilter || '';
            const sortBy = window.currentSortBy || '';
            const sortOrder = window.currentSortOrder || 'asc';
            
            // If global variables are not available, try to get them from the parking.js fetchBookings function
            if (!window.currentSearchQuery && !window.currentStatusFilter) {
                // Use the same parameters as currently displayed in the table
            }
            
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format


            // Get all table data (including filtered results)
            const headers = [];
            const rows = [];
            
            // Get headers from current table
            document.querySelectorAll('.parking-table thead th').forEach(th => {
                headers.push(th.textContent.trim().replace(/\s+/g, ' '));
            });
            
            // Add headers to rows
            rows.push(headers);
            
            // Get current data - use the same data that's being displayed
            const response = await fetch(`/wp-json/parking/v1/bookings?per_page=9999&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusFilter)}&sort=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(sortOrder)}`);
            const data = await response.json();
            
            // Debug log to check what data we're getting
            console.log('CSV export data received:', data);
            
            // Check if data is in the expected format
            if (data && data.data && data.data.length > 0) {
                // Use data.data if the API returns in that format (like in parking.js)
                data.data.forEach(booking => {
                    const rowData = [
                        booking.order_code || '',
                        booking.fullname_park || '',
                        (booking.location_park && booking.location_park.name) || booking.location_park || '',
                        booking.start_date || '',
                        booking.end_date || '',
                        booking.tracking_check_status || '',
                        (booking.addon_information && (booking.addon_information.service_pickup || booking.addon_information.service_valet)) ? 'Yes' : 'No' || '',
                        '' // actions column (usually not exported)
                    ];
                    rows.push(rowData);
                });
            } else if (data.bookings && data.bookings.length > 0) {
                // Fallback to original format
                data.bookings.forEach(booking => {
                    const rowData = [
                        booking.order_code || '',
                        booking.fullname_park || '',
                        (booking.location_park && booking.location_park.name) || booking.location_park || '',
                        booking.start_date || '',
                        booking.end_date || '',
                        booking.tracking_check_status || '',
                        (booking.addon_information && (booking.addon_information.service_pickup || booking.addon_information.service_valet)) ? 'Yes' : 'No' || '',
                        '' // actions column
                    ];
                    rows.push(rowData);
                });
            }
            
            // Create workbook and export as CSV
            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "การจองที่จอดรถ");
            
            // Download CSV file
            XLSX.writeFile(wb, `parking_reservations_${dateStr}.csv`, {bookType: 'csv'});
            
            console.log('CSV export completed successfully');
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV');
        }
    };

    // Export bookings function that routes to the appropriate export function
    window.exportBookings = async function(format) {
        try {
            if (format === 'excel') {
                await window.exportParkingToExcel();
            } else if (format === 'csv') {
                await window.exportParkingToCSV();
            } else {
                console.error('Unsupported export format:', format);
                alert('รูปแบบการส่งออกไม่รองรับ');
            }
        } catch (error) {
            console.error('Error in exportBookings function:', error);
            alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
        }
    };

});