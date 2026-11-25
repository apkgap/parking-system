document.addEventListener('DOMContentLoaded', function() {
    if (window.__transportUIInitialized) { return; }
    window.__transportUIInitialized = true;

    const tbody = document.querySelector('.transport-table tbody');
    const paginationContainer = document.getElementById('transport-pagination');
    const searchInput = document.getElementById('transport-search');
    const refreshButton = document.getElementById('transport-refresh-button');

    if (!tbody || !paginationContainer) {
        console.error('Required elements not found for transport UI');
        return;
    }
    
    if (!refreshButton) {
        console.error('Refresh button not found');
    } else {
        console.log('Transport refresh button found:', refreshButton);
        console.log('Transport refresh button ID:', refreshButton.id);
    }

    let currentPage = 1;
    const perPage = 12;
    let sortBy = 'id';
    let sortOrder = 'desc';
    let searchQuery = '';
    let dateRange = '';
    let dateFrom = '';
    let dateTo = '';
    let transportData = [];
    const apiBaseUrl = '/wp-json/custom/v1';

    async function fetchTransportData(page = 1, search = '', dateRangeParam = '', dateFromParam = '', dateToParam = '') {
        const currentSearchQuery = search || document.getElementById('transport-search')?.value || '';
        
        // Show loading skeleton state
        renderLoadingSkeleton();
        
        // Map UI sort fields to API fields
        const sortFieldMap = {
            'id': 'ID',
            'customer': 'title',
            'license_plate': 'plate_driver',
            'start_date': 'date',
            'end_date': 'date',
            'location': 'title',
            'status': 'status_job',
            'service_type': 'title'
        };
        
        const apiSortField = sortFieldMap[sortBy] || sortBy;
        
        const params = new URLSearchParams({
            page: page,
            per_page: perPage,
            search: currentSearchQuery,
            orderby: apiSortField,
            order: sortOrder
        });
        
        // Add date filter parameters
        if (dateRangeParam) {
            params.append('date_range', dateRangeParam);
        }
        
        if (dateFromParam) {
            params.append('date_from', dateFromParam);
        }
        
        if (dateToParam) {
            params.append('date_to', dateToParam);
        }
        
        console.log('API call parameters:', params.toString());
        console.log('Date filter params:', { dateRangeParam, dateFromParam, dateToParam });
        
        fetch(`${apiBaseUrl}/ride_assignments?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.data) {
                    transportData = data.data;
                    renderTable(data.data);
                    renderPagination(data.meta);
                    
                    // Update state variables
                    currentPage = page;
                    searchQuery = currentSearchQuery;
                    dateRange = dateRangeParam;
                    dateFrom = dateFromParam;
                    dateTo = dateToParam;
                } else {
                    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-red-500">Error loading data</td></tr>';
                }
            })
            .catch(error => {
                console.error('Error fetching transport data:', error);
                tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-red-500">Error loading data</td></tr>';
            });
    }

    function renderLoadingSkeleton() {
        const cols = 9;
        const rows = Math.max(1, perPage);
        let html = '';
        for (let r = 0; r < rows; r++) {
            html += '<tr class="border-b">';
            for (let c = 0; c < cols; c++) {
                const widths = ['w-16','w-24','w-20','w-24','w-24','w-20','w-16','w-20','w-24'];
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

    function renderTable(data) {
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-6 text-gray-500">No transport data found.</td></tr>';
            return;
        }

        let rowsHtml = data.map((item, index) => {
            const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            // Get driver name from taxi_user field
            const driverName = item.taxi_user?.post_title || 'N/A';
            
            // Get booking order details
            const bookingOrder = item.booking_order;
            const licensePlate = item.plate_driver || '-';
            
            // Get status
            const status = item.status_job || 'pending';
            
            // Define status colors
            const statusColors = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'scheduled': 'bg-blue-100 text-blue-800',
                'dispatched': 'bg-indigo-100 text-indigo-800',
                'progress': 'bg-purple-100 text-purple-800',
                'completed': 'bg-green-100 text-green-800',
                'cancelled': 'bg-red-100 text-red-800'
            };
            
            // Define Thai status labels
            const statusLabels = {
                'pending': 'รอดำเนินการ',
                'scheduled': 'กำหนดคิวแล้ว',
                'dispatched': 'มอบหมายแล้ว',
                'progress': 'กำลังดำเนินการ',
                'completed': 'เสร็จสิ้น',
                'cancelled': 'ยกเลิก'
            };
            
            // Get status color class and label
            const statusColorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
            const statusLabel = statusLabels[status] || status;
            
            // Format dates
            const itemStartDate = new Date(item.date);
            const itemEndDate = new Date(itemStartDate);
            itemEndDate.setDate(itemEndDate.getDate() + 1);

            const formattedStartDate = itemStartDate.toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const formattedEndDate = itemEndDate.toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });

            // Get location from addon information
            let location = 'N/A';
            if (item.addon_information) {
                if (item.addon_information.sending_flight && item.addon_information.sending_flight.depart) {
                    location = item.addon_information.sending_flight.depart;
                } else if (item.addon_information.parking_car && item.addon_information.parking_car.depart) {
                    location = item.addon_information.parking_car.depart;
                }
            }

            // Get service type from addon information
            let serviceType = 'N/A';
            let flightDetails = '';
            let passengerDetails = '';
            let baggageCount = '';
            let pickupNote = '';
            
            if (item.addon_information) {
                // Determine service type based on addon information
                if (item.addon_information.service_pickup && item.addon_information.sending_flight) {
                    serviceType = 'รับ-ส่งสนามบิน';
                    const flight = item.addon_information.sending_flight;
                    
                    // Format flight details
                    if (flight.depart && flight.arrival) {
                        flightDetails = `${flight.depart} → ${flight.arrival}`;
                        if (flight.depart_time && flight.arrival_time) {
                            flightDetails += ` (${flight.depart_time} - ${flight.arrival_time})`;
                        }
                    }
                    
                    // Format passenger details
                    if (flight.adult_count || flight.child_count) {
                        passengerDetails = `ผู้ใหญ่: ${flight.adult_count || 0}, เด็ก: ${flight.child_count || 0}`;
                    }
                    
                    // Baggage count
                    baggageCount = flight.baggage_count || '';
                    
                    // Pickup note
                    pickupNote = flight.pickup_note || '';
                } else if (item.addon_information.service_valet && item.addon_information.parking_car) {
                    serviceType = 'รับจอด-รับส่งรถสนามบิน';
                    const parking = item.addon_information.parking_car;
                    
                    // Format parking details
                    if (parking.depart && parking.arrival) {
                        flightDetails = `${parking.depart} → ${parking.arrival}`;
                        if (parking.depart_time && parking.arrival_time) {
                            flightDetails += ` (${parking.depart_time} - ${parking.arrival_time})`;
                        }
                    }
                    
                    // Pickup note
                    pickupNote = parking.pickup_note || '';
                }
            }

            return `
                <tr class="${bgClass} hover:bg-gray-100 border-b">
                    <td class="px-2 py-3 text-center text-sm">${item.id}</td>
                    <td class="px-2 py-3 text-center text-sm">${escapeHtml(driverName)}</td>
                    <td class="px-2 py-3 text-center text-sm">${escapeHtml(licensePlate)}</td>
                    <td class="px-2 py-3 text-center text-sm">${escapeHtml(formattedStartDate)}</td>
                    <td class="px-2 py-3 text-center text-sm">${escapeHtml(formattedEndDate)}</td>
                    <td class="px-2 py-3 text-center text-sm">${escapeHtml(location)}</td>
                    <td class="px-2 py-3 text-center">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColorClass}">
                            ${escapeHtml(statusLabel)}
                        </span>
                    </td>
                    <td class="px-2 py-3 text-center text-sm">${escapeHtml(serviceType)}${flightDetails ? `<br><span class="text-xs text-gray-500">${escapeHtml(flightDetails)}</span>` : ''}${passengerDetails ? `<br><span class="text-xs text-gray-500">${escapeHtml(passengerDetails)}</span>` : ''}${baggageCount ? `<br><span class="text-xs text-gray-500">กระเป๋าเดินทาง ${baggageCount}</span>` : ''}${pickupNote ? `<br><span class="text-xs text-gray-500">${escapeHtml(pickupNote)}</span>` : ''}</td>
                    <td class="px-2 py-3 text-center">
                        <div class="flex items-center justify-center space-x-1">
                            <a href="/wp-admin/post.php?post=${item.id}&action=edit&classic-editor" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-900 p-1" title="แก้ไข">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        tbody.innerHTML = rowsHtml;
    }

    function viewAssignmentDetails(assignmentId) {
        // Find the assignment in the current data
        const assignment = transportData.find(item => item.id == assignmentId);
        
        if (!assignment) {
            alert('ไม่พบข้อมูลงาน');
            return;
        }
        
        // Build detailed information string
        let details = `รายละเอียดงาน ID: ${assignmentId}\n`;
        details += `ชื่องาน: ${assignment.title || 'N/A'}\n`;
        details += `รหัสงาน: ${assignment.job_code || 'N/A'}\n`;
        details += `คนขับ: ${assignment.taxi_user?.post_title || 'N/A'}\n`;
        details += `ทะเบียนรถ: ${assignment.plate_driver || 'N/A'}\n`;
        details += `วันที่: ${assignment.date || 'N/A'}\n`;
        
        // Add addon information if available
        if (assignment.addon_information) {
            const addon = assignment.addon_information;
            
            if (addon.service_pickup) {
                details += '\nบริการรับ-ส่งสนามบิน\n';
                
                if (addon.sending_flight) {
                    const flight = addon.sending_flight;
                    details += `เที่ยวบินขาออก: ${flight.depart || 'N/A'} ${flight.depart_time || ''}\n`;
                    details += `เที่ยวบินขาเข้า: ${flight.arrival || 'N/A'} ${flight.arrival_time || ''}\n`;
                    details += `จำนวนผู้โดยสาร: ผู้ใหญ่ ${flight.adult_count || 0}, เด็ก ${flight.child_count || 0}\n`;
                    details += `จำนวนกระเป๋า: ${flight.baggage_count || 0}\n`;
                    details += `หมายเหตุ: ${flight.pickup_note || 'N/A'}\n`;
                }
            }
            
            if (addon.service_valet) {
                details += '\nบริการรับจอด-รับส่งรถสนามบิน\n';
                
                if (addon.parking_car) {
                    const parking = addon.parking_car;
                    details += `เที่ยวบินขาออก: ${parking.depart || 'N/A'} ${parking.depart_time || ''}\n`;
                    details += `เที่ยวบินขาเข้า: ${parking.arrival || 'N/A'} ${parking.arrival_time || ''}\n`;
                    details += `หมายเหตุ: ${parking.pickup_note || 'N/A'}\n`;
                }
            }
        }
        
        alert(details);
    }

    function renderPagination(meta) {
        if (!meta) return;
        
        const { current_page, total_pages, total } = meta;
        let paginationHtml = '';
        
        if (total_pages > 1) {
            paginationHtml += '<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">';
            paginationHtml += '<div class="flex flex-1 justify-between sm:hidden">';
            
            // Mobile Previous/Next buttons
            if (current_page > 1) {
                paginationHtml += `<a href="#" class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 pagination-btn" data-page="${current_page - 1}">Previous</a>`;
            } else {
                paginationHtml += `<a href="#" class="relative inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">Previous</a>`;
            }
            
            if (current_page < total_pages) {
                paginationHtml += `<a href="#" class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 pagination-btn" data-page="${current_page + 1}">Next</a>`;
            } else {
                paginationHtml += `<a href="#" class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">Next</a>`;
            }
            
            paginationHtml += '</div>';
            
            // Desktop pagination
            paginationHtml += '<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">';
            paginationHtml += `<div><p class="text-sm text-gray-700">Showing <span class="font-medium">${(current_page - 1) * perPage + 1}</span> to <span class="font-medium">${Math.min(current_page * perPage, total)}</span> of <span class="font-medium">${total}</span> results</p></div>`;
            
            paginationHtml += '<div>';
            paginationHtml += '<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">';
            
            // Previous button
            if (current_page > 1) {
                paginationHtml += `<a href="#" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 pagination-btn" data-page="${current_page - 1}">
                    <span class="sr-only">Previous</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                    </svg>
                </a>`;
            } else {
                paginationHtml += `<a href="#" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                    <span class="sr-only">Previous</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                    </svg>
                </a>`;
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
                    paginationHtml += `<a href="#" aria-current="page" class="relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">${i}</a>`;
                } else {
                    paginationHtml += `<a href="#" class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 pagination-btn" data-page="${i}">${i}</a>`;
                }
            }
            
            // Next button
            if (current_page < total_pages) {
                paginationHtml += `<a href="#" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 pagination-btn" data-page="${current_page + 1}">
                    <span class="sr-only">Next</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                    </svg>
                </a>`;
            } else {
                paginationHtml += `<a href="#" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                    <span class="sr-only">Next</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                    </svg>
                </a>`;
            }
            
            paginationHtml += '</nav>';
            paginationHtml += '</div>';
            paginationHtml += '</div>';
            paginationHtml += '</div>';
        }
        
        paginationContainer.innerHTML = paginationHtml;
        
        // Add event listeners to pagination buttons
        document.querySelectorAll('.pagination-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.dataset.page);
                if (page) {
                    fetchTransportData(page, searchQuery, dateRange, dateFrom, dateTo);
                }
            });
        });
    }

    function handleSortClick(event) {
        // Map UI sort fields to API fields
        const sortFieldMap = {
            'id': 'ID',
            'customer': 'title',
            'license_plate': 'plate_driver',
            'start_date': 'date',
            'end_date': 'date',
            'location': 'title',
            'status': 'status_job',
            'service_type': 'title'
        };
        
        const newSortBy = sortFieldMap[event.currentTarget.dataset.sort] || event.currentTarget.dataset.sort;
        if (sortBy === newSortBy) {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            sortBy = newSortBy;
            sortOrder = 'asc';
        }
        currentPage = 1;
        fetchTransportData();
    }

    function escapeHtml(text) {
        return text ? String(text).replace(/[&<>'"/]/g, s => ({'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#39;','/': '&#x2F;'})[s]) : '';
    }

    // Event Listeners
    document.querySelectorAll('.transport-table .sortable').forEach(header => {
        header.addEventListener('click', handleSortClick);
    });

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value;
            currentPage = 1;
            fetchTransportData(1, searchQuery, dateRange, dateFrom, dateTo);
        }, 300);
    });

    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            console.log('Transport refresh button clicked');
            searchInput.value = '';
            searchQuery = '';
            sortBy = 'id';
            sortOrder = 'desc';
            currentPage = 1;
            
            // Reset date filters
            dateRange = '';
            dateFrom = '';
            dateTo = '';
            
            // Clear date inputs
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            
            // Reset date filter button text
            const dateFilterButton = document.getElementById('transport-date-filter-button');
            if (dateFilterButton && dateFilterButton.querySelector('span')) {
                dateFilterButton.querySelector('span').textContent = 'กรองตามวันที่';
            }
            
            fetchTransportData();
        });
        console.log('Transport refresh button event listener attached');
    }
    
    // Add event listener for export button
    const exportButton = document.getElementById('transport-export-button');
    const exportDropdown = document.getElementById('transport-export-dropdown');
    
    if (exportButton && exportDropdown) {
        exportButton.addEventListener('click', function(e) {
            e.stopPropagation();
            exportDropdown.classList.toggle('hidden');
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!exportButton.contains(e.target) && !exportDropdown.contains(e.target)) {
                exportDropdown.classList.add('hidden');
            }
        });
    }

    // Export to Excel function for transport data
    window.exportTransportToExcel = async function() {
        try {
            // Get current date for filename
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Get headers from transport table
            const headers = [];
            document.querySelectorAll('.transport-table thead th').forEach(th => {
                // Exclude the Actions column (last column)
                if (!th.classList.contains('actions-header')) {
                    headers.push(th.textContent.trim());
                }
            });
            
            // Get data from transport table rows
            const data = [];
            document.querySelectorAll('.transport-table tbody tr').forEach(row => {
                const rowData = [];
                // Get all cells except the last one (actions column)
                const cells = row.querySelectorAll('td:not(:last-child)');
                cells.forEach(cell => {
                    // Get text content and remove extra whitespace
                    let cellText = cell.textContent.trim();
                    // Remove extra newlines and spaces
                    cellText = cellText.replace(/\s+/g, ' ');
                    rowData.push(cellText);
                });
                // Only add row if it has data
                if (rowData.length > 0 && rowData.some(cell => cell !== '')) {
                    data.push(rowData);
                }
            });
            
            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Transport Data');
            
            // Export to Excel with date in filename
            XLSX.writeFile(wb, `transport_data_${dateStr}.xlsx`);
            
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error exporting to Excel. Please try again.');
        }
    };
    
    // Export to CSV function for transport data
    window.exportTransportToCSV = async function() {
        try {
            // Get current date for filename
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Get headers from transport table
            const headers = [];
            document.querySelectorAll('.transport-table thead th').forEach(th => {
                // Exclude the Actions column (last column)
                if (!th.classList.contains('actions-header')) {
                    headers.push(th.textContent.trim());
                }
            });
            
            // Get data from transport table rows
            const data = [];
            document.querySelectorAll('.transport-table tbody tr').forEach(row => {
                const rowData = [];
                // Get all cells except the last one (actions column)
                const cells = row.querySelectorAll('td:not(:last-child)');
                cells.forEach(cell => {
                    // Get text content and remove extra whitespace
                    let cellText = cell.textContent.trim();
                    // Remove extra newlines and spaces
                    cellText = cellText.replace(/\s+/g, ' ');
                    // Escape quotes and wrap in quotes if needed
                    if (cellText.includes(',') || cellText.includes('"') || cellText.includes('\n')) {
                        cellText = '"' + cellText.replace(/"/g, '""') + '"';
                    }
                    rowData.push(cellText);
                });
                // Only add row if it has data
                if (rowData.length > 0 && rowData.some(cell => cell !== '')) {
                    data.push(rowData.join(','));
                }
            });
            
            // Create CSV content
            const csvContent = [headers.join(','), ...data].join('\n');
            
            // Create download link
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `transport_data_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            alert('Error exporting to CSV. Please try again.');
        }
    };
    
    // Date Filter Button - แสดง/ซ่อนเมนูดรอปดาวน์วันที่
    const dateFilterButton = document.getElementById('transport-date-filter-button');
    const dateFilterDropdown = document.getElementById('transport-date-filter-dropdown');
    
    console.log('Date filter button:', dateFilterButton);
    console.log('Date filter dropdown:', dateFilterDropdown);
    
    // Function to close all dropdowns
    function closeAllDropdowns() {
        const exportDropdown = document.getElementById('transport-export-dropdown');
        if (exportDropdown) exportDropdown.classList.add('hidden');
        if (dateFilterDropdown) dateFilterDropdown.classList.add('hidden');
    }
    
    if (dateFilterButton && dateFilterDropdown) {
        console.log('Date filter button and dropdown found');
        dateFilterButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Date filter button clicked');
            
            // ปิดเมนูอื่นๆ ก่อน
            closeAllDropdowns();
            
            // แสดงเมนู date filter
            dateFilterDropdown.classList.remove('hidden');
            console.log('Date filter dropdown shown');
        });
        
        // Quick Date Filter Options
        const dateOptions = dateFilterDropdown.querySelectorAll('[data-date-range]');
        console.log('Found date filter options:', dateOptions.length);
        dateOptions.forEach(option => {
            console.log('Adding listener to:', option.getAttribute('data-date-range'));
            option.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const range = this.getAttribute('data-date-range');
                console.log('Date filter clicked:', range);
                await fetchTransportData(1, searchQuery, range, '', '');
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
                    await fetchTransportData(1, searchQuery, '', startDate, endDate);
                    dateFilterDropdown.classList.add('hidden');
                    
                    // Update button text
                    dateFilterButton.querySelector('span').textContent = `${startDate} ถึง ${endDate}`;
                }
            });
        }
        
        // Clear Date Filter Button
        const clearDateFilterBtn = document.getElementById('transport-date-filter-clear');
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
                await fetchTransportData(1, searchQuery, '', '', '');
                dateFilterDropdown.classList.add('hidden');
                
                // Reset button text
                dateFilterButton.querySelector('span').textContent = 'กรองตามวันที่';
            });
        }
    }
    
    // ปิดเมนูดรอปดาวน์เมื่อคลิกที่อื่น
    document.addEventListener('click', function(e) {
        const exportButton = document.getElementById('transport-export-button');
        const exportDropdown = document.getElementById('transport-export-dropdown');
        
        // ตรวจสอบว่าคลิกนอกพื้นที่ของปุ่มและเมนูทั้งหมด
        const clickedInsideExport = exportButton && (exportButton.contains(e.target) || exportDropdown && exportDropdown.contains(e.target));
        const clickedInsideDateFilter = dateFilterButton && (dateFilterButton.contains(e.target) || dateFilterDropdown && dateFilterDropdown.contains(e.target));
        
        if (!clickedInsideExport && !clickedInsideDateFilter) {
            closeAllDropdowns();
        }
    });
    
    // หยุด propagation ของเหตุการณ์คลิกในดรอปดาวน์ เพื่อไม่ให้ปิดเมนู
    if (exportDropdown) {
        exportDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    if (dateFilterDropdown) {
        dateFilterDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Initial Load
    fetchTransportData();
});