let tabienData = [];
let currentTabienInputId = null;

// Language helpers
function getCurrentLanguage() {
    const htmlLang = document.documentElement.lang || '';
    return (htmlLang && htmlLang.toLowerCase().startsWith('th')) ? 'th' : 'en';
}

function getText(thText, enText) {
    return getCurrentLanguage() === 'th' ? thText : enText;
}

async function checkLoginStatus() {
    let isLoggedIn = false;
    
    if (typeof wpApiSettings !== 'undefined' && wpApiSettings.userId && wpApiSettings.userId > 0) {
        isLoggedIn = true;
    }
    
    if (!isLoggedIn) {
        const bodyClasses = document.body.className;
        isLoggedIn = bodyClasses.includes('logged-in') || bodyClasses.includes('admin-bar');
    }
    
    if (!isLoggedIn) {
        const adminBar = document.getElementById('wpadminbar');
        isLoggedIn = adminBar !== null;
    }
    
    if (isLoggedIn) {
        document.querySelectorAll('.tabien-select-btn').forEach(btn => {
            btn.style.display = 'inline-block';
        });
        await loadUserTabienRod();
    } else {
        document.querySelectorAll('.tabien-select-btn').forEach(btn => {
            btn.style.display = 'none';
        });
    }
}

async function loadUserTabienRod() {
    try {
        const userId = (typeof wpApiSettings !== 'undefined' && wpApiSettings.userId) ? wpApiSettings.userId : 0;
        const response = await fetch(`/wp-json/custom/v1/tabien_rod?per_page=50&user_id=${userId}`, {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            tabienData = data.items || [];
        }
    } catch (error) {
        // Error handling for production
    }
}

async function openTabienPopup(inputId) {
    const clickedButton = document.activeElement;
    currentTabienInputId = inputId;
    
    if (clickedButton && clickedButton.classList.contains('tabien-select-btn') && clickedButton.dataset.rowIndex) {
        const parentWrapper = clickedButton.closest('.input-wrapper');
        if (parentWrapper) {
            const specificInput = parentWrapper.querySelector(`#${inputId}`);
            if (specificInput) {
                window.currentTabienInputElement = specificInput;
            }
        }
    }
    
    // Create popup if doesn't exist
    let popup = document.getElementById('tabien-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'tabien-popup';
        popup.className = 'fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-40 z-999';
        popup.innerHTML = `
            <div class="blur" onclick="closeTabienPopup()"></div>
            <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative" onclick="event.stopPropagation()">
                <button type="button" onclick="closeTabienPopup()" class="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="text-center mb-6">
                    <h3 class="text-xl font-semibold text-gray-800" id="tabien-popup-title">${getText('เลือกทะเบียนรถที่ลงทะเบียนไว้', 'Select Registered Vehicle')}</h3>
                    <p class="text-sm text-gray-600 mt-2" id="tabien-popup-desc">${getText('เลือกจากรายการทะเบียนรถที่คุณเคยลงทะเบียนไว้', 'Select from your registered vehicles')}</p>
                </div>
                <div id="tabien-list" class="overflow-x-auto shadow-md rounded-lg">
                </div>
                <div class="mt-4 text-center">
                    <button onclick="closeTabienPopup()" class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600" id="tabien-close-btn">
                        ${getText('ปิด', 'Close')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    }
    
    // Update text based on language
    if (typeof parkingTranslations !== 'undefined') {
        const titleEl = document.getElementById('tabien-popup-title');
        const descEl = document.getElementById('tabien-popup-desc');
        const closeBtn = document.getElementById('tabien-close-btn');
        
        if (titleEl) titleEl.textContent = parkingTranslations.select_registered_vehicle || 'เลือกทะเบียนรถที่ลงทะเบียนไว้';
        if (descEl) descEl.textContent = parkingTranslations.select_from_registered || 'เลือกจากรายการทะเบียนรถที่คุณเคยลงทะเบียนไว้';
        if (closeBtn) closeBtn.textContent = parkingTranslations.close || 'ปิด';
    }
    
    await populateTabienList();
    popup.classList.remove('hidden');
}

function closeTabienPopup() {
    const popup = document.getElementById('tabien-popup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

async function populateTabienList() {
    const listContainer = document.getElementById('tabien-list');
    
    if (!tabienData || tabienData.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-500">${getText('ไม่พบทะเบียนรถที่เคยลงทะเบียน', 'No registered vehicles found')}</p>`;
        return;
    }
    
    const targetInputForThisPopup = currentTabienInputId;
    listContainer.innerHTML = '';
    
    tabienData.forEach(item => {
        const licensePlate = item.tabienrod_number || item.license_plate || item.title;
        if (!licensePlate) return;
        
        const tabienCard = document.createElement('div');
        tabienCard.className = 'bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]';
        
        tabienCard.setAttribute('data-license-plate', licensePlate);
        tabienCard.setAttribute('data-target-input', targetInputForThisPopup);
        
        if (item.province) {
            tabienCard.setAttribute('data-province', item.province);
        }
        
        tabienCard.addEventListener('click', function() {
            selectTabien(licensePlate, targetInputForThisPopup);
        });
        
        // Compact grid card layout for better space usage
        tabienCard.innerHTML = `
            <div class="p-3">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                        ${licensePlate.charAt(0) || '🚗'}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-gray-900 text-sm truncate">${licensePlate}</div>
                        <div class="text-xs text-gray-600 truncate">${item.province || getText('ไม่ระบุ', 'Not specified')}</div>
                    </div>
                    <div class="flex-shrink-0">
                        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                </div>
                <button type="button" 
                        class="mt-2 w-full bg-primary hover:bg-primary text-white text-xs font-medium py-1.5 px-2 rounded transition-colors duration-200 cursor-pointer">
                    ${getText('เลือก', 'Select')}
                </button>
            </div>
        `;
        
        listContainer.appendChild(tabienCard);
    });
    
    // Set up responsive grid with scroll
    listContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto p-2';
}

function selectTabien(licensePlate, targetInputId) {
    if (window.currentTabienInputElement) {
        window.currentTabienInputElement.value = licensePlate;
        window.currentTabienInputElement.dispatchEvent(new Event('input', { bubbles: true }));
        window.currentTabienInputElement.dispatchEvent(new Event('change', { bubbles: true }));
        window.currentTabienInputElement = null;
    } else {
        const inputId = targetInputId || currentTabienInputId;
        if (inputId) {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = licensePlate;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
    closeTabienPopup();
}

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    window.checkTabienLogin = checkLoginStatus;
});
