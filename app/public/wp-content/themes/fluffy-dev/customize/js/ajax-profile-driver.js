/**
 * Driver Profile Page JavaScript
 * Handles AJAX requests and UI interactions for the driver profile page (ride_assignment management)
 */

const DriverProfileManager = {
    // Configuration
    config: {
        itemsPerPage: 12,
        currentPage: 1,
        currentSearch: '',
        currentStatus: '',
        assignments: [],
        allAssignments: [], // Store all assignments for pagination
        filteredAssignments: [], // Store filtered assignments
        totalPages: 0,
        stats: {}
    },

    // Initialize the profile page
    init: function() {
        this.bindEvents();
        this.loadAssignments(); // Load assignments first, then calculate stats
    },

    // Bind event listeners
    bindEvents: function() {
        // Search functionality with button
        const searchInput = document.getElementById('search-bookings');
        const searchButton = document.getElementById('search-button');
        
        if (searchInput && searchButton) {
            // Remove the automatic search on input
            // Add search button click event
            searchButton.addEventListener('click', () => {
                this.config.currentSearch = searchInput.value;
                this.config.currentPage = 1;
                this.loadAssignments();
            });
            
            // Also allow Enter key to trigger search
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.config.currentSearch = searchInput.value;
                    this.config.currentPage = 1;
                    this.loadAssignments();
                }
            });
        } else if (searchInput) {
            // Fallback to input-based search if button doesn't exist
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.config.currentSearch = e.target.value;
                    this.config.currentPage = 1;
                    this.loadAssignments();
                }, 500);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('filter-status');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.config.currentStatus = e.target.value;
                this.config.currentPage = 1;
                this.loadAssignments();
            });
        }

        // Modal close events
        const closeModal = document.getElementById('close-modal');
        const modal = document.getElementById('booking-modal');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Pagination events
        const prevMobile = document.getElementById('prev-mobile');
        const nextMobile = document.getElementById('next-mobile');
        const prevDesktop = document.getElementById('prev-desktop');
        const nextDesktop = document.getElementById('next-desktop');

        if (prevMobile) {
            prevMobile.addEventListener('click', () => {
                if (this.config.currentPage > 1) {
                    this.config.currentPage--;
                    this.applyFiltersAndPagination();
                }
            });
        }

        if (nextMobile) {
            nextMobile.addEventListener('click', () => {
                if (this.config.currentPage < this.config.totalPages) {
                    this.config.currentPage++;
                    this.applyFiltersAndPagination();
                }
            });
        }

        if (prevDesktop) {
            prevDesktop.addEventListener('click', () => {
                if (this.config.currentPage > 1) {
                    this.config.currentPage--;
                    this.applyFiltersAndPagination();
                }
            });
        }

        if (nextDesktop) {
            nextDesktop.addEventListener('click', () => {
                if (this.config.currentPage < this.config.totalPages) {
                    this.config.currentPage++;
                    this.applyFiltersAndPagination();
                }
            });
        }
    },

    loadAssignments: function() {
        this.showLoading();

        const params = new URLSearchParams({
            per_page: 100, // Get more records to filter client-side
        });

        if (this.config.currentSearch) {
            params.append('search', this.config.currentSearch);
        }

        // Use ride_assignment API - Asynchronous XMLHttpRequest
        var xhr = new XMLHttpRequest();
        var url = profileDriverAjax.resturl + 'ride_assignments?' + params.toString();
        
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                try {
                    if (xhr.status === 200) {
                        var data = JSON.parse(xhr.responseText);
                        
                        // Handle both direct array and response with data property
                        var assignmentList = Array.isArray(data) ? data : (data.data || []);
                        
                        if (assignmentList && assignmentList.length > 0) {
                            // Get current driver's taxi_user post ID from browser data
                            var currentDriverTaxiUserId = profileDriverAjax.driver_taxi_user_id;
                            
                            // Store assignments filtered by current user's driver_userdata
                            this.config.allAssignments = assignmentList.filter(assignment => {
                                // Filter assignments where taxi_user matches current user's driver taxi user post ID
                                if (!assignment.taxi_user) return false;
                                
                                // Compare taxi_user ID with current driver's taxi_user_id
                                return assignment.taxi_user.ID == currentDriverTaxiUserId;
                            }).map(assignment => {
                                // Add status_info if not present
                                if (!assignment.status_info) {
                                    assignment.status_info = this.getStatusInfo(assignment.status_job);
                                }
                                return assignment;
                            });

                            console.log('Loaded assignments for driver:', this.config.allAssignments.length);
                            
                            // Apply filters and pagination
                            this.applyFiltersAndPagination();
                        } else {
                            this.showEmptyState();
                        }
                    } else {
                        console.error('Error loading assignments:', xhr.statusText);
                        this.showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
                    }
                } catch (error) {
                    console.error('Error parsing response:', error);
                    this.showError('เกิดข้อผิดพลาดในการประมวลผลข้อมูล');
                } finally {
                    this.hideLoading();
                }
            }
        };
        
        xhr.open('GET', url, true); // true makes it asynchronous
        xhr.setRequestHeader('X-WP-Nonce', profileDriverAjax.nonce);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
    },

    // Show loading state
    showLoading: function() {
        const loading = document.getElementById('loading-bookings');
        const container = document.getElementById('bookings-container');
        
        if (loading) loading.classList.remove('hidden');
        if (container) container.classList.add('hidden');
    },

    // Hide loading state
    hideLoading: function() {
        const loading = document.getElementById('loading-bookings');
        const container = document.getElementById('bookings-container');
        
        if (loading) loading.classList.add('hidden');
        if (container) container.classList.remove('hidden');
    },

    // Apply filters and pagination to assignments
    applyFiltersAndPagination: function() {
        let filtered = this.config.allAssignments;

        // Apply status filter
        if (this.config.currentStatus) {
            filtered = filtered.filter(assignment => assignment.status_job === this.config.currentStatus);
        }

        this.config.filteredAssignments = filtered;
        this.config.totalPages = Math.ceil(filtered.length / this.config.itemsPerPage);

        // Calculate pagination
        const start = (this.config.currentPage - 1) * this.config.itemsPerPage;
        const end = start + this.config.itemsPerPage;
        this.config.assignments = filtered.slice(start, end);

        // Render assignments
        this.renderAssignments(this.config.assignments);

        // Update pagination
        this.updatePagination();
    },

    // Render assignments list
    renderAssignments: function(assignments) {
        const container = document.getElementById('ride_assignment');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;

        if (assignments.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = assignments.map(assignment => this.createAssignmentCard(assignment)).join('');

        // Add click events to assignment cards
        container.querySelectorAll('.assignment-card').forEach(card => {
            card.addEventListener('click', () => {
                const assignmentId = card.dataset.assignmentId;
                this.showAssignmentDetails(assignmentId);
            });
        });
    },

    // Create assignment card HTML
    createAssignmentCard: function(assignment) {
        const statusInfo = assignment.status_info || { label: 'ไม่ทราบสถานะ', color: 'gray' };
        
        // Enhanced color scheme for status
        const statusColors = {
            'yellow': 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md',
            'blue': 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md',
            'green': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md',
            'red': 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md',
            'gray': 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md'
        };

        // Icon colors for status
        const iconColors = {
            'yellow': 'bg-gradient-to-br from-yellow-500 to-orange-500',
            'blue': 'bg-gradient-to-br from-sky-500 to-indigo-600',
            'green': 'bg-gradient-to-br from-green-500 to-emerald-600',
            'red': 'bg-gradient-to-br from-red-500 to-pink-600',
            'gray': 'bg-gradient-to-br from-gray-500 to-gray-600'
        };

        const statusClass = statusColors[statusInfo.color] || statusColors.gray;
        const iconClass = iconColors[statusInfo.color] || iconColors.gray;

        // Format assignment date
        const assignmentDate = assignment.date ? 
            new Date(assignment.date).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'ไม่ระบุวันที่';

        // Get driver name from taxi_user
        const driverName = assignment.taxi_user ? assignment.taxi_user.post_title : 'ไม่ระบุ';
        const plateDriver = assignment.plate_driver || 'ไม่ระบุ';

        return `
            <div class="assignment-card bg-white border border-gray-200 p-5 hover:shadow-lg hover:border-sky-300 cursor-pointer transition-all duration-300 transform hover:-translate-y-1" 
                 data-assignment-id="${assignment.id}">
                <div class="flex items-center justify-between">
                    <!-- Left side with assignment info -->
                    <div class="flex items-center space-x-4 flex-1">
                        <div class="w-12 h-12 ${iconClass} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            ${assignment.job_code ? assignment.job_code.slice(-2) : 'N/A'}
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-900 text-lg">รหัสงาน: ${assignment.job_code || 'N/A'}</h3>
                            <p class="text-gray-600 text-sm mt-1">ป้ายทะเบียน: <span class="font-semibold">${plateDriver}</span></p>
                            <p class="text-gray-500 text-xs mt-2">วันที่สร้าง: ${assignmentDate}</p>
                        </div>
                    </div>
                    
                    <!-- Right side with status badge -->
                    <div class="flex items-center justify-end ml-4">
                        <span class="px-4 py-2 rounded-full text-sm font-semibold ${statusClass}">
                            ${statusInfo.label}
                        </span>
                    </div>
                </div>
            </div>
        `;
    },

    // Get status info based on status code
    getStatusInfo: function(statusCode) {
        const statusMap = {
            'pending': { label: 'รอดำเนิน', color: 'yellow' },
            'in_progress': { label: 'กำลังดำเนิน', color: 'blue' },
            'completed': { label: 'เสร็จสิ้น', color: 'green' },
            'cancelled': { label: 'ยกเลิก', color: 'red' },
        };
        
        return statusMap[statusCode] || { label: 'ไม่ทราบสถานะ', color: 'gray' };
    },

    // Show assignment details in modal
    showAssignmentDetails: function(assignmentId) {
        const modal = document.getElementById('booking-modal');
        const modalContent = document.getElementById('modal-content');
        
        if (!modal || !modalContent) return;

        // Show modal with loading
        modalContent.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                <span class="ml-3 text-gray-600">กำลังโหลดรายละเอียด...</span>
            </div>
        `;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Find assignment in current data
        const assignment = this.config.assignments.find(a => a.id == assignmentId);
        
        if (assignment) {
            modalContent.innerHTML = this.createAssignmentDetailHTML(assignment);
        } else {
            modalContent.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-red-600 mb-2">ไม่พบข้อมูล</div>
                    <div class="text-gray-600">ไม่สามารถโหลดรายละเอียดได้</div>
                </div>
            `;
        }
    },

    // Create assignment detail HTML
    createAssignmentDetailHTML: function(assignment) {
        console.log('Full assignment data:', assignment); // Debug log
        
        const statusInfo = assignment.status_info || { label: 'ไม่ทราบสถานะ', color: 'gray' };
        const statusColors = {
            'yellow': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300',
            'blue': 'bg-gradient-to-r from-sky-100 to-sky-200 text-sky-800 border border-sky-300',
            'green': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300',
            'red': 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300',
            'gray': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
        };

        const statusClass = statusColors[statusInfo.color] || statusColors.gray;

        // Driver Information
        let driverInfoHTML = '';
        if (assignment.taxi_user) {
            driverInfoHTML = `
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center mb-4">
                        <svg class="w-5 h-5 text-slate-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <h4 class="font-semibold text-slate-800 text-lg">ข้อมูลไดรเวอร์</h4>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <span class="text-slate-600 text-sm font-medium w-32">ชื่อไดรเวอร์:</span> 
                            <span class="font-semibold text-slate-900 ml-2">${assignment.taxi_user.post_title || 'ไม่ระบุ'}</span>
                        </div>
                        <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <span class="text-slate-600 text-sm font-medium w-32">ป้ายทะเบียน:</span> 
                            <span class="font-semibold text-slate-900 ml-2">${assignment.plate_driver || 'ไม่ระบุ'}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Job Information
        let jobInfoHTML = '';
        if (assignment.job_code) {
            jobInfoHTML = `
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center mb-4">
                        <svg class="w-5 h-5 text-slate-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                        <h4 class="font-semibold text-slate-800 text-lg">ข้อมูลงาน</h4>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <span class="text-slate-600 text-sm font-medium w-32">รหัสงาน:</span> 
                            <span class="font-semibold text-slate-900 ml-2">${assignment.job_code || 'ไม่ระบุ'}</span>
                        </div>
                        <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <span class="text-slate-600 text-sm font-medium w-32">สถานะ:</span> 
                            <span class="px-3 py-1 rounded-full text-sm font-semibold ${statusClass}">${statusInfo.label}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Booking Order Information
        let bookingInfoHTML = '';
        if (assignment.booking_order) {
            bookingInfoHTML = `
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center mb-4">
                        <svg class="w-5 h-5 text-slate-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 16l-4-4m0 0l-4-4m4 4l4-4m-4 4l-4 4"></path>
                        </svg>
                        <h4 class="font-semibold text-slate-800 text-lg">ข้อมูลการจอง</h4>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <span class="text-slate-600 text-sm font-medium w-32">รหัสจอง:</span> 
                            <span class="font-semibold text-slate-900 ml-2">${assignment.booking_order.post_title || 'ไม่ระบุ'}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Additional Information
        let addonInfoHTML = '';
        if (assignment.addon_information) {
            const addon = assignment.addon_information;
            addonInfoHTML = `
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center mb-4">
                        <svg class="w-5 h-5 text-slate-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h4 class="font-semibold text-slate-800 text-lg">ข้อมูลเพิ่มเติม</h4>
                    </div>
                    <div class="space-y-3">
                        ${addon.service_pickup ? '<div class="flex items-center p-3 bg-white rounded-lg border border-green-200"><span class="text-green-600 font-semibold">✓ บริการรับส่ง</span></div>' : ''}
                        ${addon.service_valet ? '<div class="flex items-center p-3 bg-white rounded-lg border border-green-200"><span class="text-green-600 font-semibold">✓ บริการเวเลท์</span></div>' : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-6">
                ${driverInfoHTML}
                ${jobInfoHTML}
                ${bookingInfoHTML}
                ${addonInfoHTML}
                
                <div class="flex justify-center pt-4">
                    <button onclick="DriverProfileManager.loadAssignments()" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        รีโหลด
                    </button>
                </div>
            </div>
        `;
    },

    // Update pagination display and buttons
    updatePagination: function() {
        const totalResults = this.config.filteredAssignments.length;
        const from = (this.config.currentPage - 1) * this.config.itemsPerPage + 1;
        const to = Math.min(this.config.currentPage * this.config.itemsPerPage, totalResults);

        // Update desktop pagination
        document.getElementById('showing-from').textContent = from;
        document.getElementById('showing-to').textContent = to;
        document.getElementById('total-results').textContent = totalResults;

        // Update mobile pagination
        document.getElementById('current-page-mobile').textContent = this.config.currentPage;
        document.getElementById('total-pages-mobile').textContent = this.config.totalPages;
        document.getElementById('total-results-mobile').textContent = totalResults;

        // Update prev/next buttons
        const prevMobile = document.getElementById('prev-mobile');
        const nextMobile = document.getElementById('next-mobile');
        const prevDesktop = document.getElementById('prev-desktop');
        const nextDesktop = document.getElementById('next-desktop');

        if (prevMobile) prevMobile.disabled = this.config.currentPage === 1;
        if (nextMobile) nextMobile.disabled = this.config.currentPage === this.config.totalPages;
        if (prevDesktop) prevDesktop.disabled = this.config.currentPage === 1;
        if (nextDesktop) nextDesktop.disabled = this.config.currentPage === this.config.totalPages;

        // Generate page numbers
        this.generatePageNumbers();
    },

    // Generate page number buttons
    generatePageNumbers: function() {
        const pageNumbersDesktop = document.getElementById('page-numbers');
        const pageNumbersMobile = document.getElementById('page-numbers-mobile');

        if (!pageNumbersDesktop && !pageNumbersMobile) return;

        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, this.config.currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(this.config.totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const isCurrentPage = i === this.config.currentPage;
            const pageHTML = `
                <button class="page-number ${isCurrentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
            pages.push(pageHTML);
        }

        if (pageNumbersDesktop) {
            pageNumbersDesktop.innerHTML = pages.join('');
            this.addPageNumberListeners(pageNumbersDesktop);
        }

        if (pageNumbersMobile) {
            pageNumbersMobile.innerHTML = pages.join('');
            this.addPageNumberListeners(pageNumbersMobile);
        }
    },

    // Add listeners to page number buttons
    addPageNumberListeners: function(container) {
        container.querySelectorAll('.page-number').forEach(button => {
            button.addEventListener('click', () => {
                this.config.currentPage = parseInt(button.dataset.page);
                this.applyFiltersAndPagination();
            });
        });
    },

    // Show error message
    showError: function(message) {
        const container = document.getElementById('bookings-container');
        const emptyState = document.getElementById('empty-state');
        
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">เกิดข้อผิดพลาด</h3>
                    <p class="mt-1 text-sm text-gray-500">${message}</p>
                </div>
            `;
            container.classList.remove('hidden');
        }
    },

    // Show empty state
    showEmptyState: function() {
        const container = document.getElementById('ride_assignment');
        const emptyState = document.getElementById('empty-state');
        
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
    },

    // Close modal
    closeModal: function() {
        const modal = document.getElementById('booking-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    },

    // Expand QR Code
    expandQRCode: function(qrCodeUrl) {
        // Implementation for expanding QR code if needed
        const modal = document.getElementById('booking-modal');
        const modalContent = document.getElementById('modal-content');
        
        if (modal && modalContent) {
            modalContent.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8">
                    <img src="${qrCodeUrl}" alt="QR Code" class="w-64 h-64 border-2 border-gray-300 rounded-lg">
                    <p class="mt-4 text-gray-600 text-sm">QR Code - สแกนเพื่อดูรายละเอียด</p>
                </div>
            `;
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }
};

// Initialize on document ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof DriverProfileManager !== 'undefined') {
        DriverProfileManager.init();
    }
});
