jQuery(document).ready(function($) {

    // ใช้ ajaxurl_obj.ajaxurl แทน ajaxurl
    async function checkParkingAvailability(startDate, startTime, endDate, endTime) {
        return $.post(ajaxurl_obj.ajaxurl, {
            action: 'check_parking_availability',
            startDate,
            startTime,
            endDate,
            endTime
        }).then(res => res.data || []);
    }

    // เมื่อผู้ใช้เปลี่ยนวันที่หรือเวลา
    $('#startDate, #startTime, #endDate, #endTime').on('change', async function() {
        const startDate = $('#startDate').val();
        const startTime = $('#startTime').val();
        const endDate = $('#endDate').val();
        const endTime = $('#endTime').val();

        if (startDate && startTime && endDate && endTime) {
            const occupiedSlots = await checkParkingAvailability(startDate, startTime, endDate, endTime);
            // สมมติว่ามีตัวแปร parkingData และฟังก์ชัน renderAll()
            parkingData.forEach(space => {
                if (occupiedSlots.includes(space.parking_id)) {
                    space.status = 'occupied';
                } else {
                    space.status = 'available';
                }
            });
            renderAll();
        }
    });
});