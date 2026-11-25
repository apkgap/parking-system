<!-- Header -->
 <?php
// จำนวนช่องจอด
$total_parking_booking = wp_count_posts('parking_booking')->publish;

// การจอง Private Car
$total_private_car = wp_count_posts('vehicle_type')->publish;

// ช่องจอดที่ว่างอยู่
$total_parking_space = wp_count_posts('parking_space')->publish;
$available_parking = $total_parking_space - $total_parking_booking;
if(is_user_logged_in()){
    $current_user = wp_get_current_user();
    $display_name = $current_user->display_name;
}
?>
    <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold text-gray-900">WELCOME <span class="text-blue-600"><?php echo $display_name; ?></span></h1>
                <div class="text-gray-500 text-sm"><?php echo date_i18n('d-m-Y H:i น.'); ?></div>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <!-- Card 1: จำนวนช่องจอด -->
            <div class="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                <div class="flex items-center">
                    <div class="bg-blue-100 rounded-lg p-3 mr-4">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm">จำนวนช่องจอด</p>
                        <p class="text-2xl font-bold text-gray-900"><?php echo $total_parking_booking; ?></p>
                    </div>
                </div>
                <div class="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">+25%</div>
            </div>

            <!-- Card 2: การจอง Private Car -->
            <div class="bg-orange-50 rounded-lg p-4 flex items-center justify-between">
                <div class="flex items-center">
                    <div class="bg-orange-100 rounded-lg p-3 mr-4">
                        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm">การจอง Private Car</p>
                        <p class="text-2xl font-bold text-gray-900"><?php echo $total_private_car; ?></p>
                    </div>
                </div>
                <div class="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">-45%</div>
            </div>

            <!-- Card 3: ช่องจอดที่ว่างอยู่ -->
            <div class="bg-green-50 rounded-lg p-4 flex items-center justify-between">
                <div class="flex items-center">
                    <div class="bg-green-100 rounded-lg p-3 mr-4">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm">ช่องจอดที่ว่างอยู่</p>
                        <p class="text-2xl font-bold text-gray-900"><?php echo $available_parking; ?></p>
                    </div>
                </div>
                <div class="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">+375%</div>
            </div>

            <!-- Card 4: รายได้ -->
            <div class="bg-purple-50 rounded-lg p-4 flex items-center justify-between">
                <div class="flex items-center">
                    <div class="bg-purple-100 rounded-lg p-3 mr-4">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm">รายได้</p>
                        <p class="text-2xl font-bold text-gray-900">12,500 ฿</p>
                    </div>
                </div>
                <div class="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">+175%</div>
            </div>
        </div>


        <!-- Today's Parking Bookings Report -->
        <div class="bg-white rounded-lg shadow mb-8">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900 flex items-center">
                    <span class="mr-2">📋</span>
                    รายการจองที่จอดรถวันนี้
                </h2>
                <button id="reload-today-bookings" class="text-gray-400 hover:text-gray-600 focus:outline-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full table-auto border-collapse text-sm text-left text-gray-600">
                    <thead class="bg-primary text-white text-xs uppercase">
                        <tr class="bg-primary text-white z-10">
                            <th scope="col" class="px-4 py-3 text-left text-sm">รหัสการจอง</th>
                            <th scope="col" class="px-4 py-3 text-left text-sm">ชื่อลูกค้า</th>
                            <th scope="col" class="px-4 py-3 text-left text-sm">สถานที่</th>
                            <th scope="col" class="px-4 py-3 text-left text-sm">วันเริ่มต้น</th>
                            <th scope="col" class="px-4 py-3 text-left text-sm">วันสิ้นสุด</th>
                            <th scope="col" class="px-4 py-3 text-center text-sm">สถานะ</th>
                            <th scope="col" class="px-4 py-3 text-center text-sm">บริการเสริม</th>
                            <th scope="col" class="px-4 py-3 text-center text-sm">การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="today-bookings-tbody">
                        <!-- Rows will be populated by JavaScript -->
                    </tbody>
                </table>
            </div>
            <div id="today-pagination-container" class="px-6 py-4 border-t border-gray-200"></div>
        </div>


        <!-- Monthly Booking Report -->
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-gray-900">
                                                <span class="text-red-500">📋</span> รายการจองที่จอดรถประจำเดือน
                    </h2>
                    <button id="reload-monthly-bookings" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" class="px-4 py-3 text-left text-sm">รหัสการจอง</th>
                            <th scope="col" class="px-4 py-3 text-left text-sm">ชื่อลูกค้า</th>
                            <th scope="col" class="px-4 py-3 text-left text-sm">สถานที่</th>
                            <th scope="col" class="px-4 py-3 text-left text-sm">วันเริ่มต้น</th>
                            <th scope="col" class="px-4 py-3 text-left text-sm">วันสิ้นสุด</th>
                            <th scope="col" class="px-4 py-3 text-center text-sm">สถานะ</th>
                            <th scope="col" class="px-4 py-3 text-center text-sm">บริการเสริม</th>
                            <th scope="col" class="px-4 py-3 text-center text-sm">การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="monthly-bookings-tbody">
                        <!-- Rows will be populated by JavaScript -->
                    </tbody>
                </table>
            </div>
            <div id="monthly-pagination-container" class="px-6 py-4 border-t border-gray-200"></div>
        </div>
        <!-- End of Monthly Booking Report -->
    </div>
