const form = document.getElementById('changePasswordForm');
const alertBox = document.getElementById('alertBox');

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type) {
    // Validate type to prevent class injection
    const validTypes = ['error', 'success', 'warning', 'info'];
    const safeType = validTypes.includes(type) ? type : 'info';

    // Escape message to prevent XSS
    const safeMessage = escapeHtml(message);

    alertBox.innerHTML = `<div class="alert alert-${safeType}">${safeMessage}</div>`;
    setTimeout(() => {
        alertBox.innerHTML = '';
    }, 5000);
}

// Get CSRF token from localStorage
function getCsrfToken() {
    return localStorage.getItem('csrfToken');
}

// Password requirements validation
const newPasswordInput = document.getElementById('newPassword');
const requirements = {
    length: document.getElementById('req-length'),
    lowercase: document.getElementById('req-lowercase'),
    uppercase: document.getElementById('req-uppercase'),
    number: document.getElementById('req-number')
};

function validatePasswordRequirements(password) {
    // Check each requirement
    const hasLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    // Update UI for each requirement
    updateRequirement(requirements.length, hasLength);
    updateRequirement(requirements.lowercase, hasLowercase);
    updateRequirement(requirements.uppercase, hasUppercase);
    updateRequirement(requirements.number, hasNumber);

    return hasLength && hasLowercase && hasUppercase && hasNumber;
}

function updateRequirement(element, isMet) {
    const icon = element.querySelector('.requirement-icon');
    if (isMet) {
        element.classList.add('met');
        icon.textContent = '✓';
    } else {
        element.classList.remove('met');
        icon.textContent = '✗';
    }
}

// Real-time password validation
newPasswordInput.addEventListener('input', () => {
    validatePasswordRequirements(newPasswordInput.value);
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Validate new password strength
    if (!validatePasswordRequirements(newPassword)) {
        showAlert('New password does not meet requirements', 'error');
        return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match', 'error');
        return;
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
        showAlert('New password must be different from current password', 'error');
        return;
    }

    // Disable button during submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Changing password...';

    try {
        const csrfToken = getCsrfToken();

        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Password changed successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else {
            showAlert(data.error || 'Failed to change password', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    } catch (error) {
        console.error('Change password error:', error);
        showAlert('Cannot connect to server', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});

// Password visibility toggles
const toggleCurrentPassword = document.getElementById('toggleCurrentPassword');
const currentPasswordInput = document.getElementById('currentPassword');

toggleCurrentPassword.addEventListener('click', () => {
    const type = currentPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    currentPasswordInput.setAttribute('type', type);
    toggleCurrentPassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁' : '👁‍🗨';
    toggleCurrentPassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});

const toggleNewPassword = document.getElementById('toggleNewPassword');

toggleNewPassword.addEventListener('click', () => {
    const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    newPasswordInput.setAttribute('type', type);
    toggleNewPassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁' : '👁‍🗨';
    toggleNewPassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});

const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

toggleConfirmPassword.addEventListener('click', () => {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    toggleConfirmPassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁' : '👁‍🗨';
    toggleConfirmPassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});
