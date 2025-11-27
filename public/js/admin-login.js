const form = document.getElementById('adminLoginForm');
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

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Admin login form submitted');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
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
    submitBtn.textContent = 'Verifying credentials...';

    try {
        console.log('Sending admin login request to /api/login');

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('Admin login response status:', response.status);

        const data = await response.json();
        console.log('Admin login response data:', data);

        if (response.ok) {
            // Check if user is actually an admin
            const userResponse = await fetch('/api/user');
            const userData = await userResponse.json();

            if (userData.isAdmin) {
                // Store CSRF token in localStorage
                if (data.csrfToken) {
                    localStorage.setItem('csrfToken', data.csrfToken);
                }
                showAlert('Admin login successful! Redirecting to admin panel...', 'success');
                console.log('Admin login successful, redirecting to admin panel');
                setTimeout(() => {
                    window.location.href = '/admin';
                }, 1500);
            } else {
                // User logged in but is not an admin
                showAlert('Access denied. This account does not have administrator privileges.', 'error');
                // Log them out
                await fetch('/api/logout', { method: 'POST' });
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        } else {
            console.error('Admin login failed:', data.error);
            showAlert(data.error || 'Login failed', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showAlert('Cannot connect to server. Please make sure the server is running.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});

// Password visibility toggle
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Toggle eye icon
    togglePassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁' : '👁‍🗨';

    // Update aria-label for accessibility
    togglePassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});
