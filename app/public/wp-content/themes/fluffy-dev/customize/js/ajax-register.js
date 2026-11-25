jQuery(document).ready(function($) {
    // Check if ajax_object exists, if not create it
    if (typeof ajax_object === 'undefined') {
        window.ajax_object = {
            ajax_url: '/wp-admin/admin-ajax.php'
        };
    }

    const form = document.getElementById('registerForm');
    if (!form) return; // Exit if form doesn't exist

    const submitBtn = document.getElementById('register-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const strengthBar = document.getElementById('strength-bar');
    const termsCheckbox = document.getElementById('terms');
    
    // Notification elements
    const notificationModal = document.getElementById('notification-modal');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationBtn = document.getElementById('notification-btn');
    const successIcon = document.getElementById('success-icon');
    const errorIcon = document.getElementById('error-icon');

    // Password visibility toggle
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const eyeOpen = document.getElementById('eye-open');
            const eyeClosed = document.getElementById('eye-closed');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeOpen.classList.add('hidden');
                eyeClosed.classList.remove('hidden');
            } else {
                passwordInput.type = 'password';
                eyeOpen.classList.remove('hidden');
                eyeClosed.classList.add('hidden');
            }
        });
    }
    
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            const eyeOpenConfirm = document.getElementById('eye-open-confirm');
            const eyeClosedConfirm = document.getElementById('eye-closed-confirm');
            
            if (confirmPasswordInput.type === 'password') {
                confirmPasswordInput.type = 'text';
                eyeOpenConfirm.classList.add('hidden');
                eyeClosedConfirm.classList.remove('hidden');
            } else {
                confirmPasswordInput.type = 'password';
                eyeOpenConfirm.classList.remove('hidden');
                eyeClosedConfirm.classList.add('hidden');
            }
        });
    }

    // Custom checkbox styling
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', function() {
            const checkmark = this.nextElementSibling.querySelector('svg');
            const box = this.nextElementSibling;
            
            if (this.checked) {
                box.classList.add('bg-blue-500', 'border-blue-500');
                box.classList.remove('bg-white', 'border-gray-200');
                checkmark.classList.add('opacity-100');
                checkmark.classList.remove('opacity-0');
            } else {
                box.classList.add('bg-white', 'border-gray-200');
                box.classList.remove('bg-blue-500', 'border-blue-500');
                checkmark.classList.add('opacity-0');
                checkmark.classList.remove('opacity-100');
            }
        });
    }

    // Real-time validation
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });

        // Focus effects
        input.addEventListener('focus', function() {
            const icon = this.nextElementSibling;
            if (icon && icon.tagName === 'SVG') {
                icon.classList.remove('text-gray-400');
                icon.classList.add('text-blue-500');
            }
        });

        input.addEventListener('blur', function() {
            const icon = this.nextElementSibling;
            if (icon && icon.tagName === 'SVG' && !this.matches(':focus')) {
                icon.classList.add('text-gray-400');
                icon.classList.remove('text-blue-500');
            }
        });
    });

    // Password strength checker
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            updateStrengthBar(strength);
        });
    }

    // Confirm password validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (this.value !== passwordInput.value) {
                showError(this, 'Passwords do not match');
            } else {
                hideError(this);
            }
        });
    }

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        // Show loading state
        setLoadingState(true);

        // Prepare form data
        const formData = new FormData(form);
        
        // AJAX request
        fetch(ajax_object.ajax_url, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            setLoadingState(false);
            
            if (data.success) {
                showNotification('success', 'Success!', data.data.message);
            } else {
                showNotification('error', 'Sorry :(', data.data.message);
            }
        })
        .catch(error => {
            setLoadingState(false);
            showNotification('error', 'Sorry :(', 'Something went wrong please try again!!');
            console.error('Registration error:', error);
        });
    });

    function validateForm() {
        const requiredFields = form.querySelectorAll('input[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                hideFieldError(field);
            }
        });

        // Password confirmation check
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (password !== confirmPassword) {
            showFieldError(document.getElementById('confirm_password'), 'Passwords do not match');
            isValid = false;
        }

        // Terms checkbox
        if (termsCheckbox && !termsCheckbox.checked) {
            alert('Please agree to the Terms of Service and Privacy Policy');
            isValid = false;
        }

        return isValid;
    }

    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;

        hideError(field);

        if (!value) {
            showError(field, 'This field is required');
            return false;
        }

        switch (fieldName) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    showError(field, 'Please enter a valid email address');
                    isValid = false;
                }
                break;

            case 'username':
                if (value.length < 3) {
                    showError(field, 'Username must be at least 3 characters');
                    isValid = false;
                } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    showError(field, 'Username can only contain letters, numbers, and underscores');
                    isValid = false;
                }
                break;

            case 'password':
                if (value.length < 8) {
                    showError(field, 'Password must be at least 8 characters');
                    isValid = false;
                }
                break;

            case 'first_name':
            case 'last_name':
                if (value.length < 2) {
                    showError(field, 'Name must be at least 2 characters');
                    isValid = false;
                }
                break;

            case 'phone':
                const phoneRegex = /^[0-9+\-\s()]+$/;
                if (!phoneRegex.test(value)) {
                    showError(field, 'Please enter a valid phone number');
                    isValid = false;
                } else if (value.length < 10) {
                    showError(field, 'Phone number must be at least 10 digits');
                    isValid = false;
                }
                break;
        }

        return isValid;
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

    function showNotification(type, title, message) {
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
        
        // Add animation
        setTimeout(() => {
            const content = notificationModal.querySelector('#notification-content');
            if (content) content.classList.add('animate-slide-in');
        }, 10);
    }

    function hideNotification() {
        if (!notificationModal) return;
        
        notificationModal.classList.add('hidden');
        
        // If success, redirect or reset form
        if (notificationTitle && notificationTitle.textContent === 'Success!') {
            // Redirect to home or dashboard
            window.location.href = '/';
        }
    }

    function showError(field, message) {
        field.classList.add('error', 'border-red-500');
        field.classList.remove('border-gray-200');
        
        const errorDiv = document.getElementById(field.name + '_error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('opacity-100', 'translate-y-0');
            errorDiv.classList.remove('opacity-0', '-translate-y-2');
        }
    }

    function hideError(field) {
        field.classList.remove('error', 'border-red-500');
        field.classList.add('border-gray-200');
        
        const errorDiv = document.getElementById(field.name + '_error');
        if (errorDiv) {
            errorDiv.classList.add('opacity-0', '-translate-y-2');
            errorDiv.classList.remove('opacity-100', 'translate-y-0');
            errorDiv.textContent = '';
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

    function calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        return Math.min(score, 4);
    }

    function updateStrengthBar(strength) {
        if (!strengthBar) return;
        
        strengthBar.className = 'h-full transition-all duration-300 rounded-full';
        
        switch (strength) {
            case 1:
                strengthBar.style.width = '25%';
                strengthBar.style.backgroundColor = '#ef4444'; // Red
                break;
            case 2:
                strengthBar.style.width = '50%';
                strengthBar.style.backgroundColor = '#f97316'; // Orange
                break;
            case 3:
                strengthBar.style.width = '75%';
                strengthBar.style.backgroundColor = '#eab308'; // Yellow
                break;
            case 4:
                strengthBar.style.width = '100%';
                strengthBar.style.backgroundColor = '#22c55e'; // Green
                break;
            default:
                strengthBar.style.width = '0%';
                strengthBar.style.backgroundColor = 'transparent';
        }
    }

    // Close notification when clicking button or outside modal
    if (notificationBtn) {
        notificationBtn.addEventListener('click', hideNotification);
    }
    
    if (notificationModal) {
        notificationModal.addEventListener('click', function(e) {
            if (e.target === notificationModal) {
                hideNotification();
            }
        });
    }

    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && notificationModal && !notificationModal.classList.contains('hidden')) {
            hideNotification();
        }
    });
});
