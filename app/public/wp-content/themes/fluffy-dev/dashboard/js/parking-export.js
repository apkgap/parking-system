// // Export to Excel function for parking data
// window.exportParkingToExcel = async function() {
//     try {
//         // Get current search and filter parameters from parking.js
//         const searchQuery = window.currentSearchQuery || '';
//         const statusFilter = window.currentStatusFilter || '';
//         const sortBy = window.currentSortBy || '';
//         const sortOrder = window.currentSortOrder || 'asc';
        
//         // If global variables are not available, try to get them from the parking.js fetchBookings function
//         if (!window.currentSearchQuery && !window.currentStatusFilter) {
//             // Use the same parameters as currently displayed in the table
//             // These would have been set when fetchBookings was last called
//         }
        
//         // Get all table data (including filtered results)
//         const headers = [];
//         const rows = [];
        
//         // Get headers from current table
//         document.querySelectorAll('.parking-table thead th').forEach(th => {
//             headers.push(th.textContent.trim().replace(/\s+/g, ' '));
//         });
        
//         // Add headers to rows
//         rows.push(headers);
        
//         // Get current data - use the same data that's being displayed
//         const response = await fetch(`/wp-json/parking/v1/bookings?per_page=9999&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusFilter)}&sort=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(sortOrder)}`);
//         const data = await response.json();
        
//         // Debug log to check what data we're getting
//         console.log('Excel export data received:', data);
        
//         // Check if data is in the expected format
//         if (data && data.data && data.data.length > 0) {
//             // Use data.data if the API returns in that format (like in parking.js)
//             data.data.forEach(booking => {
//                 const rowData = [
//                     booking.order_code || '',
//                     booking.fullname_park || '',
//                     (booking.location_park && booking.location_park.name) || booking.location_park || '',
//                     booking.start_date || '',
//                     booking.end_date || '',
//                     booking.tracking_check_status || '',
//                     (booking.addon_information && (booking.addon_information.service_pickup || booking.addon_information.service_valet)) ? 'Yes' : 'No' || '',
//                     '' // actions column (usually not exported)
//                 ];
//                 rows.push(rowData);
//             });
//         } else if (data.bookings && data.bookings.length > 0) {
//             // Fallback to original format
//             data.bookings.forEach(booking => {
//                 const rowData = [
//                     booking.order_code || '',
//                     booking.fullname_park || '',
//                     (booking.location_park && booking.location_park.name) || booking.location_park || '',
//                     booking.start_date || '',
//                     booking.end_date || '',
//                     booking.tracking_check_status || '',
//                     (booking.addon_information && (booking.addon_information.service_pickup || booking.addon_information.service_valet)) ? 'Yes' : 'No' || '',
//                     '' // actions column
//                 ];
//                 rows.push(rowData);
//             });
//         }
        
//         // Create workbook
//         const ws = XLSX.utils.aoa_to_sheet(rows);
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, "การจองที่จอดรถ");
        
//         // Generate filename with current date
//         const now = new Date();
//         const dateStr = now.toISOString().split('T')[0];
        
//         // Download file
//         XLSX.writeFile(wb, `parking_bookings_${dateStr}.xlsx`);
        
//         console.log('Excel export completed successfully');
//     } catch (error) {
//         console.error('Error exporting to Excel:', error);
//         alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
//     }
// };

// // Export to CSV function for parking data
// window.exportParkingToCSV = async function() {
//     try {
//         // Get current search and filter parameters from parking.js
//         const searchQuery = window.currentSearchQuery || '';
//         const statusFilter = window.currentStatusFilter || '';
//         const sortBy = window.currentSortBy || '';
//         const sortOrder = window.currentSortOrder || 'asc';
        
//         // If global variables are not available, try to get them from the parking.js fetchBookings function
//         if (!window.currentSearchQuery && !window.currentStatusFilter) {
//             // Use the same parameters as currently displayed in the table
//         }
        
//         const now = new Date();
//         const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format

//         // Get all table data (including filtered results)
//         const headers = [];
//         const rows = [];
        
//         // Get headers from current table
//         document.querySelectorAll('.parking-table thead th').forEach(th => {
//             headers.push(th.textContent.trim().replace(/\s+/g, ' '));
//         });
        
//         // Add headers to rows
//         rows.push(headers);
        
//         // Get current data - use the same data that's being displayed
//         const response = await fetch(`/wp-json/parking/v1/bookings?per_page=9999&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusFilter)}&sort=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(sortOrder)}`);
//         const data = await response.json();
        
//         // Debug log to check what data we're getting
//         console.log('CSV export data received:', data);
        
//         // Check if data is in the expected format
//         if (data && data.data && data.data.length > 0) {
//             // Use data.data if the API returns in that format (like in parking.js)
//             data.data.forEach(booking => {
//                 const rowData = [
//                     booking.order_code || '',
//                     booking.fullname_park || '',
//                     (booking.location_park && booking.location_park.name) || booking.location_park || '',
//                     booking.start_date || '',
//                     booking.end_date || '',
//                     booking.tracking_check_status || '',
//                     (booking.addon_information && (booking.addon_information.service_pickup || booking.addon_information.service_valet)) ? 'Yes' : 'No' || '',
//                     '' // actions column (usually not exported)
//                 ];
//                 rows.push(rowData);
//             });
//         } else if (data.bookings && data.bookings.length > 0) {
//             // Fallback to original format
//             data.bookings.forEach(booking => {
//                 const rowData = [
//                     booking.order_code || '',
//                     booking.fullname_park || '',
//                     (booking.location_park && booking.location_park.name) || booking.location_park || '',
//                     booking.start_date || '',
//                     booking.end_date || '',
//                     booking.tracking_check_status || '',
//                     (booking.addon_information && (booking.addon_information.service_pickup || booking.addon_information.service_valet)) ? 'Yes' : 'No' || '',
//                     '' // actions column
//                 ];
//                 rows.push(rowData);
//             });
//         }
        
//         // Create workbook and export as CSV
//         const ws = XLSX.utils.aoa_to_sheet(rows);
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, "การจองที่จอดรถ");
        
//         // Download CSV file
//         XLSX.writeFile(wb, `parking_reservations_${dateStr}.csv`, {bookType: 'csv'});
        
//         console.log('CSV export completed successfully');
//     } catch (error) {
//         console.error('Error exporting to CSV:', error);
//         alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV');
//     }
// };
