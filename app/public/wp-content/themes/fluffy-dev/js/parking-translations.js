/**
 * Parking System Translation Helper
 * Provides client-side translation support for dynamic content
 */

// Translation helper function
function t(key, fallback = '') {
    if (typeof parkingTranslations !== 'undefined' && parkingTranslations[key]) {
        return parkingTranslations[key];
    }
    return fallback || key;
}

// Get current language
function getCurrentLang() {
    if (typeof parkingLang !== 'undefined' && parkingLang.current) {
        return parkingLang.current === 'th' ? 'th' : 'en';
    }
    return 'th'; // default to Thai
}

// Format numbers based on language
function formatNumber(number, lang = null) {
    if (!lang) lang = getCurrentLang();
    
    if (lang === 'th') {
        return number.toLocaleString('th-TH');
    } else {
        return number.toLocaleString('en-US');
    }
}

// Format currency based on language
function formatCurrency(amount, lang = null) {
    if (!lang) lang = getCurrentLang();
    
    if (lang === 'th') {
        return amount.toLocaleString('th-TH') + ' บาท';
    } else {
        return '$' + amount.toLocaleString('en-US');
    }
}

// Date formatting helper
function formatDate(date, lang = null) {
    if (!lang) lang = getCurrentLang();
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    
    if (lang === 'th') {
        return date.toLocaleDateString('th-TH', options);
    } else {
        return date.toLocaleDateString('en-US', options);
    }
}

// Time formatting helper
function formatTime(time, lang = null) {
    if (!lang) lang = getCurrentLang();
    
    const options = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: lang === 'en'
    };
    
    if (typeof time === 'string') {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', options);
    }
    
    return time.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', options);
}

// Update dynamic content based on language
function updateDynamicContent() {
    const lang = document.documentElement.getAttribute('lang');
    console.log('Updating dynamic content for language:', lang);
    // Update button texts
    const searchBtn = document.getElementById('btn-search_all');
    if (searchBtn) {
        if (lang === 'en-US') {
            searchBtn.textContent = 'Select Parking';
        } else {
            searchBtn.textContent = 'เลือกช่องจอด';
        }
    }
    
}

// Initialize translations when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Update any dynamic content that needs translation
    updateDynamicContent();
    
    // Listen for language changes (if implemented)
    document.addEventListener('languageChanged', function(e) {
        updateDynamicContent();
    });
});

// Export functions for use in other scripts
window.ParkingTranslations = {
    t: t,
    getCurrentLang: getCurrentLang,
    formatNumber: formatNumber,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    formatTime: formatTime,
    updateDynamicContent: updateDynamicContent
};
