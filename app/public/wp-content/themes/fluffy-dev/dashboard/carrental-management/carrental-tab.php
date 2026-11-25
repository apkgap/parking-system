<style>
@media (max-width: 767px) {
    .carrental-table td[data-label]::before {
        content: attr(data-label);
        font-weight: bold;
        position: absolute;
        left: 0.75rem; /* px-3 */
        width: 45%;
        padding-right: 10px;
        white-space: nowrap;
        text-align: left;
    }
    .carrental-table td {
        padding-left: 50%;
    }
}
</style>
<div class="head-bar flex items-center px-4 py-3 text-gray-700 border-b border-gray-200 mb-10">
    <h3 class="flex items-center text-2xl">
        <!-- การจัดการการเช่ารถ: Car icon -->
        <svg class="w-7 h-7 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM2 10v5a1 1 0 001 1h1a2 2 0 104 0h4a2 2 0 104 0h1a1 1 0 001-1v-5H2z"></path>
        </svg>
        การจัดการการเช่ารถ
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
            <input type="search" id="carrental-search" class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500" placeholder="Search">
        </div>
    </div>
    
    <div class="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
    <div class="relative">
            <button id="carrental-export-button" class="flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-2">
                Export
                <svg class="w-2.5 h-2.5 ml-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
            </button>
            <div id="carrental-export-dropdown" class="z-15 flex bg-white divide-y divide-gray-100 rounded-lg shadow w-44 absolute max-w-[185px] content-center hidden">
                <ul class="text-sm text-gray-700 w-full">
                    <li><a href="#" onclick="exportCarRentalToExcel(); return false;" class="block px-4 py-2 hover:bg-gray-100">Excel</a></li>
                    <li><a href="#" onclick="exportCarRentalToCSV(); return false;" class="block px-4 py-2 hover:bg-gray-100">CSV</a></li>
                </ul>
            </div>
        </div>
        
        <div class="relative">
            <button id="carrental-filter-button" class="flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-2">
                Data Filter
                <svg class="w-2.5 h-2.5 ml-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
            </button>
            <div id="carrental-filter-dropdown" class="z-15 flex bg-white divide-y divide-gray-100 rounded-lg shadow w-44 absolute max-w-[185px] content-center hidden">
                <ul class="text-sm text-gray-700 w-full">
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: ทั้งหมด</a></li>
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: กำลังเช่า</a></li>
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: เสร็จสิ้น</a></li>
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: ยกเลิก</a></li>
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: รอดำเนินการ</a></li>
                </ul>
            </div>
        </div>
        
        <div class="relative">
            <button id="carrental-date-filter-button" class="flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-2">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>กรองตามวันที่</span>
                <svg class="w-2.5 h-2.5 ml-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
            </button>
            <div id="carrental-date-filter-dropdown" class="z-20 bg-white divide-y divide-gray-100 rounded-lg shadow w-80 absolute right-0 mt-2 hidden">
                <div class="p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-medium text-gray-900">เลือกช่วงวันที่</h3>
                        <button id="carrental-date-filter-clear" class="text-xs text-red-600 hover:text-red-800">ล้างฟิลเตอร์</button>
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
        
        <button id="carrental-refresh-button" class="p-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200">
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        </button>
        
        <a href="#" id="add-carrental-button" class="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 focus:outline-none flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path>
            </svg>
            เพิ่มการเช่ารถ
        </a>
    </div>
</div>

<div class="carrental-table-container w-full overflow-x-auto shadow-md rounded-lg bg-white">
    <table class="carrental-table w-full table-auto border-collapse text-sm">
        <thead>
            <tr class="carrental-table-head bg-primary text-white sticky top-0 z-10 hidden md:table-row">
                <th class="carrental-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[8%]" data-sort="title">
                    รหัสการเช่า
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="carrental-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[12%]" data-sort="customer_name">
                    ชื่อลูกค้า
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="carrental-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[15%]" data-sort="package">
                    แพ็คเกจ
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="carrental-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[12%] hidden md:table-cell" data-sort="arrival_date">
                    วันเดินทาง
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="carrental-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[12%] hidden md:table-cell" data-sort="departure_date">
                    วันกลับ
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="carrental-th px-2 py-3 text-center font-medium w-[13%]">การจัดการ</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td colspan="6" class="text-center py-6">Loading...</td>
            </tr>
        </tbody>
    </table>
</div>

<div id="carrental-pagination" class="carrental-pagination-container mt-4">
    <!-- Pagination controls will be populated by JavaScript -->
</div>
