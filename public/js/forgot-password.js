const form = document.getElementById('forgotPasswordForm');
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
    }, 8000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();

    // Validate email
    if (!email) {
        showAlert('Please enter your email address', 'error');
        return;
    }

    if (!email.includes('@')) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    // Disable button during submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            // Store email for next step
            sessionStorage.setItem('resetEmail', email);

            // Show success message with code (development mode)
            if (data.devCode) {
                showAlert(`Reset code sent! For development, your code is: ${data.devCode}`, 'success');
            } else {
                showAlert('If that email exists, a reset code has been sent. Check your email!', 'success');
            }

            // Redirect to reset password page after 3 seconds
            setTimeout(() => {
                window.location.href = '/reset-password.html';
            }, 3000);
        } else {
            showAlert(data.error || 'Failed to send reset code', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showAlert('Cannot connect to server', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});
