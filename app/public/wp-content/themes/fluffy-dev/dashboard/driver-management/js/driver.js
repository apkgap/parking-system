document.addEventListener('DOMContentLoaded', async function() {
    // Prevent double initialization if this script is enqueued twice
    if (window.__taxiDriverUIInitialized) { return; }
    window.__taxiDriverUIInitialized = true;
    const tableContainer = document.querySelector('.driver-table-container');
    const tbody = document.querySelector('.driver-table tbody');
    const paginationContainer = document.getElementById('driver-pagination');
    const searchInput = document.getElementById('driver-search');
    const statusFilterSelect = document.getElementById('driver-status-filter');
    const carFilterSelect = document.getElementById('driver-car-filter');
    const phoneFilterInput = document.getElementById('driver-phone-filter');
    const exportButton = document.getElementById('driver-export-button');
    const exportDropdown = document.getElementById('driver-export-dropdown');
    const filterButton = document.getElementById('driver-filter-button');
    const filterDropdown = document.getElementById('driver-filter-dropdown');
    const refreshButton = document.getElementById('driver-refresh-button');
    const addDriverButton = document.getElementById('add-driver-button');
    
    if (!tableContainer || !tbody || !paginationContainer) {
        console.error('Required elements not found for driver pagination');
        return;
    }
    
    let currentPage = 1;
    const perPage = 12; // เปลี่ยนกลับเป็น 12 รายการต่อหน้า
    let sortBy = '';
    let sortOrder = 'asc';
    let searchQuery = '';
    let statusFilter = '';
    let carFilter = '';
    let phoneFilter = '';
    
    // Function to close all dropdowns
    function closeAllDropdowns() {
        if (exportDropdown) exportDropdown.classList.add('hidden');
        if (filterDropdown) filterDropdown.classList.add('hidden');
    }
    
    // Function to fetch drivers data
    async function fetchDrivers(page = 1, search = '', status = '') {
        // Show loading skeleton state
        renderLoadingSkeleton();
        
        try {
            // สร้าง URL สำหรับการเรียก API พร้อมพารามิเตอร์
            let apiUrl = `/wp-json/taxi/v1/drivers?page=${page}&per_page=${perPage}`;
            
            // เพิ่มพารามิเตอร์การค้นหา
            if (search) {
                apiUrl += `&search=${encodeURIComponent(search)}`;
            }
            
            // เพิ่มพารามิเตอร์การกรองสถานะ
            if (status) {
                apiUrl += `&status=${encodeURIComponent(status)}`;
            }
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            renderTable(data.data);
            renderPagination(data.meta);
            
            // อัพเดตตัวแปรสถานะปัจจุบัน
            currentPage = page;
            searchQuery = search;
            statusFilter = status;
        } catch (error) {
            console.error('Error fetching drivers:', error);
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
                const widths = ['w-20','w-24','w-28','w-16','w-24','w-16','w-16','w-16'];
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
    function renderTable(drivers) {
        if (!drivers || drivers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="driver-empty px-4 py-3 text-center text-gray-500">ไม่พบข้อมูลคนขับ</td></tr>';
            return;
        }
        
        let rowsHtml = '';
        drivers.forEach((driver, index) => {
            const acf = driver.acf;
            const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            const vehicleTitle = (acf.vehicle_data && acf.vehicle_data.title) ? acf.vehicle_data.title : '-';
            
            // Define work status text based on the status value
            const statusValue = (acf.status && typeof acf.status === 'object' ? acf.status.value : acf.status) || '';
            const statusLabel = (acf.status && typeof acf.status === 'object' ? acf.status.label : '') || '';
            const statusStyles = (() => {
                switch (statusValue) {
                    case 'working':
                        return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' };
                    case 'not_working':
                        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
                    case 'available':
                        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
                    case 'stopped':
                        return { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' };
                    default:
                        return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
                }
            })();

            const workStatusText = (() => {
                switch (statusValue) {
                    case 'working':
                        return 'เข้างาน';
                    case 'not_working':
                        return 'ไม่เข้างาน';
                    case 'available':
                        return 'ว่าง';
                    case 'stopped':
                        return 'หยุด';
                    default:
                        return statusLabel || 'ไม่ทราบสถานะ';
                }
            })();
            
            rowsHtml += `
                <tr class="driver-row ${bgClass} hover:bg-gray-100 border-b">
                    <td class="driver-td col-driver-code px-2 py-3 text-center">${escapeHtml(acf.driver_code)}</td>
                    <td class="driver-td col-driver-name px-2 py-3 text-center">${escapeHtml(acf.driver_name)}</td>
                    <td class="driver-td col-phone px-2 py-3 text-center">${escapeHtml(acf.phone)}</td>
                    <td class="driver-td driver-status col-status px-2 py-3 text-center">
                        <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}">
                            ${escapeHtml(workStatusText)}
                        </span>
                    </td>
                    <td class="driver-td col-vehicle px-2 py-3 text-center hidden md:table-cell">${escapeHtml(vehicleTitle)}</td>
                    <td class="driver-td col-job-count px-2 py-3 text-center hidden md:table-cell">${parseInt(acf.job_count) || 0}</td>
                    <td class="driver-td col-completed px-2 py-3 text-center hidden md:table-cell">${parseInt(acf.completed_jobs) || 0}</td>
                    <td class="driver-td col-actions px-2 py-3 text-center">
                        <a href="/wp-admin/post.php?post=${driver.id}&action=edit&classic-editor" class="driver-manage-btn bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm" target="_blank" rel="noopener noreferrer" data-id="${driver.id}">ดู</a>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = rowsHtml;
    }
    
    // Function to render pagination controls
    function renderPagination(meta) {
        if (!meta) return;
        
        const { current_page, total_pages, total } = meta;
        let paginationHtml = '';
        
        if (total_pages > 1) {
            paginationHtml += '<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">';
            paginationHtml += '<div class="flex flex-1 justify-between sm:hidden">';
            
            // Mobile Previous/Next buttons
            if (current_page > 1) {
                paginationHtml += `<button class="pagination-btn prev relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100" data-page="${current_page - 1}">ก่อนหน้า</button>`;
            } else {
                paginationHtml += `<button class="relative inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">ก่อนหน้า</button>`;
            }
            
            if (current_page < total_pages) {
                paginationHtml += `<button class="pagination-btn next relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100" data-page="${current_page + 1}">ถัดไป</button>`;
            } else {
                paginationHtml += `<button class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">ถัดไป</button>`;
            }
            
            paginationHtml += '</div>';
            
            // Desktop pagination
            paginationHtml += '<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">';
            paginationHtml += `<div><p class="text-sm text-gray-700">Showing <span class="font-medium">${(current_page - 1) * perPage + 1}</span> to <span class="font-medium">${Math.min(current_page * perPage, total)}</span> of <span class="font-medium">${total}</span> results</p></div>`;
            
            paginationHtml += '<div>';
            paginationHtml += '<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">';
            
            // Previous button
            if (current_page > 1) {
                paginationHtml += `<button class="pagination-btn prev relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 focus:z-20 focus:outline-offset-0" data-page="${current_page - 1}">
                    <span class="sr-only">ก่อนหน้า</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                    </svg>
                </button>`;
            } else {
                paginationHtml += `<button class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                    <span class="sr-only">ก่อนหน้า</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                    </svg>
                </button>`;
            }
            
            // Page numbers
            const maxPagesToShow = 5;
            let startPage = Math.max(1, current_page - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(total_pages, startPage + maxPagesToShow - 1);
            
            if (endPage - startPage + 1 < maxPagesToShow) {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                if (i === current_page) {
                    paginationHtml += `<button aria-current="page" class="relative z-10 inline-flex items-center bg-blue-500 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">${i}</button>`;
                } else {
                    paginationHtml += `<button class="pagination-btn page-num relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 focus:z-20 focus:outline-offset-0" data-page="${i}">${i}</button>`;
                }
            }
            
            // Next button
            if (current_page < total_pages) {
                paginationHtml += `<button class="pagination-btn next relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 focus:z-20 focus:outline-offset-0" data-page="${current_page + 1}">
                    <span class="sr-only">ถัดไป</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                    </svg>
                </button>`;
            } else {
                paginationHtml += `<button class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                    <span class="sr-only">ถัดไป</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                    </svg>
                </button>`;
            }
            
            paginationHtml += '</nav>';
            paginationHtml += '</div>';
            paginationHtml += '</div>';
            paginationHtml += '</div>';
        }
        
        paginationContainer.innerHTML = paginationHtml;
        
        // Add event listeners to pagination buttons
        document.querySelectorAll('.pagination-btn').forEach(button => {
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page'));
                if (page) {
                    await fetchDrivers(page);
                }
            });
        });
    }
    
    // Utility function to escape HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text ? text.toString().replace(/[&<>"']/g, m => map[m]) : '';
    }
    
    // Initialize the table
    await fetchDrivers(currentPage);
    
    // ===== Event Listeners for Table Controls =====
    
    // Search Input - ค้นหาเมื่อพิมพ์และหยุดพิมพ์ (debounce)
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                searchQuery = this.value;
                await fetchDrivers(1, searchQuery, statusFilter); // รีเซ็ตกลับไปหน้า 1 เมื่อค้นหา
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
                
                const text = this.textContent.trim();
                let status = '';
                
                // กำหนดค่าสถานะตามตัวเลือกที่เลือก
                if (text.includes('เข้างาน')) {
                    status = 'working';
                } else if (text.includes('ไม่เข้างาน')) {
                    status = 'not_working';
                } else if (text.includes('ว่าง')) {
                    status = 'available';
                } else if (text.includes('หยุด')) {
                    status = 'stopped';
                }
                // ถ้าเป็น 'ทั้งหมด' จะใช้ค่าว่าง
                
                statusFilter = status;
                await fetchDrivers(1, searchQuery, status); // รีเซ็ตกลับไปหน้า 1 เมื่อกรอง
                // console.log(status);
                filterDropdown.classList.add('hidden');
            });
        });
    }
    
    // Refresh Button - โหลดข้อมูลใหม่
    if (refreshButton) {
        refreshButton.addEventListener('click', async function() {
            searchQuery = '';
            statusFilter = '';
            if (searchInput) searchInput.value = '';
            await fetchDrivers(1, '', '');
        });
    }
    
    // Add Driver Button - เปิดหน้าเพิ่มคนขับ
    if (addDriverButton) {
        addDriverButton.addEventListener('click', function(e) {
            e.preventDefault();
            // เปลี่ยนเป็น URL จริงของหน้าเพิ่มคนขับ
            window.location.href = '/dashboard/driver-management/add-driver/';
        });
    }
    
    // ปิดเมนูดรอปดาวน์เมื่อคลิกที่อื่น (แก้ไขแล้ว)
    document.addEventListener('click', function(e) {
        // ตรวจสอบว่าคลิกนอกพื้นที่ของปุ่มและเมนูทั้งหมด
        const clickedInsideExport = exportButton && (exportButton.contains(e.target) || exportDropdown && exportDropdown.contains(e.target));
        const clickedInsideFilter = filterButton && (filterButton.contains(e.target) || filterDropdown && filterDropdown.contains(e.target));
        
        if (!clickedInsideExport && !clickedInsideFilter) {
            closeAllDropdowns();
        }
    });
    
    // หยุด propagation ของเหตุการณ์คลิกในดรอปดาวน์ เพื่อไม่ให้ปิดเมนู
    if (filterDropdown) {
        filterDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Export to Excel function for driver data
window.exportDriversToExcel = async function() {
    try {
        // Get current date for filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Get headers from driver table
        const headers = [];
        const rows = [];
        
        // Get headers from current table
        document.querySelectorAll('.driver-table thead th').forEach(th => {
            const text = th.textContent.trim().replace(/\s+/g, ' ');
            if (text && text !== '') {
                // Skip the actions column (last column)
                if (!th.classList.contains('w-[15%]') || th.textContent.trim() !== 'การจัดการ') {
                    headers.push(text);
                }
            }
        });
        
        // Add headers to rows
        rows.push(headers);
        
        // Get data from current table (respects current filter/search)
        const tableRows = document.querySelectorAll('.driver-table tbody tr');
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
        XLSX.utils.book_append_sheet(wb, ws, "คนขับ");
        
        // Download file
        XLSX.writeFile(wb, `drivers_${dateStr}.xlsx`);
        
        console.log('Excel export completed successfully');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
    }
};

// Export to CSV function for driver data
window.exportDriversToCSV = async function() {
    try {
        // Get current date for filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Get headers from driver table
        const headers = [];
        const rows = [];
        
        // Get headers from current table
        document.querySelectorAll('.driver-table thead th').forEach(th => {
            const text = th.textContent.trim().replace(/\s+/g, ' ');
            if (text && text !== '') {
                // Skip the actions column (last column)
                if (!th.classList.contains('w-[15%]') || th.textContent.trim() !== 'การจัดการ') {
                    headers.push(text);
                }
            }
        });
        
        // Add headers to rows
        rows.push(headers);
        
        // Get data from current table (respects current filter/search)
        const tableRows = document.querySelectorAll('.driver-table tbody tr');
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
        XLSX.utils.book_append_sheet(wb, ws, "คนขับ");
        
        // Download CSV file
        XLSX.writeFile(wb, `drivers_${dateStr}.csv`, {bookType: 'csv'});
        
        console.log('CSV export completed successfully');
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV');
    }
};

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
        fetchDrivers(1, sortBy, sortOrder);
    }
    
    // Event listeners สำหรับตัวกรองใหม่
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value;
            applyFilters();
        });
    }
    
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', function() {
            statusFilter = this.value;
            applyFilters();
        });
    }
    
    if (carFilterSelect) {
        carFilterSelect.addEventListener('change', function() {
            carFilter = this.value;
            applyFilters();
        });
    }
    
    if (phoneFilterInput) {
        phoneFilterInput.addEventListener('input', function() {
            phoneFilter = this.value;
            applyFilters();
        });
    }
    
    // อัพเดต Refresh button ให้ใช้ตัวกรองทั้งหมด
    if (refreshButton) {
        refreshButton.addEventListener('click', async function() {
            searchQuery = '';
            statusFilter = '';
            carFilter = '';
            phoneFilter = '';
            if (searchInput) searchInput.value = '';
            await fetchDrivers(1, '', '');
        });
    }
    
    // เพิ่ม event listeners สำหรับหัวตารางที่เรียงลำดับได้
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', handleSortClick);
    });
    
    // เริ่มต้นโหลดข้อมูล
    await fetchDrivers();
});