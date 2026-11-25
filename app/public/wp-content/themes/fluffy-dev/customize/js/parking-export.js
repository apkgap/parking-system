// Export to Excel function for parking data
window.exportParkingToExcel = async function() {
    try {
        // Get headers from parking-tab table
        const headers = [];
        const rows = [];
        
        // Get headers from current table
        document.querySelectorAll('.parkingTable thead th').forEach(th => {
            const text = th.textContent.trim().replace(/\s+/g, ' ');
            if (text && text !== '') {
                headers.push(text);
            }
        });
        
        // Add headers to rows
        rows.push(headers);
        
        // Get data from current table (respects current filter/search)
        const tableRows = document.querySelectorAll('.parkingTable tbody tr');
        tableRows.forEach(row => {
            const rowData = [];
            row.querySelectorAll('td').forEach(cell => {
                rowData.push(cell.textContent.trim());
            });
            if (rowData.length > 0) {
                rows.push(rowData);
            }
        });
        
        // Create workbook
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "การจองที่จอดรถ");
        
        // Download file
        XLSX.writeFile(wb, "parking_reservations.xlsx");
        
        console.log('Excel export completed successfully');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
    }
};

// Export to CSV function for parking data
window.exportParkingToCSV = async function() {
    try {
        // Get headers from parking-tab table
        const headers = [];
        const rows = [];
        
        // Get headers from current table
        document.querySelectorAll('.parkingTable thead th').forEach(th => {
            const text = th.textContent.trim().replace(/\s+/g, ' ');
            if (text && text !== '') {
                headers.push(text);
            }
        });
        
        // Add headers to rows
        rows.push(headers);
        
        // Get data from current table (respects current filter/search)
        const tableRows = document.querySelectorAll('.parkingTable tbody tr');
        tableRows.forEach(row => {
            const rowData = [];
            row.querySelectorAll('td').forEach(cell => {
                rowData.push(cell.textContent.trim());
            });
            if (rowData.length > 0) {
                rows.push(rowData);
            }
        });
        
        // Create workbook and export as CSV
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "การจองที่จอดรถ");
        
        // Download CSV file
        XLSX.writeFile(wb, "parking_reservations.csv", {bookType: 'csv'});
        
        console.log('CSV export completed successfully');
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV');
    }
};
