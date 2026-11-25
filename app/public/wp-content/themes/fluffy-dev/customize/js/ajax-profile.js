/**
 * Profile Page JavaScript
 * Handles AJAX requests and UI interactions for the customer profile page
 */

const ProfileManager = {
    // Configuration
    config: {
        itemsPerPage: 12, // เปลี่ยนเป็น 3 เพื่อให้เห็น pagination
        currentPage: 1,
        currentSearch: '',
        currentStatus: '',
        bookings: [],
        allBookings: [], // Store all bookings for pagination
        filteredBookings: [], // Store filtered bookings
        totalPages: 0,
        stats: {}
    },

    // Initialize the profile page
    init: function() {
        this.bindEvents();
        this.loadBookings(); // Load bookings first, then calculate stats
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
                this.loadBookings();
            });
            
            // Also allow Enter key to trigger search
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.config.currentSearch = searchInput.value;
                    this.config.currentPage = 1;
                    this.loadBookings();
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
                    this.loadBookings();
                }, 500);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('filter-status');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.config.currentStatus = e.target.value;
                this.config.currentPage = 1;
                this.loadBookings();
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
            prevMobile.addEventListener('click', () => this.goToPage(this.config.currentPage - 1));
        }
        if (nextMobile) {
            nextMobile.addEventListener('click', () => this.goToPage(this.config.currentPage + 1));
        }
        if (prevDesktop) {
            prevDesktop.addEventListener('click', () => this.goToPage(this.config.currentPage - 1));
        }
        if (nextDesktop) {
            nextDesktop.addEventListener('click', () => this.goToPage(this.config.currentPage + 1));
        }
    },

    // Load user statistics
    loadUserStats: function() {
        // Synchronous XMLHttpRequest
        var xhr = new XMLHttpRequest();
        xhr.open('GET', profileAjax.resturl + 'user_parking_booking', false); // false makes it synchronous
        xhr.setRequestHeader('X-WP-Nonce', profileAjax.nonce);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
        
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            console.log('User parking booking data:', data);
            if (data && data.length > 0) {
                // Store the booking data
                this.config.allBookings = data;
                
                // Calculate stats from the fetched bookings
                this.calculateStatsFromBookings();
            } else {
                // Fallback: empty stats if no data
                this.updateStatsDisplay({
                    total: 0,
                    completed: 0,
                    active: 0,
                    month: 0
                });
            }
        } else {
            console.error('Error loading user parking booking data:', xhr.statusText);
            // Fallback: empty stats
            this.updateStatsDisplay({
                total: 0,
                completed: 0,
                active: 0,
                month: 0
            });
        }
    },

    // Update statistics display
    updateStatsDisplay: function(stats) {
        const elements = {
            'total-bookings': stats.total || 0,
            'stat-total': stats.total || 0,
            'stat-completed': stats.completed || 0,
            'stat-active': stats.active || 0,
            'stat-month': stats.month || 0
        };

        console.log('Updating stats display:', elements);

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Animate number counting
                this.animateNumber(element, 0, elements[id], 1000);
            }
        });
    },

    // Calculate stats from bookings data
    calculateStatsFromBookings: function() {
        if (!this.config.allBookings || this.config.allBookings.length === 0) {
            // Set default values
            this.updateStatsDisplay({
                total: 0,
                completed: 0,
                active: 0,
                month: 0
            });
            return;
        }

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        let completed = 0;
        let active = 0;
        let month = 0;

        this.config.allBookings.forEach(booking => {
            const status = booking.tracking_check_status;
            const bookingDate = booking.created_date ? booking.created_date.slice(0, 7) : '';

            // Count by status
            if (status == '3' || status == 'completed') {
                completed++;
            } else if (status == '1' || status == '2' || status == 'pending' || status == 'confirmed') {
                active++;
            }

            // Count current month bookings
            if (bookingDate === currentMonth) {
                month++;
            }
        });

        const stats = {
            total: this.config.allBookings.length,
            completed: completed,
            active: active,
            month: month
        };

        console.log('Calculated stats from bookings:', stats);
        this.config.stats = stats;
        this.updateStatsDisplay(stats);
    },

    // Animate number counting
    animateNumber: function(element, start, end, duration) {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    },

    // Load bookings data using existing parking API
    loadBookings: function() {
        this.showLoading();

        const params = new URLSearchParams({
            per_page: 100, // Get more records to filter client-side
        });

        if (this.config.currentSearch) {
            params.append('search', this.config.currentSearch);
        }

        // Use existing parking booking API - Asynchronous XMLHttpRequest
        var xhr2 = new XMLHttpRequest();
        var url = profileAjax.resturl.replace('profile/v1/', 'custom/v1/') + 'parking_booking?' + params.toString();
        
        xhr2.onreadystatechange = () => {
            if (xhr2.readyState === 4) {
                try {
                    if (xhr2.status === 200) {
                        var data = JSON.parse(xhr2.responseText);
                        if (data && Array.isArray(data)) {
                            // Store all user bookings and add status_info
                            this.config.allBookings = data.filter(booking => 
                                booking.customer_user && booking.customer_user == profileAjax.user_id
                            ).map(booking => {
                                // Add status_info if not present
                                if (!booking.status_info) {
                                    booking.status_info = this.getStatusInfo(booking.tracking_check_status);
                                }
                                return booking;
                            });

                            console.log('Loaded bookings:', this.config.allBookings.length);
                            
                            // Calculate stats from loaded bookings
                            this.calculateStatsFromBookings();
                            
                            // Apply filters and pagination
                            this.applyFiltersAndPagination();
                        } else {
                            this.showEmptyState();
                        }
                    } else {
                        console.error('Error loading bookings:', xhr2.statusText);
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
        
        xhr2.open('GET', url, true); // true makes it asynchronous
        xhr2.setRequestHeader('X-WP-Nonce', profileAjax.nonce);
        xhr2.setRequestHeader('Content-Type', 'application/json');
        xhr2.send();
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

    // Render bookings list
    renderBookings: function(bookings) {
        const container = document.getElementById('bookings-list');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;

        if (bookings.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = bookings.map(booking => this.createBookingCard(booking)).join('');

        // Add click events to booking cards
        container.querySelectorAll('.booking-card').forEach(card => {
            card.addEventListener('click', () => {
                const bookingId = card.dataset.bookingId;
                this.showBookingDetails(bookingId);
            });
        });
    },

    // Create booking card HTML
    createBookingCard: function(booking) {
        const statusInfo = booking.status_info || { label: 'ไม่ทราบสถานะ', color: 'gray' };
        
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

        // Format booking date
        const bookingDate = booking.created_date ? 
            new Date(booking.created_date).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'ไม่ระบุวันที่';

        // Generate unique special classes
        const specialClasses = this.generateSpecialClasses(booking);

        return `
            <div class="booking-card ${specialClasses} bg-white border border-gray-200 p-5 hover:shadow-lg hover:border-sky-300 cursor-pointer transition-all duration-300 transform hover:-translate-y-1" 
                 data-booking-id="${booking.id}">
                <div class="flex items-center justify-between">
                    <!-- Left side with booking info -->
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 ${iconClass} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            ${booking.order_code ? booking.order_code.slice(-2) : 'N/A'}
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg">รหัสจอง: ${booking.order_code || 'N/A'}</h3>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Format date range
    formatDateRange: function(startDate, startTime, endDate, endTime) {
        const start = new Date(startDate + ' ' + (startTime || '00:00'));
        const end = new Date(endDate + ' ' + (endTime || '23:59'));
        
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        if (startDate === endDate) {
            return `${start.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })} ${start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return `${start.toLocaleDateString('th-TH', options)} - ${end.toLocaleDateString('th-TH', options)}`;
        }
    },

    // Show booking details in modal
    showBookingDetails: function(bookingId) {
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

        // Find booking in current data instead of making new API call
        const booking = this.config.bookings.find(b => b.id == bookingId);
        
        if (booking) {
            modalContent.innerHTML = this.createBookingDetailHTML(booking);
        } else {
            modalContent.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-red-600 mb-2">ไม่พบข้อมูล</div>
                    <div class="text-gray-600">ไม่สามารถโหลดรายละเอียดได้</div>
                </div>
            `;
        }
    },

    // Create booking detail HTML
    createBookingDetailHTML: function(booking) {
        console.log('Full booking data:', booking); // Debug log to see all available data
        
        const statusInfo = booking.status_info || { label: 'ไม่ทราบสถานะ', color: 'gray' };
        const statusColors = {
            'yellow': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300',
            'blue': 'bg-gradient-to-r from-sky-100 to-sky-200 text-sky-800 border border-sky-300',
            'green': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300',
            'red': 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300',
            'gray': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
        };

        // Vehicle Information with enhanced design
        let vehicleInfoHTML = '';
        if (booking.vehicle_info && booking.vehicle_info.length > 0) {
            vehicleInfoHTML = booking.vehicle_info.map((vehicle, index) => `
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="flex items-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-600 mr-3">
                            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                            <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"></path>
                        </svg>
                        <h4 class="font-semibold text-slate-800 text-lg">ข้อมูลรถยนต์ ${booking.vehicle_info.length > 1 ? `#${index + 1}` : ''}</h4>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <span class="text-slate-600 text-sm font-medium w-24">ป้ายทะเบียน:</span> 
                            <span class="font-semibold text-slate-900 ml-2">${vehicle.license_plate || 'ไม่ระบุ'}</span>
                        </div>
                        <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <span class="text-slate-600 text-sm font-medium w-24">ประเภทรถ:</span> 
                            <span class="font-semibold text-slate-900 ml-2">${vehicle.other_type_car || vehicle.vehicle_type_name || 'ไม่ระบุ'}</span>
                        </div>
                        <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <span class="text-slate-600 text-sm font-medium w-24">ช่องจอด:</span> 
                            <span class="font-semibold text-slate-900 ml-2">${vehicle.parking_slot || 'ไม่ระบุ'}</span>
                        </div>
                        ${vehicle.brand ? `<div class="flex items-center p-3 bg-white rounded-lg border border-primary-200"><span class="text-primary-600 text-sm font-medium w-24">ยี่ห้อ:</span> <span class="font-semibold text-primary-800 ml-2">${vehicle.brand}</span></div>` : ''}
                        ${vehicle.model ? `<div class="flex items-center p-3 bg-white rounded-lg border border-primary-200"><span class="text-primary-600 text-sm font-medium w-24">รุ่น:</span> <span class="font-semibold text-primary-800 ml-2">${vehicle.model}</span></div>` : ''}
                        ${vehicle.color ? `<div class="flex items-center p-3 bg-white rounded-lg border border-primary-200"><span class="text-primary-600 text-sm font-medium w-24">สี:</span> <span class="font-semibold text-primary-800 ml-2">${vehicle.color}</span></div>` : ''}
                    </div>
                </div>
            `).join('');
        }

        // QR Code with enhanced design and expandable functionality
        let qrCodeHTML = '';
        if (booking.qr_code_url) {
            qrCodeHTML = `
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 text-center">
                    <div class="flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-primary mr-2">
                            <rect x="3" y="3" width="5" height="5"></rect>
                            <rect x="16" y="3" width="5" height="5"></rect>
                            <rect x="3" y="16" width="5" height="5"></rect>
                            <path d="m21 16-3.5-3.5-2.5 2.5"></path>
                            <path d="m13 13 3 3 3-3"></path>
                            <path d="M9 9h1v1h-1z"></path>
                        </svg>
                        <h4 class="font-semibold text-primary-800 text-lg">QR Code สำหรับเช็คอิน</h4>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-primary-200 inline-block cursor-pointer qr-code-container" onclick="ProfileManager.expandQRCode('${booking.qr_code_url}')">
                        <img src="${booking.qr_code_url}" alt="QR Code" class="w-32 h-32 rounded-lg">
                        <div class="flex items-center justify-center mt-2 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                                <path d="M15 3h6v6"></path>
                                <path d="M10 14 21 3"></path>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            </svg>
                            <span class="text-xs font-medium">คลิกเพื่อขยาย</span>
                        </div>
                    </div>
                    <p class="text-sm text-primary-700 mt-3 font-medium">สแกนเพื่อเช็คอิน</p>
                </div>
            `;
        }

        // Payment Information with enhanced design
        let paymentHTML = '';
        if (booking.total_amount || booking.payment_status || booking.payment_method) {
            paymentHTML = `
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="flex items-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-primary-600 mr-3">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        <h4 class="font-semibold text-slate-800 text-lg">ข้อมูลการชำระเงิน</h4>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${booking.total_amount ? `<div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-primary-600 mr-3">
                                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path>
                                <path d="M12 8l0 4"></path>
                                <path d="M12 16l0 0"></path>
                            </svg>
                            <span class="text-slate-600 text-sm font-medium w-28">ยอดรวม:</span> <span class="font-bold text-slate-900 ml-2 text-lg">${booking.total_amount} ${(typeof parkingTranslations !== 'undefined' && parkingTranslations.baht) ? parkingTranslations.baht : 'บาท'}</span>
                        </div>` : ''}
                        ${booking.payment_status ? `<div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-primary-600 mr-3">
                                <path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3"></path>
                                <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3"></path>
                                <line x1="16" y1="5" x2="19" y2="8"></line>
                            </svg>
                            <span class="text-slate-600 text-sm font-medium w-28">สถานะการชำระ:</span> <span class="font-semibold text-slate-900 ml-2">${booking.payment_status}</span>
                        </div>` : ''}
                        ${booking.payment_method ? `<div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-primary-600 mr-3">
                                <path d="M3 12h1l3 8l3 -16l3 8l3 -8l3 16l3 -8h1"></path>
                            </svg>
                            <span class="text-slate-600 text-sm font-medium w-28">วิธีการชำระ:</span> <span class="font-semibold text-slate-900 ml-2">${booking.payment_method}</span>
                        </div>` : ''}
                        ${booking.discount_amount ? `<div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-primary-600 mr-3">
                                <path d="M12 8v8"></path>
                                <path d="M8 12h8"></path>
                            </svg>
                            <span class="text-slate-600 text-sm font-medium w-28">ส่วนลด:</span> <span class="font-semibold text-slate-900 ml-2">${booking.discount_amount} ${(typeof parkingTranslations !== 'undefined' && parkingTranslations.baht) ? parkingTranslations.baht : 'บาท'}</span>
                        </div>` : ''}
                    </div>
                </div>
            `;
        }

        // Location Details with enhanced design
        let locationHTML = '';
        if (booking.location) {
            locationHTML = `
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="flex items-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-primary-600 mr-3">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <h4 class="font-semibold text-slate-800 text-lg">รายละเอียดสถานที่</h4>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-start p-3 bg-white rounded-lg border border-slate-200">
                            <span class="text-slate-600 text-sm font-medium w-24 flex-shrink-0">ชื่อสถานที่:</span> 
                            <span class="font-semibold text-slate-900 ml-2">${booking.location.name || 'ไม่ระบุ'}</span>
                        </div>
                        ${booking.location.address ? `<div class="flex items-start p-3 bg-white rounded-lg border border-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-primary-600 mr-3">
                                <path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3"></path>
                                <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3"></path>
                                <line x1="16" y1="5" x2="19" y2="8"></line>
                            </svg>
                            <span class="text-slate-600 text-sm font-medium w-24 flex-shrink-0">ที่อยู่:</span> <span class="font-semibold text-slate-900 ml-2">${booking.location.address}</span>
                        </div>` : ''}
                        ${booking.location.phone ? `<div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-primary-600 mr-3">
                                <path d="M3 12h1l3 8l3 -16l3 8l3 -8l3 16l3 -8h1"></path>
                            </svg>
                            <span class="text-slate-600 text-sm font-medium w-24">เบอร์โทร:</span> <span class="font-semibold text-slate-900 ml-2">${booking.location.phone}</span>
                        </div>` : ''}
                        ${booking.location.description ? `<div class="flex items-start p-3 bg-white rounded-lg border border-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-primary-600 mr-3">
                                <path d="M12 8v8"></path>
                                <path d="M8 12h8"></path>
                            </svg>
                            <span class="text-slate-600 text-sm font-medium w-24 flex-shrink-0">รายละเอียด:</span> <span class="font-semibold text-slate-900 ml-2">${booking.location.description}</span>
                        </div>` : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-8 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <!-- Booking Header -->
                <div class="sticky top-0 bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm z-10">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="bg-primary bg-opacity-10 p-3 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14,2 14,8 20,8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10,9 9,9 8,9"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900">รหัสจอง: ${booking.order_code || 'ไม่ระบุ'}</h2>
                                <div class="flex items-center gap-2 mt-1">
                                    <p class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">ID: ${booking.id}</p>
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[statusInfo.color]}">
                                        <span class="w-2 h-2 rounded-full bg-current mr-1"></span>
                                        ${statusInfo.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Customer & Booking Info -->
                <div class="grid grid-cols-1 gap-6">
                    <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div class="flex items-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-primary-600 mr-3">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <h3 class="text-lg font-semibold text-slate-800">ข้อมูลลูกค้า</h3>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                                <span class="text-slate-600 text-sm font-medium w-20">ชื่อ:</span> 
                                <span class="font-semibold text-slate-900 ml-2">${booking.fullname_park || 'ไม่ระบุ'}</span>
                            </div>
                            <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                                <span class="text-slate-600 text-sm font-medium w-20">อีเมล:</span> 
                                <span class="font-semibold text-slate-900 ml-2">${booking.email_park || 'ไม่ระบุ'}</span>
                            </div>
                            <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                                <span class="text-slate-600 text-sm font-medium w-20">เบอร์โทร:</span> 
                                <span class="font-semibold text-slate-900 ml-2">${booking.phone_park || 'ไม่ระบุ'}</span>
                            </div>
                            ${booking.line_id_park ? `<div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                                <span class="text-primary-600 text-sm font-medium w-20">Line ID:</span> <span class="font-semibold text-primary-800 ml-2">${booking.line_id_park}</span>
                            </div>` : ''}
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div class="flex items-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-primary-600 mr-3">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <h4 class="font-semibold text-slate-800 text-lg">ข้อมูลการจอง</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                                <span class="text-slate-600 text-sm font-medium w-24">วันที่เริ่ม:</span> 
                                <span class="font-semibold text-slate-900 ml-2">${booking.start_date || 'ไม่ระบุ'} ${booking.start_time || ''}</span>
                            </div>
                            <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                                <span class="text-slate-600 text-sm font-medium w-24">วันที่สิ้นสุด:</span> 
                                <span class="font-semibold text-slate-900 ml-2">${booking.end_date || 'ไม่ระบุ'} ${booking.end_time || ''}</span>
                            </div>
                            <div class="flex items-center p-3 bg-white rounded-lg border border-slate-200">
                                <span class="text-slate-600 text-sm font-medium w-24">สถานที่:</span> 
                                <span class="font-semibold text-slate-900 ml-2">${booking.location ? booking.location.name : 'ไม่ระบุ'}</span>
                            </div>
                            ${booking.booking_type ? `<div class="flex items-center p-3 bg-white rounded-lg border border-primary-200">
                                <span class="text-primary-600 text-sm font-medium w-24">ประเภทการจอง:</span> <span class="font-semibold text-primary-800 ml-2">${booking.booking_type}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Vehicle Info -->
                ${vehicleInfoHTML}

                <!-- Location Details -->
                ${locationHTML}

                <!-- Payment Info -->
                ${paymentHTML}

                <!-- Additional Services -->
                ${booking.addon_information ? this.createAddonHTML(booking.addon_information) : ''}

                <!-- QR Code -->
                ${qrCodeHTML}

            </div>
        `;
    },

    // Create addon services HTML with enhanced design
    createAddonHTML: function(addon) {
        // First check if there are any services at all
        let hasAnyService = false;
        
        // Check if addon is valid
        if (!addon || typeof addon !== 'object') {
            return '';
        }
        
        // Check for services
        Object.keys(addon).forEach(key => {
            if ((key.startsWith('service_') && key !== 'service_pickup' && key !== 'service_valet' && addon[key]) || 
                key === 'total_addon_price' || 
                (typeof addon[key] === 'object' && addon[key] !== null) ||
                (typeof addon[key] !== 'boolean' && key !== 'total_addon_price' && !key.startsWith('service_') && addon[key])) {
                hasAnyService = true;
            }
        });
        
        // If no services, return empty string
        if (!hasAnyService) {
            return '';
        }
        
        let servicesHTML = '<div class="space-y-4">';
        
        // Show other addon information as accordion
        let accordionItems = [];
        let accordionId = 0;
        
        // Process flight and other object data first for accordion
        Object.keys(addon).forEach(key => {
            if (!key.startsWith('service_') && key !== 'total_addon_price' && addon[key]) {
                const value = addon[key];
                
                const translations = {
                    'sending_flight': 'ข้อมูลเที่ยวบิน (ขาไป)',
                    'receiving_flight': 'ข้อมูลเที่ยวบิน (ขากลับ)',
                    'parking_car': 'ข้อมูลการนำรถเข้าจอด',
                    'car_wash': 'บริการล้างรถ',
                    'car_mechanic': 'บริการช่างยนต์',
                    'ev_charger': 'บริการชาร์จรถยนต์ไฟฟ้า'
                };

                const fieldName = translations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                if (typeof value === 'object' && value !== null) {
                    accordionId++;
                    let objectDetailsHTML = '<div class="space-y-2 mt-3">';
                    
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        if (subValue) {
                            const subKeyTranslations = {
                                'flight_number': 'หมายเลขเที่ยวบิน',
                                'flight_time': 'เวลาบิน',
                                'airline': 'สายการบิน',
                                'terminal': 'อาคารผู้โดยสาร',
                                'car_brand': 'ยี่ห้อรถ',
                                'car_model': 'รุ่นรถ',
                                'car_color': 'สีรถ',
                                'license_plate': 'ป้ายทะเบียน',
                                'depart': 'ต้นทาง',
                                'depart_time': 'เวลาต้นทาง',
                                'arrival': 'ปลายทาง',
                                'arrival_time': 'เวลาปลายทาง',
                                'pickup_time': 'เวลารับ',
                                'dropoff_time': 'เวลาส่ง',
                                'pickup_point': 'จุดรับ',
                                'dropoff_point': 'จุดส่ง',
                                'adult_count': 'จำนวนผู้ใหญ่',
                                'child_count': 'จำนวนเด็ก',
                                'baggage_count': 'จำนวนสัมภาระ',
                                'pickup_note': 'หมายเหตุการรับ'
                            };
                            
                            const formattedSubKey = subKeyTranslations[subKey] || subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            objectDetailsHTML += `<div class="flex items-center p-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"><span class="text-slate-600 text-sm font-medium w-32">${formattedSubKey}:</span> <span class="font-medium text-slate-800 ml-2">${subValue}</span></div>`;
                        }
                    });
                    
                    objectDetailsHTML += '</div>';
                    
                    accordionItems.push({
                        id: accordionId,
                        title: fieldName,
                        content: objectDetailsHTML
                    });
                } else if (typeof value !== 'boolean') {
                    accordionId++;
                    accordionItems.push({
                        id: accordionId,
                        title: fieldName,
                        content: `<div class="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"><span class="font-medium text-slate-800">${value}</span></div>`
                    });
                }
            }
        });
        
        // Add accordion items to HTML
        if (accordionItems.length > 0) {
            accordionItems.forEach((item, index) => {
                servicesHTML += `
                    <div class="collapse collapse-arrow bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 mb-2">
                        <input type="radio" name="addon-accordion" ${index === 0 ? 'checked="checked"' : ''} /> 
                        <div class="collapse-title font-semibold text-slate-800">${item.title}</div>
                        <div class="collapse-content text-sm">
                            ${item.content}
                        </div>
                    </div>`;
            });
        }
        
        // Show total addon price if available
        if (addon.total_addon_price) {
            servicesHTML += `
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 text-center">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <span class="font-bold text-slate-800 text-xl">ค่าบริการเสริมรวม</span>
                        </div>
                        <span class="font-bold text-slate-800 text-2xl bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">${addon.total_addon_price} ${(typeof parkingTranslations !== 'undefined' && parkingTranslations.baht) ? parkingTranslations.baht : 'บาท'}</span>
                    </div>
                </div>
            `;
        }
        
        servicesHTML += '</div>';
        
        // If no content was added, show empty state
        if (accordionItems.length === 0 && !addon.total_addon_price) {
            servicesHTML = '<div class="text-center py-8"><div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"><span class="text-slate-500 text-lg font-medium">ไม่มีบริการเสริม</span></div></div>';
        }
        
        return `
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div class="flex items-center mb-6">
                    <h4 class="font-bold text-slate-800 text-xl">บริการเสริม</h4>
                </div>
                ${servicesHTML}
            </div>
        `;
    },

    // Close modal
    closeModal: function() {
        const modal = document.getElementById('booking-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    // Show empty state
    showEmptyState: function() {
        const container = document.getElementById('bookings-list');
        const emptyState = document.getElementById('empty-state');
        
        // Ensure loading is hidden
        this.hideLoading();
        
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
    },

    // Show error message
    showError: function(message) {
        const container = document.getElementById('bookings-list');
        const emptyState = document.getElementById('empty-state');
        
        // Ensure loading is hidden
        this.hideLoading();
        
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">เกิดข้อผิดพลาด</h3>
                    <p class="mt-1 text-sm text-gray-500">${message}</p>
                    <div class="mt-6">
                        <button onclick="ProfileManager.loadBookings()" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
    },

    // Show error message
    showError: function(message) {
        const container = document.getElementById('bookings-list');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-red-600 mb-2">เกิดข้อผิดพลาด</div>
                    <div class="text-gray-600">${message}</div>
                </div>
            `;
        }
    },

    // Apply filters and pagination
    applyFiltersAndPagination: function() {
        let filteredBookings = [...this.config.allBookings];

        // Apply status filter
        if (this.config.currentStatus) {
            filteredBookings = filteredBookings.filter(booking => 
                booking.tracking_check_status == this.config.currentStatus
            );
        }

        // Apply search filter
        if (this.config.currentSearch) {
            const searchTerm = this.config.currentSearch.toLowerCase();
            filteredBookings = filteredBookings.filter(booking => 
                (booking.order_code && booking.order_code.toLowerCase().includes(searchTerm)) ||
                (booking.fullname_park && booking.fullname_park.toLowerCase().includes(searchTerm))
            );
        }

        this.config.filteredBookings = filteredBookings;
        this.config.totalPages = Math.ceil(filteredBookings.length / this.config.itemsPerPage);

        console.log('Filtered bookings:', filteredBookings.length, 'Total pages:', this.config.totalPages);

        // Reset to page 1 if current page is beyond total pages
        if (this.config.currentPage > this.config.totalPages && this.config.totalPages > 0) {
            this.config.currentPage = 1;
        }

        // Get bookings for current page
        const startIndex = (this.config.currentPage - 1) * this.config.itemsPerPage;
        const endIndex = startIndex + this.config.itemsPerPage;
        const pageBookings = filteredBookings.slice(startIndex, endIndex);

        this.config.bookings = pageBookings;
        
        // Always ensure loading is hidden when rendering results
        this.hideLoading();
        
        if (filteredBookings.length === 0) {
            this.showEmptyState();
        } else {
            this.renderBookings(pageBookings);
            this.renderPagination();
        }
    },

    // Go to specific page
    goToPage: function(page) {
        if (page < 1 || page > this.config.totalPages) {
            return;
        }
        
        this.config.currentPage = page;
        this.applyFiltersAndPagination();
    },

    // Render pagination controls
    renderPagination: function() {
        const paginationContainer = document.getElementById('pagination-container');
        const pageNumbers = document.getElementById('page-numbers');
        const pageNumbersMobile = document.getElementById('page-numbers-mobile');
        
        console.log('Rendering pagination - Total pages:', this.config.totalPages);
        
        if (!paginationContainer) {
            console.log('Pagination container not found');
            return;
        }

        // Always show pagination if there are bookings (no hidden classes)
        if (this.config.filteredBookings.length === 0) {
            console.log('No bookings to paginate');
            return;
        }

        console.log('Showing pagination');

        // Update pagination info for both mobile and desktop
        this.updatePaginationInfo();
        this.updateNavigationButtons();
        
        // Generate page numbers for desktop
        if (pageNumbers) {
            this.generatePageNumbers(pageNumbers, false);
        }
        
        // Generate page numbers for mobile
        if (pageNumbersMobile) {
            this.generatePageNumbers(pageNumbersMobile, true);
        }
    },

    // Update pagination information displays
    updatePaginationInfo: function() {
        const startIndex = (this.config.currentPage - 1) * this.config.itemsPerPage + 1;
        const endIndex = Math.min(this.config.currentPage * this.config.itemsPerPage, this.config.filteredBookings.length);
        
        // Desktop info
        const showingFrom = document.getElementById('showing-from');
        const showingTo = document.getElementById('showing-to');
        const totalResults = document.getElementById('total-results');

        if (showingFrom) showingFrom.textContent = startIndex;
        if (showingTo) showingTo.textContent = endIndex;
        if (totalResults) totalResults.textContent = this.config.filteredBookings.length;

        // Mobile info
        const currentPageMobile = document.getElementById('current-page-mobile');
        const totalPagesMobile = document.getElementById('total-pages-mobile');
        const totalResultsMobile = document.getElementById('total-results-mobile');

        if (currentPageMobile) currentPageMobile.textContent = this.config.currentPage;
        if (totalPagesMobile) totalPagesMobile.textContent = this.config.totalPages;
        if (totalResultsMobile) totalResultsMobile.textContent = this.config.filteredBookings.length;
    },

    // Update navigation buttons state
    updateNavigationButtons: function() {
        const prevButtons = ['prev-mobile', 'prev-desktop'];
        const nextButtons = ['next-mobile', 'next-desktop'];

        prevButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = this.config.currentPage <= 1;
            }
        });

        nextButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = this.config.currentPage >= this.config.totalPages;
            }
        });
    },

    // Generate page numbers for desktop or mobile
    generatePageNumbers: function(container, isMobile = false) {
        container.innerHTML = '';
        
        const maxVisiblePages = isMobile ? 3 : 5;
        let startPage = Math.max(1, this.config.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.config.totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // For desktop: Add first page and ellipsis if needed
        if (!isMobile && startPage > 1) {
            container.appendChild(this.createPageButton(1, isMobile));
            if (startPage > 2) {
                container.appendChild(this.createEllipsis(isMobile));
            }
        }

        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            container.appendChild(this.createPageButton(i, isMobile));
        }

        // For desktop: Add ellipsis and last page if needed
        if (!isMobile && endPage < this.config.totalPages) {
            if (endPage < this.config.totalPages - 1) {
                container.appendChild(this.createEllipsis(isMobile));
            }
            container.appendChild(this.createPageButton(this.config.totalPages, isMobile));
        }
    },

    // Create page button
    createPageButton: function(pageNum, isMobile = false) {
        const button = document.createElement('button');
        
        if (isMobile) {
            button.className = `inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full transition-all duration-200 ${
                pageNum === this.config.currentPage
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-sky-50 hover:text-sky-600'
            }`;
        } else {
            button.className = `inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                pageNum === this.config.currentPage
                    ? 'bg-primary text-white shadow-lg ring-2 ring-sky-200'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300'
            }`;
        }
        
        button.textContent = pageNum;
        button.addEventListener('click', () => this.goToPage(pageNum));
        return button;
    },

    // Create ellipsis
    createEllipsis: function(isMobile = false) {
        const span = document.createElement('span');
        
        if (isMobile) {
            span.className = 'inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-500';
        } else {
            span.className = 'inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500';
        }
        
        span.textContent = '...';
        return span;
    },

    // Expand QR code in a modal
    expandQRCode: function(qrCodeUrl) {
        // Create or get the QR code modal
        let qrModal = document.getElementById('qr-code-modal');
        
        if (!qrModal) {
            qrModal = document.createElement('div');
            qrModal.id = 'qr-code-modal';
            qrModal.className = 'fixed z-[9998] flex items-center justify-center inset-0 bg-opacity-40 backdrop-blur-sm cursor-pointer';
            document.body.appendChild(qrModal);
        }
        
        // Set the modal content
        qrModal.innerHTML = `
            <div class="relative bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div class="absolute top-4 right-4">
                    <button id="close-qr-modal" class="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="p-6 text-center">
                    <h3 class="text-xl font-semibold text-gray-900 mb-4">QR Code สำหรับเช็คอิน</h3>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 inline-block">
                        <img src="${qrCodeUrl}" alt="QR Code" class="w-64 h-64 rounded-lg">
                    </div>
                    <p class="text-sm text-gray-600 mt-4">สแกนเพื่อเช็คอิน</p>
                </div>
            </div>
        `;
        
        // Show the modal
        qrModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Add close event
        const closeButton = document.getElementById('close-qr-modal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                qrModal.classList.add('hidden');
                document.body.style.overflow = '';
            });
        }
        
        // Close on click outside
        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) {
                qrModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    },

    // Get status info helper function
    getStatusInfo: function(status) {
        const statusMap = {
            'confirmed':   { label: 'ยืนยันแล้ว', color: 'bg-purple-100 text-purple-800' },
            'checked-in':  { label: 'เช็คอิน',    color: 'bg-sky-100 text-sky-800' },
            'checked-out': { label: 'เช็คเอาท์',  color: 'bg-green-100 text-green-800' },
            'cancel':      { label: 'ยกเลิก',      color: 'bg-red-100 text-red-800' },
            'none':        { label: 'ไม่มีข้อมูล',  color: 'bg-gray-100 text-gray-800' }
        };
        
        return statusMap[status] || { label: 'ไม่ทราบสถานะ', color: 'gray' };
    },

    // Generate special classes for booking cards
    generateSpecialClasses: function(booking) {
        const classes = [];
        
        // Status-based classes
        const status = booking.tracking_check_status;
        if (status == '1' || status == 'pending') {
            classes.push('booking-status-pending', 'border-l-4', 'border-l-yellow-400');
        } else if (status == '2' || status == 'confirmed') {
            classes.push('booking-status-confirmed', 'border-l-4', 'border-l-sky-400');
        } else if (status == '3' || status == 'completed') {
            classes.push('booking-status-completed', 'border-l-4', 'border-l-green-400');
        } else if (status == '4' || status == 'cancelled') {
            classes.push('booking-status-cancelled', 'border-l-4', 'border-l-red-400');
        }

        // Date-based classes
        const today = new Date();
        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.end_date);
        
        if (startDate <= today && endDate >= today) {
            classes.push('booking-active-now', 'ring-2', 'ring-sky-200');
        } else if (startDate > today) {
            classes.push('booking-upcoming', 'bg-sky-50');
        } else if (endDate < today) {
            classes.push('booking-past', 'opacity-75');
        }

        // Duration-based classes
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (duration <= 1) {
            classes.push('booking-short-term', 'shadow-sm');
        } else if (duration <= 7) {
            classes.push('booking-medium-term', 'shadow-md');
        } else {
            classes.push('booking-long-term', 'shadow-lg');
        }

        // Location-based classes
        if (booking.location && booking.location.name) {
            const locationSlug = booking.location.name.toLowerCase().replace(/\s+/g, '-');
            classes.push(`booking-location-${locationSlug}`);
        }

        // Vehicle type classes (if available)
        if (booking.vehicle_info && booking.vehicle_info.length > 0) {
            const vehicleType = booking.vehicle_info[0].other_type_car || booking.vehicle_info[0].vehicle_type_name;
            if (vehicleType) {
                const vehicleSlug = vehicleType.toLowerCase().replace(/\s+/g, '-');
                classes.push(`booking-vehicle-${vehicleSlug}`);
            }
        }

        // Service-based classes
        if (booking.addon_information) {
            if (booking.addon_information.service_pickup) {
                classes.push('booking-has-pickup', 'border-r-2', 'border-r-purple-300');
            }
            if (booking.addon_information.service_valet) {
                classes.push('booking-has-valet', 'border-r-2', 'border-r-indigo-300');
            }
            if (booking.addon_information.service_pickup && booking.addon_information.service_valet) {
                classes.push('booking-premium-services', 'bg-gradient-to-r', 'from-purple-50', 'to-indigo-50');
            }
        }

        // Time-based classes
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) {
            classes.push('viewed-morning');
        } else if (hour >= 12 && hour < 18) {
            classes.push('viewed-afternoon');
        } else {
            classes.push('viewed-evening');
        }

        // Priority classes based on booking recency
        const bookingDate = new Date(booking.created_date);
        const daysSinceBooking = Math.floor((today - bookingDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceBooking <= 1) {
            classes.push('booking-fresh', 'animate-pulse-slow');
        } else if (daysSinceBooking <= 7) {
            classes.push('booking-recent');
        } else if (daysSinceBooking <= 30) {
            classes.push('booking-standard');
        } else {
            classes.push('booking-archived', 'grayscale-25');
        }

        return classes.join(' ');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof profileAjax !== 'undefined') {
        ProfileManager.init();
    }
});
