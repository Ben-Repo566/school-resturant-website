const form = document.getElementById('resetPasswordForm');
const alertBox = document.getElementById('alertBox');
const emailInput = document.getElementById('email');
const newPasswordInput = document.getElementById('newPassword');

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
    }, 8000);
}

// Get email from session storage
const resetEmail = sessionStorage.getItem('resetEmail');
if (resetEmail) {
    emailInput.value = resetEmail;
} else {
    showAlert('Please start from the forgot password page', 'warning');
    setTimeout(() => {
        window.location.href = '/forgot-password.html';
    }, 2000);
}

// Password requirements validation
const requirements = {
    length: document.getElementById('req-length'),
    lowercase: document.getElementById('req-lowercase'),
    uppercase: document.getElementById('req-uppercase'),
    number: document.getElementById('req-number')
};

function validatePasswordRequirements(password) {
    const hasLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

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

// Password visibility toggles
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
    const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    newPasswordInput.setAttribute('type', type);
    togglePassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁' : '👁‍🗨';
    togglePassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});

const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

toggleConfirmPassword.addEventListener('click', () => {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    toggleConfirmPassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁' : '👁‍🗨';
    toggleConfirmPassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const code = document.getElementById('code').value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate inputs
    if (!email || !code || !newPassword || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        showAlert('Please enter a valid 6-digit code', 'error');
        return;
    }

    if (!validatePasswordRequirements(newPassword)) {
        showAlert('Password does not meet requirements', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    // Disable button during submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting password...';

    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, code, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            // Clear session storage
            sessionStorage.removeItem('resetEmail');

            showAlert('Password reset successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showAlert(data.error || 'Failed to reset password', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showAlert('Cannot connect to server', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});
