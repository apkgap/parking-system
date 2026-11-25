document.addEventListener('DOMContentLoaded', async function() {
    // Prevent double initialization if this script is enqueued twice
    if (window.__carRentalUIInitialized) { return; }
    window.__carRentalUIInitialized = true;
    const tableContainer = document.querySelector('.carrental-table-container');
    const tbody = document.querySelector('.carrental-table tbody');
    const paginationContainer = document.getElementById('carrental-pagination');
    const searchInput = document.getElementById('carrental-search');
    const exportButton = document.getElementById('carrental-export-button');
    const exportDropdown = document.getElementById('carrental-export-dropdown');
    const filterButton = document.getElementById('carrental-filter-button');
    const filterDropdown = document.getElementById('carrental-filter-dropdown');
    const refreshButton = document.getElementById('carrental-refresh-button');
    const addRentalButton = document.getElementById('add-carrental-button');
    
    if (!tableContainer || !tbody || !paginationContainer) {
        console.error('Required elements not found for car rental pagination');
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
    
    // Make fetchRentals globally accessible for pagination
    window.fetchRentals = fetchRentals;
    
    // Function to close all dropdowns
    function closeAllDropdowns() {
        if (exportDropdown) exportDropdown.classList.add('hidden');
        if (filterDropdown) filterDropdown.classList.add('hidden');
        const dateFilterDropdown = document.getElementById('carrental-date-filter-dropdown');
        if (dateFilterDropdown) dateFilterDropdown.classList.add('hidden');
    }
    
    // Function to fetch car rentals data
    async function fetchRentals(page = 1, search = '', status = '', sort = '', order = 'asc', dateRangeParam = '', dateFromParam = '', dateToParam = '') {
        // Show loading skeleton state
        renderLoadingSkeleton();
        
        try {
            // สร้าง URL สำหรับการเรียก API พร้อมพารามิเตอร์
            let apiUrl = `/wp-json/carrental/v1/rentals?page=${page}&per_page=${perPage}`;
            
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
            console.error('Error fetching car rentals:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
        }
    }

    // Render loading skeleton rows
    function renderLoadingSkeleton() {
        const cols = 6; // Updated from 9 to 6
        const rows = Math.max(1, perPage);
        let html = '';
        for (let r = 0; r < rows; r++) {
            html += '<tr class="border-b">';
            for (let c = 0; c < cols; c++) {
                const widths = ['w-20', 'w-24', 'w-28', 'w-24', 'w-24', 'w-16'];
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
    function renderTable(rentals) {
        if (!rentals || rentals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-gray-500">ไม่พบข้อมูลการเช่ารถ</td></tr>'; // Updated colspan
            return;
        }
        
        let html = '';
        rentals.forEach((rental, index) => {
            const acf = rental.acf;
            
            // Extract data from correct ACF structure
            const customerName = acf.personal_information?.full_name || '-';
            const packageTitle = acf.selected_package?.package_id?.title || acf.selected_package?.route || '-';
            const arrivalDate = acf.travel_information_outbound_trip?.depart_date || '-';
            const departureDate = acf.travel_information_return_trip?.return_date || '-';
            const editUrl = `${location.origin}/wp-admin/post.php?post=${rental.id}&action=edit&classic-editor`;
            
            // Alternate row background colors
            const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            html += `
                <tr class="${bgClass} border-b hover:bg-gray-100 block md:table-row">
                    <td class="px-3 py-3 text-right md:text-center text-sm block md:table-cell relative" data-label="รหัสการเช่า">
                        <span class="font-mono">${escapeHtml(acf.rental_code)}</span>
                    </td>
                    <td class="px-3 py-3 text-right md:text-center text-sm block md:table-cell relative" data-label="ชื่อลูกค้า">
                        <span class="font-medium">${escapeHtml(customerName)}</span>
                    </td>
                    <td class="px-3 py-3 text-right md:text-center text-sm block md:table-cell relative" data-label="แพ็คเกจ">
                        <span class="text-gray-900">${escapeHtml(packageTitle)}</span>
                    </td>
                    <td class="px-3 py-3 text-right md:text-center text-sm block md:table-cell relative" data-label="วันที่มาถึง">
                        <span class="font-mono">${arrivalDate}</span>
                    </td>
                    <td class="px-3 py-3 text-right md:text-center text-sm block md:table-cell relative" data-label="วันที่กลับ">
                        <span class="font-mono">${departureDate}</span>
                    </td>
                    <td class="px-3 py-3 text-right md:text-center text-sm block md:table-cell relative" data-label="จัดการ">
                        <div class="flex items-center justify-end md:justify-center space-x-1">
                            <a href="${editUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-900 p-1" title="แก้ไข">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <button onclick="fetchRentals(${currentPage - 1}, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
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
                <button onclick="fetchRentals(1, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
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
                    <button onclick="fetchRentals(${i}, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
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
                <button onclick="fetchRentals(${totalPages}, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-100 hover:text-gray-700">
                    ${totalPages}
                </button>
            `;
        }
        
        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `
                <button onclick="fetchRentals(${currentPage + 1}, '${searchQuery}', '${statusFilter}', '${sortBy}', '${sortOrder}', '${dateRange}', '${dateFrom}', '${dateTo}')" 
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
        return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    // Initialize the table
    await fetchRentals(currentPage);
    
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
        fetchRentals(1, searchQuery, statusFilter, sortBy, sortOrder);
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
    document.querySelectorAll('.carrental-table th[data-sort]').forEach(header => {
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
                await fetchRentals(1, this.value, statusFilter, sortBy, sortOrder, dateRange, dateFrom, dateTo);
            }, 300); // รอ 300ms หลังจากหยุดพิมพ์
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
                
                if (text.includes('active')) status = 'active';
                else if (text.includes('completed')) status = 'completed';
                else if (text.includes('cancelled')) status = 'cancelled';
                else if (text.includes('pending')) status = 'pending';
                
                await fetchRentals(1, searchQuery, status, sortBy, sortOrder, dateRange, dateFrom, dateTo);
                filterDropdown.classList.add('hidden');
            });
        });
    }
    
    // Refresh Button - โหลดข้อมูลใหม่
    if (refreshButton) {
        refreshButton.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            await fetchRentals(currentPage, searchQuery, statusFilter, sortBy, sortOrder, dateRange, dateFrom, dateTo);
        });
    } else {
        console.error('Refresh button not found with ID: carrental-refresh-button');
    }
    
    // Add Car Rental Button - เปิดหน้าเพิ่มการเช่ารถ
    if (addRentalButton) {
        addRentalButton.addEventListener('click', function(e) {
            e.preventDefault();
            // เปลี่ยนเป็น URL จริงของหน้าเพิ่มการเช่ารถ
            window.location.href = '/dashboard/carrental-management/add-rental/';
        });
    }
    
    // Date Filter Button - แสดง/ซ่อนเมนูดรอปดาวน์วันที่
    const dateFilterButton = document.getElementById('carrental-date-filter-button');
    const dateFilterDropdown = document.getElementById('carrental-date-filter-dropdown');
    
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
        dateFilterDropdown.querySelectorAll('[data-date-range]').forEach(option => {
            option.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const range = this.getAttribute('data-date-range');
                await fetchRentals(1, searchQuery, statusFilter, sortBy, sortOrder, range, '', '');
                dateFilterDropdown.classList.add('hidden');
                
                // Update button text
                dateFilterButton.querySelector('span').textContent = this.textContent;
            });
        });
        
        // Custom Date Range Apply Button
        const applyCustomDateBtn = document.getElementById('apply-custom-date');
        if (applyCustomDateBtn) {
            applyCustomDateBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const startDate = document.getElementById('start-date').value;
                const endDate = document.getElementById('end-date').value;
                
                if (startDate && endDate) {
                    await fetchRentals(1, searchQuery, statusFilter, sortBy, sortOrder, '', startDate, endDate);
                    dateFilterDropdown.classList.add('hidden');
                    
                    // Update button text
                    dateFilterButton.querySelector('span').textContent = `${startDate} ถึง ${endDate}`;
                }
            });
        }
        
        // Clear Date Filter Button
        const clearDateFilterBtn = document.getElementById('carrental-date-filter-clear');
        if (clearDateFilterBtn) {
            clearDateFilterBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Clear date inputs
                const startDateInput = document.getElementById('start-date');
                const endDateInput = document.getElementById('end-date');
                if (startDateInput) startDateInput.value = '';
                if (endDateInput) endDateInput.value = '';
                
                // Reset filter
                await fetchRentals(1, searchQuery, statusFilter, sortBy, sortOrder, '', '', '');
                dateFilterDropdown.classList.add('hidden');
                
                // Reset button text
                dateFilterButton.querySelector('span').textContent = 'กรองตามวันที่';
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
});

// Export to Excel function for car rental data
window.exportCarRentalToExcel = async function() {
    try {
        // Get current date for filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Get headers from carrental table
        const headers = [];
        const rows = [];
        
        // Get headers from current table
        document.querySelectorAll('.carrental-table thead th').forEach(th => {
            const text = th.textContent.trim().replace(/\s+/g, ' ');
            if (text && text !== '') {
                headers.push(text);
            }
        });
        
        // Add headers to rows
        rows.push(headers);
        
        // Get data from current table (respects current filter/search)
        const tableRows = document.querySelectorAll('.carrental-table tbody tr');
        tableRows.forEach(row => {
            // Skip loading rows
            if (row.querySelector('.text-center.py-6') || row.textContent.trim() === '') {
                return;
            }
            
            const rowData = [];
            const cells = row.querySelectorAll('td');
            
            cells.forEach((cell, index) => {
                // Skip the actions column (last column)
                if (index === cells.length - 1) {
                    return;
                }
                
                rowData.push(cell.textContent.trim());
            });
            
            if (rowData.length > 0) {
                rows.push(rowData);
            }
        });
        
        // Create workbook
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "การเช่ารถ");
        
        // Download file with date in filename
        XLSX.writeFile(wb, `car_rentals_${dateStr}.xlsx`);
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
    }
};

// Export to CSV function for car rental data
window.exportCarRentalToCSV = async function() {
    try {
        // Get current date for filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Get headers from carrental table
        const headers = [];
        const rows = [];
        
        // Get headers from current table
        document.querySelectorAll('.carrental-table thead th').forEach(th => {
            const text = th.textContent.trim().replace(/\s+/g, ' ');
            if (text && text !== '') {
                headers.push(text);
            }
        });
        
        // Add headers to rows
        rows.push(headers);
        
        // Get data from current table (respects current filter/search)
        const tableRows = document.querySelectorAll('.carrental-table tbody tr');
        tableRows.forEach(row => {
            // Skip loading rows
            if (row.querySelector('.text-center.py-6') || row.textContent.trim() === '') {
                return;
            }
            
            const rowData = [];
            const cells = row.querySelectorAll('td');
            
            cells.forEach((cell, index) => {
                // Skip the actions column (last column)
                if (index === cells.length - 1) {
                    return;
                }
                
                rowData.push(cell.textContent.trim());
            });
            
            if (rowData.length > 0) {
                rows.push(rowData);
            }
        });
        
        // Create workbook and export as CSV
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "การเช่ารถ");
        
        // Download CSV file with date in filename
        XLSX.writeFile(wb, `car_rentals_${dateStr}.csv`, {bookType: 'csv'});
        
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV');
    }
};