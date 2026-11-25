// Check if ajax_object exists, if not create it
if (typeof ajax_object === 'undefined') {
    window.ajax_object = {
        ajax_url: '/wp-admin/admin-ajax.php'
    };
}

// Notification function
function showNotification(type, title, message) {
    const notificationModal = document.getElementById('notification-modal');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationBtn = document.getElementById('notification-btn');
    const successIcon = document.getElementById('success-icon');
    const errorIcon = document.getElementById('error-icon');

    if (!notificationModal) return;

    notificationTitle.textContent = title;
    notificationMessage.innerHTML = message;

    // Reset icons
    if (successIcon) successIcon.classList.add('hidden');
    if (errorIcon) errorIcon.classList.add('hidden');

    if (type === 'success') {
        if (successIcon) successIcon.classList.remove('hidden');
        notificationTitle.className = 'text-2xl font-bold mb-4 text-green-600';
        notificationBtn.className = 'px-8 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-green-500 hover:bg-green-600';
        notificationBtn.textContent = 'OKAY';
    } else {
        if (errorIcon) errorIcon.classList.remove('hidden');
        notificationTitle.className = 'text-2xl font-bold mb-4 text-red-600';
        notificationBtn.className = 'px-8 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-red-500 hover:bg-red-600';
        notificationBtn.textContent = 'TRY AGAIN';
    }

    // Show modal
    notificationModal.classList.remove('hidden');
}

// DOM Ready
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('forgotPasswordForm');
    if (!form) return;

    const submitBtn = document.getElementById('forgot-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    const notificationModal = document.getElementById('notification-modal');
    const notificationBtn = document.getElementById('notification-btn');

    // Form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Show loading state
        setLoadingState(true);

        // Prepare form data
        const formData = new FormData();
        formData.append('action', 'ajax_forgot_password');
        formData.append('user_email', document.getElementById('user_email').value);
        formData.append('security', ajax_object.nonce || document.querySelector('[name="forgot_nonce"]').value);

        // AJAX request
        fetch(ajax_object.ajax_url, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setLoadingState(false);

                if (data.success) {
                    showNotification('success', 'Success!', data.data.message);
                    // Clear form after successful submission
                    document.getElementById('user_email').value = '';
                } else {
                    showNotification('error', 'Sorry :(', data.data.message);
                }
            })
            .catch(error => {
                setLoadingState(false);
                console.error('Forgot password error:', error);

                // Check if it's a network error
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    showNotification('error', 'Connection Error', 'Please check your internet connection and try again.');
                } else {
                    showNotification('error', 'Sorry :(', 'Something went wrong please try again!!');
                }
            });
    });

    function validateForm() {
        const email = document.getElementById('user_email').value.trim();
        let isValid = true;

        if (!email) {
            showFieldError(document.getElementById('user_email'), 'Email address is required');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showFieldError(document.getElementById('user_email'), 'Please enter a valid email address');
            isValid = false;
        } else {
            hideFieldError(document.getElementById('user_email'));
        }

        return isValid;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function setLoadingState(loading) {
        if (!submitBtn) return;

        submitBtn.disabled = loading;

        if (loading) {
            if (btnText) btnText.classList.add('hidden');
            if (btnLoading) btnLoading.classList.remove('hidden');
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
        } else {
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoading) btnLoading.classList.add('hidden');
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }

    function showFieldError(field, message) {
        field.classList.add('border-red-500');
        field.classList.remove('border-gray-200');

        const errorDiv = document.getElementById(field.name + '_error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('opacity-0', '-translate-y-2');
            errorDiv.classList.add('opacity-100', 'translate-y-0');
        }
    }

    function hideFieldError(field) {
        field.classList.remove('border-red-500');
        field.classList.add('border-gray-200');

        const errorDiv = document.getElementById(field.name + '_error');
        if (errorDiv) {
            errorDiv.classList.add('opacity-0', '-translate-y-2');
            errorDiv.classList.remove('opacity-100', 'translate-y-0');
            errorDiv.textContent = '';
        }
    }

    // Notification modal functionality
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function () {
            notificationModal.classList.add('hidden');
        });
    }

    if (notificationModal) {
        notificationModal.addEventListener('click', function (e) {
            if (e.target === notificationModal) {
                notificationModal.classList.add('hidden');
            }
        });
    }

    // Focus effects for inputs
    const inputs = document.querySelectorAll('input[type="email"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            const icon = this.nextElementSibling;
            if (icon && icon.tagName === 'SVG') {
                icon.classList.remove('text-gray-400');
                icon.classList.add('text-blue-500');
            }
        });

        input.addEventListener('blur', function () {
            const icon = this.nextElementSibling;
            if (icon && icon.tagName === 'SVG' && !this.matches(':focus')) {
                icon.classList.add('text-gray-400');
                icon.classList.remove('text-blue-500');
            }
        });
    });
});
