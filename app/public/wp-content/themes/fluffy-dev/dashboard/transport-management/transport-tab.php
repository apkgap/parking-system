<?php
// Enqueue the transport.js script
wp_enqueue_script('transport-js', get_template_directory_uri() . '/dashboard/transport-management/js/transport.js', array(), '1.0.0', true);
?>

<div class="head-bar flex items-center px-4 py-3 text-gray-700 border-b border-gray-200 mb-10">
    <h3 class="flex items-center text-2xl">
        <svg class="w-7 h-7 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
        Transport Management
    </h3>
</div>
<div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
    <div class="flex items-center w-full md:w-auto">
        <div class="relative w-full md:w-64">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg class="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
            </div>
            <input type="search" id="transport-search" class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500" placeholder="Search">
        </div>
    </div>
    
    <div class="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
        <div class="transport-sec relative">
            <button id="transport-export-button" class="p-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 relative">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            </button>
            <div id="transport-export-dropdown" class="z-15 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 absolute max-w-[185px] content-center">
                <ul class="text-sm text-gray-700 w-full">
                    <li><a href="#" onclick="exportTransportToExcel(); return false;" class="block px-4 py-2 hover:bg-gray-100">Excel</a></li>
                    <li><a href="#" onclick="exportTransportToCSV(); return false;" class="block px-4 py-2 hover:bg-gray-100">CSV</a></li>
                </ul>
            </div>    
        </div>
        <div class="relative">
            <button id="transport-date-filter-button" class="flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-2">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>กรองตามวันที่</span>
                <svg class="w-2.5 h-2.5 ml-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
            </button>
            <div id="transport-date-filter-dropdown" class="z-20 bg-white divide-y divide-gray-100 rounded-lg shadow w-80 absolute right-0 mt-2 hidden">
                <div class="p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-medium text-gray-900">เลือกช่วงวันที่</h3>
                        <button id="transport-date-filter-clear" class="text-xs text-red-600 hover:text-red-800">ล้างฟิลเตอร์</button>
                    </div>
                    
                    <!-- Quick Date Options -->
                    <div class="grid grid-cols-2 gap-2 mb-4">
                        <button class="date-quick-filter px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-left" data-date-range="today">วันนี้</button>
                        <button class="date-quick-filter px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-left" data-date-range="yesterday">เมื่อวาน</button>
                        <button class="date-quick-filter px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-left" data-date-range="last7days">7 วันที่ผ่านมา</button>
                        <button class="date-quick-filter px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-left" data-date-range="last30days">30 วันที่ผ่านมา</button>
                        <button class="date-quick-filter px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-left" data-date-range="thismonth">เดือนนี้</button>
                        <button class="date-quick-filter px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-left" data-date-range="thisyear">ปีนี้</button>
                    </div>
                    
                    <!-- Custom Date Range -->
                    <div class="border-t pt-4">
                        <label class="block text-xs font-medium text-gray-700 mb-2">กำหนดช่วงวันที่</label>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">วันที่เริ่มต้น</label>
                                <input type="date" id="start-date" class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 mb-1">วันที่สิ้นสุด</label>
                                <input type="date" id="end-date" class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                        </div>
                        <button id="apply-custom-date" class="w-full mt-3 text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 focus:outline-none flex items-center text-center justify-center">ใช้ฟิลเตอร์</button>
                    </div>
                </div>
            </div>
        </div>
        
        <button id="transport-refresh-button" class="p-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200">
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        </button>
        <a href="<?php echo get_home_url(); ?>/create-driver-job/" id="add-carrental-button" class="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 focus:outline-none flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path>
            </svg>
            สร้างการจ่ายงานรถรับส่ง
        </a>
    </div>
</div>

<div class="transport-table-container block w-full overflow-x-auto shadow-md rounded-lg bg-white">
    <table class="transport-table w-full table-auto border-collapse min-w-[1000px] text-sm">
        <thead>
            <tr class="transport-table-head bg-primary text-white sticky top-0 z-10">
                <th class="transport-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[80px]" data-sort="id">
                    Job ID
                    <span class="sort-indicator ml-1"><svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg></span>
                </th>
                <th class="transport-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[120px]" data-sort="customer">
                    Driver
                    <span class="sort-indicator ml-1"><svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg></span>
                </th>
                <th class="transport-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[100px]" data-sort="license_plate">
                    License Plate
                    <span class="sort-indicator ml-1"><svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg></span>
                </th>
                <th class="transport-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[120px]" data-sort="start_date">
                    Start Date
                    <span class="sort-indicator ml-1"><svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg></span>
                </th>
                <th class="transport-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[120px]" data-sort="end_date">
                    End Date
                    <span class="sort-indicator ml-1"><svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg></span>
                </th>
                <th class="transport-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[100px]" data-sort="location">
                    Location
                    <span class="sort-indicator ml-1"><svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg></span>
                </th>
                <th class="transport-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[100px]" data-sort="status">
                    Status
                    <span class="sort-indicator ml-1"><svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg></span>
                </th>
                <th class="transport-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[150px]" data-sort="service_type">
                    Service Details
                    <span class="sort-indicator ml-1"><svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg></span>
                </th>
                <th class="transport-th px-2 py-3 text-center font-medium w-[110px] actions-header">
                    Actions
                </th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td colspan="9" class="text-center py-6">Loading...</td>
            </tr>
        </tbody>
    </table>
</div>

<div id="transport-pagination" class="transport-pagination-container mt-4">
    <!-- Pagination controls will be populated by JavaScript -->
</div>
