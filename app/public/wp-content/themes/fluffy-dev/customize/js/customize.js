jQuery(document).ready(function($) {

    // Detect language from HTML lang attribute
    function getCurrentLanguage() {
        const htmlLang = document.documentElement.lang || '';
        // Check if Thai language (th, th-TH, etc.)
        return (htmlLang.startsWith('th')) ? 'th' : 'en';
    }
    
    const currentLang = getCurrentLanguage();

    const buttons = document.querySelectorAll('.booking-button');
    const loadingBlock = document.querySelector('#box-loading');
    const baseUrl = window.location.origin; // e.g., https://parking-system.local

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetUrl = btn.getAttribute('data-url'); // Get data-url (carPark or carRent)
            loadingBlock.style.display = 'flex';
            setTimeout(() => {
                window.location.href = `${baseUrl}/${targetUrl}`; // Redirect to baseUrl + data-url
            }, 1500);
        });
    });

    buttons.forEach(button => {
        let currentAnimation = null; // To store the active animation

        button.addEventListener('mouseenter', () => {
            // If there's an ongoing animation, finish it to its end state
            if (currentAnimation) {
                currentAnimation.finish();
            }

            // Define the animation keyframes
            const keyframes = [
                { transform: 'scale(1) translateY(0)', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)' }, // Start
                { transform: 'scale(1.03) translateY(-3px)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)' } // End
            ];

            // Define animation options
            const options = {
                duration: 200, // milliseconds
                easing: 'ease-out',
                fill: 'forwards' // Keep the end state after animation
            };

            // Play the animation
            currentAnimation = button.animate(keyframes, options);
        });

        button.addEventListener('mouseleave', () => {
            // If there's an ongoing animation, finish it to its start state
            if (currentAnimation) {
                currentAnimation.finish(); // Ensure it completes to its end hover state first
            }

            // Define the animation keyframes for returning
            const keyframes = [
                { transform: 'scale(1.03) translateY(-3px)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)' }, // Start from hover state
                { transform: 'scale(1) translateY(0)', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)' } // Return to original
            ];

            // Define animation options
            const options = {
                duration: 200, // milliseconds
                easing: 'ease-in',
                fill: 'forwards' // Keep the end state after animation
            };

            // Play the animation
            currentAnimation = button.animate(keyframes, options);
        });
    });


    function decodeEntities(str) {
        if (!str) return '';
        const txt = document.createElement('textarea');
        txt.innerHTML = str;
        return txt.value;
    }
    
    const populateCarTypes = async (selectId, apiUrl, text) => {
        const selectElement = document.getElementById(selectId);
        const defaultText = text || (currentLang === 'th' ? 'เลือกประเภท' : 'Select type');
    
        if (!selectElement) {
            return;
        }
    
        const loadingText = currentLang === 'th' ? 'กำลังโหลด...' : 'Loading...';
        selectElement.innerHTML = `<option value="">${loadingText}</option>`;
        selectElement.disabled = true;
    
        try {
            const response = await fetch(apiUrl);
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
    
            if (!data || data.length === 0) {
                const noDataText = currentLang === 'th' ? 'ไม่มีข้อมูล' : 'No data available';
                selectElement.innerHTML = `<option value="">${defaultText}</option><option value="" disabled>${noDataText}</option>`;
                selectElement.disabled = false;
                return;
            }
    
            data.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    
            selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    
            data.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = decodeEntities(vehicle.title).replace('->', '→');
                selectElement.appendChild(option);
            });
    
            selectElement.disabled = false;
    
        } catch (error) {
            console.error(`Failed to load data for ${selectId} from ${apiUrl}:`, error);
            const errorText = currentLang === 'th' ? 'ไม่สามารถโหลดข้อมูลได้' : 'Could not load data';
            selectElement.innerHTML = `<option value="">${errorText}</option>`;
            selectElement.disabled = true;
        }
    };

    // Example usage when the DOM is fully loaded
        const currentOrigin = window.location.origin;
        const selectLocationText = currentLang === 'th' ? 'เลือกสถานที่' : 'Select location';
        populateCarTypes('carType1', `${currentOrigin}/wp-json/custom/v1/vehicle_type?lang=${currentLang}`);
        populateCarTypes('departHuaHin', `${currentOrigin}/wp-json/carrent/car-locations?lang=${currentLang}`, selectLocationText);
        populateCarTypes('departStart', `${currentOrigin}/wp-json/carrent/car-locations?lang=${currentLang}`, selectLocationText);
        populateCarTypes('returnStart', `${currentOrigin}/wp-json/carrent/car-locations?lang=${currentLang}`, selectLocationText);
        populateCarTypes('returnHuaHin', `${currentOrigin}/wp-json/carrent/car-locations?lang=${currentLang}`, selectLocationText);
        populateCarTypes('location1', `${currentOrigin}/wp-json/custom/v1/taxonomy_terms/location?lang=${currentLang}`, selectLocationText);

    // Global safety: hide loading overlay when any AJAX completes/errors/stops
    if (window.jQuery) {
        (function($) {
            $(document).on('ajaxComplete ajaxError ajaxStop', function() {
                setTimeout(function() {
                    $('#box-loading, .box-loading').css('display', 'none');
                }, 100);
            });
        })(window.jQuery);
    }

});

document.addEventListener('DOMContentLoaded', function() {
    // Hide both sections at first
    const sendingElem = document.querySelector('.info-sending_airport');
    const parkingElem = document.querySelector('.info-parking_car');
    if (sendingElem) sendingElem.classList.add('hidden');
    if (parkingElem) parkingElem.classList.add('hidden');

    function updateAddonInfo() {
        const pickup = document.getElementById('service_pickup')?.checked;
        const valet = document.getElementById('service_valet')?.checked;
        const sending = document.querySelector('.info-sending_airport');
        const parking = document.querySelector('.info-parking_car');
        // Hide all first
        if (sending) sending.classList.add('hidden');
        if (parking) parking.classList.add('hidden');
        // Show only the selected one
        if (pickup && sending) {
            sending.classList.remove('hidden');
        }
        if (valet && parking) {
            parking.classList.remove('hidden');
        }
    }

    const pickupElem = document.getElementById('service_pickup');
    const valetElem = document.getElementById('service_valet');
    if (pickupElem) pickupElem.addEventListener('change', updateAddonInfo);
    if (valetElem) valetElem.addEventListener('change', updateAddonInfo);

    // Initial state
    updateAddonInfo();
});
