
                        <!-- Header -->
                        <header class="bg-white shadow-sm border-b px-6 py-4 relative flex-shrink-0">
                            <div class="flex items-center justify-between">
                                <div class="ml-12 md:ml-0">
                                    <h2 class="text-xl md:text-2xl font-bold text-gray-800">
                                        WELCOME <span class="text-blue-500"><?php echo $display_name; ?></span>
                                    </h2>
                                </div>
                                <div class="text-xs md:text-sm text-gray-500 hidden sm:block">
                                    <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                                    </svg>
                                    <?php echo date_i18n('d-m-Y H:i น.'); ?>
                                </div>
                            </div>
                        </header>

                        <!-- Stats Cards -->
                        <div class="p-4 md:p-6 flex-shrink-0">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 min-100 md:min-w-0">
                                <div class="bg-blue-500 text-white p-4 rounded-lg shadow">
                                    <div class="flex items-center">
                                        <svg class="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd"/>
                                            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                                        </svg>
                                        <div>
                                            <p class="text-sm opacity-90">รายการจองทั้งหมด</p>
                                            <p class="text-2xl font-bold"><?php echo $total_parking_booking; ?> การจอง</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-blue-500 text-white p-4 rounded-lg shadow">
                                    <div class="flex items-center">
                                        <svg class="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                        </svg>
                                        <div>
                                            <p class="text-sm opacity-90">ที่จอดรถทั้งหมด</p>
                                            <p class="text-2xl font-bold"><?php echo $total_parking_space; ?> คัน</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-blue-500 text-white p-4 rounded-lg shadow">
                                    <div class="flex items-center">
                                        <svg class="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                                        </svg>
                                        <div>
                                            <p class="text-sm opacity-90">ที่จอดรถว่าง</p>
                                            <p class="text-2xl font-bold"><?php echo $available_parking; ?> คัน</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-blue-500 text-white p-4 rounded-lg shadow">
                                    <div class="flex items-center">
                                        <svg class="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
                                        </svg>
                                        <div>
                                            <p class="text-sm opacity-90">รายงานทั้งหมด</p>
                                            <p class="text-2xl font-bold">8 คัน</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Table Section -->
                            <div class="bg-white rounded-lg shadow overflow-hidden">
                                <div class="p-4 border-b flex-shrink-0">
                                    <div class="flex items-center justify-between wrap-top-table">
                                        <h3 class="text-lg font-semibold text-gray-800 mb-2 lg:mb-0">
                                            <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd"/>
                                                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                                            </svg>
                                            การจองที่จอดรถ
                                        </h3>
                                        <div class="flex items-center space-x-2 sm:space-x-4">
                                            <div class="relative flex-1 sm:flex-none">
                                                <input type="text" id="customSearch" placeholder="Search" class="w-full sm:w-auto pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                                <svg class="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                                                </svg>
                                            </div>
                                            <select id="exportSelect" class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                                <option value="">Export</option>
                                                <option value="excel">Excel</option>
                                                <option value="csv">CSV</option>
                                            </select>
                                            <button id="filterBtn" class="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm whitespace-nowrap">
                                                <span class="hidden sm:inline">Data Filter</span>
                                                <span class="sm:hidden">Filter</span>
                                                <svg class="w-4 h-4 inline ml-1 sm:ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div class="overflow-x-auto flex-1 min-h-0">
                                    <table id="parkingTable" class="w-full min-w-full">
                                        <thead class="bg-blue-500 text-white sticky top-0 z-10">
                                            <tr>
                                                <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm whitespace-nowrap">หมายเลขจอง</th>
                                                <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm whitespace-nowrap">ผู้จอง</th>
                                                <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">ทะเบียนรถ</th>
                                                <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">ประเภท</th>
                                                <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">วันที่จอง</th>
                                                <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">วันที่หมดอายุ</th>
                                                <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">ปริมาณเสียค่าใช้จ่าย</th>
                                                <th class="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm whitespace-nowrap">สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
<?php
$args = array(
    'post_type' => 'parking_booking',
    'posts_per_page' => -1
);
$bookings = get_posts($args);
if ($bookings) {
    $row = 0;
    foreach ($bookings as $booking) {
        $booking_id = $booking->ID;
        $customer_name = get_post_meta($booking_id, 'customer_name', true);
        $car_plate = get_post_meta($booking_id, 'car_plate', true);
        $type = get_post_meta($booking_id, 'type', true);
        $start_date = get_post_meta($booking_id, 'start_date', true);
        $end_date = get_post_meta($booking_id, 'end_date', true);
        $cost = get_post_meta($booking_id, 'cost', true);
        $status = get_post_meta($booking_id, 'status', true);
        $tr_class = ($row % 2 == 0) ? 'even:even' : 'odd:odd';
        echo '<tr class="' . $tr_class . '">';
        echo '<td class="px-2 sm:px-4 py-3 text-xs sm:text-sm">' . esc_html($booking_id) . '</td>';
        echo '<td class="px-2 sm:px-4 py-3 text-xs sm:text-sm">' . esc_html($customer_name) . '</td>';
        echo '<td class="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden sm:table-cell">' . esc_html($car_plate) . '</td>';
        echo '<td class="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden sm:table-cell">' . esc_html($type) . '</td>';
        echo '<td class="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden md:table-cell">' . esc_html($start_date) . '</td>';
        echo '<td class="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden md:table-cell">' . esc_html($end_date) . '</td>';
        echo '<td class="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden lg:table-cell">' . esc_html($cost) . '</td>';
        echo '<td class="px-2 sm:px-4 py-3"><span class="bg-green-100 text-green-800 px-1 sm:px-2 py-1 rounded-full text-xs">' . esc_html($status) . '</span></td>';
        echo '</tr>';
        $row++;
    }
} else {
    echo '<tr><td colspan="8" class="text-center">ไม่พบข้อมูลการจอง</td></tr>';
}
?>
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Pagination -->
                                <div class="px-2 sm:px-4 py-3 border-t bg-gray-50 flex-shrink-0" id="customPagination">
                                    <div class="flex flex-col sm:flex-row items-center justify-between gap-2">
                                        <div class="text-xs sm:text-sm text-gray-700 text-center sm:text-left" id="tableInfo">
                                            <!-- DataTable info will be inserted here -->
                                        </div>
                                        <div class="flex items-center space-x-1 sm:space-x-2" id="tablePagination">
                                            <!-- DataTable pagination will be inserted here -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>