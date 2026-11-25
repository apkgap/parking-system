<?php
// Enqueue the driver.js script
wp_enqueue_script('driver-js', get_template_directory_uri() . '/dashboard/driver-management/js/driver.js', array(), '1.0.0', true);
?>

<div class="head-bar flex items-center px-4 py-3 text-gray-700 border-b border-gray-200 mb-10">
    <h3 class="flex items-center text-2xl">
        <!-- การจัดการคนขับ: User Group icon -->
        <svg class="w-7 h-7 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 7a3 3 0 11-6 0 3 3 0 016 0zM2 17a6 6 0 1112 0H2z"></path>
        </svg>
        การจัดการคนขับ
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
            <input type="search" id="driver-search" class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500" placeholder="Search">
        </div>
    </div>
    
    <div class="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
        <div class="relative">
            <button id="driver-export-button" class="flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-2">
                Export
                <svg class="w-2.5 h-2.5 ml-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
            </button>
            <div id="driver-export-dropdown" class="z-15 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 absolute max-w-[185px] content-center">
                <ul class="text-sm text-gray-700 w-full">
                    <li><a href="#" onclick="exportDriversToExcel(); return false;" class="block px-4 py-2 hover:bg-gray-100">Excel</a></li>
                    <li><a href="#" onclick="exportDriversToCSV(); return false;" class="block px-4 py-2 hover:bg-gray-100">CSV</a></li>
                </ul>
            </div>
        </div>
        
        <div class="relative">
            <button id="driver-filter-button" class="flex items-center justify-center text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-2">
                Data Filter
                <svg class="w-2.5 h-2.5 ml-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
            </button>
            <div id="driver-filter-dropdown" class="z-15 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 absolute max-w-[185px] content-center">
                <ul class="text-sm text-gray-700 w-full">
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: ทั้งหมด</a></li>
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: เข้างาน</a></li>
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: ไม่เข้างาน</a></li>
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: ว่าง</a></li>
                    <li><a href="#" class="block px-4 py-2 hover:bg-gray-100">สถานะ: หยุด</a></li>
                </ul>
            </div>
        </div>
        
        <button id="driver-refresh-button" class="p-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200">
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        </button>
        
        <a href="<?php echo admin_url('post-new.php?post_type=taxi-driver'); ?>" id="add-driver-button" class="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 focus:outline-none flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path>
            </svg>
            เพิ่มคนขับ
        </a>
    </div>
</div>

<div class="driver-table-container w-full overflow-x-auto shadow-md rounded-lg bg-white">
    <table class="driver-table w-full table-auto border-collapse min-w-[1000px] text-sm">
        <thead>
            <tr class="driver-table-head bg-primary text-white sticky top-0 z-10">
                <th class="driver-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[8%]" data-sort="id">
                    ID คนขับ
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="driver-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[15%]" data-sort="name">
                    ชื่อ
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="driver-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[12%]" data-sort="phone">
                    เบอร์โทร
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="driver-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[15%]" data-sort="status">
                    สถานะทำงาน
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="driver-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[15%] hidden md:table-cell" data-sort="assigned_car">
                    รถที่ใช้
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="driver-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[10%] hidden md:table-cell" data-sort="job_count">
                    จำนวนงาน
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="driver-th px-2 py-3 text-center font-medium cursor-pointer hover:bg-primary-dark transition-colors sortable w-[10%] hidden md:table-cell" data-sort="completed_jobs">
                    จบงาน
                    <span class="sort-indicator ml-1">
                        <svg class="w-3 h-3 inline-block opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                        </svg>
                    </span>
                </th>
                <th class="driver-th px-2 py-3 text-center font-medium w-[15%]">การจัดการ</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td colspan="8" class="text-center py-6">Loading...</td>
            </tr>
        </tbody>
    </table>
</div>

<div id="driver-pagination" class="driver-pagination-container mt-4">
    <!-- Pagination controls will be populated by JavaScript -->
</div>
